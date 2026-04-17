import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { awardPoints, POINT_VALUES } from '../../../lib/points';

const createBunkerSchema = z.object({
  name: z.string().min(3).max(50),
  matchId: z.string().optional(),
  homeTeam: z.string().min(1).max(50).optional(),
  awayTeam: z.string().min(1).max(50).optional(),
}).refine(data => data.matchId || (data.homeTeam && data.awayTeam), {
  message: "Either matchId or both homeTeam and awayTeam must be provided",
  path: ["matchId"]
});

const joinBunkerSchema = z.object({
  inviteCode: z.string().min(5).max(10),
});

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const bunkersRoutes: FastifyPluginAsync = async (fastify) => {
  // --- POST Create Bunker ---
  fastify.post('/', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    try {
      console.log('[BunkerCreate] Request Body:', request.body);
      const data = createBunkerSchema.parse(request.body);
      console.log('[BunkerCreate] Parsed Data:', data);
      
      let finalMatchId = data.matchId;

      // Handle custom A vs B matchup
      if (!finalMatchId && data.homeTeam && data.awayTeam) {
        console.log('[BunkerCreate] Creating custom match:', data.homeTeam, 'vs', data.awayTeam);
        // 1. Get or Create Armies
        const homeArmy = await db.army.upsert({
          where: { name: data.homeTeam },
          update: {},
          create: { name: data.homeTeam, colorHex: '#FFFFFF' }
        });
        const awayArmy = await db.army.upsert({
          where: { name: data.awayTeam },
          update: {},
          create: { name: data.awayTeam, colorHex: '#FFD60A' }
        });

        // 2. Create Match
        const newMatch = await db.match.create({
          data: {
            homeArmyId: homeArmy.id,
            awayArmyId: awayArmy.id,
            status: 'LIVE',
            startTime: new Date(),
          }
        });

        // 3. Create WarRoom
        await db.warRoom.create({
          data: {
            matchId: newMatch.id,
            toxicityScoreHome: 50,
            toxicityScoreAway: 50,
          }
        });

        finalMatchId = newMatch.id;
        console.log('[BunkerCreate] Custom match created with ID:', finalMatchId);
      } else if (finalMatchId) {
        console.log('[BunkerCreate] Searching for existing match ID:', finalMatchId);
        // Ensure match exists if provided
        const match = await db.match.findUnique({ where: { id: finalMatchId } });
        if (!match) {
           console.warn('[BunkerCreate] Match not found in DB:', finalMatchId);
           return reply.notFound('Match not found');
        }
      }

      let inviteCode = '';
      let isUnique = false;
      while (!isUnique) {
        inviteCode = generateInviteCode();
        const existing = await db.bunker.findUnique({ where: { inviteCode } });
        if (!existing) isUnique = true;
      }

      console.log('[BunkerCreate] Creating bunker with matchId:', finalMatchId, 'and code:', inviteCode);
      const bunker = await db.bunker.create({
        data: {
          name: data.name,
          matchId: finalMatchId!,
          creatorId: request.user.id,
          inviteCode,
          members: {
            create: { userId: request.user.id } // Auto-join creator
          }
        },
        include: {
          members: true
        }
      });

      console.log('[BunkerCreate] Bunker created successfully:', bunker.id);

      // Award points for creating a bunker (capped 2/day)
      const ptsRes = await awardPoints(request.user.id, POINT_VALUES.BUNKER_CREATE, 'BUNKER_CREATE', bunker.id);
      console.log('[BunkerCreate] Points Award Result:', ptsRes);

      return reply.code(201).send({ success: true, bunker });
    } catch (error) {
      console.error('[BunkerCreate] Final Catch Error:', error);
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.errors[0].message);
      }
      return reply.internalServerError('Failed to create bunker');
    }
  });

  // --- POST Join Bunker ---
  fastify.post('/join', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    try {
      const data = joinBunkerSchema.parse(request.body);

      const bunker = await db.bunker.findUnique({
        where: { inviteCode: data.inviteCode.toUpperCase() },
        include: { _count: { select: { members: true } } }
      });

      if (!bunker) {
        return reply.notFound('Invalid invite code. Bunker not found.');
      }

      if (bunker._count.members >= 12) {
        return reply.forbidden('Private War Room has reached max capacity (12 members).');
      }

      // Add to bunker member list
      try {
        await db.bunkerMember.create({
          data: {
            bunkerId: bunker.id,
            userId: request.user.id
          }
        });

        // Award points for joining a bunker (capped 3/day)
        await awardPoints(request.user.id, POINT_VALUES.BUNKER_JOIN, 'BUNKER_JOIN', bunker.id);
      } catch (err: any) {
        // If unique constraint fails, they are already in the bunker, which is fine
        if (err.code !== 'P2002') {
          throw err;
        }
      }

      return reply.send({ success: true, bunkerId: bunker.id });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.badRequest('Invalid invite code format');
      }
      fastify.log.error(error);
      return reply.internalServerError('Failed to join bunker');
    }
  });

  // --- GET My Bunkers ---
  fastify.get('/my', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    try {
      const memberships = await db.bunkerMember.findMany({
        where: { userId: request.user.id },
        include: {
          bunker: {
            include: {
              match: {
                include: { 
                  homeArmy: { select: { id: true, name: true, colorHex: true } }, 
                  awayArmy: { select: { id: true, name: true, colorHex: true } } 
                }
              },
              _count: { select: { members: true } }
            }
          }
        },
        orderBy: { joinedAt: 'desc' }
      });

      const bunkers = memberships.map((m: any) => m.bunker);
      return { success: true, bunkers };
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError('Failed to fetch user bunkers');
    }
  });

  // --- GET Bunker Details ---
  fastify.get('/:id', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const bunker = await db.bunker.findUnique({
        where: { id },
        include: {
          match: {
            include: { 
              homeArmy: { select: { id: true, name: true, colorHex: true } }, 
              awayArmy: { select: { id: true, name: true, colorHex: true } } 
            }
          },
          members: {
            include: {
              user: {
                select: { 
                  id: true, 
                  username: true, 
                  rank: true, 
                  army: { select: { name: true } } 
                }
              }
            },
            orderBy: { joinedAt: 'asc' }
          }
        }
      });

      if (!bunker) return reply.notFound('Bunker not found');

      // Ensure requester is actually part of this bunker
      const isMember = bunker.members.some((m: any) => m.userId === request.user.id);
      if (!isMember) {
        return reply.forbidden('You are not a member of this bunker.');
      }

      return { success: true, bunker };
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError('Failed to fetch bunker details');
    }
  });
  // --- DELETE Member (Kick User) ---
  fastify.delete('/:id/members/:userId', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    const { id, userId } = request.params as { id: string; userId: string };

    try {
      const bunker = await db.bunker.findUnique({ where: { id } });
      if (!bunker) return reply.notFound('Bunker not found');

      if (bunker.creatorId !== request.user.id) {
        return reply.forbidden('Only the host can remove members.');
      }

      if (userId === request.user.id) {
        return reply.badRequest('You cannot kick yourself. Please leave instead.');
      }

      await db.bunkerMember.deleteMany({
        where: {
          bunkerId: id,
          userId: userId
        }
      });

      // Emit socket event to the kicked user (handled on frontend)
      fastify.io.to(`bunker_${id}`).emit('bunker_kicked', { userId });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError('Failed to remove member');
    }
  });

  // --- DELETE Bunker (End Room) ---
  fastify.delete('/:id', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const bunker = await db.bunker.findUnique({ where: { id } });
      if (!bunker) return reply.notFound('Bunker not found');

      if (bunker.creatorId !== request.user.id) {
        return reply.forbidden('Only the host can end the room.');
      }

      // Delete members then bunker
      await db.bunkerMember.deleteMany({ where: { bunkerId: id } });
      await db.bunker.delete({ where: { id } });

      // Emit socket event to all users in room
      fastify.io.to(`bunker_${id}`).emit('bunker_ended', { bunkerId: id });

      return { success: true };
    } catch (error) {
      fastify.log.error(error);
      return reply.internalServerError('Failed to end bunker');
    }
  });
}
