import { motion } from 'framer-motion';

/* ─── 7 WARZONE MILITARY RANKS ─── */
export type RankTier =
  | 'Loyalists'
  | 'Warriors'
  | 'Die hard'
  | 'Cult'
  | 'Fan-Tastic'
  | 'Supremes'
  | 'GOAT';

interface RankStyle {
  bg: string;
  text: string;
  border: string;
  icon: string;
  glow: string;
  shortCode: string;
}

const rankStyles: Record<string, RankStyle> = {
  'Loyalists':  { bg: 'bg-gray-500/10',   text: 'text-gray-400',   border: 'border-gray-500/20',   icon: '/loyalists-badge.png', glow: '',                                                    shortCode: 'LOY' },
  'Warriors':   { bg: 'bg-blue-500/10',   text: 'text-blue-400',   border: 'border-blue-500/30',   icon: '/warriors-badge.png', glow: '',                                                    shortCode: 'WAR' },
  'Die hard':   { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', icon: '/die-hard-badge.png', glow: '',                                                    shortCode: 'DH' },
  'Cult':       { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/40', icon: '/cult-badge.png', glow: 'shadow-[0_0_8px_rgba(234,179,8,0.3)]',                shortCode: 'CULT' },
  'Fan-Tastic': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/40', icon: '/fantastic-badge.png', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.4)]',              shortCode: 'FAN' },
  'Supremes':   { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/50',    icon: '/supremes-badge.png', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.4)]',               shortCode: 'SUP' },
  'GOAT':       { bg: 'bg-yellow-400/15', text: 'text-yellow-300', border: 'border-yellow-400/60', icon: '/goat-badge.png', glow: 'shadow-[0_0_20px_rgba(255,215,0,0.5)] animate-pulse', shortCode: 'GOAT' },
};

interface RankBadgeProps {
  rank: RankTier | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const RankBadge = ({ rank, className = '', size = 'sm', animated = false }: RankBadgeProps) => {
  const style = rankStyles[rank as string] || rankStyles['Loyalists'];

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const content = (
    <span
      className={`
        inline-flex items-center font-mono uppercase tracking-wider rounded-lg border font-bold
        ${style.bg} ${style.text} ${style.border} ${style.glow}
        ${sizeClasses[size]}
        ${className}
      `}
      title={`${rank} — Level ${Object.keys(rankStyles).indexOf(rank) + 1}`}
    >
      <img src={style.icon} alt={rank as string} className={`rounded-sm object-contain ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} />
      <span>{size === 'sm' ? style.shortCode : rank}</span>
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
};

/* ─── RANK LEVEL NUMBER BADGE ─── */
interface RankLevelProps {
  level: number;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RankLevel = ({ level, color, size = 'md' }: RankLevelProps) => {
  const sizes = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <motion.div
      className={`${sizes[size]} rounded-full border-2 flex items-center justify-center font-display font-black`}
      style={{
        borderColor: color,
        backgroundColor: `${color}20`,
        color: color,
        boxShadow: `0 0 12px ${color}40`,
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 12 }}
    >
      {level}
    </motion.div>
  );
};
