import { useState, useCallback, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface Props {
  homeLabel: string;
  awayLabel: string;
  homeColor: string;
  awayColor: string;
  homeScore: number;  // 0–100
  onTap: (side: 'home' | 'away') => void;
  userSide: 'home' | 'away';
}

export default function TugOfWarMeter({ homeLabel, awayLabel, homeColor, awayColor, homeScore, onTap, userSide }: Props) {
  const [homeTaps, setHomeTaps] = useState(0);
  const [awayTaps, setAwayTaps] = useState(0);
  const [ripples, setRipples] = useState<{ id: number; side: 'home' | 'away'; x: number; y: number }[]>([]);
  const rippleId = useRef(0);
  const homePercent = Math.max(5, Math.min(95, homeScore));
  const awayPercent = 100 - homePercent;

  const springPercent = useSpring(homePercent, { stiffness: 80, damping: 15 });

  const addRipple = useCallback((side: 'home' | 'away', e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const id = rippleId.current++;
    setRipples(prev => [...prev.slice(-8), { id, side, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  }, []);

  const handleTap = useCallback((side: 'home' | 'away', e: React.MouseEvent | React.TouchEvent) => {
    addRipple(side, e);
    if (side === 'home') setHomeTaps(t => t + 1);
    else setAwayTaps(t => t + 1);
    onTap(side);
    if ('vibrate' in navigator) try { navigator.vibrate(12); } catch {}
  }, [addRipple, onTap]);

  return (
    <div className="tow-container">
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-white/50 uppercase">⚡ Tug-of-War</span>
      </div>

      {/* Score labels */}
      <div className="flex justify-between mb-2 px-1">
        <span className="text-xs font-mono font-black" style={{ color: homeColor }}>{homePercent}%</span>
        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest self-center">DOMINANCE</span>
        <span className="text-xs font-mono font-black" style={{ color: awayColor }}>{awayPercent}%</span>
      </div>

      {/* The Bar */}
      <div className="relative h-5 rounded-full overflow-hidden flex mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-full rounded-l-full"
          style={{ backgroundColor: homeColor, width: `${homePercent}%`, boxShadow: `0 0 20px ${homeColor}80` }}
          layout
          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        />
        <motion.div
          className="h-full rounded-r-full"
          style={{ backgroundColor: awayColor, flex: 1, boxShadow: `0 0 20px ${awayColor}80` }}
          layout
        />
        {/* Divider rope knot */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-black z-10 shadow-lg"
          style={{ left: `calc(${homePercent}% - 8px)` }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>

      {/* TAP BUTTONS */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          id={`tow-home-btn`}
          onMouseDown={(e) => handleTap('home', e)}
          onTouchStart={(e) => handleTap('home', e)}
          className="relative overflow-hidden flex flex-col items-center justify-center py-5 rounded-2xl font-display font-black text-sm select-none cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${homeColor}20, ${homeColor}08)`, border: `1.5px solid ${homeColor}50` }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {ripples.filter(r => r.side === 'home').map(r => (
            <span key={r.id} className="tow-ripple" style={{ left: `${r.x}%`, top: `${r.y}%`, background: homeColor }} />
          ))}
          <span className="text-2xl mb-1">🔥</span>
          <span style={{ color: homeColor }}>{homeLabel}</span>
          <span className="text-[10px] font-mono text-white/40 mt-1">TAPS: {homeTaps}</span>
        </motion.button>

        <motion.button
          id={`tow-away-btn`}
          onMouseDown={(e) => handleTap('away', e)}
          onTouchStart={(e) => handleTap('away', e)}
          className="relative overflow-hidden flex flex-col items-center justify-center py-5 rounded-2xl font-display font-black text-sm select-none cursor-pointer"
          style={{ background: `linear-gradient(135deg, ${awayColor}20, ${awayColor}08)`, border: `1.5px solid ${awayColor}50` }}
          whileTap={{ scale: 0.93 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {ripples.filter(r => r.side === 'away').map(r => (
            <span key={r.id} className="tow-ripple" style={{ left: `${r.x}%`, top: `${r.y}%`, background: awayColor }} />
          ))}
          <span className="text-2xl mb-1">⚡</span>
          <span style={{ color: awayColor }}>{awayLabel}</span>
          <span className="text-[10px] font-mono text-white/40 mt-1">TAPS: {awayTaps}</span>
        </motion.button>
      </div>
    </div>
  );
}
