/**
 * WARZONE API Gateway — Server Entry Point
 *
 * Boots the Fastify server with graceful shutdown handling.
 * This file is the process entry point (tsx watch / node dist/server.js).
 */

import { buildApp } from './app.js';
import { config } from './config.js';

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({
      host: config.HOST,
      port: config.PORT,
    });

    app.log.info(
      `⚔️  WARZONE API Gateway listening on http://${config.HOST}:${config.PORT}`
    );
    app.log.info(`   Environment: ${config.NODE_ENV}`);
  } catch (err) {
    app.log.fatal(err, 'Failed to start WARZONE API Gateway');
    process.exit(1);
  }

  // --- Graceful Shutdown ---
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Export for cluster.ts workers
export { start };

// Start directly when this file is the entry point
start();

