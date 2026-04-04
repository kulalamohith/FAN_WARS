import { forwardRef } from 'react';
import { RankBadge } from './RankBadge';

interface ShareCardProps {
  username: string;
  rank: string;
  points: number;
  armyColor: string;
  armyName: string;
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ username, rank, points, armyColor, armyName }, ref) => {
    return (
      <div
        ref={ref}
        className="w-[450px] h-[650px] flex flex-col items-center justify-between p-10 relative overflow-hidden bg-gradient-to-br from-[#111] to-[#050505]"
        style={{
          boxShadow: `inset 0 0 150px ${armyColor}30`,
          border: `2px solid ${armyColor}60`,
          borderRadius: '24px',
        }}
      >
        {/* Background Gradients & Noise */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] opacity-40 mix-blend-screen"
          style={{ backgroundColor: armyColor }}
        />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* Header */}
        <div className="z-10 w-full flex justify-between items-start">
          <h1 className="text-2xl font-display font-black text-white italic tracking-tighter drop-shadow-md">
            WARZONE<span className="text-wz-red">.</span>
          </h1>
          <div className="px-3 py-1 rounded bg-white/10 border border-white/20 backdrop-blur-md">
            <p className="text-[10px] font-mono tracking-widest text-white/80 uppercase">
              Season 1
            </p>
          </div>
        </div>

        {/* Main Center Stats */}
        <div className="z-10 flex flex-col items-center w-full justify-center">
          <div className="relative mb-6">
             <div className="absolute inset-0 blur-2xl opacity-60 rounded-full" style={{ backgroundColor: armyColor }} />
             <RankBadge rank={rank as any} size="lg" className="scale-[1.8] drop-shadow-2xl relative z-10" />
          </div>

          <h2
            className="text-[40px] font-display font-black text-white mb-2 tracking-wider uppercase text-center mt-6"
            style={{ textShadow: `0 0 30px ${armyColor}80` }}
          >
            {username}
          </h2>

          <div 
             className="px-5 py-1.5 rounded-full border mb-10 shadow-lg"
             style={{ borderColor: `${armyColor}60`, backgroundColor: `${armyColor}20` }}
          >
            <p className="text-xs font-mono tracking-[0.2em] text-white/90 uppercase font-bold text-center">
              {armyName}
            </p>
          </div>

          <div className="text-center glass-card p-6 w-full border-white/10">
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em] mb-2">
              Total War Points
            </p>
            <p className="text-5xl font-display font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {points.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 w-full text-center mt-4">
          <p className="text-[9px] text-white/30 font-mono tracking-[0.3em] uppercase">
            Official WZ Rank Card • warzone.gg
          </p>
        </div>
      </div>
    );
  }
);
