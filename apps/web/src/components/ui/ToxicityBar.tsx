import { motion } from 'framer-motion';

interface Props {
  homeScore: number;
  awayScore: number;
  homeColor?: string;
  awayColor?: string;
  homeLabel?: string;
  awayLabel?: string;
}

export default function ToxicityBar({
  homeScore, awayScore,
  homeColor = '#FF2D55', awayColor = '#007AFF',
  homeLabel = 'HOME', awayLabel = 'AWAY',
}: Props) {
  const total = homeScore + awayScore || 1;
  const homePercent = Math.round((homeScore / total) * 100);
  const awayPercent = 100 - homePercent;

  return (
    <div className="w-full">
      {/* Labels */}
      <div className="flex justify-between text-xs font-mono font-bold mb-1.5">
        <span style={{ color: homeColor }}>{homeLabel} {homePercent}%</span>
        <span className="text-wz-muted uppercase tracking-widest text-[10px]">Toxicity</span>
        <span style={{ color: awayColor }}>{awayPercent}% {awayLabel}</span>
      </div>

      {/* Bar */}
      <div className="relative h-3 rounded-full overflow-hidden bg-wz-card border border-wz-border/50">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: homeColor }}
          initial={{ width: '50%' }}
          animate={{ width: `${homePercent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 rounded-full"
          style={{ backgroundColor: awayColor }}
          initial={{ width: '50%' }}
          animate={{ width: `${awayPercent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />

        {/* Center clash line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-wz-bg z-10"
          style={{ left: `${homePercent}%`, transform: 'translateX(-50%)' }}
        />
      </div>
    </div>
  );
}
