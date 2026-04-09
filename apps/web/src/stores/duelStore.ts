/**
 * WARZONE — Duel Store (Zustand)
 * Manages all state for Sniper Duels: lobby, active duels, history, reactions.
 * Simulates opponent for frontend-only mode; designed for easy backend swap.
 */

import { create } from 'zustand';
import {
  DUEL_TOPICS,
  SIMULATED_RESPONSES,
  SIMULATED_USERS,
  EMPTY_REACTIONS,
  getReactionScore,
  type DuelReactions,
  type DuelTopic,
  type SimUser,
} from '../lib/duelTopics';

// ── Types ──

export interface DuelPlayer {
  id: string;
  username: string;
  army: string;
  armyColor: string;
}

export interface DuelMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export type DuelStatus = 'pending' | 'live' | 'voting' | 'completed';

export interface Duel {
  id: string;
  topic: DuelTopic;
  player1: DuelPlayer;
  player2: DuelPlayer;
  messages: DuelMessage[];
  status: DuelStatus;
  startedAt: number | null;
  endedAt: number | null;
  verdictAt: number | null;     // endedAt + 24h
  player1Reactions: DuelReactions;
  player2Reactions: DuelReactions;
  winner: string | null;        // winner player id
  myReactions: { player1: string | null; player2: string | null }; // current user's reactions
}

interface DuelState {
  // Data
  activeDuel: Duel | null;
  viewingDuel: Duel | null;
  myDuels: Duel[];
  publicDuels: Duel[];
  duelView: 'lobby' | 'room' | 'reading';

  // Simulation
  _opponentTimer: ReturnType<typeof setInterval> | null;
  _opponentMsgIndex: number;

  // Stats
  stats: { wins: number; losses: number; totalDuels: number; points: number };

  // Actions
  startDuel: (opponent: SimUser, topic: DuelTopic, currentUser: DuelPlayer) => void;
  sendMessage: (text: string) => void;
  endDuel: () => void;
  reactToDuel: (duelId: string, player: 'player1' | 'player2', reaction: string) => void;
  viewDuel: (duelId: string) => void;
  closeViewDuel: () => void;
  closeDuelRoom: () => void;
  setDuelView: (view: 'lobby' | 'room' | 'reading') => void;
  initPublicDuels: (currentUser: DuelPlayer) => void;
}

// ── Helpers ──

let msgCounter = 0;
function makeMsg(senderId: string, senderName: string, text: string): DuelMessage {
  return { id: `msg-${Date.now()}-${msgCounter++}`, senderId, senderName, text, timestamp: Date.now() };
}

