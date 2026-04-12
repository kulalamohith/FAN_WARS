/**
 * WARZONE — Profile Routes (/v1/profile)
 *
 * GET  /me            → Full profile with rank details, badges, stats, XP progress
 * GET  /:username     → View another user's public profile
 * POST /badges/pin    → Pin/unpin a badge on the Dog Tag (max 3 pinned)
 * POST /daily-claim   → Claim daily login reward + streak bonuses
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { getRankInfo, getRankProgress, WARZONE_RANKS } from '../../../lib/ranks';
import { awardPoints, POINT_VALUES } from '../../../lib/points';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';

export const profileRoutes: FastifyPluginAsync = async (fastify) => {

  // ═══════════════════════════════════════════════
  //  MY PROFILE  —  GET /me
  // ═══════════════════════════════════════════════
  fastify.get(
    '/me',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const user = await db.user.findUnique({
        where: { id: request.user.id },
        include: {
          army: true,
          userBadges: {
            include: { badge: true },
            orderBy: { earnedAt: 'desc' },
          },
        },
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      // Rank calculation
      const rankInfo = getRankInfo(user.totalWarPoints);
      const rankProgress = getRankProgress(user.totalWarPoints);

      // Gather stats
      const [
        totalPredictions,
        correctPredictions,
        totalRoasts,
        totalPosts,
        intraTeamRank,
        globalTeamRankCount
      ] = await Promise.all([
        db.predictionLedger.count({ where: { userId: user.id } }),
        db.predictionLedger.count({ where: { userId: user.id, pointsAwarded: { gt: 0 } } }),
        db.roast.count({ where: { userId: user.id } }),
        db.post.count({ where: { userId: user.id } }),
        db.user.count({ where: { armyId: user.armyId, totalWarPoints: { gt: user.totalWarPoints } } }),
        db.army.count({ where: { seasonScore: { gt: user.army.seasonScore } } }),
      ]);

      // All badges (including ones user hasn't earned)
      const allBadges = await db.badge.findMany({ orderBy: { createdAt: 'asc' } });

      const badgesWithProgress = allBadges.map((badge) => {
        const userBadge = user.userBadges.find((ub) => ub.badgeId === badge.id);
        return {
          key: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          maxProgress: badge.maxProgress,
          earned: !!userBadge,
          tier: userBadge?.tier || null,
          progress: userBadge?.progress || 0,
          isPinned: userBadge?.isPinned || false,
          earnedAt: userBadge?.earnedAt || null,
          userBadgeId: userBadge?.id || null,
        };
      });

      const predictionAccuracy = totalPredictions > 0
        ? Math.round((correctPredictions / totalPredictions) * 100)
        : 0;

      return reply.send({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          // @ts-ignore
          profilePictureUrl: user.profilePictureUrl || null,
          // @ts-ignore
          bio: user.bio || null,
        },
        army: {
          id: user.army.id,
          name: user.army.name,
          colorHex: user.army.colorHex,
        },
        rank: {
          level: rankInfo.level,
          name: rankInfo.rank,
          shortCode: rankInfo.shortCode,
          color: rankInfo.color,
          glowColor: rankInfo.glowColor,
          icon: rankInfo.icon,
          unlockDescription: rankInfo.unlockDescription,
          totalWarPoints: Number(user.totalWarPoints),
          nextRank: rankProgress.nextRank
            ? {
                name: rankProgress.nextRank.rank,
                shortCode: rankProgress.nextRank.shortCode,
                minPoints: rankProgress.nextRank.minPoints,
                icon: rankProgress.nextRank.icon,
              }
            : null,
          progress: rankProgress.progress,
          pointsToNext: rankProgress.pointsNeededForNext - rankProgress.pointsInCurrentLevel,
        },
        badges: badgesWithProgress,
        stats: {
          totalWarPoints: Number(user.totalWarPoints),
          totalPredictions,
          correctPredictions,
          predictionAccuracy,
          totalRoasts,
          totalPosts,
          loginStreak: user.loginStreak,
          memberSince: user.createdAt,
          intraTeamRank: intraTeamRank + 1,
          globalTeamRank: globalTeamRankCount + 1,
        },
        allRanks: WARZONE_RANKS,
      });
    }
  );

  // ═══════════════════════════════════════════════
  //  USER SEARCH  —  GET /search
  // ═══════════════════════════════════════════════
  fastify.get(
    '/search',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { q } = request.query as { q?: string };
      
      if (!q || q.trim() === '') {
        return reply.send({ users: [] });
      }

      // Find users matching query. SQLite doesn't support mode: 'insensitive' on contains natively.
      const users = await db.user.findMany({
        where: {
          username: { contains: q },
          id: { not: request.user.id },
        },
        include: {
          army: true,
        },
        take: 10,
      });

      const results = users.map((u) => {
        const rankInfo = getRankInfo(u.totalWarPoints);
        return {
          id: u.id,
          username: u.username,
          army: u.army?.name || 'Recruit',
          armyColor: u.army?.colorHex || '#FFFFFF',
          rank: rankInfo.shortCode || rankInfo.rank,
          wins: 0, // Mock stats for now, until duels history tracking is fully added
          losses: 0,
        };
      });

      return reply.send({ users: results });
    }
  );

  // ═══════════════════════════════════════════════
  //  PUBLIC PROFILE  —  GET /:username
  // ═══════════════════════════════════════════════
  fastify.get(
    '/:username',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const { username } = request.params as { username: string };

      const user = await db.user.findUnique({
        where: { username },
        include: {
          army: true,
          userBadges: {
            where: { isPinned: true },
            include: { badge: true },
          },
        },
      });

      if (!user) {
        return reply.notFound('User not found');
      }

      const rankInfo = getRankInfo(user.totalWarPoints);

      return reply.send({
        user: {
          id: user.id,
          username: user.username,
          createdAt: user.createdAt,
          // @ts-ignore
          profilePictureUrl: user.profilePictureUrl || null,
          // @ts-ignore
          bio: user.bio || null,
        },
        army: {
          id: user.army.id,
          name: user.army.name,
          colorHex: user.army.colorHex,
        },
        rank: {
          level: rankInfo.level,
          name: rankInfo.rank,
          shortCode: rankInfo.shortCode,
          color: rankInfo.color,
          icon: rankInfo.icon,
          totalWarPoints: Number(user.totalWarPoints),
        },
        pinnedBadges: user.userBadges.map((ub) => ({
          key: ub.badge.key,
          name: ub.badge.name,
          icon: ub.badge.icon,
          tier: ub.tier,
        })),
      });
    }
  );

  // ═══════════════════════════════════════════════
  //  PIN/UNPIN BADGE  —  POST /badges/pin
  // ═══════════════════════════════════════════════
  const pinSchema = z.object({
    badgeKey: z.string(),
    pin: z.boolean(),
  });

  fastify.post(
    '/badges/pin',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const parsed = pinSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest('Invalid payload');
      }

      const { badgeKey, pin } = parsed.data;
      const userId = request.user.id;

      // Find the badge
      const badge = await db.badge.findUnique({ where: { key: badgeKey } });
      if (!badge) {
        return reply.notFound('Badge not found');
      }

      // Find user's badge entry
      const userBadge = await db.userBadge.findUnique({
        where: { userId_badgeId: { userId, badgeId: badge.id } },
      });

      if (!userBadge) {
        return reply.badRequest('You haven\'t earned this badge yet');
      }

      // Check pin limit (max 3)
      if (pin) {
        const pinnedCount = await db.userBadge.count({
          where: { userId, isPinned: true },
        });

        if (pinnedCount >= 3 && !userBadge.isPinned) {
          return reply.badRequest('Maximum 3 badges can be pinned. Unpin one first.');
        }
      }

      // Toggle pin
      await db.userBadge.update({
        where: { id: userBadge.id },
        data: { isPinned: pin },
      });

      return reply.send({
        success: true,
        message: pin ? `${badge.name} pinned to Dog Tag!` : `${badge.name} unpinned.`,
      });
    }
  );

  // ═══════════════════════════════════════════════
  //  UPDATE PROFILE  —  PUT /me
  // ═══════════════════════════════════════════════
  const updateProfileSchema = z.object({
    bio: z.string().max(200).optional(),
  });

  fastify.put(
    '/me',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const parsed = updateProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.badRequest('Invalid payload');
      }

      const { bio } = parsed.data;

      await db.user.update({
        where: { id: request.user.id },
        data: { bio } as any,
      });

      return reply.send({ success: true, message: 'Profile updated' });
    }
  );

  // ═══════════════════════════════════════════════
  //  UPLOAD DP  —  POST /upload
  // ═══════════════════════════════════════════════
  fastify.post(
    '/upload',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const req = request as any;
      const data = await req.file();
      if (!data) {
        return reply.badRequest('No file uploaded');
      }

      // We only accept images
      if (!data.mimetype.startsWith('image/')) {
        return reply.badRequest('Only image files are allowed');
      }

      const ext = path.extname(data.filename) || '.png';
      const fileName = `${request.user.id}-${randomUUID()}${ext}`;
      const uploadPath = path.join(__dirname, '..', '..', '..', '..', 'public', 'uploads', fileName);

      await pipeline(data.file, fs.createWriteStream(uploadPath));

      const fileUrl = `/uploads/${fileName}`;

      await db.user.update({
        where: { id: request.user.id },
        data: { profilePictureUrl: fileUrl } as any,
      });

      return reply.send({ success: true, url: fileUrl });
    }
  );

  // ═══════════════════════════════════════════════
  //  DAILY LOGIN CLAIM  —  POST /daily-claim
  // ═══════════════════════════════════════════════
  fastify.post(
    '/daily-claim',
    { preValidation: [fastify.verifyJWT] },
    async (request, reply) => {
      const userId = request.user.id;

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { lastLoginAt: true, loginStreak: true },
      });

      if (!user) return reply.notFound('User not found');

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

      // Check if already claimed today
      if (user.lastLoginAt && user.lastLoginAt >= todayStart) {
        return reply.send({
          success: false,
          alreadyClaimed: true,
          loginStreak: user.loginStreak,
          message: 'Daily reward already claimed today.',
        });
      }

      // Determine streak continuity
      let newStreak: number;
      if (user.lastLoginAt && user.lastLoginAt >= yesterdayStart) {
        // Logged in yesterday — continue streak
        newStreak = user.loginStreak + 1;
      } else {
        // Streak broken or first login — start at 1
        newStreak = 1;
      }

      // Award base daily login points
      let totalAwarded = 0;
      const dailyResult = await awardPoints(userId, POINT_VALUES.DAILY_LOGIN, 'DAILY_LOGIN', `daily_${todayStart.toISOString()}`);
      if (dailyResult.awarded) totalAwarded += dailyResult.amount;

      // Check streak milestones and award bonus
      let streakBonus = 0;
      let streakMilestone: string | null = null;

      const STREAK_MILESTONES: { day: number; bonus: number; label: string }[] = [
        { day: 3, bonus: POINT_VALUES.STREAK_3, label: '3-Day Streak 🔥' },
        { day: 7, bonus: POINT_VALUES.STREAK_7, label: '7-Day Streak 🔥🔥' },
        { day: 14, bonus: POINT_VALUES.STREAK_14, label: '14-Day Streak 🔥🔥🔥' },
        { day: 30, bonus: POINT_VALUES.STREAK_30, label: '30-Day Streak 👑' },
      ];

      for (const milestone of STREAK_MILESTONES) {
        if (newStreak === milestone.day) {
          const bonusResult = await awardPoints(
            userId,
            milestone.bonus,
            'STREAK_BONUS',
            `streak_${milestone.day}_${todayStart.toISOString()}`
          );
          if (bonusResult.awarded) {
            streakBonus = milestone.bonus;
            streakMilestone = milestone.label;
            totalAwarded += bonusResult.amount;
          }
          break;
        }
      }

      // Update user login tracking
      await db.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: now,
          loginStreak: newStreak,
        },
      });

      return reply.send({
        success: true,
        alreadyClaimed: false,
        pointsAwarded: POINT_VALUES.DAILY_LOGIN,
        streakBonus,
        streakMilestone,
        totalAwarded,
        loginStreak: newStreak,
        message: streakMilestone
          ? `+${totalAwarded} WP! ${streakMilestone} bonus!`
          : `+${POINT_VALUES.DAILY_LOGIN} WP — Day ${newStreak} streak!`,
      });
    }
  );
};
