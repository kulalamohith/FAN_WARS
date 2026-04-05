/**
 * WARZONE — Profile Routes (/v1/profile)
 *
 * GET  /me          → Full profile with rank details, badges, stats, XP progress
 * GET  /:username   → View another user's public profile
 * POST /badges/pin  → Pin/unpin a badge on the Dog Tag (max 3 pinned)
 */

import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../../../lib/db';
import { getRankInfo, getRankProgress, WARZONE_RANKS } from '../../../lib/ranks';
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
      const uploadPath = path.join(__dirname, '..', '..', '..', 'public', 'uploads', fileName);

      await pipeline(data.file, fs.createWriteStream(uploadPath));

      const fileUrl = `/uploads/${fileName}`;

      await db.user.update({
        where: { id: request.user.id },
        data: { profilePictureUrl: fileUrl } as any,
      });

      return reply.send({ success: true, url: fileUrl });
    }
  );
};
