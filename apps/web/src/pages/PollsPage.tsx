/**
 * WARZONE — Polls Page (with Sniper Duels sub-tab)
 * Two modes: Polls (coming soon) | 1v1 Duels (active)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import DuelsLobby from '../components/features/duels/DuelsLobby';
import DuelReadView from '../components/features/duels/DuelReadView';
import { useDuelStore } from '../stores/duelStore';

type SubTab = 'polls' | 'duels';

export default function PollsPage() {
  const [subTab, setSubTab] = useState<SubTab>('duels');
  const duelView = useDuelStore((s) => s.duelView);
  const activeDuel = useDuelStore((s) => s.activeDuel);
  const viewingDuel = useDuelStore((s) => s.viewingDuel);

  if (duelView === 'reading' && viewingDuel) {
    return <DuelReadView />;
  }

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-display font-black text-white tracking-tight">⚔️ WAR POLLS</h1>
        </div>

        {/* Sub-tab toggle */}
        <div className="mb-6">
          <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/[0.06] relative">
            {/* Animated background pill */}
            <motion.div
              className="absolute top-1 bottom-1 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(255,45,85,0.15), rgba(255,107,44,0.1))',
                border: '1px solid rgba(255,45,85,0.2)',
              }}
              animate={{
                left: subTab === 'polls' ? '4px' : '50%',
                width: 'calc(50% - 4px)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />

            {[
              { id: 'polls' as SubTab, label: '📊 POLLS', badge: 'SOON' },
              { id: 'duels' as SubTab, label: '🎯 1v1 DUELS', badge: 'NEW' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`relative flex-1 py-3 rounded-lg text-xs font-display font-bold tracking-wider transition-colors flex items-center justify-center gap-2 z-10 ${
                  subTab === tab.id ? 'text-white' : 'text-white/25 hover:text-white/40'
                }`}
              >
                {tab.label}
                {tab.badge && (
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest ${
                    tab.id === 'duels'
                      ? 'bg-[#FF2D55] text-white animate-pulse'
                      : 'bg-white/10 text-white/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {subTab === 'polls' ? (
            <motion.div
              key="polls"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Coming Soon (existing polls placeholder) */}
              <GlassCard className="p-8 text-center border-wz-yellow/20">
                <p className="text-5xl mb-4">📊</p>
                <h2 className="text-wz-yellow font-display font-bold text-xl mb-2">COMING SOON</h2>
                <p className="text-wz-muted text-xs font-mono leading-relaxed max-w-xs mx-auto">
                  Fan battle polls are being forged in the arsenal. Soon you'll be able to create polls, vote,
                  and share results to settle which fanbase truly rules.
                </p>

                {/* Preview poll */}
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-left">
                  <p className="text-white/60 text-xs font-mono mb-3">PREVIEW — COMING NEXT UPDATE</p>
                  <p className="text-white font-display font-bold text-sm mb-3">Better Captain?</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-sm">👑</span>
                      <span className="text-white text-xs font-mono flex-1">Virat Kohli</span>
                      <span className="text-wz-muted text-[10px] font-mono">— %</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                      <span className="text-sm">🦁</span>
                      <span className="text-white text-xs font-mono flex-1">MS Dhoni</span>
                      <span className="text-wz-muted text-[10px] font-mono">— %</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div
              key="duels"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DuelsLobby />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
