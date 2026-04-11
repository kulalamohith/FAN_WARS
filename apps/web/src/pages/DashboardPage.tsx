import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RankBadge } from '../components/ui/RankBadge';
import LevelUpModal from '../components/ui/LevelUpModal';
import RoastGenerator from '../components/features/RoastGenerator';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useState, useEffect } from 'react';

const TEAM_COLORS: Record<string, string> = {
  CSK: '#FFFF3C', RCB: '#EC1C24', MI: '#004BA0', KKR: '#2E0854',
  SRH: '#F26522', DC: '#00008B', PBKS: '#ED1B24', RR: '#EA1A85',
  LSG: '#0057E2', GT: '#1B2133',
};

const WAR_CRIES = [
  "🔥 CSK fans are on FIRE today!",
  "⚔️ MI vs RCB rivalry reaches boiling point!",
  "💀 KKR army crushes all opponents!",
  "🏏 SRH fans dominate the War Room!",
  "👑 New Warlord crowned in the leaderboard!",
  "🛡️ 500+ Bunkers created this week!",
];

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
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % WAR_CRIES.length), 4000);
    return () => clearInterval(t);
  }, []);

  /* ── 3d hover state ── */
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useTransform(cardY, [-150, 150], [15, -15]);
  const rotateY = useTransform(cardX, [-150, 150], [-15, 15]);

  function handleCardMouse(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    cardX.set(event.clientX - centerX);
    cardY.set(event.clientY - centerY);
  }

  function handleCardLeave() {
    cardX.set(0);
    cardY.set(0);
  }

  /* ── data ── */
  const { data: profile } = useQuery({ queryKey: ['me'], queryFn: () => api.auth.me(), refetchInterval: 10000 });
  const { data: matchesData, isLoading: matchesLoading } = useQuery({ queryKey: ['matches', 'live'], queryFn: () => api.matches.live(), refetchInterval: 15000 });
  const { data: leaderboardData } = useQuery({ queryKey: ['leaderboard', 'top3'], queryFn: () => api.leaderboard.getTop(), refetchInterval: 60000 });
  const { data: armyLeaderboard } = useQuery({ queryKey: ['leaderboard', 'armies'], queryFn: () => api.leaderboard.armies(), refetchInterval: 60000 });
  const { data: roastsData } = useQuery({ queryKey: ['roasts', 'legendary'], queryFn: () => api.roasts.feed('viral', undefined) });
  const { data: myBunkersData } = useQuery({ queryKey: ['bunkers', 'my'], queryFn: () => api.bunkers.my(), refetchInterval: 15000 });

  /* ── rank-up ── */
  useEffect(() => {
    if (profile && user) {
      if (profile.rank !== user.rank && user.rank !== 'Recruit') { setNewRank(profile.rank); setShowLevelUp(true); }
      if (profile.totalWarPoints !== user.totalWarPoints || profile.rank !== user.rank) {
        setUser({ ...user, totalWarPoints: profile.totalWarPoints, rank: profile.rank });
      }
    }
  }, [profile, user, setUser]);

  /* ── mutations ── */
  const createBunkerMut = useMutation({
    mutationFn: (matchId: string) => api.bunkers.create(bunkerName, matchId),
    onSuccess: (r) => { setShowCreateBunker(''); setBunkerName(''); navigate(`/bunkers/${r.bunker.id}`); },
  });
  const joinBunkerMut = useMutation({
    mutationFn: () => api.bunkers.join(inviteCode),
    onSuccess: (r) => { setShowJoinBunker(false); setInviteCode(''); navigate(`/bunkers/${r.bunkerId}`); },
  });

  const matches = matchesData?.matches || [];
  const topRoasts = roastsData?.roasts?.slice(0, 3) || [];
  const topWarriors = leaderboardData?.leaderboard?.slice(0, 3) || [];
  const topArmies = armyLeaderboard?.armies?.slice(0, 5) || [];
  const myBunkers = myBunkersData?.bunkers || [];

  const armyColor = profile?.army?.colorHex || user?.army?.colorHex || '#FF2D55';
  const armyName = profile?.army?.name || (typeof user?.army === 'string' ? user?.army : user?.army?.name) || '';

  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'; })();

  /* ── shared styles ── */
  const section = 'mb-8';
  const sectionHead = 'flex items-center justify-between mb-4';
  const sectionTitle = 'text-white font-display font-extrabold text-base tracking-wide';
  const sectionLink = 'text-[10px] font-mono font-bold uppercase tracking-wider hover:text-white transition-colors cursor-pointer';

  return (
    <div className="relative min-h-screen pb-24">
      <AnimatedBackground />

      {/* ══════════════════ HEADER ══════════════════ */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer select-none md:hidden" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo_shield.png" alt="" className="w-8 h-8 object-contain" />
            <span className="text-white font-display font-black text-sm tracking-wider">RIVALRY</span>
          </div>
          <div className="hidden md:flex ml-4">
             {/* Desktop placeholder for left side of header if needed */}
          </div>
          <div onClick={() => navigate('/profile')} className="flex items-center gap-2 cursor-pointer group">
            <div className="text-right">
              <p className="text-white text-[11px] font-bold leading-none group-hover:text-white/80 transition-colors">{user?.username || 'Fan'}</p>
              <p className="text-[9px] font-mono mt-0.5" style={{ color: armyColor }}>{armyName}</p>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-black shadow-lg" style={{ background: `linear-gradient(135deg, ${armyColor}, ${armyColor}cc)` }}>
              {(user?.username || 'F')[0].toUpperCase()}
            </div>
          </div>
        </div>
        {/* Ticker */}
        <div className="border-t border-wz-red/20 bg-[#FFD60A] py-1.5 overflow-hidden shadow-[0_5px_20px_rgba(255,214,10,0.15)] relative">
          <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-[#FFD60A] to-transparent z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-[#FFD60A] to-transparent z-10" />
          <div className="marquee-container">
            <div className="marquee-content font-mono font-black text-[10px] md:text-xs tracking-widest text-black uppercase">
              <span className="mx-8">⚠️ CLUELESS_FAN99 LOST 500 PTS</span>
              <span className="mx-8">🔥 DHONI_GOAT ON A 5-DAY STREAK</span>
              <span className="mx-8">⚔️ RCB ARMY OVERTOOK MI IN LEADERBOARD</span>
              <span className="mx-8">💀 ROAST BY @VIRAT_STAN WENT VIRAL (2K UPVOTES)</span>
              <span className="mx-8">🚨 NEW SEASON LOOT CRATES AVAILABLE</span>
              <span className="mx-8">⚠️ CLUELESS_FAN99 LOST 500 PTS</span>
              <span className="mx-8">🔥 DHONI_GOAT ON A 5-DAY STREAK</span>
              <span className="mx-8">⚔️ RCB ARMY OVERTOOK MI IN LEADERBOARD</span>
              <span className="mx-8">💀 ROAST BY @VIRAT_STAN WENT VIRAL (2K UPVOTES)</span>
              <span className="mx-8">🚨 NEW SEASON LOOT CRATES AVAILABLE</span>
            </div>
          </div>
        </div>
      </header>

      {/* ══════════════════ CONTENT ══════════════════ */}
      <main className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
            
            {/* ────── SEASON BANNER ────── */}
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className={section}>
              <div className="flex flex-col md:flex-row gap-4 mb-2">
                <div className="flex-1 rounded-2xl p-4 md:p-5 flex items-center justify-between bg-gradient-to-r from-wz-red/20 to-[#FF6B2C]/10 border border-wz-red/30 relative overflow-hidden group cursor-pointer shadow-[0_0_20px_rgba(255,45,85,0.1)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-wz-red/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="relative z-10">
                    <span className="inline-block bg-wz-red text-white text-[9px] font-bold px-2 py-0.5 rounded ml-0.5 mb-1.5 tracking-widest uppercase">Season 1 Active</span>
                    <h2 className="text-white font-display font-black text-xl md:text-2xl">IPL Warzone</h2>
                    <p className="text-white/60 text-[10px] md:text-xs font-mono mt-1">Ends in 45 Days · Rank reset pending</p>
                  </div>
                  <div className="shrink-0 text-center relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-black/40 rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:border-wz-red/50 transition-all mx-auto">
                      <span className="text-2xl md:text-3xl">🎁</span>
                    </div>
                    <span className="text-[9px] md:text-[10px] font-bold text-wz-red mt-1.5 block tracking-wider uppercase">Loot Crate</span>
                  </div>
                </div>

                <div className="rounded-2xl p-4 flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 text-center cursor-pointer hover:bg-white/[0.05] transition-colors md:w-40 shrink-0">
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-2xl md:text-3xl animate-bounce" style={{ animationDuration: '2s' }}>🔥</span>
                    <span className="text-white font-display font-black text-2xl md:text-3xl leading-none">5</span>
                  </div>
                  <span className="text-[#FFD60A] text-[9px] font-mono font-bold tracking-widest uppercase">Day Streak</span>
                  <button className="mt-2 text-[9px] bg-[#FFD60A]/10 text-[#FFD60A] hover:bg-[#FFD60A]/20 px-3 py-1 rounded w-full border border-[#FFD60A]/20 transition-colors font-bold uppercase tracking-wider">
                    Claim +50 🪙
                  </button>
                </div>
              </div>
            </motion.section>

            {/* ────── HERO CARD ────── */}
            <motion.section initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={`${section} relative`}>
              <div onMouseMove={handleCardMouse} onMouseLeave={handleCardLeave} className="perspective-[1200px] w-full cursor-pointer">
                <motion.div style={{ rotateX, rotateY }} className="rounded-2xl overflow-hidden depth-card relative holo-sheen shadow-2xl">
                  <div className="absolute inset-0 z-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url('/noise.png')", backgroundSize: '100px' }} />
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0.8)_50%)] z-10" />
                  <div className="p-6 md:p-8 relative z-20">
                    <div className="flex items-center gap-5 md:gap-8">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shrink-0 bg-black/40 border border-white/10 relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 blur-xl opacity-30" style={{ background: armyColor }} />
                        <img src={`/teams/${armyName.toLowerCase()}.png`} alt="" className="w-12 h-12 md:w-16 md:h-16 object-contain z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/40 text-[10px] md:text-xs font-mono mb-1 uppercase tracking-widest">{greeting}</p>
                        <p className="text-white font-display font-black text-3xl md:text-5xl truncate tracking-tight">{user?.username || 'Warrior'}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="inline-flex items-center text-[10px] md:text-xs font-mono font-black px-3 py-1.5 rounded-lg border" style={{ color: armyColor, background: `${armyColor}14`, borderColor: `${armyColor}40` }}>
                            {armyName} ARMY
                          </span>
                          <RankBadge rank={profile?.rank || user?.rank || 'Recruit'} size="lg" />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-black text-4xl md:text-5xl text-white tracking-tighter tabular-nums drop-shadow-lg">{Number(user?.totalWarPoints || 0).toLocaleString()}</p>
                        <p className="text-white/40 text-[9px] md:text-[10px] font-mono font-bold tracking-[0.3em] mt-2 uppercase">WAR POINTS</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.section>

            {/* ────── QUICK ACTIONS ────── */}
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={section}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {([
                  { icon: '⚔️', label: 'War Room', desc: 'Join the fight', color: '#FF2D55', go: () => navigate('/live') },
                  { icon: '🔥', label: 'Roasts', desc: 'Trending burns', color: '#FF6B2C', go: () => navigate('/roasts') },
                  { icon: '🛡️', label: 'Host', desc: 'Private Watch Room', color: '#FFD60A', go: () => { matches.length ? setShowCreateBunker(matches[0].id) : alert('No live matches!'); } },
                  { icon: '🔗', label: 'Join', desc: 'Enter Room Code', color: '#00FF88', go: () => setShowJoinBunker(true) },
                ] as const).map((a) => (
                  <motion.button key={a.label} whileHover={{ y: -4 }} whileTap={{ scale: 0.95 }} onClick={a.go}
                    className="flex flex-col items-start gap-2 p-4 md:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.04] transition-all cursor-pointer group text-left">
                    <span className="text-2xl md:text-3xl mb-1 group-hover:scale-110 transition-transform origin-left">{a.icon}</span>
                    <div>
                      <span className="block text-xs md:text-sm font-mono font-bold tracking-wider mb-0.5" style={{ color: a.color }}>{a.label.toUpperCase()}</span>
                      <span className="block text-[10px] md:text-xs text-white/30 hidden md:block">{a.desc}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.section>

            {/* ────── MY PRIVATE WAR ROOMS ────── */}
            {myBunkers.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={section}>
                <div className={sectionHead}>
                  <h2 className={sectionTitle}>🛡️ My Private War Rooms</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myBunkers.map((b: any) => (
                    <div 
                      key={b.id} 
                      onClick={() => navigate(`/bunkers/${b.id}`)}
                      className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-wz-yellow/40 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm mb-1">{b.name}</span>
                        <span className="text-[10px] text-white/50 font-mono">
                          {b.match?.homeArmy?.name} vs {b.match?.awayArmy?.name}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded uppercase tracking-widest font-mono font-bold mb-1">
                          CODE: {b.inviteCode}
                        </span>
                        <span className="text-[10px] text-wz-yellow font-mono">{b._count?.members || 0}/12 MEMBERS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* ────── LIVE BATTLEGROUNDS ────── */}
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className={section}>
              <div className={sectionHead}>
                <div className="flex items-center gap-2">
                  <div className="live-dot" />
                  <h2 className={sectionTitle}>Live Battlegrounds</h2>
                </div>
                <button onClick={() => navigate('/live')} className={`${sectionLink} text-[#FF2D55]`}>View All →</button>
              </div>

              {matchesLoading ? (
                <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-white/[0.02] animate-pulse" />)}</div>
              ) : matches.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] py-12 md:py-16 text-center">
                  <motion.p animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-4xl mb-3">🏟️</motion.p>
                  <p className="text-white/40 text-base md:text-lg font-display font-bold">The Arena is Quiet</p>
                  <p className="text-white/20 text-xs font-mono mt-2">No live matches right now. Prepare yourselves.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Spotlight Match */}
                  {matches.slice(0, 1).map((m: any) => {
                    const hc = m.homeArmy.colorHex || TEAM_COLORS[m.homeArmy.name] || '#FF2D55';
                    const ac = m.awayArmy.colorHex || TEAM_COLORS[m.awayArmy.name] || '#007AFF';
                    const isLive = m.status === 'LIVE';

                    return (
                      <div key={m.id} onClick={() => isLive ? navigate(`/war-room/${m.warRoomId || m.id}`) : null} 
                        className={`group block ${isLive ? 'cursor-pointer' : 'cursor-default'}`}>
                        <div className="flex items-center justify-between mb-2.5 px-2">
                           <span className="font-display font-black text-[22px] md:text-3xl tracking-tight" style={{ color: hc, textShadow: `0 0 15px ${hc}40` }}>{m.homeArmy.name}</span>
                           <div className="flex flex-col items-center">
                             <div className={isLive ? "live-dot mb-1" : "w-2 h-2 rounded-full bg-white/20 mb-1"} />
                             <span className="text-[9px] md:text-[10px] font-mono font-bold text-white/40 tracking-[0.3em] uppercase">
                               {isLive ? 'Tug of War' : 'Commencing In'}
                             </span>
                           </div>
                           <span className="font-display font-black text-[22px] md:text-3xl tracking-tight text-right" style={{ color: ac, textShadow: `0 0 15px ${ac}40` }}>{m.awayArmy.name}</span>
                        </div>
                        
                        <div className={`h-14 md:h-20 w-full rounded-2xl overflow-hidden flex relative border-2 shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all ${isLive ? 'group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-white/10' : 'border-white/5 bg-white/[0.02]'}`}>
                           <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay z-10 pointer-events-none"></div>
                           
                           {isLive ? (
                             <>
                               <motion.div initial={{ width: '50%' }} animate={{ width: '65%' }} transition={{ duration: 1.5, type: 'spring', bounce: 0.4 }} className="h-full flex items-center px-4 relative overflow-hidden" style={{ background: `linear-gradient(90deg, ${hc}E6, ${hc})` }}>
                                 <img src={`/teams/${m.homeArmy.name.toLowerCase()}.png`} alt="" className="w-10 h-10 md:w-14 md:h-14 object-contain absolute left-3 opacity-30 mix-blend-plus-lighter" />
                                 <span className="font-mono font-black text-xs md:text-sm text-black ml-auto z-20">65%</span>
                               </motion.div>
                               <div className="h-full bg-white w-1.5 z-20 shadow-[0_0_20px_#fff] relative">
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rotate-45"></div>
                               </div>
                               <div className="h-full flex-1 flex items-center justify-start px-4 relative overflow-hidden" style={{ background: `linear-gradient(270deg, ${ac}E6, ${ac})` }}>
                                 <span className="font-mono font-black text-xs md:text-sm text-black mr-auto z-20 relative">35%</span>
                                 <img src={`/teams/${m.awayArmy.name.toLowerCase()}.png`} alt="" className="w-10 h-10 md:w-14 md:h-14 object-contain absolute right-3 opacity-30 mix-blend-plus-lighter" />
                               </div>
                             </>
                           ) : (
                             <div className="flex-1 flex items-center justify-center bg-gradient-to-r from-white/5 via-white/[0.08] to-white/5">
                                <div className="text-center group-hover:scale-105 transition-transform">
                                  <div className="text-xl md:text-2xl font-display font-black text-white tracking-widest italic glow-text">
                                    <MatchCountdown startTime={m.startTime} />
                                  </div>
                                </div>
                             </div>
                           )}
                        </div>
                        <div className="text-center mt-3">
                           {isLive ? (
                             <span className="inline-block bg-wz-red/10 text-wz-red px-3 py-1 rounded-full text-[10px] md:text-xs font-mono font-bold border border-wz-red/30 group-hover:bg-wz-red group-hover:text-white transition-colors uppercase tracking-widest hover:scale-105">Join Real-Time Battle →</span>
                           ) : (
                             <span className="inline-block text-white/20 text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-[0.2em]">Deploying to frontlines at {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Secondary Matches */}
                  {matches.slice(1, 4).map((m: any, i: number) => {
                    const hc = m.homeArmy.colorHex || TEAM_COLORS[m.homeArmy.name] || '#FF2D55';
                    const ac = m.awayArmy.colorHex || TEAM_COLORS[m.awayArmy.name] || '#007AFF';
                    const isLive = m.status === 'LIVE';

                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 + i * 0.06 }}
                        onClick={() => isLive ? navigate(`/war-room/${m.warRoomId || m.id}`) : null}
                        className={`flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.15] transition-all group shadow-lg shadow-black/20 ${isLive ? 'cursor-pointer' : 'cursor-default'}`}>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img src={`/teams/${m.homeArmy.name.toLowerCase()}.png`} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain p-1.5" style={{ background: `${hc}15`, border: `1px solid ${hc}25` }} />
                          <span className="font-display font-bold text-base md:text-lg text-white truncate">{m.homeArmy.name}</span>
                        </div>
                        <div className="flex flex-col items-center shrink-0 mx-2">
                           {isLive ? (
                             <>
                               <span className="text-[10px] md:text-xs font-display font-black text-white/20">VS</span>
                               <div className="live-dot mt-1" />
                             </>
                           ) : (
                             <span className="text-[9px] font-mono font-bold text-wz-yellow/40 uppercase tracking-widest">
                               {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                           )}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
                          <span className="font-display font-bold text-base md:text-lg text-white truncate text-right">{m.awayArmy.name}</span>
                          <img src={`/teams/${m.awayArmy.name.toLowerCase()}.png`} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-contain p-1.5" style={{ background: `${ac}15`, border: `1px solid ${ac}25` }} />
                        </div>
                        <motion.span whileHover={{ scale: 1.2, x: 2 }} className={`ml-2 md:ml-4 text-xl transition-all shrink-0 ${isLive ? 'text-[#FF2D55] opacity-30 group-hover:opacity-100' : 'text-white/10 opacity-0'}`}>{isLive ? '→' : ''}</motion.span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.section>

            {/* ────── SOCIAL CTA ────── */}
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className={section}>
              <div onClick={() => navigate('/posts')} className="rounded-2xl border border-[#00FF88]/20 bg-gradient-to-br from-[#00FF88]/5 to-transparent p-6 md:p-10 text-center cursor-pointer hover:border-[#00FF88]/40 transition-all group overflow-hidden relative">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                <p className="text-4xl md:text-5xl mb-4">📢</p>
                <h3 className="text-white font-display font-black text-xl md:text-2xl mb-2">Influence the War</h3>
                <p className="text-white/40 text-[11px] md:text-sm font-mono mb-6">Post opinions · Start debates · Rally your Faction</p>
                <WarzoneButton onClick={() => navigate('/posts')} className="mx-auto shadow-xl shadow-[#00FF88]/10">OPEN DISCUSSIONS →</WarzoneButton>
              </div>
            </motion.section>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={sectionHead}>
                <h2 className={sectionTitle}>🏴 Army Dominance</h2>
                <button onClick={() => navigate('/leaderboard')} className={`${sectionLink} text-[#00FF88]`}>Full Board →</button>
              </div>
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden bg-white/[0.015]">
                {topArmies.map((army: any, i: number) => {
                  const c = army.colorHex || TEAM_COLORS[army.name] || '#888';
                  const pts = Number(army.totalPoints || 0);
                  const max = Number(topArmies[0]?.totalPoints || 1);
                  return (
                    <div key={army.id} className={`flex items-center gap-3 px-4 py-3.5 ${i < topArmies.length - 1 ? 'border-b border-white/[0.04]' : ''}`}>
                      <span className="w-6 text-center text-base">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
                      <img src={`/teams/${army.name.toLowerCase()}.png`} alt="" className="w-7 h-7 rounded-lg object-contain p-1 bg-white/[0.02] border border-white/[0.05]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-display font-bold truncate" style={{ color: c }}>{army.name}</span>
                          <span className="text-[10px] font-mono text-white/40 tabular-nums">{pts.toLocaleString()}</span>
                        </div>
                        <div className="h-[4px] bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(pts / max) * 100}%` }} className="h-full" style={{ background: c }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
               <RoastGenerator />
            </motion.section>

            {topRoasts.length > 0 && (
              <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}>
                <div className={sectionHead}>
                  <h2 className={sectionTitle}>💀 Viral Roasts</h2>
                  <button onClick={() => navigate('/roasts')} className={`${sectionLink} text-[#FF6B2C]`}>All →</button>
                </div>
                <div className="space-y-3">
                  {topRoasts.map((r: any) => (
                    <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-white/30 text-[10px] md:text-xs">@{r.author?.username || 'Anon'}</span>
                        <span className="text-[#FF6B2C] text-[10px] font-mono font-bold">🔥 {r.upvoteCount || 0}</span>
                      </div>
                      <p className="text-white/80 text-sm italic italic leading-relaxed line-clamp-3">"{r.content}"</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>
        </div>
      </main>

      <LevelUpModal isOpen={showLevelUp} newRank={newRank} onClose={() => setShowLevelUp(false)} />

      <Modal open={!!showCreateBunker} onClose={() => setShowCreateBunker('')}>
        <h2 className="text-lg font-display font-bold text-[#FFD60A] mb-1">Create Private War Room 🛡️</h2>
        <p className="text-white/40 text-xs mb-4">Host a private watch room for your squad.</p>
        <input type="text" placeholder="Room Name" value={bunkerName} onChange={(e) => setBunkerName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#FFD60A]/50 mb-4 outline-none text-sm" />
        <div className="flex gap-2">
          <WarzoneButton variant="ghost" fullWidth onClick={() => setShowCreateBunker('')}>Cancel</WarzoneButton>
          <WarzoneButton fullWidth onClick={() => createBunkerMut.mutate(showCreateBunker)} disabled={bunkerName.length < 3 || createBunkerMut.isPending}>Create</WarzoneButton>
        </div>
      </Modal>

      <Modal open={showJoinBunker} onClose={() => setShowJoinBunker(false)}>
        <h2 className="text-lg font-display font-bold text-[#FF2D55] mb-1">Join Private War Room 🔒</h2>
        <p className="text-white/40 text-xs mb-4">Enter a 6-character room code.</p>
        <input type="text" placeholder="ROOM CODE" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center tracking-widest font-mono font-bold focus:border-[#FF2D55]/50 mb-4 outline-none uppercase text-sm" />
        <div className="flex gap-2">
          <WarzoneButton variant="ghost" fullWidth onClick={() => setShowJoinBunker(false)}>Cancel</WarzoneButton>
          <WarzoneButton variant="danger" fullWidth onClick={() => joinBunkerMut.mutate()} disabled={inviteCode.length < 5 || joinBunkerMut.isPending}>Join</WarzoneButton>
        </div>
      </Modal>
    </div>
  );
}

/* ═══ Helper Components ═══ */

function MatchCountdown({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState('--h --m --s');

  useEffect(() => {
    const target = new Date(startTime).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('PREPARING WAR...');
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return <span className="font-mono">{timeLeft}</span>;
}

function PodiumSlot({ w, rank, barH, color, crown }: { w: any; rank: number; barH: string; color: string; crown?: boolean }) {
  return (
    <div className={`flex flex-col items-center flex-1 ${rank === 1 ? 'pb-4 z-20' : 'z-10'}`}>
      {crown && (
        <motion.span animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-lg mb-1">👑</motion.span>
      )}
      <div
        className={`${rank === 1 ? 'w-11 h-11' : 'w-9 h-9'} rounded-full flex items-center justify-center font-display font-black text-black mb-1 shadow-lg`}
        style={{ background: `linear-gradient(135deg, ${color}cc, ${color})`, fontSize: rank === 1 ? '14px' : '12px', boxShadow: rank === 1 ? `0 0 20px ${color}40` : 'none' }}
      >
        {(w.username || '?')[0].toUpperCase()}
      </div>
      <RankBadge rank={w.militaryRank} size="sm" className="mb-0.5" />
      <p className={`${rank === 1 ? 'text-xs' : 'text-[10px]'} font-bold font-mono truncate max-w-[70px] mb-1`} style={{ color: rank === 1 ? color : '#fff' }}>
        {w.username}
      </p>
      <div className={`w-full ${barH} rounded-t-xl flex flex-col items-center pt-2`}
        style={{ background: `linear-gradient(180deg, ${color}20, ${color}06)`, borderTop: `${rank === 1 ? 2 : 1}px solid ${color}30`, borderLeft: `1px solid ${color}15`, borderRight: `1px solid ${color}15` }}>
        <span className="font-display font-black text-lg" style={{ color }}>{rank}</span>
        <span className="text-white/15 text-[8px] font-mono mt-0.5">{Number(w.totalPoints || 0).toLocaleString()}</span>
      </div>
    </div>
  );
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-5" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6" style={{ background: 'rgba(15,15,15,0.97)', backdropFilter: 'blur(20px)' }}>
        {children}
      </motion.div>
    </div>
  );
}
