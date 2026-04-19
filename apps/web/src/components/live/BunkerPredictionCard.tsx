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
  isComplete?: boolean;
  winnerIndex?: number;
}

const BunkerPredictionCard: React.FC<PredictionProps> = ({
  id,
  creatorName,
  question,
  options = [],
  votesCount = [],
  expiresAt,
  onVote,
  isComplete,
  winnerIndex
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showSealedOverlay, setShowSealedOverlay] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        clearInterval(timer);
        // Briefly show "Sealed" before switching to results if complete
        setShowSealedOverlay(true);
        setTimeout(() => setShowSealedOverlay(false), 2000);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const totalVotes = votesCount.reduce((a, b) => a + b, 0);
  
  const handleVote = (idx: number) => {
    if (hasVoted || timeLeft === 0 || isComplete) return;
    setHasVoted(true);
    onVote(idx);
  };

  const isTie = winnerIndex === -1 && isComplete && totalVotes > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`w-full max-w-sm mx-auto border rounded-2xl p-5 relative overflow-hidden transition-colors duration-500 ${
        isComplete 
          ? 'bg-gradient-to-br from-indigo-950 via-black to-indigo-950 border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.2)]' 
          : 'bg-gradient-to-br from-gray-900 via-black to-gray-900 border-wz-yellow/30 shadow-[0_0_40px_rgba(255,214,10,0.15)]'
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl -mr-10 -mt-10 pointer-events-none ${isComplete ? 'bg-indigo-500/10' : 'bg-wz-yellow/5'}`} />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
              isComplete ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' : 'text-wz-yellow bg-wz-yellow/10 border-wz-yellow/20'
            }`}>
              {isComplete ? 'FINAL VERDICT' : 'LIVE PREDICTION'}
            </span>
          </div>
          <h4 className="text-white text-base font-display font-bold leading-tight uppercase italic">{question}</h4>
          <span className="text-[10px] text-white/40 font-mono italic">BY @{creatorName.toUpperCase()}</span>
        </div>
        {!isComplete && (
          <div className="text-right">
            <div className="text-wz-yellow text-2xl font-display font-black leading-none drop-shadow-[0_0_10px_rgba(255,214,10,0.5)]">{timeLeft}s</div>
            <div className="text-[8px] text-white/40 font-mono tracking-tighter">TIME LEFT</div>
          </div>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        <div className={`grid gap-3 ${options.length > 2 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {options.map((opt, idx) => {
            const count = votesCount[idx] || 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isWinner = isComplete && winnerIndex === idx;
            
            return (
              <div key={idx} className="space-y-1.5">
                <WarzoneButton
                  variant={isWinner ? "primary" : "ghost"}
                  className={`w-full py-4 text-[11px] font-black tracking-widest transition-all relative overflow-hidden ${
                    isComplete 
                      ? isWinner 
                        ? 'border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' 
                        : 'opacity-40 grayscale' 
                      : (hasVoted ? 'opacity-50 grayscale cursor-default' : 'hover:scale-[1.02]')
                  }`}
                  onClick={() => handleVote(idx)}
                  disabled={hasVoted || timeLeft === 0 || isComplete}
                >
                  <span className="relative z-10">{opt.toUpperCase()}</span>
                  {isWinner && (
                    <motion.div 
                      layoutId="winner-glow"
                      className="absolute inset-0 bg-indigo-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </WarzoneButton>
                
                <div className="space-y-1 px-1">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={`h-full shadow-[0_0_10px_currentColor] ${
                        isComplete 
                          ? isWinner ? 'bg-indigo-500' : 'bg-gray-600'
                          : idx % 2 === 0 ? 'bg-gradient-to-r from-wz-yellow to-yellow-500' : 'bg-gradient-to-r from-wz-red to-red-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] font-mono font-bold text-white/40 uppercase">
                    <span className={isWinner ? 'text-indigo-400' : ''}>{pct}%</span>
                    <span>{count} VOTES</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {isComplete && (
           <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center pt-3 border-t border-white/5"
           >
              {isTie ? (
                <div className="bg-white/5 rounded-lg py-2">
                  <span className="text-white/60 text-[10px] font-mono font-black tracking-widest uppercase">STALEMATE: IT'S A TIE</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="text-[9px] text-white/30 font-mono uppercase tracking-[0.2em] mb-1">CROWD FAVORITE</div>
                   <div className="text-indigo-400 font-display font-black italic text-lg tracking-wider">
                     {options[winnerIndex!]?.toUpperCase()} TRIUMPHS
                   </div>
                </div>
              )}
           </motion.div>
        )}

        {!isComplete && (
          <div className="text-center pt-2 border-t border-white/5">
            <span className="text-[9px] text-white/20 font-mono uppercase tracking-[0.3em] font-black">TOTAL FIREPOWER: {totalVotes} VOTES</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSealedOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-[3px] flex items-center justify-center p-4 text-center z-20"
          >
            <div className="px-8 py-4 border border-wz-yellow/50 bg-black rounded-2xl shadow-[0_0_50px_rgba(255,214,10,0.2)]">
              <span className="text-wz-yellow text-sm font-display font-black tracking-widest uppercase block mb-1">PREDICTION SEALED</span>
              <p className="text-white/60 text-[10px] font-mono uppercase tracking-widest">CALCULATING VERDICT...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BunkerPredictionCard;
