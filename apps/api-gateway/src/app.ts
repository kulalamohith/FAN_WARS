/**
 * WARZONE API Gateway — Fastify Application Builder
 *
 * Creates and configures the Fastify instance with all plugins.
 * Separated from server.ts so tests can import the app without starting the server.
 */

import path from 'path';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';

// Global BigInt serialization patch for Fastify/JSON.stringify
// @ts-ignore
BigInt.prototype.toJSON = function () {
  return typeof this === 'bigint' ? Number(this) : this;
};
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { config } from './config';
import authPlugin from './plugins/auth';
import websocketPlugin from './plugins/websocket';
import { authRoutes } from './routes/v1/auth';
import { matchesRoutes } from './routes/v1/matches';
import { warRoomRoutes } from './routes/v1/war-rooms';
import { predictionsRoutes } from './routes/v1/predictions';
import { leaderboardRoutes } from './routes/v1/leaderboard';
import { roastsRoutes } from './routes/v1/roasts';
import { armiesRoutes } from './routes/v1/armies';
import { bunkersRoutes } from './routes/v1/bunkers';
import { postsRoutes } from './routes/v1/posts';
import { profileRoutes } from './routes/v1/profile';
import { adminRoutes } from './routes/v1/admin';

/**
 * Builds a fully configured Fastify instance.
 * Does NOT start listening — that's the server's job.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      // Pretty print in development, JSON in production
      transport:
        config.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // --- Security & CORS ---
  await app.register(helmet, { global: true });
  await app.register(cors, {
    origin: config.CORS_ORIGIN,
    credentials: true,
  });

  // --- Sensible error handling (adds httpErrors, to, assert) ---
  await app.register(sensible);
  
  // --- Multipart for file uploads ---
  await app.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  });

  // --- Static file serving ---
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public', 'email'),
    prefix: '/email/',
    decorateReply: false,
  });

  app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // --- Authentication Plugin ---
  await app.register(authPlugin);

  // --- WebSocket Plugin (Socket.IO) ---
  await app.register(websocketPlugin, { prefix: '/' });

  // --- API Routes ---
  app.register(async (api) => {
    api.register(authRoutes, { prefix: '/auth' });
    api.register(matchesRoutes, { prefix: '/matches' });
    api.register(warRoomRoutes, { prefix: '/war-rooms' });
    api.register(predictionsRoutes, { prefix: '/predictions' });
    api.register(leaderboardRoutes, { prefix: '/leaderboard' });
    api.register(roastsRoutes, { prefix: '/roasts' });
    api.register(armiesRoutes, { prefix: '/armies' });
    api.register(bunkersRoutes, { prefix: '/bunkers' });
    api.register(postsRoutes, { prefix: '/posts' });
    api.register(profileRoutes, { prefix: '/profile' });
    api.register(adminRoutes, { prefix: '/admin' });
  }, { prefix: '/api/v1' });

  // --- Health check route (always available, no auth) ---
  app.get('/health', async (_request, _reply) => {
    return {
      status: 'ok',
      service: 'warzone-api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // --- Root route ---
  app.get('/', async (_request, _reply) => {
    return {
      name: 'WARZONE API Gateway',
      version: '0.1.0',
      docs: '/health',
    };
  });

  return app;
}
