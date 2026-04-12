/**
 * WARZONE — Roasts Routes (/v1/roasts)
 * The trash-talk feed. Post roasts against rival armies, upvote the best ones.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { awardPoints, POINT_VALUES } from '../../../lib/points';

const LEGENDARY_THRESHOLD = 50; // Upvotes to become legendary

export const roastsRoutes: FastifyPluginAsync = async (fastify) => {

  // --- GET Feed ---
  fastify.get(
    '/feed',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const querySchema = z.object({
        sort: z.enum(['viral', 'new']).default('viral'),
        armyId: z.string().uuid().optional(),
        cursor: z.string().optional(),
        limit: z.coerce.number().min(1).max(50).default(20),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) return reply.badRequest('Invalid query parameters');

      const { sort, armyId, cursor, limit } = parsed.data;
      const userId = request.user.id;

      const where: any = { deletedAt: null };
      if (armyId) where.targetArmyId = armyId;
      if (cursor) where.createdAt = { lt: new Date(cursor) };

      const roasts = await db.roast.findMany({
        where,
        orderBy: sort === 'viral'
          ? { upvoteCount: 'desc' }
          : { createdAt: 'desc' },
        take: limit,
        include: {
          user: { select: { id: true, username: true, armyId: true } },
          targetArmy: { select: { id: true, name: true, colorHex: true } },
          upvotes: {
            where: { userId },
            select: { id: true },
          },
        },
      });

      const formatted = roasts.map((r: any) => ({
        id: r.id,
        content: r.content,
        upvoteCount: r.upvoteCount,
        isLegendary: r.isLegendary,
        hasUpvoted: r.upvotes.length > 0,
        createdAt: r.createdAt.toISOString(),
        author: {
          id: r.user.id,
          username: r.user.username,
          armyId: r.user.armyId,
        },
        targetArmy: r.targetArmy,
      }));

      return reply.send({
        roasts: formatted,
        nextCursor: roasts.length === limit
          ? roasts[roasts.length - 1].createdAt.toISOString()
          : null,
      });
    }
  );

  // --- POST Create Roast ---
  fastify.post(
    '/',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const bodySchema = z.object({
        content: z.string().min(1).max(280),
        targetArmyId: z.string().uuid(),
      });

      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest('Invalid roast payload');

      const { content, targetArmyId } = parsed.data;
      const userId = request.user.id;

      // Prevent roasting your own army
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.armyId === targetArmyId) {
        return reply.badRequest('You cannot roast your own army, traitor.');
      }

      const roast = await db.roast.create({
        data: {
          userId,
          targetArmyId,
          content,
        },
        include: {
          user: { select: { id: true, username: true, armyId: true } },
          targetArmy: { select: { id: true, name: true, colorHex: true } },
        },
      });

      // Award points for creating a roast (capped 3/day)
      await awardPoints(userId, POINT_VALUES.ROAST_CREATE, 'ROAST_CREATE', roast.id);

      return reply.code(201).send({
        success: true,
        roast: {
          id: roast.id,
          content: roast.content,
          upvoteCount: 0,
          isLegendary: false,
          hasUpvoted: false,
          createdAt: roast.createdAt.toISOString(),
          author: {
            id: roast.user.id,
            username: roast.user.username,
            armyId: roast.user.armyId,
          },
          targetArmy: roast.targetArmy,
        },
      });
    }
  );

  // --- POST Upvote Toggle ---
  fastify.post(
    '/:id/upvote',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const paramsSchema = z.object({ id: z.string().uuid() });
      const parsed = paramsSchema.safeParse(request.params);
      if (!parsed.success) return reply.badRequest('Invalid roast ID');

      const roastId = parsed.data.id;
      const userId = request.user.id;

      // Check roast exists
      const roast = await db.roast.findUnique({ where: { id: roastId } });
      if (!roast || roast.deletedAt) return reply.notFound('Roast not found');

      // Check if already upvoted
      const existing = await db.roastUpvote.findUnique({
        where: { unique_user_roast_upvote: { userId, roastId } },
      });

      if (existing) {
        // Remove upvote
        await db.$transaction([
          db.roastUpvote.delete({ where: { id: existing.id } }),
          db.roast.update({
            where: { id: roastId },
            data: { upvoteCount: { decrement: 1 } },
          }),
        ]);
        return reply.send({ success: true, action: 'removed', newCount: roast.upvoteCount - 1 });
      } else {
        // Add upvote
        const newCount = roast.upvoteCount + 1;
        const isNowLegendary = newCount >= LEGENDARY_THRESHOLD;

        await db.$transaction([
          db.roastUpvote.create({ data: { userId, roastId } }),
          db.roast.update({
            where: { id: roastId },
            data: {
              upvoteCount: { increment: 1 },
              ...(isNowLegendary && !roast.isLegendary ? { isLegendary: true } : {}),
            },
          }),
        ]);

        // Award +3 to roast author for receiving an upvote (capped 100/day)
        if (roast.userId !== userId) {
          await awardPoints(roast.userId, POINT_VALUES.ROAST_UPVOTE_RECEIVED, 'ROAST_UPVOTE_RECEIVED', `${roastId}_${userId}`);
        }

        return reply.send({
          success: true,
          action: 'added',
          newCount,
          isLegendary: isNowLegendary,
        });
      }
    }
  );
};
