import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import WarzoneButton from '../components/ui/WarzoneButton';
import { RankBadge } from '../components/ui/RankBadge';
import { getArmyTheme } from '../lib/theme';
import { ShareCard } from '../components/ui/ShareCard';
import BadgeCard from '../components/ui/BadgeCard';
import { EditProfileModal } from '../components/ui/EditProfileModal';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import {
  ZapIcon,
  TargetIcon,
  BarChartIcon,
  FlameIcon,
  MessageSquareIcon,
  Edit3Icon,
  CameraIcon,
  TrophyIcon,
  LockIcon,
  PinIcon,
} from '../components/ui/Icons';


/* ─── Helpers ─── */
const tierColor = (t: string) =>
  t === 'GOLD' ? '#FFD700' : t === 'SILVER' ? '#C0C0C0' : '#CD7F32';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};



export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { username: paramUsername } = useParams<{ username?: string }>();
  const queryClient = useQueryClient();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'badges' | 'stats'>('badges');

  // Determine if viewing own profile or another user's
  const isOwnProfile = !paramUsername || paramUsername === user?.username;

  const { data: profile, isLoading } = useQuery({
    queryKey: isOwnProfile ? ['profile-me'] : ['profile-user', paramUsername],
    queryFn: () => isOwnProfile ? api.profile.me() : api.profile.user(paramUsername!),
    refetchInterval: 15000,
  });

  const pinMutation = useMutation({
    mutationFn: ({ badgeKey, pin }: { badgeKey: string; pin: boolean }) =>
      api.profile.pinBadge(badgeKey, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-me'] });
      setSelectedBadge(null);
    },
  });

  const handleShareCard = async () => {
    if (!shareCardRef.current || !user || !profile) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#0a0a0a',
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `warzone-rank-${user.username}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My WARZONE Rank', text: `I'm a ${profile.rank.name} in the ${profile.army.name} Army!` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = file.name; a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) { console.error(err); }
    setIsSharing(false);
  };

  const profileUsername = isOwnProfile ? user?.username : (profile?.user?.username || paramUsername);
  const pinnedBadges = profile?.badges?.filter((b: any) => b.isPinned) || [];
  const earnedBadges = profile?.badges?.filter((b: any) => b.earned) || [];
  const rankColor = profile?.rank?.color || '#6B7280';
  const defaultArmyColor = profile?.army?.colorHex || '#FF2D55';
  const teamTheme = getArmyTheme(profile?.army?.name, defaultArmyColor);
  const armyColor = teamTheme.color;



  /* ── Loading State ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060606' }}>
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 border-2 border-white/10 border-t-white/70 rounded-full"
          />
          <p className="text-white/20 text-xs font-mono tracking-widest uppercase">Loading profile...</p>
        </div>
      </div>
    );
  }


  const progressPct = profile?.rank?.progress ? Math.round(profile.rank.progress * 100) : 0;

  return (
    <div className="min-h-screen pb-28 text-white relative" style={{ background: teamTheme.bgGradient }}>
      
      {/* ══════ BANNER / COVER AREA ══════ */}
      <div 
        className="h-44 w-full relative"
        style={{
          background: `linear-gradient(135deg, ${rankColor}30, ${teamTheme.secondary}80)`,
          borderBottom: `1px solid ${armyColor}30`
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />
        {/* Subtle glow orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full blur-[100px] opacity-30" style={{ backgroundColor: armyColor }} />
        
        {/* BACK BUTTON / LOGOUT */}
        <div className="absolute top-6 right-6 z-20 flex gap-2">
          {!isOwnProfile && (
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-1.5 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-black/80 text-[10px] font-mono font-bold transition-all duration-200 border border-white/10"
            >
              ← BACK
            </button>
          )}
          {isOwnProfile && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="px-4 py-1.5 rounded-full bg-black/40 text-white/50 hover:text-red-400 hover:bg-black/80 text-[10px] font-mono font-bold transition-all duration-200 border border-white/10"
            >
              LOGOUT
            </button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 relative -mt-16 z-10 space-y-6">
        
        {/* ══════ PROFILE INFO AREA ══════ */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="flex flex-col">
          <div className="flex items-end justify-between">
            {/* AVATAR OVERLAPPING BANNER */}
            <div className="relative">
              <div 
                className="w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl font-display font-black bg-black overflow-hidden relative"
                style={{ 
                  borderColor: '#000', 
                  boxShadow: `0 0 0 2px ${rankColor}60, 0 10px 30px ${rankColor}30` 
                }}
              >
                {profile?.user?.profilePictureUrl ? (
                  <img src={profile.user.profilePictureUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  profileUsername?.charAt(0).toUpperCase() || '?'
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full border-[3px] border-black flex items-center justify-center text-[11px] font-black bg-[#111]" 
                style={{ color: rankColor, boxShadow: `0 0 10px ${rankColor}50` }}
              >
                 {profile?.rank?.level || 1}
              </div>
            </div>

            {/* ACTION BUTTONS — only for own profile */}
            {isOwnProfile && (
              <div className="flex gap-3 mb-2 translate-y-2">
                <WarzoneButton 
                  variant="ghost" 
                  className="px-5 py-2 h-auto text-[11px] rounded-xl flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-white/30 text-white font-bold shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-300" 
                  onClick={() => setIsEditOpen(true)}
                >
                   <Edit3Icon className="w-3.5 h-3.5" /> Edit Mode
                </WarzoneButton>
                <WarzoneButton 
                  variant="ghost" 
                  className="px-5 py-2 h-auto text-[11px] rounded-xl flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-lg hover:bg-white/10 hover:border-white/30 text-white font-bold shadow-[0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 transition-all duration-300" 
                  onClick={handleShareCard} 
                  disabled={isSharing}
                >
                   <CameraIcon className="w-3.5 h-3.5" /> {isSharing ? 'Gen...' : 'Share Tag'}
                </WarzoneButton>
              </div>
            )}
          </div>

          {/* NAME, RANK & ARMY */}
          <div className="mt-4">
            <h1 className="flex items-center flex-wrap gap-2 text-3xl font-display font-black tracking-tight leading-none mb-1">
              {profileUsername || 'Warrior'}
              {earnedBadges.slice(0, 4).map((b: any) => (
                <span key={b.key} className="text-xl" title={b.name}>{b.icon}</span>
              ))}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-bold text-white/80 flex items-center gap-1.5">
                {profile?.rank?.icon} {profile?.rank?.name}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span 
                className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md" 
                style={{ color: armyColor, backgroundColor: `${armyColor}15`, border: `1px solid ${armyColor}30` }}
              >
                ⚔️ {profile?.army?.name}
              </span>
            </div>
            
            {/* Bio / Status */}
            <p className="text-[13px] text-white/70 mt-3 font-medium leading-relaxed max-w-sm">
              {profile?.user?.bio || 'Warzone Season 1 operative. Ready for deployment.'}
            </p>

            {/* Rankings */}
            <div className="flex items-center gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
               <div className="px-3 py-2 border border-white/10 bg-[#111] rounded-xl flex items-center gap-2 flex-shrink-0">
                 <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${armyColor}20`, color: armyColor }}>
                   🏆
                 </div>
                 <div>
                   <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold">Team Rank</p>
                   <p className="text-sm font-bold text-white"># {profile?.stats?.intraTeamRank || 1}</p>
                 </div>
               </div>
               
               <button 
                 onClick={() => navigate('/leaderboard?view=team')}
                 className="px-4 py-2 border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl flex items-center gap-2 flex-shrink-0 transition-colors h-[52px]"
               >
                 <BarChartIcon className="w-4 h-4 text-white/70" />
                 <div className="text-left">
                   <span className="block text-[9px] font-mono text-white/40 uppercase tracking-widest font-bold leading-tight">View Full</span>
                   <span className="block text-xs font-bold text-white leading-tight">Leaderboard</span>
                 </div>
               </button>
            </div>
          </div>
        </motion.div>

        {/* ══════ RANK PROGRESS BAR ══════ */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="border-y border-white/10 py-5 my-2">
          {profile?.rank?.nextRank ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/10 text-white bg-[#111]">
                {profile.rank.nextRank.icon}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-[10px] font-mono text-white/40 tracking-widest uppercase font-bold">Progress to {profile.rank.nextRank.name}</p>
                  <p className="text-xs font-bold text-white/80">{progressPct}%</p>
                </div>
                <div className="w-full h-2 rounded-full bg-[#111] border border-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progressPct}%` }} 
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white/30" 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xl font-display font-black text-white/50">MAX RANK EXECUTED</p>
            </div>
          )}
        </motion.div>

        {/* ══════ TABS NAV ══════ */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="flex border-b border-white/10">
          <button 
            onClick={() => setActiveTab('badges')}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'badges' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            Medals
            {activeTab === 'badges' && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex-1 pb-3 text-sm font-bold transition-colors relative ${activeTab === 'stats' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
            Detailed Stats
            {activeTab === 'stats' && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-[2px] bg-white rounded-t-full" />
            )}
          </button>
        </motion.div>

        {/* ══════ TAB CONTENT ══════ */}
        <div className="pt-2 min-h-[300px]">
          <AnimatePresence mode="wait">
            
            {/* --- BADGES TAB --- */}
            {activeTab === 'badges' && (
              <motion.div 
                key="badges"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Highlighted Pinned Badges Row */}
                {pinnedBadges.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/30 mb-3 flex items-center gap-2">
                       <PinIcon className="w-3 h-3" /> Pinned Medals
                    </h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {pinnedBadges.map((b: any, i: number) => (
                        <div key={b.key} 
                             className="flex flex-col items-center gap-2 cursor-pointer group"
                             onClick={() => setSelectedBadge(b)}>
                          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                               style={{ border: `2px solid ${tierColor(b.tier)}`, boxShadow: `0 0 15px ${tierColor(b.tier)}40`, background: `radial-gradient(circle, ${tierColor(b.tier)}15, transparent)`}}>
                            {b.icon}
                          </div>
                          <span className="text-[9px] font-bold text-center text-white/70 w-20 leading-tight">{b.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Badges Grid */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-white/30">
                       All Collection
                    </h3>
                    <span className="text-[10px] font-mono text-white/30 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                      <span style={{ color: earnedBadges.length > 0 ? '#00FF88' : 'inherit' }}>{earnedBadges.length}</span>
                      /{(profile?.badges || []).filter((b: any) => b.name !== 'Die-Hard Loyalist').length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(profile?.badges || [])
                      .filter((b: any) => b.name !== 'Die-Hard Loyalist')
                      .map((badge: any, i: number) => (
                      <BadgeCard
                        key={badge.key}
                        badgeKey={badge.key}
                        name={badge.name}
                        description={badge.description}
                        icon={badge.icon}
                        category={badge.category}
                        maxProgress={badge.maxProgress}
                        earned={badge.earned}
                        tier={badge.tier}
                        progress={badge.progress}
                        isPinned={badge.isPinned}
                        onClick={() => setSelectedBadge(badge)}
                      />
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

            {/* --- STATS TAB --- */}
            {activeTab === 'stats' && (
              <motion.div 
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: <ZapIcon className="w-4 h-4" />, label: 'Current XP', value: (profile?.stats?.totalWarPoints || 0).toLocaleString(), accent: '#FFD60A' },
                    { icon: <TargetIcon className="w-4 h-4" />, label: 'Predictions', value: profile?.stats?.totalPredictions || 0, accent: '#FF6B2C' },
                    { icon: <FlameIcon className="w-4 h-4" />, label: 'Login Streak', value: `${profile?.stats?.loginStreak || 0} Days`, accent: '#FF2D55' },
                    { icon: <MessageSquareIcon className="w-4 h-4" />, label: 'Total Roasts', value: profile?.stats?.totalRoasts || 0, accent: '#BF5AF2' },
                    { icon: <Edit3Icon className="w-4 h-4" />, label: 'Posts Created', value: profile?.stats?.totalPosts || 0, accent: '#007AFF' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl p-4 bg-[#111] border border-white/5 flex flex-col justify-between h-24">
                      <div className="flex items-center gap-2" style={{ color: `${s.accent}80` }}>
                        {s.icon} <span className="text-[10px] font-mono uppercase tracking-wider font-bold">{s.label}</span>
                      </div>
                      <p className="text-2xl font-display font-black text-white">{s.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          BADGE DETAIL MODAL
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.88, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.88, y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <div
                className="rounded-2xl p-6 text-center relative overflow-hidden"
                style={{
                  background: '#111',
                  border: `1px solid ${selectedBadge.earned && selectedBadge.tier
                    ? `${tierColor(selectedBadge.tier)}25`
                    : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: selectedBadge.earned && selectedBadge.tier
                    ? `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${tierColor(selectedBadge.tier)}10`
                    : '0 20px 60px rgba(0,0,0,0.6)',
                }}
              >
                {/* Background glow */}
                {selectedBadge.earned && selectedBadge.tier && (
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-[80px] opacity-[0.15]"
                    style={{ backgroundColor: tierColor(selectedBadge.tier) }}
                  />
                )}

                <div className="relative z-10">
                  {/* Badge Icon */}
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${
                      selectedBadge.earned ? 'border-2' : 'border border-white/[0.06] opacity-40'
                    }`}
                    style={selectedBadge.earned && selectedBadge.tier ? {
                      borderColor: tierColor(selectedBadge.tier),
                      boxShadow: `0 0 25px ${tierColor(selectedBadge.tier)}35`,
                      background: `radial-gradient(circle at 30% 30%, ${tierColor(selectedBadge.tier)}18, transparent 70%)`,
                    } : { background: 'rgba(255,255,255,0.02)' }}
                  >
                    {selectedBadge.earned ? selectedBadge.icon : '🔒'}
                  </div>

                  <h3 className="text-white font-display font-bold text-lg mb-1">
                    {selectedBadge.name}
                  </h3>
                  <p className="text-white/20 text-xs mb-4 leading-relaxed max-w-[85%] mx-auto">
                    {selectedBadge.description}
                  </p>

                  {/* Tier progression */}
                  <div className="flex justify-center gap-2 mb-4">
                    {['BRONZE', 'SILVER', 'GOLD'].map((t) => {
                      const isActive = selectedBadge.tier === t;
                      const col = tierColor(t);
                      return (
                        <div
                          key={t}
                          className="px-3 py-1.5 rounded-lg text-[9px] font-mono tracking-wider font-bold"
                          style={{
                            border: `1px solid ${isActive ? `${col}50` : 'rgba(255,255,255,0.04)'}`,
                            background: isActive ? `${col}12` : 'transparent',
                            color: isActive ? col : 'rgba(255,255,255,0.12)',
                          }}
                        >
                          {t === 'GOLD' ? '🥇' : t === 'SILVER' ? '🥈' : '🥉'} {t}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress */}
                  <div className="mb-5 px-2">
                    <div className="flex justify-between text-[9px] font-mono text-white/20 mb-1.5">
                      <span>Progress</span>
                      <span className="text-white/35 font-bold">{selectedBadge.progress}/{selectedBadge.maxProgress}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: selectedBadge.earned && selectedBadge.tier
                            ? `linear-gradient(90deg, ${tierColor(selectedBadge.tier)}70, ${tierColor(selectedBadge.tier)})`
                            : 'rgba(255,255,255,0.06)',
                        }}
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min((selectedBadge.progress / selectedBadge.maxProgress) * 100, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                      />
                    </div>
                  </div>

                  {/* Pin/Unpin */}
                  {selectedBadge.earned && (
                    <WarzoneButton
                      fullWidth
                      variant={selectedBadge.isPinned ? 'ghost' : 'primary'}
                      className="text-xs py-2.5"
                      loading={pinMutation.isPending}
                      onClick={() => pinMutation.mutate({
                        badgeKey: selectedBadge.key,
                        pin: !selectedBadge.isPinned,
                      })}
                    >
                      {selectedBadge.isPinned ? '📌 Unpin from Dog Tag' : '📌 Pin to Dog Tag'}
                    </WarzoneButton>
                  )}

                  <button
                    onClick={() => setSelectedBadge(null)}
                    className="mt-3 text-[9px] text-white/15 hover:text-white/30 font-mono uppercase tracking-[0.2em] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hidden Share Card ── */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <ShareCard
          ref={shareCardRef}
          username={user?.username || 'Warrior'}
          rank={profile?.rank?.name || 'Battle Fodder'}
          rankLevel={profile?.rank?.level}
          rankIcon={profile?.rank?.icon}
          rankColor={profile?.rank?.color}
          points={profile?.rank?.totalWarPoints || 0}
          armyColor={armyColor}
          armyName={profile?.army?.name || 'Unknown'}
          pinnedBadges={pinnedBadges}
        />
      </div>
      {/* ══════════════════════════════════════════════════════════
          EDIT PROFILE MODAL
          ══════════════════════════════════════════════════════════ */}
      <EditProfileModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        currentBio={profile?.user?.bio || ''} 
        currentDp={profile?.user?.profilePictureUrl || null} 
      />
    </div>
  );
}
