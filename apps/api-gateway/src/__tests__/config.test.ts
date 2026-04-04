/**
 * WARZONE — Config Validation Tests
 *
 * Tests that the Zod schema in config.ts correctly validates
 * environment variables and catches invalid configurations.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * We re-declare the schema here (mirroring config.ts) instead of importing config
 * directly, because importing config.ts would trigger process.exit(1) on invalid env.
 * This lets us test invalid states safely.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  DATABASE_URL: z.string().url().default('postgresql://warzone:warzone@localhost:5432/warzone'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32).default('warzone-dev-secret-change-in-production!!'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
});

describe('Config Validation', () => {
  it('should pass with all valid values', () => {
    const result = envSchema.safeParse({
      NODE_ENV: 'production',
      HOST: '0.0.0.0',
      PORT: '8080',
      LOG_LEVEL: 'warn',
      CORS_ORIGIN: 'https://warzone.app',
      DATABASE_URL: 'postgresql://user:pass@db.host:5432/warzone',
      REDIS_URL: 'redis://redis.host:6379',
      JWT_SECRET: 'a-very-secure-production-secret-that-is-long',
      JWT_EXPIRES_IN: '2h',
      JWT_REFRESH_EXPIRES_IN: '7d',
    });
    expect(result.success).toBe(true);
  });

  it('should use defaults when no env vars are set', () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe('development');
      expect(result.data.PORT).toBe(3000);
      expect(result.data.HOST).toBe('0.0.0.0');
      expect(result.data.LOG_LEVEL).toBe('info');
    }
  });

  it('should reject invalid NODE_ENV', () => {
    const result = envSchema.safeParse({ NODE_ENV: 'staging' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid PORT (negative number)', () => {
    const result = envSchema.safeParse({ PORT: '-1' });
    expect(result.success).toBe(false);
  });

  it('should reject PORT=0', () => {
    const result = envSchema.safeParse({ PORT: '0' });
    expect(result.success).toBe(false);
  });

  it('should coerce PORT string to number', () => {
    const result = envSchema.safeParse({ PORT: '9090' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(9090);
      expect(typeof result.data.PORT).toBe('number');
    }
  });

  it('should reject JWT_SECRET shorter than 32 characters', () => {
    const result = envSchema.safeParse({ JWT_SECRET: 'short' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid DATABASE_URL (not a URL)', () => {
    const result = envSchema.safeParse({ DATABASE_URL: 'not-a-url' });
    expect(result.success).toBe(false);
  });

  it('should reject invalid LOG_LEVEL', () => {
    const result = envSchema.safeParse({ LOG_LEVEL: 'verbose' });
    expect(result.success).toBe(false);
  });
});
