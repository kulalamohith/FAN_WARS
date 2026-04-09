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

// === NEW AAA INTEGRATIONS ===
import TugOfWarMeter from '../components/live/TugOfWarMeter';
import ChaosPrediction from '../components/live/ChaosPrediction';
import Soundboard from '../components/live/Soundboard';
import JinxMinigame from '../components/live/JinxMinigame';
import SniperDuel from '../components/live/SniperDuel';
import TraitorsDilemma from '../components/live/TraitorsDilemma';

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
  const [towScore, setTowScore] = useState(50);
  
  const [votedChaos, setVotedChaos] = useState(false);
  const [votedChaosOption, setVotedChaosOption] = useState<'A'|'B'>();

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
    if (matchId) connect(matchId);
    return () => disconnect();
  }, [matchId, connect, disconnect]);

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['warRoom', matchId],
    queryFn: async () => {
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
      </AnimatePresence>

      <header className="sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-wz-border/20">
        <div className="max-w-xl mx-auto px-5 pt-3 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate('/live')} className="text-wz-muted hover:text-wz-white transition-colors text-sm font-mono">
              ← LEAVE
            </button>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowSniperDuel(true)}
                className="px-3 py-1 rounded bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/40 border border-yellow-500/50 text-[10px] font-mono font-bold animate-pulse"
              >
                🎯 1v1 DUEL
              </button>
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
            homeScore={towScore}
            onTap={(side) => setTowScore(s => side === 'home' ? Math.min(95, s + 1) : Math.max(5, s - 1))}
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
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold font-mono text-[11px]" style={{ color: accentColor }}>{msg.username}</span>
                      <RankBadge rank={msg.rank || 'Recruit'} size="sm" />
                    </div>
                    <span className="text-wz-text/90 inline-block">{msg.text}</span>
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
