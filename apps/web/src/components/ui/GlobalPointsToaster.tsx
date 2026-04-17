import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

interface PointsToast {
  id: string;
  amount: number;
}

export default function GlobalPointsToaster() {
  const currentPointsStr = useAuthStore((s) => s.user?.totalWarPoints);
  const prevPointsRef = useRef<number | null>(null);
  
  const [toasts, setToasts] = useState<PointsToast[]>([]);

  useEffect(() => {
    if (!currentPointsStr) return;
    
    const currentPoints = Number(currentPointsStr);

    if (prevPointsRef.current !== null) {
      const diff = currentPoints - prevPointsRef.current;
      
      // If points increased or decreased, show a gamified toast
      if (diff !== 0) {
        const newToast: PointsToast = {
          id: Math.random().toString(36).substring(7),
          amount: diff
        };
        
        setToasts((prev) => [...prev, newToast]);
        
        // Auto-remove toast after 3 seconds
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, 3000);
      }
    }
    
    prevPointsRef.current = currentPoints;
  }, [currentPointsStr]);

  return (
    <div className="fixed bottom-24 right-5 z-[300] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isPositive = toast.amount > 0;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-black/80 backdrop-blur-md border px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 overflow-hidden"
              style={{ 
                borderColor: isPositive ? 'rgba(176, 38, 255, 0.4)' : 'rgba(255, 45, 85, 0.4)',
                boxShadow: isPositive ? '0 0 20px rgba(176, 38, 255, 0.3)' : '0 0 20px rgba(255, 45, 85, 0.3)'
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${isPositive ? 'from-[#B026FF]/0 via-[#B026FF]/10 to-[#B026FF]/0' : 'from-[#FF2D55]/0 via-[#FF2D55]/10 to-[#FF2D55]/0'} opacity-50`} />
              <div className="text-2xl drop-shadow-md">{isPositive ? '✨' : '💸'}</div>
              <div className="flex flex-col relative z-10">
                <span className={`text-white font-display font-black text-sm pr-2 ${!isPositive && 'opacity-80'}`}>
                  {isPositive ? 'WAR POINTS EARNED' : 'BATTLE FEE CHARGED'}
                </span>
                <span className={`${isPositive ? 'text-[#00FF88]' : 'text-[#FF2D55]'} font-mono font-bold text-lg tracking-wider`}>
                  {isPositive ? '+' : ''}{toast.amount}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
