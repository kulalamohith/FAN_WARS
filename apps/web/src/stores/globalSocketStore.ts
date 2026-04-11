import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
const WS_URL = API_URL.replace('/api/v1', '');

export interface DuelChallengePayload {
  challengerId: string;
  challengerName: string;
  topicText: string;
}

export interface DuelAcceptedPayload {
  duelId: string;
  topicText: string;
  opponentId: string;
  opponentName: string;
}

interface GlobalSocketState {
  socket: Socket | null;
  isConnected: boolean;
  incomingChallenge: DuelChallengePayload | null;
  acceptedDuel: DuelAcceptedPayload | null;
  
  connect: (userId: string) => void;
  disconnect: () => void;
  sendChallenge: (targetUserId: string, challengerName: string, topicText: string) => void;
  acceptChallenge: (challengerId: string, challengerName: string, topicText: string, myUserId: string, myUsername: string) => void;
  declineChallenge: (challengerId: string) => void;
  clearIncomingChallenge: () => void;
  clearAcceptedDuel: () => void;
}

export const useGlobalSocketStore = create<GlobalSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  incomingChallenge: null,
  acceptedDuel: null,

  connect: (userId: string) => {
    let { socket } = get();
    if (socket) return; // already connected

    socket = io(WS_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      set({ isConnected: true });
      socket?.emit('join_personal_channel', userId);
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('duel_challenge', (payload: DuelChallengePayload) => {
      set({ incomingChallenge: payload });
    });

    socket.on('duel_challenge_accepted', (payload: DuelAcceptedPayload) => {
      set({ acceptedDuel: payload });
    });

    socket.on('duel_challenge_declined', () => {
      alert("Your Sniper Duel challenge was declined.");
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, incomingChallenge: null, acceptedDuel: null });
    }
  },

  sendChallenge: (targetUserId, challengerName, topicText, myUserId) => {
    get().socket?.emit('send_duel_challenge', { targetUserId, challengerId: myUserId, challengerName, topicText });
  },

  acceptChallenge: (challengerId, challengerName, topicText, myUserId, myUsername) => {
    get().socket?.emit('accept_duel_challenge', { challengerId, challengerName, topicText, myUserId, myUsername });
    set({ incomingChallenge: null });
  },

  declineChallenge: (challengerId) => {
    get().socket?.emit('decline_duel_challenge', { challengerId });
    set({ incomingChallenge: null });
  },

  clearIncomingChallenge: () => set({ incomingChallenge: null }),
  clearAcceptedDuel: () => set({ acceptedDuel: null })
}));
