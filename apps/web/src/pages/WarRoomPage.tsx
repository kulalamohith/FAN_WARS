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
import { IPL_2026_SCHEDULE } from '../data/ipl2026';


// === NEW AAA INTEGRATIONS ===
import TugOfWarMeter from '../components/live/TugOfWarMeter';
import ChaosPrediction from '../components/live/ChaosPrediction';
import Soundboard from '../components/live/Soundboard';
import JinxMinigame from '../components/live/JinxMinigame';
import SniperDuel from '../components/live/SniperDuel';
import TraitorsDilemma from '../components/live/TraitorsDilemma';
import DuelInviteModal from '../components/features/duels/DuelInviteModal';

export default function WarRoomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const { connect, disconnect, sendMessage, messages, isConnected, toxicityHome, toxicityAway, activePredictions, liveReactions, sendReaction, activeAdminEvent, clearAdminEvent } = useWarRoomStore();

  const [votedPredictions, setVotedPredictions] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showSniperDuel, setShowSniperDuel] = useState(false);
  
  const [votedChaos, setVotedChaos] = useState(false);
  const [votedChaosOption, setVotedChaosOption] = useState<'A'|'B'>();

  const [messageReactions, setMessageReactions] = useState<Record<string, { toxic: number, fire: number, clown: number }>>({});
  const [myMsgReactions, setMyMsgReactions] = useState<Record<string, Set<string>>>({}); // track per-message which types I reacted to
  const [challengerMsg, setChallengerMsg] = useState<any | null>(null);


  const handleMsgReact = (msgId: string, type: 'toxic' | 'fire' | 'clown') => {
    const alreadyReacted = myMsgReactions[msgId]?.has(type) || false;
    
    // Update my reactions tracking
    setMyMsgReactions(prev => {
      const existing = new Set(prev[msgId] || []);
      if (alreadyReacted) {
        existing.delete(type);
      } else {
        existing.add(type);
      }
      return { ...prev, [msgId]: existing };
    });

    // Update the reaction counts
    setMessageReactions(prev => ({
      ...prev,
      [msgId]: {
        toxic: (prev[msgId]?.toxic || 0) + (type === 'toxic' ? (alreadyReacted ? -1 : 1) : 0),
        fire: (prev[msgId]?.fire || 0) + (type === 'fire' ? (alreadyReacted ? -1 : 1) : 0),
        clown: (prev[msgId]?.clown || 0) + (type === 'clown' ? (alreadyReacted ? -1 : 1) : 0),
      }
    }));
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.userId !== user?.id && 'vibrate' in navigator) {
        try { navigator.vibrate(10); } catch (e) {}
      }
    }
  }, [messages.length, user]);

  const matchId = id?.startsWith('match-') ? id : `match-${id}`;

  useEffect(() => {
    if (matchId) connect(matchId, user?.id);
    return () => disconnect();
  }, [matchId, connect, disconnect, user?.id]);

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['warRoom', matchId],
    queryFn: async () => {
      const numericId = parseInt(matchId.replace('match-', ''), 10);
      const scheduleMatch = IPL_2026_SCHEDULE.find(m => m.id === numericId);
      
      if (scheduleMatch) {
        const matchStartTime = new Date(scheduleMatch.datetime);
        const now = new Date();
        const isToday = matchStartTime.toDateString() === now.toDateString();
        
        // Lock if it's in the future and NOT today
        if (matchStartTime > now && !isToday) {
           return { locked: true, scheduleMatch };
        }
      }

      try {
        return await api.warRooms.get(matchId);
      } catch (e) {
        if (matchId.startsWith('match-')) {
          return {
            id: matchId,
            status: 'LIVE',
            toxicity: {
              homeScore: 50,
              awayScore: 50,
              homeArmyId: 'Home Faction',
              awayArmyId: 'Away Faction',
            },
            activePredictions: []
          };
        }
        throw e;
      }
    },
    enabled: !!matchId,
    refetchInterval: 5000,
  });

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
      queryClient.invalidateQueries({ queryKey: ['warRoom', matchId] });
    },
  });

  const handleSendChat = () => {
    if (!chatInput.trim() || !matchId || !user || !room) return;
    const isHomeArmy = user.favoriteArmyId === room.toxicity?.homeArmyId;
    sendMessage({
      matchId: matchId,
      text: chatInput,
      userId: user.id,
      username: user.username,
      rank: user.rank || 'Recruit',
      armyId: user.favoriteArmyId || 'unknown',
      isHomeArmy
    });
    setChatInput('');
  };

  if ((room as any)?.locked) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <GlassCard className="p-10 text-center max-w-md w-full border-dashed border-white/20 bg-black/60 backdrop-blur-xl">
             <div className="text-6xl mb-6 opacity-80">🔒</div>
             <h1 className="text-2xl font-display font-black text-white uppercase tracking-widest mb-2">ACCESS DENIED</h1>
             <p className="text-white/40 font-mono text-sm mb-8 leading-relaxed">The gates to this battleground open on match day. Return later, soldier.</p>
             <WarzoneButton fullWidth onClick={() => navigate('/live')}>RETURN TO HQ</WarzoneButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-12 h-12 border-2 border-wz-red/30 border-t-wz-red rounded-full mx-auto mb-4" />
            <p className="text-wz-muted font-mono text-sm tracking-widest">Joining live discussion...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <GlassCard className="text-center max-w-md p-8 border-wz-red/20">
            <p className="text-5xl mb-4">💀</p>
            <p className="text-wz-red text-lg font-display font-bold mb-2">ROOM UNAVAILABLE</p>
            <p className="text-wz-muted text-xs font-mono mb-6">This match room may have ended or does not exist.</p>
            <WarzoneButton variant="ghost" onClick={() => navigate('/')}>← Back</WarzoneButton>
          </GlassCard>
        </div>
      </div>
    );
  }

  const getStormEmoji = (type: string | null) => {
    switch (type) {
      case 'fire': return '🔥';
      case 'laugh': return '😂';
      case 'rage': return '😤';
      case 'heart': return '❤️';
      case 'clap': return '👏';
      case 'skull': return '💀';
      case 'crown': return '👑';
      case 'mindblown': return '🤯';
      default: return '🔥';
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      <AnimatedBackground />

      {/* Fullscreen Overlays (Pointer events none on wrapper) */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <AnimatePresence>
          {liveReactions.map((reaction) => {
            const startX = `${30 + Math.random() * 40}vw`;
            const swayX = (Math.random() - 0.5) * 100;
            return (
              <motion.div
                key={reaction.id}
                initial={{ opacity: 0, scale: 0.5, y: '100vh', x: startX }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1], y: '-20vh', x: `calc(${startX} + ${swayX}px)` }}
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
        {showSniperDuel && (
          <SniperDuel 
            myUsername={user?.username || 'GUEST'}
            myTeam={user?.favoriteArmyId || 'UNKNOWN'}
            myColor={user?.army?.colorHex || '#00FF88'}
            matchId={matchId}
            onClose={() => setShowSniperDuel(false)}
          />
        )}

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

      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-wz-border/20">
        <div className="max-w-xl mx-auto px-5 pt-3 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/live')} className="text-wz-muted hover:text-wz-white transition-colors text-sm font-mono">
              ← LEAVE
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00FF88] shadow-[0_0_8px_#00FF88]' : 'bg-wz-red/50'} animate-pulse`} />
                <span className={`text-[9px] uppercase tracking-[0.3em] font-bold font-mono ${isConnected ? 'text-[#00FF88]' : 'text-wz-muted'}`}>
                  {isConnected ? 'LIVE WS' : 'CONNECTING...'}
                </span>
              </div>
            </div>
          </div>

          <TugOfWarMeter 
            homeLabel={room?.toxicity?.homeArmyId || 'HOME'}
            awayLabel={room?.toxicity?.awayArmyId || 'AWAY'}
            homeColor="#00FF88"
            awayColor="#FF2D55"
            homeScore={toxicityHome}
            onTap={(side) => {
              // Emit tug tap via WebSocket — backend updates scores and broadcasts to all clients
              const { socket } = useWarRoomStore.getState();
              if (socket && isConnected) {
                socket.emit('tug_tap', { matchId: matchId, userId: user?.id, side });
              }
            }}
            userSide={user?.favoriteArmyId === room?.toxicity?.homeArmyId ? 'home' : 'away'}
          />
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-xl mx-auto w-full px-5 pt-4 pb-48 flex flex-col">
        {/* Dynamic Admin Event Banners (Centered and Flowing) */}
        <AnimatePresence>
          {activeAdminEvent?.type === 'chaos' && (
            <motion.div 
              initial={{ opacity: 0, y: -40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-6 relative z-[60]"
            >
              <ChaosPrediction 
                question={activeAdminEvent.data?.question || "Will this over turn completely chaotic?"}
                optionA={activeAdminEvent.data?.optionA || "YES (MADNESS)"}
                optionB={activeAdminEvent.data?.optionB || "NO (BORING)"}
                multiplier={activeAdminEvent.data?.multiplier || 2.5}
                secondsLeft={activeAdminEvent.data?.durationSeconds || 15}
                voted={votedChaos}
                votedOption={votedChaosOption}
                onVote={(opt) => { 
                  setVotedChaos(true); 
                  setVotedChaosOption(opt); 
                  setTimeout(() => clearAdminEvent(), 3000); 
                }}
                votesA={activeAdminEvent.data?.votesA || 50}
                votesB={activeAdminEvent.data?.votesB || 50}
              />
            </motion.div>
          )}

          {activeAdminEvent?.type === 'traitors' && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mb-6 relative z-[60]"
            >
              <TraitorsDilemma 
                losingTeam={activeAdminEvent.data?.losingTeam || "Rivals"}
                winningTeam={activeAdminEvent.data?.winningTeam || "Allies"}
                pointsReward={activeAdminEvent.data?.pointsReward || 5000}
                onAccept={() => setTimeout(() => clearAdminEvent(), 2000)}
                onReject={() => clearAdminEvent()}
              />
            </motion.div>
          )}

          {activeAdminEvent?.type === 'jinx' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 relative z-[60]"
            >
              <JinxMinigame 
                targetPlayer={activeAdminEvent.data?.targetPlayer || "Star Player"}
                targetTeam={activeAdminEvent.data?.targetTeam || "Rival"}
                mode={activeAdminEvent.data?.mode || "jinx"}
                onComplete={() => setTimeout(() => clearAdminEvent(), 3000)}
                onClose={() => clearAdminEvent()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prediction List */}
        <AnimatePresence>
          {allActivePredictions.map((pred: any) => (
            !votedPredictions.has(pred.id) && (
              <motion.div 
                key={pred.id} 
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                className="mb-5 relative z-20"
              >
                <div className="glass-card p-6 border border-wz-yellow/30 shadow-[0_0_40px_rgba(255,214,10,0.1)]">
                  <div className="flex justify-between mb-3">
                    <span className="text-[9px] uppercase font-bold text-wz-yellow tracking-widest">⚡ Prediction</span>
                    <span className="text-xs font-mono text-wz-neon">+{pred.pointsReward} WP</span>
                  </div>
                  <p className="font-display font-bold text-lg mb-4">{pred.question}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <WarzoneButton 
                      loading={voteMutation.isPending} 
                      onClick={() => voteMutation.mutate({ predId: pred.id, option: 'A' })} 
                      className="text-xs py-3 cursor-pointer z-30"
                    >
                      {pred.optionA}
                    </WarzoneButton>
                    <WarzoneButton 
                      variant="danger" 
                      loading={voteMutation.isPending} 
                      onClick={() => voteMutation.mutate({ predId: pred.id, option: 'B' })} 
                      className="text-xs py-3 cursor-pointer z-30"
                    >
                      {pred.optionB}
                    </WarzoneButton>
                  </div>
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[200px] flex flex-col-reverse rounded-xl scrollbar-hide">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.p className="text-wz-muted text-xs font-mono text-center mb-10">No messages yet. Start the war.</motion.p>
            ) : (
              [...messages].reverse().map((msg) => {
                const isMe = user?.id === msg.userId;
                const isAlly = user?.favoriteArmyId === msg.armyId;
                const accentColor = isMe ? '#00FF88' : isAlly ? '#64D2FF' : '#FF2D55';
                return (
                  <motion.div 
                    key={msg.id} 
                    layout 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-sm py-2 px-3 rounded-lg border-l-4 flex flex-col items-start gap-1 my-1 ${isAlly ? 'bg-white/5 border-l-wz-blue/50' : 'bg-wz-red/10 border-l-[#FF2D55]/50'}`} 
                    style={{ borderLeftColor: accentColor }}
                  >
                    <div className="flex items-center gap-2 mb-0.5 w-full">
                      <button
                        onClick={() => navigate(`/profile/${msg.username}`)}
                        className="font-bold font-mono text-[11px] hover:underline cursor-pointer"
                        style={{ color: accentColor }}
                      >
                        {msg.username}
                      </button>
                      <RankBadge rank={msg.rank || 'Recruit'} size="sm" />
                      {!isMe && (
                        <button 
                          onClick={() => setChallengerMsg(msg)}
                          className="ml-2 px-1.5 py-0.5 border border-[#FF6B2C]/50 rounded bg-[#FF6B2C]/10 text-[#FF6B2C] hover:text-white text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-[#FF6B2C]/50 transition-colors"
                          title={`Challenge ${msg.username} to Sniper Duel`}
                        >
                          [1v1 SD]
                        </button>
                      )}
                    </div>
                    <span className="text-wz-text/90 inline-block mb-1">{msg.text}</span>
                    
                    {/* Reactions Block */}
                    <div className="flex items-center gap-1.5 mt-0.5 w-full">
                      <button onClick={() => handleMsgReact(msg.id, 'toxic')} className={`flex items-center gap-1 text-[9px] font-mono rounded px-1.5 py-0.5 border transition-colors ${myMsgReactions[msg.id]?.has('toxic') ? 'bg-[#00FF88]/15 border-[#00FF88]/40 text-[#00FF88]' : 'bg-black/40 hover:bg-white/10 text-white/50 border-white/5'}`}>
                        ☠️ <span>{messageReactions[msg.id]?.toxic || 0}</span>
                      </button>
                      <button onClick={() => handleMsgReact(msg.id, 'fire')} className={`flex items-center gap-1 text-[9px] font-mono rounded px-1.5 py-0.5 border transition-colors ${myMsgReactions[msg.id]?.has('fire') ? 'bg-[#FF6B2C]/15 border-[#FF6B2C]/40 text-[#FF6B2C]' : 'bg-black/40 hover:bg-white/10 text-white/50 border-white/5'}`}>
                        🔥 <span>{messageReactions[msg.id]?.fire || 0}</span>
                      </button>
                      <button onClick={() => handleMsgReact(msg.id, 'clown')} className={`flex items-center gap-1 text-[9px] font-mono rounded px-1.5 py-0.5 border transition-colors ${myMsgReactions[msg.id]?.has('clown') ? 'bg-[#FFD60A]/15 border-[#FFD60A]/40 text-[#FFD60A]' : 'bg-black/40 hover:bg-white/10 text-white/50 border-white/5'}`}>
                        🤡 <span>{messageReactions[msg.id]?.clown || 0}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Chat Control Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black/90 backdrop-blur-2xl border-t border-wz-border/20 p-4">
          <div className="max-w-xl mx-auto">
            <AnimatePresence>
              {showSoundboard && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="overflow-hidden mb-4 rounded-xl bg-white/5 border border-white/10 p-4"
                >
                   <Soundboard 
                     onPress={(type) => sendReaction({ matchId: matchId, type: type })} 
                     opponentTeam={room?.toxicity?.awayArmyId || "Rival"} 
                     disrupted={false}
                   />
                </motion.div>
              )}
            </AnimatePresence>

            {!showSoundboard && (
              <div className="flex justify-start gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                {(['fire', 'laugh', 'rage', 'heart', 'clap', 'skull', 'crown', 'mindblown'] as const).map((type) => (
                  <motion.button 
                    key={type} 
                    whileTap={{ scale: 0.8 }} 
                    onClick={() => sendReaction({ matchId: matchId, type })} 
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base hover:bg-white/10 transition-colors"
                  >
                    {getStormEmoji(type)}
                  </motion.button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => setShowSoundboard(!showSoundboard)} 
                className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-xl border transition-colors ${showSoundboard ? 'bg-wz-red border-wz-red text-white' : 'bg-white/5 border-white/10 text-white/50'}`}
              >
                🔊
              </button>
              <input 
                id="chat-input" 
                type="text" 
                placeholder="Declare war..." 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()} 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-wz-neon/50 transition-all" 
              />
              <WarzoneButton onClick={handleSendChat} className="px-5 shrink-0 cursor-pointer">⚔️</WarzoneButton>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}
