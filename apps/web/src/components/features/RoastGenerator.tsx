import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../ui/WarzoneButton';

export default function RoastGenerator() {
  const [isComingSoon, setIsComingSoon] = useState(false);

  const handleGenerate = () => {
    setIsComingSoon(true);
    setTimeout(() => setIsComingSoon(false), 3000);
  };

  return (
    <div
      className="rounded-2xl border border-white/5 p-5 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(255,107,44,0.03), rgba(0,0,0,0.5))' }}
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#FF6B2C]/10 blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[#FF2D55]/5 blur-[60px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <h3 className="text-white font-display font-bold text-base flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🔥
          </motion.span>
          Roast Generator
        </h3>
        <span className="text-[8px] font-mono text-white/20 border border-white/10 px-2 py-0.5 rounded-full">AI-POWERED</span>
      </div>

      <p className="text-white/35 text-[11px] mb-4 relative z-10 leading-relaxed">
        Let our banter engine cook up devastating heat against your rivals. Use responsibly. 💀
      </p>

      {/* Output display */}
      <div
        className="relative h-[110px] rounded-xl p-5 mb-4 flex items-center justify-center border border-white/5"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))' }}
      >
        <AnimatePresence mode="wait">
          {!isComingSoon ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-2xl mb-2">💣</p>
              <p className="text-white/15 text-xs font-mono">Awaiting orders...</p>
            </motion.div>
          ) : (
            <motion.div
              key="soon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-[#FF6B2C] font-display font-bold text-lg mb-1 tracking-widest">COMING SOON!</p>
              <p className="text-white/40 text-[10px] font-mono uppercase">The kitchen is closed</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate button */}
      <WarzoneButton onClick={handleGenerate} disabled={isComingSoon} fullWidth className="py-3 relative">
        {isComingSoon ? "STAY TUNED 🤫" : "GENERATE BANTER 🔥"}
      </WarzoneButton>
    </div>
  );
}
