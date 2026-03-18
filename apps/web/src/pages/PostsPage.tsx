import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import { RankBadge } from '../components/ui/RankBadge';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const POST_TYPES = [
  { key: 'ALL', label: 'ALL', emoji: '📡' },
  { key: 'OPINION', label: 'TAKES', emoji: '💬' },
  { key: 'HYPE', label: 'HYPE', emoji: '🔥' },
  { key: 'DEBATE', label: 'DEBATE', emoji: '⚔️' },
  { key: 'MEME', label: 'MEME', emoji: '😂' },
] as const;

const REACTIONS = [
  { type: 'FIRE', emoji: '🔥', label: 'Fire', color: '#FF6B2C' },
  { type: 'ROAST', emoji: '😂', label: 'Roast', color: '#FFD60A' },
  { type: 'DISAGREE', emoji: '👎', label: 'Nah', color: '#FF453A' },
  { type: 'LEGEND', emoji: '👑', label: 'Legend', color: '#BF5AF2' },
] as const;

const TYPE_BADGES: Record<string, { emoji: string; color: string; label: string }> = {
  OPINION: { emoji: '💬', color: '#007AFF', label: 'TAKE' },
  HYPE: { emoji: '🔥', color: '#FF6B2C', label: 'HYPE' },
  DEBATE: { emoji: '⚔️', color: '#FF453A', label: 'DEBATE' },
  MEME: { emoji: '😂', color: '#FFD60A', label: 'MEME' },
};

export default function PostsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showCompose, setShowCompose] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['posts', sort, typeFilter],
    queryFn: ({ pageParam }) =>
      api.posts.feed(sort, typeFilter === 'ALL' ? undefined : typeFilter, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const allPosts = data?.pages.flatMap((p) => p.posts) || [];

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-xl mx-auto px-4 pt-4">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-display font-black text-white tracking-tight">POSTS</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setSort('hot')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${sort === 'hot' ? 'bg-wz-red/20 text-wz-red border border-wz-red/40' : 'bg-white/5 text-wz-muted border border-white/10'}`}
            >🔥 HOT</button>
            <button
              onClick={() => setSort('new')}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold transition-all ${sort === 'new' ? 'bg-wz-neon/20 text-wz-neon border border-wz-neon/40' : 'bg-white/5 text-wz-muted border border-white/10'}`}
            >🆕 NEW</button>
          </div>
        </div>

        {/* ─── Type Filter Chips ─── */}
        <div className="flex gap-1.5 mb-5 overflow-x-auto scrollbar-hide pb-1">
          {POST_TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTypeFilter(t.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all whitespace-nowrap ${
                typeFilter === t.key
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/[0.03] text-wz-muted border border-white/5 hover:bg-white/5'
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ─── Loading ─── */}
        {isLoading && (
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
        )}

        {/* ─── Posts Feed ─── */}
        <div className="space-y-3">
          {allPosts.map((post: any) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id} />
          ))}
        </div>

        {/* ─── Load More ─── */}
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

        {/* ─── Empty State ─── */}
        {!isLoading && allPosts.length === 0 && (
          <GlassCard className="text-center py-12">
            <p className="text-4xl mb-3">📡</p>
            <p className="text-white font-display font-bold mb-1">No posts yet</p>
            <p className="text-wz-muted text-xs font-mono">Be the first to drop a take.</p>
          </GlassCard>
        )}
      </div>

      {/* ─── Floating Compose Button ─── */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-20 right-5 z-50 w-14 h-14 bg-gradient-to-br from-[#FF2D55] to-[#FF6B2C] rounded-2xl flex items-center justify-center text-white text-2xl shadow-[0_0_30px_rgba(255,45,85,0.5)] hover:scale-110 active:scale-95 transition-transform"
      >
        ✏️
      </button>

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
//  Post Card Component
// ─────────────────────────────────────────────────────────

function PostCard({ post, currentUserId }: { post: any; currentUserId?: string }) {
  const queryClient = useQueryClient();
  const [userReactions, setUserReactions] = useState<string[]>(post.userReactions || []);
  const [localReactions, setLocalReactions] = useState(post.reactions);

  const reactMutation = useMutation({
    mutationFn: ({ type }: { type: string }) => api.posts.react(post.id, type),
    onMutate: ({ type }) => {
      const isActive = userReactions.includes(type);
      const counterKey = type.toLowerCase() as keyof typeof localReactions;

      if (isActive) {
        setUserReactions((prev) => prev.filter((r) => r !== type));
        setLocalReactions((prev: any) => ({
          ...prev,
          [counterKey]: Math.max(0, prev[counterKey] - 1),
          total: Math.max(0, prev.total - 1),
        }));
      } else {
        setUserReactions((prev) => [...prev, type]);
        setLocalReactions((prev: any) => ({
          ...prev,
          [counterKey]: prev[counterKey] + 1,
          total: prev.total + 1,
        }));
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const typeBadge = TYPE_BADGES[post.type] || TYPE_BADGES.OPINION;
  const timeAgo = getTimeAgo(post.createdAt);
  const isOwnPost = post.author?.id === currentUserId;

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
              <span className="text-white font-bold text-sm">{post.author?.username}</span>
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

        {/* Type Badge */}
        <span
          className="text-[9px] font-mono font-bold px-2 py-1 rounded-lg border"
          style={{ color: typeBadge.color, borderColor: `${typeBadge.color}30`, backgroundColor: `${typeBadge.color}10` }}
        >
          {typeBadge.emoji} {typeBadge.label}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Reaction Stats Bar */}
      {localReactions.total > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-1.5 text-wz-muted text-[10px] font-mono">
            <span className="flex -space-x-1">
              {localReactions.fire > 0 && <span>🔥</span>}
              {localReactions.roast > 0 && <span>😂</span>}
              {localReactions.disagree > 0 && <span>👎</span>}
              {localReactions.legend > 0 && <span>👑</span>}
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

  const createMutation = useMutation({
    mutationFn: () => api.posts.create(content, postType),
    onSuccess,
  });

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
              onClick={() => createMutation.mutate()}
              disabled={content.trim().length < 1 || createMutation.isPending}
              className="!py-1.5 !px-4 !text-xs !rounded-full"
            >
              {createMutation.isPending ? '...' : 'POST 🔥'}
            </WarzoneButton>
          </div>

          {/* Type Selector */}
          <div className="flex gap-1.5 mb-4">
            {(['OPINION', 'HYPE', 'DEBATE', 'MEME'] as const).map((t) => {
              const badge = TYPE_BADGES[t];
              const active = postType === t;
              return (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border ${
                    active
                      ? 'bg-white/10 border-white/20'
                      : 'bg-white/[0.02] border-white/5 text-wz-muted hover:bg-white/5'
                  }`}
                  style={active ? { color: badge.color } : {}}
                >
                  {badge.emoji} {badge.label}
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
            rows={5}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 resize-none focus:outline-none focus:border-white/20 transition-colors"
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3">
            <span className={`text-[10px] font-mono ${content.length > 450 ? 'text-wz-red' : 'text-wz-muted'}`}>
              {content.length}/500
            </span>
            {createMutation.isError && (
              <span className="text-wz-red text-[10px] font-mono">Failed to post. Try again.</span>
            )}
          </div>
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
    case 'DEBATE': return 'Start a debate... ⚔️\nKohli vs Rohit, who\'s the GOAT?';
    case 'MEME': return 'Drop a meme idea... 😂\nDescribe or quote it';
    default: return 'Share your opinion...\nWhat\'s on your mind, warrior?';
  }
}
