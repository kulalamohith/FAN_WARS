/**
 * WARZONE — Posts Routes (/v1/posts)
 * Instagram-style social feed for fan opinions, memes, hype posts, and debates.
 * Reactions: 🔥 FIRE, 😂 ROAST, 👎 DISAGREE, 👑 LEGEND
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

const REACTION_TYPES = ['FIRE', 'ROAST', 'DISAGREE', 'LEGEND'] as const;
const POST_TYPES = ['OPINION', 'HYPE', 'DEBATE', 'MEME'] as const;

export const postsRoutes: FastifyPluginAsync = async (fastify) => {

  // ─── GET Feed ───
  fastify.get(
    '/feed',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const querySchema = z.object({
        sort: z.enum(['hot', 'new']).default('hot'),
        type: z.enum(POST_TYPES).optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().min(1).max(50).default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) return reply.badRequest('Invalid query parameters');

      const { sort, type, cursor, limit } = parsed.data;
      const userId = request.user.id;

      const where: any = { deletedAt: null };
      if (type) where.type = type;
      if (cursor) where.createdAt = { lt: new Date(cursor) };

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
        type: post.type,
        author: post.user,
        reactions: {
          fire: post.fireCount,
          roast: post.roastCount,
          disagree: post.disagreeCount,
          legend: post.legendCount,
          total: post.fireCount + post.roastCount + post.disagreeCount + post.legendCount,
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
        type: post.type,
        author: post.user,
        reactions: {
          fire: post.fireCount,
          roast: post.roastCount,
          disagree: post.disagreeCount,
          legend: post.legendCount,
          total: post.fireCount + post.roastCount + post.disagreeCount + post.legendCount,
        },
        userReactions: post.reactions.map((r) => r.type),
        createdAt: post.createdAt.toISOString(),
      };
    },
  );

  // ─── CREATE Post ───
  fastify.post(
    '/',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const bodySchema = z.object({
        content: z.string().min(1).max(500),
        type: z.enum(POST_TYPES).default('OPINION'),
      });

      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest(parsed.error.issues[0].message);

      const { content, type } = parsed.data;
      const userId = request.user.id;

      const post = await db.post.create({
        data: { userId, content, type },
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

      return reply.status(201).send({
        success: true,
        post: {
          id: post.id,
          content: post.content,
          type: post.type,
          author: post.user,
          reactions: { fire: 0, roast: 0, disagree: 0, legend: 0, total: 0 },
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
        'fireCount' | 'roastCount' | 'disagreeCount' | 'legendCount';

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
