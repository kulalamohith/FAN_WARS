/**
 * RIVALRY — Animated Live Wallpaper Background
 * Adrenaline, intense fire, sparks, and premium fighting energy.
 */

import { useState, useEffect } from 'react';

const WALLPAPERS = ['/bg/fire_stadium.png', '/bg/fan_clash.png', '/bg/sparks.png'];

export default function AnimatedBackground() {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % WALLPAPERS.length);
    }, 8000); // Faster crossfade for higher energy
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* === Live Wallpaper Layers === */}
      {WALLPAPERS.map((src, i) => (
        <div
          key={src}
          className="fixed inset-0 z-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{
            opacity: currentBg === i ? 1 : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: currentBg === i ? 'kenBurns 20s ease-in-out infinite alternate' : 'none',
          }}
        />
      ))}

      {/* === Deep contrast overlay for readability === */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: `
            linear-gradient(180deg, 
              rgba(0,0,0,0.5) 0%, 
              rgba(0,0,0,0.2) 30%, 
              rgba(0,0,0,0.4) 60%, 
              rgba(0,0,0,0.8) 100%
            )
          `,
        }}
      />

      {/* === Intense fiery ambient glow === */}
      <div className="fixed inset-0 z-[2] pointer-events-none opacity-30 mix-blend-overlay">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 30% 70%, rgba(255,107,44,0.8) 0%, transparent 50%)',
            animation: 'colorShiftLeft 6s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(255,45,85,0.7) 0%, transparent 50%)',
            animation: 'colorShiftRight 8s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* === Embers/Sparks (Reusing particle logic but stylized as sparks) === */}
      <div className="wz-particles opacity-60 mix-blend-screen">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="wz-particle bg-orange-500 shadow-[0_0_10px_#ff5000]" style={{ animationDuration: `${Math.random() * 3 + 2}s` }} />
        ))}
      </div>

      {/* === Heavy edge vignette === */}
      <div
        className="fixed inset-0 z-[3] pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 120px 40px rgba(0,0,0,0.8)',
        }}
      />
    </>
  );
}
