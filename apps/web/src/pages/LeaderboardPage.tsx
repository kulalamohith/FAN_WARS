import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RankBadge } from '../components/ui/RankBadge';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import GlassCard from '../components/ui/GlassCard';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = (searchParams.get('view') as 'warriors' | 'armies' | 'team') || 'warriors';
  const [tab, setTab] = useState<'warriors' | 'armies' | 'team'>(defaultTab);

  // Update URL purely visually when tab changes
  const handleTabChange = (t: 'warriors' | 'armies' | 'team') => {
    setTab(t);
    setSearchParams({ view: t });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard', 'top50'],
    queryFn: () => api.leaderboard.getTop(),
    refetchInterval: 30000, 
  });

  const { data: armyData, isLoading: armyLoading } = useQuery({
    queryKey: ['leaderboard', 'armies'],
    queryFn: () => api.leaderboard.armies(),
    refetchInterval: 30000,
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['leaderboard', 'team-context'],
    queryFn: () => api.leaderboard.teamContext(),
    enabled: tab === 'team',
    refetchInterval: 30000,
  });

  return (
    <div className="relative min-h-screen flex flex-col">
      <AnimatedBackground />

      {/* === HUD Header === */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-wz-border/20">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="text-wz-muted hover:text-wz-white transition-colors text-sm font-mono flex items-center gap-2"
          >
            ← <span className="uppercase tracking-widest text-xs">Return</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <h1 className="text-white font-display font-black text-lg uppercase tracking-wider">Leaderboards</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-6 pb-24">
        
        {/* === Tab Toggle === */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleTabChange('team')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${tab === 'team' ? 'bg-[#007AFF] text-white shadow-[0_0_20px_rgba(0,122,255,0.3)]' : 'bg-white/5 text-wz-muted'}`}
          >
            ⚔️ Team
          </button>
          <button
            onClick={() => handleTabChange('warriors')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${tab === 'warriors' ? 'bg-wz-neon text-black shadow-[0_0_20px_rgba(0,255,136,0.3)]' : 'bg-white/5 text-wz-muted'}`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => handleTabChange('armies')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${tab === 'armies' ? 'bg-wz-red text-white shadow-[0_0_20px_rgba(255,45,85,0.3)]' : 'bg-white/5 text-wz-muted'}`}
          >
            🛡️ Armies
          </button>
        </div>

        {/* === Warriors Tab === */}
        {tab === 'warriors' && (
          <>
            <div className="text-center mb-6">
              <p className="text-wz-muted text-xs font-mono mb-1">SEASON 1 STANDINGS</p>
              <p className="text-wz-white/80 text-sm">Top 50 predictors in the Warzone.</p>
            </div>

            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="glass-card h-16 animate-pulse border-wz-border/10" />
                ))}
              </div>
            )}

            {error && (
              <GlassCard className="text-center py-10 border-wz-red/20">
                <p className="text-3xl mb-3">📡</p>
                <p className="text-wz-red font-display font-bold mb-1">Comm Failure</p>
                <p className="text-wz-muted text-xs font-mono">Could not retrieve leadership data.</p>
              </GlassCard>
            )}

            {data?.leaderboard && (
              <div className="space-y-3">
                {data.leaderboard.map((warrior: any, i: number) => {
                  const isCurrentUser = warrior.id === user?.id;
                  
                  const rankStyles = 
                    i === 0 ? 'border-wz-yellow/50 bg-wz-yellow/5' :
                    i === 1 ? 'border-gray-300/50 bg-gray-300/5' :
                    i === 2 ? 'border-[#CD7F32]/50 bg-[#CD7F32]/5' :
                    isCurrentUser ? 'border-[#00FF88]/40 bg-[#00FF88]/10 shadow-[0_0_15px_rgba(0,255,136,0.1)]' :
                    'border-wz-border/10 hover:border-wz-border/30';

                  const numberColor = 
                    i === 0 ? 'text-wz-yellow drop-shadow-[0_0_5px_rgba(255,214,10,0.8)]' :
                    i === 1 ? 'text-gray-300' :
                    i === 2 ? 'text-[#CD7F32]' :
                    'text-wz-white/30';

                  return (
                    <motion.div
                      key={warrior.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, ease: "easeOut" }}
                    >
                      <div className={`glass-card p-4 flex items-center gap-4 transition-colors ${rankStyles}`}>
                        <div className="w-8 flex justify-center">
                          <span className={`font-display font-black text-xl italic ${numberColor}`}>
                            {i + 1}
                          </span>
                        </div>
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-black text-sm relative"
                          style={{ 
                            backgroundColor: `${warrior.army.colorHex}15`, 
                            color: warrior.army.colorHex,
                            border: `1px solid ${warrior.army.colorHex}30`
                          }}
                        >
                          {warrior.army.name[0]}
                          {isCurrentUser && (
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FF88] rounded-full border border-black" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-mono font-bold truncate ${isCurrentUser ? 'text-[#00FF88]' : 'text-wz-white'}`}>
                              {warrior.username}
                            </p>
                            {isCurrentUser && (
                              <span className="text-[9px] uppercase tracking-widest text-[#00FF88] bg-[#00FF88]/20 px-1.5 rounded">You</span>
                            )}
                          </div>
                          <RankBadge rank={warrior.militaryRank} size="sm" />
                        </div>
                        <div className="text-right">
                          <p className="text-wz-white font-display font-black text-lg leading-none">
                            {Number(warrior.totalWarPoints).toLocaleString()}
                          </p>
                          <p className="text-wz-muted text-[9px] font-mono tracking-widest mt-1">WP</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* === Armies Tab === */}
        {tab === 'armies' && (
          <>
            <div className="text-center mb-6">
              <p className="text-wz-muted text-xs font-mono mb-1">ARMY STANDINGS</p>
              <p className="text-wz-white/80 text-sm">Total War Points earned by each franchise.</p>
            </div>

            {armyLoading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className="glass-card h-20 animate-pulse border-wz-border/10" />
                ))}
              </div>
            )}

            {armyData?.armies && (
              <div className="space-y-3">
                {armyData.armies.map((army: any, i: number) => {
                  const isUserArmy = army.id === user?.army?.id;

                  return (
                    <motion.div
                      key={army.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, ease: "easeOut" }}
                    >
                      <div
                        className={`glass-card p-5 flex items-center gap-4 transition-colors ${isUserArmy ? 'border-[#00FF88]/40 bg-[#00FF88]/5' : 'border-wz-border/10'}`}
                        style={{ borderColor: i < 3 ? `${army.colorHex}60` : undefined }}
                      >
                        {/* Position */}
                        <div className="w-8 flex justify-center">
                          <span className="font-display font-black text-2xl italic" style={{ color: army.colorHex }}>
                            {army.rankPosition}
                          </span>
                        </div>

                        {/* Army Badge */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg"
                          style={{
                            backgroundColor: `${army.colorHex}15`,
                            color: army.colorHex,
                            border: `2px solid ${army.colorHex}40`,
                          }}
                        >
                          {army.name.slice(0, 2)}
                        </div>

                        {/* Army Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-display font-bold text-base" style={{ color: army.colorHex }}>
                              {army.name}
                            </p>
                            {isUserArmy && (
                              <span className="text-[9px] uppercase tracking-widest text-[#00FF88] bg-[#00FF88]/20 px-1.5 rounded">Your Army</span>
                            )}
                          </div>
                          <p className="text-wz-muted text-[10px] font-mono mt-0.5">{army.memberCount} warriors</p>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <p className="text-wz-white font-display font-black text-xl leading-none">
                            {Number(army.totalWarPoints).toLocaleString()}
                          </p>
                          <p className="text-wz-muted text-[9px] font-mono tracking-widest mt-1">TOTAL WP</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* === Team Tab (Intra-team standings) === */}
        {tab === 'team' && (
          <>
            <div className="text-center mb-6">
              <p className="text-wz-muted text-xs font-mono mb-1">INTRA-TEAM STANDINGS</p>
              <p className="text-wz-white/80 text-sm">Top 10 Warriors in your Army.</p>
            </div>

            {teamLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card h-16 animate-pulse border-wz-border/10" />
                ))}
              </div>
            )}

            {teamData?.top10 && (
              <div className="space-y-3">
                {/* TOP 10 LIST */}
                {teamData.top10.map((warrior: any, i: number) => {
                  const isCurrentUser = warrior.id === user?.id;
                  
                  const rankStyles = 
                    i === 0 ? 'border-[#FFD700]/50 bg-[#FFD700]/5' :
                    i === 1 ? 'border-[#C0C0C0]/50 bg-[#C0C0C0]/5' :
                    i === 2 ? 'border-[#CD7F32]/50 bg-[#CD7F32]/5' :
                    isCurrentUser ? 'border-[#007AFF]/40 bg-[#007AFF]/10 shadow-[0_0_15px_rgba(0,122,255,0.1)]' :
                    'border-wz-border/10';

                  const numberColor = 
                    i === 0 ? 'text-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]' :
                    i === 1 ? 'text-[#C0C0C0]' :
                    i === 2 ? 'text-[#CD7F32]' :
                    'text-wz-white/30';

                  return (
                    <motion.div
                      key={warrior.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, ease: "easeOut" }}
                    >
                      <div className={`glass-card p-4 flex items-center gap-4 transition-colors ${rankStyles}`}>
                        <div className="w-8 flex justify-center">
                          <span className={`font-display font-black text-xl italic ${numberColor}`}>
                            {warrior.rankPosition}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black overflow-hidden border border-white/10">
                           {warrior.profilePictureUrl ? (
                             <img src={warrior.profilePictureUrl} alt={warrior.username} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-white/50 text-xs font-display font-black">{warrior.username[0]}</span>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-mono font-bold truncate ${isCurrentUser ? 'text-[#007AFF]' : 'text-wz-white'}`}>
                              {warrior.username}
                            </p>
                            {isCurrentUser && (
                              <span className="text-[9px] uppercase tracking-widest text-[#007AFF] bg-[#007AFF]/20 px-1.5 rounded">You</span>
                            )}
                          </div>
                          <RankBadge rank={warrior.militaryRank} size="sm" />
                        </div>
                        <div className="text-right">
                          <p className="text-wz-white font-display font-black text-lg leading-none">
                            {Number(warrior.totalWarPoints).toLocaleString()}
                          </p>
                          <p className="text-wz-muted text-[9px] font-mono tracking-widest mt-1">WP</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* PINNED USER (if outside Top 10) */}
                {teamData.currentUser?.rankPosition > 10 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 pt-4 border-t border-wz-border/20 relative"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black px-4 text-[10px] text-wz-muted font-mono tracking-widest uppercase">
                      Your Position
                    </div>
                    <div className={`glass-card p-4 flex items-center gap-4 transition-colors border-[#007AFF]/20 bg-[#007AFF]/5 shadow-[0_0_15px_rgba(0,122,255,0.05)]`}>
                      <div className="w-8 flex justify-center">
                        <span className={`font-display font-black text-xl italic text-wz-white/50`}>
                          {teamData.currentUser.rankPosition}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black overflow-hidden border border-[#007AFF]/40">
                         {teamData.currentUser.profilePictureUrl ? (
                           <img src={teamData.currentUser.profilePictureUrl} alt={teamData.currentUser.username} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-white/50 text-xs font-display font-black">{teamData.currentUser.username[0]}</span>
                         )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`font-mono font-bold truncate text-[#007AFF]`}>
                            {teamData.currentUser.username}
                          </p>
                        </div>
                        <RankBadge rank={teamData.currentUser.militaryRank} size="sm" />
                      </div>
                      <div className="text-right">
                        <p className="text-wz-white font-display font-black text-lg leading-none">
                          {Number(teamData.currentUser.totalWarPoints).toLocaleString()}
                        </p>
                        <p className="text-wz-muted text-[9px] font-mono tracking-widest mt-1">WP</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
