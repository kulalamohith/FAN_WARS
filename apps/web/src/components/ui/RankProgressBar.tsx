import { motion } from 'framer-motion';

interface RankProgressBarProps {
  currentRank: {
    level: number;
    name: string;
    shortCode: string;
    color: string;
    icon: string;
  };
  nextRank: {
    name: string;
    shortCode: string;
    minPoints: number;
    icon: string;
  } | null;
  totalWarPoints: number;
  progress: number; // 0 to 1
  pointsToNext: number;
}

export default function RankProgressBar({
  currentRank,
  nextRank,
  totalWarPoints,
  progress,
  pointsToNext,
}: RankProgressBarProps) {
  const isMaxRank = !nextRank;
  const pct = Math.round(progress * 100);

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: currentRank.color }} />
        <p className="text-[10px] font-mono text-white/30 tracking-[0.15em] uppercase font-bold">
          Rank Progress
        </p>
      </div>

      {/* Rank labels row */}
      <div className="flex items-center justify-between mb-3">
        {/* Current rank */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border"
            style={{
              borderColor: `${currentRank.color}50`,
              background: `linear-gradient(135deg, ${currentRank.color}20, transparent)`,
              boxShadow: `0 0 12px ${currentRank.color}20`,
            }}
          >
            {currentRank.icon}
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm leading-tight">
              LV.{currentRank.level}
            </p>
            <p
              className="text-[10px] font-mono tracking-wider font-bold"
              style={{ color: currentRank.color }}
            >
              {currentRank.name}
            </p>
          </div>
        </div>

        {/* Next rank */}
        {nextRank && (
          <div className="flex items-center gap-2.5 opacity-40 hover:opacity-70 transition-opacity">
            <div className="text-right">
              <p className="text-white/50 font-mono text-[8px] tracking-[0.15em] uppercase">Next</p>
              <p className="text-white/40 font-display text-[10px] font-bold">{nextRank.name}</p>
            </div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base border border-white/10 bg-white/[0.03]">
              {nextRank.icon}
            </div>
          </div>
        )}
      </div>

      {/* Progress bar container */}
      <div className="relative">
        <div
          className="relative w-full h-4 rounded-full overflow-hidden border"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.06)',
          }}
        >
          {/* Fill bar */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: isMaxRank
                ? `linear-gradient(90deg, ${currentRank.color}, #FFD700, ${currentRank.color})`
                : `linear-gradient(90deg, ${currentRank.color}60, ${currentRank.color})`,
              boxShadow: `0 0 16px ${currentRank.color}50, inset 0 1px 0 rgba(255,255,255,0.2)`,
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${Math.max(progress * 100, 3)}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />

          {/* Shimmer shine */}
          {!isMaxRank && (
            <motion.div
              className="absolute inset-y-0 w-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              animate={{ left: ['-15%', '115%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            />
          )}

          {/* Max rank infinite shimmer */}
          {isMaxRank && (
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ left: ['-20%', '120%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }}
            />
          )}
        </div>

        {/* Percentage indicator */}
        <motion.div
          className="absolute -top-0.5 flex flex-col items-center"
          style={{ left: `${Math.max(progress * 100, 3)}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <div
            className="w-2 h-5 rounded-full border"
            style={{
              backgroundColor: currentRank.color,
              borderColor: '#111',
              boxShadow: `0 0 8px ${currentRank.color}80`,
            }}
          />
        </motion.div>
      </div>

      {/* Bottom stats row */}
      <div className="flex justify-between items-center mt-2.5">
        <div className="flex items-center gap-2">
          <p
            className="text-xs font-mono font-bold"
            style={{ color: currentRank.color }}
          >
            {totalWarPoints.toLocaleString()} XP
          </p>
          {!isMaxRank && (
            <p className="text-white/15 font-mono text-[9px]">
              / {(totalWarPoints + pointsToNext).toLocaleString()}
            </p>
          )}
        </div>
        <p className="font-mono text-[10px] font-bold" style={{ color: `${currentRank.color}90` }}>
          {isMaxRank ? '🏆 MAX RANK' : `${pct}%`}
        </p>
      </div>

      {/* Points needed callout */}
      {!isMaxRank && (
        <motion.div
          className="mt-2 px-3 py-1.5 rounded-lg text-center"
          style={{
            background: `${currentRank.color}08`,
            border: `1px solid ${currentRank.color}15`,
          }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-white/25 font-mono text-[9px]">
            <span className="text-white/40 font-bold">{pointsToNext.toLocaleString()}</span> XP to next rank
          </p>
        </motion.div>
      )}
    </div>
  );
}
