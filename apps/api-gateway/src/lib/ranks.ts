/**
 * WARZONE — Ranks Utility
 * 
 * Maps total War Points to a Military Rank hierarchy.
 */

export const WARZONE_RANKS = [
  { rank: 'Recruit', minPoints: 0 },
  { rank: 'Corporal', minPoints: 500 },
  { rank: 'Sergeant', minPoints: 1500 },
  { rank: 'Captain', minPoints: 5000 },
  { rank: 'Commander', minPoints: 10000 },
  { rank: 'Warlord', minPoints: 25000 },
];

/**
 * Returns the correct rank name based on the user's Total War Points.
 * @param totalWarPoints Number or BigInt of points
 */
export function calculateRank(totalWarPoints: bigint | number | string): string {
  const points = BigInt(totalWarPoints);
  
  // Iterate backwards to find the highest rank achieved
  for (let i = WARZONE_RANKS.length - 1; i >= 0; i--) {
    if (points >= BigInt(WARZONE_RANKS[i].minPoints)) {
      return WARZONE_RANKS[i].rank;
    }
  }
  
  return 'Recruit'; // Default fallback
}
