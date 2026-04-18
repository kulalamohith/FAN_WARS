/**
 * WARZONE — Leaderboard Routes (/v1/leaderboard)
 */

import { FastifyPluginAsync } from 'fastify';
import { db } from '../../../lib/db.js';
import { calculateRank } from '../../../lib/ranks.js';
import { getRedis } from '../../../lib/redis.js';

const CACHE_TTL = 60; // seconds

export const leaderboardRoutes: FastifyPluginAsync = async (fastify) => {
  // --- GET Top 50 Warriors (/v1/leaderboard) ---
  fastify.get('/', async (request, reply) => {
    const CACHE_KEY = 'leaderboard:top50';

    // 1. Try Redis cache first
    try {
      const cached = await getRedis().get(CACHE_KEY);
      if (cached) {
        return reply.send(JSON.parse(cached));
      }
    } catch { /* Redis unavailable, fall through to DB */ }

    // 2. Cache miss — query DB
    const topUsers = await db.user.findMany({
      take: 50,
      orderBy: { totalWarPoints: 'desc' },
      include: { army: true },
    });

    const leaderboard = topUsers.map((u, index) => ({
      rankPosition: index + 1,
      id: u.id,
      username: u.username,
      totalWarPoints: u.totalWarPoints.toString(),
      militaryRank: calculateRank(u.totalWarPoints),
      army: { id: u.army.id, name: u.army.name, colorHex: u.army.colorHex },
    }));

    const response = { success: true, leaderboard };

    // 3. Populate cache (fire-and-forget)
    try {
      await getRedis().set(CACHE_KEY, JSON.stringify(response), 'EX', CACHE_TTL);
    } catch { /* ignore cache write errors */ }

    return reply.send(response);
  });

  // --- GET Army Leaderboard (/v1/leaderboard/armies) ---
  fastify.get('/armies', async (request, reply) => {
    const CACHE_KEY = 'leaderboard:armies';

    // 1. Try Redis cache first
    try {
      const cached = await getRedis().get(CACHE_KEY);
      if (cached) {
        return reply.send(JSON.parse(cached));
      }
    } catch { /* fall through */ }

    // 2. DB query
    const armies = await db.army.findMany({
      include: { users: { select: { totalWarPoints: true } } },
    });

    const ranked = armies
      .map((a) => ({
        id: a.id,
        name: a.name,
        colorHex: a.colorHex,
        totalWarPoints: a.users
          .reduce((sum: bigint, u: any) => sum + BigInt(u.totalWarPoints), BigInt(0))
          .toString(),
        memberCount: a.users.length,
      }))
      .sort((a, b) => (BigInt(b.totalWarPoints) > BigInt(a.totalWarPoints) ? 1 : -1))
      .map((a, i) => ({ ...a, rankPosition: i + 1 }));

    const response = { success: true, armies: ranked };

    // 3. Cache
    try {
      await getRedis().set(CACHE_KEY, JSON.stringify(response), 'EX', CACHE_TTL);
    } catch { /* ignore */ }

    return reply.send(response);
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

  // --- GET Badges List (/v1/leaderboard/badges-list) ---
  fastify.get('/badges-list', async (request, reply) => {
    // Get all badges except 'Die-Hard Loyalist' per the UI logic in ProfilePage
    const badges = await db.badge.findMany({
      where: {
        name: { not: 'Die-Hard Loyalist' }
      },
      orderBy: { createdAt: 'asc' }
    });
    return reply.send({ success: true, badges });
  });

  // --- GET Badge Leaderboard (/v1/leaderboard/badges/:key) ---
  // If user is authenticated, use verifyJWT passively or just check JWT if available
  // Fastify route handler doesn't enforce JWT, but we can verify it if authorization header exists
  fastify.get('/badges/:key', async (request, reply) => {
    const { key } = request.params as { key: string };
    
    // Find the badge
    const badge = await db.badge.findUnique({ where: { key } });
    if (!badge) return reply.notFound('Badge not found');

    // Fetch top 9 users for this badge who have progress > 0
    const topUserBadges = await db.userBadge.findMany({
      where: { badgeId: badge.id, progress: { gt: 0 } },
      take: 9,
      orderBy: [
        { progress: 'desc' },
        { earnedAt: 'asc' }
      ],
      include: {
        user: {
          include: { army: true }
        }
      }
    });

    const mapToDTO = (ub: any, rankShift: number) => ({
      id: ub.user.id,
      username: ub.user.username,
      profilePictureUrl: ub.user.profilePictureUrl,
      totalWarPoints: ub.user.totalWarPoints.toString(),
      militaryRank: calculateRank(ub.user.totalWarPoints),
      army: { id: ub.user.army.id, name: ub.user.army.name, colorHex: ub.user.army.colorHex },
      rankPosition: rankShift,
      badgeProgress: ub.progress,
      badgeTier: ub.tier
    });

    const top9 = topUserBadges.map((ub, i) => mapToDTO(ub, i + 1));

    // Resolve Authorization header if present to get current user context
    let currentUser = null;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = fastify.jwt.verify(token) as { id: string };
        const userId = decoded.id;

        const myUserBadge = await db.userBadge.findUnique({
          where: { userId_badgeId: { userId, badgeId: badge.id } },
          include: { user: { include: { army: true } } }
        });

        if (myUserBadge && myUserBadge.progress > 0) {
          // Count how many users have more progress, or same progress but earned earlier
          const myRankIndex = await db.userBadge.count({
            where: {
              badgeId: badge.id,
              progress: { gt: 0 },
              OR: [
                { progress: { gt: myUserBadge.progress } },
                {
                  progress: myUserBadge.progress,
                  earnedAt: { lt: myUserBadge.earnedAt }
                }
              ]
            }
          });
          currentUser = mapToDTO(myUserBadge, myRankIndex + 1);
        } else if (userId) { // fallback context if user exists but has 0 progress
          const myUser = await db.user.findUnique({
            where: { id: userId },
            include: { army: true }
          });
          if (myUser) {
             currentUser = {
               id: myUser.id,
               username: myUser.username,
               profilePictureUrl: myUser.profilePictureUrl,
               totalWarPoints: myUser.totalWarPoints.toString(),
               militaryRank: calculateRank(myUser.totalWarPoints),
               army: { id: myUser.army?.id, name: myUser.army?.name, colorHex: myUser.army?.colorHex },
               rankPosition: '-', // No rank
               badgeProgress: 0,
               badgeTier: 'NONE'
             };
          }
        }
      } catch (err) {
        // invalid token, ignore
      }
    }

    return reply.send({
      success: true,
      badge: {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        icon: badge.icon,
        maxProgress: badge.maxProgress
      },
      top9,
      currentUser
    });
  });
};
