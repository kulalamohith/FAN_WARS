/**
 * WARZONE — Military Rank System
 *
 * 7 crazy ranks from Battle Fodder to Supreme Banter Overlord.
 * Maps total War Points → rank level, name, color, unlocks.
 */

export interface RankInfo {
  level: number;
  rank: string;
  shortCode: string;
  minPoints: number;
  color: string;
  glowColor: string;
  icon: string;
  unlockDescription: string;
}

export const WARZONE_RANKS: RankInfo[] = [
  {
    level: 1,
    rank: 'Battle Fodder',
    shortCode: 'BF',
    minPoints: 0,
    color: '#6B7280',
    glowColor: 'rgba(107,114,128,0.4)',
    icon: '💀',
    unlockDescription: 'Basic Dog Tag ID card + default uniform. Daily streak counter visible.',
  },
  {
    level: 2,
    rank: 'Sledger Recruit',
    shortCode: 'SR',
    minPoints: 500,
    color: '#3B82F6',
    glowColor: 'rgba(59,130,246,0.4)',
    icon: '🗣️',
    unlockDescription: 'First cosmetic flair — camo patterns on avatar + basic Soundboard access.',
  },
  {
    level: 3,
    rank: 'Chaos Corporal',
    shortCode: 'CC',
    minPoints: 1500,
    color: '#F97316',
    glowColor: 'rgba(249,115,22,0.4)',
    icon: '🔥',
    unlockDescription: 'Custom Battle Cry voice line + 10% Banter Coins multiplier from predictions.',
  },
  {
    level: 4,
    rank: 'Tug-of-War Sergeant',
    shortCode: 'TWS',
    minPoints: 5000,
    color: '#EAB308',
    glowColor: 'rgba(234,179,8,0.4)',
    icon: '⚔️',
    unlockDescription: 'Command squads in Tug-of-War (your taps weigh more) + 1v1 Sniper Duel callouts.',
  },
  {
    level: 5,
    rank: 'Jinxed Legionnaire',
    shortCode: 'JL',
    minPoints: 10000,
    color: '#A855F7',
    glowColor: 'rgba(168,85,247,0.4)',
    icon: '🎭',
    unlockDescription: 'Premium Jinx effects + Legion Badge Slot on profile card.',
  },
  {
    level: 6,
    rank: "Traitor's Bane",
    shortCode: 'TB',
    minPoints: 25000,
    color: '#EF4444',
    glowColor: 'rgba(239,68,68,0.5)',
    icon: '🩸',
    unlockDescription: 'Traitor Detection Radar + double coin payout on betrayal punishments.',
  },
  {
    level: 7,
    rank: 'Supreme Banter Overlord',
    shortCode: 'SBO',
    minPoints: 50000,
    color: '#FFD700',
    glowColor: 'rgba(255,215,0,0.6)',
    icon: '👑',
    unlockDescription: 'God Mode: 3x taps in Tug-of-War + animated throne background + Pantheon of Overlords.',
  },
];

/**
 * Returns the full rank info based on the user's Total War Points.
 */
export function getRankInfo(totalWarPoints: bigint | number | string): RankInfo {
  const points = Number(BigInt(totalWarPoints));

  for (let i = WARZONE_RANKS.length - 1; i >= 0; i--) {
    if (points >= WARZONE_RANKS[i].minPoints) {
      return WARZONE_RANKS[i];
    }
  }

  return WARZONE_RANKS[0];
}

/**
 * Returns the rank name string (backward compatible).
 */
export function calculateRank(totalWarPoints: bigint | number | string): string {
  return getRankInfo(totalWarPoints).rank;
}

/**
 * Returns progress info toward the next rank.
 */
export function getRankProgress(totalWarPoints: bigint | number | string) {
  const points = Number(BigInt(totalWarPoints));
  const currentRank = getRankInfo(points);
  const currentIndex = WARZONE_RANKS.findIndex((r) => r.level === currentRank.level);
  const nextRank = WARZONE_RANKS[currentIndex + 1] || null;

  const pointsInCurrentLevel = points - currentRank.minPoints;
  const pointsNeededForNext = nextRank
    ? nextRank.minPoints - currentRank.minPoints
    : 0;
  const progress = nextRank
    ? Math.min(pointsInCurrentLevel / pointsNeededForNext, 1)
    : 1; // Max rank

  return {
    currentRank,
    nextRank,
    totalPoints: points,
    pointsInCurrentLevel,
    pointsNeededForNext,
    progress,
  };
}
