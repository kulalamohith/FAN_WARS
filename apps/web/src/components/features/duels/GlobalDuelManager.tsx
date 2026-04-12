import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../../stores/authStore';
import { useGlobalSocketStore } from '../../../stores/globalSocketStore';
import { useDuelStore } from '../../../stores/duelStore';
import { AnimatePresence, motion } from 'framer-motion';
import DuelRoom from './DuelRoom';

export default function GlobalDuelManager() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  
  const connect = useGlobalSocketStore((s) => s.connect);
  const incomingChallenges = useGlobalSocketStore((s) => s.incomingChallenges);
  const acceptedDuel = useGlobalSocketStore((s) => s.acceptedDuel);
  const acceptChallenge = useGlobalSocketStore((s) => s.acceptChallenge);
  const declineChallenge = useGlobalSocketStore((s) => s.declineChallenge);
  const clearAcceptedDuel = useGlobalSocketStore((s) => s.clearAcceptedDuel);

  const startRealDuel = useDuelStore((s) => s.startRealDuel);
  const duelView = useDuelStore((s) => s.duelView);
  const activeDuel = useDuelStore((s) => s.activeDuel);

  // Auto-dismiss toast after 6 seconds
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The latest incoming challenge for the quick-action toast
  const latestChallenge = incomingChallenges.length > 0
    ? incomingChallenges[incomingChallenges.length - 1]
    : null;

  // Show toast when a new challenge arrives, auto-hide after 6s
  useEffect(() => {
    if (latestChallenge) {
      setShowToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 6000);
    } else {
      setShowToast(false);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [latestChallenge?.challengerId]);

  // Connect to global socket on auth
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connect(user.id);
    }
  }, [isAuthenticated, user?.id, connect]);
  
  // Listen to incoming live messages if connected
  useEffect(() => {
    const socket = useGlobalSocketStore.getState().socket;
    if (!socket) return;
    
    // Set up the listener
    const handleMsg = (data: any) => {
      useDuelStore.getState().addMessage(data);
    };
    
    socket.on('duel_message', handleMsg);
    
    return () => {
      socket.off('duel_message', handleMsg);
    };
  }, [isAuthenticated, user]);

  // Handle accepted duel automatically routing into the room
  useEffect(() => {
    if (acceptedDuel && user) {
      const socket = useGlobalSocketStore.getState().socket;
      if (socket) {
        socket.emit('join_duel_room', acceptedDuel.duelId);
      }

      startRealDuel(acceptedDuel, {
        id: user.id,
        username: user.username,
        army: user.army?.name || 'Recruit',
        armyColor: user.army?.colorHex || '#FF2D55'
      });
      clearAcceptedDuel();
    }
  }, [acceptedDuel, user, startRealDuel, clearAcceptedDuel]);

  return (
    <>
      {/* Quick-action toast: shows the LATEST incoming challenge for fast response, auto-dismisses after 6s */}
      <AnimatePresence>
        {showToast && latestChallenge && (
          <motion.div
            key={latestChallenge.challengerId}
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-5 left-0 right-0 z-[200] flex justify-center px-4"
          >
            <div className="bg-black/90 border border-[#FF2D55]/50 shadow-[0_0_20px_rgba(255,45,85,0.3)] backdrop-blur-xl p-5 rounded-2xl w-full max-w-sm">
              <div className="flex flex-col text-center">
                <span className="text-3xl mb-2">🔫</span>
                <h3 className="text-white font-display font-black text-lg uppercase tracking-wide">
                  Challenge Received!
                </h3>
                <p className="text-[#FF2D55] font-mono text-sm font-bold mb-1 mt-1">
                  from {latestChallenge.challengerName}
                </p>
                {incomingChallenges.length > 1 && (
                  <p className="text-white/30 text-[10px] font-mono mb-3">
                    +{incomingChallenges.length - 1} more — see Duel Status tab
                  </p>
                )}
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                  <p className="text-white/80 text-xs font-mono font-bold">"{latestChallenge.topicText}"</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      declineChallenge(latestChallenge.challengerId);
                      setShowToast(false);
                    }}
                    className="flex-1 py-2 rounded-lg bg-white/10 text-white/60 text-xs font-mono hover:bg-white/20 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      acceptChallenge(
                        latestChallenge.challengerId, 
                        latestChallenge.challengerName, 
                        latestChallenge.topicText, 
                        user!.id, 
                        user!.username
                      );
                      setShowToast(false);
                    }}
                    className="flex-1 py-2 rounded-lg text-white font-bold text-sm bg-gradient-to-r from-[#FF2D55] to-[#FF6B2C] shadow-[0_0_10px_rgba(255,45,85,0.4)] hover:scale-105 transition-transform"
                  >
                    Accept Duel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Duel Room globally if active */}
      <AnimatePresence>
        {duelView === 'room' && activeDuel && (
          <DuelRoom />
        )}
      </AnimatePresence>
    </>
  );
}
