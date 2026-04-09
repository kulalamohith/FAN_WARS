/**
 * WARZONE — Duel Room
 * The live 5-minute banter battle screen.
 * Full-screen debate interface with timer, messages, and input.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDuelStore } from '../../../stores/duelStore';

const DUEL_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export default function DuelRoom() {
  const activeDuel = useDuelStore((s) => s.activeDuel);
  const sendMessage = useDuelStore((s) => s.sendMessage);
  const endDuel = useDuelStore((s) => s.endDuel);
  const closeDuelRoom = useDuelStore((s) => s.closeDuelRoom);

  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(DUEL_DURATION_MS);
  const [isEnded, setIsEnded] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer countdown
  useEffect(() => {
    if (!activeDuel?.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - activeDuel.startedAt!;
      const remaining = Math.max(0, DUEL_DURATION_MS - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0 && !isEnded) {
        setIsEnded(true);
        clearInterval(interval);
        // Auto-end after a brief delay
        setTimeout(() => endDuel(), 1500);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [activeDuel?.startedAt, isEnded, endDuel]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeDuel?.messages?.length]);

  if (!activeDuel) return null;

  const { player1, player2, topic, messages } = activeDuel;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const timePercentage = (timeLeft / DUEL_DURATION_MS) * 100;
  const isUrgent = timeLeft < 60000; // Less than 1 minute
  const isCritical = timeLeft < 15000; // Less than 15 seconds

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isEnded) return;
    sendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleEndEarly() {
    setShowEndConfirm(false);
    setIsEnded(true);
    endDuel();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex flex-col"
      style={{ background: '#050505' }}
    >
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-white/[0.06] relative overflow-hidden"
        style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>

        {/* Timer progress bar */}
        <div className="absolute bottom-0 left-0 h-[2px] transition-all duration-200"
          style={{
            width: `${timePercentage}%`,
            background: isCritical ? '#FF2D55' : isUrgent ? '#FFD60A' : 'linear-gradient(90deg, #FF2D55, #FF6B2C)',
            boxShadow: isCritical ? '0 0 15px #FF2D55' : isUrgent ? '0 0 10px #FFD60A' : '0 0 10px rgba(255,45,85,0.5)',
          }}
        />

        <div className="max-w-lg mx-auto px-4 py-3">
          {/* Top row: back + timer + topic */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setShowEndConfirm(true)} className="text-white/30 hover:text-white/60 transition-colors text-xs font-mono">
              ← EXIT
            </button>
            <div className="flex flex-col items-center">
              <div className={`flex items-center gap-2 ${isCritical ? 'animate-pulse' : ''}`}>
                <div className={`w-2 h-2 rounded-full ${isEnded ? 'bg-white/20' : isCritical ? 'bg-[#FF2D55] animate-pulse shadow-[0_0_10px_#FF2D55]' : 'bg-[#00FF88] shadow-[0_0_6px_#00FF88]'}`} />
                <span className={`font-mono font-black text-lg tabular-nums tracking-wider ${
                  isCritical ? 'text-[#FF2D55]' : isUrgent ? 'text-[#FFD60A]' : 'text-white'
                }`}>
                  {isEnded ? 'ENDED' : timeStr}
                </span>
              </div>
              <span className="text-[9px] font-mono text-white/20 tracking-widest uppercase">
                {isEnded ? 'DUEL OVER' : 'REMAINING'}
              </span>
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Players VS strip */}
          <div className="flex items-center justify-between">
            {/* Player 1 (you) */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shadow-md"
                style={{ background: `linear-gradient(135deg, ${player1.armyColor}, ${player1.armyColor}cc)` }}>
                {player1.username[0]}
              </div>
              <div>
                <p className="text-white text-xs font-display font-bold">{player1.username}</p>
                <p className="text-[9px] font-mono" style={{ color: player1.armyColor }}>{player1.army}</p>
              </div>
            </div>

            {/* VS */}
            <motion.div
              animate={!isEnded ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className="flex flex-col items-center mx-3"
            >
              <span className="text-lg">⚔️</span>
              <span className="text-[8px] font-display font-black text-white/20">VS</span>
            </motion.div>

            {/* Player 2 (opponent) */}
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-white text-xs font-display font-bold">{player2.username}</p>
                <p className="text-[9px] font-mono" style={{ color: player2.armyColor }}>{player2.army}</p>
              </div>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-black shadow-md"
                style={{ background: `linear-gradient(135deg, ${player2.armyColor}, ${player2.armyColor}cc)` }}>
                {player2.username[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topic banner */}
      <div className="shrink-0 border-b border-[#FF6B2C]/10 py-2.5 px-4" style={{ background: 'rgba(255,107,44,0.04)' }}>
        <p className="text-center text-xs font-display font-bold text-[#FF6B2C]/80 max-w-lg mx-auto leading-snug">
          📢 "{topic.text}"
        </p>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        <div className="max-w-lg mx-auto space-y-3">
          {/* Duel started indicator */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <span className="text-sm">⚔️</span>
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Duel Started — 5:00</span>
            </div>
          </div>

          <AnimatePresence>
            {messages.map((msg) => {
              const isMe = msg.senderId === player1.id;
              const color = isMe ? player1.armyColor : player2.armyColor;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Sender name */}
                    <span className="text-[9px] font-mono font-bold mb-1 px-1 tracking-wider" style={{ color: `${color}99` }}>
                      {msg.senderName}
                    </span>

                    {/* Message bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl relative overflow-hidden ${
                        isMe ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                      style={{
                        background: isMe
                          ? `linear-gradient(135deg, ${color}18, ${color}08)`
                          : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isMe ? `${color}25` : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <p className="text-white/90 text-[13px] leading-relaxed font-mono">{msg.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Time's up indicator */}
          {isEnded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="inline-flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-[#FF2D55]/10 border border-[#FF2D55]/20">
                <span className="text-2xl">🔔</span>
                <span className="text-sm font-display font-black text-[#FF2D55] tracking-wider">TIME'S UP!</span>
                <span className="text-[10px] font-mono text-white/30">Duel is being posted for community verdict...</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input ── */}
      {!isEnded && (
        <div className="shrink-0 border-t border-white/[0.06] p-3" style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Drop your take..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={280}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/15 focus:border-[#FF6B2C]/40 outline-none transition-colors"
              autoFocus
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-5 rounded-xl font-display font-bold text-sm text-white disabled:opacity-30 transition-all shrink-0"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #FF2D55, #FF6B2C)' : 'rgba(255,255,255,0.05)',
                boxShadow: input.trim() ? '0 4px 15px rgba(255,45,85,0.3)' : 'none',
              }}
            >
              SEND 🎯
            </motion.button>
          </div>
          <div className="max-w-lg mx-auto flex justify-between mt-1.5 px-1">
            <span className="text-[9px] font-mono text-white/15">{input.length}/280</span>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="text-[9px] font-mono text-[#FF2D55]/40 hover:text-[#FF2D55] transition-colors"
            >
              End Duel Early →
            </button>
          </div>
        </div>
      )}

      {/* End confirmation modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-5"
            onClick={() => setShowEndConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/80" />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative p-6 rounded-2xl border border-white/10 max-w-sm w-full"
              style={{ background: 'rgba(15,15,15,0.98)' }}
            >
              <h3 className="text-white font-display font-bold text-lg mb-2">End Duel? ⚔️</h3>
              <p className="text-white/40 text-xs font-mono mb-5">
                The duel will be posted for community verdict with the messages so far. You'll earn +100 participation points.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-mono hover:bg-white/5 transition-colors"
                >
                  Keep Going
                </button>
                <button
                  onClick={handleEndEarly}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-display font-bold transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)' }}
                >
                  End & Post
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
