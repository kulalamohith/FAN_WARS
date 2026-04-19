import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../ui/WarzoneButton';

interface JinxProps {
  id: string;
  creatorName: string;
  prompt: string;
  countA: number;
  countB: number;
  expiresAt: string;
  winner?: string;
  isComplete?: boolean;
  onTap: (side: 'A' | 'B') => void;
}

const BunkerJinxCard: React.FC<JinxProps> = ({
  id,
  creatorName,
  prompt,
  countA,
  countB,
  expiresAt,
  winner,
  isComplete,
  onTap
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const [userSide, setUserSide] = useState<'A' | 'B' | null>(null);
  const lastTapRef = useRef<number>(0);
  const tapCountInSecRef = useRef<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) clearInterval(timer);
    }, 500);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const handleTap = (side: 'A' | 'B') => {
    if (isComplete || timeLeft === 0) return;

    // Frontend Macro Protection (15 taps/sec)
    const now = Date.now();
    if (now - lastTapRef.current < 1000) {
      if (tapCountInSecRef.current >= 15) return;
      tapCountInSecRef.current++;
    } else {
      lastTapRef.current = now;
      tapCountInSecRef.current = 1;
    }

    if (!userSide) setUserSide(side);
    onTap(side);
  };

  const total = countA + countB;
  const pctA = total > 0 ? (countA / total) * 100 : 50;
  const pctB = 100 - pctA;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-sm mx-auto bg-[#1A0B2E] border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(139,92,246,0.1)] relative overflow-hidden"
    >
      {/* Pulse Effect */}
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-purple-500/5 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="text-center mb-6">
        <span className="text-[10px] font-mono font-black text-purple-400 tracking-[0.3em] uppercase mb-2 block">🧿 JINX BATTLE 🧿</span>
        <h3 className="text-white text-xl font-display font-black leading-tight mb-1">{prompt}</h3>
        <p className="text-purple-300/50 text-[10px] font-mono">Invoked by @{creatorName}</p>
      </div>

      <div className="flex justify-between items-center gap-4 mb-8">
        <div className="flex-1 flex flex-col items-center">
           <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap('A')}
              disabled={isComplete}
              className={`w-full py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                userSide === 'A' ? 'bg-purple-600 border-white shadow-[0_0_20px_purple]' : 'bg-purple-900/40 border-purple-500/30 hover:bg-purple-800/60'
              }`}
           >
              <span className="text-white font-display font-black text-lg">JINX</span>
              <span className="text-[10px] text-white/60 font-mono">TAP FAST!</span>
           </motion.button>
           <div className="mt-2 text-white font-mono font-bold text-xl">{countA}</div>
        </div>

        <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 flex items-center justify-center relative bg-black/40">
           <span className="text-2xl font-display font-black text-wz-red">{timeLeft}</span>
           <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="32" cy="32" r="28"
                fill="none" stroke="currentColor"
                strokeWidth="4" className="text-purple-500"
                strokeDasharray="176"
                strokeDashoffset={176 - (176 * timeLeft) / 5}
                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
              />
           </svg>
        </div>

        <div className="flex-1 flex flex-col items-center">
           <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap('B')}
              disabled={isComplete}
              className={`w-full py-6 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                userSide === 'B' ? 'bg-blue-600 border-white shadow-[0_0_20px_blue]' : 'bg-blue-900/40 border-blue-500/30 hover:bg-blue-800/60'
              }`}
           >
              <span className="text-white font-display font-black text-lg text-center leading-none">ANTI-JINX</span>
              <span className="text-[10px] text-white/60 font-mono">REPEL IT!</span>
           </motion.button>
           <div className="mt-2 text-white font-mono font-bold text-xl">{countB}</div>
        </div>
      </div>

      <div className="relative h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
         <motion.div
           animate={{ width: `${pctA}%` }}
           className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_15px_purple]"
         />
      </div>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="text-4xl mb-4"
            >
              🏆
            </motion.div>
            <h4 className="text-wz-yellow text-xl font-display font-black tracking-widest uppercase mb-1">
              WINNER: {winner}
            </h4>
            <div className="text-white/60 font-mono text-xs mb-4">
              FINAL SCORE: {countA} - {countB}
            </div>
            <p className="text-[10px] text-wz-neon font-mono font-bold bg-wz-neon/10 px-3 py-1 rounded-full border border-wz-neon/20">
              REWARDS DISTRIBUTED TO WINNING CAMP
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BunkerJinxCard;
