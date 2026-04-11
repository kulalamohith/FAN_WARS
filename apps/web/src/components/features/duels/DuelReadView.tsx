/**
 * WARZONE — Duel Read View
 * Full conversation reader with VOTE + HYPE system.
 * Users read the debate, vote for one player, and hype the debate.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDuelStore } from '../../../stores/duelStore';
import { api } from '../../../lib/api';

export default function DuelReadView() {
  const viewingDuel = useDuelStore((s) => s.viewingDuel);
  const closeViewDuel = useDuelStore((s) => s.closeViewDuel);
  const queryClient = useQueryClient();

  if (!viewingDuel) return null;

  const { id, player1, player2, topic, messages, status, verdictAt, winner, player1Votes, player2Votes, myVote, hypeCount, myHype } = viewingDuel;

  // Local state for optimistic updates
  const [localP1Votes, setLocalP1Votes] = useState(player1Votes);
  const [localP2Votes, setLocalP2Votes] = useState(player2Votes);
  const [localMyVote, setLocalMyVote] = useState(myVote);
  const [localHype, setLocalHype] = useState(hypeCount);
  const [localMyHype, setLocalMyHype] = useState(myHype);

  const totalVotes = localP1Votes + localP2Votes || 1;
  const p1Pct = Math.round((localP1Votes / totalVotes) * 100);
  const p2Pct = 100 - p1Pct;

  const now = Date.now();
  const timeRemaining = verdictAt ? Math.max(0, verdictAt - now) : 0;
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  const isVoting = status === 'voting' && timeRemaining > 0;
  const isCompleted = status === 'completed' || (status === 'voting' && timeRemaining <= 0);

  const effectiveWinner = winner || (isCompleted ? (localP1Votes >= localP2Votes ? player1.id : player2.id) : null);

  function handleVote(player: 'player1' | 'player2') {
    // Optimistic update
    const prev = localMyVote;
    if (prev === 'player1') setLocalP1Votes((v) => Math.max(0, v - 1));
    if (prev === 'player2') setLocalP2Votes((v) => Math.max(0, v - 1));
    if (prev === player) {
      setLocalMyVote(null);
    } else {
      if (player === 'player1') setLocalP1Votes((v) => v + 1);
      else setLocalP2Votes((v) => v + 1);
      setLocalMyVote(player);
    }
    // API call
    api.duels.vote(id, player)
      .then(() => queryClient.invalidateQueries({ queryKey: ['duels'] }))
      .catch((err) => console.error('Vote failed:', err));
  }

  function handleHype() {
    if (localMyHype) {
      setLocalHype((h) => Math.max(0, h - 1));
      setLocalMyHype(false);
    } else {
      setLocalHype((h) => h + 1);
      setLocalMyHype(true);
    }
    api.duels.hype(id)
      .then(() => queryClient.invalidateQueries({ queryKey: ['duels'] }))
      .catch((err) => console.error('Hype failed:', err));
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

          {/* Scoreboard with vote counts */}
          <div className="flex items-center gap-3">
            {/* Player 1 */}
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
              <span className="text-lg font-display font-black text-white">{localP1Votes}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">votes ({p1Pct}%)</span>
            </div>

            {/* VS + Vote Bar */}
            <div className="w-24 flex flex-col items-center gap-1">
              <span className="text-white/15 text-[10px] font-display font-black">VS</span>
              <div className="w-full flex h-2 rounded-full overflow-hidden bg-white/[0.04]">
                <div className="h-full rounded-l-full transition-all duration-500" style={{ width: `${p1Pct}%`, background: player1.armyColor }} />
                <div className="h-full rounded-r-full transition-all duration-500" style={{ width: `${p2Pct}%`, background: player2.armyColor }} />
              </div>
              <span className="text-[8px] font-mono text-white/20">{localP1Votes + localP2Votes} votes</span>
            </div>

            {/* Player 2 */}
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
              <span className="text-lg font-display font-black text-white">{localP2Votes}</span>
              <span className="text-[9px] font-mono text-white/30 ml-1">votes ({p2Pct}%)</span>
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

      {/* ── Vote + Hype Footer ── */}
      {isVoting && (
        <div className="shrink-0 border-t border-white/[0.06] p-4" style={{ background: 'rgba(8,8,8,0.95)' }}>
          <div className="max-w-lg mx-auto">
            <p className="text-center text-[10px] font-mono text-white/30 mb-3 tracking-wider uppercase">Who won this debate? Vote below</p>

            <div className="flex gap-3 items-stretch">
              {/* Vote Buttons */}
              <div className="flex-1 flex gap-2">
                {/* Vote Player 1 */}
                <button
                  onClick={() => handleVote('player1')}
                  className="flex-1 py-3 rounded-xl border text-xs font-display font-bold transition-all relative overflow-hidden"
                  style={{
                    borderColor: localMyVote === 'player1' ? `${player1.armyColor}80` : 'rgba(255,255,255,0.06)',
                    background: localMyVote === 'player1' ? `${player1.armyColor}20` : 'rgba(255,255,255,0.02)',
                    color: localMyVote === 'player1' ? player1.armyColor : 'rgba(255,255,255,0.5)',
                    boxShadow: localMyVote === 'player1' ? `0 0 20px ${player1.armyColor}20` : 'none',
                  }}
                >
                  {localMyVote === 'player1' && <span className="mr-1">✓</span>}
                  {player1.username}
                  <span className="block text-[9px] font-mono mt-0.5 opacity-60">{localP1Votes} votes</span>
                </button>

                {/* Vote Player 2 */}
                <button
                  onClick={() => handleVote('player2')}
                  className="flex-1 py-3 rounded-xl border text-xs font-display font-bold transition-all relative overflow-hidden"
                  style={{
                    borderColor: localMyVote === 'player2' ? `${player2.armyColor}80` : 'rgba(255,255,255,0.06)',
                    background: localMyVote === 'player2' ? `${player2.armyColor}20` : 'rgba(255,255,255,0.02)',
                    color: localMyVote === 'player2' ? player2.armyColor : 'rgba(255,255,255,0.5)',
                    boxShadow: localMyVote === 'player2' ? `0 0 20px ${player2.armyColor}20` : 'none',
                  }}
                >
                  {localMyVote === 'player2' && <span className="mr-1">✓</span>}
                  {player2.username}
                  <span className="block text-[9px] font-mono mt-0.5 opacity-60">{localP2Votes} votes</span>
                </button>
              </div>

              {/* Hype Button */}
              <button
                onClick={handleHype}
                className={`px-4 rounded-xl border text-xs font-display font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  localMyHype
                    ? 'bg-[#FF6B2C]/20 border-[#FF6B2C]/50 text-[#FF6B2C] shadow-[0_0_15px_rgba(255,107,44,0.2)]'
                    : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.05] hover:text-white/60'
                }`}
              >
                <span className="text-lg">🔥</span>
                <span className="text-[9px] font-mono font-bold">{localHype}</span>
                <span className="text-[7px] font-mono tracking-wider">HYPE</span>
              </button>
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
              Votes: {localP1Votes} vs {localP2Votes} • {localHype} hype
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
