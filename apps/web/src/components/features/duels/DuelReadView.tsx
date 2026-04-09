/**
 * WARZONE — Duel Read View
 * Full conversation reader with per-player reactions.
 * Users read the debate and react to decide the winner.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REACTION_CONFIG, getReactionScore, getTotalReactions } from '../../../lib/duelTopics';
import { useDuelStore, type Duel } from '../../../stores/duelStore';

export default function DuelReadView() {
  const viewingDuel = useDuelStore((s) => s.viewingDuel);
  const closeViewDuel = useDuelStore((s) => s.closeViewDuel);
  const reactToDuel = useDuelStore((s) => s.reactToDuel);

  const [reactingTo, setReactingTo] = useState<'player1' | 'player2' | null>(null);

  if (!viewingDuel) return null;

  const { id, player1, player2, topic, messages, status, player1Reactions, player2Reactions, verdictAt, myReactions, winner } = viewingDuel;

  const p1Score = getReactionScore(player1Reactions);
  const p2Score = getReactionScore(player2Reactions);
  const totalP1 = getTotalReactions(player1Reactions);
  const totalP2 = getTotalReactions(player2Reactions);
  const totalAll = totalP1 + totalP2 || 1;

  const now = Date.now();
  const timeRemaining = verdictAt ? Math.max(0, verdictAt - now) : 0;
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const isVoting = status === 'voting' && timeRemaining > 0;
  const isCompleted = status === 'completed' || (status === 'voting' && timeRemaining <= 0);

  const effectiveWinner = winner || (isCompleted ? (p1Score >= p2Score ? player1.id : player2.id) : null);

  function handleReact(player: 'player1' | 'player2', reaction: string) {
    reactToDuel(id, player, reaction);
    setReactingTo(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: '#050505' }}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] p-4" style={{ background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button onClick={closeViewDuel} className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors">← BACK</button>
            {isVoting && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFD60A]/10 border border-[#FFD60A]/20">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-[#FFD60A]">⏳ {hoursLeft}h {minutesLeft}m to verdict</span>
              </div>
            )}
            {isCompleted && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00FF88]/10 border border-[#00FF88]/20">
                <span className="text-[9px] font-mono font-bold text-[#00FF88]">🏆 VERDICT DELIVERED</span>
              </div>
            )}
            <span className="text-white/15 text-[10px] font-mono">{messages.length} msgs</span>
          </div>

          {/* Topic */}
          <p className="text-white font-display font-bold text-base text-center leading-snug mb-3">📢 "{topic.text}"</p>

          {/* Scoreboard */}
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                  style={{ background: player1.armyColor }}>
                  {player1.username[0]}
                </div>
                <span className={`text-xs font-display font-bold ${effectiveWinner === player1.id ? 'text-[#00FF88]' : 'text-white'}`}>
                  {player1.username} {effectiveWinner === player1.id ? '👑' : ''}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[9px] font-mono text-[#00FF88]">+{player1Reactions.facts + player1Reactions.fire + player1Reactions.brutal}</span>
                <span className="text-[9px] font-mono text-white/15">|</span>
                <span className="text-[9px] font-mono text-[#FF2D55]">-{player1Reactions.toxic + player1Reactions.ltake}</span>
              </div>
            </div>

            {/* Tug bar */}
            <div className="w-24 flex flex-col items-center gap-1">
              <div className="w-full flex h-1.5 rounded-full overflow-hidden bg-white/[0.04]">
                <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${(totalP1 / totalAll) * 100}%`, background: player1.armyColor }} />
                <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${(totalP2 / totalAll) * 100}%`, background: player2.armyColor }} />
              </div>
              <span className="text-[8px] font-mono text-white/20">{totalP1 + totalP2} reactions</span>
            </div>

            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`text-xs font-display font-bold ${effectiveWinner === player2.id ? 'text-[#00FF88]' : 'text-white'}`}>
                  {effectiveWinner === player2.id ? '👑 ' : ''}{player2.username}
                </span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-black"
                  style={{ background: player2.armyColor }}>
                  {player2.username[0]}
                </div>
              </div>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[9px] font-mono text-[#00FF88]">+{player2Reactions.facts + player2Reactions.fire + player2Reactions.brutal}</span>
                <span className="text-[9px] font-mono text-white/15">|</span>
                <span className="text-[9px] font-mono text-[#FF2D55]">-{player2Reactions.toxic + player2Reactions.ltake}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.map((msg, i) => {
            const isP1 = msg.senderId === player1.id;
            const player = isP1 ? player1 : player2;
            const color = player.armyColor;
            const align = isP1 ? 'justify-start' : 'justify-end';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex ${align}`}
              >
                <div className={`max-w-[80%] flex flex-col ${isP1 ? 'items-start' : 'items-end'}`}>
                  <span className="text-[9px] font-mono font-bold mb-1 px-1" style={{ color: `${color}80` }}>
                    {msg.senderName}
                  </span>
                  <div
                    className={`px-4 py-3 rounded-2xl ${isP1 ? 'rounded-bl-md' : 'rounded-br-md'}`}
                    style={{
                      background: `linear-gradient(135deg, ${color}12, ${color}06)`,
                      border: `1px solid ${color}20`,
                    }}
                  >
                    <p className="text-white/85 text-[13px] leading-relaxed font-mono">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* End marker */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">⏱️ End of Duel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reaction Footer */}
      {isVoting && (
        <div className="shrink-0 border-t border-white/[0.06] p-4" style={{ background: 'rgba(8,8,8,0.95)' }}>
          <div className="max-w-lg mx-auto">
            <p className="text-center text-[10px] font-mono text-white/30 mb-3 tracking-wider uppercase">Who won this debate? React below</p>

            <div className="grid grid-cols-2 gap-3">
              {/* React to Player 1 */}
              <div>
                <button
                  onClick={() => setReactingTo(reactingTo === 'player1' ? null : 'player1')}
                  className="w-full py-2.5 rounded-xl border text-xs font-display font-bold transition-all"
                  style={{
                    borderColor: reactingTo === 'player1' ? `${player1.armyColor}50` : 'rgba(255,255,255,0.06)',
                    background: reactingTo === 'player1' ? `${player1.armyColor}10` : 'rgba(255,255,255,0.02)',
                    color: reactingTo === 'player1' ? player1.armyColor : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {player1.username} {myReactions.player1 ? `• ${REACTION_CONFIG.find(r => r.key === myReactions.player1)?.emoji || ''}` : ''}
                </button>

                <AnimatePresence>
                  {reactingTo === 'player1' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-1.5 mt-2 flex-wrap"
                    >
                      {REACTION_CONFIG.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => handleReact('player1', r.key)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                            myReactions.player1 === r.key
                              ? 'border-white/20 bg-white/10'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                          style={{ color: r.color }}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-bold">{r.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* React to Player 2 */}
              <div>
                <button
                  onClick={() => setReactingTo(reactingTo === 'player2' ? null : 'player2')}
                  className="w-full py-2.5 rounded-xl border text-xs font-display font-bold transition-all"
                  style={{
                    borderColor: reactingTo === 'player2' ? `${player2.armyColor}50` : 'rgba(255,255,255,0.06)',
                    background: reactingTo === 'player2' ? `${player2.armyColor}10` : 'rgba(255,255,255,0.02)',
                    color: reactingTo === 'player2' ? player2.armyColor : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {player2.username} {myReactions.player2 ? `• ${REACTION_CONFIG.find(r => r.key === myReactions.player2)?.emoji || ''}` : ''}
                </button>

                <AnimatePresence>
                  {reactingTo === 'player2' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-1.5 mt-2 flex-wrap"
                    >
                      {REACTION_CONFIG.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => handleReact('player2', r.key)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-mono transition-all ${
                            myReactions.player2 === r.key
                              ? 'border-white/20 bg-white/10'
                              : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                          }`}
                          style={{ color: r.color }}
                        >
                          <span>{r.emoji}</span>
                          <span className="font-bold">{r.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completed verdict banner */}
      {isCompleted && (
        <div className="shrink-0 border-t border-[#00FF88]/10 p-4" style={{ background: 'rgba(0,255,136,0.03)' }}>
          <div className="max-w-lg mx-auto text-center">
            <p className="text-[#00FF88] font-display font-black text-sm tracking-wider">
              🏆 {effectiveWinner === player1.id ? player1.username : player2.username} WON THE DEBATE
            </p>
            <p className="text-white/20 text-[10px] font-mono mt-1">
              Score: {p1Score > p2Score ? p1Score : p2Score} vs {p1Score > p2Score ? p2Score : p1Score} • {totalP1 + totalP2} total reactions
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
