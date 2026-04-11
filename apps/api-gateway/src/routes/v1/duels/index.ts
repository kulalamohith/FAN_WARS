/**
 * WARZONE — Sniper Duels Routes (/v1/duels)
 * Persists completed duels globally so everyone can see, vote, and hype them.
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

export const duelsRoutes: FastifyPluginAsync = async (fastify) => {

  // ─── POST: Save a completed duel ───
  fastify.post(
    '/',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const schema = z.object({
        topicText: z.string().min(1),
        topicCategory: z.string().default('hot-take'),
        player1: z.object({
          id: z.string(),
          username: z.string(),
          army: z.string(),
          armyColor: z.string(),
        }),
        player2: z.object({
          id: z.string(),
          username: z.string(),
          army: z.string(),
          armyColor: z.string(),
        }),
        messages: z.array(z.object({
          id: z.string(),
          senderId: z.string(),
          senderName: z.string(),
          text: z.string(),
          timestamp: z.number(),
        })),
        startedAt: z.number().optional(),
        endedAt: z.number().optional(),
      });

      const parsed = schema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest('Invalid duel data');

      const { topicText, topicCategory, player1, player2, messages, startedAt, endedAt } = parsed.data;

      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;
      const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Deduplication: check if same duel (same topic + same two players in any order) exists recently
      const existing = await db.sniperDuel.findFirst({
        where: {
          topicText,
          createdAt: { gte: fiveMinAgo },
          OR: [
            { player1Id: player1.id, player2Id: player2.id },
            { player1Id: player2.id, player2Id: player1.id },
          ],
        },
      });

      if (existing) {
        return { success: true, duel: { id: existing.id }, deduplicated: true };
      }

      const duel = await db.sniperDuel.create({
        data: {
          topicText,
          topicCategory,
          player1Id: player1.id,
          player1Name: player1.username,
          player1Army: player1.army,
          player1Color: player1.armyColor,
          player2Id: player2.id,
          player2Name: player2.username,
          player2Army: player2.army,
          player2Color: player2.armyColor,
          messages: JSON.stringify(messages),
          status: 'voting',
          startedAt: startedAt ? new Date(startedAt) : now,
          endedAt: endedAt ? new Date(endedAt) : now,
          verdictAt: new Date(now.getTime() + oneDay),
        },
      });

      return { success: true, duel: { id: duel.id } };
    },
  );

  // ─── GET: Feed of all duels ───
  fastify.get(
    '/feed',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const querySchema = z.object({
        sort: z.enum(['recent', 'hype']).default('recent'),
        limit: z.coerce.number().min(1).max(50).default(20),
        cursor: z.string().optional(),
      });

      const parsed = querySchema.safeParse(request.query);
      if (!parsed.success) return reply.badRequest('Invalid query');

      const { sort, limit, cursor } = parsed.data;
      const userId = request.user.id;

      const where: any = {};
      if (cursor) where.createdAt = { lt: new Date(cursor) };

      const orderBy = sort === 'hype'
        ? [{ hypeCount: 'desc' as const }, { createdAt: 'desc' as const }]
        : [{ createdAt: 'desc' as const }];

      const duels = await db.sniperDuel.findMany({
        where,
        orderBy,
        take: limit,
        include: {
          votes: { where: { userId }, select: { votedFor: true } },
          hypes: { where: { userId }, select: { id: true } },
        },
      });

      const mapped = duels.map((d) => ({
        id: d.id,
        topicText: d.topicText,
        topicCategory: d.topicCategory,
        player1: { id: d.player1Id, username: d.player1Name, army: d.player1Army, armyColor: d.player1Color },
        player2: { id: d.player2Id, username: d.player2Name, army: d.player2Army, armyColor: d.player2Color },
        messages: JSON.parse(d.messages),
        status: d.status,
        player1Votes: d.player1Votes,
        player2Votes: d.player2Votes,
        hypeCount: d.hypeCount,
        myVote: d.votes[0]?.votedFor || null,
        myHype: d.hypes.length > 0,
        winnerId: d.winnerId,
        startedAt: d.startedAt.getTime(),
        endedAt: d.endedAt?.getTime() || null,
        verdictAt: d.verdictAt?.getTime() || null,
        createdAt: d.createdAt.toISOString(),
      }));

      const nextCursor = duels.length === limit
        ? duels[duels.length - 1].createdAt.toISOString()
        : null;

      return { duels: mapped, nextCursor };
    },
  );

  // ─── POST: Vote on a duel ───
  fastify.post(
    '/:id/vote',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const bodySchema = z.object({ votedFor: z.enum(['player1', 'player2']) });
      const parsed = bodySchema.safeParse(request.body);
      if (!parsed.success) return reply.badRequest('Invalid vote');

      const { votedFor } = parsed.data;
      const userId = request.user.id;

      const duel = await db.sniperDuel.findUnique({ where: { id } });
      if (!duel) return reply.notFound('Duel not found');

      // Check if user already voted
      const existing = await db.duelVote.findUnique({
        where: { duelId_userId: { duelId: id, userId } },
      });

      if (existing) {
        const prevField = existing.votedFor === 'player1' ? 'player1Votes' : 'player2Votes';

        if (existing.votedFor === votedFor) {
          // Toggle off — remove vote
          await db.$transaction([
            db.duelVote.delete({ where: { id: existing.id } }),
            db.sniperDuel.update({ where: { id }, data: { [prevField]: { decrement: 1 } } }),
          ]);
          return { action: 'removed', votedFor: null };
        } else {
          // Switch vote
          const newField = votedFor === 'player1' ? 'player1Votes' : 'player2Votes';
          await db.$transaction([
            db.duelVote.update({ where: { id: existing.id }, data: { votedFor } }),
            db.sniperDuel.update({ where: { id }, data: { [prevField]: { decrement: 1 }, [newField]: { increment: 1 } } }),
          ]);
          return { action: 'switched', votedFor };
        }
      } else {
        // New vote
        const field = votedFor === 'player1' ? 'player1Votes' : 'player2Votes';
        await db.$transaction([
          db.duelVote.create({ data: { duelId: id, userId, votedFor } }),
          db.sniperDuel.update({ where: { id }, data: { [field]: { increment: 1 } } }),
        ]);
        return { action: 'added', votedFor };
      }
    },
  );

  // ─── POST: Hype a duel ───
  fastify.post(
    '/:id/hype',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const duel = await db.sniperDuel.findUnique({ where: { id } });
      if (!duel) return reply.notFound('Duel not found');

      const existing = await db.duelHype.findUnique({
        where: { duelId_userId: { duelId: id, userId } },
      });

      if (existing) {
        // Un-hype
        await db.$transaction([
          db.duelHype.delete({ where: { id: existing.id } }),
          db.sniperDuel.update({ where: { id }, data: { hypeCount: { decrement: 1 } } }),
        ]);
        return { action: 'removed', hyped: false };
      } else {
        // Hype
        await db.$transaction([
          db.duelHype.create({ data: { duelId: id, userId } }),
          db.sniperDuel.update({ where: { id }, data: { hypeCount: { increment: 1 } } }),
        ]);
        return { action: 'added', hyped: true };
      }
    },
  );
};
