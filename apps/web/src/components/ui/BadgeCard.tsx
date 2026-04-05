import { motion } from 'framer-motion';

interface BadgeCardProps {
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  maxProgress: number;
  earned: boolean;
  tier: string | null;
  progress: number;
  isPinned: boolean;
  onClick?: () => void;
}

const tierMeta: Record<string, { color: string; glow: string }> = {
  BRONZE: { color: '#CD7F32', glow: 'rgba(205,127,50,0.25)' },
  SILVER: { color: '#C0C0C0', glow: 'rgba(192,192,192,0.25)' },
  GOLD:   { color: '#FFD700', glow: 'rgba(255,215,0,0.3)' },
};

export default function BadgeCard({
  name,
  icon,
  maxProgress,
  earned,
  tier,
  progress,
  isPinned,
  onClick,
}: BadgeCardProps) {
  const meta = tier ? tierMeta[tier] : null;
  const progressPercent = maxProgress > 0 ? Math.min((progress / maxProgress) * 100, 100) : 0;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="relative group cursor-pointer w-full"
    >
      <div
        className="relative p-3 rounded-xl text-center transition-all duration-300 overflow-hidden"
        style={{
          background: earned ? '#111' : '#0c0c0c',
          border: earned && meta
            ? `1.5px solid ${meta.color}30`
            : '1px solid rgba(255,255,255,0.04)',
          boxShadow: earned && meta
            ? `0 2px 16px ${meta.glow}`
            : 'none',
        }}
      >
        {/* Pinned indicator */}
        {isPinned && (
          <div
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center z-10"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              boxShadow: '0 2px 6px rgba(255,215,0,0.3)',
            }}
          >
            <span className="text-[6px]">📌</span>
          </div>
        )}

        {/* Gold shimmer */}
        {earned && tier === 'GOLD' && (
          <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
            <motion.div
              className="absolute inset-y-0 w-10 bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent"
              animate={{ left: ['-20%', '120%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* Badge icon */}
        <div
          className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-xl ${
            earned ? 'border-[1.5px]' : 'border border-white/[0.05]'
          }`}
          style={earned && meta ? {
            borderColor: `${meta.color}60`,
            boxShadow: `0 0 12px ${meta.glow}`,
            background: `radial-gradient(circle at 30% 30%, ${meta.color}15, transparent 70%)`,
          } : {
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          {earned ? (
            <span className="drop-shadow-sm">{icon}</span>
          ) : (
            <span className="opacity-25 text-base">🔒</span>
          )}
        </div>

        {/* Name */}
        <p className={`font-display font-bold text-[10px] leading-tight mb-0.5 ${
          earned ? 'text-white/90' : 'text-white/15'
        }`}>
          {name}
        </p>

        {/* Tier label */}
        {earned && tier && meta && (
          <p className="text-[7px] font-mono tracking-[0.12em] mb-1.5 font-bold" style={{ color: `${meta.color}90` }}>
            {tier}
          </p>
        )}

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full bg-white/[0.04] overflow-hidden mt-1">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: earned && meta
                ? `linear-gradient(90deg, ${meta.color}60, ${meta.color})`
                : 'rgba(255,255,255,0.06)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </div>
        <p className={`text-[7px] font-mono mt-0.5 ${earned ? 'text-white/20' : 'text-white/08'}`}>
          {progress}/{maxProgress}
        </p>
      </div>
    </motion.button>
  );
}
