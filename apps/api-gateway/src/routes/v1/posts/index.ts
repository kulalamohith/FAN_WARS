/**
 * WARZONE — Posts Routes (/v1/posts)
 * Instagram-style social feed for fan opinions, hype posts, and debates.
 * Reactions: ☢️ TOXIC, 🤡 CLOWN, 🔥 FIRE, 😂 LAUGH
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { awardPoints, POINT_VALUES } from '../../../lib/points';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';

const REACTION_TYPES = ['FIRE', 'CLOWN', 'TOXIC', 'LAUGH'] as const;
const POST_TYPES = ['OPINION', 'HYPE', 'DEBATE'] as const;

export const postsRoutes: FastifyPluginAsync = async (fastify) => {

  // ─── GET Feed ───
  fastify.get(
    '/feed',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const querySchema = z.object({
        sort: z.enum(['hot', 'new']).default('new'),
        type: z.enum(POST_TYPES).optional(),
        cursor: z.string().optional(),
        mine: z.enum(['true', 'false']).optional(),
        limit: z.coerce.number().min(1).max(50).default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) return reply.badRequest('Invalid query parameters');

      const { sort, type, cursor, limit, mine } = parsed.data;
      const userId = request.user.id;

      const where: any = { deletedAt: null };
      if (type) where.type = type;
      if (cursor) where.createdAt = { lt: new Date(cursor) };
      if (mine === 'true') where.userId = userId;

      const orderBy = sort === 'hot'
        ? [{ fireCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

      const posts = await db.post.findMany({
        where,
        orderBy,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              rank: true,
              army: { select: { id: true, name: true, colorHex: true } },
            },
          },
          reactions: {
            where: { userId },
            select: { type: true },
          },
        },
      });

      // Map user's reactions into a simple array
      const mapped = posts.map((post) => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        type: post.type,
        author: post.user,
        reactions: {
          fire: post.fireCount,
          clown: post.clownCount,
          toxic: post.toxicCount,
          laugh: post.laughCount,
          total: post.fireCount + post.clownCount + post.toxicCount + post.laughCount,
        },
        userReactions: post.reactions.map((r) => r.type),
        createdAt: post.createdAt.toISOString(),
      }));

      const nextCursor = posts.length === limit
        ? posts[posts.length - 1].createdAt.toISOString()
        : null;

      return { posts: mapped, nextCursor };
    },
  );

  // ─── GET Single Post ───
  fastify.get(
    '/:id',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const post = await db.post.findFirst({
        where: { id, deletedAt: null },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              rank: true,
              army: { select: { id: true, name: true, colorHex: true } },
            },
          },
          reactions: {
            where: { userId },
            select: { type: true },
          },
        },
      });

      if (!post) return reply.notFound('Post not found');

      return {
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        type: post.type,
        author: post.user,
        reactions: {
          fire: post.fireCount,
          clown: post.clownCount,
          toxic: post.toxicCount,
          laugh: post.laughCount,
          total: post.fireCount + post.clownCount + post.toxicCount + post.laughCount,
        },
        userReactions: post.reactions.map((r) => r.type),
        createdAt: post.createdAt.toISOString(),
      };
    },
  );

  // ─── UPLOAD Post Image ───
  fastify.post(
    '/upload',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const req = request as any;
      const data = await req.file();
      if (!data) return reply.badRequest('No file uploaded');

      if (!data.mimetype.startsWith('image/')) {
        return reply.badRequest('Only image files are allowed');
      }

      const ext = path.extname(data.filename) || '.png';
      const fileName = `post-${request.user.id}-${randomUUID()}${ext}`;
      const uploadPath = path.join(__dirname, '..', '..', '..', '..', 'public', 'uploads', fileName);

      await pipeline(data.file, fs.createWriteStream(uploadPath));

      return reply.send({ success: true, url: `/uploads/${fileName}` });
    }
  );

  // ─── CREATE Post ───
  fastify.post(
    '/',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const bodySchema = z.object({
        content: z.string().min(1).max(500),
        type: z.enum(POST_TYPES).default('OPINION'),
        imageUrl: z.string().optional(),
      });

      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest(parsed.error.issues[0].message);

      const { content, type, imageUrl } = parsed.data;
      const userId = request.user.id;

      const post = await db.post.create({
        data: { userId, content, type, imageUrl },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              rank: true,
              army: { select: { id: true, name: true, colorHex: true } },
            },
          },
        },
      });

      // Award points for creating a post (capped 5/day)
      await awardPoints(userId, POINT_VALUES.POST_CREATE, 'POST_CREATE', post.id);

      return reply.status(201).send({
        success: true,
        post: {
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          type: post.type,
          author: post.user,
          reactions: { fire: 0, clown: 0, toxic: 0, laugh: 0, total: 0 },
          userReactions: [],
          createdAt: post.createdAt.toISOString(),
        },
      });
    },
  );

  // ─── REACT to Post (Toggle) ───
  fastify.post(
    '/:id/react',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const bodySchema = z.object({
        type: z.enum(REACTION_TYPES),
      });

      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest('Invalid reaction type');

      const { type } = parsed.data;
      const userId = request.user.id;

      // Check post exists
      const post = await db.post.findFirst({ where: { id, deletedAt: null } });
      if (!post) return reply.notFound('Post not found');

      // Check if reaction already exists (toggle off)
      const existing = await db.postReaction.findUnique({
        where: { unique_user_post_reaction: { userId, postId: id, type } },
      });

      // Map reaction type to the counter field
      const counterField = `${type.toLowerCase()}Count` as
        'fireCount' | 'clownCount' | 'toxicCount' | 'laughCount';

      if (existing) {
        // Remove reaction
        await db.$transaction([
          db.postReaction.delete({ where: { id: existing.id } }),
          db.post.update({ where: { id }, data: { [counterField]: { decrement: 1 } } }),
        ]);

        return { action: 'removed', type };
      } else {
        // Add reaction
        await db.$transaction([
          db.postReaction.create({ data: { postId: id, userId, type } }),
          db.post.update({ where: { id }, data: { [counterField]: { increment: 1 } } }),
        ]);

        // Award +1 to the person reacting (capped 20/day)
        await awardPoints(userId, POINT_VALUES.REACT_TO_POST, 'REACT_TO_POST', `${id}_${type}`);

        // Award +2 to the post author for receiving a reaction (no self-react rewards)
        if (post.userId !== userId) {
          await awardPoints(post.userId, POINT_VALUES.POST_REACTION_RECEIVED, 'POST_REACTION_RECEIVED', `${id}_${userId}_${type}`);
        }

        return { action: 'added', type };
      }
    },
  );

  // ─── DELETE Post (Author only) ───
  fastify.delete(
    '/:id',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const post = await db.post.findFirst({ where: { id, deletedAt: null } });
      if (!post) return reply.notFound('Post not found');
      if (post.userId !== userId) return reply.forbidden('Not your post');

      await db.post.update({ where: { id }, data: { deletedAt: new Date() } });

      return { success: true };
    },
  );
};
