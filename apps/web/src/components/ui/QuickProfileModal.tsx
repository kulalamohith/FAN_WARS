import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSocketStore } from '../../stores/globalSocketStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';

export interface QuickProfileUser {
  id: string;
  username: string;
  armyName?: string;
  armyColor?: string;
  rank?: string;
}

export default function QuickProfileModal({ user, onClose }: { user: QuickProfileUser, onClose: () => void }) {
  const [showChallenge, setShowChallenge] = useState(false);
  const [topicText, setTopicText] = useState('');
  
  const sendChallenge = useGlobalSocketStore((s) => s.sendChallenge);
  const me = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const handleChallenge = async () => {
    if (!topicText.trim() || !me) return;

    if (Number(me.totalWarPoints) < 5) {
      alert('Insufficient War Points. You need 5 WP to challenge someone to a Sniper Duel.');
      return;
    }

    try {
      const res = await api.profile.payEntry(5, 'SNIPER_DUEL_CHALLENGE');
      if (res.success) {
        setUser({ ...me, totalWarPoints: res.newTotalPoints.toString() });
        sendChallenge(user.id, user.username, me.username, topicText, me.id);
        alert('Challenge sent! (5 WP Battle Fee Charged)');
        onClose();
      } else {
        alert(res.message);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process battle fee');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-[#0A0A0A] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div 
          className="h-20 w-full"
          style={{ background: user.armyColor ? `linear-gradient(135deg, ${user.armyColor}44, #0A0A0A)` : 'linear-gradient(135deg, #FF2D5544, #0A0A0A)' }}
        />
        
        {/* Avatar & Info */}
        <div className="px-5 pb-5 -mt-10 flex flex-col items-center">
          <div 
            className="w-20 h-20 rounded-full border-4 border-[#0A0A0A] flex items-center justify-center text-3xl font-black shadow-lg"
            style={{ backgroundColor: user.armyColor || '#FF2D55', color: '#000' }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          
          <h2 className="mt-3 text-white font-display font-bold text-xl">{user.username}</h2>
          
          <div className="flex gap-2 mt-1 mb-4">
            <span className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border border-white/20 bg-white/5 text-white/70">
              {user.rank || 'RECRUIT'}
            </span>
            <span 
              className="text-[10px] font-mono tracking-widest px-2 py-0.5 rounded"
              style={{ backgroundColor: `${user.armyColor || '#FF2D55'}22`, color: user.armyColor || '#FF2D55', border: `1px solid ${user.armyColor || '#FF2D55'}44` }}
            >
              {user.armyName || 'Free Agent'}
            </span>
          </div>

          {/* Duel Challenge Section */}
          {user.id !== me?.id ? (
            <div className="w-full mt-2">
              {!showChallenge ? (
                <button
                  onClick={() => setShowChallenge(true)}
                  className="w-full py-3 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)' }}
                >
                  <span>🔫</span> Challenge to Sniper Duel
                </button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-col gap-3 p-3 bg-white/5 rounded-xl border border-white/10"
                >
                  <label className="text-xs font-mono text-white/50 uppercase tracking-widest text-left">
                    Declare Duel Topic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kohli vs Dhoni, who is better?"
                    value={topicText}
                    onChange={e => setTopicText(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white font-mono text-sm placeholder:text-white/20 focus:border-[#FF2D55]/50 outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowChallenge(false)} className="flex-1 py-2 rounded-lg text-xs font-bold text-white/50 hover:bg-white/10">CANCEL</button>
                    <button 
                      onClick={handleChallenge} 
                      disabled={!topicText.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #FF2D55, #FF6B2C)' }}
                    >
                      SEND
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <p className="text-white/40 text-[10px] font-mono mt-4">This is you.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