function generateId(): string {
  return `duel-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Predefined sample completed duels for the public feed
function generateSampleDuels(currentUser: DuelPlayer): Duel[] {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const samples: Duel[] = [
    {
      id: 'sample-1',
      topic: DUEL_TOPICS[0], // Dhoni vs Kohli captain
      player1: { id: 'sim1', username: 'RCB_Fanboy', army: 'RCB', armyColor: '#EC1C24' },
      player2: { id: 'sim2', username: 'Dhoni_Supremacy', army: 'CSK', armyColor: '#FFFF3C' },
      messages: [
        makeMsg('sim1', 'RCB_Fanboy', "Kohli's aggression on the field is unmatched. That's what captaincy is about. INTENT. 🔥"),
        makeMsg('sim2', 'Dhoni_Supremacy', "Intent without trophies is just passion. Dhoni has 5 IPL titles. Where are Kohli's? 🏆"),
        makeMsg('sim1', 'RCB_Fanboy', "Kohli took India to #1 in Tests! Dhoni lost the top spot and retired conveniently 💀"),
        makeMsg('sim2', 'Dhoni_Supremacy', "Bro said TESTS 😂 Dhoni won us the 2011 World Cup WITH THAT SIX. Name a more iconic captain moment. I'll wait."),
        makeMsg('sim1', 'RCB_Fanboy', "One moment doesn't make a career. Kohli's consistency as captain in EVERY format is insane 📊"),
        makeMsg('sim2', 'Dhoni_Supremacy', "Consistency? 0 ICC trophies as captain. Dhoni has 3. Sit down. 🤡"),
        makeMsg('sim1', 'RCB_Fanboy', "ICC trophies argument is tired. How about building the BEST Test team India has ever seen?"),
        makeMsg('sim2', 'Dhoni_Supremacy', "Cool Test team bro. Did they win the WTC final? Oh wait... Dhoni would've won that 👑"),
      ],
      status: 'voting',
      startedAt: now - oneDay * 0.5,
      endedAt: now - oneDay * 0.5 + 5 * 60 * 1000,
      verdictAt: now + oneDay * 0.5,
      player1Reactions: { fire: 45, brutal: 22, facts: 67, toxic: 31, ltake: 18 },
      player2Reactions: { fire: 89, brutal: 41, facts: 102, toxic: 12, ltake: 8 },
      winner: null,
      myReactions: { player1: null, player2: null },
    },
    {
      id: 'sample-2',
      topic: DUEL_TOPICS[10], // RCB will never win IPL
      player1: { id: 'sim3', username: 'MI_Paltan_King', army: 'MI', armyColor: '#004BA0' },
      player2: { id: 'sim1', username: 'RCB_Fanboy', army: 'RCB', armyColor: '#EC1C24' },
      messages: [
        makeMsg('sim3', 'MI_Paltan_King', "Let's be real. RCB is a meme franchise. Great players, zero titles. It's a CURSE. 💀"),
        makeMsg('sim1', 'RCB_Fanboy', "We had Kohli AND ABD and still couldn't win because of trash management. But the talent is there. One day. 😤"),
        makeMsg('sim3', 'MI_Paltan_King', "You've been saying 'one day' since 2008 bro. That's 17 years of copium 🤡"),
        makeMsg('sim1', 'RCB_Fanboy', "At least our fans show up EVERY game. Where are MI fans when you lose 3 in a row? Mall mein shopping? 😂"),
        makeMsg('sim3', 'MI_Paltan_King', "We can afford to miss games. We've seen 5 trophy lifts already. You haven't seen ONE 💀💀💀"),
        makeMsg('sim1', 'RCB_Fanboy', "Trophy or not, the ENERGY at Chinnaswamy is something your empty Wankhede can never match 🔥"),
        makeMsg('sim3', 'MI_Paltan_King', "Energy doesn't win championships. Strategy, money, and management do. And MI has all three."),
        makeMsg('sim1', 'RCB_Fanboy', "We bought Faf. We got Green. This year IS different. EE SALA CUP NAMDE 🏆"),
        makeMsg('sim3', 'MI_Paltan_King', "I've heard that every year since 2009 bro 😭😭😭"),
      ],
      status: 'voting',
      startedAt: now - oneDay * 0.3,
      endedAt: now - oneDay * 0.3 + 5 * 60 * 1000,
      verdictAt: now + oneDay * 0.7,
      player1Reactions: { fire: 78, brutal: 55, facts: 43, toxic: 15, ltake: 10 },
      player2Reactions: { fire: 92, brutal: 30, facts: 38, toxic: 45, ltake: 28 },
      winner: null,
      myReactions: { player1: null, player2: null },
    },
    {
      id: 'sample-3',
      topic: DUEL_TOPICS[3], // Kohli GOAT batsman
      player1: { id: 'sim5', username: 'OrangeArmy_SRH', army: 'SRH', armyColor: '#F26522' },
      player2: { id: 'sim7', username: 'GT_Titan_Rishabh', army: 'GT', armyColor: '#1B2133' },
      messages: [
        makeMsg('sim5', 'OrangeArmy_SRH', "Kohli is great but calling him GOAT when Sachin exists? That's disrespectful. 🐐"),
        makeMsg('sim7', 'GT_Titan_Rishabh', "Sachin played in an easier era. Kohli dominates in ALL formats against the best bowling attacks ever."),
        makeMsg('sim5', 'OrangeArmy_SRH', "Easier era?? Sachin faced Wasim, Waqar, McGrath, Murali. That's the GOAT bowling lineup bro."),
        makeMsg('sim7', 'GT_Titan_Rishabh', "And Kohli chases 350+ like it's nothing. Sachin's SR in ODI chases was mid. Numbers don't lie 📊"),
        makeMsg('sim5', 'OrangeArmy_SRH', "200 Test matches. 100 centuries. HUNDRED. Come back when Kohli gets there."),
        makeMsg('sim7', 'GT_Titan_Rishabh', "Kohli has 80+ centuries already and is still going. Plus Sachin NEVER won us a WC as a senior."),
        makeMsg('sim5', 'OrangeArmy_SRH', "He literally won Man of the Tournament in 2003 WC. Without Sachin there's no 2011 either."),
        makeMsg('sim7', 'GT_Titan_Rishabh', "2011 final Sachin scored 18. Gambhir scored 97. But sure keep the narrative going 🤡"),
      ],
      status: 'completed',
      startedAt: now - oneDay * 1.5,
      endedAt: now - oneDay * 1.5 + 5 * 60 * 1000,
      verdictAt: now - oneDay * 0.5,
      player1Reactions: { fire: 120, brutal: 65, facts: 145, toxic: 8, ltake: 5 },
      player2Reactions: { fire: 95, brutal: 70, facts: 88, toxic: 22, ltake: 18 },
      winner: 'sim5', // OrangeArmy_SRH won
      myReactions: { player1: null, player2: null },
    },
  ];

  return samples;
}

// ── Store ──

export const useDuelStore = create<DuelState>((set, get) => ({
  activeDuel: null,
  viewingDuel: null,
  myDuels: [],
  publicDuels: [],
  duelView: 'lobby',
  _opponentTimer: null,
  _opponentMsgIndex: 0,
  stats: { wins: 5, losses: 3, totalDuels: 8, points: 1250 },

  initPublicDuels: (currentUser: DuelPlayer) => {
    const existing = get().publicDuels;
    if (existing.length > 0) return;
    set({ publicDuels: generateSampleDuels(currentUser) });
  },

  startDuel: (opponent: SimUser, topic: DuelTopic, currentUser: DuelPlayer) => {
    const now = Date.now();
    const duel: Duel = {
      id: generateId(),
      topic,
      player1: currentUser,
      player2: { id: opponent.id, username: opponent.username, army: opponent.army, armyColor: opponent.armyColor },
      messages: [],
      status: 'live',
      startedAt: now,
      endedAt: null,
      verdictAt: null,
      player1Reactions: { ...EMPTY_REACTIONS },
      player2Reactions: { ...EMPTY_REACTIONS },
      winner: null,
      myReactions: { player1: null, player2: null },
    };

    // Start opponent simulation with a shared index tracker
    const category = topic.category;
    const responses = SIMULATED_RESPONSES[category] || SIMULATED_RESPONSES['hot-take'];

    const sendOpponentMsg = () => {
      const state = get();
      if (!state.activeDuel || state.activeDuel.status !== 'live') return;

      let idx = state._opponentMsgIndex;
      if (idx >= responses.length) idx = 0;

      const msg = makeMsg(opponent.id, opponent.username, responses[idx]);

      set((s) => ({
        activeDuel: s.activeDuel ? {
          ...s.activeDuel,
          messages: [...s.activeDuel.messages, msg],
        } : null,
        _opponentMsgIndex: idx + 1,
      }));
    };

    // Periodic opponent messages every 15-25s (background chatter)
    const timer = setInterval(() => {
      const state = get();
      if (!state.activeDuel || state.activeDuel.status !== 'live') return;
      const delay = Math.random() * 5000 + 5000; // 5-10s jitter
      setTimeout(sendOpponentMsg, delay);
    }, 20000);

    // First message after initial delay
    setTimeout(sendOpponentMsg, 3500);

    set({
      activeDuel: duel,
      duelView: 'room',
      _opponentTimer: timer,
      _opponentMsgIndex: 0,
    });
  },

  sendMessage: (text: string) => {
    const state = get();
    if (!state.activeDuel || state.activeDuel.status !== 'live') return;

    const msg = makeMsg(
      state.activeDuel.player1.id,
      state.activeDuel.player1.username,
      text
    );

    set((s) => ({
      activeDuel: s.activeDuel ? {
        ...s.activeDuel,
        messages: [...s.activeDuel.messages, msg],
      } : null,
    }));

    // Trigger opponent response 3-7s after user sends a message
    const opponent = state.activeDuel.player2;
    const category = state.activeDuel.topic.category;
    const responses = SIMULATED_RESPONSES[category] || SIMULATED_RESPONSES['hot-take'];

    setTimeout(() => {
      const current = get();
      if (!current.activeDuel || current.activeDuel.status !== 'live') return;

      let idx = current._opponentMsgIndex;
      if (idx >= responses.length) idx = 0;

      const reply = makeMsg(opponent.id, opponent.username, responses[idx]);
      set((s) => ({
        activeDuel: s.activeDuel ? {
          ...s.activeDuel,
          messages: [...s.activeDuel.messages, reply],
        } : null,
        _opponentMsgIndex: idx + 1,
      }));
    }, Math.random() * 4000 + 3000);
  },

  endDuel: () => {
    const state = get();
    if (!state.activeDuel) return;

    // Clear opponent timer
    if (state._opponentTimer) {
      clearInterval(state._opponentTimer);
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const completedDuel: Duel = {
      ...state.activeDuel,
      status: 'voting',
      endedAt: now,
      verdictAt: now + oneDay,
      // Seed with some initial reactions
      player1Reactions: { fire: Math.floor(Math.random() * 10), brutal: Math.floor(Math.random() * 5), facts: Math.floor(Math.random() * 15), toxic: Math.floor(Math.random() * 3), ltake: Math.floor(Math.random() * 3) },
      player2Reactions: { fire: Math.floor(Math.random() * 10), brutal: Math.floor(Math.random() * 5), facts: Math.floor(Math.random() * 15), toxic: Math.floor(Math.random() * 3), ltake: Math.floor(Math.random() * 3) },
    };

    set((s) => ({
      activeDuel: null,
      duelView: 'lobby',
      myDuels: [completedDuel, ...s.myDuels],
      publicDuels: [completedDuel, ...s.publicDuels],
      _opponentTimer: null,
      stats: { ...s.stats, totalDuels: s.stats.totalDuels + 1, points: s.stats.points + 100 },
    }));
  },

  reactToDuel: (duelId: string, player: 'player1' | 'player2', reaction: string) => {
    const updateDuel = (duel: Duel): Duel => {
      if (duel.id !== duelId) return duel;

      const prevReaction = duel.myReactions[player];
      const reactionKey = reaction as keyof DuelReactions;
      const reactionsField = player === 'player1' ? 'player1Reactions' : 'player2Reactions';
      const newReactions = { ...duel[reactionsField] };

      // Remove previous reaction if exists
      if (prevReaction && prevReaction in newReactions) {
        newReactions[prevReaction as keyof DuelReactions] = Math.max(0, newReactions[prevReaction as keyof DuelReactions] - 1);
      }

      // Add new reaction (or toggle off if same)
      if (prevReaction === reaction) {
        return {
          ...duel,
          [reactionsField]: newReactions,
          myReactions: { ...duel.myReactions, [player]: null },
        };
      }

      newReactions[reactionKey] = (newReactions[reactionKey] || 0) + 1;

      return {
        ...duel,
        [reactionsField]: newReactions,
        myReactions: { ...duel.myReactions, [player]: reaction },
      };
    };

    set((s) => ({
      publicDuels: s.publicDuels.map(updateDuel),
      myDuels: s.myDuels.map(updateDuel),
      viewingDuel: s.viewingDuel ? updateDuel(s.viewingDuel) : null,
    }));
  },

  viewDuel: (duelId: string) => {
    const state = get();
    const duel = [...state.publicDuels, ...state.myDuels].find((d) => d.id === duelId);
    if (duel) {
      set({ viewingDuel: duel, duelView: 'reading' });
    }
  },

  closeViewDuel: () => {
    set({ viewingDuel: null, duelView: 'lobby' });
  },

  closeDuelRoom: () => {
    const state = get();
    if (state._opponentTimer) clearInterval(state._opponentTimer);
    set({ activeDuel: null, duelView: 'lobby', _opponentTimer: null });
  },

  setDuelView: (view) => set({ duelView: view }),
}));
