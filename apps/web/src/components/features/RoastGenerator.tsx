import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../ui/WarzoneButton';

const ROASTS = [
  "Their trophy cabinet is just a mirror showing their disappointment. 🏆🤡",
  "They have more excuses than actual wins this season. 📉",
  "Playing them is like a bye week, but with more drama. 🎭",
  "Imagine having that payroll and still being at the bottom of the table. 💸🤦‍♂️",
  "Their fans celebrate a boundary like they just won the World Cup. 🌍🏏",
  "Our net run rate is higher than their team spirit. 📊🔥",
  "They should practice batting instead of making reels. 📱🏏",
  "Even their cheerleaders look more competitive than the team. 💃",
  "Last time they won a final, smartphones didn't exist. 📵",
  "Their best player is the one sitting on the bench. 🪑",
  "They play cricket like it's a practice match at the local park. 🏞️",
  "Their DRS reviews have better accuracy than their batting. 📺",
];

const SCAN_STEPS = [
  { text: "Scanning rival weaknesses...", icon: "🔍" },
  { text: "Analyzing previous chokes...", icon: "📊" },
  { text: "Calculating emotional damage...", icon: "💀" },
  { text: "Weaponizing pure FIRE...", icon: "🔥" },
];

export default function RoastGenerator() {
  const [roast, setRoast] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setRoast(null);
    setStepIndex(0);
    setCopied(false);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < SCAN_STEPS.length) {
        setStepIndex(currentStep);
      } else {
        clearInterval(interval);
        const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];
        setRoast(randomRoast);
        setIsGenerating(false);
      }
    }, 700);
  };

  const handleCopy = () => {
    if (!roast) return;
    navigator.clipboard.writeText(roast).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="relative min-h-[110px] rounded-xl p-5 mb-4 flex items-center justify-center border border-white/5"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.3))' }}
      >
        <AnimatePresence mode="wait">
          {!isGenerating && !roast && (
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
          )}

          {isGenerating && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Scanning animation */}
              <div className="relative">
                <div className="w-10 h-10 border-2 border-[#FF6B2C] border-t-transparent rounded-full animate-spin" />
                <motion.span
                  key={stepIndex}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center text-lg"
                >
                  {SCAN_STEPS[stepIndex].icon}
                </motion.span>
              </div>
              <motion.p
                key={stepIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#FF6B2C] text-xs font-mono font-bold"
              >
                {SCAN_STEPS[stepIndex].text}
              </motion.p>
              {/* Progress dots */}
              <div className="flex gap-1.5">
                {SCAN_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      background: i <= stepIndex ? '#FF6B2C' : 'rgba(255,255,255,0.1)',
                      boxShadow: i <= stepIndex ? '0 0 8px #FF6B2C' : 'none',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {roast && !isGenerating && (
            <motion.div
              key="roast"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-center"
            >
              <p className="text-white font-medium text-base sm:text-lg italic leading-relaxed drop-shadow-lg">
                "{roast}"
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="mt-4 text-[10px] uppercase tracking-widest font-bold px-4 py-1.5 rounded-full transition-all cursor-pointer"
                style={{
                  color: copied ? '#00FF88' : '#FF6B2C',
                  border: `1px solid ${copied ? '#00FF8840' : '#FF6B2C40'}`,
                  background: copied ? '#00FF8810' : '#FF6B2C10',
                }}
              >
                {copied ? '✓ COPIED!' : '📋 COPY TO CLIPBOARD'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate button */}
      <WarzoneButton onClick={handleGenerate} disabled={isGenerating} fullWidth className="py-3 relative">
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            COOKING...
          </span>
        ) : roast ? "GENERATE ANOTHER 🎲" : "GENERATE BANTER 🔥"}
      </WarzoneButton>
    </div>
  );
}
