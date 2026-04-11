/**
 * WARZONE — Duel Invite Modal
 * Challenge flow: pick opponent, pick topic, send challenge.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DUEL_TOPICS, type SimUser, type DuelTopic } from '../../../lib/duelTopics';
import { useDuelStore, type DuelPlayer } from '../../../stores/duelStore';
import { useAuthStore } from '../../../stores/authStore';
import { useGlobalSocketStore } from '../../../stores/globalSocketStore';
import { api } from '../../../lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSearch?: string;
  defaultOpponent?: SimUser | null;
}

export default function DuelInviteModal({ isOpen, onClose, defaultSearch = '', defaultOpponent = null }: Props) {
  const [step, setStep] = useState<'opponent' | 'topic' | 'confirm'>(defaultOpponent ? 'topic' : 'opponent');
  const [selectedOpponent, setSelectedOpponent] = useState<SimUser | null>(defaultOpponent);
  const [selectedTopic, setSelectedTopic] = useState<DuelTopic | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [search, setSearch] = useState(defaultSearch);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredUsers, setFilteredUsers] = useState<SimUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const user = useAuthStore((s) => s.user);
  const sendChallenge = useGlobalSocketStore((s) => s.sendChallenge);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (search.trim().length === 0) {
        setFilteredUsers([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const res = await api.profile.search(search);
        if (res && res.users) {
          setFilteredUsers(res.users);
        }
      } catch (err) {
        console.error('Failed to hunt warriors:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredTopics = DUEL_TOPICS.filter((t) =>
    categoryFilter === 'all' || t.category === categoryFilter
  );

  const categories = ['all', 'captain', 'player', 'team', 'format', 'hot-take'];

  function handleConfirm() {
    if (!selectedOpponent || !selectedTopic || !user) return;

    sendChallenge(selectedOpponent.id, user.username, selectedTopic.text, user.id);
    
    // Auto-close modal after challenge is sent
    handleClose();
    // Maybe show a toast notification here later
  }

  function handleClose() {
    setStep('opponent');
    setSelectedOpponent(null);
    setSelectedTopic(null);
    setSearch('');
    setCategoryFilter('all');
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'rgba(12,12,12,0.98)', backdropFilter: 'blur(30px)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-display font-black text-white tracking-wide">
              {step === 'opponent' && '🎯 CHOOSE OPPONENT'}
              {step === 'topic' && '📢 PICK TOPIC'}
              {step === 'confirm' && '⚔️ CONFIRM DUEL'}
            </h2>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
              ✕
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-2 mt-3">
            {['opponent', 'topic', 'confirm'].map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= ['opponent', 'topic', 'confirm'].indexOf(step)
                  ? 'bg-gradient-to-r from-[#FF2D55] to-[#FF6B2C]'
                  : 'bg-white/[0.06]'
              }`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          <AnimatePresence mode="wait">
            {/* Step 1: Pick opponent */}
            {step === 'opponent' && (
              <motion.div key="opponent" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <input
                  type="text"
                  placeholder="Search warriors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:border-[#FF2D55]/40 outline-none mb-4 transition-colors"
                />
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <motion.button
                      key={u.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedOpponent(u); setStep('topic'); }}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${
                        selectedOpponent?.id === u.id
                          ? 'border-[#FF2D55]/50 bg-[#FF2D55]/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12]'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-black shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${u.armyColor}, ${u.armyColor}cc)` }}
                      >
                        {u.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-display font-bold truncate">{u.username}</p>
                        <p className="text-white/30 text-[10px] font-mono">{u.army} · {u.rank} · {u.wins}W-{u.losses}L</p>
                      </div>
                      <div className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg border shrink-0" style={{ color: u.armyColor, borderColor: `${u.armyColor}30`, background: `${u.armyColor}10` }}>
                        {u.army}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Pick topic */}
            {step === 'topic' && (
              <motion.div key="topic" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* Custom Topic Input */}
                <div className="mb-6">
                  <p className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-2">CREATE YOUR OWN</p>
                  <textarea
                    placeholder="Eg: Dhoni is better than Kohli..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    rows={2}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:border-[#FF2D55]/40 outline-none mb-2 transition-colors resize-none"
                  />
                  <button
                    disabled={customTopic.trim().length === 0}
                    onClick={() => {
                      setSelectedTopic({ id: 'custom', text: customTopic.trim(), category: 'hot-take', side1Label: 'FOR', side2Label: 'AGAINST' });
                      setStep('confirm');
                    }}
                    className={`w-full py-3.5 rounded-xl font-display font-black text-sm tracking-wider text-white shadow-lg transition-all ${
                      customTopic.trim().length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-95'
                    }`}
                    style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)' }}
                  >
                    CONTINUE WITH CUSTOM TOPIC
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px bg-white/10 flex-1"></div>
                  <span className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">OR PICK A SUGGESTION</span>
                  <div className="h-px bg-white/10 flex-1"></div>
                </div>

                {/* Category pills */}
                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                        categoryFilter === cat
                          ? 'bg-[#FF2D55]/15 text-[#FF2D55] border-[#FF2D55]/30'
                          : 'bg-white/[0.03] text-white/30 border-white/[0.06] hover:text-white/50'
                      }`}
                    >
                      {cat === 'hot-take' ? '🌶️ HOT TAKE' : cat === 'all' ? '🔥 ALL' : cat.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredTopics.map((t) => (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setSelectedTopic(t); setStep('confirm'); }}
                      className="w-full p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#FF6B2C]/30 transition-all text-left group"
                    >
                      <p className="text-white text-sm font-display font-bold leading-snug group-hover:text-[#FF6B2C] transition-colors">"{t.text}"</p>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-white/30 uppercase tracking-wider">{t.category}</span>
                         <span className="text-[9px] font-mono text-white/20">{t.side1Label} vs {t.side2Label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <button onClick={() => setStep('opponent')} className="mt-4 text-xs text-white/30 hover:text-white/50 font-mono transition-colors">
                  ← Back to opponents
                </button>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && selectedOpponent && selectedTopic && (
              <motion.div key="confirm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                {/* VS Display */}
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    {/* You */}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 border-2 border-white/20 flex items-center justify-center text-2xl font-display font-black text-white mb-2">
                        {(user?.username || 'Y')[0]}
                      </div>
                      <p className="text-white text-sm font-display font-bold">{user?.username || 'You'}</p>
                      <p className="text-white/30 text-[10px] font-mono">YOU</p>
                    </div>

                    {/* VS */}
                    <div className="flex flex-col items-center">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-3xl"
                      >
                        ⚔️
                      </motion.span>
                      <span className="text-white/20 text-xs font-display font-black mt-1">VS</span>
                    </div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-black text-black mb-2 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${selectedOpponent.armyColor}, ${selectedOpponent.armyColor}cc)` }}
                      >
                        {selectedOpponent.username[0]}
                      </div>
                      <p className="text-white text-sm font-display font-bold">{selectedOpponent.username}</p>
                      <p className="text-[10px] font-mono" style={{ color: selectedOpponent.armyColor }}>{selectedOpponent.army}</p>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="p-4 rounded-xl border border-[#FF6B2C]/20 bg-[#FF6B2C]/5 mb-6">
                    <p className="text-[10px] font-mono text-[#FF6B2C]/60 uppercase tracking-widest mb-2">DEBATE TOPIC</p>
                    <p className="text-white font-display font-bold text-base leading-snug">"{selectedTopic.text}"</p>
                  </div>

                  {/* Rules */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left mb-6">
                    <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider mb-2">RULES</p>
                    <div className="space-y-1.5">
                      {[
                        '⏱️ 5 minutes to debate',
                        '📢 Duel becomes public after timer',
                        '🗳️ Community reacts for 24 hours',
                        '🏆 Most positive reactions = WINNER',
                        '💰 +100 pts for participating, +200 for winning',
                      ].map((r, i) => (
                        <p key={i} className="text-white/50 text-[11px] font-mono">{r}</p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('topic')}
                    className="flex-1 py-3.5 rounded-xl border border-white/[0.08] text-white/40 text-sm font-mono font-bold hover:bg-white/5 transition-colors"
                  >
                    ← BACK
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConfirm}
                    className="flex-[2] py-3.5 rounded-xl font-display font-black text-sm tracking-wider text-white shadow-lg transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)',
                      boxShadow: '0 8px 25px rgba(255,45,85,0.3)',
                    }}
                  >
                    ⚔️ START DUEL
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
