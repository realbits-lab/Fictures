/**
 * Characters API Route
 *
 * POST /api/studio/characters - Generate characters using AI
 * GET /api/studio/characters - Get characters for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { db } from "@/lib/db";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiCharactersErrorResponse,
    ApiCharactersRequest,
    ApiCharactersResponse,
} from "@/lib/schemas/api/studio";
import { generateCharactersSchema } from "@/lib/schemas/api/studio";
import { characters, stories } from "@/lib/schemas/database";
import { characterService } from "@/lib/studio/services";

export const runtime = "nodejs";

/**
 * GET /api/studio/characters
 *
 * Get all characters for a story
 */
export const GET = requireScopes("stories:read")(
    withAuthentication(async (request: NextRequest) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📚 [CHARACTERS API] GET request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            // 1. Get authentication from context
            const auth = getAuth();

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
            const story: typeof stories.$inferSelect | undefined =
                storyResult[0];

            if (!story) {
                return NextResponse.json(
                    { error: "Story not found" },
                    { status: 404 },
                );
            }

            // 4. Check access permissions
            if (story.authorId !== auth.userId) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 },
                );
            }

            // 5. Get all characters for this story
            const storyCharacters: Array<typeof characters.$inferSelect> =
                await db
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
    }),
);

/**
 * POST /api/studio/characters
 *
 * Generate characters for a story using AI
 *
 * Required scope: stories:write
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📚 [CHARACTERS API] POST request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        try {
            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [CHARACTERS API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
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

            // 2. Generate using service (handles fetch, validation, generation, persistence)
            // API key is automatically retrieved from context
            console.log("[CHARACTERS API] 🤖 Calling character service...");
            const serviceResult = await characterService.generateAndSave({
                storyId: validatedData.storyId,
                characterCount: validatedData.characterCount,
                language: validatedData.language,
                userId: auth.userId!,
            });

            console.log(
                "[CHARACTERS API] ✅ Characters generation and save completed:",
                {
                    count: serviceResult.characters.length,
                    generationTime: serviceResult.metadata.generationTime,
                },
            );

            // 3. Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[CHARACTERS API] ✅ Cache invalidated");

            console.log("✅ [CHARACTERS API] Request completed successfully");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 4. Return typed response
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
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);
