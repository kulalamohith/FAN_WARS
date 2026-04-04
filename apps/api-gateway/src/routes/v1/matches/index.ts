/**
 * WARZONE — Matches Routes (/v1/matches)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

export const matchesRoutes: FastifyPluginAsync = async (fastify) => {

  // Schema for pagination
  const paginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
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

      // Fetch LIVE matches ordered by start time
      const matches = await db.match.findMany({
        where: {
          status: 'LIVE',
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
        orderBy: {
          startTime: 'asc'
        },
        skip,
        take: limit,
      });

      const total = await db.match.count({
        where: { status: 'LIVE', deletedAt: null }
      });

      // Format response exactly as specified in API_SPEC.md
      const formattedMatches = matches.map((m: any) => ({
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
