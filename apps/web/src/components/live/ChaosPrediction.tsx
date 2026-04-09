import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  question: string;
  optionA: string;
  optionB: string;
  multiplier: number;
  secondsLeft: number;
  onVote: (option: 'A' | 'B') => void;
  voted: boolean;
  votedOption?: 'A' | 'B';
  votesA?: number;
  votesB?: number;
}

export default function ChaosPrediction({
  question, optionA, optionB, multiplier, secondsLeft, onVote, voted, votedOption, votesA = 50, votesB = 50
}: Props) {
  const [pulseRed, setPulseRed] = useState(false);
  const total = votesA + votesB || 1;
  const pctA = Math.round((votesA / total) * 100);
  const pctB = 100 - pctA;
  const urgent = secondsLeft <= 10;

  useEffect(() => {
    if (urgent) {
      const interval = setInterval(() => setPulseRed(p => !p), 300);
      return () => clearInterval(interval);
    }
  }, [urgent]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: -40, rotateX: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(255,214,10,0.08), rgba(255,45,85,0.05))',
        border: `1.5px solid ${urgent ? (pulseRed ? 'rgba(255,45,85,0.9)' : 'rgba(255,214,10,0.7)') : 'rgba(255,214,10,0.3)'}`,
        boxShadow: urgent ? '0 0 30px rgba(255,45,85,0.3)' : '0 0 20px rgba(255,214,10,0.1)',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      {/* 30-second chaos badge */}
      <div className="flex items-center gap-2 mb-3">
        <motion.span animate={{ rotate: [0, -10, 10, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xl">💥</motion.span>
        <span className="text-[9px] font-mono font-black tracking-[0.3em] text-wz-yellow uppercase">30-Second Chaos Window</span>
        <span className={`ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full ${urgent ? 'bg-wz-red text-white animate-pulse' : 'bg-wz-yellow/20 text-wz-yellow'}`}>
          {secondsLeft}s
        </span>
      </div>

      {/* Multiplier badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/30">
          {multiplier.toFixed(1)}x MULTIPLIER
        </span>
      </div>

      {/* Question */}
      <p className="text-white font-display font-black text-lg leading-tight mb-4">{question}</p>

      {!voted ? (
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            id="chaos-option-a"
            whileTap={{ scale: 0.92 }}
            onClick={() => onVote('A')}
            className="relative py-4 rounded-xl font-display font-black text-sm text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #00C6FF, #0072FF)', boxShadow: '0 4px 20px rgba(0,114,255,0.4)' }}
          >
            <span className="relative z-10">{optionA}</span>
          </motion.button>
          <motion.button
            id="chaos-option-b"
            whileTap={{ scale: 0.92 }}
            onClick={() => onVote('B')}
            className="relative py-4 rounded-xl font-display font-black text-sm text-white overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #FF6B2C, #FF2D55)', boxShadow: '0 4px 20px rgba(255,45,85,0.4)' }}
          >
            <span className="relative z-10">{optionB}</span>
          </motion.button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-center text-[10px] font-mono text-white/40 mb-3">
            YOU VOTED: <span className="text-wz-yellow font-black">{votedOption === 'A' ? optionA : optionB}</span>
          </p>
          {/* Live vote bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/60 w-24 truncate">{optionA}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${pctA}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-blue-400 w-8 text-right">{pctA}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-white/60 w-24 truncate">{optionB}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div className="h-full rounded-full bg-wz-red" initial={{ width: 0 }} animate={{ width: `${pctB}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-wz-red w-8 text-right">{pctB}%</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
