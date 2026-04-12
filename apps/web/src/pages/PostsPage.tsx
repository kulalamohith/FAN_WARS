import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import { RankBadge } from '../components/ui/RankBadge';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useDuelStore } from '../stores/duelStore';
import DuelPostCard from '../components/features/duels/DuelPostCard';
import DuelReadView from '../components/features/duels/DuelReadView';
import QuickProfileModal, { QuickProfileUser } from '../components/ui/QuickProfileModal';

// ─── Feed Tabs ───
const FEED_TABS = [
  { key: 'ALL', label: 'All', emoji: '📡' },
  { key: 'HYPE', label: 'Hype', emoji: '🔥' },
  { key: 'DEBATE', label: 'Debate', emoji: '⚔️' },
] as const;

// ─── Reactions (new) ───
const REACTIONS = [
  { type: 'TOXIC', emoji: '☢️', label: 'Toxic', color: '#00FF88' },
  { type: 'CLOWN', emoji: '🤡', label: 'Clown', color: '#FFD60A' },
  { type: 'FIRE', emoji: '🔥', label: 'Fire', color: '#FF6B2C' },
  { type: 'LAUGH', emoji: '😂', label: 'Laugh', color: '#BF5AF2' },
] as const;

const TYPE_BADGES: Record<string, { emoji: string; color: string; label: string }> = {
  OPINION: { emoji: '💬', color: '#007AFF', label: 'TAKE' },
  HYPE: { emoji: '🔥', color: '#FF6B2C', label: 'HYPE' },
  DEBATE: { emoji: '⚔️', color: '#FF453A', label: 'DEBATE' },
};

