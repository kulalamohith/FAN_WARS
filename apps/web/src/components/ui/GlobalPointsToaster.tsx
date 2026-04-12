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
      
      // If points increased, show a gamified toast
      if (diff > 0) {
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
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-black/80 backdrop-blur-md border px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 overflow-hidden"
            style={{ 
              borderColor: 'rgba(176, 38, 255, 0.4)',
              boxShadow: '0 0 20px rgba(176, 38, 255, 0.3)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#B026FF]/0 via-[#B026FF]/10 to-[#B026FF]/0 opacity-50" />
            <div className="text-2xl drop-shadow-md">✨</div>
            <div className="flex flex-col relative z-10">
              <span className="text-white font-display font-black text-sm pr-2">
                WAR POINTS EARNED
              </span>
              <span className="text-[#00FF88] font-mono font-bold text-lg tracking-wider">
                +{toast.amount}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
