/**
 * WARZONE — Predictions Routes (/v1/predictions)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db.js';
import { awardPoints, batchAwardPoints, POINT_VALUES } from '../../../lib/points.js';

export const predictionsRoutes: FastifyPluginAsync = async (fastify) => {
  const paramsSchema = z.object({
    id: z.string(),
  });

  const bodySchema = z.object({
    selectedOption: z.enum(['A', 'B']),
  });

  const triggerParamsSchema = z.object({
    matchId: z.string(),
  });

  const triggerBodySchema = z.object({
    questionText: z.string(),
    optionA: z.string(),
    optionB: z.string(),
    pointsReward: z.coerce.number().int().positive(),
    durationMs: z.coerce.number().int().positive().default(15000), // Default 15s
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
        return reply.badRequest('Prediction time has expired');
      }

      // 2. Prevent Double Voting
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
            clientIp: request.ip
          }
        });

        return reply.send({
          success: true,
          message: 'Vote locked in.',
        });

      } catch (err: any) {
        if (err.code === 'P2002') {
          return reply.conflict('You have already voted on this prediction');
        }
        throw err;
      }
    }
  );

  // --- POST Trigger Prediction (/v1/predictions/trigger/:matchId) ---
  fastify.post(
    '/trigger/:matchId',
    async (request, reply) => {
      const { matchId } = request.params as any;
      const parsedBody = triggerBodySchema.safeParse(request.body);

      if (!parsedBody.success) {
        return reply.badRequest(`Invalid payload: ${parsedBody.error.message}`);
      }

      const { questionText, optionA, optionB, pointsReward, durationMs } = parsedBody.data;

      // Handle demo mode matches (hardcoded in frontend schedule)
      let match = await db.match.findUnique({ where: { id: matchId } });
      let isDemo = false;
      
      if (!match) {
        if (matchId.startsWith('match-')) {
          isDemo = true;
          const armies = await db.army.findMany({ take: 2 });
          if (armies.length < 2) return reply.internalServerError('Not enough armies seeded to create demo match');
          
          match = await db.match.create({
            data: {
              id: matchId,
              homeArmyId: armies[0].id,
              awayArmyId: armies[1].id,
              status: 'LIVE',
              startTime: new Date(),
            }
          });
        } else {
          return reply.notFound('Match not found');
        }
      }

      // 2. Create Prediction in DB
      const prediction = await db.prediction.create({
        data: {
          matchId,
          questionText,
          optionA,
          optionB,
          pointsReward,
          expiresAt: new Date(Date.now() + durationMs),
          status: 'ACTIVE',
        }
      });
      
      const predictionId = prediction.id;
      const expiresAt = prediction.expiresAt;

      // 3. Broadcast to War Room via fastify.io
      const io = request.server.io;
      if (io) {
        io.to(`room_${matchId}`).emit('NEW_PREDICTION', {
          id: predictionId,
          question: questionText,
          optionA,
          optionB,
          pointsReward,
          expiresAt: expiresAt.toISOString()
        });
      }

      return reply.send({
        success: true,
        message: isDemo ? 'Demo prediction broadcasted' : 'Prediction created and broadcasted',
        predictionId
      });
    }
  );

  // --- POST Resolve Prediction (/v1/predictions/:id/resolve) ---
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

      // 4. Find all wrong votes
      const wrongVotes = await db.predictionLedger.findMany({
        where: {
          predictionId,
          selectedOption: { not: correctOption }
        }
      });

      // 5. Award points to correct voters via centralized engine
      const correctUserIds = correctVotes.map(v => v.userId);
      const correctResult = await batchAwardPoints(
        correctUserIds,
        prediction.pointsReward,
        'PREDICTION_CORRECT',
        predictionId
      );

      // Mark the ledger entries with the points awarded
      if (correctUserIds.length > 0) {
        await db.predictionLedger.updateMany({
          where: {
            predictionId,
            selectedOption: correctOption
          },
          data: {
            pointsAwarded: prediction.pointsReward
          }
        });
      }

      // 6. Award participation points to wrong voters (+10)
      const wrongUserIds = wrongVotes.map(v => v.userId);
      const wrongResult = await batchAwardPoints(
        wrongUserIds,
        POINT_VALUES.PREDICTION_WRONG,
        'PREDICTION_WRONG',
        predictionId
      );

      // Mark wrong ledger entries too
      if (wrongUserIds.length > 0) {
        await db.predictionLedger.updateMany({
          where: {
            predictionId,
            selectedOption: { not: correctOption }
          },
          data: {
            pointsAwarded: POINT_VALUES.PREDICTION_WRONG
          }
        });
      }

      return reply.send({
        success: true,
        message: `Prediction resolved. Awarded ${prediction.pointsReward} WP to ${correctResult.awarded} correct warriors, +${POINT_VALUES.PREDICTION_WRONG} WP to ${wrongResult.awarded} participants.`
      });
    }
  );
};
