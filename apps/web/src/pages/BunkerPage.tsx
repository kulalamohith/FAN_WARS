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
import QuickProfileModal, { QuickProfileUser } from '../components/ui/QuickProfileModal';
import DuelInviteModal from '../components/features/duels/DuelInviteModal';
import BunkerPredictionCard from '../components/live/BunkerPredictionCard';
import BunkerJinxCard from '../components/live/BunkerJinxCard';
import { PredictionCreateModal, JinxCreateModal } from '../components/live/BunkerInteractiveModals';

export default function BunkerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const { 
    connect, disconnect, joinBunker, leaveBunker, bunkerMessages, sendBunkerMessage, 
    activePredictions, liveReactions, sendReaction, kickedUserId, isBunkerEnded, 
    activeAdminEvent, isConnected, bunkerInteractiveEvents,
    triggerBunkerPrediction, voteBunkerPrediction, triggerBunkerJinx, tapBunkerJinx,
    predictionUses, jinxUses
  } = useWarRoomStore();

  const [votedPredictions, setVotedPredictions] = useState<Set<string>>(new Set());
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showJinxModal, setShowJinxModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTriggerMenu, setShowTriggerMenu] = useState(false);
  const [profileUser, setProfileUser] = useState<QuickProfileUser | null>(null);

  const [messageReactions, setMessageReactions] = useState<Record<string, { toxic: number, fire: number, clown: number }>>({});
  const [challengerMsg, setChallengerMsg] = useState<any | null>(null);

  const handleMsgReact = (msgId: string, type: 'toxic' | 'fire' | 'clown') => {
    setMessageReactions(prev => ({
      ...prev,
      [msgId]: {
        toxic: (prev[msgId]?.toxic || 0) + (type === 'toxic' ? 1 : 0),
        fire: (prev[msgId]?.fire || 0) + (type === 'fire' ? 1 : 0),
        clown: (prev[msgId]?.clown || 0) + (type === 'clown' ? 1 : 0),
      }
    }));
  };

  // Handle Socket Kicks / Ends
  useEffect(() => {
    if (kickedUserId === user?.id) {
      alert("You have been removed from this room by the host.");
      navigate('/');
    }
  }, [kickedUserId, user?.id, navigate]);

  useEffect(() => {
    if (isBunkerEnded) {
      alert("This Private War Room has been ended by the host.");
      navigate('/');
    }
  }, [isBunkerEnded, navigate]);

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
    if (bunker?.matchId && bunker?.id && user?.id) {
      connect(bunker.matchId, user.id);
      joinBunker(bunker.id, user.id);
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

  const kickMutation = useMutation({
    mutationFn: (userId: string) => api.bunkers.kickMember(id!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bunker', id] });
    }
  });

  const endRoomMutation = useMutation({
    mutationFn: () => api.bunkers.delete(id!),
    // On success handled by socket event mostly, but as fallback navigate
    onSuccess: () => navigate('/')
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

  const handleTriggerPrediction = () => {
    setShowPredictionModal(true);
    setShowTriggerMenu(false);
  };

  const handleTriggerJinx = () => {
    setShowJinxModal(true);
    setShowTriggerMenu(false);
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
              <p className="text-white/60 font-mono text-xs mb-3">HAVE A ROOM CODE?</p>
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
                  Join War Room
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

      <AnimatePresence>
        {challengerMsg && (
          <DuelInviteModal
            isOpen={true}
            defaultOpponent={{
              id: challengerMsg.userId,
              username: challengerMsg.username,
              army: challengerMsg.armyId || 'Recruit',
              armyColor: '#FFFFFF',
              rank: challengerMsg.rank || 'Recruit',
              wins: 0,
              losses: 0,
            }}
            onClose={() => setChallengerMsg(null)}
          />
        )}
      </AnimatePresence>

      {/* === HUD Header === */}
      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-wz-border/20">
        <div className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2">
          {/* Top Row: Back / Match / Members */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 text-wz-muted hover:text-white hover:bg-white/10 text-[10px] sm:text-xs font-bold font-mono transition-colors"
               >
                ← <span className="hidden sm:inline">LEAVE</span>
              </button>
              {bunker.creatorId === user?.id && (
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to end this room for everyone?")) {
                      endRoomMutation.mutate();
                    }
                  }}
                  disabled={endRoomMutation.isPending}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-wz-red/20 text-wz-red hover:bg-wz-red hover:text-white border border-wz-red/30 text-[10px] sm:text-xs font-bold font-mono transition-colors"
                >
                  END ROOM
                </button>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-wz-yellow font-bold font-mono tracking-widest leading-none mb-1 shadow-[0_0_10px_rgba(255,214,10,0.5)]">
                PRIVATE: {bunker.name.toUpperCase()}
              </span>
              <span className="text-[10px] bg-wz-yellow/20 text-wz-yellow px-2 py-0.5 rounded border border-wz-yellow/30 font-mono flex items-center gap-1">
                CODE: <strong className="select-all tracking-wider">{bunker.inviteCode}</strong>
              </span>
            </div>

            <button onClick={() => setShowTriggerMenu(true)} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-wz-red/20 border border-wz-red/30 hover:bg-wz-red hover:text-white flex items-center gap-1 sm:gap-2 cursor-pointer transition-colors relative group">
              <span className="text-xl">⚡</span>
              <div className="flex flex-col items-start">
                <span className="text-[10px] sm:text-xs font-mono font-bold text-white/80">TRIGGER HUB</span>
                <span className="text-[7px] font-mono text-wz-neon uppercase leading-none opacity-60 group-hover:opacity-100">
                  {8 - (predictionUses + jinxUses)} ACTIONS LEFT
                </span>
              </div>
            </button>

            <button onClick={() => setShowMembersModal(true)} className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-1 sm:gap-2 cursor-pointer transition-colors">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-wz-neon animate-pulse" />
              <span className="text-[10px] sm:text-xs font-mono font-bold text-white/80">{bunker.members.length} ONLINE</span>
            </button>
          </div>

          <div className="max-w-xl mx-auto w-full pb-2">
            <div className="flex items-center justify-center gap-4 py-2">
              <span className="text-xl font-display font-black text-white">{bunker.match?.homeArmy?.name || 'HOME'}</span>
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em]">VS</span>
              <span className="text-xl font-display font-black text-wz-yellow">{bunker.match?.awayArmy?.name || 'AWAY'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* === Main Content Area (Scrollable) === */}
      <main className="flex-1 relative z-10 overflow-y-auto pt-4 pb-48 scrollbar-hide">
        <div className="max-w-xl mx-auto px-4 flex flex-col gap-4 min-h-full justify-end">
          
          {/* Admin Event Banner */}
          {activeAdminEvent && activeAdminEvent.type === 'JINX' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full p-4 mb-4 rounded-xl bg-purple-900/50 border border-purple-500/50 flex flex-col items-center">
               <span className="text-2xl mb-1 drop-shadow-[0_0_10px_purple]">🔮 JINX ACTIVE</span>
               <p className="text-white text-sm font-bold text-center">{activeAdminEvent.data.message || 'Someone activated a Jinx!'}</p>
            </motion.div>
          )}
          {activeAdminEvent && activeAdminEvent.type === 'DEBATE' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full p-4 mb-4 rounded-xl bg-[#0057E2]/30 border border-[#0057E2]/50 flex flex-col items-center">
               <span className="text-2xl mb-1 drop-shadow-[0_0_10px_blue]">⚔️ HOT DEBATE</span>
               <p className="text-white text-sm font-bold text-center">{activeAdminEvent.data.question || 'A debate has started.'}</p>
            </motion.div>
          )}

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

          {/* ⚡ INTERACTIVE ROOM EVENTS ⚡ */}
          <div className="flex flex-col gap-4 mb-2">
            <AnimatePresence>
              {bunkerInteractiveEvents.map((event: any) => (
                <div key={event.id}>
                  {event.type === 'PREDICTION' && (
                    <BunkerPredictionCard
                      {...event}
                      onVote={(choiceIndex) => voteBunkerPrediction({ predictionId: event.id, choice: choiceIndex, userId: user?.id, bunkerId: id })}
                    />
                  )}
                  {event.type === 'JINX' && (
                    <BunkerJinxCard
                      {...event}
                      onTap={(side) => tapBunkerJinx({ bunkerId: id, userId: user?.id, side })}
                    />
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col gap-3">
            {bunkerMessages.length === 0 ? (
              <div className="text-center py-10 opacity-30 mt-auto">
                <p className="text-4xl mb-2">🤫</p>
                <p className="text-white font-mono text-xs">The room is silent. Drop a message.</p>
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
                      <div className="flex items-center gap-1.5 mb-1 pl-1 w-full">
                        <button
                          onClick={() => navigate(`/profile/${msg.username}`)}
                          className="text-white/80 font-bold text-xs hover:underline cursor-pointer"
                        >
                          {msg.username}
                        </button>
                        <RankBadge rank={msg.rank as any} size="sm" />
                        <span className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-mono text-white/50 border border-white/5 uppercase">
                          {msg.armyId}
                        </span>
                        
                        <button 
                          onClick={() => setChallengerMsg(msg)}
                          className="ml-auto px-1.5 py-0.5 border border-[#FF6B2C]/50 rounded bg-[#FF6B2C]/10 text-[#FF6B2C] hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-[#FF6B2C]/50 transition-colors"
                          title={`Challenge ${msg.username} to Sniper Duel`}
                        >
                          [1v1 SD]
                        </button>
                      </div>
                    )}
                    
                    <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] sm:max-w-[75%] break-words shadow-sm backdrop-blur-sm ${
                      isMe 
                        ? 'bg-gradient-to-br from-wz-red to-[#FF6B2C] text-white rounded-tr-sm border border-white/10' 
                        : 'bg-white/10 border border-white/5 text-white/90 rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-snug">{msg.text}</p>
                    </div>

                    {!isMe && (
                      <div className="flex items-center gap-1.5 mt-1 pl-1">
                        <button onClick={() => handleMsgReact(msg.id, 'toxic')} className="flex items-center gap-1 text-[9px] font-mono bg-black/40 hover:bg-white/10 rounded px-1.5 py-0.5 text-white/50 border border-white/5 transition-colors">
                          ☠️ <span className={messageReactions[msg.id]?.toxic ? 'text-white' : ''}>{messageReactions[msg.id]?.toxic || 0}</span>
                        </button>
                        <button onClick={() => handleMsgReact(msg.id, 'fire')} className="flex items-center gap-1 text-[9px] font-mono bg-black/40 hover:bg-white/10 rounded px-1.5 py-0.5 text-white/50 border border-white/5 transition-colors">
                          🔥 <span className={messageReactions[msg.id]?.fire ? 'text-white' : ''}>{messageReactions[msg.id]?.fire || 0}</span>
                        </button>
                        <button onClick={() => handleMsgReact(msg.id, 'clown')} className="flex items-center gap-1 text-[9px] font-mono bg-black/40 hover:bg-white/10 rounded px-1.5 py-0.5 text-white/50 border border-white/5 transition-colors">
                          🤡 <span className={messageReactions[msg.id]?.clown ? 'text-white' : ''}>{messageReactions[msg.id]?.clown || 0}</span>
                        </button>
                      </div>
                    )}
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
              placeholder="Send a message..."
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

      {/* === Trigger Menu Modal === */}
      <AnimatePresence>
        {showTriggerMenu && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-5" onClick={() => setShowTriggerMenu(false)}>
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md bg-gradient-to-b from-[#1A0B2E] to-black rounded-3xl border border-wz-red/30 p-8 shadow-[0_0_50px_rgba(255,69,58,0.2)]">
              <div className="text-center mb-8">
                <span className="text-wz-red text-[10px] font-mono font-black tracking-[0.4em] uppercase mb-2 block">ELITE COMMAND HUB</span>
                <h2 className="text-white text-2xl font-display font-black">ACTIVATE ROOM EVENT</h2>
                <div className="flex justify-center gap-4 mt-2">
                  <span className="text-[10px] font-mono text-white/40">WAR POINTS: <span className="text-wz-yellow">{user?.totalWarPoints || 0} WP</span></span>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <span className="text-[10px] font-mono text-white/40">FREE TRIPS: <span className="text-wz-neon">RESET DAILY</span></span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={handleTriggerPrediction}
                  className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:border-wz-yellow/50"
                >
                  <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-xl bg-wz-yellow/10 flex items-center justify-center text-2xl border border-wz-yellow/20 group-hover:bg-wz-yellow/20">🔮</div>
                    <div className="text-left">
                      <h4 className="text-white font-bold text-sm tracking-wide">LIVE PREDICTION</h4>
                      <p className="text-white/40 text-[10px] font-mono">Create a YES/NO poll for everyone.</p>
                      <span className="inline-block mt-1 text-[8px] px-2 py-0.5 bg-wz-yellow/20 text-wz-yellow rounded border border-wz-yellow/30 font-bold tracking-tighter uppercase">5 WP OR FREE 4/DAY</span>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={handleTriggerJinx}
                  className="group relative overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:border-purple-500/50"
                >
                  <div className="flex items-center gap-4 relative z-10 transition-transform group-hover:scale-[1.02]">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl border border-purple-500/20 group-hover:bg-purple-500/20">🧿</div>
                    <div className="text-left">
                      <h4 className="text-white font-bold text-sm tracking-wide">JINX BATTLE</h4>
                      <p className="text-white/40 text-[10px] font-mono">5s high-intensity tapping duel.</p>
                      <span className="inline-block mt-1 text-[8px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 font-bold tracking-tighter uppercase">5 WP OR FREE 4/DAY</span>
                    </div>
                  </div>
                </button>
              </div>

              <WarzoneButton variant="ghost" className="w-full mt-8 opacity-40 hover:opacity-100" onClick={() => setShowTriggerMenu(false)}>CLOSE HUB</WarzoneButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === Members Modal === */}
      <AnimatePresence>
        {showMembersModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-5" onClick={() => setShowMembersModal(false)}>
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-sm rounded-2xl border border-white/10 p-6 shadow-2xl" style={{ background: 'rgba(15,15,15,0.97)' }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-display font-bold text-white">Room Members ({bunker.members.length}/12)</h2>
                <button onClick={() => setShowMembersModal(false)} className="text-white/40 hover:text-white transition-colors text-xl">&times;</button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto space-y-3 pb-2">
                {bunker.members.map((m: any) => {
                  const isHost = bunker.creatorId === m.userId;
                  const isMe = user?.id === m.userId;
                  const iAmHost = bunker.creatorId === user?.id;

                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 text-white font-bold shrink-0">
                          {m.user.username[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white flex items-center gap-1.5">
                            {m.user.username} {isMe && <span className="text-[9px] bg-wz-yellow/20 text-wz-yellow px-1.5 py-0.5 rounded ml-1 tracking-wider uppercase font-mono">You</span>}
                          </span>
                          <span className="text-[10px] text-white/40 font-mono flex items-center gap-2">
                            {m.user.army?.name || 'Recruit'} Army 
                            {isHost && <span className="text-wz-red">👑 Host</span>}
                          </span>
                        </div>
                      </div>
                      
                      {iAmHost && !isMe && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Kick ${m.user.username} from the room?`)) {
                              kickMutation.mutate(m.userId);
                            }
                          }}
                          disabled={kickMutation.isPending}
                          className="px-3 py-1.5 text-[10px] font-bold font-mono text-white/50 bg-white/5 hover:bg-wz-red hover:text-white border border-white/10 hover:border-wz-red transition-colors rounded-lg"
                        >
                          KICK
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {profileUser && (
        <QuickProfileModal user={profileUser} onClose={() => setProfileUser(null)} />
      )}

      {/* --- Interactive Modals --- */}
      <PredictionCreateModal 
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        usageCount={predictionUses}
        totalLimit={4}
        walletPoints={Number(user?.totalWarPoints || 0)}
        onSubmit={(data) => triggerBunkerPrediction({ ...data, bunkerId: id, userId: user?.id, username: user?.username })}
      />

      <JinxCreateModal 
        isOpen={showJinxModal}
        onClose={() => setShowJinxModal(false)}
        usageCount={jinxUses}
        totalLimit={4}
        walletPoints={Number(user?.totalWarPoints || 0)}
        onSubmit={(prompt) => triggerBunkerJinx({ prompt, bunkerId: id, userId: user?.id, username: user?.username })}
      />
    </div>
  );
}
