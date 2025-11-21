/**
 * Dual Authentication System
 *
 * Supports both API key and session-based authentication.
 * Used by API endpoints to authenticate requests from:
 * - External services (API keys with scopes)
 * - Web application (NextAuth sessions)
 */

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiKeys, users } from "@/lib/schemas/database";

export type AuthResult = {
    type: "session" | "api_key";
    user: {
        id: string;
        email: string;
        name: string | null;
        role: string;
    };
    scopes?: string[];
};

/**
 * Authenticate a request using either API key or session
 *
 * Priority:
 * 1. x-api-key header
 * 2. NextAuth session
 */
export async function authenticateRequest(
    request: NextRequest,
): Promise<AuthResult | null> {
    // Try API key authentication first
    const apiKeyHeader = request.headers.get("x-api-key");
    console.log(
        "[AUTH DEBUG] x-api-key header:",
        apiKeyHeader ? `${apiKeyHeader.substring(0, 20)}...` : "NOT FOUND",
    );

    if (apiKeyHeader) {
        console.log(
            "[AUTH DEBUG] API key header found, calling authenticateApiKey",
        );
        const result = await authenticateApiKey(apiKeyHeader);
        console.log(
            "[AUTH DEBUG] authenticateApiKey result:",
            result ? "SUCCESS" : "FAILED",
        );
        if (result) return result;
    } else {
        console.log("[AUTH DEBUG] No API key header, will try session auth");
    }

    // Fall back to session authentication
    const session = await auth();
    if (session?.user) {
        const email = session.user.email;
        if (!email) {
            return null;
        }

        // Get full user data including role
        const userResult = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (userResult.length === 0) {
            return null;
        }

        const dbUser = userResult[0];

        return {
            type: "session",
            user: {
                id: dbUser.id,
                email: dbUser.email,
                name: dbUser.name,
                role: dbUser.role,
            },
            scopes: getRoleScopes(dbUser.role),
        };
    }

    return null;
}

/**
 * Authenticate using API key
 */
async function authenticateApiKey(apiKey: string): Promise<AuthResult | null> {
    console.log("[AUTH DEBUG] Starting API key authentication");
    console.log("[AUTH DEBUG] API key length:", apiKey?.length);

    if (!apiKey || apiKey.length < 16) {
        console.log("[AUTH DEBUG] API key too short or missing");
        return null;
    }

    // Extract prefix from API key (first 16 characters before the hash part)
    const keyPrefix = apiKey.substring(0, 16);
    console.log("[AUTH DEBUG] Extracted prefix:", keyPrefix);

    // Find API key by prefix
    const apiKeyResults = await db
        .select()
        .from(apiKeys)
        .where(
            and(eq(apiKeys.keyPrefix, keyPrefix), eq(apiKeys.isActive, true)),
        )
        .limit(10); // Get all keys with this prefix (should be very few)

    console.log("[AUTH DEBUG] Found", apiKeyResults.length, "keys with prefix");

    if (apiKeyResults.length === 0) {
        console.log("[AUTH DEBUG] No API keys found with this prefix");
        return null;
    }

    // Verify the full API key hash
    let matchedKey = null;
    for (const key of apiKeyResults) {
        console.log("[AUTH DEBUG] Comparing with key prefix:", key.keyPrefix);
        const isMatch = await bcrypt.compare(apiKey, key.keyHash);
        console.log("[AUTH DEBUG] bcrypt.compare result:", isMatch);
        if (isMatch) {
            matchedKey = key;
            break;
        }
    }

    if (!matchedKey) {
        console.log(
            "[AUTH DEBUG] No matching API key found after bcrypt comparison",
        );
        return null;
    }

    console.log("[AUTH DEBUG] API key matched successfully");

    // Check if key is expired
    if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
        return null;
    }

    // Get user data
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, matchedKey.userId))
        .limit(1);

    if (userResult.length === 0) {
        return null;
    }

    const user = userResult[0];

    // Update last used timestamp (fire and forget)
    db.update(apiKeys)
        .set({ lastUsedAt: new Date().toISOString() })
        .where(eq(apiKeys.id, matchedKey.id))
        .execute()
        .catch((err) =>
            console.error("Failed to update API key last used:", err),
        );

    return {
        type: "api_key",
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        scopes: matchedKey.scopes as string[],
    };
}

/**
 * Get scopes based on user role
 */
function getRoleScopes(role: string): string[] {
    switch (role) {
        case "reader":
            return ["stories:read"];
        case "writer":
            return ["stories:read", "stories:write"];
        case "manager":
            return ["stories:read", "stories:write", "admin:all"];
        default:
            return ["stories:read"];
    }
}

/**
 * Check if auth result has required scope
 */
export function hasRequiredScope(
    authResult: AuthResult,
    requiredScope: string,
): boolean {
    if (!authResult.scopes) {
        return false;
    }

    // Check for exact scope match
    if (authResult.scopes.includes(requiredScope)) {
        return true;
    }

    // Check for wildcard scope (admin:all grants everything)
    if (authResult.scopes.includes("admin:all")) {
        return true;
    }

    // Check for parent scope (e.g., 'stories:write' implies 'stories:read')
    if (
        requiredScope === "stories:read" &&
        authResult.scopes.includes("stories:write")
    ) {
        return true;
    }

    return false;
}

/**
 * Require authentication middleware
 * Throws error if not authenticated
 */
export async function requireAuth(
    request: NextRequest,
    requiredScope?: string,
): Promise<AuthResult> {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
        throw new Error("Authentication required");
    }

    if (requiredScope && !hasRequiredScope(authResult, requiredScope)) {
        throw new Error(
            `Insufficient permissions. Required scope: ${requiredScope}`,
        );
    }

    return authResult;
}
