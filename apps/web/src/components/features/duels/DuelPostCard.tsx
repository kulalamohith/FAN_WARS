/**
 * WARZONE — Duel Post Card
 * Shows a completed/voting duel as a card with VOTE counts + HYPE.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useDuelStore, type Duel } from '../../../stores/duelStore';
import { api } from '../../../lib/api';

interface Props {
  duel: Duel;
  compact?: boolean;
}

export default function DuelPostCard({ duel, compact = false }: Props) {
  const setDuelView = useDuelStore((s) => s.setDuelView);
  const queryClient = useQueryClient();
  const [localHype, setLocalHype] = useState(duel.hypeCount);
  const [localMyHype, setLocalMyHype] = useState(duel.myHype);

  const hypeMutation = useMutation({
    mutationFn: () => api.duels.hype(duel.id),
    onMutate: () => {
      if (localMyHype) {
        setLocalHype((h) => Math.max(0, h - 1));
        setLocalMyHype(false);
      } else {
        setLocalHype((h) => h + 1);
        setLocalMyHype(true);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['duels'] }),
  });

  function handleView() {
    // Set viewingDuel directly in store (works for API-fetched duels)
    useDuelStore.setState({ viewingDuel: duel, duelView: 'reading' });
  }

  const { player1, player2, topic, status, messages, player1Votes, player2Votes, hypeCount, myHype, verdictAt, winner } = duel;

  const totalVotes = player1Votes + player2Votes || 1;
  const p1Pct = Math.round((player1Votes / totalVotes) * 100);
  const p2Pct = 100 - p1Pct;

  // Time remaining for verdict
  const now = Date.now();
  const timeRemaining = verdictAt ? Math.max(0, verdictAt - now) : 0;
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const isVoting = status === 'voting' && timeRemaining > 0;
  const isCompleted = status === 'completed' || (status === 'voting' && timeRemaining <= 0);

  // Determine winner by votes
  const effectiveWinner = winner || (isCompleted ? (player1Votes >= player2Votes ? player1.id : player2.id) : null);
  const winnerName = effectiveWinner === player1.id ? player1.username : effectiveWinner === player2.id ? player2.username : null;

  // Preview: first message from each player
  const p1Preview = messages.find((m) => m.senderId === player1.id);
  const p2Preview = messages.find((m) => m.senderId === player2.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={handleView}
      className="rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] hover:border-white/[0.12] transition-all cursor-pointer overflow-hidden group"
    >
      {/* Top accent */}
      <div className="h-[2px]" style={{
        background: `linear-gradient(90deg, ${player1.armyColor}, transparent 30%, transparent 70%, ${player2.armyColor})`,
      }} />

      <div className={compact ? 'p-4' : 'p-5'}>
        {/* Status + Topic */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            {isVoting && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#FFD60A]/10 border border-[#FFD60A]/20 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD60A] animate-pulse shadow-[0_0_6px_#FFD60A]" />
                <span className="text-[9px] font-mono font-bold text-[#FFD60A] tracking-wider">VOTING · {hoursLeft}h {minutesLeft}m left</span>
              </div>
            )}
            {isCompleted && (
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#00FF88]/10 border border-[#00FF88]/20 mb-2">
                <span className="text-[9px] font-mono font-bold text-[#00FF88] tracking-wider">🏆 VERDICT: {winnerName?.toUpperCase()} WINS</span>
              </div>
            )}
            <p className="text-white font-display font-bold text-sm leading-snug line-clamp-2">"{topic.text}"</p>
          </div>
          <span className="text-[10px] font-mono text-white/20 shrink-0 ml-3 mt-1">{messages.length} msgs</span>
        </div>

        {/* Players VS strip */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black shrink-0"
              style={{ background: player1.armyColor }}>
              {player1.username[0]}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-display font-bold truncate ${effectiveWinner === player1.id ? 'text-[#00FF88]' : 'text-white'}`}>
                {player1.username} {effectiveWinner === player1.id ? '👑' : ''}
              </p>
              <p className="text-[9px] font-mono" style={{ color: `${player1.armyColor}99` }}>{player1.army}</p>
            </div>
          </div>

          <span className="text-white/15 text-[10px] font-display font-black shrink-0">VS</span>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <div className="min-w-0 text-right">
              <p className={`text-xs font-display font-bold truncate ${effectiveWinner === player2.id ? 'text-[#00FF88]' : 'text-white'}`}>
                {effectiveWinner === player2.id ? '👑 ' : ''}{player2.username}
              </p>
              <p className="text-[9px] font-mono" style={{ color: `${player2.armyColor}99` }}>{player2.army}</p>
            </div>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-black shrink-0"
              style={{ background: player2.armyColor }}>
              {player2.username[0]}
            </div>
          </div>
        </div>

        {/* Vote bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04] mb-1">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(15, p1Pct)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-l-full"
            style={{ background: player1.armyColor }}
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(15, p2Pct)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-r-full"
            style={{ background: player2.armyColor }}
          />
        </div>
        {/* Vote counts */}
        <div className="flex justify-between mb-3">
          <span className="text-[9px] font-mono font-bold" style={{ color: player1.armyColor }}>{player1Votes} votes</span>
          <span className="text-[8px] font-mono text-white/20">{player1Votes + player2Votes} total</span>
          <span className="text-[9px] font-mono font-bold" style={{ color: player2.armyColor }}>{player2Votes} votes</span>
        </div>

        {/* Preview messages */}
        {!compact && (
          <div className="space-y-2 mb-4">
            {p1Preview && (
              <div className="flex gap-2 items-start">
                <div className="w-1 h-full min-h-[20px] rounded-full shrink-0 mt-0.5" style={{ background: player1.armyColor }} />
                <p className="text-white/50 text-[11px] font-mono line-clamp-1 italic">"{p1Preview.text}"</p>
              </div>
            )}
            {p2Preview && (
              <div className="flex gap-2 items-start">
                <div className="w-1 h-full min-h-[20px] rounded-full shrink-0 mt-0.5" style={{ background: player2.armyColor }} />
                <p className="text-white/50 text-[11px] font-mono line-clamp-1 italic">"{p2Preview.text}"</p>
              </div>
            )}
          </div>
        )}

        {/* Footer: Hype + Read debate */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
          <button
            onClick={(e) => { e.stopPropagation(); hypeMutation.mutate(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all ${
              localMyHype
                ? 'bg-[#FF6B2C]/15 border-[#FF6B2C]/30 text-[#FF6B2C]'
                : 'bg-white/[0.02] border-white/[0.06] text-white/25 hover:bg-white/[0.05] hover:text-white/40'
            }`}
          >
            🔥 HYPE {localHype > 0 && <span>{localHype}</span>}
          </button>
          <span className="flex-1" />
          <span className="text-[10px] font-mono text-[#FF6B2C]/50 group-hover:text-[#FF6B2C] transition-colors shrink-0">
            Read debate →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
