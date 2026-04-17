import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Server, Socket } from 'socket.io';
import fp from 'fastify-plugin';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { awardPoints, POINT_VALUES } from '../lib/points';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

/**
 * Socket.IO Fastify Plugin
 * Integrates socket.io with the fastify server to provide real-time War Room features.
 */
const websocketPlugin: FastifyPluginAsync = async (fastify, options) => {
  // Attach socket.io to the underlying Node HTTP server
  const io = new Server(fastify.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // --- Redis Adapter for Horizontal Scaling ---
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
    });
    const subClient = pubClient.duplicate();

    // Connect asynchronously to avoid blocking Fastify startup / health checks
    pubClient.on('ready', () => {
      io.adapter(createAdapter(pubClient, subClient));
      fastify.log.info('⚡ Socket.IO → Redis adapter enabled');
    });

    pubClient.on('error', (err) => {
      fastify.log.error(err, '❌ Redis error');
    });

    subClient.on('error', (err) => {
      fastify.log.error(err, '❌ Redis Sub error');
    });
  } else {
    fastify.log.warn('⚠️  REDIS_URL not set — Socket.IO using in-memory adapter');
  }

  fastify.decorate('io', io);

  const toxicityScores: Record<string, { homeScore: number; awayScore: number }> = {};
  const reactionAggregators: Record<string, { count: number; timers: NodeJS.Timeout[] }> = {};
  const chatHistories: Record<string, any[]> = {};
  const bunkerChatHistories: Record<string, any[]> = {};
  const roomVisitors: Record<string, Set<string>> = {};
  fastify.decorate('roomVisitors', roomVisitors);
  fastify.decorate('toxicityScores', toxicityScores);

  const POSITIVE_WORDS = ['win', 'king', 'fire', 'best', 'goat', 'smash', 'destroy', 'crazy', '🔥', '👑'];
  const NEGATIVE_WORDS = ['choke', 'lose', 'fail', 'trash', 'worst', 'bad', 'finished', 'cry', '💀', '🤡'];

  function calculateSentimentShift(text: string): number {
    const lowerText = text.toLowerCase();
    let shift = 0;
    
    POSITIVE_WORDS.forEach(word => {
      if (lowerText.includes(word)) shift += 2;
    });
    
    NEGATIVE_WORDS.forEach(word => {
      if (lowerText.includes(word)) shift -= 2;
    });

    // Default noise shift: any message adds a tiny bit of hype
    if (shift === 0) shift = 0.5;
    
    return shift;
  }

  io.on('connection', (socket: Socket) => {
    fastify.log.info(`[Socket.IO] Client connected: ${socket.id}`);

    // Allow clients to join a specific War Room by Match ID
    socket.on('join_war_room', (data: string | { matchId: string; userId?: string }) => {
      let matchId = '';
      let userId = '';
      if (typeof data === 'string') {
        matchId = data;
        userId = `guest_${socket.id}`;
      } else {
        matchId = data.matchId;
        userId = data.userId || `guest_${socket.id}`;
      }

      socket.join(`room_${matchId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined room_${matchId}`);
      
      if (!roomVisitors[matchId]) {
        roomVisitors[matchId] = new Set();
      }
      roomVisitors[matchId].add(userId);

      // Initialize room score if it doesn't exist
      if (!toxicityScores[matchId]) {
        toxicityScores[matchId] = { homeScore: 50, awayScore: 50 };
      }
      
      // Send current score immediately to the joining client
      socket.emit('toxicity_update', toxicityScores[matchId]);

      // Send recent chat history
      if (chatHistories[matchId]) {
        socket.emit('chat_history', chatHistories[matchId]);
      }
    });

    // Leave room
    socket.on('leave_war_room', (matchId: string) => {
      socket.leave(`room_${matchId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} left room_${matchId}`);
    });

    // Handle incoming chat messages
    socket.on('send_message', (data: { matchId: string; text: string; userId: string; username: string; armyId: string; isHomeArmy: boolean }) => {
      const { matchId, text, userId, username, armyId, isHomeArmy } = data;
      
      // 1. Broadcast Message
      const payload = {
        id: `msg_${Date.now()}`,
        matchId,
        userId,
        username,
        armyId,
        text,
        timestamp: new Date().toISOString(),
      };

      if (!chatHistories[matchId]) chatHistories[matchId] = [];
      chatHistories[matchId].push(payload);
      if (chatHistories[matchId].length > 100) chatHistories[matchId].shift();

      io.to(`room_${matchId}`).emit('chat_message', payload);

      // 2. Process Toxicity (Sentiment Engine)
      const shiftAmount = calculateSentimentShift(text);
      if (toxicityScores[matchId]) {
        const scores = toxicityScores[matchId];
        
        // If it's a home fan, their positive sentiment increases home score (pushing away), 
        // negative sentiment decreases it.
        if (isHomeArmy) {
          scores.homeScore = Math.min(95, Math.max(5, scores.homeScore + shiftAmount));
          scores.awayScore = 100 - scores.homeScore;
        } else {
          scores.awayScore = Math.min(95, Math.max(5, scores.awayScore + shiftAmount));
          scores.homeScore = 100 - scores.awayScore;
        }

        // 3. Broadcast new toxicity
        io.to(`room_${matchId}`).emit('toxicity_update', scores);
      }

      // 4. Award chat participation points (+2, fire-and-forget)
      if (userId && userId !== 'admin') {
        awardPoints(userId, POINT_VALUES.CHAT_MESSAGE, 'CHAT_MESSAGE', `chat_${matchId}_${userId}_${Date.now()}`)
          .catch(err => fastify.log.error(err, 'Failed to award chat points'));
      }
    });

    // --- 🛡️ PRIVATE BUNKERS SYSTEM 🛡️ ---
    // Join a private bunker room (clients will typically join BOTH the match room and the bunker room)
    socket.on('join_bunker', (bunkerId: string) => {
      socket.join(`bunker_${bunkerId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined bunker_${bunkerId}`);

      if (bunkerChatHistories[bunkerId]) {
        socket.emit('bunker_chat_history', bunkerChatHistories[bunkerId]);
      }
    });

    // Leave a private bunker room
    socket.on('leave_bunker', (bunkerId: string) => {
      socket.leave(`bunker_${bunkerId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} left bunker_${bunkerId}`);
    });

    // Handle private bunker chat messages
    socket.on('send_bunker_message', (data: { bunkerId: string; text: string; userId: string; username: string; rank: string; armyId: string }) => {
      const { bunkerId, text, userId, username, rank, armyId } = data;
      
      const payload = {
        id: `bunker_msg_${Date.now()}`,
        bunkerId,
        userId,
        username,
        rank,
        armyId,
        text,
        timestamp: new Date().toISOString(),
      };
      
      if (!bunkerChatHistories[bunkerId]) bunkerChatHistories[bunkerId] = [];
      bunkerChatHistories[bunkerId].push(payload);
      if (bunkerChatHistories[bunkerId].length > 100) bunkerChatHistories[bunkerId].shift();

      io.to(`bunker_${bunkerId}`).emit('bunker_message', payload);
    });

    // --- ⚡ LIVE REACTION SYSTEM ⚡ ---
    // Broadcast individual reactions to the room for floating emoji effects
    socket.on('reaction', (data: { matchId: string; type: string }) => {
      const { matchId, type } = data;
      io.to(`room_${matchId}`).emit('live_reaction', { type });
    });

    // --- 💪 TUG-OF-WAR TAPS 💪 ---
    socket.on('tug_tap', (data: { matchId: string; userId: string; side: 'home' | 'away' }) => {
      const { matchId, userId, side } = data;
      
      // Update toxicity scores based on tap
      if (!toxicityScores[matchId]) {
        toxicityScores[matchId] = { homeScore: 50, awayScore: 50 };
      }
      const scores = toxicityScores[matchId];
      if (side === 'home') {
        scores.homeScore = Math.min(95, scores.homeScore + 1);
        scores.awayScore = 100 - scores.homeScore;
      } else {
        scores.awayScore = Math.min(95, scores.awayScore + 1);
        scores.homeScore = 100 - scores.awayScore;
      }
      
      // Broadcast updated scores to all clients in the room
      io.to(`room_${matchId}`).emit('toxicity_update', scores);
      
      if (userId && userId !== 'admin') {
        awardPoints(userId, POINT_VALUES.TUG_OF_WAR_TAP, 'TUG_OF_WAR_TAP', `tug_${matchId}_${userId}_${Date.now()}`)
          .catch(err => fastify.log.error(err, 'Failed to award tug tap points'));
      }
    });

    // --- 🎯 GLOBAL CONTEXTUAL SNIPER DUELS 🎯 ---
    // User personal room for global notifications
    socket.on('join_personal_channel', (userId: string) => {
      socket.join(`user_${userId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined personal user_${userId}`);
    });

    // Send duel challenge
    socket.on('send_duel_challenge', (data: { targetUserId: string; challengerId: string; challengerName: string; topicText: string }) => {
      io.to(`user_${data.targetUserId}`).emit('duel_challenge', {
        challengerId: data.challengerId,
        challengerName: data.challengerName,
        topicText: data.topicText,
      });
    });

    // Accept duel challenge
    socket.on('accept_duel_challenge', (data: { challengerId: string; challengerName: string; topicText: string; myUserId: string; myUsername: string }) => {
      const duelId = `duel_${Date.now()}`;
      const payload = {
        duelId,
        topicText: data.topicText,
        opponentId: data.myUserId,
        opponentName: data.myUsername,
      };
      
      // Notify challenger it was accepted
      io.to(`user_${data.challengerId}`).emit('duel_challenge_accepted', payload);
      
      // Notify the acceptor to route as well
      io.to(`user_${data.myUserId}`).emit('duel_challenge_accepted', {
        duelId,
        topicText: data.topicText,
        opponentId: data.challengerId,
        opponentName: data.challengerName,
      });
    });

    // Decline duel challenge
    socket.on('decline_duel_challenge', (data: { challengerId: string }) => {
      io.to(`user_${data.challengerId}`).emit('duel_challenge_declined', { targetUserId: socket.id });
    });

    // Cancel (withdraw) a sent duel challenge
    socket.on('cancel_duel_challenge', (data: { targetUserId: string }) => {
      io.to(`user_${data.targetUserId}`).emit('duel_challenge_cancelled', { challengerId: socket.id });
    });

    // Join Duel Room
    socket.on('join_duel_room', (duelId: string) => {
      socket.join(duelId);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined ${duelId}`);
    });

    // Send Duel Message
    socket.on('send_duel_message', (data: { duelId: string; senderId: string; senderName: string; text: string }) => {
      io.to(data.duelId).emit('duel_message', data);
    });

    // End Duel
    socket.on('end_duel', (data: { duelId: string }) => {
      io.to(data.duelId).emit('duel_ended');
    });

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket.IO] Client disconnected: ${socket.id}`);
      const guestId = `guest_${socket.id}`;
      for (const visitors of Object.values(roomVisitors)) {
        if (visitors.has(guestId)) {
          visitors.delete(guestId);
        }
      }
    });
  });
};

export default fp(websocketPlugin);
