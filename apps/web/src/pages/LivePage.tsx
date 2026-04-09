import { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { IPL_2026_SCHEDULE, IPLMatch } from '../data/ipl2026';
import { useAuthStore } from '../stores/authStore';

// Define team colors for UI
const TEAM_COLORS: Record<string, string> = {
  CSK: '#FFFF3C', // Yellow
  RCB: '#DA2C43', // Red
  MI: '#004BA0', // Blue
  KKR: '#3A225D', // Purple
  SRH: '#FF822A', // Orange
  RR: '#EA1A85', // Pink
  DC: '#17479E', // Blue/Red
  PBKS: '#ED1B24', // Red/Silver
  GT: '#1B2133', // Dark Blue
  LSG: '#A72056', // Teal/Blue
};

function CountdownTimer({ targetTime }: { targetTime: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, targetTime.getTime() - Date.now()));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, targetTime.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTime]);

  if (timeLeft === 0) return <span className="text-wz-red animate-pulse">WAR IN PROGRESS</span>;

  const h = Math.floor(timeLeft / (1000 * 60 * 60));
  const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="text-yellow-400">
      DEPLOYS IN {h}H {m}M {s}S
    </span>
  );
}

function MatchCard({ 
  match, 
  status, 
  onClick 
}: { 
  match: IPLMatch; 
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED'; 
  onClick?: () => void;
}) {
  const isLive = status === 'LIVE';
  const isCompleted = status === 'COMPLETED';
  const matchStartTime = new Date(match.datetime);

  // Deterministic random user count
  const activeUsers = Math.floor(Math.abs(Math.sin(match.id * 12.5)) * (isCompleted ? 0 : 5000) + (isCompleted ? 120 : 1200));

  return (
    <GlassCard
      className={`p-6 border-wz-red/20 transition-all shadow-lg shadow-black/20 ${onClick ? 'hover:border-wz-red/40 hover:-translate-y-1 cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isLive && <div className="live-dot" />}
          <span className={`text-[10px] font-mono font-bold tracking-wider ${isLive ? 'text-wz-red' : 'text-wz-muted'}`}>
            {status === 'LIVE' ? 'TODAY\'S BATTLE' : status === 'COMPLETED' ? 'MATCH FINISHED' : `MATCH ${match.id}`}
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-wz-muted">
            {isLive ? <CountdownTimer targetTime={matchStartTime} /> : `${match.dateStr} • ${match.timeStr}`}
          </div>
          <div className="text-[10px] font-mono text-white/60 font-bold mt-1">
            <span className={`${isCompleted ? 'text-gray-500' : 'text-green-500'} mr-1`}>●</span>
            {activeUsers.toLocaleString()} fnz in room
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 w-full justify-center">
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-black/40 backdrop-blur-sm shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
            style={{ 
              borderColor: TEAM_COLORS[match.homeTeam] || '#fff', 
              color: TEAM_COLORS[match.homeTeam] || '#fff',
              boxShadow: `0 0 15px ${TEAM_COLORS[match.homeTeam] || '#fff'}40`
            }}
          >
            {match.homeTeam}
          </div>
          <div className="flex flex-col items-center">
           <span className="text-white/40 font-display font-black text-sm px-2">VS</span>
          </div>
          <div
            className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-black/40 backdrop-blur-sm shadow-[inset_0_0_15px_rgba(0,0,0,0.8)]"
            style={{ 
              borderColor: TEAM_COLORS[match.awayTeam] || '#fff', 
              color: TEAM_COLORS[match.awayTeam] || '#fff',
              boxShadow: `0 0 15px ${TEAM_COLORS[match.awayTeam] || '#fff'}40`
            }}
          >
            {match.awayTeam}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2">
        <span className="text-[10px] text-wz-muted font-mono truncate max-w-[70%]">
          🏟️ {match.stadium}
        </span>
        
        {onClick && (
          <button className={`px-4 py-2 rounded-xl text-white text-[10px] font-bold font-mono transition-all shrink-0 ml-2 ${isLive ? 'bg-wz-red hover:bg-[#FF453A] shadow-[0_0_15px_rgba(255,45,85,0.3)] group-hover:shadow-[0_0_20px_rgba(255,45,85,0.7)]' : 'bg-white/10 hover:bg-white/20'}`}>
            ENTER WAR ROOM →
          </button>
        )}
      </div>
    </GlassCard>
  );
}

export default function LivePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [now, setNow] = useState(new Date());
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const completedMatches: IPLMatch[] = [];
  const liveMatches: IPLMatch[] = [];
  const upcomingMatches: IPLMatch[] = [];

  IPL_2026_SCHEDULE.forEach(match => {
    const matchStartTime = new Date(match.datetime);
    const matchEndTime = new Date(matchStartTime.getTime() + 4 * 60 * 60 * 1000); // 4 hrs duration
    
    const isToday = matchStartTime.toDateString() === now.toDateString();
    
    if (isToday && now < matchEndTime) {
      // Matches for Today that aren't finished yet go to LIVE
      liveMatches.push(match);
    } else if (matchStartTime > now && !isToday) {
      // Matches for FUTURE days go to UPCOMING
      upcomingMatches.push(match);
    } else {
      // Matches that were Today and finished, or from PAST days go to COMPLETED
      completedMatches.push(match);
    }
  });

  // Sort logically
  upcomingMatches.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  completedMatches.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

  const displayedUpcoming = showAllUpcoming ? upcomingMatches : upcomingMatches.slice(0, 6);
  const displayedCompleted = showAllCompleted ? completedMatches : completedMatches.slice(0, 6);

  const userColor = user?.army?.colorHex || '#111111';

  return (
    <div 
      className="relative min-h-screen pb-20 overflow-hidden bg-[#050505]"
      style={{
        background: `radial-gradient(ellipse at top, ${userColor}30 0%, #050505 50%, #000 100%)`
      }}
    >
      {/* Background texture for grit */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 h-full overflow-y-auto pb-10">
        
        {/* LIVE SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="live-dot" />
            <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">LIVE BATTLEFIELDS</h1>
          </div>
          
          {liveMatches.length === 0 ? (
           <GlassCard className="p-8 text-center max-w-xl mx-auto border-dashed border-white/10 bg-black/20">
             <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
               <span className="text-2xl">📡</span>
             </div>
             <h2 className="text-white font-display font-bold text-lg mb-2">NO ACTIVE WARS</h2>
             <p className="text-wz-muted text-xs font-mono">The battleground is silent. Awaiting next deployment.</p>
           </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveMatches.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  status="LIVE" 
                  onClick={() => navigate(`/war-room/match-${match.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING SECTION */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold text-white/80">UPCOMING CLASHES</h2>
            <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-white/60">{upcomingMatches.length}</span>
          </div>
          
          {upcomingMatches.length === 0 ? (
            <p className="text-wz-muted font-mono text-xs text-center py-8">NO UPCOMING MATCHES SCHEDULED.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedUpcoming.map((match) => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  status="UPCOMING" 
                  onClick={() => navigate(`/war-room/match-${match.id}`)}
                />
              ))}
            </div>
          )}
          {upcomingMatches.length > 6 && (
            <div className="mt-6 text-center">
               <button 
                 onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                 className="text-white/50 hover:text-white text-xs font-mono p-4 block w-full rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
               >
                 {showAllUpcoming ? 'SHOW LESS' : `+ ${upcomingMatches.length - 6} MORE MATCHES DEPLOYING SOON (SHOW ALL)`}
               </button>
            </div>
          )}
        </div>

        {/* COMPLETED SECTION */}
        <div className="mb-8 opacity-75">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <h2 className="text-xl md:text-2xl font-display font-bold text-white/50">MATCHES COMPLETED</h2>
            <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-white/40">{completedMatches.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity duration-500">
            {displayedCompleted.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                status="COMPLETED" 
                onClick={() => navigate(`/war-room/match-${match.id}`)}
              />
            ))}
          </div>
          {completedMatches.length > 6 && (
            <div className="mt-6 text-center">
               <button 
                 onClick={() => setShowAllCompleted(!showAllCompleted)}
                 className="text-white/50 hover:text-white text-xs font-mono p-4 block w-full rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
               >
                 {showAllCompleted ? 'SHOW LESS' : `+ ${completedMatches.length - 6} PAST BATTLES ARCHIVED (SHOW ALL)`}
               </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
