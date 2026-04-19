import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from './WarzoneButton';

interface PredictionProps {
  id: string;
  creatorName: string;
  question: string;
  optionA: string;
  optionB: string;
  votesA: number;
  votesB: number;
  expiresAt: string;
  onVote: (option: 'A' | 'B') => void;
}

const BunkerPredictionCard: React.FC<PredictionProps> = ({
  id,
  creatorName,
  question,
  optionA,
  optionB,
  votesA,
  votesB,
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

  const totalVotes = votesA + votesB;
  const pctA = totalVotes > 0 ? Math.round((votesA / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;

  const handleVote = (opt: 'A' | 'B') => {
    if (hasVoted || timeLeft === 0) return;
    setHasVoted(true);
    onVote(opt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="w-full max-w-sm mx-auto bg-gradient-to-br from-gray-900 to-black border border-wz-yellow/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(255,214,10,0.1)] relative overflow-hidden"
    >
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-wz-yellow/5 blur-3xl -mr-10 -mt-10 pointer-events-none" />

      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-[10px] font-mono font-black text-wz-yellow tracking-widest uppercase mb-1 block">LIVE PREDICTION</span>
          <h4 className="text-white text-base font-display font-bold leading-tight">{question}</h4>
          <span className="text-[10px] text-white/40 font-mono italic">Triggered by @{creatorName}</span>
        </div>
        <div className="text-right">
          <div className="text-wz-yellow text-xl font-display font-black leading-none">{timeLeft}s</div>
          <div className="text-[8px] text-white/40 font-mono tracking-tighter">REMAINING</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <WarzoneButton
            variant={hasVoted ? "ghost" : "primary"}
            className="flex-1 py-3 text-xs font-bold"
            onClick={() => handleVote('A')}
            disabled={hasVoted || timeLeft === 0}
          >
            {optionA}
          </WarzoneButton>
          <WarzoneButton
            variant={hasVoted ? "ghost" : "primary"}
            className="flex-1 py-3 text-xs font-bold"
            onClick={() => handleVote('B')}
            disabled={hasVoted || timeLeft === 0}
          >
            {optionB}
          </WarzoneButton>
        </div>

        {/* Results Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono font-bold text-white/60 px-1">
            <span>{pctA}% {optionA.toUpperCase()}</span>
            <span>{pctB}% {optionB.toUpperCase()}</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex border border-white/5">
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${pctA}%` }}
              className="h-full bg-gradient-to-r from-wz-yellow to-yellow-500 shadow-[0_0_10px_rgba(255,214,10,0.3)]"
            />
          </div>
          <div className="text-center">
            <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">{totalVotes} VOTES CAST</span>
          </div>
        </div>
      </div>

      {timeLeft === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 text-center z-10"
        >
          <div className="px-6 py-3 border border-wz-yellow/50 bg-black/80 rounded-xl">
            <span className="text-wz-yellow text-sm font-display font-black tracking-widest uppercase">PREDICTION CLOSED</span>
            <p className="text-white/60 text-[10px] font-mono mt-1">THE FINAL WORD IS SEALED.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BunkerPredictionCard;
