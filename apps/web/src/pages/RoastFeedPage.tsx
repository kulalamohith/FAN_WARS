import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import QuickProfileModal, { QuickProfileUser } from '../components/ui/QuickProfileModal';

export default function RoastFeedPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [sort, setSort] = useState<'viral' | 'new'>('viral');
  const [showCompose, setShowCompose] = useState(false);
  const [profileUser, setProfileUser] = useState<QuickProfileUser | null>(null);

  const { data: armiesData } = useQuery({
    queryKey: ['armies'],
    queryFn: () => api.armies.list(),
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['roasts', sort],
    queryFn: ({ pageParam }) => api.roasts.feed(sort, undefined, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
  });

  const upvoteMutation = useMutation({
    mutationFn: (roastId: string) => api.roasts.upvote(roastId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roasts'] }),
  });

  const allRoasts = data?.pages.flatMap((p) => p.roasts) || [];

  if (embedded) {
    return renderContent();
  }

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-wz-muted hover:text-white text-sm font-mono">← HQ</button>
          <h1 className="text-wz-red font-display font-black text-lg tracking-widest">ROAST FEED</h1>
          <div className="w-12" />
        </div>
      </header>

      <main className="relative z-10 max-w-xl mx-auto px-5 pt-6 pb-28">
        {renderContent()}
      </main>
    </div>
  );

  function renderContent() {
    return (
      <>

        {/* Sort Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSort('viral')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold font-mono transition-all ${sort === 'viral' ? 'bg-wz-red text-white shadow-[0_0_20px_rgba(255,45,85,0.3)]' : 'bg-white/5 text-wz-muted'}`}
          >
            🔥 Viral
          </button>
          <button
            onClick={() => setSort('new')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold font-mono transition-all ${sort === 'new' ? 'bg-wz-neon text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-wz-muted'}`}
          >
            🆕 New
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass-card p-6 animate-pulse">
                <div className="h-4 w-32 bg-white/5 rounded mb-3" />
                <div className="h-16 bg-white/5 rounded mb-3" />
                <div className="h-4 w-20 bg-white/5 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Roasts List */}
        <AnimatePresence>
          {allRoasts.map((roast, i) => (
            <motion.div
              key={roast.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="mb-4"
            >
              <div className={`glass-card p-5 relative overflow-hidden ${roast.isLegendary ? 'border-wz-yellow/40 shadow-[0_0_30px_rgba(255,214,10,0.1)]' : ''}`}>
                {/* Legendary Badge */}
                {roast.isLegendary && (
                  <div className="absolute top-3 right-3 bg-wz-yellow/20 border border-wz-yellow/30 px-2 py-0.5 rounded text-[10px] text-wz-yellow font-bold font-mono">
                    🏆 LEGENDARY
                  </div>
                )}

                {/* Author Row */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: '#FF2D55' }}
                  >
                    {roast.author.username[0].toUpperCase()}
                  </div>
                  <button
                    onClick={() => setProfileUser({ id: roast.author.id, username: roast.author.username, rank: roast.author.rank || 'RECRUIT', armyName: roast.author.army?.name || 'N/A', armyColor: roast.author.army?.colorHex })}
                    className="text-white/80 text-sm font-bold font-mono hover:underline cursor-pointer"
                  >
                    {roast.author.username}
                  </button>
                  <span className="text-white/20 text-xs">→</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full border"
                    style={{ color: roast.targetArmy.colorHex, borderColor: `${roast.targetArmy.colorHex}40` }}
                  >
                    {roast.targetArmy.name}
                  </span>
                </div>

                {/* Content */}
                <p className="text-white text-sm leading-relaxed mb-4 whitespace-pre-wrap">{roast.content}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => upvoteMutation.mutate(roast.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                      roast.hasUpvoted
                        ? 'bg-[#FF2D55]/20 text-[#FF2D55] border border-[#FF2D55]/30'
                        : 'bg-white/5 text-wz-muted hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span>🔥</span>
                    <span>{roast.upvoteCount}</span>
                  </button>
                  <span className="text-white/15 text-[10px] font-mono">
                    {new Date(roast.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Load More */}
        {hasNextPage && (
          <div className="text-center mt-6">
            <WarzoneButton
              variant="ghost"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Load More Roasts
            </WarzoneButton>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && allRoasts.length === 0 && (
          <GlassCard className="text-center py-12 opacity-60">
            <p className="text-3xl mb-3">🦗</p>
            <p className="text-wz-muted text-sm font-mono">No roasts yet. Be the first to start the fire.</p>
          </GlassCard>
        )}

        {/* Floating Compose Button */}
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-6 z-50 w-14 h-14 bg-gradient-to-br from-[#FF2D55] to-[#FF6B2C] rounded-full flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(255,45,85,0.5)] hover:scale-110 transition-transform"
        >
          ✍️
        </button>

        {/* Compose Modal */}
        <AnimatePresence>
          {showCompose && (
            <ComposeRoast
              armies={(armiesData || []).filter((a: any) => a.id !== user?.army?.id)}
              userArmyId={user?.army?.id}
              onClose={() => setShowCompose(false)}
              onSuccess={() => {
                setShowCompose(false);
                queryClient.invalidateQueries({ queryKey: ['roasts'] });
              }}
            />
          )}
        </AnimatePresence>

        {profileUser && (
          <QuickProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
        )}
      </>
    );
  }
}

function ComposeRoast({ armies, userArmyId, onClose, onSuccess }: { armies: any[]; userArmyId?: string; onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [targetArmyId, setTargetArmyId] = useState('');

  const createMutation = useMutation({
    mutationFn: () => api.roasts.create(content, targetArmyId),
    onSuccess,
    onError: (err: any) => alert(err.message),
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="glass-card w-full max-w-md p-6 border-wz-red/30"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-wz-red font-display font-black text-xl mb-1">DROP A ROAST 🔥</h2>
        <p className="text-wz-muted text-xs font-mono mb-5">280 characters max. Make it count.</p>

        {/* Target Army Selector */}
        <div className="mb-4">
          <label className="text-[10px] text-wz-muted font-mono uppercase tracking-widest block mb-2">Target Army</label>
          <div className="flex flex-wrap gap-2">
            {armies.map((army: any) => (
              <button
                key={army.id}
                onClick={() => setTargetArmyId(army.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  targetArmyId === army.id
                    ? 'border-white/50 bg-white/10'
                    : 'border-white/10 bg-white/5 opacity-50 hover:opacity-100'
                }`}
                style={{ color: army.colorHex }}
              >
                {army.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 280))}
          placeholder="Type your roast..."
          rows={4}
          className="w-full bg-black/50 border border-wz-border/30 rounded-lg px-4 py-3 text-white text-sm font-mono mb-2 focus:outline-none focus:border-wz-red/50 resize-none"
        />
        <p className="text-right text-[10px] text-wz-muted font-mono mb-4">{content.length}/280</p>

        <div className="flex gap-3">
          <WarzoneButton variant="ghost" fullWidth onClick={onClose}>Cancel</WarzoneButton>
          <WarzoneButton
            variant="danger"
            fullWidth
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!targetArmyId || !content.trim()}
          >
            FIRE 🔥
          </WarzoneButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
