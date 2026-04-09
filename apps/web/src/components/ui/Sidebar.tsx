import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TABS, HIDDEN_ON } from '../../lib/navigation';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const shouldHide = HIDDEN_ON.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  const currentPath = location.pathname;

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-white/[0.06] bg-black/40 backdrop-blur-3xl pt-8 pb-6 px-4 shrink-0 z-40">
      {/* Logo/Brand */}
      <div className="flex items-center gap-3 px-4 mb-10 cursor-pointer select-none" onClick={() => navigate('/')}>
        <img src="/logo_shield.png" alt="Rivalry Shield" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,45,85,0.5)]" />
        <span className="text-white font-display font-black text-xl tracking-widest uppercase">Rivalry</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {TABS.map((tab) => {
          const isActive = tab.path === '/' 
            ? currentPath === '/' 
            : currentPath.startsWith(tab.path);

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`relative flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Active Highlight Line */}
              {isActive && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-[#FF2D55] to-[#FF6B2C]"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <span className={`transition-colors duration-300 ${
                isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
              }`}>
                {tab.icon(isActive)}
              </span>
              
              <span className={`font-mono font-bold tracking-widest text-sm transition-colors duration-300 ${
                isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
        {user?.isAdmin && (
           <button
             onClick={() => navigate('/admin')}
             className={`relative flex items-center gap-4 w-full px-4 py-3.5 rounded-xl transition-all duration-300 group ${
               currentPath.startsWith('/admin') ? 'bg-wz-red/20' : 'hover:bg-wz-red/10'
             }`}
           >
             {currentPath.startsWith('/admin') && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#FF2D55]"
                />
             )}
              <span className={`transition-colors duration-300 ${
                currentPath.startsWith('/admin') ? 'text-[#FF2D55]' : 'text-[#FF2D55]/50 group-hover:text-[#FF2D55]/80'
              }`}>
                ⚠️
              </span>
              <span className={`font-mono font-bold tracking-widest text-sm transition-colors duration-300 ${
                currentPath.startsWith('/admin') ? 'text-white' : 'text-white/40 group-hover:text-white/80'
              }`}>
                ADMIN HUD
              </span>
           </button>
        )}
      </nav>

      {/* User / Logout (Optional slot) */}
      <div className="mt-auto px-4">
        <div className="p-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <div className="text-xs font-mono text-white/40">Ready for War.</div>
            <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_8px_#00FF88]" />
        </div>
      </div>
    </aside>
  );
}
