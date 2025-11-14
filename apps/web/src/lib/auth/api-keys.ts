import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

// API key scopes - define what actions each scope allows
export const API_SCOPES = {
    "stories:read": "Read stories and related data",
    "stories:write": "Create and edit stories",
    "stories:delete": "Delete stories",
    "stories:publish": "Publish and unpublish stories",
    "chapters:read": "Read chapters and scenes",
    "chapters:write": "Create and edit chapters and scenes",
    "chapters:delete": "Delete chapters and scenes",
    "analysis:read": "View analysis and statistics",
    "ai:use": "Use AI writing assistance features",
    "community:read": "Read community posts and discussions",
    "community:write": "Create community posts and replies",
    "settings:read": "Read user settings and preferences",
    "settings:write": "Modify user settings and preferences",
    "admin:all": "Full administrative access to all resources",
} as const;

export type ApiScope = keyof typeof API_SCOPES;

// Default scopes for new API keys
export const DEFAULT_SCOPES: ApiScope[] = [
    "stories:read",
    "chapters:read",
    "analysis:read",
];

// All available scopes
export const ALL_SCOPES = Object.keys(API_SCOPES) as ApiScope[];

/**
 * Generate a cryptographically secure API key
 * Format: fic_[12_char_prefix]_[rest_of_key]
 */
export function generateApiKey(): {
    fullKey: string;
    hash: string;
    prefix: string;
} {
    // Generate 32 random bytes and encode as base64url (URL-safe)
    const randomKey = randomBytes(32).toString("base64url");

    // Create a readable prefix with the first 12 characters
    const keyId = randomKey.substring(0, 12);
    const prefix = `fic_${keyId}`;

    // Create the full key
    const fullKey = `${prefix}_${randomKey}`;

    // Hash the full key for secure storage
    const hash = hashApiKey(fullKey);

    return {
        fullKey,
        hash,
        prefix: prefix, // Store prefix for UI display
    };
}

/**
 * Hash an API key using bcrypt for secure storage
 * This matches the verification in dual-auth.ts
 */
export async function hashApiKey(key: string): Promise<string> {
    // Use cost factor 10 for reasonable security/performance balance
    const saltRounds = 10;
    return await bcrypt.hash(key, saltRounds);
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
    // Should match pattern: fic_[base64url_string] (minimum 32 chars)
    const apiKeyPattern = /^fic_[A-Za-z0-9_-]{32,}$/;
    return apiKeyPattern.test(key);
}

/**
 * Extract prefix from API key for display purposes
 */
export function extractKeyPrefix(key: string): string {
    const parts = key.split("_");
    if (parts.length >= 2) {
        return `${parts[0]}_${parts[1]}`;
    }
    return key.substring(0, 16);
}

/**
 * Check if a scope is valid
 */
export function isValidScope(scope: string): scope is ApiScope {
    return scope in API_SCOPES;
}

/**
 * Validate array of scopes
 */
export function validateScopes(scopes: string[]): ApiScope[] {
    return scopes.filter(isValidScope);
}

/**
 * Check if an API key has a required scope
 */
export function hasScope(
    userScopes: string[],
    requiredScope: ApiScope,
): boolean {
    // If user has wildcard scope, they can do anything
    if (userScopes.includes("*")) {
        return true;
    }

    // Check if user has the specific scope
    return userScopes.includes(requiredScope);
}

/**
 * Check if an API key has any of the required scopes
 */
export function hasAnyScope(
    userScopes: string[],
    requiredScopes: ApiScope[],
): boolean {
    if (userScopes.includes("*")) {
        return true;
    }

    return requiredScopes.some((scope) => userScopes.includes(scope));
}

/**
 * Get human-readable description for scopes
 */
export function getScopeDescriptions(
    scopes: string[],
): Array<{ scope: string; summary: string }> {
    return scopes.filter(isValidScope).map((scope) => ({
        scope,
        summary: API_SCOPES[scope],
    }));
}

/**
 * Generate a unique API key ID
 */
export function generateApiKeyId(): string {
    return nanoid();
}

/**
 * Check if API key is expired
 */
export function isApiKeyExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) {
        return false; // No expiration set
    }

    return new Date() > expiresAt;
}

/**
 * Get suggested expiration date options
 */
export function getExpirationOptions(): Array<{
    label: string;
    value: Date | null;
}> {
    const now = new Date();

    return [
        { label: "Never", value: null },
        {
            label: "7 days",
            value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        {
            label: "30 days",
            value: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
        {
            label: "90 days",
            value: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
        {
            label: "1 year",
            value: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        },
    ];
}
