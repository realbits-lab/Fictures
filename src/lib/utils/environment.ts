/**
 * Environment Utility
 *
 * Provides consistent environment detection across the application.
 * Supports both runtime (FICTURES_ENV) and build-time (NODE_ENV) detection.
 */

export type FicturesEnvironment = 'main' | 'develop';

/**
 * Get the current Fictures environment
 *
 * Priority:
 * 1. FICTURES_ENV environment variable
 * 2. NODE_ENV === 'production' -> 'main'
 * 3. Default to 'develop' for safety
 *
 * @returns Current environment ('main' or 'develop')
 */
export function getFicturesEnv(): FicturesEnvironment {
  const ficturesEnv = process.env.FICTURES_ENV?.toLowerCase();

  if (ficturesEnv === 'main' || ficturesEnv === 'develop') {
    return ficturesEnv;
  }

  // Fallback to NODE_ENV for production detection
  if (process.env.NODE_ENV === 'production') {
    return 'main';
  }

  // Default to develop for safety
  return 'develop';
}

/**
 * Check if running in main (production) environment
 */
export function isMainEnv(): boolean {
  return getFicturesEnv() === 'main';
}

/**
 * Check if running in develop environment
 */
export function isDevelopEnv(): boolean {
  return getFicturesEnv() === 'develop';
}

/**
 * Get environment display name
 */
export function getEnvDisplayName(): string {
  const env = getFicturesEnv();
  return env === 'main' ? 'Production' : 'Development';
}

/**
 * Validate environment string
 */
export function isValidEnvironment(env: string): env is FicturesEnvironment {
  return env === 'main' || env === 'develop';
}
