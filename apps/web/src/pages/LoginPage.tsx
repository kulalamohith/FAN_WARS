import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../components/ui/WarzoneButton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RivalryEmblem, RivalryBrandHeader } from '../components/ui/RivalryLogo';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const ARMIES = [
  { name: 'CSK', color: '#FFFF3C', logo: '/teams/csk.png', full: 'Chennai Super Kings' },
  { name: 'RCB', color: '#EC1C24', logo: '/teams/rcb.png', full: 'Royal Challengers' },
  { name: 'MI',  color: '#004BA0', logo: '/teams/mi.png', full: 'Mumbai Indians' },
  { name: 'KKR', color: '#2E0854', logo: '/teams/kkr.png', full: 'Kolkata Knight Riders' },
  { name: 'SRH', color: '#F26522', logo: '/teams/srh.png', full: 'Sunrisers Hyderabad' },
  { name: 'DC',  color: '#00008B', logo: '/teams/dc.png', full: 'Delhi Capitals' },
  { name: 'PBKS',color: '#ED1B24', logo: '/teams/pbks.png', full: 'Punjab Kings' },
  { name: 'RR',  color: '#EA1A85', logo: '/teams/rr.png', full: 'Rajasthan Royals' },
  { name: 'LSG', color: '#0057E2', logo: '/teams/lsg.png', full: 'Lucknow Super Giants' },
  { name: 'GT',  color: '#1B2133', logo: '/teams/gt.png', full: 'Gujarat Titans' },
];

type Step = 'phone' | 'draft' | 'username';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [selectedArmy, setSelectedArmy] = useState<typeof ARMIES[0] | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300);
  }, []);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.auth.login(phone);
      if (res.is_new_user) {
        setStep('draft');
      } else {
        setAuth(res.token!, res.user);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    if (!selectedArmy) return;
    setLoading(true); setError('');
    try {
      const res = await api.auth.onboard(phone, username, selectedArmy.name);
      setAuth(res.token, res.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* ========== STEP 1: PHONE ========== */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* === ICONIC BRAND HEADER === */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={showTitle ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="mb-14"
              >
                <RivalryBrandHeader />
              </motion.div>

              <GlassCard className="p-7" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(30px)' }}>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2">
                  Your phone number
                </label>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">+91</span>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-sans text-lg tracking-wider placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-300"
                    maxLength={10}
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2"
                  >
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleLogin} disabled={phone.length < 10}>
                  Continue
                </WarzoneButton>

                <p className="text-center text-white/20 text-[10px] mt-6">
                  Join 50K+ fans already on Rivalry
                </p>
              </GlassCard>
            </motion.div>
          )}

          {/* ========== STEP 2: PICK YOUR TEAM ========== */}
          {step === 'draft' && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-center mb-6">
                <RivalryEmblem size={36} className="mx-auto mb-3 opacity-60" />
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-display font-black text-white mb-2"
                >
                  Pick your team
                </motion.h2>
                <p className="text-white/40 text-xs">
                  This is your identity for the season. Choose wisely.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {ARMIES.map((army, i) => (
                  <motion.button
                    key={army.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedArmy(army)}
                    className={`
                      relative p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer overflow-hidden
                      ${selectedArmy?.name === army.name
                        ? 'border-white/40 bg-white/10 shadow-lg'
                        : 'border-white/5 bg-white/3 hover:bg-white/5 hover:border-white/10'}
                    `}
                  >
                    {selectedArmy?.name === army.name && (
                      <motion.div
                        layoutId="team-select"
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ backgroundColor: army.color }}
                      >
                        ✓
                      </motion.div>
                    )}

                    <img src={army.logo} alt={army.name} className="w-10 h-10 object-contain mb-2 drop-shadow-md rounded-full border border-white/5 bg-black/20" />
                    <span className="font-display font-bold text-sm text-white block">{army.name}</span>
                    <span className="text-[9px] text-white/30">{army.full}</span>
                  </motion.button>
                ))}
              </div>

              <WarzoneButton fullWidth disabled={!selectedArmy} onClick={() => setStep('username')}>
                Continue with {selectedArmy?.name || '...'}
              </WarzoneButton>
            </motion.div>
          )}

          {/* ========== STEP 3: USERNAME ========== */}
          {step === 'username' && (
            <motion.div
              key="username"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <GlassCard className="p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg overflow-hidden border-2"
                  style={{ backgroundColor: `${selectedArmy?.color}10`, borderColor: `${selectedArmy?.color}40`, boxShadow: `0 0 20px ${selectedArmy?.color}20` }}
                >
                  <img src={selectedArmy?.logo} alt={selectedArmy?.name} className="w-full h-full object-cover" />
                </motion.div>

                <h2 className="text-xl font-display font-bold text-white mb-1">
                  Create your profile
                </h2>
                <p className="text-white/30 text-xs mb-6">
                  This is how other fans will see you
                </p>

                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2 text-left">
                  Username
                </label>
                <input
                  id="username-input"
                  type="text"
                  placeholder="e.g. KohliKing_18"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-sans text-lg text-center tracking-wider placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-300 mb-6"
                  maxLength={20}
                />

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mb-4">
                    ⚠️ {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleOnboard} disabled={username.length < 3}>
                  Join Rivalry
                </WarzoneButton>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
