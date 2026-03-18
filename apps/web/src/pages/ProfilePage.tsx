import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import { RankBadge } from '../components/ui/RankBadge';
import { ShareCard } from '../components/ui/ShareCard';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.auth.me(),
    refetchInterval: 15000,
  });

  const { data: bunkersData } = useQuery({
    queryKey: ['myBunkers'],
    queryFn: () => api.bunkers.my(),
  });

  const bunkers = bunkersData?.bunkers || [];

  const handleShareCard = async () => {
    if (!shareCardRef.current || !user || !profile) return;
    setIsSharing(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2, useCORS: true, backgroundColor: '#0a0a0a',
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `warzone-rank-${user.username}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'My WARZONE Rank', text: `I'm a ${profile.rank} in the ${profile.army?.name} Army!` });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = file.name; a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (err) { console.error(err); }
    setIsSharing(false);
  };

  const statItems = [
    { label: 'WAR POINTS', value: profile ? Number(profile.totalWarPoints).toLocaleString() : '—', emoji: '⚡' },
    { label: 'RANK', value: profile?.rank || '—', emoji: '🎖️' },
    { label: 'ARMY', value: profile?.army?.name || '—', emoji: '🛡️' },
    { label: 'BUNKERS', value: bunkers.length.toString(), emoji: '🏰' },
  ];

  return (
    <div className="relative min-h-screen pb-20">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-black text-white tracking-tight">👤 PROFILE</h1>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="px-3 py-1.5 rounded-lg bg-white/5 text-wz-muted hover:text-wz-red hover:bg-wz-red/10 text-[10px] font-mono font-bold transition-colors border border-white/10"
          >
            LOGOUT
          </button>
        </div>

        {/* Identity Card */}
        <GlassCard className="p-6 mb-4 border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-wz-red to-[#FF6B2C] flex items-center justify-center text-2xl font-display font-black text-white shadow-[0_0_20px_rgba(255,45,85,0.3)]">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-white font-display font-bold text-xl">{user?.username || 'Warrior'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <RankBadge rank={(profile?.rank || 'Recruit') as any} size="sm" />
                <span className="text-xs font-mono text-wz-muted">•</span>
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded border"
                  style={{ color: profile?.army?.colorHex, borderColor: profile?.army?.colorHex + '40' }}
                >
                  {profile?.army?.name || '—'} ARMY
                </span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((stat) => (
              <div key={stat.label} className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                <p className="text-lg mb-0.5">{stat.emoji}</p>
                <p className="text-white font-display font-bold text-sm">{stat.value}</p>
                <p className="text-wz-muted text-[9px] font-mono tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <WarzoneButton
            variant="primary"
            className="flex-1 py-3 text-xs"
            onClick={handleShareCard}
            disabled={isSharing}
          >
            {isSharing ? 'Generating...' : '📸 Share Rank Card'}
          </WarzoneButton>
          <WarzoneButton
            variant="ghost"
            className="flex-1 py-3 text-xs"
            onClick={() => navigate('/leaderboard')}
          >
            🏆 Leaderboard
          </WarzoneButton>
        </div>

        {/* My Bunkers */}
        {bunkers.length > 0 && (
          <>
            <h3 className="text-white/60 font-mono text-xs font-bold tracking-wider mb-3">🏰 MY BUNKERS</h3>
            <div className="flex flex-col gap-2 mb-6">
              {bunkers.map((b: any) => (
                <GlassCard
                  key={b.id}
                  className="p-4 border-white/5 hover:border-wz-yellow/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/bunkers/${b.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">{b.name}</p>
                      <p className="text-wz-muted text-[10px] font-mono">
                        {b._count?.members || '—'} members • Code: {b.inviteCode}
                      </p>
                    </div>
                    <span className="text-white/30 text-xs">→</span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hidden Share Card */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <ShareCard
          ref={shareCardRef}
          username={user?.username || 'Warrior'}
          rank={profile?.rank || 'Recruit'}
          points={Number(profile?.totalWarPoints || 0)}
          armyColor={profile?.army?.colorHex || '#FF2D55'}
          armyName={profile?.army?.name || 'Unknown'}
        />
      </div>
    </div>
  );
}
