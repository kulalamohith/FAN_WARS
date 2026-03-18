/**
 * WARZONE API Gateway — Configuration
 *
 * Loads environment variables and validates them with Zod.
 * Fails fast at startup if required vars are missing.
 * Uses dotenv to read from .env file in development.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file (no-op in production where vars are injected by K8s/Docker)
dotenv.config();

/**
 * Schema for all environment variables.
 * Every config value the service needs is declared here — no scattered process.env reads.
 */
const envSchema = z.object({
  // --- Server ---
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // --- CORS ---
  CORS_ORIGIN: z.string().default('*'),

  // --- Database (PostgreSQL via Prisma) ---
  DATABASE_URL: z.string().url().default('postgresql://warzone:warzone@localhost:5432/warzone'),

  // --- Redis ---
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // --- JWT ---
  JWT_SECRET: z.string().min(32).default('warzone-dev-secret-change-in-production!!'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

// Validate and parse — throws immediately if invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

/** Validated, typed configuration object. Import this everywhere. */
export const config = parsed.data;

/** TypeScript type for the config, useful for dependency injection */
export type Config = z.infer<typeof envSchema>;
