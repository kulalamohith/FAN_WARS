import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface ChatMessage {
  id: string;
  matchId: string;
  userId: string;
  username: string;
  rank: string;
  armyId: string;
  text: string;
  timestamp: string;
}

export interface ActivePrediction {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  pointsReward: number;
  expiresAt: string;
}

interface LiveReaction {
  id: string;
  type: string;
}

interface WarRoomState {
  socket: Socket | null;
  isConnected: boolean;
  messages: ChatMessage[];
  toxicityHome: number;
  toxicityAway: number;
  activePredictions: ActivePrediction[];
  liveReactions: LiveReaction[];
  bunkerMessages: ChatMessage[];
  pendingBunkerId: string | null;
  activeAdminEvent: { type: string; data: any } | null;
  
  // Actions
  connect: (matchId: string) => void;
  disconnect: () => void;
  sendMessage: (payload: { matchId: string; text: string; userId: string; username: string; rank: string; armyId: string; isHomeArmy: boolean }) => void;
  sendReaction: (payload: { matchId: string; type: string }) => void;
  
  joinBunker: (bunkerId: string) => void;
  leaveBunker: (bunkerId: string) => void;
  sendBunkerMessage: (payload: { bunkerId: string; text: string; userId: string; username: string; rank: string; armyId: string }) => void;

  removePrediction: (id: string) => void;
  removeReaction: (id: string) => void;
  clearAdminEvent: () => void;
  reset: () => void;
}

export const useWarRoomStore = create<WarRoomState>((set, get) => ({
  socket: null,
  isConnected: false,
  messages: [],
  toxicityHome: 50,
  toxicityAway: 50,
  activePredictions: [],
  liveReactions: [],
  bunkerMessages: [],
  pendingBunkerId: null,
  activeAdminEvent: null,

  connect: (matchId: string) => {
    // Prevent multiple connections
    if (get().socket) return;

    // We assume the API gateway is on API_URL
    // e.g. "http://localhost:3000/api/v1" -> we need "http://localhost:3000"
    const serverUrl = API_URL.replace('/api/v1', '');
    
    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      socket.emit('join_war_room', matchId);
      // If a bunker join was queued before socket connected, send it now
      const pending = get().pendingBunkerId;
      if (pending) {
        socket.emit('join_bunker', pending);
      }
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      set((state) => {
        // Keep last 100 messages max to prevent memory bloat in intense chats
        const newMessages = [...state.messages, msg];
        if (newMessages.length > 100) newMessages.shift();
        return { messages: newMessages };
      });
    });

    socket.on('toxicity_update', (scores: { homeScore: number, awayScore: number }) => {
      set({ toxicityHome: scores.homeScore, toxicityAway: scores.awayScore });
    });

    socket.on('NEW_PREDICTION', (prediction: ActivePrediction) => {
      set((state) => ({
        // Prepend new prediction
        activePredictions: [prediction, ...state.activePredictions]
      }));
    });

    // Handle incoming Live Reactions
    socket.on('live_reaction', (data: { type: string }) => {
      const id = Math.random().toString(36).substring(7);
      set((state) => ({
        liveReactions: [...state.liveReactions, { id, type: data.type }]
      }));
      
      // Auto-remove after animation completes (3 seconds)
      setTimeout(() => {
        get().removeReaction(id);
      }, 3000);
    });

    // Handle Admin Events
    socket.on('admin_event', (event: { type: string; data: any }) => {
      set({ activeAdminEvent: event });
    });

    // Handle bunker messages
    socket.on('bunker_message', (msg: ChatMessage) => {
      set((state) => {
        const newMessages = [...state.bunkerMessages, msg];
        if (newMessages.length > 100) newMessages.shift();
        return { bunkerMessages: newMessages };
      });
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, messages: [], liveReactions: [] });
    }
  },

  sendMessage: (payload) => {
    const { socket } = get();
    if (socket && get().isConnected) {
      socket.emit('send_message', payload);
    }
  },

  sendReaction: (payload) => {
    const { socket } = get();
    if (socket && get().isConnected) {
      socket.emit('reaction', payload);
    }
  },

  joinBunker: (bunkerId) => {
    set({ pendingBunkerId: bunkerId, bunkerMessages: [] });
    const { socket } = get();
    if (socket && get().isConnected) {
      socket.emit('join_bunker', bunkerId);
    }
    // If not connected yet, it will be emitted in the 'connect' handler
  },

  leaveBunker: (bunkerId) => {
    const { socket } = get();
    if (socket && get().isConnected) {
      socket.emit('leave_bunker', bunkerId);
    }
  },

  sendBunkerMessage: (payload) => {
    const { socket } = get();
    if (socket && get().isConnected) {
      socket.emit('send_bunker_message', payload);
    }
  },

  removePrediction: (id: string) => {
    set((state) => ({
      activePredictions: state.activePredictions.filter(p => p.id !== id)
    }));
  },

  removeReaction: (id: string) => {
    set((state) => ({
      liveReactions: state.liveReactions.filter(r => r.id !== id)
    }));
  },

  clearAdminEvent: () => {
    set({ activeAdminEvent: null });
  },

  reset: () => set({ messages: [], bunkerMessages: [], toxicityHome: 50, toxicityAway: 50, activePredictions: [], liveReactions: [], activeAdminEvent: null })
}));
