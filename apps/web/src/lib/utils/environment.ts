/**
 * Environment Utility
 *
 * Provides consistent environment detection across the application.
 * Uses NODE_ENV to determine main (production) vs develop environment.
 */

export type FicturesEnvironment = "main" | "develop";

/**
 * Get the current Fictures environment
 *
 * Detection:
 * - NODE_ENV === 'production' -> 'main' (production)
 * - NODE_ENV !== 'production' -> 'develop' (development, test, etc.)
 *
 * @returns Current environment ('main' or 'develop')
 */
export function getFicturesEnv(): FicturesEnvironment {
	// Use NODE_ENV for environment detection
	if (process.env.NODE_ENV === "production") {
		return "main";
	}

	// Default to develop for all non-production environments
	return "develop";
}

/**
 * Check if running in main (production) environment
 */
export function isMainEnv(): boolean {
	return getFicturesEnv() === "main";
}

/**
 * Check if running in develop environment
 */
export function isDevelopEnv(): boolean {
	return getFicturesEnv() === "develop";
}

/**
 * Get environment display name
 */
export function getEnvDisplayName(): string {
	const env = getFicturesEnv();
	return env === "main" ? "Production" : "Development";
}

/**
 * Validate environment string
 */
export function isValidEnvironment(env: string): env is FicturesEnvironment {
	return env === "main" || env === "develop";
}
