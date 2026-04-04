import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';

export default function PollsPage() {
  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-black text-white tracking-tight">⚔️ WAR POLLS</h1>
        </div>

        {/* Coming Soon */}
        <GlassCard className="p-8 text-center border-wz-yellow/20">
          <p className="text-5xl mb-4">⚔️</p>
          <h2 className="text-wz-yellow font-display font-bold text-xl mb-2">COMING SOON</h2>
          <p className="text-wz-muted text-xs font-mono leading-relaxed max-w-xs mx-auto">
            Fan battle polls are being forged in the arsenal. Soon you'll be able to create polls, vote,
            and share results to settle which fanbase truly rules.
          </p>

          {/* Preview poll */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-left">
            <p className="text-white/60 text-xs font-mono mb-3">PREVIEW — COMING NEXT UPDATE</p>
            <p className="text-white font-display font-bold text-sm mb-3">Better Captain?</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm">👑</span>
                <span className="text-white text-xs font-mono flex-1">Virat Kohli</span>
                <span className="text-wz-muted text-[10px] font-mono">— %</span>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm">🦁</span>
                <span className="text-white text-xs font-mono flex-1">MS Dhoni</span>
                <span className="text-wz-muted text-[10px] font-mono">— %</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
