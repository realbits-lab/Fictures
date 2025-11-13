/**
 * Characters API Route
 *
 * POST /studio/api/characters - Generate characters using AI
 * GET /studio/api/characters - Get characters for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { characters, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { characterService } from "@/lib/studio/services";
import type {
    ApiCharactersErrorResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
} from "../types";
import { generateCharactersSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * GET /studio/api/characters
 *
 * Get all characters for a story
 */
export async function GET(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [CHARACTERS API] GET request received");
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

        // 5. Get all characters for this story
        const storyCharacters: Array<typeof characters.$inferSelect> = await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, storyId))
            .orderBy(characters.createdAt);

        console.log(
            `✅ [CHARACTERS API] Found ${storyCharacters.length} characters`,
        );

        // 6. Return characters data
        return NextResponse.json({
            success: true,
            characters: storyCharacters,
        });
    } catch (error) {
        console.error("❌ [CHARACTERS API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

/**
 * POST /studio/api/characters
 *
 * Generate characters for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [CHARACTERS API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [CHARACTERS API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [CHARACTERS API] Insufficient scopes:", {
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

        console.log("✅ [CHARACTERS API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: ApiCharactersRequest =
            (await request.json()) as ApiCharactersRequest;
        const validatedData: z.infer<typeof generateCharactersSchema> =
            generateCharactersSchema.parse(body);

        console.log("[CHARACTERS API] Request parameters:", {
            storyId: validatedData.storyId,
            characterCount: validatedData.characterCount,
            language: validatedData.language,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[CHARACTERS API] API key provided:", !!apiKey);

        // 5. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[CHARACTERS API] 🤖 Calling character service...");
        const serviceResult = await characterService.generateAndSave({
            storyId: validatedData.storyId,
            characterCount: validatedData.characterCount,
            language: validatedData.language,
            userId: authResult.user.id,
            apiKey: apiKey || undefined,
        });

        console.log(
            "[CHARACTERS API] ✅ Characters generation and save completed:",
            {
                count: serviceResult.characters.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[CHARACTERS API] ✅ Cache invalidated");

        console.log("✅ [CHARACTERS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: ApiCharactersResponse = {
            success: true,
            characters: serviceResult.characters,
            metadata: {
                totalGenerated: serviceResult.characters.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [CHARACTERS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: ApiCharactersErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: ApiCharactersErrorResponse = {
            error: "Failed to generate and save characters",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
