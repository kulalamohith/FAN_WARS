/**
 * WARZONE — Centralized Points Engine
 *
 * Every point award in the app flows through awardPoints().
 * Handles deduplication, daily caps, audit logging, and atomic DB writes.
 *
 * Scale notes:
 *  - Daily cap checks use Redis INCR (O(1)), falling back to DB if Redis is unavailable.
 *  - batchAwardPoints uses Promise.all for parallel execution.
 */

import { db } from './db.js';
import { getRedis } from './redis.js';

// ─── Point Source Types ───
export type PointSource =
  | 'PREDICTION_CORRECT'
  | 'PREDICTION_WRONG'
  | 'DUEL_PARTICIPATE'
  | 'DUEL_WIN_BONUS'
  | 'DUEL_VOTE'
  | 'POST_CREATE'
  | 'POST_REACTION_RECEIVED'
  | 'REACT_TO_POST'
  | 'ROAST_CREATE'
  | 'ROAST_UPVOTE_RECEIVED'
  | 'CHAT_MESSAGE'
  | 'TUG_OF_WAR_TAP'
  | 'DAILY_LOGIN'
  | 'STREAK_BONUS'
  | 'BUNKER_CREATE'
  | 'BUNKER_JOIN'
  | 'TRAITOR_SWITCH'
  | 'BUNKER_PREDICTION_TRIGGER'
  | 'BUNKER_JINX_TRIGGER';

// ─── Point Values ───
export const POINT_VALUES = {
  PREDICTION_WRONG: 10,
  DUEL_PARTICIPATE: 30,
  DUEL_WIN_BONUS: 120,
  DUEL_VOTE: 5,
  POST_CREATE: 10,
  POST_REACTION_RECEIVED: 2,
  REACT_TO_POST: 1,
  ROAST_CREATE: 15,
  ROAST_UPVOTE_RECEIVED: 3,
  CHAT_MESSAGE: 2,
  TUG_OF_WAR_TAP: 1,
  DAILY_LOGIN: 25,
  STREAK_3: 50,
  STREAK_7: 150,
  STREAK_14: 400,
  STREAK_30: 1000,
  BUNKER_CREATE: 20,
  BUNKER_JOIN: 10,
} as const;

// ─── Daily Caps (max action count per day per source) ───
export const DAILY_CAPS: Partial<Record<PointSource, number>> = {
  POST_CREATE: 5,
  ROAST_CREATE: 3,
  POST_REACTION_RECEIVED: 50,
  ROAST_UPVOTE_RECEIVED: 100,
  REACT_TO_POST: 20,
  CHAT_MESSAGE: 50,
  TUG_OF_WAR_TAP: 30,
  BUNKER_CREATE: 2,
  BUNKER_JOIN: 3,
  BUNKER_PREDICTION_TRIGGER: 4,
  BUNKER_JINX_TRIGGER: 4,
};

// ─── Helpers ───
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]; // e.g. "2025-04-15"
}

/**
 * Check how many times a given source has been awarded to a user today.
 * Uses Redis INCR counter (O(1) in-memory) with DB fallback.
 */
async function getDailyCount(userId: string, source: PointSource): Promise<number> {
  try {
    const redis = getRedis();
    const key = `daily:${userId}:${source}:${todayString()}`;
    const val = await redis.get(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    // Redis unavailable — fall back to DB
    return db.pointsLog.count({
      where: { userId, source, createdAt: { gte: startOfToday() } },
    });
  }
}

/**
 * Increment the Redis daily counter after a successful award.
 * TTL = 25 hours to ensure cleanup regardless of timezone drift.
 */
async function incrementDailyCount(userId: string, source: PointSource): Promise<void> {
  try {
    const redis = getRedis();
    const key = `daily:${userId}:${source}:${todayString()}`;
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, 90000); // 25 hours in seconds
    await pipeline.exec();
  } catch {
    // Redis unavailable — counter stays in DB only, no action needed
  }
}

