/**
 * Authentication Context System
 *
 * Provides a centralized authentication state management system that eliminates
 * the need to pass API keys as parameters through multiple function layers.
 *
 * @module auth/context
 */

/**
 * Authentication context that holds the current authentication state
 */
export interface AuthContext {
    /** Type of authentication */
    type: "session" | "api-key" | "anonymous";

    /** User ID from the authentication source */
    userId?: string;

    /** User email */
    email?: string;

    /** API key if using API key authentication */
    apiKey?: string;

    /** Permission scopes available to this authentication */
    scopes: string[];

    /** Request metadata for tracking and debugging */
    metadata: {
        /** Unique request ID for tracing */
        requestId: string;

        /** Timestamp when the context was created */
        timestamp: number;

        /** Client IP address if available */
        ip?: string;

        /** User agent string if available */
        userAgent?: string;

        /** Additional custom metadata */
        [key: string]: any;
    };
}

/**
 * Authentication store interface for managing auth context
 */
export interface AuthStore {
    /** Get the current authentication context */
    getAuth(): AuthContext | null;

    /** Set the authentication context */
    setAuth(context: AuthContext): void;

    /** Clear the authentication context */
    clearAuth(): void;

    /** Check if a context exists */
    hasAuth(): boolean;
}

/**
 * Authentication provider configuration
 */
export interface AuthProviderConfig {
    /** Enable context system (default: true) */
    useContext: boolean;

    /** Allow fallback to parameter passing (default: true for migration) */
    allowParameterFallback: boolean;

    /** Storage type for server-side context */
    storage: "async-local" | "headers" | "custom";

    /** Enforce permission scope checking (default: true) */
    enforceScopes: boolean;

    /** Enable debug logging (default: false in production) */
    debug: boolean;

    /** Custom storage implementation */
    customStorage?: AuthStore;
}

/**
 * Error types for authentication context system
 */
export class AuthenticationError extends Error {
    public readonly code: string = "AUTH_ERROR";

    constructor(message: string, code?: string) {
        super(message);
        this.name = "AuthenticationError";
        if (code) this.code = code;
    }
}

export class NoContextError extends AuthenticationError {
    constructor() {
        super("No authentication context available", "NO_CONTEXT");
        this.name = "NoContextError";
    }
}

export class InsufficientScopesError extends AuthenticationError {
    constructor(required: string[], actual: string[]) {
        super(
            `Insufficient permissions. Required scopes: [${required.join(", ")}], Available scopes: [${actual.join(", ")}]`,
            "INSUFFICIENT_SCOPES",
        );
        this.name = "InsufficientScopesError";
    }
}

export class InvalidApiKeyError extends AuthenticationError {
    constructor() {
        super("Invalid or expired API key", "INVALID_API_KEY");
        this.name = "InvalidApiKeyError";
    }
}

/**
 * Helper function to check if an error is an authentication error
 */
export function isAuthError(error: unknown): error is AuthenticationError {
    return error instanceof AuthenticationError;
}

/**
 * Helper function to check if a context has required scopes
 */
export function hasScopes(
    context: AuthContext | null,
    requiredScopes: string[],
): boolean {
    if (!context) return false;

    // Admin scope has access to everything
    if (context.scopes.includes("admin:all")) return true;

    // Check each required scope
    return requiredScopes.every((scope) => context.scopes.includes(scope));
}

/**
 * Helper function to create a request ID
 */
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Helper function to create anonymous context
 */
export function createAnonymousContext(
    metadata?: Partial<AuthContext["metadata"]>,
): AuthContext {
    return {
        type: "anonymous",
        scopes: [],
        metadata: {
            requestId: generateRequestId(),
            timestamp: Date.now(),
            ...metadata,
        },
    };
}

/**
 * Helper function to create API key context
 */
export function createApiKeyContext(
    apiKey: string,
    userId: string,
    email: string,
    scopes: string[],
    metadata?: Partial<AuthContext["metadata"]>,
): AuthContext {
    return {
        type: "api-key",
        userId,
        email,
        apiKey,
        scopes,
        metadata: {
            requestId: generateRequestId(),
            timestamp: Date.now(),
            ...metadata,
        },
    };
}

/**
 * Helper function to create session context
 */
export function createSessionContext(
    userId: string,
    email: string,
    scopes: string[],
    metadata?: Partial<AuthContext["metadata"]>,
): AuthContext {
    return {
        type: "session",
        userId,
        email,
        scopes,
        metadata: {
            requestId: generateRequestId(),
            timestamp: Date.now(),
            ...metadata,
        },
    };
}
