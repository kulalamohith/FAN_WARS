import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SOUNDS = [
  { id: 'horn', emoji: '📣', label: 'Horn', color: '#FFD60A' },
  { id: 'clap', emoji: '👏', label: 'Clap', color: '#00FF88' },
  { id: 'boo', emoji: '👎', label: 'BOO!', color: '#FF2D55' },
  { id: 'siren', emoji: '🚨', label: 'Siren', color: '#FF6B2C' },
  { id: 'laugh', emoji: '😂', label: 'LOL', color: '#007AFF' },
  { id: 'skull', emoji: '💀', label: 'RIP', color: '#BF5AF2' },
  { id: 'fire', emoji: '🔥', label: 'FIRE', color: '#FF6B2C' },
  { id: 'crown', emoji: '👑', label: 'King', color: '#FFD60A' },
  { id: 'explode', emoji: '💥', label: 'BOOM', color: '#FF2D55' },
];

interface SoundboardProps {
  onPress: (soundId: string) => void;
  opponentTeam: string;
  disrupted: boolean; // when opponents spam us
}

export default function Soundboard({ onPress, opponentTeam, disrupted }: SoundboardProps) {
  const [spamCounts, setSpamCounts] = useState<Record<string, number>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const handlePress = useCallback((id: string) => {
    setSpamCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setActiveId(id);
    
    clearTimeout(timeoutRef.current[id]);
    timeoutRef.current[id] = setTimeout(() => setActiveId(null), 300);

    if ('vibrate' in navigator) try { navigator.vibrate(20); } catch {}
    onPress(id);
  }, [onPress]);

  return (
    <div className="soundboard-container">
      {disrupted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-3 px-3 py-2 rounded-xl text-center font-mono text-[10px] font-bold text-wz-red border border-wz-red/30 bg-wz-red/10 animate-pulse"
        >
          ⚠️ {opponentTeam} fans are flooding your section!
        </motion.div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-mono font-bold tracking-[0.3em] text-white/40 uppercase">🔊 Soundboard / War Cries</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {SOUNDS.map(sound => {
          const count = spamCounts[sound.id] || 0;
          const isActive = activeId === sound.id;
          const isHot = count >= 5;

          return (
            <motion.button
              key={sound.id}
              id={`soundboard-${sound.id}`}
              whileTap={{ scale: 0.87 }}
              onClick={() => handlePress(sound.id)}
              className="relative overflow-hidden flex flex-col items-center justify-center py-3 rounded-xl select-none cursor-pointer"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${sound.color}30, ${sound.color}10)`
                  : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isActive ? sound.color : isHot ? sound.color + '60' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isActive ? `0 0 20px ${sound.color}50` : undefined,
                transition: 'all 0.15s ease',
              }}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            >
              {isHot && (
                <div
                  className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black"
                  style={{ background: sound.color, color: 'black' }}
                >
                  {count}
                </div>
              )}
              <span className="text-xl mb-0.5">{sound.emoji}</span>
              <span className="text-[9px] font-mono font-bold" style={{ color: isActive ? sound.color : 'rgba(255,255,255,0.5)' }}>
                {sound.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
