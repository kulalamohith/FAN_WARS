import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import ToxicityBar from '../components/ui/ToxicityBar';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RankBadge } from '../components/ui/RankBadge';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useWarRoomStore } from '../stores/warRoomStore';

export default function WarRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const { connect, disconnect, sendMessage, messages, isConnected, toxicityHome, toxicityAway, activePredictions, liveReactions, sendReaction } = useWarRoomStore();

  const [votedPredictions, setVotedPredictions] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Simulate haptics when new messages arrive (for mobile web / capacitor)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.userId !== user?.id && 'vibrate' in navigator) {
        // Light tap haptic
        try { navigator.vibrate(10); } catch (e) {}
      }
    }
  }, [messages.length, user]);

  // Clock tick for prediction countdowns
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Connect to WebSocket when entering room
  useEffect(() => {
    if (id) {
      connect(id);
    }
    return () => disconnect();
  }, [id, connect, disconnect]);

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['warRoom', id],
    queryFn: () => api.warRooms.get(id!),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // Merge live WS predictions with REST predictions, deduplicated by ID, and filter expired ones
  const allActivePredictions = useMemo(() => {
    const map = new Map<string, any>();
    room?.activePredictions?.forEach((p: any) => map.set(p.id, p));
    activePredictions.forEach((p: any) => map.set(p.id, p));
    
    return Array.from(map.values()).filter(p => new Date(p.expiresAt).getTime() > currentTime);
  }, [room?.activePredictions, activePredictions, currentTime]);

  const voteMutation = useMutation({
    mutationFn: ({ predId, option }: { predId: string; option: 'A' | 'B' }) =>
      api.predictions.vote(predId, option),
    onSuccess: (_data, variables) => {
      setVotedPredictions((prev) => new Set(prev).add(variables.predId));
      queryClient.invalidateQueries({ queryKey: ['warRoom', id] });
    },
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || !id || !user || !room) return;
    
    // We determine if the user is home army by matching against the room's home team
    const isHomeArmy = user.favoriteArmyId === room.toxicity.homeArmyId;

    sendMessage({
      matchId: id,
      text: chatInput,
      userId: user.id,
      username: user.username,
      rank: user.rank || 'Recruit',
      armyId: user.favoriteArmyId || 'unknown',
      isHomeArmy
    });
    
    setChatInput('');
  };

  // === Loading State ===
  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-12 h-12 border-2 border-wz-red/30 border-t-wz-red rounded-full mx-auto mb-4"
            />
            <p className="text-wz-muted font-mono text-sm tracking-widest">Joining live discussion...</p>
          </div>
        </div>
      </div>
    );
  }

  // === Error State ===
  if (error || !room) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <GlassCard className="text-center max-w-md p-8 border-wz-red/20">
            <p className="text-5xl mb-4">💀</p>
            <p className="text-wz-red text-lg font-display font-bold mb-2">ROOM UNAVAILABLE</p>
            <p className="text-wz-muted text-xs font-mono mb-6">This match room may have ended or is unavailable.</p>
            <WarzoneButton variant="ghost" onClick={() => navigate('/')}>← Back to Home</WarzoneButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  const getStormEmoji = (type: string | null) => {
    if (type === 'fire') return '🔥';
    if (type === 'laugh') return '😂';
    if (type === 'rage') return '😤';
    if (type === 'heart') return '❤️';
    if (type === 'clap') return '👏';
    if (type === 'skull') return '💀';
    if (type === 'crown') return '👑';
    if (type === 'mindblown') return '🤯';
    return '🔥';
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <AnimatedBackground />

      {/* === FLOATING LIVE REACTIONS === */}
      <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
        <AnimatePresence>
          {liveReactions.map((reaction) => {
            // Randomize starting X position a bit (e.g. 30% to 70% of screen width)
            const startX = `${30 + Math.random() * 40}vw`;
            const swayX = (Math.random() - 0.5) * 100; // Sway left/right randomly

            return (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, scale: 0.5, y: '100vh', x: startX }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.5, 1.2, 1],
                  y: '-20vh',
                  x: `calc(${startX} + ${swayX}px)`,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5 + Math.random(), ease: 'easeOut' }}
                className="absolute bottom-0 text-4xl drop-shadow-lg"
              >
                {getStormEmoji(reaction.type)}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* === HUD Header === */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-wz-border/20">
        <div className="max-w-xl mx-auto px-5 py-3">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate('/')}
              className="text-wz-muted hover:text-wz-white transition-colors text-sm font-mono"
            >
              ← HQ
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88] shadow-[0_0_8px_#00FF88]' : 'bg-wz-red/50'} animate-pulse`} />
              <span className={`text-[9px] uppercase tracking-[0.3em] font-bold font-mono ${isConnected ? 'text-[#00FF88]' : 'text-wz-muted'}`}>
                {isConnected ? 'LIVE WS' : 'CONNECTING...'}
              </span>
            </div>
          </div>

          {/* Toxicity Bar */}
          <ToxicityBar
            homeScore={toxicityHome}
            awayScore={toxicityAway}
          />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-4 pb-24 flex flex-col">

        {/* === Prediction Overlays === */}
        <AnimatePresence>
          {allActivePredictions.map((pred: any) => {
            const msLeft = Math.max(0, new Date(pred.expiresAt).getTime() - currentTime);
            const secondsLeft = Math.ceil(msLeft / 1000);
            
            return !votedPredictions.has(pred.id) && (
              <motion.div
                key={pred.id}
                initial={{ opacity: 0, y: -80, scale: 0.8, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -30 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="mb-5"
              >
                <div className="glass-card p-6 border border-wz-yellow/30 shadow-[0_0_40px_rgba(255,214,10,0.1)]">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <motion.span
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-xl"
                    >⚡</motion.span>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-wz-yellow font-mono">
                      Clutch Prediction
                    </span>
                    <span className="ml-auto text-xs font-mono text-wz-neon font-bold">
                      +{pred.pointsReward} WP
                    </span>
                  </div>

                  {/* Question and Timer */}
                  <div className="mb-5">
                    <p className="text-wz-white font-display font-bold text-xl leading-tight mb-2">
                      {pred.question}
                    </p>
                    <div className="flex items-center gap-2 text-wz-red font-mono font-bold text-xs animate-pulse">
                      <span>⏱️</span>
                      <span>{secondsLeft}s left to lock in!</span>
                    </div>
                  </div>

                  {/* A/B Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <WarzoneButton
                      variant="primary"
                      loading={voteMutation.isPending}
                      onClick={() => voteMutation.mutate({ predId: pred.id, option: 'A' })}
                      className="text-base py-4"
                    >
                      {pred.optionA}
                    </WarzoneButton>
                    <WarzoneButton
                      variant="danger"
                      loading={voteMutation.isPending}
                      onClick={() => voteMutation.mutate({ predId: pred.id, option: 'B' })}
                      className="text-base py-4"
                    >
                      {pred.optionB}
                    </WarzoneButton>
                  </div>

                  {voteMutation.isError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-wz-red text-xs mt-3 text-center font-mono"
                    >
                      ⚠️ {voteMutation.error?.message || 'Vote failed'}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* === Live Chat Feed === */}
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-[9px] text-wz-muted uppercase tracking-[0.3em] font-bold font-mono">
            💬 Live Chat
          </h3>
          <div className="flex-1 h-px bg-gradient-to-r from-wz-border/30 to-transparent" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 min-h-[200px] flex flex-col-reverse">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-wz-muted text-xs font-mono text-center mt-10"
              >
                No messages yet. Start the war.
              </motion.p>
            ) : (
              [...messages].reverse().map((msg) => {
                const isMe = user?.id === msg.userId;
                const isAlly = user?.favoriteArmyId === msg.armyId;
                const accentColor = isMe ? '#00FF88' : isAlly ? '#64D2FF' : '#FF2D55';
                
                return (
                  <motion.div
                    key={msg.id}
                    layout /* Magic Framer Motion layout shift */
                    initial={{ opacity: 0, scale: 0.9, x: isAlly ? -15 : 15 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`text-sm py-2 px-3 rounded-lg border-l-4 flex flex-col items-start gap-1 my-1 ${
                      isAlly ? 'bg-white/5 border-l-wz-blue/50' : 'bg-wz-red/10 border-l-[#FF2D55]/50'
                    }`}
                    style={{ borderLeftColor: accentColor }}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold font-mono text-[11px]" style={{ color: accentColor }}>
                        {msg.username}
                      </span>
                      <RankBadge rank={msg.rank || 'Recruit'} size="sm" />
                    </div>
                    <span className="text-wz-text/90 inline-block">{msg.text}</span>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* === Chat Input & Reactions (Fixed Bottom) === */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black/80 backdrop-blur-2xl border-t border-wz-border/20 p-4">
          <div className="max-w-xl mx-auto">
            {/* Reaction Bar */}
            <div className="flex justify-start gap-1 sm:gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
              {(['fire', 'laugh', 'rage', 'heart', 'clap', 'skull', 'crown', 'mindblown'] as const).map((type) => {
                const emoji = getStormEmoji(type);
                return (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => sendReaction({ matchId: id!, type })}
                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm sm:text-lg hover:bg-white/10 hover:border-wz-red/50 transition-colors"
                  >
                    {emoji}
                  </motion.button>
                );
              })}
            </div>

            {/* Input Row */}
            <div className="flex gap-3">
              <input
                id="chat-input"
                type="text"
                placeholder="Declare war..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                className="flex-1 bg-wz-surface border border-wz-border/40 rounded-xl px-4 py-3 text-sm text-wz-white font-mono focus:outline-none focus:border-wz-neon/50 focus:shadow-[0_0_15px_rgba(0,255,136,0.1)] transition-all duration-300"
              />
              <WarzoneButton onClick={handleSendChat} className="px-5">
                ⚔️
              </WarzoneButton>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
