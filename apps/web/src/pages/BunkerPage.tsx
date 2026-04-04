import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import WarzoneButton from '../components/ui/WarzoneButton';
import AnimatedBackground from '../components/ui/AnimatedBackground';
import { RankBadge } from '../components/ui/RankBadge';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useWarRoomStore } from '../stores/warRoomStore';

export default function BunkerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const { connect, disconnect, joinBunker, leaveBunker, bunkerMessages, sendBunkerMessage, activePredictions, liveReactions, sendReaction } = useWarRoomStore();

  const [votedPredictions, setVotedPredictions] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Clock tick for prediction countdowns
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const { data: fetchRes, isLoading, error } = useQuery({
    queryKey: ['bunker', id],
    queryFn: () => api.bunkers.get(id!),
    enabled: !!id,
    retry: false,
    refetchInterval: 10000,
  });

  const bunker = fetchRes?.bunker;

  // Connect to WebSocket using the bunker's matchId, and then join the bunker private room
  useEffect(() => {
    if (bunker?.matchId && bunker?.id) {
      connect(bunker.matchId);
      joinBunker(bunker.id);
    }
    return () => {
      if (bunker?.id) leaveBunker(bunker.id);
      disconnect();
    };
  }, [bunker?.matchId, bunker?.id, connect, disconnect, joinBunker, leaveBunker]);

  const { data: room } = useQuery({
    queryKey: ['warRoom', bunker?.matchId],
    queryFn: () => api.warRooms.get(bunker!.matchId),
    enabled: !!bunker?.matchId,
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
      if (bunker?.matchId) {
        queryClient.invalidateQueries({ queryKey: ['warRoom', bunker.matchId] });
      }
    },
  });

  const joinBunkerMutation = useMutation({
    mutationFn: () => api.bunkers.join(inviteCode),
    onSuccess: () => {
      setInviteCode('');
      queryClient.invalidateQueries({ queryKey: ['bunker', id] });
    }
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || !id || !user || !bunker) return;

    sendBunkerMessage({
      bunkerId: id,
      text: chatInput,
      userId: user.id,
      username: user.username,
      rank: user.rank || 'Recruit',
      armyId: user.favoriteArmyId || 'unknown',
    });
    
    setChatInput('');
  };

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

  // === Loading & Error States ===
  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-wz-red/30 border-t-wz-red rounded-full animate-spin mb-4" />
            <p className="text-wz-red font-mono text-sm tracking-widest">CONNECTING TO BUNKER...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bunker) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <GlassCard className="text-center w-full max-w-md p-8 border-wz-red/20">
            <p className="text-5xl mb-4">🔒</p>
            <p className="text-wz-red text-lg font-display font-bold mb-2">ACCESS DENIED</p>
            <p className="text-wz-muted text-xs font-mono mb-6">This bunker does not exist or you are not a member.</p>
            
            <div className="mb-8 pt-4 border-t border-white/5">
              <p className="text-white/60 font-mono text-xs mb-3">HAVE AN INVITE CODE?</p>
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  placeholder="ENTER 6-CHAR CODE" 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center tracking-widest font-mono font-bold focus:border-wz-red/50 outline-none uppercase"
                />
                <WarzoneButton 
                  variant="danger" 
                  fullWidth 
                  onClick={() => joinBunkerMutation.mutate()} 
                  disabled={inviteCode.length < 5 || joinBunkerMutation.isPending}
                >
                  Join Bunker
                </WarzoneButton>
                {joinBunkerMutation.isError && <p className="text-wz-red text-[10px] mt-1 text-center font-mono">Invalid or expired code.</p>}
                {error && <p className="text-white/50 bg-black/50 p-2 rounded text-[10px] mt-2 font-mono break-all font-bold text-center">API Error: {error.message}</p>}
                {!bunker && !error && <p className="text-white/50 bg-black/50 p-2 rounded text-[10px] mt-2 font-mono break-all font-bold text-center">Error: Bunker data is explicitly undefined from API.</p>}
              </div>
            </div>

            <WarzoneButton variant="ghost" className="w-full opacity-60 hover:opacity-100" onClick={() => navigate('/')}>← Return to HQ</WarzoneButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <AnimatedBackground />

      {/* === FLOATING LIVE REACTIONS === */}
      <div className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
        <AnimatePresence>
          {liveReactions.map((reaction) => {
            const startX = `${30 + Math.random() * 40}vw`;
            const swayX = (Math.random() - 0.5) * 100;

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
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2">
          {/* Top Row: Back / Match / Members */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 text-wz-muted hover:text-white hover:bg-white/10 text-[10px] sm:text-xs font-bold font-mono transition-colors"
            >
              ← <span className="hidden sm:inline">LEAVE BUNKER</span>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-wz-yellow font-bold font-mono tracking-widest leading-none mb-1 shadow-[0_0_10px_rgba(255,214,10,0.5)]">
                  BUNKER: {bunker.name.toUpperCase()}
                </span>
                <span className="text-[10px] bg-wz-yellow/20 text-wz-yellow px-2 py-0.5 rounded border border-wz-yellow/30 font-mono flex items-center gap-1">
                  INVITE CODE: <strong className="select-all tracking-wider">{bunker.inviteCode}</strong>
                </span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/join/${bunker.inviteCode}`);
                    alert("Invite link copied to clipboard!");
                  }}
                  className="mt-1 flex items-center justify-center gap-1 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-colors text-[9px] font-mono rounded-md uppercase tracking-wider cursor-pointer"
                >
                  🔗 Copy Invite Link
                </button>
              </div>
            </div>

            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-1 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-wz-neon animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-white/80">{bunker.members.length} ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* === Main Content Area (Scrollable) === */}
      <main className="flex-1 relative z-10 overflow-y-auto pt-4 pb-48 scrollbar-hide">
        <div className="max-w-xl mx-auto px-4 flex flex-col gap-4 min-h-full justify-end">
          
          {/* Predictions Deck */}
          {allActivePredictions.length > 0 && (
            <div className="sticky top-0 z-30 flex flex-col gap-3 py-4 -mx-4 px-4 bg-gradient-to-b from-black/80 to-transparent">
              <AnimatePresence>
                {allActivePredictions.map((pred: any) => {
                  const timeLeft = Math.max(0, Math.floor((new Date(pred.expiresAt).getTime() - currentTime) / 1000));
                  const hasVoted = votedPredictions.has(pred.id);

                  return (
                    <motion.div
                      key={pred.id}
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="glass-card p-4 border-wz-yellow/30 shadow-[0_0_20px_rgba(255,214,10,0.1)] relative overflow-hidden"
                    >
                      {/* ... Prediction logic same as WarRoom ... */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">⚡</span>
                          <div>
                            <h3 className="text-wz-yellow font-display font-bold text-sm">CLUTCH PREDICTION</h3>
                            <p className="text-white text-xs font-mono">{pred.question}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-wz-glow text-lg font-black font-display leading-none">+{pred.pointsReward}</span>
                          <span className="text-[10px] text-wz-muted font-mono uppercase">WAR POINTS</span>
                        </div>
                      </div>

                      {hasVoted ? (
                        <div className="bg-wz-neon/10 border border-wz-neon/30 rounded-lg py-2 text-center text-wz-neon text-xs font-bold font-mono">
                          VOTE LOCKED IN ✓
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <WarzoneButton
                            variant="primary"
                            className="flex-1 py-2 text-xs"
                            onClick={() => voteMutation.mutate({ predId: pred.id, option: 'A' })}
                            disabled={timeLeft <= 0 || voteMutation.isPending}
                          >
                            {pred.optionA}
                          </WarzoneButton>
                          <WarzoneButton
                            variant="primary"
                            className="flex-1 py-2 text-xs"
                            onClick={() => voteMutation.mutate({ predId: pred.id, option: 'B' })}
                            disabled={timeLeft <= 0 || voteMutation.isPending}
                          >
                            {pred.optionB}
                          </WarzoneButton>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-wz-yellow"
                            initial={{ width: '100%' }}
                            animate={{ width: `${(timeLeft / 60) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                          />
                        </div>
                        <span className="text-[10px] text-wz-yellow font-mono whitespace-nowrap">
                          {timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} min left` : 'LOCKING...'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex flex-col gap-3">
            {bunkerMessages.length === 0 ? (
              <div className="text-center py-10 opacity-30 mt-auto">
                <p className="text-4xl mb-2">🤫</p>
                <p className="text-white font-mono text-xs">The bunker is silent. Drop a message.</p>
              </div>
            ) : (
              bunkerMessages.map((msg, i) => {
                const isMe = msg.userId === user?.id;
                const showHeader = i === 0 || bunkerMessages[i - 1].userId !== msg.userId;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {showHeader && !isMe && (
                      <div className="flex items-center gap-1.5 mb-1 pl-1">
                        <span className="text-white/80 font-bold text-xs">{msg.username}</span>
                        <RankBadge rank={msg.rank as any} size="sm" />
                        <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-white/50 border border-white/5 uppercase">
                          {msg.armyId}
                        </span>
                      </div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[75%] break-words shadow-sm backdrop-blur-sm ${
                      isMe 
                        ? 'bg-gradient-to-br from-wz-red to-[#FF6B2C] text-white rounded-tr-sm border border-white/10' 
                        : 'bg-white/10 border border-white/5 text-white/90 rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-snug">{msg.text}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
            {/* Auto-scroll anchor */}
            <div className="h-4" />
          </div>
        </div>
      </main>

      {/* === Input Area === */}
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
                  onClick={() => bunker?.matchId && sendReaction({ matchId: bunker.matchId, type })}
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm sm:text-lg hover:bg-white/10 hover:border-wz-red/50 transition-colors"
                >
                  {emoji}
                </motion.button>
              );
            })}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Send a message to the bunker..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-wz-red/50 focus:bg-white/10 transition-all placeholder:text-white/20 shadow-inner"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-wz-red hover:bg-[#FF453A] disabled:opacity-50 disabled:bg-white/10 disabled:cursor-not-allowed text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
