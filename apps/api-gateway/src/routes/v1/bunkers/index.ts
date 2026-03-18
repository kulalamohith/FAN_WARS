import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';

const createBunkerSchema = z.object({
  name: z.string().min(3).max(50),
  matchId: z.string().uuid(),
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
      const data = createBunkerSchema.parse(request.body);
      
      // Ensure match exists
      const match = await db.match.findUnique({ where: { id: data.matchId } });
      if (!match) return reply.notFound('Match not found');

      let inviteCode = '';
      let isUnique = false;
      while (!isUnique) {
        inviteCode = generateInviteCode();
        const existing = await db.bunker.findUnique({ where: { inviteCode } });
        if (!existing) isUnique = true;
      }

      const bunker = await db.bunker.create({
        data: {
          name: data.name,
          matchId: data.matchId,
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

      return reply.code(201).send({ success: true, bunker });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.badRequest(error.errors[0].message);
      }
      fastify.log.error(error);
      return reply.internalServerError('Failed to create bunker');
    }
  });

  // --- POST Join Bunker ---
  fastify.post('/join', { preValidation: [fastify.verifyJWT] }, async (request, reply) => {
    try {
      const data = joinBunkerSchema.parse(request.body);

      const bunker = await db.bunker.findUnique({
        where: { inviteCode: data.inviteCode.toUpperCase() }
      });

      if (!bunker) {
        return reply.notFound('Invalid invite code. Bunker not found.');
      }

      // Add to bunker member list
      try {
        await db.bunkerMember.create({
          data: {
            bunkerId: bunker.id,
            userId: request.user.id
          }
        });
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
}
