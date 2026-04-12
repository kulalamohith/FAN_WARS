/**
 * WARZONE — Centralized Points Engine
 *
 * Every point award in the app flows through awardPoints().
 * Handles deduplication, daily caps, audit logging, and atomic DB writes.
 */

import { db } from './db';

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
  | 'BUNKER_JOIN';

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
};

// ─── Helpers ───
function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Check how many times a given source has been awarded to a user today.
 */
async function getDailyCount(userId: string, source: PointSource): Promise<number> {
  return db.pointsLog.count({
    where: {
      userId,
      source,
      createdAt: { gte: startOfToday() },
    },
  });
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
  if (amount <= 0) {
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

  return { awarded: true, amount };
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

  for (const userId of userIds) {
    const result = await awardPoints(userId, amount, source, `${sourceId}_${userId}`, metadata);
    if (result.awarded) awarded++;
    else skipped++;
  }

  return { awarded, skipped };
}
