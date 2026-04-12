/**
 * WARZONE — Duels Lobby
 * Personal hub for Sniper Duels: start duels, view your active & completed duels,
 * and manage incoming/outgoing challenge queue in the Duel Status tab.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import GlassCard from '../../ui/GlassCard';
import DuelInviteModal from './DuelInviteModal';
import DuelPostCard from './DuelPostCard';
import { useDuelStore } from '../../../stores/duelStore';
import { useAuthStore } from '../../../stores/authStore';
import { useGlobalSocketStore } from '../../../stores/globalSocketStore';

type FeedTab = 'live' | 'my' | 'status';

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function formatTimeLeft(timestamp: number): string {
  const EXPIRY = 10 * 60 * 1000; // 10 minutes
  const remaining = EXPIRY - (Date.now() - timestamp);
  if (remaining <= 0) return 'Expired';
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function DuelsLobby() {
  const [showInvite, setShowInvite] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>('live');
  const [, setTick] = useState(0); // force re-render for countdown

  const user = useAuthStore((s) => s.user);
  const myDuelsLocal = useDuelStore((s) => s.myDuels);

  const incomingChallenges = useGlobalSocketStore((s) => s.incomingChallenges);
  const outgoingChallenges = useGlobalSocketStore((s) => s.outgoingChallenges);
  const acceptChallenge = useGlobalSocketStore((s) => s.acceptChallenge);
  const declineChallenge = useGlobalSocketStore((s) => s.declineChallenge);
  const cancelChallenge = useGlobalSocketStore((s) => s.cancelChallenge);

  const { data: statsData } = useQuery({
    queryKey: ['duels', 'stats'],
    queryFn: () => api.duels.stats(),
    refetchInterval: 30000,
  });

  const { data: myData } = useQuery({
    queryKey: ['duels', 'my'],
    queryFn: () => api.duels.my(),
    refetchInterval: 15000,
  });

  const stats = statsData?.stats || { totalDuels: 0, wins: 0, losses: 0, points: 0 };
  const winRate = stats.totalDuels > 0 ? Math.round((stats.wins / stats.totalDuels) * 100) : 0;

  // Track ongoing live/voting duels locally
  const activeDuels = myDuelsLocal.filter((d) => d.status === 'live' || d.status === 'voting');
  // History fetched from backend
  const completedDuels = myData?.duels || [];

  const statusCount = incomingChallenges.length + outgoingChallenges.length;

  // Tick every second for countdown timers in status tab
  useEffect(() => {
    if (feedTab !== 'status') return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [feedTab]);

  const feedTabs: { id: FeedTab; label: string; count: number; pulse?: boolean }[] = [
    { id: 'live', label: '🎯 LIVE DUEL', count: activeDuels.length },
    { id: 'my', label: '📜 MY DUELS', count: completedDuels.length },
    { id: 'status', label: '📋 DUEL STATUS', count: statusCount, pulse: incomingChallenges.length > 0 },
  ];

  const displayDuels = feedTab === 'live' ? activeDuels : completedDuels;

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

      {/* ── Feed Tabs (Live Duel / My Duels / Duel Status) ── */}
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
                } ${tab.pulse ? 'animate-pulse' : ''}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {feedTab === 'status' ? (
          /* ── DUEL STATUS TAB ── */
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Section A: Incoming Challenges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">📥</span>
                <h3 className="text-white/70 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                  INCOMING CHALLENGES
                </h3>
                {incomingChallenges.length > 0 && (
                  <span className="bg-[#FF2D55] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {incomingChallenges.length}
                  </span>
                )}
              </div>

              {incomingChallenges.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] py-8 text-center">
                  <p className="text-2xl mb-2">🛡️</p>
                  <p className="text-white/30 text-xs font-display font-bold">No incoming challenges</p>
                  <p className="text-white/15 text-[10px] font-mono">When someone challenges you, it appears here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.challengerId}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="rounded-xl border border-[#FF2D55]/20 bg-[#FF2D55]/[0.04] p-4 relative overflow-hidden"
                    >
                      {/* Glow */}
                      <div className="absolute -top-10 -right-10 w-20 h-20 rounded-full bg-[#FF2D55]/10 blur-[30px] pointer-events-none" />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF2D55] to-[#FF6B2C] flex items-center justify-center text-xs font-black text-white shadow-lg">
                              {challenge.challengerName[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-display font-bold">{challenge.challengerName}</p>
                              <p className="text-white/30 text-[9px] font-mono">{formatTimeAgo(challenge.timestamp)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[#FF2D55]/60 text-[9px] font-mono font-bold">⏳ {formatTimeLeft(challenge.timestamp)}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 mb-3">
                          <p className="text-white/70 text-xs font-mono">"{challenge.topicText}"</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => declineChallenge(challenge.challengerId)}
                            className="flex-1 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-white/50 text-[10px] font-mono font-bold hover:bg-white/10 transition-all"
                          >
                            ✕ DECLINE
                          </button>
                          <button
                            onClick={() => {
                              if (!user) return;
                              acceptChallenge(
                                challenge.challengerId,
                                challenge.challengerName,
                                challenge.topicText,
                                user.id,
                                user.username
                              );
                            }}
                            className="flex-[2] py-2 rounded-lg text-white text-[10px] font-display font-black tracking-wider shadow-lg hover:scale-[1.02] transition-transform"
                            style={{
                              background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)',
                              boxShadow: '0 4px 15px rgba(255,45,85,0.3)',
                            }}
                          >
                            ⚔️ ACCEPT DUEL
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-white/[0.06] flex-1" />
              <span className="text-white/15 text-[9px] font-mono tracking-widest">• • •</span>
              <div className="h-px bg-white/[0.06] flex-1" />
            </div>

            {/* Section B: Outgoing Challenges */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm">📤</span>
                <h3 className="text-white/70 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">
                  OUTGOING CHALLENGES
                </h3>
                {outgoingChallenges.length > 0 && (
                  <span className="bg-[#FF6B2C]/20 text-[#FF6B2C] text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                    {outgoingChallenges.length}
                  </span>
                )}
              </div>

              {outgoingChallenges.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] py-8 text-center">
                  <p className="text-2xl mb-2">📡</p>
                  <p className="text-white/30 text-xs font-display font-bold">No pending challenges</p>
                  <p className="text-white/15 text-[10px] font-mono">Challenges you send will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {outgoingChallenges.map((challenge) => (
                    <motion.div
                      key={challenge.targetUserId}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -15 }}
                      className="rounded-xl border border-[#FF6B2C]/15 bg-[#FF6B2C]/[0.03] p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#BF5AF2] flex items-center justify-center text-xs font-black text-white shadow-lg">
                            {challenge.targetName[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-display font-bold">{challenge.targetName}</p>
                            <p className="text-white/30 text-[9px] font-mono">{formatTimeAgo(challenge.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="text-[#FF6B2C] text-[9px] font-mono font-bold"
                          >
                            ⏳ Waiting...
                          </motion.span>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 mb-3">
                        <p className="text-white/70 text-xs font-mono">"{challenge.topicText}"</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-white/20 text-[9px] font-mono">Expires in {formatTimeLeft(challenge.timestamp)}</p>
                        <button
                          onClick={() => cancelChallenge(challenge.targetUserId)}
                          className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/40 text-[10px] font-mono font-bold hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                          ✕ CANCEL
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── LIVE / MY DUELS TABS ── */
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
                  {feedTab === 'live' ? '🎯' : '📜'}
                </motion.p>
                <p className="text-white/30 text-sm font-display font-bold mb-1">
                  {feedTab === 'live' && 'No active duels'}
                  {feedTab === 'my' && 'No completed duels'}
                </p>
                <p className="text-white/15 text-[10px] font-mono">
                  {feedTab === 'live' && 'Challenge someone to get started'}
                  {feedTab === 'my' && 'Your battle history will appear here'}
                </p>
              </div>
            ) : (
              displayDuels.map((duel) => (
                <DuelPostCard key={duel.id} duel={duel} compact={feedTab === 'my'} />
              ))
            )}
          </motion.div>
        )}
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
              { icon: '🗳️', title: 'Community Reacts', desc: 'People react with ☢️ TOXIC 🤡 CLOWN 🔥 FIRE 😂 LAUGH' },
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
