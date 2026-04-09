import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatMessage } from '../../stores/warRoomStore';

interface WarRoomChatProps {
  messages: ChatMessage[];
  bunkerMessages: ChatMessage[];
  myArmyId: string;
  myUserId: string;
  chatInput: string;
  onInputChange: (v: string) => void;
  onSend: (mode: 'global' | 'bunker') => void;
  onReaction: (type: string) => void;
  isConnected: boolean;
  homeLabel: string;
  awayLabel: string;
  homeColor: string;
  awayColor: string;
}

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'laugh', emoji: '😂' },
  { type: 'rage', emoji: '😤' },
  { type: 'clap', emoji: '👏' },
  { type: 'skull', emoji: '💀' },
  { type: 'crown', emoji: '👑' },
  { type: 'mindblown', emoji: '🤯' },
  { type: 'boo', emoji: '👎' },
];

const VIP_COLORS = ['#FFD60A', '#00FF88', '#BF5AF2', '#FF6B2C'];

export default function WarRoomChat({
  messages, bunkerMessages, myArmyId, myUserId,
  chatInput, onInputChange, onSend, onReaction,
  isConnected, homeLabel, awayLabel, homeColor, awayColor
}: WarRoomChatProps) {
  const [tab, setTab] = useState<'global' | 'bunker'>('global');
  const [reactionBurst, setReactionBurst] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const burstId = useRef(0);

  const displayMessages = tab === 'global' ? messages : bunkerMessages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages.length]);

  const handleReaction = (type: string, emoji: string) => {
    onReaction(type);
    const id = burstId.current++;
    const x = 20 + Math.random() * 60;
    setReactionBurst(prev => [...prev.slice(-5), { id, emoji, x }]);
    setTimeout(() => setReactionBurst(prev => prev.filter(r => r.id !== id)), 1500);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Floating reaction bursts */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <AnimatePresence>
          {reactionBurst.map(r => (
            <motion.span
              key={r.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], y: -80, scale: [0.5, 1.3, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute bottom-16 text-2xl"
              style={{ left: `${r.x}%` }}
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
        <button
          id="chat-tab-global"
          onClick={() => setTab('global')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            tab === 'global' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
          }`}
        >
          🌐 No Man's Land
        </button>
        <button
          id="chat-tab-bunker"
          onClick={() => setTab('bunker')}
          className={`flex-1 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
            tab === 'bunker' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'
          }`}
        >
          🔒 War Bunker
        </button>
      </div>

      {/* Tab description */}
      <p className="text-[9px] font-mono text-white/20 text-center mb-3">
        {tab === 'global'
          ? '💥 Global chaos — enemies lurk. Winners get VIP highlights.'
          : `🔐 Encrypted team-only bunker — ${tab === 'bunker' ? 'allies only' : ''}`}
      </p>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[180px] max-h-[280px]">
        <AnimatePresence initial={false}>
          {displayMessages.length === 0 ? (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/20 text-xs font-mono text-center py-8">
              {tab === 'global' ? 'No Man\'s Land is quiet... for now.' : 'Your bunker awaits. Speak freely.'}
            </motion.p>
          ) : (
            [...displayMessages].reverse().map((msg, i) => {
              const isMe = msg.userId === myUserId;
              const isAlly = msg.armyId === myArmyId;
              const isVip = i < 3 && tab === 'global'; // Top 3 recent = VIP highlight in global
              const accentColor = isMe ? '#00FF88' : isAlly ? homeColor : awayColor;

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: isAlly ? -12 : 12 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className={`text-sm py-2 px-3 rounded-xl border-l-[3px] flex flex-col gap-0.5 ${
                    isVip
                      ? 'bg-gradient-to-r from-white/8 to-transparent ring-1 ring-wz-yellow/20'
                      : isAlly ? 'bg-white/4' : 'bg-wz-red/6'
                  }`}
                  style={{ borderLeftColor: isVip ? '#FFD60A' : accentColor }}
                >
                  <div className="flex items-center gap-2">
                    {isVip && <span className="text-[8px] font-mono text-wz-yellow font-black">⭐ VIP</span>}
                    <span className="font-bold font-mono text-[11px]" style={{ color: accentColor }}>
                      {msg.username}
                    </span>
                    {isMe && <span className="text-[8px] font-mono text-white/20">YOU</span>}
                  </div>
                  <span className="text-white/80 text-xs leading-relaxed">{msg.text}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="mt-3 space-y-2">
        {/* Reaction Bar */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {REACTIONS.map(r => (
            <motion.button
              key={r.type}
              id={`reaction-${r.type}`}
              whileTap={{ scale: 0.8 }}
              onClick={() => handleReaction(r.type, r.emoji)}
              className="flex-shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base hover:bg-white/10 transition-colors"
            >
              {r.emoji}
            </motion.button>
          ))}
        </div>

        {/* Text Input Row */}
        <div className="flex gap-2">
          <input
            id="war-room-chat-input"
            type="text"
            placeholder={tab === 'bunker' ? '🔒 Encrypted message...' : '💬 Declare war...'}
            value={chatInput}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSend(tab)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-wz-neon/40 transition-all"
          />
          <motion.button
            id="chat-send-btn"
            whileTap={{ scale: 0.9 }}
            onClick={() => onSend(tab)}
            className="px-4 py-2.5 rounded-xl font-bold text-black text-sm"
            style={{ background: isConnected ? 'linear-gradient(135deg, #00FF88, #007AFF)' : 'rgba(255,255,255,0.1)' }}
          >
            ⚔️
          </motion.button>
        </div>
      </div>
    </div>
  );
}
