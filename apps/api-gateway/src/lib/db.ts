/**
 * WARZONE — Database Client
 *
 * Singleton Prisma Client connection to PostgreSQL.
 * Used for all relational data reads/writes (Users, Armies, Points).
 *
 * It prevents creating multiple Prisma instances during hot-reloads in dev.
 */

// Prisma Client — includes: User, Army, Match, WarRoom, Prediction, Roast, Bunker, Post, PostReaction
import { PrismaClient } from '@prisma/client';
import { isProd } from './env';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connection limits during hot-reloading (common in TSX/Node dev).
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Only log queries in development
    log: isProd() ? ['error'] : ['query', 'info', 'warn', 'error'],
  });

if (!isProd()) {
  globalForPrisma.prisma = db;
}

/**
 * Gracefully disconnect from Postgres.
 * Called during server shutdown (SIGINT/SIGTERM handler in server.ts).
 */
export async function disconnectDb(): Promise<void> {
  await db.$disconnect();
  console.log('[Postgres] Disconnected gracefully');
}
