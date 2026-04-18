import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
// Ensure no trailing slash for consistency
const API_URL = baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl;
// Extract WS_URL by removing /api/v1 (or just root if not present)
const WS_URL = API_URL.includes('/api/v1') ? API_URL.replace('/api/v1', '') : API_URL;

const CHALLENGE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export interface DuelChallengePayload {
  challengerId: string;
  challengerName: string;
  topicText: string;
  timestamp: number; // epoch ms when challenge was received / sent
}

export interface DuelAcceptedPayload {
  duelId: string;
  topicText: string;
  opponentId: string;
  opponentName: string;
}

export interface OutgoingChallenge {
  targetUserId: string;
  targetName: string;
  topicText: string;
  timestamp: number;
}

interface GlobalSocketState {
  socket: Socket | null;
  isConnected: boolean;

  // Multi-challenge queue (replaces single incomingChallenge)
  incomingChallenges: DuelChallengePayload[];
  outgoingChallenges: OutgoingChallenge[];

  acceptedDuel: DuelAcceptedPayload | null;
  
  connect: (userId: string) => void;
  disconnect: () => void;
  sendChallenge: (targetUserId: string, targetName: string, challengerName: string, topicText: string, myUserId: string) => void;
  acceptChallenge: (challengerId: string, challengerName: string, topicText: string, myUserId: string, myUsername: string) => void;
  declineChallenge: (challengerId: string) => void;
  cancelChallenge: (targetUserId: string) => void;
  clearAcceptedDuel: () => void;
  pruneExpired: () => void;

  // Convenience getters
  latestIncoming: () => DuelChallengePayload | null;
}

export const useGlobalSocketStore = create<GlobalSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  incomingChallenges: [],
  outgoingChallenges: [],
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

    // PUSH to array instead of overwriting
    socket.on('duel_challenge', (payload: Omit<DuelChallengePayload, 'timestamp'>) => {
      const challenge: DuelChallengePayload = { ...payload, timestamp: Date.now() };
      set((s) => {
        // Prevent duplicate from the same challenger
        const exists = s.incomingChallenges.some((c) => c.challengerId === challenge.challengerId);
        if (exists) return s;
        return { incomingChallenges: [...s.incomingChallenges, challenge] };
      });
    });

    socket.on('duel_challenge_accepted', (payload: DuelAcceptedPayload) => {
      // Remove from outgoing since it was accepted
      set((s) => ({
        acceptedDuel: payload,
        outgoingChallenges: s.outgoingChallenges.filter((c) => c.targetUserId !== payload.opponentId),
      }));
    });

    socket.on('duel_challenge_declined', (data?: { targetUserId?: string }) => {
      // Remove from outgoing
      if (data?.targetUserId) {
        set((s) => ({
          outgoingChallenges: s.outgoingChallenges.filter((c) => c.targetUserId !== data.targetUserId),
        }));
      }
      alert("Your Sniper Duel challenge was declined.");
    });

    // When someone cancels their challenge to us
    socket.on('duel_challenge_cancelled', (data: { challengerId: string }) => {
      set((s) => ({
        incomingChallenges: s.incomingChallenges.filter((c) => c.challengerId !== data.challengerId),
      }));
    });

    set({ socket });

    // Start periodic expiry pruning (every 30 seconds)
    const interval = setInterval(() => {
      get().pruneExpired();
    }, 30_000);

    // Clean up interval on disconnect
    const origDisconnect = get().disconnect;
    set({
      disconnect: () => {
        clearInterval(interval);
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null, isConnected: false, incomingChallenges: [], outgoingChallenges: [], acceptedDuel: null });
        }
      },
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, incomingChallenges: [], outgoingChallenges: [], acceptedDuel: null });
    }
  },

  sendChallenge: (targetUserId, targetName, challengerName, topicText, myUserId) => {
    get().socket?.emit('send_duel_challenge', { targetUserId, challengerId: myUserId, challengerName, topicText });
    // Track in outgoing
    set((s) => {
      const exists = s.outgoingChallenges.some((c) => c.targetUserId === targetUserId);
      if (exists) return s;
      return {
        outgoingChallenges: [
          ...s.outgoingChallenges,
          { targetUserId, targetName, topicText, timestamp: Date.now() },
        ],
      };
    });
  },

  acceptChallenge: (challengerId, challengerName, topicText, myUserId, myUsername) => {
    get().socket?.emit('accept_duel_challenge', { challengerId, challengerName, topicText, myUserId, myUsername });
    // Remove from incoming
    set((s) => ({
      incomingChallenges: s.incomingChallenges.filter((c) => c.challengerId !== challengerId),
    }));
  },

  declineChallenge: (challengerId) => {
    get().socket?.emit('decline_duel_challenge', { challengerId });
    // Remove from incoming
    set((s) => ({
      incomingChallenges: s.incomingChallenges.filter((c) => c.challengerId !== challengerId),
    }));
  },

  cancelChallenge: (targetUserId) => {
    get().socket?.emit('cancel_duel_challenge', { targetUserId });
    // Remove from outgoing
    set((s) => ({
      outgoingChallenges: s.outgoingChallenges.filter((c) => c.targetUserId !== targetUserId),
    }));
  },

  clearAcceptedDuel: () => set({ acceptedDuel: null }),

  pruneExpired: () => {
    const now = Date.now();
    set((s) => ({
      incomingChallenges: s.incomingChallenges.filter((c) => now - c.timestamp < CHALLENGE_EXPIRY_MS),
      outgoingChallenges: s.outgoingChallenges.filter((c) => now - c.timestamp < CHALLENGE_EXPIRY_MS),
    }));
  },

  latestIncoming: () => {
    const challenges = get().incomingChallenges;
    return challenges.length > 0 ? challenges[challenges.length - 1] : null;
  },
}));
