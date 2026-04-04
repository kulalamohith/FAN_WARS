/**
 * WARZONE — War Room Routes (/v1/war-rooms)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

export const warRoomRoutes: FastifyPluginAsync = async (fastify) => {
  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  // --- GET War Room State (/v1/war-rooms/:id) ---
  fastify.get(
    '/:id',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const parsedParams = paramsSchema.safeParse(request.params);
      if (!parsedParams.success) {
        return reply.badRequest('Invalid room ID');
      }

      const roomId = parsedParams.data.id;

      const room = await db.warRoom.findUnique({
        where: { id: roomId },
        include: {
          match: {
            include: {
              predictions: {
                where: { 
                  status: 'ACTIVE',
                  deletedAt: null 
                },
                select: {
                  id: true,
                  questionText: true,
                  optionA: true,
                  optionB: true,
                  pointsReward: true,
                  expiresAt: true
                }
              }
            }
          }
        }
      });

      if (!room) {
        return reply.notFound('War room not found');
      }

      // Format response exactly as specified in API_SPEC.md
      return reply.send({
        id: room.id,
        matchId: room.matchId,
        toxicity: {
          homeScore: room.toxicityScoreHome,
          awayScore: room.toxicityScoreAway,
        },
        activePredictions: room.match.predictions.map((p: any) => ({
          id: p.id,
          question: p.questionText, // mapping to spec
          optionA: p.optionA,
          optionB: p.optionB,
          pointsReward: p.pointsReward,
          expiresAt: p.expiresAt,
        }))
      });
    }
  );
};
