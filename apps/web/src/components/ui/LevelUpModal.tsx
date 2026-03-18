import { motion, AnimatePresence } from 'framer-motion';
import { RankTier } from './RankBadge';
import WarzoneButton from './WarzoneButton';

interface LevelUpModalProps {
  newRank: RankTier | string;
  onClose: () => void;
  isOpen: boolean;
}

export default function LevelUpModal({ newRank, onClose, isOpen }: LevelUpModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm"
          >
            {/* Background glowing effects */}
            <div className="absolute inset-0 -m-8 bg-wz-yellow/20 blur-[60px] rounded-full mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute inset-0 -m-4 bg-wz-neon/10 blur-[30px] rounded-full mix-blend-screen pointer-events-none" />

            <div className="glass-card p-8 text-center border-wz-yellow/50 shadow-[0_0_50px_rgba(255,214,10,0.3)] bg-gradient-to-b from-white/10 to-transparent relative overflow-hidden">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute -top-32 -left-32 w-64 h-64 bg-wz-yellow/10 blur-[40px] rounded-full pointer-events-none"
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
                className="text-7xl mb-4 drop-shadow-[0_0_20px_rgba(255,214,10,0.8)]"
              >
                {/* Custom icon based on rank */}
                {newRank === 'Corporal' ? '★★' :
                 newRank === 'Sergeant' ? '★★★' :
                 newRank === 'Captain' ? '⚡' :
                 newRank === 'Commander' ? '♛' :
                 newRank === 'Warlord' ? '👑' : '⬆️'}
              </motion.div>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-wz-yellow text-xs tracking-[0.3em] font-bold uppercase mb-2 drop-shadow-[0_0_5px_rgba(255,214,10,0.5)]"
              >
                Promotion Earned
              </motion.p>
              
              <motion.h2 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="text-3xl font-display font-black text-white uppercase tracking-wider mb-6 leading-none"
              >
                {newRank}
              </motion.h2>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-wz-muted text-sm font-mono leading-relaxed mb-8"
              >
                Your war points have breached the threshold. Your new rank will strike fear into the hearts of rival armies.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <WarzoneButton 
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-wz-yellow/80 to-[#FF6B2C] border-none text-black py-4 uppercase tracking-widest text-xs"
                >
                  Continue the War
                </WarzoneButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
