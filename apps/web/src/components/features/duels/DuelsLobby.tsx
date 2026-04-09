/**
 * WARZONE — Duels Lobby
 * Main hub for Sniper Duels: start duels, view active/public duels, stats, and history.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../../ui/GlassCard';
import DuelInviteModal from './DuelInviteModal';
import DuelPostCard from './DuelPostCard';
import { useDuelStore } from '../../../stores/duelStore';
import { useAuthStore } from '../../../stores/authStore';

type FeedTab = 'public' | 'my' | 'history';

export default function DuelsLobby() {
  const [showInvite, setShowInvite] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>('public');

  const user = useAuthStore((s) => s.user);
  const publicDuels = useDuelStore((s) => s.publicDuels);
  const myDuels = useDuelStore((s) => s.myDuels);
  const stats = useDuelStore((s) => s.stats);
  const initPublicDuels = useDuelStore((s) => s.initPublicDuels);

  // Initialize sample duels on mount
  useEffect(() => {
    if (user) {
      initPublicDuels({
        id: user.id,
        username: user.username,
        army: typeof user.army === 'string' ? user.army : user.army?.name || 'CSK',
        armyColor: typeof user.army === 'string' ? '#FFFF3C' : user.army?.colorHex || '#FFFF3C',
      });
    }
  }, [user, initPublicDuels]);

  const completedDuels = myDuels.filter((d) => d.status === 'completed');
  const activeDuels = myDuels.filter((d) => d.status === 'voting');

  const winRate = stats.totalDuels > 0 ? Math.round((stats.wins / stats.totalDuels) * 100) : 0;

  const feedTabs: { id: FeedTab; label: string; count: number }[] = [
    { id: 'public', label: '🔥 LIVE DUELS', count: publicDuels.filter((d) => d.status === 'voting').length },
    { id: 'my', label: '⚔️ MY DUELS', count: activeDuels.length },
    { id: 'history', label: '📜 HISTORY', count: completedDuels.length },
  ];

  const displayDuels = feedTab === 'public'
    ? publicDuels
    : feedTab === 'my'
    ? myDuels
    : completedDuels;

  return (
    <>
      {/* ── Hero CTA ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => setShowInvite(true)}
        >
          {/* Background gradient */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, rgba(255,45,85,0.12) 0%, rgba(255,107,44,0.08) 50%, rgba(191,90,242,0.06) 100%)',
          }} />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />

          {/* Glow orbs */}
          <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#FF2D55]/15 blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[#FF6B2C]/10 blur-[60px] pointer-events-none" />

          <div className="relative p-6 text-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-5xl mb-3 inline-block"
            >
              🎯
            </motion.div>
            <h2 className="text-white font-display font-black text-2xl tracking-tight mb-1.5">
              SNIPER DUEL
            </h2>
            <p className="text-white/40 text-xs font-mono mb-5 max-w-xs mx-auto leading-relaxed">
              Challenge anyone to a 5-minute debate. Community decides the winner. Glory awaits.
            </p>
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-xl font-display font-black text-sm tracking-wider text-white shadow-lg transition-all"
              style={{
                background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)',
                boxShadow: '0 8px 30px rgba(255,45,85,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              ⚔️ CHALLENGE SOMEONE
            </motion.button>
          </div>

          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
            background: 'linear-gradient(90deg, transparent, #FF2D55, #FF6B2C, transparent)',
          }} />
        </div>
      </motion.div>

      {/* ── Stats Strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-4 gap-2 mb-6"
      >
        {[
          { label: 'DUELS', value: stats.totalDuels, color: '#FF6B2C' },
          { label: 'WINS', value: stats.wins, color: '#00FF88' },
          { label: 'WIN %', value: `${winRate}%`, color: '#FFD60A' },
          { label: 'POINTS', value: stats.points.toLocaleString(), color: '#BF5AF2' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
            <p className="font-display font-black text-lg text-white leading-none mb-0.5" style={{ textShadow: `0 0 15px ${s.color}30` }}>
              {s.value}
            </p>
            <p className="text-[8px] font-mono font-bold tracking-[0.2em] uppercase" style={{ color: `${s.color}80` }}>
              {s.label}
            </p>
          </div>
        ))}
      </motion.div>

      {/* ── Feed Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mb-4"
      >
        <div className="flex gap-1.5 bg-white/[0.02] rounded-xl p-1 border border-white/[0.04]">
          {feedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFeedTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all relative ${
                feedTab === tab.id
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/25 hover:text-white/40'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold ${
                  feedTab === tab.id ? 'bg-[#FF2D55] text-white' : 'bg-white/10 text-white/30'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Duels Feed ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={feedTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-3"
        >
          {displayDuels.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] py-12 text-center">
              <motion.p
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-3xl mb-3"
              >
                {feedTab === 'public' ? '⚔️' : feedTab === 'my' ? '🎯' : '📜'}
              </motion.p>
              <p className="text-white/30 text-sm font-display font-bold mb-1">
                {feedTab === 'public' && 'No duels happening yet'}
                {feedTab === 'my' && 'No active duels'}
                {feedTab === 'history' && 'No completed duels'}
              </p>
              <p className="text-white/15 text-[10px] font-mono">
                {feedTab === 'public' && 'Be the first to start one!'}
                {feedTab === 'my' && 'Challenge someone to get started'}
                {feedTab === 'history' && 'Your battle history will appear here'}
              </p>
            </div>
          ) : (
            displayDuels.map((duel) => (
              <DuelPostCard key={duel.id} duel={duel} compact={feedTab === 'history'} />
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── How it Works ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <GlassCard className="p-5 border-white/[0.04]">
          <h3 className="text-white/50 text-[10px] font-mono font-bold tracking-[0.3em] uppercase mb-4">HOW SNIPER DUELS WORK</h3>
          <div className="space-y-3">
            {[
              { icon: '🎯', title: 'Challenge', desc: 'Pick an opponent and a debate topic' },
              { icon: '⚔️', title: '5-Min Battle', desc: 'Go head-to-head in a live banter debate' },
              { icon: '📢', title: 'Goes Public', desc: 'Your duel becomes a post everyone can read' },
              { icon: '🗳️', title: 'Community Reacts', desc: 'People react with ✅ FACTS 🔥 FIRE 💀 BRUTAL 🤡 TOXIC 😤 L TAKE' },
              { icon: '🏆', title: '24h Verdict', desc: 'Most positive reactions wins! +200 pts for the winner' },
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg shrink-0">{step.icon}</span>
                <div>
                  <p className="text-white text-xs font-display font-bold">{step.title}</p>
                  <p className="text-white/30 text-[10px] font-mono">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Invite Modal */}
      <DuelInviteModal isOpen={showInvite} onClose={() => setShowInvite(false)} />
    </>
  );
}
