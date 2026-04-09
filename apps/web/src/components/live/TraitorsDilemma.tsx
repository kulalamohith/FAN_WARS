import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  losingTeam: string;
  winningTeam: string;
  pointsReward: number;
  onAccept: () => void;
  onReject: () => void;
  timeLimit?: number; // seconds
}

export default function TraitorsDilemma({ losingTeam, winningTeam, pointsReward, onAccept, onReject, timeLimit = 30 }: Props) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [hoverAccept, setHoverAccept] = useState(false);

  useEffect(() => {
    if (decision) return;
    if (timeLeft <= 0) { onReject(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, decision, onReject]);

  const handleAccept = () => {
    setDecision('accept');
    setTimeout(onAccept, 1800);
  };

  const handleReject = () => {
    setDecision('reject');
    setTimeout(onReject, 1200);
  };

  const urgency = timeLeft / timeLimit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 80, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 60, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      className="fixed bottom-28 left-4 right-4 z-[90] mx-auto max-w-md"
    >
      <div
        className="relative overflow-hidden rounded-3xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(10,10,10,0.98), rgba(255,45,85,0.1))',
          border: '1.5px solid rgba(255,45,85,0.5)',
          boxShadow: '0 20px 60px rgba(255,45,85,0.3), 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: 'inset 0 0 40px rgba(255,45,85,0.1)' }} />

        {/* Timer bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden rounded-t-3xl">
          <motion.div
            className="h-full"
            style={{ background: `linear-gradient(90deg, #FF2D55, #FFD60A)`, originX: 0 }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: urgency }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </div>

        {!decision && (
          <>
            {/* Secret badge */}
            <div className="flex items-center gap-2 mb-4">
              <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-2xl">🤫</motion.span>
              <span className="text-[9px] font-mono font-black tracking-[0.3em] text-wz-red uppercase">Secret Offer — Eyes Only</span>
              <span className="ml-auto text-xs font-mono font-black text-wz-red animate-pulse">{timeLeft}s</span>
            </div>

            <h3 className="text-white font-display font-black text-xl mb-3 leading-tight">
              THE TRAITOR'S DILEMMA
            </h3>

            <p className="text-white/60 text-sm font-mono mb-1 leading-relaxed">
              <span className="text-wz-red font-bold">{losingTeam}</span> fans are losing badly.
            </p>
            <p className="text-white/60 text-sm font-mono mb-5 leading-relaxed">
              Switch to <span className="text-emerald-400 font-bold">{winningTeam}</span> now and earn a massive
              <span className="text-wz-yellow font-black text-base"> +{pointsReward.toLocaleString()} WP</span> payout.
            </p>

            <p className="text-white/25 text-[10px] font-mono mb-5 italic">
              ⚠️ If you switch, your faction will never know. But the shame lives forever.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                id="traitor-accept"
                onMouseEnter={() => setHoverAccept(true)}
                onMouseLeave={() => setHoverAccept(false)}
                whileTap={{ scale: 0.93 }}
                onClick={handleAccept}
                className="relative overflow-hidden py-4 rounded-2xl font-display font-black text-base text-black"
                style={{ background: 'linear-gradient(135deg, #FFD60A, #FF6B2C)' }}
              >
                {hoverAccept && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center text-xs font-mono text-black/70"
                  >
                    You traitor... 😈
                  </motion.div>
                )}
                <span className={hoverAccept ? 'opacity-0' : ''}>💰 SWITCH SIDES</span>
              </motion.button>

              <motion.button
                id="traitor-reject"
                whileTap={{ scale: 0.93 }}
                onClick={handleReject}
                className="py-4 rounded-2xl font-display font-black text-base border border-white/20 text-white/70"
              >
                🛡️ STAY LOYAL
              </motion.button>
            </div>
          </>
        )}

        {decision === 'accept' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <div className="text-5xl mb-3">💰</div>
            <h3 className="font-display font-black text-2xl text-wz-yellow mb-1">TRAITOR STATUS</h3>
            <p className="text-white/50 font-mono text-sm">+{pointsReward.toLocaleString()} WP credited. Welcome to {winningTeam}.</p>
          </motion.div>
        )}

        {decision === 'reject' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <div className="text-5xl mb-3">🛡️</div>
            <h3 className="font-display font-black text-2xl text-emerald-400 mb-1">LOYALTY INTACT</h3>
            <p className="text-white/50 font-mono text-sm">You resisted. Your faction respects you.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
