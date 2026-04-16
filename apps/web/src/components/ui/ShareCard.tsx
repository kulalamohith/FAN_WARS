import { forwardRef } from 'react';
import { RankBadge } from './RankBadge';

interface PinnedBadge {
  key: string;
  name: string;
  icon: string;
  tier: string;
}

interface ShareCardProps {
  username: string;
  rank: string;
  rankLevel?: number;
  rankIcon?: string;
  rankColor?: string;
  points: number;
  armyColor: string;
  armyName: string;
  pinnedBadges?: PinnedBadge[];
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ username, rank, rankLevel, rankIcon, rankColor, points, armyColor, armyName, pinnedBadges = [] }, ref) => {
    // Determine the border color for a badge tier
    const tierBorderColor = (tier: string) =>
      tier === 'GOLD' ? '#FFD700' : tier === 'SILVER' ? '#C0C0C0' : '#CD7F32';

    return (
      <div
        ref={ref}
        className="w-[500px] h-[750px] flex flex-col relative overflow-hidden"
        style={{
          background: '#070707',
          border: `2px solid ${armyColor}40`,
          borderRadius: '32px',
          boxShadow: `0 30px 60px rgba(0,0,0,0.8), inset 0 0 100px ${armyColor}15`,
        }}
      >
        {/* ── Background Cyber/Tech Overlay ── */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glowing Blobs */}
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20 pointer-events-none" style={{ backgroundColor: rankColor || '#444' }} />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-[140px] opacity-[0.15] pointer-events-none" style={{ backgroundColor: armyColor }} />

        {/* ── Cyber Corner Accents ── */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 rounded-tl-[30px]" style={{ borderColor: armyColor, opacity: 0.8 }} />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 rounded-br-[30px]" style={{ borderColor: armyColor, opacity: 0.8 }} />

        {/* ── Header ── */}
        <div className="relative z-10 w-full px-8 pt-8 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: armyColor, boxShadow: `0 0 15px ${armyColor}` }} />
            <h1 className="text-2xl font-display font-black text-white tracking-widest uppercase italic" style={{ textShadow: `0 2px 10px ${armyColor}50` }}>
              WARZONE <span style={{ color: armyColor }}>ID</span>
            </h1>
          </div>
          <div className="px-4 py-1.5 rounded-lg border text-xs font-mono tracking-widest text-white/80 font-bold bg-black/40 backdrop-blur-md" style={{ borderColor: `${armyColor}40` }}>
            SEASON_01
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div className="relative z-10 flex flex-col items-center flex-1 px-8">
          
          {/* Avatar / Rank Insignia */}
          <div className="relative mt-2 mb-8">
            <div className="absolute inset-[-20px] rounded-full blur-2xl opacity-40 animate-pulse" style={{ backgroundColor: rankColor || '#444' }} />
            <div className="w-40 h-40 rounded-3xl flex items-center justify-center text-7xl relative bg-black/60 backdrop-blur-xl border-4"
              style={{
                borderColor: rankColor || '#444',
                boxShadow: `0 10px 40px ${rankColor || '#444'}60, inset 0 0 30px rgba(255,255,255,0.1)`,
                transform: 'rotate(45deg)',
              }}>
              <div style={{ transform: 'rotate(-45deg)', width: '70%', height: '70%' }}>
                {rankIcon ? <img src={rankIcon} alt="Rank" className="w-full h-full object-contain" /> : '💀'}
              </div>
            </div>
            {/* Level Badge */}
            {rankLevel && (
              <div className="absolute -bottom-4 right-1/2 translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center text-xl font-display font-black bg-black border-4"
                style={{
                  borderColor: rankColor || '#444',
                  color: rankColor || '#fff',
                  boxShadow: `0 0 20px ${rankColor || '#444'}80`,
                }}>
                {rankLevel}
              </div>
            )}
          </div>

          {/* Identity Info */}
          <h2 className="text-[44px] font-display font-black text-white tracking-wider uppercase leading-none mt-2 text-center"
            style={{ textShadow: `0 4px 20px rgba(0,0,0,0.5)` }}>
            {username}
          </h2>
          
          <div className="flex items-center gap-3 mt-4 mb-8">
            <div className="px-5 py-2 rounded-xl border bg-black/40 backdrop-blur-md" style={{ borderColor: `${rankColor || '#555'}40` }}>
               <p className="text-sm font-display font-bold uppercase tracking-wider" style={{ color: rankColor || '#fff' }}>
                 {rank}
               </p>
            </div>
            <div className="px-5 py-2 rounded-xl border bg-black/40 backdrop-blur-md" style={{ borderColor: `${armyColor}40` }}>
               <p className="text-sm font-mono font-bold uppercase tracking-widest text-white/90">
                 ⚔️ {armyName} ARMY
               </p>
            </div>
          </div>

          {/* War Points Data Core */}
          <div className="w-full rounded-2xl p-6 relative overflow-hidden border mb-8 bg-black/50 backdrop-blur-xl"
            style={{
              borderColor: 'rgba(255,255,255,0.08)',
              boxShadow: `0 10px 30px rgba(0,0,0,0.4)`,
            }}>
            <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: armyColor }} />
            <div className="pl-6">
              <p className="text-white/40 text-xs font-mono uppercase tracking-[0.4em] mb-1 font-bold">Total War XP</p>
              <p className="text-[54px] font-display font-black text-white leading-none tracking-tight"
                style={{ textShadow: `0 0 30px ${armyColor}40` }}>
                {points.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Medals Display */}
          {pinnedBadges.length > 0 && (
            <div className="w-full flex-col items-center">
              <p className="text-[10px] font-mono text-center text-white/30 tracking-[0.3em] uppercase mb-4 font-bold">
                Campaign Medals
              </p>
              <div className="flex justify-center gap-5">
                {pinnedBadges.slice(0, 3).map((b) => (
                  <div key={b.key} className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-[3px] bg-black/60 shadow-2xl relative"
                    style={{
                      borderColor: tierBorderColor(b.tier),
                      boxShadow: `0 0 25px ${tierBorderColor(b.tier)}60, inset 0 0 15px ${tierBorderColor(b.tier)}30`,
                    }}>
                    <span style={{ filter: `drop-shadow(0 2px 5px rgba(0,0,0,0.5))` }}>{b.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="relative z-10 w-full px-8 pb-8 pt-6 mt-auto bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
          <div>
            <p className="text-[10px] font-mono tracking-[0.3em] text-white/30 font-bold uppercase mb-1">Status</p>
            <p className="text-xs font-mono tracking-widest text-[#00FF88] font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_10px_#00FF88]"></span> ONLINE
            </p>
          </div>
          <p className="text-[12px] font-mono tracking-[0.4em] text-white/50 font-bold uppercase border-t border-b border-white/10 py-2">
            WARZONE.GG
          </p>
        </div>
      </div>
    );
  }
);
