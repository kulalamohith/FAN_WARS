/**
 * WARZONE — Duel Post Card
 * Shows a completed/voting duel as a public card with reactions.
 * This is how duels appear in the feed and lobby.
 */

import { motion } from 'framer-motion';
import { REACTION_CONFIG, getReactionScore, getTotalReactions, type DuelReactions } from '../../../lib/duelTopics';
import { useDuelStore, type Duel } from '../../../stores/duelStore';

interface Props {
  duel: Duel;
  compact?: boolean;
}

export default function DuelPostCard({ duel, compact = false }: Props) {
  const viewDuel = useDuelStore((s) => s.viewDuel);
  const reactToDuel = useDuelStore((s) => s.reactToDuel);

  const { player1, player2, topic, status, messages, player1Reactions, player2Reactions, winner, verdictAt, myReactions } = duel;

  const p1Score = getReactionScore(player1Reactions);
  const p2Score = getReactionScore(player2Reactions);
  const totalP1 = getTotalReactions(player1Reactions);
  const totalP2 = getTotalReactions(player2Reactions);
  const totalAll = totalP1 + totalP2 || 1;

  // Time remaining for verdict
  const now = Date.now();
  const timeRemaining = verdictAt ? Math.max(0, verdictAt - now) : 0;
  const hoursLeft = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutesLeft = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));

  const isVoting = status === 'voting' && timeRemaining > 0;
  const isCompleted = status === 'completed' || (status === 'voting' && timeRemaining <= 0);

  // Determine winner by reactions if voting ended
  const effectiveWinner = winner || (isCompleted ? (p1Score >= p2Score ? player1.id : player2.id) : null);
  const winnerName = effectiveWinner === player1.id ? player1.username : effectiveWinner === player2.id ? player2.username : null;

  // Preview: first message from each player
  const p1Preview = messages.find((m) => m.senderId === player1.id);
  const p2Preview = messages.find((m) => m.senderId === player2.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => viewDuel(duel.id)}
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

        {/* Tug of war bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.04] mb-3">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(15, (totalP1 / totalAll) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-l-full"
            style={{ background: player1.armyColor }}
          />
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${Math.max(15, (totalP2 / totalAll) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-r-full"
            style={{ background: player2.armyColor }}
          />
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

        {/* Reactions strip */}
        <div className="flex items-center gap-4 pt-3 border-t border-white/[0.04]">
          <div className="flex-1 flex items-center gap-1.5">
            {REACTION_CONFIG.map((r) => {
              const p1Count = player1Reactions[r.key];
              const p2Count = player2Reactions[r.key];
              const total = p1Count + p2Count;
              if (total === 0 && compact) return null;
              return (
                <span key={r.key} className="text-[10px] font-mono text-white/25" title={`${r.label}: ${total}`}>
                  {r.emoji} {total > 0 ? total : ''}
                </span>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-[#FF6B2C]/50 group-hover:text-[#FF6B2C] transition-colors shrink-0">
            Read debate →
          </span>
        </div>
      </div>
    </motion.div>
  );
}
