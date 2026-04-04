/**
 * WARZONE — Environment Helpers
 *
 * Convenience functions built on top of the validated config.
 * Use these instead of checking config.NODE_ENV directly.
 */

import { config } from '../config';

/** True when NODE_ENV is 'development' */
export const isDev = (): boolean => config.NODE_ENV === 'development';

/** True when NODE_ENV is 'production' */
export const isProd = (): boolean => config.NODE_ENV === 'production';

/** True when NODE_ENV is 'test' */
export const isTest = (): boolean => config.NODE_ENV === 'test';

/**
 * Returns a human-readable summary of active config.
 * Redacts sensitive values. Used for startup logging.
 */
export function getConfigSummary(): Record<string, string> {
  return {
    NODE_ENV: config.NODE_ENV,
    HOST: config.HOST,
    PORT: String(config.PORT),
    LOG_LEVEL: config.LOG_LEVEL,
    DATABASE_URL: redact(config.DATABASE_URL),
    REDIS_URL: redact(config.REDIS_URL),
    JWT_SECRET: '********',
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN,
  };
}

/**
 * Redacts a connection string to show host but hide credentials.
 * "postgresql://user:pass@host:5432/db" → "postgresql://***@host:5432/db"
 */
function redact(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.username || parsed.password) {
      parsed.username = '***';
      parsed.password = '';
    }
    return parsed.toString();
  } catch {
    return '***';
  }
}
