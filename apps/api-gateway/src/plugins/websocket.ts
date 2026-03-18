import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Server, Socket } from 'socket.io';
import fp from 'fastify-plugin';

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

  fastify.decorate('io', io);

  // In-memory store for toxicity scores per room
  // Key: matchId, Value: { homeScore: number, awayScore: number }
  const toxicityScores: Record<string, { homeScore: number; awayScore: number }> = {};

  // Reaction Storm aggregator
  // Key: matchId, Value: { count: number, timers: NodeJS.Timeout[] }
  const reactionAggregators: Record<string, { count: number; timers: NodeJS.Timeout[] }> = {};

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
    socket.on('join_war_room', (matchId: string) => {
      socket.join(`room_${matchId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined room_${matchId}`);
      
      // Initialize room score if it doesn't exist
      if (!toxicityScores[matchId]) {
        toxicityScores[matchId] = { homeScore: 50, awayScore: 50 };
      }
      
      // Send current score immediately to the joining client
      socket.emit('toxicity_update', toxicityScores[matchId]);
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
    });

    // --- 🛡️ PRIVATE BUNKERS SYSTEM 🛡️ ---
    // Join a private bunker room (clients will typically join BOTH the match room and the bunker room)
    socket.on('join_bunker', (bunkerId: string) => {
      socket.join(`bunker_${bunkerId}`);
      fastify.log.info(`[Socket.IO] Client ${socket.id} joined bunker_${bunkerId}`);
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
      io.to(`bunker_${bunkerId}`).emit('bunker_message', payload);
    });

    // --- ⚡ LIVE REACTION SYSTEM ⚡ ---
    // Broadcast individual reactions to the room for floating emoji effects
    socket.on('reaction', (data: { matchId: string; type: string }) => {
      const { matchId, type } = data;
      // Broadcast immediately to everyone in the room (including sender if desired, or use socket.to().emit)
      io.to(`room_${matchId}`).emit('live_reaction', { type });
    });

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export default fp(websocketPlugin);
