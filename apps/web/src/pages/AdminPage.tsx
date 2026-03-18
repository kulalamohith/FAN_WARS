import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import { api } from '../lib/api';

export default function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [secretKey, setSecretKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { data: matchesData } = useQuery({
    queryKey: ['matches', 'live'],
    queryFn: () => api.matches.live(1, 50),
    enabled: isAuthenticated,
    refetchInterval: 5000,
  });

  const triggerMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: any }) => 
      api.predictions.trigger(matchId, payload),
    onSuccess: () => {
      alert('Prediction Fired!');
      queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
    },
    onError: (err: any) => alert(err.message)
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, option }: { id: string; option: 'A'|'B' }) => 
      api.predictions.resolve(id, option),
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ['matches', 'live'] });
    },
    onError: (err: any) => alert(err.message)
  });

  // Simple hardcoded auth for MVP
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AnimatedBackground />
        <GlassCard className="max-w-sm w-full relative z-10 border-wz-red/50">
          <h1 className="text-wz-red font-display font-black text-2xl text-center mb-4">RESTRICTED AREA</h1>
          <p className="text-wz-muted text-xs text-center mb-6 font-mono">Game Master Clearance Only.</p>
          <input 
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter Override Code"
            className="w-full bg-black/50 border border-wz-border/30 rounded px-4 py-3 text-white font-mono mb-4 focus:outline-none focus:border-wz-red/50"
          />
          <WarzoneButton 
            variant="danger" 
            fullWidth 
            onClick={() => {
              if (secretKey === 'GAMEMASTER99') setIsAuthenticated(true);
              else alert('Access Denied');
            }}
          >
            AUTHORIZE
          </WarzoneButton>
          <button onClick={() => navigate('/')} className="w-full mt-4 text-wz-muted text-xs font-mono hover:text-white">RETURN TO BASE</button>
        </GlassCard>
      </div>
    );
  }

  const liveMatches = matchesData?.matches || [];

  return (
    <div className="min-h-screen pb-20 relative">
      <AnimatedBackground />

      <header className="sticky top-0 z-50 bg-wz-red/10 backdrop-blur-2xl border-b border-wz-red/30">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-wz-muted hover:text-white text-sm font-mono flex items-center gap-2">
            ← <span className="uppercase tracking-widest text-xs">Exit Admin</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-wz-red animate-pulse" />
            <h1 className="text-wz-red font-display font-black text-lg tracking-widest">GAME MASTER HUD</h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto w-full px-5 pt-8">
        
        {liveMatches.length === 0 ? (
          <GlassCard className="text-center py-12 border-wz-red/20 opacity-50">
            <p className="font-mono text-wz-muted text-sm uppercase tracking-widest">No Active War Rooms Detected</p>
          </GlassCard>
        ) : (
          <div className="space-y-8">
            {liveMatches.map((match) => (
              <div key={match.id} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 border border-wz-border/20 rounded-xl p-6 relative overflow-hidden">
                {/* Background wash based on teams */}
                <div className="absolute top-0 right-0 w-64 h-64 opacity-5 blur-3xl pointer-events-none" style={{ backgroundColor: match.homeArmy.colorHex }} />
                
                {/* LEFT: Match Info & Trigger Form */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-wz-red/20 text-wz-red border border-wz-red/30">LIVE</span>
                      <p className="font-mono text-xs text-wz-muted">ID: {match.id}</p>
                    </div>
                    <h2 className="text-2xl font-display font-black text-white">
                      <span style={{color: match.homeArmy.colorHex}}>{match.homeArmy.name}</span> vs <span style={{color: match.awayArmy.colorHex}}>{match.awayArmy.name}</span>
                    </h2>
                  </div>

                  <GlassCard className="border-wz-neon/20 p-5 bg-[#00FF88]/5">
                    <h3 className="text-[#00FF88] font-bold font-mono text-sm mb-4">▶ TRIGGER CLUTCH PREDICTION</h3>
                    <PredictionForm 
                      onSubmit={(payload) => triggerMutation.mutate({ matchId: match.id, payload })}
                      isSubmitting={triggerMutation.isPending}
                    />
                  </GlassCard>
                </div>

                {/* RIGHT: Active Predictions & Resolution */}
                <div>
                  <h3 className="text-wz-yellow font-bold font-mono text-sm mb-4 uppercase tracking-widest">⚠ Unresolved Predictions</h3>
                  
                  {(!match.activePredictions || match.activePredictions.length === 0) ? (
                    <div className="h-32 border border-dashed border-wz-border/20 rounded flex items-center justify-center">
                      <p className="text-wz-muted text-xs font-mono">No active predictions burning.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {match.activePredictions.map((pred: any) => (
                        <GlassCard key={pred.id} className="border-wz-yellow/40 p-4 bg-wz-yellow/5">
                          <p className="text-wz-white font-medium mb-3">"{pred.questionText}"</p>
                          <div className="flex gap-2 mb-3">
                            <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono flex-1 text-center">A: {pred.optionA}</span>
                            <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono flex-1 text-center">B: {pred.optionB}</span>
                          </div>
                          <div className="flex gap-2">
                            <WarzoneButton 
                              variant="ghost" 
                              className="flex-1 py-1.5 min-h-0 text-xs border border-wz-yellow/50 text-wz-yellow hover:bg-wz-yellow hover:text-black"
                              onClick={() => {
                                if(window.confirm('Resolve A as correct?')) resolveMutation.mutate({ id: pred.id, option: 'A' })
                              }}
                            >
                              RESOLVE A
                            </WarzoneButton>
                            <WarzoneButton 
                              variant="ghost" 
                              className="flex-1 py-1.5 min-h-0 text-xs border border-wz-yellow/50 text-wz-yellow hover:bg-wz-yellow hover:text-black"
                              onClick={() => {
                                if(window.confirm('Resolve B as correct?')) resolveMutation.mutate({ id: pred.id, option: 'B' })
                              }}
                            >
                              RESOLVE B
                            </WarzoneButton>
                          </div>
                        </GlassCard>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}

function PredictionForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [question, setQuestion] = useState('Will Virat hit a six this over?');
  const [optionA, setOptionA] = useState('YES');
  const [optionB, setOptionB] = useState('NO');
  const [pts, setPts] = useState('500');

  return (
    <div className="space-y-3">
      <input 
        type="text" value={question} onChange={e => setQuestion(e.target.value)}
        className="w-full bg-black/60 border border-wz-border/30 rounded px-3 py-2 text-sm text-white focus:border-[#00FF88]"
        placeholder="Question..."
      />
      <div className="flex gap-2">
        <input 
          type="text" value={optionA} onChange={e => setOptionA(e.target.value)}
          className="flex-1 bg-black/60 border border-wz-border/30 rounded px-3 py-2 text-sm text-white focus:border-[#00FF88]"
          placeholder="Option A"
        />
        <input 
          type="text" value={optionB} onChange={e => setOptionB(e.target.value)}
          className="flex-1 bg-black/60 border border-wz-border/30 rounded px-3 py-2 text-sm text-white focus:border-[#00FF88]"
          placeholder="Option B"
        />
      </div>
      <div>
        <label className="text-[10px] text-wz-muted font-mono block mb-1">War Points Reward</label>
        <input 
          type="number" value={pts} onChange={e => setPts(e.target.value)}
          className="w-full bg-black/60 border border-wz-border/30 rounded px-3 py-2 text-sm text-white focus:border-[#00FF88]"
        />
      </div>
      <WarzoneButton 
        variant="primary" 
        fullWidth 
        className="mt-2 py-2 min-h-0 text-sm shadow-[0_0_15px_rgba(0,255,136,0.3)]"
        loading={isSubmitting}
        onClick={() => {
          onSubmit({
            questionText: question,
            optionA,
            optionB,
            pointsReward: parseInt(pts, 10),
            durationMs: 25000 // Fixed 25s for UI purposes
          })
        }}
      >
        FIRE PREDICTION
      </WarzoneButton>
    </div>
  );
}
