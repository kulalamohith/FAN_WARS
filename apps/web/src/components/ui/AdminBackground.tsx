import { useEffect, useState } from 'react';

/**
 * COMMAND CENTER — Tactical Admin Background
 * A high-tech, data-driven environment for the Supreme Commander.
 */
export default function AdminBackground() {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPulse(p => (p + 1) % 100), 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#020408]">
      
      {/* 1. Perspective Grid (Tactical Floor) */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[60%] perspective-[1000px] pointer-events-none opacity-20"
        style={{ perspective: '500px' }}
      >
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(0,255,136,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,136,0.1)_1px,transparent_1px)]"
          style={{ 
            backgroundSize: '40px 40px',
            transform: 'rotateX(60deg) translateY(-20%)',
            animation: 'gridMove 20s linear infinite'
          }}
        />
      </div>

      {/* 2. Radar Sweeps */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] aspect-square opacity-10 pointer-events-none">
        <div className="absolute inset-0 border border-blue-500/20 rounded-full" />
        <div className="absolute inset-0 border border-blue-500/10 rounded-full scale-75" />
        <div className="absolute inset-0 border border-blue-500/5 rounded-full scale-50" />
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full origin-center"
          style={{ animation: 'radarSweep 10s linear infinite' }}
        />
      </div>

      {/* 3. Hexagonal Mesh Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] mix-blend-screen" />

      {/* 4. Tactical Ambient Glows */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-wz-red/5 blur-[120px] rounded-full" />

      {/* 5. Floating Data Points (SVG Particles) */}
      <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        <defs>
          <radialGradient id="dataGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00FF88" stopOpacity="1" />
            <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: 20 }).map((_, i) => (
          <circle 
            key={i}
            className="animate-pulse"
            cx={`${Math.random() * 100}%`} 
            cy={`${Math.random() * 100}%`} 
            r="1" 
            fill="url(#dataGlow)"
            style={{ 
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </svg>

      {/* 6. Scanlines & Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 40px; }
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
}
