/**
 * WARZONE — Redis Client
 *
 * Singleton Redis connection using ioredis.
 * Used across the app for:
 *   - Pub/Sub (war room chat fan-out)
 *   - Leaderboards (sorted sets)
 *   - Rate limiting counters
 *   - Session/cache layer
 *
 * Connection is lazy — only created when first accessed.
 * Handles reconnection and error logging automatically.
 */

import Redis from 'ioredis';
import { config } from '../config.js';

/** Singleton Redis instance. null until first getRedis() call. */
let redisClient: Redis | null = null;

/**
 * Returns the singleton Redis client.
 * Creates the connection on first call, reuses it after.
 */
export function getRedis(): Redis {
  if (redisClient) return redisClient;

  redisClient = new Redis(config.REDIS_URL, {
    // Retry with exponential backoff, cap at 3 seconds
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 3000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    // Enable read-only commands on reconnecting state
    enableReadyCheck: true,
    // Prefix all keys to avoid collisions if Redis is shared
    keyPrefix: 'wz:',
  });

  // --- Connection lifecycle logging ---
  redisClient.on('connect', () => {
    console.log('[Redis] Connected to', config.REDIS_URL);
  });

  redisClient.on('ready', () => {
    console.log('[Redis] Ready to accept commands');
  });

  redisClient.on('error', (err: Error) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redisClient.on('close', () => {
    console.warn('[Redis] Connection closed');
  });

  return redisClient;
}

/**
 * Gracefully disconnect Redis.
 * Called during server shutdown (SIGINT/SIGTERM handler in server.ts).
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Disconnected gracefully');
  }
}