/**
 * Check if a specific (userId, source, sourceId) combo has already been awarded.
 */
async function isDuplicate(userId: string, source: PointSource, sourceId: string): Promise<boolean> {
  const existing = await db.pointsLog.findFirst({
    where: { userId, source, sourceId },
  });
  return !!existing;
}

// ─── Core Award Function ───

export interface AwardResult {
  awarded: boolean;
  amount: number;
  reason?: string;
}

/**
 * Award War Points to a user.
 *
 * - Checks deduplication (if sourceId provided)
 * - Checks daily cap (if configured for this source)
 * - Atomically increments totalWarPoints + creates audit log entry
 *
 * @param userId  - The user to award points to
 * @param amount  - Number of points to award
 * @param source  - The PointSource type (for cap/dedup tracking)
 * @param sourceId - Optional unique identifier for deduplication (e.g. predictionId, duelId)
 * @param metadata - Optional JSON-serializable context
 */
export async function awardPoints(
  userId: string,
  amount: number,
  source: PointSource,
  sourceId?: string,
  metadata?: Record<string, any>
): Promise<AwardResult> {
  if (amount < 0) {
    return { awarded: false, amount: 0, reason: 'invalid_amount' };
  }

  // Skip admin user
  if (userId === 'admin') {
    return { awarded: false, amount: 0, reason: 'admin_user' };
  }

  // 1. Deduplication check
  if (sourceId) {
    const alreadyAwarded = await isDuplicate(userId, source, sourceId);
    if (alreadyAwarded) {
      return { awarded: false, amount: 0, reason: 'duplicate' };
    }
  }

  // 2. Daily cap check
  const cap = DAILY_CAPS[source];
  if (cap !== undefined) {
    const todayCount = await getDailyCount(userId, source);
    if (todayCount >= cap) {
      return { awarded: false, amount: 0, reason: 'daily_cap' };
    }
  }

  // 3. Atomic write: increment points + create audit log
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { totalWarPoints: { increment: amount } },
    }),
    db.pointsLog.create({
      data: {
        userId,
        amount,
        source,
        sourceId: sourceId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),
  ]);

  // 4. Increment Redis daily counter (fire-and-forget)
  incrementDailyCount(userId, source).catch(() => {});

  return { awarded: true, amount };
}

/**
 * Get daily count for a source (exported for usage checks)
 */
export async function getDailyCountForUser(userId: string, source: PointSource): Promise<number> {
  return getDailyCount(userId, source);
}

/**
 * Spend War Points.
 * 
 * - Checks if user has enough points.
 * - Atomically decrements totalWarPoints + creates audit log entry.
 */
export async function spendPoints(
  userId: string,
  amount: number,
  source: string,
  sourceId?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; reason?: string }> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, reason: 'user_not_found' };

  if (BigInt(user.totalWarPoints) < BigInt(amount)) {
    return { success: false, reason: 'insufficient_points' };
  }

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { totalWarPoints: { decrement: amount } },
    }),
    db.pointsLog.create({
      data: {
        userId,
        amount: -amount, // Negative for tracking
        source,
        sourceId: sourceId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    }),
  ]);

  return { success: true };
}

/**
 * Batch award points to multiple users for the same source.
 * Used for prediction resolution where many users earn at once.
 */
export async function batchAwardPoints(
  userIds: string[],
  amount: number,
  source: PointSource,
  sourceId: string,
  metadata?: Record<string, any>
): Promise<{ awarded: number; skipped: number }> {
  let awarded = 0;
  let skipped = 0;

  // Parallel execution — all users awarded concurrently instead of serially.
  // For 5k users this is the difference between ~25s and ~2s.
  const results = await Promise.all(
    userIds.map(userId =>
      awardPoints(userId, amount, source, `${sourceId}_${userId}`, metadata)
    )
  );

  for (const result of results) {
    if (result.awarded) awarded++;
    else skipped++;
  }

  return { awarded, skipped };
}
