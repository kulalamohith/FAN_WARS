import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import WarzoneButton from '../components/ui/WarzoneButton';
import GlassCard from '../components/ui/GlassCard';
import { api } from '../lib/api';
import { IPL_2026_SCHEDULE, IPLMatch } from '../data/ipl2026';
import AdminBackground from '../components/ui/AdminBackground';

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const liveMatches: (IPLMatch & { status: string })[] = [];
  const upcomingMatches: (IPLMatch & { status: string })[] = [];
  const completedMatches: (IPLMatch & { status: string })[] = [];

  IPL_2026_SCHEDULE.forEach(m => {
    const startTime = new Date(m.datetime);
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // 4h duration
    
    const isToday = startTime.toDateString() === now.toDateString();

    if (isToday && now < endTime) {
      liveMatches.push({ ...m, status: 'LIVE' });
    } else if (startTime > now && !isToday) {
      upcomingMatches.push({ ...m, status: 'UPCOMING' });
    } else {
      completedMatches.push({ ...m, status: 'COMPLETED' });
    }
  });

  const adminEventMutation = useMutation({
    mutationFn: ({ matchId, eventType, payload }: { matchId: string, eventType: string, payload: any }) => 
      api.warRooms.adminEvent(`match-${matchId}`, eventType, payload),
    onSuccess: () => alert('⚡ LIVE EVENT BROADCASTED!'),
    onError: (err: any) => alert(err.message || 'Failed to dispatch event')
  });


  return (
    <div className="min-h-screen pb-20 relative bg-[#010204]">
      <AdminBackground />

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-wz-red/30">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-wz-muted hover:text-white text-sm font-mono flex items-center gap-2">
            ← <span className="uppercase tracking-widest text-xs font-bold">Exit Admin</span>
          </button>
          <div className="flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-wz-red animate-pulse shadow-[0_0_10px_rgba(255,45,85,0.8)]" />
             <h1 className="text-wz-red font-display font-black text-xl tracking-tighter uppercase italic">Supreme Commander HUD</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono text-wz-muted uppercase tracking-widest">Global Clock</p>
            <p className="text-xs font-mono text-white/80">{now.toLocaleTimeString()}</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto w-full px-5 pt-8 space-y-16">
        
        {/* LIVE SECTION */}
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-wz-red/20 pb-4">
             <div className="live-dot" />
             <h2 className="text-2xl font-display font-black text-white tracking-widest uppercase italic">Live Battlefields</h2>
             <span className="ml-auto px-2 py-0.5 bg-wz-red/20 text-wz-red text-[10px] font-mono border border-wz-red/30 rounded">{liveMatches.length} ACTIVE</span>
          </div>
          
          {liveMatches.length === 0 ? (
            <div className="py-12 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
               <p className="text-wz-muted font-mono text-sm uppercase tracking-widest">No Active Wars Detected</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {liveMatches.map((match) => (
                <AdminMatchCard key={match.id} match={match} adminEventMutation={adminEventMutation} />
              ))}
            </div>
          )}
        </section>

        {/* UPCOMING SECTION */}
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-4">
             <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
             <h2 className="text-2xl font-display font-black text-white/80 tracking-widest uppercase italic font-medium">Upcoming Clashes</h2>
             <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20 rounded">{upcomingMatches.length} DEPLOYS</span>
          </div>
          
          <div className="grid grid-cols-1 gap-8 opacity-80 hover:opacity-100 transition-opacity">
            {upcomingMatches.slice(0, 5).map((match) => (
              <AdminMatchCard key={match.id} match={match} adminEventMutation={adminEventMutation} />
            ))}
          </div>
        </section>

        {/* COMPLETED SECTION */}
        <section>
          <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
             <div className="w-2 h-2 rounded-full bg-gray-500" />
             <h2 className="text-2xl font-display font-black text-white/40 tracking-widest uppercase italic font-medium">Matches Completed</h2>
             <span className="ml-auto px-2 py-0.5 bg-white/5 text-white/30 text-[10px] font-mono border border-white/5 rounded">{completedMatches.length} ARCHIVED</span>
          </div>
          
          <div className="grid grid-cols-1 gap-8 opacity-40 hover:opacity-100 transition-all duration-500 grayscale hover:grayscale-0">
            {completedMatches.slice(0, 3).map((match) => (
              <AdminMatchCard key={match.id} match={match} adminEventMutation={adminEventMutation} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

function AdminMatchCard({ match, adminEventMutation }: any) {
  const [activePrediction, setActivePrediction] = useState<{ id: string, question: string, optionA: string, optionB: string } | null>(null);

  const triggerMutation = useMutation({
    mutationFn: (payload: any) => 
      api.predictions.trigger(`match-${match.id}`, payload),
    onSuccess: (data: any, variables: any) => {
      alert('⚡ PREDICTION FIRED!');
      setActivePrediction({
        id: data.predictionId,
        question: variables.questionText,
        optionA: variables.optionA,
        optionB: variables.optionB
      });
    },
    onError: (err: any) => alert(err.message)
  });

  const resolveMutation = useMutation({
    mutationFn: (correctOption: 'A' | 'B') =>
      api.predictions.resolve(activePrediction!.id, correctOption),
    onSuccess: (data: any) => {
      alert(data.message || '✅ PREDICTION RESOLVED!');
      setActivePrediction(null);
    },
    onError: (err: any) => alert(err.message)
  });

  return (
    <div className="bg-gradient-to-br from-black/80 to-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      <div className="flex flex-col xl:flex-row gap-8 relative z-10">
        
        {/* Match Identity */}
        <div className="xl:w-80 flex flex-col justify-between border-r border-white/5 pr-8">
           <div>
              <div className="flex items-center gap-2 mb-3">
                 <span className="text-[10px] font-mono text-wz-muted">ID: {match.id}</span>
                 <span className="text-[10px] font-mono text-wz-muted">|</span>
                 <span className="text-[10px] font-mono text-wz-muted uppercase tracking-wider">{match.dateStr}</span>
              </div>
              <h3 className="text-3xl font-display font-black text-white italic mb-2 tracking-tighter">
                {match.homeTeam} <span className="text-wz-red">VS</span> {match.awayTeam}
              </h3>
              <p className="text-xs text-wz-muted font-mono uppercase truncate">🏟️ {match.stadium}</p>
           </div>
           
           <div className="mt-8 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                 <div className="text-center flex-1">
                    <p className="text-[10px] text-wz-muted uppercase font-mono mb-1">Status</p>
                    <p className={`text-xs font-bold font-mono ${match.status === 'LIVE' ? 'text-wz-red animate-pulse' : 'text-blue-400'}`}>{match.status}</p>
                 </div>
                 <div className="h-8 w-[1px] bg-white/5" />
                 <div className="text-center flex-1">
                    <p className="text-[10px] text-wz-muted uppercase font-mono mb-1">Kickoff</p>
                    <p className="text-xs font-bold font-mono text-white/80">{match.timeStr}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Admin Controls */}
        <div className="flex-1">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <FormSection title="CLUTCH PREDICTION" color="#00FF88" icon="🎯">
                {activePrediction ? (
                  <div className="space-y-3">
                    <div className="text-[11px] font-mono text-white/80 border-b border-white/10 pb-2 mb-2">
                       <span className="text-[#00FF88] block text-[9px] mb-1 font-bold tracking-widest">ACTIVE PREDICTION:</span>
                       {activePrediction.question}
                    </div>
                    <div className="flex gap-2">
                      <WarzoneButton fullWidth variant="primary" className="py-2 min-h-0 text-[10px] flex-1 bg-[#00FF88]/20 text-[#00FF88] hover:bg-[#00FF88]/40 border border-[#00FF88]/50" onClick={() => resolveMutation.mutate('A')} loading={resolveMutation.isPending && resolveMutation.variables === 'A'}>
                        ✅ {activePrediction.optionA}
                      </WarzoneButton>
                      <WarzoneButton fullWidth variant="danger" className="py-2 min-h-0 text-[10px] flex-1 bg-wz-red/20 text-wz-red hover:bg-wz-red/40 border border-wz-red/50" onClick={() => resolveMutation.mutate('B')} loading={resolveMutation.isPending && resolveMutation.variables === 'B'}>
                        ✅ {activePrediction.optionB}
                      </WarzoneButton>
                    </div>
                  </div>
                ) : (
                  <PredictionForm 
                    onSubmit={(payload: any) => triggerMutation.mutate(payload)}
                    isSubmitting={triggerMutation.isPending}
                  />
                )}
              </FormSection>

              <FormSection title="CHAOS BANNER" color="#FFD60A" icon="🔥">
                <ChaosBannerForm 
                  onSubmit={(payload: any) => adminEventMutation.mutate({ matchId: match.id.toString(), eventType: 'chaos', payload })}
                  isSubmitting={adminEventMutation.isPending && adminEventMutation.variables?.eventType === 'chaos'}
                />
              </FormSection>

              <FormSection title="JINX / SHIELD" color="#BF5AF2" icon="🧿">
                <JinxForm 
                  targetTeam={match.awayTeam}
                  onSubmit={(payload: any) => adminEventMutation.mutate({ matchId: match.id.toString(), eventType: 'jinx', payload })}
                  isSubmitting={adminEventMutation.isPending && adminEventMutation.variables?.eventType === 'jinx'}
                />
              </FormSection>

              <FormSection title="TRAITOR'S DILEMMA" color="#FF2D55" icon="💀">
                <TraitorsDilemmaForm 
                  losing={match.awayTeam}
                  winning={match.homeTeam}
                  onSubmit={(payload: any) => adminEventMutation.mutate({ matchId: match.id.toString(), eventType: 'traitors', payload })}
                  isSubmitting={adminEventMutation.isPending && adminEventMutation.variables?.eventType === 'traitors'}
                />
              </FormSection>
           </div>
        </div>
      </div>
      
      {/* Visual Glitch Lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-wz-red/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-[0_0_20px_white]" />
    </div>
  );
}

function FormSection({ title, color, icon, children }: { title: string, color: string, icon: string, children: React.ReactNode }) {
  return (
    <div className="bg-black/50 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
      <div className="flex items-center gap-2 mb-4">
         <span className="text-sm">{icon}</span>
         <h3 className="font-display font-black text-[10px] tracking-widest uppercase italic" style={{ color }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// --- FORM COMPONENTS ---

function PredictionForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [question, setQuestion] = useState('Next ball a Boundary?');
  const [optionA, setOptionA] = useState('YES');
  const [optionB, setOptionB] = useState('NO');
  const [pts, setPts] = useState('500');

  return (
    <div className="space-y-3">
      <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className="form-input" placeholder="Question..." />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={optionA} onChange={e => setOptionA(e.target.value)} className="form-input" placeholder="A" />
        <input type="text" value={optionB} onChange={e => setOptionB(e.target.value)} className="form-input" placeholder="B" />
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-black/40 rounded border border-white/10 px-3 py-1.5 flex items-center justify-between">
           <span className="text-[10px] font-mono text-wz-muted">WP:</span>
           <input type="number" value={pts} onChange={e => setPts(e.target.value)} className="bg-transparent border-none focus:outline-none text-[10px] font-mono text-white text-right w-16" />
        </div>
        <WarzoneButton variant="primary" className="py-2.5 min-h-0 text-[10px] w-24 shrink-0 shadow-[0_0_15px_rgba(0,255,136,0.3)]" loading={isSubmitting} onClick={() => onSubmit({ questionText: question, optionA, optionB, pointsReward: parseInt(pts, 10), durationMs: 25000 })}>
          DEPLOY
        </WarzoneButton>
      </div>
    </div>
  );
}

function ChaosBannerForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [question, setQuestion] = useState('Will this over turn chaotic?');
  const [optionA, setOptionA] = useState('YES (MADNESS)');
  const [optionB, setOptionB] = useState('NO (BORING)');
  
  return (
    <div className="space-y-3">
      <input type="text" value={question} onChange={e => setQuestion(e.target.value)} className="form-input text-wz-yellow border-wz-yellow/20" />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" value={optionA} onChange={e => setOptionA(e.target.value)} className="form-input flex-1" />
        <input type="text" value={optionB} onChange={e => setOptionB(e.target.value)} className="form-input flex-1" />
      </div>
      <WarzoneButton fullWidth className="py-2 min-h-0 text-[10px] bg-wz-yellow text-black hover:bg-yellow-400 font-bold" loading={isSubmitting} onClick={() => onSubmit({ question, optionA, optionB, multiplier: 2.5, durationSeconds: 15, votesA: 50, votesB: 50 })}>
        STRIKE CHAOS
      </WarzoneButton>
    </div>
  );
}

function JinxForm({ targetTeam, onSubmit, isSubmitting }: { targetTeam: string, onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [player, setPlayer] = useState('Star Player');
  const [mode, setMode] = useState<'jinx'|'defend'>('jinx');

  return (
    <div className="space-y-3">
      <input type="text" value={player} onChange={e => setPlayer(e.target.value)} className="form-input" placeholder="Player Name" />
      <div className="flex bg-white/5 rounded p-0.5">
         <button onClick={() => setMode('jinx')} className={`flex-1 py-1 text-[9px] font-mono rounded ${mode === 'jinx' ? 'bg-[#BF5AF2] text-black font-bold' : 'text-wz-muted'}`}>JINX</button>
         <button onClick={() => setMode('defend')} className={`flex-1 py-1 text-[9px] font-mono rounded ${mode === 'defend' ? 'bg-[#00FF88] text-black font-bold' : 'text-wz-muted'}`}>SHIELD</button>
      </div>
      <WarzoneButton fullWidth className="py-2 min-h-0 text-[10px] font-bold" style={{ background: mode === 'jinx' ? '#BF5AF2' : '#00FF88', color: 'black' }} loading={isSubmitting} onClick={() => onSubmit({ targetPlayer: player, targetTeam, mode })}>
        EXECUTE {mode.toUpperCase()}
      </WarzoneButton>
    </div>
  );
}

function TraitorsDilemmaForm({ losing, winning, onSubmit, isSubmitting }: { losing: string, winning: string, onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [pts, setPts] = useState('5000');

  return (
    <div className="space-y-3">
      <div className="flex bg-red-900/20 border border-wz-red/20 rounded px-2 py-1 items-center justify-between">
         <span className="text-[8px] font-mono text-wz-red uppercase tracking-widest">{losing} vs {winning}</span>
         <span className="text-[8px] font-mono text-white/40">TARGET</span>
      </div>
      <input type="number" value={pts} onChange={e => setPts(e.target.value)} className="form-input" placeholder="Points at risk" />
      <WarzoneButton variant="danger" fullWidth className="py-2 min-h-0 text-[10px] font-bold shadow-[0_0_15px_rgba(255,45,85,0.4)]" loading={isSubmitting} onClick={() => onSubmit({ losingTeam: losing, winningTeam: winning, pointsReward: parseInt(pts, 10) })}>
        DISPATCH DILEMMA
      </WarzoneButton>
    </div>
  );
}

// Global styles for admin inputs
const style = document.createElement('style');
style.innerHTML = `
  .form-input {
    width: 100%;
    background: rgba(0,0,0,0.6);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 11px;
    color: white;
    font-family: monospace;
    transition: all 0.2s;
  }
  .form-input:focus {
    outline: none;
    border-color: rgba(255,255,255,0.3);
    background: rgba(0,0,0,0.8);
    box-shadow: 0 0 10px rgba(255,255,255,0.05);
  }
`;
document.head.appendChild(style);
