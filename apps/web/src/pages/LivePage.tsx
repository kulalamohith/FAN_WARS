import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function LivePage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => api.matches.live(),
    refetchInterval: 15000,
  });

  const matches = data?.matches || [];

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="live-dot" />
          <h1 className="text-2xl md:text-3xl font-display font-black text-white tracking-tight">LIVE MATCHES</h1>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-wz-red/30 border-t-wz-red rounded-full animate-spin mb-4" />
            <p className="text-wz-muted font-mono text-xs">SCANNING BATTLEFIELDS...</p>
          </div>
        ) : matches.length === 0 ? (
          <GlassCard className="p-8 text-center max-w-xl mx-auto mt-10">
            <p className="text-4xl mb-3">🏟️</p>
            <h2 className="text-white font-display font-bold text-lg mb-2">NO LIVE MATCHES</h2>
            <p className="text-wz-muted text-xs font-mono">The battlefield is quiet. Check back during match hours.</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match: any) => (
              <GlassCard
                key={match.id}
                className="p-6 border-wz-red/20 hover:border-wz-red/40 transition-all hover:-translate-y-1 cursor-pointer group shadow-lg shadow-black/20"
                onClick={() => navigate(`/war-room/${match.warRoomId || match.id}`)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="live-dot" />
                    <span className="text-[10px] font-mono font-bold text-wz-red tracking-wider">LIVE NOW</span>
                  </div>
                  <span className="text-[10px] font-mono text-wz-muted">
                    {match.activePredictions?.length || 0} active predictions
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-black/20 backdrop-blur-sm"
                      style={{ borderColor: match.homeArmy?.colorHex, color: match.homeArmy?.colorHex }}
                    >
                      {match.homeArmy?.name?.slice(0, 3)}
                    </div>
                    <span className="text-white/30 font-display font-black text-sm px-1">VS</span>
                    <div
                      className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-black/20 backdrop-blur-sm"
                      style={{ borderColor: match.awayArmy?.colorHex, color: match.awayArmy?.colorHex }}
                    >
                      {match.awayArmy?.name?.slice(0, 3)}
                    </div>
                  </div>

                  <button className="px-4 py-3 rounded-xl bg-wz-red hover:bg-[#FF453A] text-white text-[10px] font-bold font-mono transition-all group-hover:shadow-[0_0_20px_rgba(255,45,85,0.5)] shrink-0 ml-4">
                    ENTER →
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
