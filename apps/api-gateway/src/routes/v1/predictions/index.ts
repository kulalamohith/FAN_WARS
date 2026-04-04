/**
 * WARZONE — Predictions Routes (/v1/predictions)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

export const predictionsRoutes: FastifyPluginAsync = async (fastify) => {
  const paramsSchema = z.object({
    id: z.string().uuid(),
  });

  const bodySchema = z.object({
    selectedOption: z.enum(['A', 'B']),
  });

  const triggerParamsSchema = z.object({
    matchId: z.string().uuid(),
  });

  const triggerBodySchema = z.object({
    questionText: z.string(),
    optionA: z.string(),
    optionB: z.string(),
    pointsReward: z.number().int().positive(),
    durationMs: z.number().int().positive().default(15000), // Default 15s
  });

  const resolveBodySchema = z.object({
    correctOption: z.enum(['A', 'B']),
  });

  // --- POST Submit Prediction (/v1/predictions/:id/vote) ---
  fastify.post(
    '/:id/vote',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const parsedParams = paramsSchema.safeParse(request.params);
      const parsedBody = bodySchema.safeParse(request.body);

      if (!parsedParams.success || !parsedBody.success) {
        return reply.badRequest('Invalid payload or ID');
      }

      const predictionId = parsedParams.data.id;
      const { selectedOption } = parsedBody.data;
      const userId = request.user.id;

      // 1. Validate Prediction is ACTIVE
      const prediction = await db.prediction.findUnique({
        where: { id: predictionId }
      });

      if (!prediction) {
        return reply.notFound('Prediction not found');
      }

      if (prediction.status !== 'ACTIVE' || prediction.deletedAt) {
        return reply.badRequest('Prediction is closed or no longer active');
      }

      // Check if expired
      if (new Date() > prediction.expiresAt) {
        // We technically should auto-close this, but for now just reject
        return reply.badRequest('Prediction time has expired');
      }

      // 2. Prevent Double Voting
      // We rely on the UNIQUE constraint in the DB to prevent race conditions,
      // but we do a fast check here for better UX error messages.
      const existingVote = await db.predictionLedger.findUnique({
        where: {
          unique_user_prediction: {
            userId,
            predictionId
          }
        }
      });

      if (existingVote) {
        return reply.conflict('You have already voted on this prediction');
      }

      // 3. Record the Vote (Immutable Ledger)
      try {
        await db.predictionLedger.create({
          data: {
            userId,
            predictionId,
            selectedOption,
            clientIp: request.ip // Fastify captures IP (needs trustProxy behind reverse proxy)
          }
        });

        return reply.send({
          success: true,
          message: 'Vote locked in.',
        });

      } catch (err: any) {
        // Handle Prisma Unique Constraint Violation (P2002) race condition
        if (err.code === 'P2002') {
          return reply.conflict('You have already voted on this prediction');
        }
        throw err;
      }
    }
  );

  // --- POST Trigger Prediction (/v1/predictions/trigger/:matchId) ---
  // In a real app, this would be protected by an admin/system token.
  fastify.post(
    '/trigger/:matchId',
    async (request, reply) => {
      const parsedParams = triggerParamsSchema.safeParse(request.params);
      const parsedBody = triggerBodySchema.safeParse(request.body);

      if (!parsedParams.success || !parsedBody.success) {
        return reply.badRequest('Invalid payload or match ID');
      }

      const { matchId } = parsedParams.data;
      const { questionText, optionA, optionB, pointsReward, durationMs } = parsedBody.data;

      // 1. Verify Match exists
      const match = await db.match.findUnique({ where: { id: matchId } });
      if (!match) return reply.notFound('Match not found');

      const expiresAt = new Date(Date.now() + durationMs);

      // 2. Create Prediction in DB
      const prediction = await db.prediction.create({
        data: {
          matchId,
          questionText,
          optionA,
          optionB,
          pointsReward,
          expiresAt,
          status: 'ACTIVE',
        }
      });

      // 3. Broadcast to War Room via fastify.io
      const io = request.server.io;
      if (io) {
        io.to(`room_${matchId}`).emit('NEW_PREDICTION', {
          id: prediction.id,
          question: prediction.questionText,
          optionA: prediction.optionA,
          optionB: prediction.optionB,
          pointsReward: prediction.pointsReward,
          expiresAt: prediction.expiresAt.toISOString()
        });
      }

      return reply.send({
        success: true,
        prediction,
      });
    }
  );

  // --- POST Resolve Prediction (/v1/predictions/:id/resolve) ---
  // In a real app, protected by admin root API keys
  fastify.post(
    '/:id/resolve',
    async (request, reply) => {
      const parsedParams = paramsSchema.safeParse(request.params);
      const parsedBody = resolveBodySchema.safeParse(request.body);

      if (!parsedParams.success || !parsedBody.success) {
        return reply.badRequest('Invalid payload or ID');
      }

      const predictionId = parsedParams.data.id;
      const { correctOption } = parsedBody.data;

      // 1. Fetch prediction
      const prediction = await db.prediction.findUnique({
        where: { id: predictionId }
      });

      if (!prediction) return reply.notFound('Prediction not found');
      if (prediction.status === 'RESOLVED') return reply.badRequest('Prediction already resolved');

      // 2. Mark prediction as resolved
      await db.prediction.update({
        where: { id: predictionId },
        data: {
          status: 'RESOLVED',
          correctOption
        }
      });

      // 3. Find all correct votes
      const correctVotes = await db.predictionLedger.findMany({
        where: {
          predictionId,
          selectedOption: correctOption
        }
      });

      const userIdsToReward = correctVotes.map(v => v.userId);

      // 4. Issue the War Points via Transaction to ensure ledger sync
      if (userIdsToReward.length > 0) {
        await db.$transaction([
          // Update the users' total points
          db.user.updateMany({
            where: { id: { in: userIdsToReward } },
            data: {
              totalWarPoints: { increment: prediction.pointsReward }
            }
          }),
          // Mark the ledger that these specfic votes were awarded points
          db.predictionLedger.updateMany({
            where: {
              predictionId,
              selectedOption: correctOption
            },
            data: {
              pointsAwarded: prediction.pointsReward
            }
          })
        ]);
      }

      return reply.send({
        success: true,
        message: `Prediction resolved. Awarded ${prediction.pointsReward} WP to ${userIdsToReward.length} warriors.`
      });
    }
  );
};
