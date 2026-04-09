import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DuelPhase = 'queue' | 'matched' | 'active' | 'result';

interface SniperPrediction {
  id: string;
  question: string;
  timeLeft: number; // seconds
}

interface Props {
  myUsername: string;
  myTeam: string;
  myColor: string;
  onClose: () => void;
  socket?: any;
  matchId: string;
}

const MOCK_PREDICTIONS: SniperPrediction[] = [
  { id: '1', question: 'Next wicket in this over?', timeLeft: 60 },
  { id: '2', question: 'More than 8 runs this over?', timeLeft: 45 },
  { id: '3', question: 'A six hit in next 5 balls?', timeLeft: 30 },
];

const RIVAL_NAMES = ['ViratFanatic', 'RohitKing99', 'MSDhoni7x', 'BumrahBeast', 'PatCummins4ever'];

export default function SniperDuel({ myUsername, myTeam, myColor, onClose, matchId }: Props) {
  const [phase, setPhase] = useState<DuelPhase>('queue');
  const [countdown, setCountdown] = useState(3);
  const [rival, setRival] = useState({ name: '', color: '#FF2D55', team: '' });
  const [myScore, setMyScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [currentPred, setCurrentPred] = useState<SniperPrediction | null>(null);
  const [votedOption, setVotedOption] = useState<'yes' | 'no' | null>(null);
  const [predTimer, setPredTimer] = useState(0);
  const [duelTimer, setDuelTimer] = useState(3 * 6 * 10); // 3 overs simulation = 180s
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);

  // Simulate matchmaking
  useEffect(() => {
    if (phase !== 'queue') return;
    const t = setTimeout(() => {
      setRival({
        name: RIVAL_NAMES[Math.floor(Math.random() * RIVAL_NAMES.length)],
        color: '#FF6B2C',
        team: 'CSK',
      });
      setPhase('matched');
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Countdown to start
  useEffect(() => {
    if (phase !== 'matched') return;
    if (countdown <= 0) { setPhase('active'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Duel timer
  useEffect(() => {
    if (phase !== 'active') return;
    if (duelTimer <= 0) {
      const r = myScore > rivalScore ? 'win' : myScore < rivalScore ? 'lose' : 'draw';
      setResult(r);
      setPhase('result');
      return;
    }
    const t = setInterval(() => setDuelTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, duelTimer, myScore, rivalScore]);

  // Pop up predictions periodically
  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => {
      const pred = MOCK_PREDICTIONS[Math.floor(Math.random() * MOCK_PREDICTIONS.length)];
      setCurrentPred(pred);
      setVotedOption(null);
      setPredTimer(15);
    }, 18000);
    // First one after 3s
    const first = setTimeout(() => {
      setCurrentPred(MOCK_PREDICTIONS[0]);
      setVotedOption(null);
      setPredTimer(15);
    }, 3000);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [phase]);

  // Prediction countdown
  useEffect(() => {
    if (!currentPred || votedOption) return;
    if (predTimer <= 0) { setCurrentPred(null); return; }
    const t = setTimeout(() => setPredTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [currentPred, predTimer, votedOption]);

  const handleVote = useCallback((option: 'yes' | 'no') => {
    setVotedOption(option);
    // Simulate scoring
    const win = Math.random() > 0.4;
    if (win) setMyScore(s => s + 100);
    else setRivalScore(s => s + 100);
    setTimeout(() => setCurrentPred(null), 2000);
  }, []);

  const accentColor = myColor;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Queue */}
        {phase === 'queue' && (
          <div className="glass-card p-8 text-center">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
              <span className="text-5xl">🎯</span>
            </motion.div>
            <h3 className="text-white font-display font-black text-xl mt-4 mb-2">SNIPER DUEL</h3>
            <p className="text-white/40 font-mono text-xs mb-6">Matching you with a rival fan...</p>
            <div className="flex justify-center gap-1">
              {[0,1,2].map(i => (
                <motion.div
                  key={i} className="w-2 h-2 rounded-full bg-wz-red"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.4 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Matched */}
        {phase === 'matched' && (
          <div className="glass-card p-8 text-center">
            <p className="text-[10px] font-mono text-wz-yellow tracking-widest mb-6">🎯 RIVAL FOUND</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl mx-auto mb-2" style={{ borderColor: myColor, color: myColor }}>
                  {myUsername.slice(0,2).toUpperCase()}
                </div>
                <p className="text-xs font-mono font-bold" style={{ color: myColor }}>{myUsername}</p>
                <p className="text-[9px] text-white/30 font-mono">{myTeam}</p>
              </div>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 0.8 }} className="text-3xl">⚔️</motion.div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-full border-2 border-orange-500 flex items-center justify-center text-xl mx-auto mb-2 text-orange-500">
                  {rival.name.slice(0,2).toUpperCase()}
                </div>
                <p className="text-xs font-mono font-bold text-orange-500">{rival.name}</p>
                <p className="text-[9px] text-white/30 font-mono">{rival.team}</p>
              </div>
            </div>
            <motion.div key={countdown} initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-5xl font-display font-black text-wz-yellow">
              {countdown > 0 ? countdown : '⚡ GO!'}
            </motion.div>
          </div>
        )}

        {/* Active Duel */}
        {phase === 'active' && (
          <div className="space-y-4">
            {/* HUD */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="font-display font-black text-2xl" style={{ color: myColor }}>{myScore}</p>
                  <p className="text-[9px] font-mono text-white/40">{myUsername}</p>
                </div>
                <div className="text-center">
                  <p className="font-mono text-xs text-white/40">{Math.floor(duelTimer/60)}:{String(duelTimer%60).padStart(2,'0')}</p>
                  <p className="text-[9px] font-mono text-white/20">remaining</p>
                </div>
                <div className="text-center">
                  <p className="font-display font-black text-2xl text-orange-500">{rivalScore}</p>
                  <p className="text-[9px] font-mono text-white/40">{rival.name}</p>
                </div>
              </div>
              {/* Score bar */}
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                <motion.div className="h-full rounded-l-full" style={{ background: myColor, width: `${myScore / Math.max(myScore + rivalScore, 1) * 100}%` }} layout />
                <motion.div className="h-full rounded-r-full bg-orange-500" style={{ flex: 1 }} layout />
              </div>
            </div>

            {/* Live Prediction Popup */}
            <AnimatePresence>
              {currentPred && (
                <motion.div
                  key={currentPred.id}
                  initial={{ opacity: 0, scale: 0.85, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="glass-card p-5 border border-wz-yellow/30"
                  style={{ boxShadow: '0 0 30px rgba(255,214,10,0.15)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-mono tracking-widest text-wz-yellow uppercase">🎯 Sniper Call</span>
                    <span className="ml-auto text-xs font-mono font-black text-wz-red">{predTimer}s</span>
                  </div>
                  <p className="text-white font-display font-bold text-base mb-4">{currentPred.question}</p>
                  {!votedOption ? (
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button id="sniper-yes" whileTap={{ scale: 0.93 }} onClick={() => handleVote('yes')}
                        className="py-3 rounded-xl bg-emerald-500 text-white font-display font-black text-sm">
                        ✅ YES
                      </motion.button>
                      <motion.button id="sniper-no" whileTap={{ scale: 0.93 }} onClick={() => handleVote('no')}
                        className="py-3 rounded-xl bg-wz-red text-white font-display font-black text-sm">
                        ❌ NO
                      </motion.button>
                    </div>
                  ) : (
                    <p className="text-center font-mono text-xs text-white/50 py-3">Locked: <span className="text-wz-yellow font-bold">{votedOption.toUpperCase()}</span> — Waiting for result...</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass-card p-4 text-center">
              <p className="text-white/30 font-mono text-xs">🔒 Private duel — {rival.name} can't back down now.</p>
            </div>

            <button id="sniper-close" onClick={onClose} className="w-full py-2 text-white/20 font-mono text-xs">Forfeit & Leave</button>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="glass-card p-8 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }} className="text-6xl mb-4">
              {result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝'}
            </motion.div>
            <h3 className="font-display font-black text-2xl mb-2" style={{ color: result === 'win' ? '#00FF88' : result === 'lose' ? '#FF2D55' : '#FFD60A' }}>
              {result === 'win' ? 'VICTORY!' : result === 'lose' ? 'ELIMINATED!' : 'DRAW!'}
            </h3>
            <p className="text-white/40 font-mono text-sm mb-1">
              {myScore} vs {rivalScore}
            </p>
            <p className="text-white/20 text-xs font-mono mb-6">
              {result === 'win' ? `Stole ${Math.floor(rivalScore * 0.1)} WP from ${rival.name}!` : result === 'lose' ? 'They took some WP from you...' : 'No WP exchanged.'}
            </p>
            <button id="sniper-done" onClick={onClose} className="w-full py-3 rounded-xl bg-white/10 text-white font-mono text-sm border border-white/20">
              Back to War Room
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
