import { type NextRequest, NextResponse } from "next/server";
import { getScopeDescriptions } from "@/lib/auth/api-keys";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { getUserApiKeys, revokeApiKey } from "@/lib/db/queries";

export const runtime = "nodejs";

// POST /api/settings/api-keys/[id]/revoke - Revoke (deactivate) specific API key
export const POST = requireScopes("admin:all")(
    async (
        _request: NextRequest,
        { params }: { params: Promise<{ id: string }> },
    ) => {
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

            // Await params in Next.js 15
            const { id } = await params;

            // Verify the API key belongs to the user
            const userApiKeys = await getUserApiKeys(auth.userId);
            const existingKey = userApiKeys.find((key) => key.id === id);

            if (!existingKey) {
                return NextResponse.json(
                    { error: "API key not found" },
                    { status: 404 },
                );
            }

            if (!existingKey.isActive) {
                return NextResponse.json(
                    { error: "API key is already revoked" },
                    { status: 400 },
                );
            }

            // Revoke the API key (set isActive to false)
            const revokedApiKey = await revokeApiKey(id);

            if (!revokedApiKey) {
                return NextResponse.json(
                    { error: "Failed to revoke API key" },
                    { status: 500 },
                );
            }

            const formattedKey = {
                id: revokedApiKey.id,
                name: revokedApiKey.name,
                keyPrefix: revokedApiKey.keyPrefix,
                scopes: revokedApiKey.scopes,
                scopeDescriptions: getScopeDescriptions(
                    revokedApiKey.scopes as string[],
                ),
                lastUsedAt: revokedApiKey.lastUsedAt,
                expiresAt: revokedApiKey.expiresAt,
                isActive: revokedApiKey.isActive,
                isExpired: revokedApiKey.expiresAt
                    ? new Date() > new Date(revokedApiKey.expiresAt)
                    : false,
                createdAt: revokedApiKey.createdAt,
                updatedAt: revokedApiKey.updatedAt,
            };

            return NextResponse.json({
                apiKey: formattedKey,
                message: "API key revoked successfully",
            });
        } catch (error) {
            console.error("Error revoking API key:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 },
            );
        }
    },
);
