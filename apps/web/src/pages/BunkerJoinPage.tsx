import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';

export default function BunkerJoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const joinMutation = useMutation({
    mutationFn: (inviteCode: string) => api.bunkers.join(inviteCode),
    onSuccess: (res) => {
      // Small artificial delay to make the joining feel like it's connecting
      setTimeout(() => {
        navigate(`/bunkers/${res.bunkerId}`);
      }, 1000);
    }
  });

  useEffect(() => {
    if (code && !joinMutation.isPending && !joinMutation.isSuccess && !joinMutation.isError) {
      joinMutation.mutate(code);
    }
  }, [code, joinMutation]);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-sm text-center">
        {joinMutation.isPending || (!joinMutation.isError && !joinMutation.isSuccess) ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-wz-yellow/30 border-t-wz-yellow rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-display font-bold text-wz-yellow mb-2">JOINING BUNKER...</h2>
            <p className="text-white/50 text-xs font-mono tracking-widest uppercase">Code: {code}</p>
          </div>
        ) : joinMutation.isError ? (
          <GlassCard className="p-8 border-wz-red/30 relative">
            <div className="absolute inset-0 bg-wz-red/5 rounded-2xl pointer-events-none" />
            <p className="text-5xl mb-4">⚠️</p>
            <h2 className="text-xl font-display font-bold text-wz-red mb-2 uppercase">Invalid Link</h2>
            <p className="text-wz-muted text-xs font-mono mb-6">This invite link is invalid or has expired.</p>
            <WarzoneButton variant="ghost" fullWidth onClick={() => navigate('/')}>
              RETURN TO BASE
            </WarzoneButton>
          </GlassCard>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full flex items-center justify-center text-3xl mb-4 shadow-[0_0_20px_rgba(7ade80,0.3)]">
              ✓
            </div>
            <h2 className="text-xl font-display font-bold text-green-400 mb-2">ACCESS GRANTED</h2>
            <p className="text-green-400/50 text-xs font-mono">Redirecting to bunker...</p>
          </div>
        )}
      </div>
    </div>
  );
}