export default function PostsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const duelView = useDuelStore((s) => s.duelView);
  const viewingDuel = useDuelStore((s) => s.viewingDuel);

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'global' | 'mine'>('global');
  const [showCompose, setShowCompose] = useState(false);

  // Posts feed query (for ALL and MY POSTS)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['posts', viewMode, activeTab],
    queryFn: ({ pageParam }) =>
      api.posts.feed('new', viewMode === 'mine', activeTab === 'ALL' ? undefined : activeTab === 'HYPE' ? 'HYPE' : undefined, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: activeTab !== 'DEBATE' && activeTab !== 'HYPE',
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) || [];

  // Debate tab: fetch duels from the BACKEND (global)
  const { data: debateData, isLoading: debateLoading } = useQuery({
    queryKey: ['duels', 'recent'],
    queryFn: () => api.duels.feed('recent'),
    enabled: activeTab === 'DEBATE',
    refetchInterval: 30000, // refresh every 30s
  });
  const globalDuels = debateData?.duels || [];

  // Hype tab: fetch top duels by hype from BACKEND
  const { data: hypeData, isLoading: hypeLoading } = useQuery({
    queryKey: ['duels', 'hype'],
    queryFn: () => api.duels.feed('hype'),
    enabled: activeTab === 'HYPE',
  });
  const topHypedDuels = (hypeData?.duels || []).filter((d: any) => d.hypeCount > 0).slice(0, 5);

  // Show DuelReadView when user clicks "Read debate" — MUST be after all hooks
  if (duelView === 'reading' && viewingDuel) {
    return <DuelReadView />;
  }

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display font-black text-white tracking-tight">POSTS</h1>
          <button
            onClick={() => setViewMode(viewMode === 'global' ? 'mine' : 'global')}
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${viewMode === 'mine' ? 'bg-[#BF5AF2]/20 text-[#BF5AF2] border border-[#BF5AF2]/40' : 'bg-white/5 text-wz-muted border border-white/10 hover:text-white'}`}
          >
            {viewMode === 'mine' ? '👤 MY POSTS' : '🌍 GLOBAL'}
          </button>
        </div>

        {/* ─── Main Tabs ─── */}
        <div className="flex gap-1 mb-5 bg-white/[0.02] rounded-xl p-1 border border-white/[0.04]">
          {FEED_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-[11px] font-display font-bold tracking-wider transition-all relative ${
                activeTab === tab.key
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/25 hover:text-white/40'
              }`}
            >
              {tab.emoji} {tab.label}
              {tab.key === 'DEBATE' && globalDuels.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold bg-[#FF2D55] text-white animate-pulse">
                  {globalDuels.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Tab Content ─── */}
        <AnimatePresence mode="wait">
          {activeTab === 'DEBATE' ? (
            /* ── DEBATE TAB: Global Duels from Backend ── */
            <motion.div
              key="debate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {debateLoading ? (
                <LoadingSkeleton />
              ) : globalDuels.length === 0 ? (
                <GlassCard className="text-center py-12">
                  <motion.p animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-3">⚔️</motion.p>
                  <p className="text-white font-display font-bold mb-1">No Debates Yet</p>
                  <p className="text-wz-muted text-xs font-mono">Challenge someone to a Sniper Duel to start one!</p>
                </GlassCard>
              ) : (
                globalDuels.map((duel: any) => (
                  <DuelPostCard key={duel.id} duel={apiDuelToStore(duel)} />
                ))
              )}
            </motion.div>
          ) : activeTab === 'HYPE' ? (
            /* ── HYPE TAB: Top 5 Hyped Debates ── */
            <motion.div
              key="hype"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="text-center mb-4">
                <h2 className="text-white font-display font-bold text-sm">🔥 TOP HYPED DEBATES</h2>
                <p className="text-wz-muted text-[10px] font-mono">Most hyped debates by the community</p>
              </div>
              {hypeLoading ? (
                <LoadingSkeleton />
              ) : topHypedDuels.length === 0 ? (
                <GlassCard className="text-center py-12">
                  <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-4xl mb-3">🔥</motion.p>
                  <p className="text-white font-display font-bold mb-1">No Hyped Debates Yet</p>
                  <p className="text-wz-muted text-xs font-mono">Go to Debate tab and hype some duels!</p>
                </GlassCard>
              ) : (
                topHypedDuels.map((duel: any, idx: number) => (
                  <div key={duel.id} className="relative">
                    <div className="absolute -left-2 top-3 w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B2C] to-[#FF2D55] flex items-center justify-center text-[10px] font-black text-white z-10 shadow-lg">
                      {idx + 1}
                    </div>
                    <DuelPostCard duel={apiDuelToStore(duel)} compact={idx > 2} />
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            /* ── ALL TAB: Regular Posts ── */
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <div className="space-y-3">
                    {allPosts.map((post: any) => (
                      <PostCard key={post.id} post={post} currentUserId={user?.id} onUserClick={(u) => navigate(`/profile/${u.username}`)} />
                    ))}
                  </div>

                  {hasNextPage && (
                    <div className="flex justify-center py-6">
                      <WarzoneButton
                        variant="ghost"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="text-xs"
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load More'}
                      </WarzoneButton>
                    </div>
                  )}

                  {!isLoading && allPosts.length === 0 && (
                    <GlassCard className="text-center py-12">
                      <p className="text-4xl mb-3">📡</p>
                      <p className="text-white font-display font-bold mb-1">
                        {viewMode === 'mine' ? "You haven't posted anything" : "No posts found"}
                      </p>
                      <p className="text-wz-muted text-xs font-mono">
                        {viewMode === 'mine' ? 'Drop a take and start a war.' : 'Be the first to drop a take.'}
                      </p>
                    </GlassCard>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Floating Compose Button ─── */}
      {activeTab !== 'DEBATE' && (
        <button
          onClick={() => setShowCompose(true)}
          className="fixed bottom-20 right-5 z-50 w-14 h-14 bg-gradient-to-br from-[#FF2D55] to-[#FF6B2C] rounded-2xl flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(255,45,85,0.5)] hover:scale-110 active:scale-95 transition-transform"
        >
          ✏️
        </button>
      )}

      {/* ─── Compose Modal ─── */}
      <AnimatePresence>
        {showCompose && (
          <ComposePost
            onClose={() => setShowCompose(false)}
            onSuccess={() => {
              setShowCompose(false);
              queryClient.invalidateQueries({ queryKey: ['posts'] });
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}


// ─────────────────────────────────────────────────────────
//  Loading Skeleton
// ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="glass-card p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/5" />
            <div className="h-3 w-24 bg-white/5 rounded" />
          </div>
          <div className="h-4 w-full bg-white/5 rounded mb-2" />
          <div className="h-4 w-3/4 bg-white/5 rounded mb-4" />
          <div className="h-8 w-full bg-white/5 rounded" />
        </div>
      ))}
    </div>
  );
}


// ─────────────────────────────────────────────────────────
//  Post Card Component
// ─────────────────────────────────────────────────────────

function PostCard({ post, currentUserId, onUserClick }: { post: any; currentUserId?: string; onUserClick?: (u: QuickProfileUser) => void }) {
  const queryClient = useQueryClient();
  const [userReactions, setUserReactions] = useState<string[]>(post.userReactions || []);
  const [localReactions, setLocalReactions] = useState(post.reactions);

  useEffect(() => {
    setUserReactions(post.userReactions || []);
    setLocalReactions(post.reactions);
  }, [post.reactions, post.userReactions]);

  const reactMutation = useMutation({
    mutationFn: ({ type }: { type: string }) => api.posts.react(post.id, type),
    onMutate: ({ type }) => {
      const isActive = userReactions.includes(type);
      const counterKey = type.toLowerCase() as keyof typeof localReactions;

      if (isActive) {
        setUserReactions((prev) => prev.filter((r) => r !== type));
        setLocalReactions((prev: any) => ({
          ...prev,
          [counterKey]: Math.max(0, (prev[counterKey] || 0) - 1),
          total: Math.max(0, (prev.total || 0) - 1),
        }));
      } else {
        setUserReactions((prev) => [...prev, type]);
        setLocalReactions((prev: any) => ({
          ...prev,
          [counterKey]: (prev[counterKey] || 0) + 1,
          total: (prev.total || 0) + 1,
        }));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.posts.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err: any) => {
      alert(`Delete Error: ${err.message || 'Unknown error'}`);
    }
  });

  const isOwnPost = currentUserId && post.author?.id === currentUserId;
  const typeBadge = TYPE_BADGES[post.type] || TYPE_BADGES.OPINION;
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Author Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-display font-black border-2"
            style={{
              borderColor: post.author?.army?.colorHex || '#FF2D55',
              color: post.author?.army?.colorHex || '#FF2D55',
              backgroundColor: `${post.author?.army?.colorHex || '#FF2D55'}15`,
            }}
          >
            {(post.author?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => onUserClick?.({ id: post.author?.id, username: post.author?.username, rank: post.author?.rank || 'RECRUIT', armyName: post.author?.army?.name || 'N/A', armyColor: post.author?.army?.colorHex })}
                className="text-white font-bold text-sm hover:underline cursor-pointer"
              >
                {post.author?.username}
              </button>
              <span
                className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border"
                style={{ color: post.author?.army?.colorHex, borderColor: `${post.author?.army?.colorHex}40` }}
              >
                {post.author?.army?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <RankBadge rank={post.author?.rank || 'Recruit'} size="sm" />
              <span className="text-wz-muted text-[9px] font-mono">• {timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Type Badge & Controls */}
        <div className="flex items-center gap-2">
          {isOwnPost && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-wz-muted hover:bg-wz-red/20 hover:text-wz-red hover:border-wz-red/40 transition-colors"
            >
              {deleteMutation.isPending ? '...' : 'DELETE'}
            </button>
          )}
          <span
            className="text-[9px] font-mono font-bold px-2 py-1 rounded-lg border"
            style={{ color: typeBadge.color, borderColor: `${typeBadge.color}30`, backgroundColor: `${typeBadge.color}10` }}
          >
            {typeBadge.emoji} {typeBadge.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.imageUrl && (
          <div className="mt-3 rounded-xl overflow-hidden border border-white/5">
            <img src={post.imageUrl} alt="Post attachment" className="w-full object-cover max-h-96 bg-black/50" />
          </div>
        )}
      </div>

      {/* Reaction Stats Bar */}
      {localReactions.total > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1.5 text-wz-muted text-[10px] font-mono">
            <span className="flex -space-x-1">
              {localReactions.toxic > 0 && <span>☢️</span>}
              {localReactions.clown > 0 && <span>🤡</span>}
              {localReactions.fire > 0 && <span>🔥</span>}
              {localReactions.laugh > 0 && <span>😂</span>}
            </span>
            <span>{localReactions.total} reactions</span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/5" />

      {/* Reaction Buttons */}
      <div className="flex items-center justify-around px-2 py-1.5">
        {REACTIONS.map((r) => {
          const isActive = userReactions.includes(r.type);
          const count = localReactions[r.type.toLowerCase() as keyof typeof localReactions] || 0;

          return (
            <button
              key={r.type}
              onClick={() => reactMutation.mutate({ type: r.type })}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/10 scale-105'
                  : 'hover:bg-white/5'
              }`}
            >
              <span className={`text-sm ${isActive ? 'scale-110' : 'grayscale opacity-60'} transition-all`}>
                {r.emoji}
              </span>
              <span
                className={`text-[10px] font-mono font-bold transition-colors ${
                  isActive ? '' : 'text-wz-muted'
                }`}
                style={isActive ? { color: r.color } : {}}
              >
                {count > 0 ? count : ''}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────────────────
//  Compose Post Modal
// ─────────────────────────────────────────────────────────

function ComposePost({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('OPINION');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const createMutation = useMutation({
    mutationFn: (imageUrl?: string) => api.posts.create(content, postType, imageUrl),
    onSuccess,
    onError: (err: any) => {
      alert(`Post Error: ${err.message || 'Unknown error'}`);
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handlePost = async () => {
    if (selectedImage) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedImage);
        const res = await api.posts.upload(formData);
        if (res.success && res.url) {
          createMutation.mutate(res.url);
        } else {
          setIsUploading(false);
          alert('Failed to upload image. Please try again.');
        }
      } catch (err) {
        setIsUploading(false);
        alert('Image upload error.');
      }
    } else {
      createMutation.mutate(undefined);
    }
  };

  const isPending = createMutation.isPending || isUploading;

  const COMPOSE_TYPES = [
    { key: 'OPINION', label: 'TAKE', emoji: '💬' },
    { key: 'HYPE', label: 'HYPE', emoji: '🔥' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 300, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 300, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-xl"
      >
        <div className="glass-card rounded-b-none border-b-0 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="text-wz-muted text-sm font-mono hover:text-white transition-colors">
              Cancel
            </button>
            <h2 className="text-white font-display font-bold text-sm">NEW POST</h2>
            <WarzoneButton
              variant="primary"
              onClick={handlePost}
              disabled={content.trim().length < 1 || isPending}
              className="!py-1.5 !px-4 !text-xs !rounded-full"
            >
              {isPending ? 'POSTING...' : 'POST 🔥'}
            </WarzoneButton>
          </div>

          {/* Type Selector — only TAKE and HYPE */}
          <div className="flex gap-1.5 mb-4">
            {COMPOSE_TYPES.map((t) => {
              const active = postType === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setPostType(t.key)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border ${
                    active
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/[0.02] border-white/5 text-wz-muted hover:bg-white/5'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              );
            })}
          </div>

          {/* Text Input */}
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholder(postType)}
            maxLength={500}
            rows={4}
            className="w-full bg-white/[0.03] border border-white/10 rounded-t-xl px-4 py-3 text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
          />

          {/* Image Preview */}
          <AnimatePresence>
            {previewUrl && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="relative bg-white/[0.03] border-x border-white/10 px-4 py-2">
                <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="absolute top-4 right-6 bg-black/70 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black transition-colors" title="Remove Photo">✕</button>
                <img src={previewUrl} alt="Preview" className="rounded-lg object-contain max-h-48 w-full bg-black/40 border border-white/10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Toolbar */}
          <div className="bg-white/[0.03] border border-white/10 border-t-0 rounded-b-xl px-4 py-2 flex items-center justify-between">
            <label className="cursor-pointer p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
              </svg>
            </label>
            <span className={`text-[10px] font-mono ${content.length > 450 ? 'text-wz-red' : 'text-wz-muted'}`}>
              {content.length}/500
            </span>
          </div>

          {/* Footer Error */}
          <AnimatePresence>
            {createMutation.isError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-end mt-2">
                <span className="text-wz-red text-[10px] font-mono">Failed to post. Try again.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}


// ─── Helpers ───

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function getPlaceholder(type: string): string {
  switch (type) {
    case 'HYPE': return 'Drop your hype take... 🔥\nWho\'s winning tonight?';
    default: return 'Share your opinion...\nWhat\'s on your mind, warrior?';
  }
}

// Convert API duel shape → Zustand Duel shape for DuelPostCard/DuelReadView
function apiDuelToStore(d: any) {
  return {
    id: d.id,
    topic: { id: d.id, text: d.topicText, category: d.topicCategory, side1Label: 'FOR', side2Label: 'AGAINST' },
    player1: d.player1,
    player2: d.player2,
    messages: d.messages || [],
    status: d.status,
    startedAt: d.startedAt,
    endedAt: d.endedAt,
    verdictAt: d.verdictAt,
    player1Reactions: { fire: 0, brutal: 0, facts: 0, toxic: 0, ltake: 0 },
    player2Reactions: { fire: 0, brutal: 0, facts: 0, toxic: 0, ltake: 0 },
    winner: d.winnerId,
    myReactions: { player1: null, player2: null },
    isReal: false,
    player1Votes: d.player1Votes || 0,
    player2Votes: d.player2Votes || 0,
    myVote: d.myVote || null,
    hypeCount: d.hypeCount || 0,
    myHype: d.myHype || false,
  };
}
