import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    ALL_SCOPES,
    DEFAULT_SCOPES,
    generateApiKey,
    getScopeDescriptions,
    validateScopes,
} from "@/lib/auth/api-keys";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { createApiKey, getUserApiKeys } from "@/lib/db/queries";

export const runtime = "nodejs";

const createApiKeySchema = z.object({
    name: z.string().min(1).max(255),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
});

const _updateApiKeySchema = z.object({
    name: z.string().min(1).max(255).optional(),
    scopes: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional().nullable(),
    isActive: z.boolean().optional(),
});

// GET /api/settings/api-keys - Get user's API keys
export const GET = requireScopes("admin:all")(
    withAuthentication(async (_request: NextRequest) => {
        try {
            const auth = getAuth();

            // Only session-based auth can manage API keys (security measure)
            if (auth.type !== "session" || !auth.userId) {
                return NextResponse.json(
                    {
                        error: "Session authentication required for API key management",
                    },
                    { status: 403 },
                );
            }

            const apiKeys = await getUserApiKeys(auth.userId);

            // Transform for frontend consumption
            const formattedKeys = apiKeys.map((key) => ({
                id: key.id,
                name: key.name,
                keyPrefix: key.keyPrefix,
                scopes: key.scopes,
                scopeDescriptions: getScopeDescriptions(key.scopes as string[]),
                lastUsedAt: key.lastUsedAt,
                expiresAt: key.expiresAt,
                isActive: key.isActive,
                isExpired: key.expiresAt
                    ? new Date() > new Date(key.expiresAt)
                    : false,
                createdAt: key.createdAt,
                updatedAt: key.updatedAt,
            }));

            return NextResponse.json({
                apiKeys: formattedKeys,
                availableScopes: getScopeDescriptions(ALL_SCOPES),
                metadata: {
                    total: formattedKeys.length,
                    active: formattedKeys.filter(
                        (key) => key.isActive && !key.isExpired,
                    ).length,
                    expired: formattedKeys.filter((key) => key.isExpired)
                        .length,
                },
            });
        } catch (error) {
            console.error("Error fetching API keys:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
    }),
);

// POST /api/settings/api-keys - Create new API key
export const POST = requireScopes("admin:all")(
    withAuthentication(async (request: NextRequest) => {
        try {
            const auth = getAuth();

            // Only session-based auth can manage API keys
            if (auth.type !== "session" || !auth.userId) {
                return NextResponse.json(
                    {
                        error: "Session authentication required for API key management",
                    },
                    { status: 403 },
                );
            }

            const body = await request.json();
            const validatedData = createApiKeySchema.parse(body);

            // Validate and sanitize scopes
            const requestedScopes = validatedData.scopes || DEFAULT_SCOPES;
            const validScopes = validateScopes(requestedScopes);

            if (validScopes.length === 0) {
                return NextResponse.json(
                    { error: "At least one valid scope is required" },
                    { status: 400 },
                );
            }

            // Generate new API key
            const { fullKey, hash, prefix } = generateApiKey();

            // Parse expiration date if provided
            const expiresAt = validatedData.expiresAt
                ? new Date(validatedData.expiresAt)
                : null;

            // Create API key in database
            const dbApiKey = await createApiKey({
                userId: auth.userId,
                name: validatedData.name,
                keyHash: hash,
                keyPrefix: prefix,
                scopes: validScopes,
                expiresAt,
            });

            return NextResponse.json(
                {
                    apiKey: {
                        id: dbApiKey.id,
                        name: dbApiKey.name,
                        key: fullKey, // Only returned on creation!
                        keyPrefix: dbApiKey.keyPrefix,
                        scopes: dbApiKey.scopes,
                        scopeDescriptions: getScopeDescriptions(
                            dbApiKey.scopes as string[],
                        ),
                        expiresAt: dbApiKey.expiresAt,
                        isActive: dbApiKey.isActive,
                        createdAt: dbApiKey.createdAt,
                    },
                    warning:
                        "Save this API key now. You will not be able to see it again.",
                },
                { status: 201 },
            );
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    {
                        error: "Invalid input",
                        details: error.issues,
                    },
                    { status: 400 },
                );
            }

            console.error("Error creating API key:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
    }),
);

// PATCH /api/settings/api-keys - Update API key (bulk update not supported)
export async function PATCH(_request: NextRequest) {
    return NextResponse.json(
        {
            error: "Use PATCH /api/settings/api-keys/{id} to update specific API keys",
        },
        { status: 405 },
    );
}

// DELETE /api/settings/api-keys - Delete all API keys (not supported for safety)
export async function DELETE(_request: NextRequest) {
    return NextResponse.json(
        {
            error: "Bulk deletion not supported. Use DELETE /api/settings/api-keys/{id}",
        },
        { status: 405 },
    );
}
