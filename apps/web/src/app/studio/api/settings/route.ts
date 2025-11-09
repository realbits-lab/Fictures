/**
 * Settings API Route
 *
 * POST /studio/api/settings - Generate settings using AI
 * GET /studio/api/settings - Get settings for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateSettings } from "@/lib/studio/generators/settings-generator";
import type { GenerateSettingsParams } from "@/lib/studio/generators/types";
import {
    insertSettingSchema,
    type Setting,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateSettingsErrorResponse,
    GenerateSettingsRequest,
    GenerateSettingsResponse,
} from "../types";

export const runtime = "nodejs";

/**
 * Validation schema for generating settings
 */
const generateSettingsSchema = z.object({
    storyId: z.string(),
    settingCount: z.number().min(1).max(10).optional().default(3),
});

/**
 * GET /studio/api/settings
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
 * POST /studio/api/settings
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
        const body: GenerateSettingsRequest =
            (await request.json()) as GenerateSettingsRequest;
        const validatedData: z.infer<typeof generateSettingsSchema> =
            generateSettingsSchema.parse(body);

        console.log("[SETTINGS API] Request parameters:", {
            storyId: validatedData.storyId,
            settingCount: validatedData.settingCount,
        });

        // 4. Fetch story and verify ownership
        const storyResult: Array<typeof stories.$inferSelect> = await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedData.storyId));
        const story: typeof stories.$inferSelect | undefined = storyResult[0];

        if (!story) {
            console.error("❌ [SETTINGS API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error("❌ [SETTINGS API] Access denied - not story author");
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [SETTINGS API] Story verified:", {
            id: story.id,
            title: story.title,
        });

        // 5. Generate settings using AI
        console.log("[SETTINGS API] 🤖 Calling settings generator...");
        const generateParams: GenerateSettingsParams = {
            story: story as any,
            settingCount: validatedData.settingCount,
        };

        const generationResult: Awaited<ReturnType<typeof generateSettings>> =
            await generateSettings(generateParams);

        console.log("[SETTINGS API] ✅ Settings generation completed:", {
            count: generationResult.settings.length,
            generationTime: generationResult.metadata.generationTime,
        });

        // 6. Save generated settings to database
        console.log("[SETTINGS API] 💾 Saving settings to database...");
        const savedSettings: Setting[] = [];

        for (const settingData of generationResult.settings) {
            const settingId: string = `setting_${nanoid(16)}`;
            const now: string = new Date().toISOString();

            // 7. Validate setting data before insert
            const validatedSetting: ReturnType<
                typeof insertSettingSchema.parse
            > = insertSettingSchema.parse({
                id: settingId,
                storyId: validatedData.storyId,
                name: settingData.name || "Unnamed Setting",
                summary: settingData.summary || null,
                adversityElements: settingData.adversityElements || null,
                cycleAmplification: settingData.cycleAmplification || null,
                sensory: settingData.sensory || null,
                mood: settingData.mood || null,
                symbolicMeaning: settingData.symbolicMeaning || null,
                emotionalResonance: settingData.emotionalResonance || null,
                architecturalStyle: settingData.architecturalStyle || null,
                visualStyle: null,
                visualReferences: null,
                colorPalette: null,
                imageUrl: null,
                imageVariants: null,
                createdAt: now,
                updatedAt: now,
            });

            const savedSettingArray: Setting[] = (await db
                .insert(settings)
                .values(validatedSetting)
                .returning()) as Setting[];
            const savedSetting: Setting = savedSettingArray[0];

            savedSettings.push(savedSetting);

            console.log(
                `[SETTINGS API] ✅ Saved setting: ${savedSetting.name}`,
            );
        }

        console.log(
            `[SETTINGS API] ✅ Saved ${savedSettings.length} settings to database`,
        );

        // 8. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[SETTINGS API] ✅ Cache invalidated");

        console.log("✅ [SETTINGS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 9. Return typed response
        const response: GenerateSettingsResponse = {
            success: true,
            settings: savedSettings,
            metadata: {
                totalGenerated: savedSettings.length,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [SETTINGS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateSettingsErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateSettingsErrorResponse = {
            error: "Failed to generate and save settings",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
