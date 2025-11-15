/**
 * Server-side Authentication Context using AsyncLocalStorage
 *
 * This module provides server-side authentication context management using
 * Node.js AsyncLocalStorage, which maintains context across async operations
 * without passing parameters.
 *
 * @module auth/server-context
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { AuthContext, AuthStore } from "./context";
import {
    AuthenticationError,
    generateRequestId,
    NoContextError,
} from "./context";

/**
 * AsyncLocalStorage instance for maintaining auth context
 * This provides request-isolated storage that persists across async calls
 */
const authStorage = new AsyncLocalStorage<AuthContext>();

/**
 * Configuration for the server context
 */
interface ServerContextConfig {
    /** Enable debug logging */
    debug?: boolean;
    /** Throw error if no context available */
    throwOnMissing?: boolean;
}

const config: ServerContextConfig = {
    debug: process.env.NODE_ENV === "development",
    throwOnMissing: true,
};

/**
 * Run a function with the given authentication context
 * The context will be available to all async operations within the function
 *
 * @param context - The authentication context to use
 * @param fn - The async function to run with the context
 * @returns The result of the function
 *
 * @example
 * ```typescript
 * const result = await withAuth(authContext, async () => {
 *   // All functions called here can access the auth context
 *   // without needing it as a parameter
 *   return await someService.createItem(data);
 * });
 * ```
 */
export function withAuth<T>(
    context: AuthContext,
    fn: () => Promise<T>,
): Promise<T> {
    if (config.debug) {
        console.log(
            `[AUTH_CONTEXT] Creating context for request ${context.metadata.requestId}`,
        );
    }

    // Run the function with the authentication context
    return authStorage.run(context, fn);
}

/**
 * Get the current authentication context
 * Throws an error if no context is available and throwOnMissing is true
 *
 * @returns The current authentication context
 * @throws {NoContextError} If no context is available and throwOnMissing is true
 *
 * @example
 * ```typescript
 * function myService() {
 *   const auth = getAuth();
 *   console.log('User:', auth.userId);
 *   // Use auth.apiKey, auth.scopes, etc.
 * }
 * ```
 */
export function getAuth(): AuthContext {
    const context = authStorage.getStore();

    if (!context && config.throwOnMissing) {
        throw new NoContextError();
    }

    if (!context) {
        throw new NoContextError();
    }

    return context;
}

/**
 * Get the current authentication context safely
 * Returns null if no context is available instead of throwing
 *
 * @returns The current authentication context or null
 *
 * @example
 * ```typescript
 * function myService() {
 *   const auth = getAuthSafe();
 *   if (!auth) {
 *     // Handle unauthenticated case
 *     return null;
 *   }
 *   // Use auth normally
 * }
 * ```
 */
export function getAuthSafe(): AuthContext | null {
    return authStorage.getStore() ?? null;
}

/**
 * Check if an authentication context exists
 *
 * @returns True if a context exists
 */
export function hasAuthContext(): boolean {
    return authStorage.getStore() !== undefined;
}

/**
 * Get only the API key from the current context
 * Useful for services that only need the API key
 *
 * @returns The API key or null
 */
export function getApiKey(): string | null {
    const context = getAuthSafe();
    return context?.apiKey ?? null;
}

/**
 * Get the current user ID from the context
 *
 * @returns The user ID or null
 */
export function getUserId(): string | null {
    const context = getAuthSafe();
    return context?.userId ?? null;
}

/**
 * Get the current user email from the context
 *
 * @returns The user email or null
 */
export function getUserEmail(): string | null {
    const context = getAuthSafe();
    return context?.email ?? null;
}

/**
 * Get the current scopes from the context
 *
 * @returns Array of permission scopes
 */
export function getScopes(): string[] {
    const context = getAuthSafe();
    return context?.scopes ?? [];
}

/**
 * Update the debug configuration
 *
 * @param debug - Enable or disable debug logging
 */
export function setDebugMode(debug: boolean): void {
    config.debug = debug;
}

/**
 * Server-side auth store implementation using AsyncLocalStorage
 * This implements the AuthStore interface for server-side usage
 */
export class ServerAuthStore implements AuthStore {
    getAuth(): AuthContext | null {
        return getAuthSafe();
    }

    setAuth(_context: AuthContext): void {
        // AsyncLocalStorage doesn't support direct setting outside of run()
        // This method should not be used with AsyncLocalStorage
        throw new AuthenticationError(
            "Cannot set auth context directly with AsyncLocalStorage. Use withAuth() instead.",
            "UNSUPPORTED_OPERATION",
        );
    }

    clearAuth(): void {
        // AsyncLocalStorage automatically clears when the async context ends
        // This method is a no-op for AsyncLocalStorage
    }

    hasAuth(): boolean {
        return hasAuthContext();
    }
}

/**
 * Create a traced function that automatically includes request ID in logs
 *
 * @param fn - The function to trace
 * @param name - Optional name for the function in logs
 * @returns Wrapped function with tracing
 */
export function traced<T extends (...args: any[]) => any>(
    fn: T,
    name?: string,
): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const context = getAuthSafe();
        const requestId = context?.metadata.requestId ?? "no-context";
        const fnName = name ?? fn.name ?? "anonymous";

        if (config.debug) {
            console.log(`[${requestId}] Entering ${fnName}`);
        }

        try {
            const result = await fn(...args);
            if (config.debug) {
                console.log(`[${requestId}] Exiting ${fnName} successfully`);
            }
            return result;
        } catch (error) {
            if (config.debug) {
                console.error(`[${requestId}] Error in ${fnName}:`, error);
            }
            throw error;
        }
    }) as T;
}

/**
 * Measure execution time with request context
 *
 * @param fn - The async function to measure
 * @param label - Label for the timing log
 */
export async function measureWithContext<T>(
    fn: () => Promise<T>,
    label: string,
): Promise<T> {
    const context = getAuthSafe();
    const requestId = context?.metadata.requestId ?? generateRequestId();
    const start = Date.now();

    try {
        const result = await fn();
        const duration = Date.now() - start;

        if (config.debug) {
            console.log(`[${requestId}] ${label} completed in ${duration}ms`);
        }

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        if (config.debug) {
            console.error(
                `[${requestId}] ${label} failed after ${duration}ms:`,
                error,
            );
        }

        throw error;
    }
}

// Export the singleton store instance
export const serverAuthStore = new ServerAuthStore();
