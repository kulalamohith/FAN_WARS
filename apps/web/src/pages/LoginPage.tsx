import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WarzoneButton from '../components/ui/WarzoneButton';
import GlassCard from '../components/ui/GlassCard';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import LandingHero from '../components/ui/LandingHero';
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

type Step =
  | 'landing'
  | 'signin'
  | 'signup-email'
  | 'signup-otp'
  | 'signup-password'
  | 'signup-draft'
  | 'signup-username'
  | 'forgot-email'
  | 'forgot-otp'
  | 'forgot-reset';

export default function LoginPage() {
  const [step, setStep] = useState<Step>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedArmy, setSelectedArmy] = useState<typeof ARMIES[0] | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTitle, setShowTitle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300);
  }, []);

  const clearForm = () => {
    setEmail(''); setPassword(''); setConfirmPassword('');
    setOtp(''); setUsername(''); setSelectedArmy(null);
    setError(''); setSuccess('');
  };

  // ── SIGN IN ──
  const handleSignIn = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.auth.signin(email, password);
      setAuth(res.token, res.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP: send OTP ──
  const handleSignupSendOtp = async () => {
    setLoading(true); setError('');
    try {
      await api.auth.sendOtp(email);
      setStep('signup-otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP: verify OTP ──
  const handleSignupVerifyOtp = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.auth.verifyOtp(email, otp);
      if (res.userExists) {
        setError('An account with this email already exists. Please sign in instead.');
      } else {
        setStep('signup-password');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── SIGNUP: complete registration ──
  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!selectedArmy) return;

    setLoading(true); setError('');
    try {
      const res = await api.auth.signup(email, password, username, selectedArmy.name);
      setAuth(res.token, res.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT: send OTP ──
  const handleForgotSendOtp = async () => {
    setLoading(true); setError('');
    try {
      await api.auth.forgotPassword(email);
      setStep('forgot-otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── FORGOT: verify OTP (we store it temporarily) ──
  const [forgotOtp, setForgotOtp] = useState('');

  const handleForgotVerifyOtp = async () => {
    // We don't actually verify via /verify-otp here because the OTP is consumed.
    // Instead we go to reset step and send otp+newPassword together to /reset-password
    if (forgotOtp.length !== 6) return;
    setStep('forgot-reset');
  };

  // ── FORGOT: reset password ──
  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword(email, forgotOtp, password);
      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        clearForm();
        setStep('signin');
        setSuccess('');
      }, 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input classes ──
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-sans text-base tracking-wider placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-all duration-300";
  const labelClass = "block text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2";

  // ── Shared animation ──
  const pageAnim = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40, scale: 0.95 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as number[] },
  };

  const glassStyle = { background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(30px)' };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">

          {/* ══════════════ LANDING ══════════════ */}
          {step === 'landing' && (
            <motion.div
              key="landing"
              exit={{ opacity: 0, y: -40, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="fixed inset-0 z-50 bg-black overflow-y-auto"
            >
              <LandingHero onEnter={() => setStep('signin')} />
            </motion.div>
          )}

          {/* ══════════════ SIGN IN ══════════════ */}
          {step === 'signin' && (
            <motion.div key="signin" {...pageAnim}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={showTitle ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="mb-14"
              >
                <RivalryBrandHeader />
              </motion.div>

              <GlassCard className="p-7" style={glassStyle}>
                <h2 className="text-xl font-display font-bold text-white mb-1 text-center">Welcome Back</h2>
                <p className="text-white/30 text-[10px] mb-6 text-center tracking-wide">Sign in to your Warzone account</p>

                <label className={labelClass}>Email Address</label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">✉️</span>
                  <input
                    id="signin-email"
                    type="email"
                    placeholder="warrior@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    className={`${inputClass} pl-12`}
                  />
                </div>

                <label className={labelClass}>Password</label>
                <div className="relative mb-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">🔒</span>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <div className="text-right mb-5">
                  <button
                    type="button"
                    onClick={() => { clearForm(); setStep('forgot-email'); }}
                    className="text-[10px] text-[#FF6B2C] hover:text-[#FF2D55] uppercase tracking-wider font-medium transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleSignIn}
                  disabled={!email.includes('@') || password.length < 6}>
                  Sign In
                </WarzoneButton>

                <div className="mt-6 text-center">
                  <p className="text-white/30 text-[10px] tracking-wide">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { clearForm(); setStep('signup-email'); }}
                      className="text-[#FF2D55] hover:text-[#FF6B2C] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Sign Up
                    </button>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ SIGNUP: EMAIL ══════════════ */}
          {step === 'signup-email' && (
            <motion.div key="signup-email" {...pageAnim}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={showTitle ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="mb-14"
              >
                <RivalryBrandHeader />
              </motion.div>

              <GlassCard className="p-7" style={glassStyle}>
                <h2 className="text-xl font-display font-bold text-white mb-1 text-center">Join the Warzone</h2>
                <p className="text-white/30 text-[10px] mb-6 text-center tracking-wide">Enter your email to get started</p>

                <label className={labelClass}>Your Email Address</label>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">✉️</span>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="warrior@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    className={`${inputClass} pl-12`}
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleSignupSendOtp}
                  disabled={!email.includes('@') || email.length < 5}>
                  Send Verification Code
                </WarzoneButton>

                <div className="mt-6 text-center">
                  <p className="text-white/30 text-[10px] tracking-wide">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => { clearForm(); setStep('signin'); }}
                      className="text-[#FF2D55] hover:text-[#FF6B2C] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ SIGNUP: OTP ══════════════ */}
          {step === 'signup-otp' && (
            <motion.div key="signup-otp" {...pageAnim}>
              <GlassCard className="p-7 text-center" style={glassStyle}>
                <div className="w-16 h-16 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Verify Email</h2>
                <p className="text-white/40 text-[10px] mb-6 tracking-wide">Enter the 6-digit code sent to <span className="text-white/60">{email}</span></p>

                <div className="relative mb-5 text-left">
                  <input
                    id="signup-otp-input"
                    type="text"
                    placeholder="------"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} text-xl uppercase tracking-[0.5em] text-center`}
                    maxLength={6}
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center justify-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleSignupVerifyOtp}
                  disabled={otp.length !== 6}>
                  Verify & Continue
                </WarzoneButton>

                <button
                  type="button"
                  onClick={() => { setOtp(''); setError(''); handleSignupSendOtp(); }}
                  className="mt-4 text-[10px] text-white/30 hover:text-white/50 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Resend Code
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ SIGNUP: SET PASSWORD ══════════════ */}
          {step === 'signup-password' && (
            <motion.div key="signup-password" {...pageAnim}>
              <GlassCard className="p-7" style={glassStyle}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">✅</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-white mb-1">Email Verified!</h2>
                  <p className="text-white/30 text-[10px] tracking-wide">Now create a secure password for your account</p>
                </div>

                <label className={labelClass}>Password</label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">🔒</span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <label className={labelClass}>Confirm Password</label>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">🔒</span>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer">
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="mb-5">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div key={level} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          password.length >= level * 3
                            ? level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-orange-500' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                            : 'bg-white/10'
                        }`} />
                      ))}
                    </div>
                    <p className="text-[9px] text-white/30">
                      {password.length < 6 ? 'Too short' : password.length < 8 ? 'Fair' : password.length < 12 ? 'Strong' : 'Very Strong'}
                    </p>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth onClick={() => {
                  if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
                  if (password !== confirmPassword) { setError('Passwords do not match'); return; }
                  setError('');
                  setStep('signup-draft');
                }} disabled={password.length < 6 || confirmPassword.length < 6}>
                  Continue
                </WarzoneButton>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ SIGNUP: PICK TEAM ══════════════ */}
          {step === 'signup-draft' && (
            <motion.div key="signup-draft" {...pageAnim}>
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
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/5 hover:border-white/10'}
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

              <WarzoneButton fullWidth disabled={!selectedArmy} onClick={() => setStep('signup-username')}>
                Continue with {selectedArmy?.name || '...'}
              </WarzoneButton>
            </motion.div>
          )}

          {/* ══════════════ SIGNUP: USERNAME ══════════════ */}
          {step === 'signup-username' && (
            <motion.div key="signup-username" {...pageAnim}>
              <GlassCard className="p-8 text-center" style={glassStyle}>
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

                <label className={`${labelClass} text-left`}>
                  Username
                </label>
                <input
                  id="signup-username-input"
                  type="text"
                  placeholder="e.g. KohliKing_18"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`${inputClass} text-center mb-6`}
                  maxLength={20}
                />

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs mb-4">
                    ⚠️ {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleSignup} disabled={username.length < 3}>
                  Join Rivalry
                </WarzoneButton>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ FORGOT PASSWORD: EMAIL ══════════════ */}
          {step === 'forgot-email' && (
            <motion.div key="forgot-email" {...pageAnim}>
              <GlassCard className="p-7" style={glassStyle}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#FF6B2C]/10 border border-[#FF6B2C]/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔑</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-white mb-1">Reset Password</h2>
                  <p className="text-white/30 text-[10px] tracking-wide">Enter your email and we'll send a verification code</p>
                </div>

                <label className={labelClass}>Email Address</label>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">✉️</span>
                  <input
                    id="forgot-email"
                    type="email"
                    placeholder="warrior@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                    className={`${inputClass} pl-12`}
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleForgotSendOtp}
                  disabled={!email.includes('@') || email.length < 5}>
                  Send Reset Code
                </WarzoneButton>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => { clearForm(); setStep('signin'); }}
                    className="text-[10px] text-white/30 hover:text-white/50 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ FORGOT PASSWORD: OTP ══════════════ */}
          {step === 'forgot-otp' && (
            <motion.div key="forgot-otp" {...pageAnim}>
              <GlassCard className="p-7 text-center" style={glassStyle}>
                <div className="w-16 h-16 rounded-full bg-[#FF2D55]/10 border border-[#FF2D55]/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Enter Reset Code</h2>
                <p className="text-white/40 text-[10px] mb-6 tracking-wide">Enter the 6-digit code sent to <span className="text-white/60">{email}</span></p>

                <div className="relative mb-5 text-left">
                  <input
                    id="forgot-otp-input"
                    type="text"
                    placeholder="------"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} text-xl uppercase tracking-[0.5em] text-center`}
                    maxLength={6}
                  />
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center justify-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleForgotVerifyOtp}
                  disabled={forgotOtp.length !== 6}>
                  Continue
                </WarzoneButton>

                <button
                  type="button"
                  onClick={() => { setForgotOtp(''); setError(''); handleForgotSendOtp(); }}
                  className="mt-4 text-[10px] text-white/30 hover:text-white/50 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Resend Code
                </button>
              </GlassCard>
            </motion.div>
          )}

          {/* ══════════════ FORGOT PASSWORD: NEW PASSWORD ══════════════ */}
          {step === 'forgot-reset' && (
            <motion.div key="forgot-reset" {...pageAnim}>
              <GlassCard className="p-7" style={glassStyle}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <h2 className="text-xl font-display font-bold text-white mb-1">Create New Password</h2>
                  <p className="text-white/30 text-[10px] tracking-wide">Choose a strong password for your account</p>
                </div>

                <label className={labelClass}>New Password</label>
                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">🔒</span>
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                <label className={labelClass}>Confirm New Password</label>
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg">🔒</span>
                  <input
                    id="reset-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputClass} pl-12 pr-12`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-sm cursor-pointer">
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-red-400 text-xs mb-4 flex items-center gap-2">
                    <span>⚠️</span> {error}
                  </motion.p>
                )}

                {success && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-green-400 text-xs mb-4 flex items-center justify-center gap-2">
                    <span>✅</span> {success}
                  </motion.p>
                )}

                <WarzoneButton fullWidth loading={loading} onClick={handleResetPassword}
                  disabled={password.length < 6 || confirmPassword.length < 6}>
                  Reset Password
                </WarzoneButton>
              </GlassCard>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
