import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Phase = 'idle' | 'jinxing' | 'defending' | 'result';

interface Props {
  targetPlayer: string;
  targetTeam: string;
  mode: 'jinx' | 'defend';
  onComplete: (success: boolean, taps: number) => void;
  onClose: () => void;
}

export default function JinxMinigame({ targetPlayer, targetTeam, mode, onComplete, onClose }: Props) {
  const DURATION = 5000;
  const TARGET_TAPS = 20;

  const [taps, setTaps] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [shakeActive, setShakeActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);

  const startMinigame = useCallback(() => {
    setPhase(mode === 'jinx' ? 'jinxing' : 'defending');
    setTaps(0);
    setTimeLeft(DURATION);
    startRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        setPhase('result');
      }
    }, 100);
  }, [mode]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleTap = useCallback(() => {
    if (phase !== 'jinxing' && phase !== 'defending') return;
    setTaps(t => {
      const next = t + 1;
      if (next >= TARGET_TAPS) {
        clearInterval(intervalRef.current!);
        setPhase('result');
        onComplete(true, next);
      }
      return next;
    });
    setShakeActive(true);
    setTimeout(() => setShakeActive(false), 80);
    if ('vibrate' in navigator) try { navigator.vibrate(8); } catch {}
  }, [phase, onComplete]);

  const progress = Math.min(1, taps / TARGET_TAPS);
  const timeProgress = timeLeft / DURATION;
  const success = taps >= TARGET_TAPS;
  const isActive = phase === 'jinxing' || phase === 'defending';

  const accentColor = mode === 'jinx' ? '#BF5AF2' : '#00FF88';
  const bgColor = mode === 'jinx' ? 'rgba(191,90,242,0.08)' : 'rgba(0,255,136,0.08)';
  const icon = mode === 'jinx' ? '🧿' : '🛡️';
  const label = mode === 'jinx' ? `JINXING ${targetPlayer}` : `DEFENDING`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-lg"
    >
      <motion.div
        animate={shakeActive ? { x: [-3, 3, -2, 2, 0] } : {}}
        transition={{ duration: 0.08 }}
        className="w-full max-w-sm rounded-3xl p-7 relative overflow-hidden"
        style={{ background: bgColor, border: `2px solid ${accentColor}50` }}
      >
        {/* Glow backdrop */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 60px ${accentColor}20` }} />

        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white/30 hover:text-white text-xs font-mono">✕</button>

        {phase === 'idle' && (
          <div className="text-center">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-white font-display font-black text-xl mb-2">{label}</h3>
            <p className="text-white/50 text-sm font-mono mb-2">
              {mode === 'jinx' ? `Curse ${targetPlayer} from ${targetTeam}!` : `Defend your player!`}
            </p>
            <p className="text-white/30 text-xs font-mono mb-6">Tap {TARGET_TAPS}× in 5 seconds to {mode === 'jinx' ? 'jinx' : 'protect'} them</p>
            <motion.button
              id="jinx-start-btn"
              whileTap={{ scale: 0.95 }}
              onClick={startMinigame}
              className="w-full py-4 rounded-2xl font-display font-black text-lg text-black"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)` }}
            >
              {mode === 'jinx' ? '🧿 CAST JINX' : '🛡️ DEFEND NOW'}
            </motion.button>
          </div>
        )}

        {isActive && (
          <div className="text-center">
            <div className="text-4xl mb-2">{icon}</div>
            <h3 className="text-white font-display font-black text-lg mb-1">{label}</h3>

            {/* Time Bar */}
            <div className="relative h-2 rounded-full bg-white/10 mb-4 overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: timeProgress > 0.3 ? accentColor : '#FF2D55', width: `${timeProgress * 100}%` }}
                animate={{ width: `${timeProgress * 100}%` }}
              />
            </div>

            {/* Tap count */}
            <div className="mb-4">
              <span className="font-display font-black text-5xl" style={{ color: accentColor }}>{taps}</span>
              <span className="text-white/30 font-mono text-lg">/{TARGET_TAPS}</span>
            </div>

            {/* Tap progress ring */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
                  animate={{ strokeDashoffset: `${2 * Math.PI * 42 * (1 - progress)}` }}
                  style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">{icon}</div>
            </div>

            <motion.button
              id="jinx-tap-btn"
              onMouseDown={handleTap}
              onTouchStart={handleTap}
              className="w-full py-5 rounded-2xl font-display font-black text-2xl text-black select-none cursor-pointer"
              style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`, boxShadow: `0 0 30px ${accentColor}60` }}
              whileTap={{ scale: 0.94 }}
            >
              TAP! TAP! TAP!
            </motion.button>
          </div>
        )}

        {phase === 'result' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="text-7xl mb-4"
            >
              {success ? (mode === 'jinx' ? '🧿' : '🛡️') : '💨'}
            </motion.div>
            <h3 className="font-display font-black text-2xl mb-2" style={{ color: success ? accentColor : '#FF2D55' }}>
              {success ? (mode === 'jinx' ? 'JINX CAST!' : 'DEFENDED!') : 'FAILED!'}
            </h3>
            <p className="text-white/40 font-mono text-sm mb-6">
              {success
                ? `${taps} taps — ${mode === 'jinx' ? `${targetPlayer} is cursed!` : 'Your player is safe!'}`
                : `Only ${taps}/${TARGET_TAPS} taps — not enough power!`}
            </p>
            <button id="jinx-close-btn" onClick={onClose} className="w-full py-3 rounded-xl border border-white/20 text-white/60 font-mono text-sm">
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
