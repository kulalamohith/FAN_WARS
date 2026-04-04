/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wz: {
          bg:       '#0A0A0A',
          surface:  '#111111',
          card:     '#1A1A1A',
          border:   '#2A2A2A',
          muted:    '#666666',
          text:     '#E0E0E0',
          white:    '#FFFFFF',
          neon:     '#00FF88',
          red:      '#FF2D55',
          orange:   '#FF6B2C',
          blue:     '#007AFF',
          purple:   '#BF5AF2',
          yellow:   '#FFD60A',
          cyan:     '#64D2FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        marker: ['Permanent Marker', 'cursive'],
        hand: ['Kaushan Script', 'cursive'],
        rock: ['Rock Salt', 'cursive'],
      },
      animation: {
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'flash': 'flash 0.15s ease-out',
      },
      keyframes: {
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #00FF88, 0 0 20px #00FF8833' },
          '50%': { boxShadow: '0 0 20px #00FF88, 0 0 60px #00FF8866' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 25px currentColor, 0 0 50px currentColor' },
        },
        flash: {
          '0%': { opacity: '1', backgroundColor: 'rgba(255,255,255,0.3)' },
          '100%': { opacity: '0', backgroundColor: 'transparent' },
        },
      },
      backgroundImage: {
        'gradient-war': 'linear-gradient(135deg, #FF2D55 0%, #FF6B2C 50%, #FFD60A 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0A0A0A 0%, #111111 100%)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
}
