/**
 * Authentication Configuration
 *
 * Central configuration for the authentication context system
 *
 * @module auth/config
 */

import type { AuthProviderConfig } from "./context";

/**
 * Default authentication configuration
 */
export const authConfig: AuthProviderConfig = {
    // Enable context system by default
    useContext: true,

    // Allow parameter fallback during migration
    allowParameterFallback: true,

    // Use AsyncLocalStorage for server-side context
    storage: "async-local",

    // Enforce permission scope checking
    enforceScopes: true,

    // Debug logging in development
    debug: process.env.NODE_ENV === "development",
};

/**
 * Permission scope definitions
 * Central registry of all available scopes
 */
export const PERMISSION_SCOPES = {
    // Story management
    "stories:read": "Read stories and related data",
    "stories:write": "Create and edit stories",
    "stories:delete": "Delete stories",
    "stories:publish": "Publish and unpublish stories",

    // Chapter and scene management
    "chapters:read": "Read chapters and scenes",
    "chapters:write": "Create and edit chapters",
    "chapters:delete": "Delete chapters",

    // Image management
    "images:read": "View images",
    "images:write": "Upload and generate images",
    "images:delete": "Delete images",

    // AI features
    "ai:use": "Use AI generation features",
    "ai:unlimited": "Unlimited AI usage",

    // User management
    "users:read": "View user profiles",
    "users:write": "Edit user profiles",
    "users:delete": "Delete users",

    // Admin
    "admin:all": "Full admin access",
} as const;

export type PermissionScope = keyof typeof PERMISSION_SCOPES;

/**
 * Role-based scope mappings
 */
export const ROLE_SCOPES: Record<string, PermissionScope[]> = {
    reader: ["stories:read", "chapters:read", "images:read", "users:read"],
    writer: [
        "stories:read",
        "stories:write",
        "stories:publish",
        "chapters:read",
        "chapters:write",
        "images:read",
        "images:write",
        "ai:use",
        "users:read",
    ],
    manager: [
        "stories:read",
        "stories:write",
        "stories:delete",
        "stories:publish",
        "chapters:read",
        "chapters:write",
        "chapters:delete",
        "images:read",
        "images:write",
        "images:delete",
        "ai:use",
        "ai:unlimited",
        "users:read",
        "users:write",
        "admin:all",
    ],
};

/**
 * Get scopes for a given role
 */
export function getScopesForRole(role: string): PermissionScope[] {
    return ROLE_SCOPES[role] || ROLE_SCOPES.reader;
}

/**
 * Check if a role has a specific scope
 */
export function roleHasScope(role: string, scope: PermissionScope): boolean {
    const scopes = getScopesForRole(role);
    return scopes.includes(scope) || scopes.includes("admin:all");
}

/**
 * API endpoint scope requirements
 * Maps API routes to required scopes
 */
export const ENDPOINT_SCOPES: Record<string, PermissionScope[]> = {
    // Studio API endpoints
    "/studio/api/novels": ["stories:write", "ai:use"],
    "/studio/api/scenes": ["chapters:write", "ai:use"],
    "/studio/api/characters": ["stories:write"],
    "/studio/api/settings": ["stories:write"],
    "/studio/api/remove-story": ["stories:write"],
    "/studio/api/reset-all": ["admin:all"],

    // Novel API endpoints
    "/novels/api/story": ["stories:read"],
    "/novels/api/chapter": ["chapters:read"],

    // Image API endpoints
    "/api/images/generate": ["images:write", "ai:use"],
    "/api/images/upload": ["images:write"],
    "/api/images/delete": ["images:delete"],

    // User API endpoints
    "/api/users/profile": ["users:read"],
    "/api/users/update": ["users:write"],
    "/api/users/delete": ["users:delete"],

    // Admin endpoints
    "/api/admin/users": ["admin:all"],
    "/api/admin/stories": ["admin:all"],
    "/api/admin/system": ["admin:all"],
};

/**
 * Get required scopes for an endpoint
 */
export function getEndpointScopes(path: string): PermissionScope[] {
    // Exact match
    if (ENDPOINT_SCOPES[path]) {
        return ENDPOINT_SCOPES[path];
    }

    // Pattern matching (e.g., /api/users/:id)
    for (const [pattern, scopes] of Object.entries(ENDPOINT_SCOPES)) {
        const regex = new RegExp(
            "^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$",
        );
        if (regex.test(path)) {
            return scopes;
        }
    }

    // Default to read permission
    return ["stories:read"];
}

/**
 * Rate limiting configuration per scope
 */
export const SCOPE_RATE_LIMITS: Record<
    PermissionScope,
    { requests: number; window: number }
> = {
    "stories:read": { requests: 100, window: 60000 }, // 100 req/min
    "stories:write": { requests: 20, window: 60000 }, // 20 req/min
    "stories:delete": { requests: 10, window: 60000 }, // 10 req/min
    "stories:publish": { requests: 10, window: 60000 }, // 10 req/min
    "chapters:read": { requests: 100, window: 60000 },
    "chapters:write": { requests: 30, window: 60000 },
    "chapters:delete": { requests: 10, window: 60000 },
    "images:read": { requests: 200, window: 60000 },
    "images:write": { requests: 10, window: 60000 },
    "images:delete": { requests: 10, window: 60000 },
    "ai:use": { requests: 50, window: 60000 },
    "ai:unlimited": { requests: 1000, window: 60000 },
    "users:read": { requests: 50, window: 60000 },
    "users:write": { requests: 10, window: 60000 },
    "users:delete": { requests: 5, window: 60000 },
    "admin:all": { requests: 1000, window: 60000 },
};

/**
 * Get rate limit for a set of scopes
 * Returns the most permissive limit
 */
export function getRateLimit(scopes: PermissionScope[]): {
    requests: number;
    window: number;
} {
    if (scopes.includes("admin:all")) {
        return SCOPE_RATE_LIMITS["admin:all"];
    }

    if (scopes.includes("ai:unlimited")) {
        return SCOPE_RATE_LIMITS["ai:unlimited"];
    }

    // Find the most permissive limit
    let maxRequests = 0;
    let window = 60000;

    for (const scope of scopes) {
        const limit = SCOPE_RATE_LIMITS[scope as PermissionScope];
        if (limit && limit.requests > maxRequests) {
            maxRequests = limit.requests;
            window = limit.window;
        }
    }

    return { requests: maxRequests || 10, window };
}
