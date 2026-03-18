import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RankBadge } from '../components/ui/RankBadge';
import LevelUpModal from '../components/ui/LevelUpModal';
import { RivalryBrandHeader } from '../components/ui/RivalryLogo';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newRank, setNewRank] = useState('');
  const [showCreateBunker, setShowCreateBunker] = useState('');
  const [showJoinBunker, setShowJoinBunker] = useState(false);
  const [bunkerName, setBunkerName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // --- DATA ---
  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    refetchInterval: 10000,
  });

  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => api.matches.live(),
    refetchInterval: 15000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', 'top3'],
    queryFn: () => api.leaderboard.getTop(),
    refetchInterval: 60000,
  });

  const { data: armyLeaderboard } = useQuery({
    queryKey: ['leaderboard', 'armies'],
    queryFn: () => api.leaderboard.armies(),
    refetchInterval: 60000,
  });

  const { data: roastsData } = useQuery({
    queryKey: ['roasts', 'legendary'],
    queryFn: () => api.roasts.feed('viral', undefined),
  });

  // --- RANK UP DETECTION ---
  useEffect(() => {
    if (profile && user) {
      if (profile.rank !== user.rank && user.rank !== 'Recruit') {
        setNewRank(profile.rank);
        setShowLevelUp(true);
      }
      if (profile.totalWarPoints !== user.totalWarPoints || profile.rank !== user.rank) {
        setUser({ ...user, totalWarPoints: profile.totalWarPoints, rank: profile.rank });
      }
    }
  }, [profile, user, setUser]);

  // --- MUTATIONS ---
  const createBunkerMutation = useMutation({
    mutationFn: (matchId: string) => api.bunkers.create(bunkerName, matchId),
    onSuccess: (res) => {
      setShowCreateBunker('');
      setBunkerName('');
      queryClient.invalidateQueries({ queryKey: ['bunker', res.bunker.id] });
      navigate(`/bunkers/${res.bunker.id}`);
    }
  });

  const joinBunkerMutation = useMutation({
    mutationFn: () => api.bunkers.join(inviteCode),
    onSuccess: (res) => {
      setShowJoinBunker(false);
      setInviteCode('');
      navigate(`/bunkers/${res.bunkerId}`);
    }
  });

  const matches = matchesData?.matches || [];
  const topRoasts = roastsData?.roasts?.slice(0, 2) || [];
  const topWarriors = leaderboardData?.leaderboard?.slice(0, 3) || [];
  const topArmies = armyLeaderboard?.armies?.slice(0, 3) || [];

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />

      {/* =============== TOP NAV =============== */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <RivalryBrandHeader />
          <div className="flex items-center gap-3">
            <div className="text-right mr-2 mt-1">
              <p className="text-white text-sm font-medium leading-tight mb-1">{user?.username || 'Fan'}</p>
              <RankBadge rank={user?.rank || 'Recruit'} size="sm" />
            </div>
            <div
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full border border-orange-500/30 bg-gradient-to-br from-[#FF2D55] to-[#FF6B2C] flex items-center justify-center text-white text-sm font-black font-display shadow-[0_0_15px_rgba(255,107,44,0.4)] cursor-pointer hover:scale-110 transition-transform"
            >
              {(user?.username || 'F')[0].toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* =============== CONTENT =============== */}
      <main className="relative z-10 max-w-xl mx-auto px-5 pt-6">

        {/* ──────── SECTION 1: Identity Card ──────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-black shadow-lg"
                  style={{
                    backgroundColor: `${profile?.army?.colorHex || '#FF2D55'}20`,
                    color: profile?.army?.colorHex || '#FF2D55',
                    border: `2px solid ${profile?.army?.colorHex || '#FF2D55'}40`,
                  }}
                >
                  {(user?.username || 'W')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-display font-bold text-lg">{user?.username || 'Warrior'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                      style={{ color: profile?.army?.colorHex, borderColor: profile?.army?.colorHex + '40' }}
                    >
                      {profile?.army?.name || '—'} ARMY
                    </span>
                    <RankBadge rank={profile?.rank || 'Recruit'} size="sm" />
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-display font-black text-2xl">
                  {Number(user?.totalWarPoints || 0).toLocaleString()}
                </p>
                <p className="text-white/30 text-[9px] font-mono tracking-wider">WAR POINTS</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ──────── SECTION 2: Quick Actions ──────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-6">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="glass-card p-3 flex flex-col items-center gap-1.5 hover:border-wz-red/40 transition-all cursor-pointer"
            >
              <span className="text-lg">⚔️</span>
              <span className="text-wz-red text-[9px] font-mono font-bold">ADMIN</span>
            </button>
            <button
              onClick={() => {
                if (matches.length) setShowCreateBunker(matches[0].id);
                else alert('No live matches available!');
              }}
              className="glass-card p-3 flex flex-col items-center gap-1.5 hover:border-wz-yellow/40 transition-all cursor-pointer"
            >
              <span className="text-lg">🛡️</span>
              <span className="text-wz-yellow text-[9px] font-mono font-bold">BUNKER</span>
            </button>
            <button
              onClick={() => setShowJoinBunker(true)}
              className="glass-card p-3 flex flex-col items-center gap-1.5 hover:border-wz-neon/40 transition-all cursor-pointer"
            >
              <span className="text-lg">🔗</span>
              <span className="text-wz-neon text-[9px] font-mono font-bold">JOIN</span>
            </button>
          </div>
        </motion.div>

        {/* ──────── SECTION 3: Live Matches (Compact) ──────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <h3 className="text-white font-display font-bold text-sm">LIVE MATCHES</h3>
            </div>
            <button onClick={() => navigate('/live')} className="text-wz-red text-[10px] font-mono font-bold hover:text-white transition-colors">
              VIEW ALL →
            </button>
          </div>

          {matchesLoading ? (
            <div className="glass-card p-6 animate-pulse">
              <div className="h-12 w-full bg-white/5 rounded-xl" />
            </div>
          ) : matches.length === 0 ? (
            <GlassCard className="text-center py-8">
              <motion.p animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-3xl mb-2">🏏</motion.p>
              <p className="text-wz-muted text-xs font-mono">No live matches right now</p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              {matches.slice(0, 2).map((match: any) => (
                <div
                  key={match.id}
                  onClick={() => navigate(`/war-room/${match.warRoomId || match.id}`)}
                  className="glass-card p-4 flex items-center justify-between cursor-pointer hover:border-wz-red/30 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-display"
                      style={{ backgroundColor: `${match.homeArmy.colorHex}20`, color: match.homeArmy.colorHex }}>
                      {match.homeArmy.name.slice(0, 3)}
                    </div>
                    <span className="text-white/15 text-xs font-display font-bold">VS</span>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-display"
                      style={{ backgroundColor: `${match.awayArmy.colorHex}20`, color: match.awayArmy.colorHex }}>
                      {match.awayArmy.name.slice(0, 3)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/war-room/${match.warRoomId}`); }}
                    className="px-3 py-1.5 rounded-lg bg-wz-red/20 hover:bg-wz-red/40 text-wz-red text-[10px] font-mono font-bold border border-wz-red/30 transition-colors"
                  >
                    ENTER →
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ──────── SECTION 4: Army Leaderboard ──────── */}
        {topArmies.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏴</span>
                <h3 className="text-white font-display font-bold text-sm">TOP ARMIES TODAY</h3>
              </div>
              <button onClick={() => navigate('/leaderboard')} className="text-wz-neon text-[10px] font-mono font-bold hover:text-white transition-colors">
                FULL BOARD →
              </button>
            </div>
            <GlassCard className="divide-y divide-white/5">
              {topArmies.map((army: any, i: number) => (
                <div key={army.id || i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{['🥇', '🥈', '🥉'][i]}</span>
                    <span
                      className="font-display font-bold text-sm"
                      style={{ color: army.colorHex || '#fff' }}
                    >
                      {army.name || army.armyName}
                    </span>
                  </div>
                  <span className="text-wz-muted text-xs font-mono">{Number(army.totalPoints || army.seasonScore || 0).toLocaleString()} WP</span>
                </div>
              ))}
            </GlassCard>
          </motion.div>
        )}

        {/* ──────── SECTION 5: Legendary Roasts ──────── */}
        {topRoasts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🔥</span>
                <h3 className="text-white font-display font-bold text-sm">LEGENDARY ROASTS</h3>
              </div>
              <button onClick={() => navigate('/posts')} className="text-[#FF6B2C] text-[10px] font-mono font-bold hover:text-white transition-colors">
                ALL POSTS →
              </button>
            </div>
            <div className="space-y-2">
              {topRoasts.map((roast: any) => (
                <GlassCard key={roast.id} className="p-4 border-white/5 hover:border-[#FF6B2C]/30 transition-colors cursor-pointer" onClick={() => navigate('/posts')}>
                  <p className="text-white/80 text-sm mb-2 line-clamp-2">"{roast.content}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-wz-muted text-[10px] font-mono">by {roast.author?.username || 'Anon'}</span>
                    <span className="text-[#FF6B2C] text-[10px] font-mono font-bold">🔥 {roast.upvoteCount || 0}</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        )}

        {/* ──────── SECTION 6: Global Rank Podium ──────── */}
        {topWarriors.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">👑</span>
                <h3 className="text-white font-display font-bold text-sm">GLOBAL RANK</h3>
              </div>
              <button onClick={() => navigate('/leaderboard')} className="text-wz-yellow text-[10px] font-mono font-bold hover:text-white transition-colors">
                TOP 50 →
              </button>
            </div>
            <GlassCard className="p-6 border-wz-yellow/20 pb-0 overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-wz-yellow/5 to-transparent pointer-events-none" />
              <div className="flex items-end justify-center gap-2 h-44">
                {/* Silver (Rank 2) */}
                <div className="flex flex-col items-center flex-1 z-10">
                  <RankBadge rank={topWarriors[1].militaryRank} size="sm" className="mb-1" />
                  <p className="text-white text-[10px] font-bold font-mono truncate max-w-[70px] mb-1">{topWarriors[1].username}</p>
                  <div className="w-full h-20 bg-gradient-to-t from-gray-400/20 to-gray-300/10 border-t border-gray-300 rounded-t-lg flex items-start justify-center pt-2">
                    <span className="text-gray-300 font-display font-black text-lg">2</span>
                  </div>
                </div>
                {/* Gold (Rank 1) */}
                <div className="flex flex-col items-center flex-1 pb-4 z-20">
                  <div className="w-8 h-8 rounded-full mb-1 bg-gradient-to-br from-wz-yellow to-orange-500 shadow-[0_0_15px_rgba(255,214,10,0.5)] flex items-center justify-center text-black text-sm">👑</div>
                  <RankBadge rank={topWarriors[0].militaryRank} size="sm" className="mb-1" />
                  <p className="text-wz-yellow text-xs font-bold font-mono truncate max-w-[80px] mb-1">{topWarriors[0].username}</p>
                  <div className="w-full h-28 bg-gradient-to-t from-wz-yellow/30 to-wz-yellow/10 border-t-2 border-wz-yellow shadow-[0_0_30px_rgba(255,214,10,0.2)] rounded-t-lg flex items-start justify-center pt-2 relative">
                    <div className="absolute inset-0 bg-wz-yellow/20 animate-pulse mix-blend-overlay" />
                    <span className="text-wz-yellow font-display font-black text-xl drop-shadow-[0_0_10px_rgba(255,214,10,0.8)]">1</span>
                  </div>
                </div>
                {/* Bronze (Rank 3) */}
                <div className="flex flex-col items-center flex-1 z-10">
                  <RankBadge rank={topWarriors[2].militaryRank} size="sm" className="mb-1" />
                  <p className="text-white text-[10px] font-bold font-mono truncate max-w-[70px] mb-1">{topWarriors[2].username}</p>
                  <div className="w-full h-16 bg-gradient-to-t from-[#CD7F32]/20 to-[#CD7F32]/10 border-t border-[#CD7F32] rounded-t-lg flex items-start justify-center pt-2">
                    <span className="text-[#CD7F32] font-display font-black text-lg">3</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

      </main>

      {/* ─── LEVEL UP MODAL ─── */}
      <LevelUpModal isOpen={showLevelUp} newRank={newRank} onClose={() => setShowLevelUp(false)} />

      {/* ─── CREATE BUNKER MODAL ─── */}
      {showCreateBunker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm p-6 border-wz-yellow/30">
            <h2 className="text-xl font-display font-bold text-wz-yellow mb-2">Create Bunker 🛡️</h2>
            <p className="text-white/50 text-xs mb-4">Host a private watch room for your friends.</p>
            <input
              type="text"
              placeholder="Bunker Name (e.g. Squad Goals)"
              value={bunkerName}
              onChange={(e) => setBunkerName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-wz-yellow/50 mb-4 outline-none"
            />
            <div className="flex gap-2">
              <WarzoneButton variant="ghost" fullWidth onClick={() => setShowCreateBunker('')}>Cancel</WarzoneButton>
              <WarzoneButton variant="primary" fullWidth onClick={() => createBunkerMutation.mutate(showCreateBunker)} disabled={bunkerName.length < 3 || createBunkerMutation.isPending}>
                Create
              </WarzoneButton>
            </div>
            {createBunkerMutation.isError && <p className="text-wz-neon text-xs mt-2 text-center">Creation failed.</p>}
          </GlassCard>
        </div>
      )}

      {/* ─── JOIN BUNKER MODAL ─── */}
      {showJoinBunker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm p-6 border-wz-red/30">
            <h2 className="text-xl font-display font-bold text-wz-red mb-2">Join Bunker 🔒</h2>
            <p className="text-white/50 text-xs mb-4">Enter a 6-character code to join a private room.</p>
            <input
              type="text"
              placeholder="INVITE CODE"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-widest font-mono font-bold focus:border-wz-red/50 mb-4 outline-none uppercase"
            />
            <div className="flex gap-2">
              <WarzoneButton variant="ghost" fullWidth onClick={() => setShowJoinBunker(false)}>Cancel</WarzoneButton>
              <WarzoneButton variant="danger" fullWidth onClick={() => joinBunkerMutation.mutate()} disabled={inviteCode.length < 5 || joinBunkerMutation.isPending}>
                Join
              </WarzoneButton>
            </div>
            {joinBunkerMutation.isError && <p className="text-wz-red text-xs mt-2 text-center">Invalid invite code.</p>}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
