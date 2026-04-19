import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../ui/WarzoneButton';

interface PredictionProps {
  id: string;
  creatorName: string;
  question: string;
  options: string[];
  votesCount: number[];
  expiresAt: string;
  onVote: (choiceIndex: number) => void;
}

const BunkerPredictionCard: React.FC<PredictionProps> = ({
  id,
  creatorName,
  question,
  options = [],
  votesCount = [],
  expiresAt,
  onVote
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const totalVotes = votesCount.reduce((a, b) => a + b, 0);
  
  const handleVote = (idx: number) => {
    if (hasVoted || timeLeft === 0) return;
    setHasVoted(true);
    onVote(idx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-sm mx-auto bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-wz-yellow/30 rounded-2xl p-5 shadow-[0_0_40px_rgba(255,214,10,0.15)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-wz-yellow/5 blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-black text-wz-yellow tracking-widest uppercase px-2 py-0.5 bg-wz-yellow/10 rounded-full border border-wz-yellow/20">LIVE PREDICTION</span>
          </div>
          <h4 className="text-white text-base font-display font-bold leading-tight uppercase italic">{question}</h4>
          <span className="text-[10px] text-white/40 font-mono italic">BY @{creatorName.toUpperCase()}</span>
        </div>
        <div className="text-right">
          <div className="text-wz-yellow text-2xl font-display font-black leading-none drop-shadow-[0_0_10px_rgba(255,214,10,0.5)]">{timeLeft}s</div>
          <div className="text-[8px] text-white/40 font-mono tracking-tighter">TIME LEFT</div>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className={`grid gap-2 ${options.length > 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {options.map((opt, idx) => {
            const count = votesCount[idx] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            return (
              <div key={idx} className="space-y-1">
                <WarzoneButton
                  variant={hasVoted ? (idx === 0 ? "primary" : "ghost") : "primary"}
                  className={`w-full py-4 text-[11px] font-black tracking-widest transition-all ${hasVoted ? 'opacity-50 grayscale cursor-default' : 'hover:scale-[1.02] active:scale-95'}`}
                  onClick={() => handleVote(idx)}
                  disabled={hasVoted || timeLeft === 0}
                >
                  {opt.toUpperCase()}
                </WarzoneButton>
                
                {/* Visual Bar inside the card loop if we want per-option bars */}
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={`h-full bg-gradient-to-r ${idx % 2 === 0 ? 'from-wz-yellow to-yellow-500' : 'from-wz-red to-red-500'} shadow-[0_0_10px_currentColor]`}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-mono font-bold text-white/40 px-1 uppercase">
                  <span>{pct}%</span>
                  <span>{count} VOTES</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2 border-t border-white/5">
          <span className="text-[9px] text-white/20 font-mono uppercase tracking-[0.3em] font-black">TOTAL FIREPOWER: {totalVotes} VOTES</span>
        </div>
      </div>

      {timeLeft === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center p-4 text-center z-20"
        >
          <div className="px-8 py-4 border border-wz-yellow/50 bg-black rounded-2xl shadow-[0_0_50px_rgba(255,214,10,0.2)]">
            <span className="text-wz-yellow text-sm font-display font-black tracking-widest uppercase block mb-1">PREDICTION SEALED</span>
            <p className="text-white/60 text-[10px] font-mono uppercase tracking-widest">NO MORE ENTRIES PERMITTED.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BunkerPredictionCard;
