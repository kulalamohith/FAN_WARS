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
  const adminEventBodySchema = z.object({
    eventType: z.string(),
    payload: z.any()
  });

  // --- POST Admin Event (/v1/war-rooms/:id/admin-events) ---
  fastify.post(
    '/:id/admin-events',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      // Allow any string for the id param to support match-xxx for demo purposes
      const id = (request.params as any).id;
      const parsedBody = adminEventBodySchema.safeParse(request.body);

      if (!parsedBody.success) {
        return reply.badRequest('Invalid admin event payload');
      }

      // 1. In a real app we'd verify request.user.role === 'ADMIN'
      
      const { eventType, payload } = parsedBody.data;

      // 2. Broadcast to War Room via fastify.io
      const io = request.server.io;
      if (io) {
        io.to(`room_${id}`).emit('admin_event', { type: eventType, data: payload });
      }

      return reply.send({ success: true });
    }
  );
};
