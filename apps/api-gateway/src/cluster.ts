/**
 * WARZONE API Gateway — Cluster Entry Point
 *
 * Forks one worker process per CPU core so Node.js can use all available cores.
 * Socket.IO events are distributed across workers via the Redis adapter (already configured).
 *
 * Usage:
 *   Production:  node dist/cluster.js
 *   Dev:         npm run dev  (single process, hot reload — no cluster needed)
 */

import cluster from 'cluster';
import os from 'os';

// In production (especially Render), cap workers to 2 to avoid resource exhaustion and port binding race conditions.
const isProd = process.env.NODE_ENV === 'production';
const MAX_PROD_WORKERS = 2;
const osCpus = os.cpus().length;
const WORKERS = parseInt(
  process.env.CLUSTER_WORKERS || 
  String(isProd ? Math.min(osCpus, MAX_PROD_WORKERS) : osCpus), 
  10
);

if (cluster.isPrimary) {
  console.log(`⚔️  WARZONE Cluster Master PID ${process.pid} starting ${WORKERS} workers...`);

  // Fork one worker per CPU
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  // Restart a worker automatically if it crashes
  cluster.on('exit', (worker, code, signal) => {
    console.warn(`⚠️  Worker ${worker.process.pid} died (code: ${code}, signal: ${signal}). Restarting...`);
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    console.log(`✅ Worker ${worker.process.pid} online`);
  });
} else {
  // This is a worker process — start the actual Fastify app
  import('./server.js').then(({ start }) => {
    start().catch((err) => {
      console.error('Worker failed to start:', err);
      process.exit(1);
    });
  });
}
