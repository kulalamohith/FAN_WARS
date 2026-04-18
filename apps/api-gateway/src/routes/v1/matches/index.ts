/**
 * WARZONE — Matches Routes (/v1/matches)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db.js';

export const matchesRoutes: FastifyPluginAsync = async (fastify) => {

  // Schema for pagination
  const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
  });

  // --- GET Match Viewer Counts (/v1/matches/viewers) ---
  fastify.get('/viewers', async (request, reply) => {
    // @ts-ignore
    const visitors: Record<string, Set<string>> = fastify.roomVisitors || {};
    // @ts-ignore
    const toxicityScores: Record<string, any> = fastify.toxicityScores || {};
    
    const counts: Record<string, number> = {};
    for (const [id, set] of Object.entries(visitors)) {
      counts[id] = set.size;
    }
    return reply.send({ counts, toxicity: toxicityScores });
  });

  // --- GET Live Matches (/v1/matches/live) ---
  fastify.get(
    '/live',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const parsedQuery = paginationSchema.safeParse(request.query);
      if (!parsedQuery.success) {
        return reply.badRequest('Invalid pagination parameters');
      }

      const { page, limit } = parsedQuery.data;
      const skip = (page - 1) * limit;

      // Fetch LIVE and PRE (upcoming) matches ordered by status (LIVE first) and start time
      const matches = await db.match.findMany({
        where: {
          status: { in: ['LIVE', 'PRE'] },
          deletedAt: null,
        },
        include: {
          homeArmy: {
            select: { id: true, name: true, colorHex: true }
          },
          awayArmy: {
            select: { id: true, name: true, colorHex: true }
          },
          warRoom: {
            select: { id: true }
          },
          predictions: {
            where: { status: 'ACTIVE' }
          }
        },
        orderBy: [
          { status: 'desc' }, // LIVE (L) comes before PRE (P) alphabetically in descending order? 
                              // Wait, 'LIVE' > 'PRE'? 'L' (12) and 'P' (16). No, 'PRE' > 'LIVE'.
                              // Let's use two order criteria or handle it explicitly.
                              // Actually, I'll just use startTime as the primary sort for PRE, 
                              // but LIVE matches should be at Top.
          { startTime: 'asc' }
        ],
        skip,
        take: limit,
      });

      // Simple sort to ensure LIVE is always at the top regardless of startTime
      const sortedMatches = [...matches].sort((a, b) => {
        if (a.status === 'LIVE' && b.status !== 'LIVE') return -1;
        if (a.status !== 'LIVE' && b.status === 'LIVE') return 1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      const total = await db.match.count({
        where: { status: { in: ['LIVE', 'PRE'] }, deletedAt: null }
      });

      // Format response exactly as specified in API_SPEC.md
      const formattedMatches = sortedMatches.map((m: any) => ({
        id: m.id,
        homeArmy: m.homeArmy,
        awayArmy: m.awayArmy,
        status: m.status,
        startTime: m.startTime,
        warRoomId: m.warRoom?.id || null,
        activePredictions: m.predictions || []
      }));

      return reply.send({
        matches: formattedMatches,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
  );
};
