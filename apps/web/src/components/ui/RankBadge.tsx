import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type RankTier = 'Recruit' | 'Corporal' | 'Sergeant' | 'Captain' | 'Commander' | 'Warlord';

interface RankBadgeProps {
  rank: RankTier | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const rankStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Recruit: { bg: 'bg-wz-dark/50', text: 'text-wz-grey', border: 'border-wz-grey/20', icon: '★' },
  Corporal: { bg: 'bg-wz-blue/10', text: 'text-wz-blue', border: 'border-wz-blue/30', icon: '★★' },
  Sergeant: { bg: 'bg-wz-green/10', text: 'text-wz-green', border: 'border-wz-green/30', icon: '★★★' },
  Captain: { bg: 'bg-wz-yellow/10', text: 'text-wz-yellow', border: 'border-wz-yellow/50', icon: '⚡' },
  Commander: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/50', icon: '♛' },
  Warlord: { bg: 'bg-wz-red/20', text: 'text-wz-red', border: 'border-wz-red shadow-[0_0_10px_rgba(255,59,48,0.5)]', icon: '👑' },
};

export const RankBadge = ({ rank, className, size = 'sm' }: RankBadgeProps) => {
  const style = rankStyles[rank as RankTier] || rankStyles.Recruit;
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded border',
        style.bg,
        style.text,
        style.border,
        sizeClasses[size],
        className
      )}
      title={`${rank} Rank`}
    >
      <span className="opacity-80 pb-[1px]">{style.icon}</span>
      {rank === 'Recruit' && size === 'sm' ? 'REC' : 
       rank === 'Corporal' && size === 'sm' ? 'CPL' :
       rank === 'Sergeant' && size === 'sm' ? 'SGT' :
       rank === 'Captain' && size === 'sm' ? 'CPT' :
       rank === 'Commander' && size === 'sm' ? 'CMD' :
       rank === 'Warlord' && size === 'sm' ? 'WRLD' : rank}
    </span>
  );
};
