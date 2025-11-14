/**
 * Settings API Route
 *
 * POST /api/studio/settings - Generate settings using AI
 * GET /api/studio/settings - Get settings for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { settings, stories } from "@/lib/schemas/drizzle";
import { settingService } from "@/lib/studio/services";
import type {
    ApiSettingsErrorResponse,
    ApiSettingsRequest,
    ApiSettingsResponse,
} from "../types";
import { generateSettingsSchema } from "../types";

export const runtime = "nodejs";

/**
 * GET /api/studio/settings
 *
 * Get all settings for a story
 */
export async function GET(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SETTINGS API] GET request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Extract and validate query parameters
        const { searchParams }: URL = new URL(request.url);
        const storyId: string | null = searchParams.get("storyId");

        if (!storyId) {
            return NextResponse.json(
                { error: "storyId parameter is required" },
                { status: 400 },
            );
        }

        // 3. Verify story exists and user has access
        const storyResult: Array<typeof stories.$inferSelect> = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);
        const story: typeof stories.$inferSelect | undefined = storyResult[0];

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // 4. Check access permissions
        if (story.authorId !== authResult.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // 5. Get all settings for this story
        const storySettings: Array<typeof settings.$inferSelect> = await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, storyId))
            .orderBy(settings.createdAt);

        console.log(`✅ [SETTINGS API] Found ${storySettings.length} settings`);

        // 6. Return settings data
        return NextResponse.json({
            success: true,
            settings: storySettings,
        });
    } catch (error) {
        console.error("❌ [SETTINGS API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /api/studio/settings
 *
 * Generate settings for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [SETTINGS API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [SETTINGS API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [SETTINGS API] Insufficient scopes:", {
                required: "stories:write",
                actual: authResult.scopes,
            });
            return NextResponse.json(
                {
                    error: "Insufficient permissions. Required scope: stories:write",
                },
                { status: 403 },
            );
        }

        console.log("✅ [SETTINGS API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: ApiSettingsRequest =
            (await request.json()) as ApiSettingsRequest;
        const validatedData: z.infer<typeof generateSettingsSchema> =
            generateSettingsSchema.parse(body);

        console.log("[SETTINGS API] Request parameters:", {
            storyId: validatedData.storyId,
            settingCount: validatedData.settingCount,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[SETTINGS API] API key provided:", !!apiKey);

        // 5. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[SETTINGS API] 🤖 Calling setting service...");
        const serviceResult = await settingService.generateAndSave({
            storyId: validatedData.storyId,
            settingCount: validatedData.settingCount,
            userId: authResult.user.id,
            apiKey: apiKey || undefined,
        });

        console.log(
            "[SETTINGS API] ✅ Settings generation and save completed:",
            {
                count: serviceResult.settings.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SETTINGS API] ✅ Cache invalidated");

        console.log("✅ [SETTINGS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: ApiSettingsResponse = {
            success: true,
            settings: serviceResult.settings,
            metadata: {
                totalGenerated: serviceResult.settings.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SETTINGS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: ApiSettingsErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: ApiSettingsErrorResponse = {
            error: "Failed to generate and save settings",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
