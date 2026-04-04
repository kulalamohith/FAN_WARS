import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TABS, HIDDEN_ON } from '../../lib/navigation';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on specific routes
  const shouldHide = HIDDEN_ON.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-black/90 backdrop-blur-2xl border-t border-white/[0.06]">
      {/* Safe area padding for mobile notch/home-bar */}
      <div className="flex items-center justify-around px-2 pt-1.5 pb-2 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = tab.path === '/' 
            ? currentPath === '/' 
            : currentPath.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 py-1 rounded-lg transition-colors group cursor-pointer"
            >
              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1.5 w-8 h-0.5 rounded-full bg-gradient-to-r from-wz-red to-[#FF6B2C]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              {/* Icon */}
              <span className={`transition-colors duration-200 ${
                isActive 
                  ? 'text-white drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]' 
                  : 'text-white/30 group-hover:text-white/60'
              }`}>
                {tab.icon(isActive)}
              </span>

              {/* Label */}
              <span className={`text-[9px] font-mono font-bold tracking-wider transition-colors duration-200 ${
                isActive 
                  ? 'text-white' 
                  : 'text-white/25 group-hover:text-white/50'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
