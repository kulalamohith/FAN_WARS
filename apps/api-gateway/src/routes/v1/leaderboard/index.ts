/**
 * WARZONE — Leaderboard Routes (/v1/leaderboard)
 */

import { FastifyPluginAsync } from 'fastify';
import { db } from '../../../lib/db';
import { calculateRank } from '../../../lib/ranks';

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // --- GET Top 50 Warriors (/v1/leaderboard) ---
  fastify.get('/', async (request, reply) => {
    // Note: In an MVP, doing a direct findMany sort on a BigInt column is fine.
    // At scale, we would use a Redis sorted set for real-time leaderboards.
    
    const topUsers = await db.user.findMany({
      take: 50,
      orderBy: {
        totalWarPoints: 'desc'
      },
      include: {
        army: true
      }
    });

    // Map DB output to client-safe DTO and attach dynamic rank
    const leaderboard = topUsers.map((u, index) => ({
      rankPosition: index + 1,
      id: u.id,
      username: u.username,
      totalWarPoints: u.totalWarPoints.toString(),
      militaryRank: calculateRank(u.totalWarPoints),
      army: {
        id: u.army.id,
        name: u.army.name,
        colorHex: u.army.colorHex
      }
    }));

    return reply.send({
      success: true,
      leaderboard
    });
  });

  // --- GET Army Leaderboard (/v1/leaderboard/armies) ---
  fastify.get('/armies', async (request, reply) => {
    const armies = await db.army.findMany({
      include: {
        users: {
          select: { totalWarPoints: true },
        },
      },
    });

    const ranked = armies
      .map((a) => ({
        id: a.id,
        name: a.name,
        colorHex: a.colorHex,
        totalWarPoints: a.users.reduce(
          (sum: bigint, u: any) => sum + BigInt(u.totalWarPoints),
          BigInt(0)
        ).toString(),
        memberCount: a.users.length,
      }))
      .sort((a, b) => (BigInt(b.totalWarPoints) > BigInt(a.totalWarPoints) ? 1 : -1))
      .map((a, i) => ({ ...a, rankPosition: i + 1 }));

    return reply.send({ success: true, armies: ranked });
  });

  // --- GET Team Context (/v1/leaderboard/team-context) ---
  fastify.get(
    '/team-context',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const user = await db.user.findUnique({ where: { id: request.user.id } });
      if (!user) return reply.unauthorized();

      // Top 10 in Army
      const topUsers = await db.user.findMany({
        where: { armyId: user.armyId },
        take: 10,
        orderBy: { totalWarPoints: 'desc' },
      });

      // Find absolute rank inside the army
      const myRankIndex = await db.user.count({
        where: { armyId: user.armyId, totalWarPoints: { gt: user.totalWarPoints } }
      });
      const myRank = myRankIndex + 1;

      const mapToDTO = (u: any, rankShift: number) => ({
        id: u.id,
        username: u.username,
        profilePictureUrl: u.profilePictureUrl,
        totalWarPoints: u.totalWarPoints.toString(),
        militaryRank: calculateRank(u.totalWarPoints),
        rankPosition: rankShift,
      });

      const top10 = topUsers.map((u, i) => mapToDTO(u, i + 1));
      const currentUser = mapToDTO(user, myRank);

      return reply.send({
        success: true,
        top10,
        currentUser
      });
    }
  );
};
