/**
 * Characters API Route
 *
 * POST /studio/api/characters - Generate characters using AI
 * GET /studio/api/characters - Get characters for a story
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required for POST
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { characters, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateCharacters } from "@/lib/studio/generators/characters-generator";
import type { GenerateCharactersParams } from "@/lib/studio/generators/types";
import {
    type Character,
    insertCharacterSchema,
    type Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateCharactersErrorResponse,
    GenerateCharactersRequest,
    GenerateCharactersResponse,
} from "../types";

export const runtime = "nodejs";

/**
 * Validation schema for generating characters
 */
const generateCharactersSchema = z.object({
    storyId: z.string(),
    characterCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

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
        const body: GenerateCharactersRequest =
            (await request.json()) as GenerateCharactersRequest;
        const validatedData: z.infer<typeof generateCharactersSchema> =
            generateCharactersSchema.parse(body);

        console.log("[CHARACTERS API] Request parameters:", {
            storyId: validatedData.storyId,
            characterCount: validatedData.characterCount,
            language: validatedData.language,
        });

        // 4. Fetch story and verify ownership
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedData.storyId))) as Story[];
        const story: Story | undefined = storyResult[0];

        if (!story) {
            console.error("❌ [CHARACTERS API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error(
                "❌ [CHARACTERS API] Access denied - not story author",
            );
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [CHARACTERS API] Story verified:", {
            id: story.id,
            title: story.title,
        });

        // 5. Generate characters using AI
        console.log("[CHARACTERS API] 🤖 Calling characters generator...");
        const generateParams: GenerateCharactersParams = {
            story,
            characterCount: validatedData.characterCount,
            language: validatedData.language,
        };

        const generationResult: Awaited<ReturnType<typeof generateCharacters>> =
            await generateCharacters(generateParams);

        console.log("[CHARACTERS API] ✅ Characters generation completed:", {
            count: generationResult.characters.length,
            generationTime: generationResult.metadata.generationTime,
        });

        // 6. Save generated characters to database
        console.log("[CHARACTERS API] 💾 Saving characters to database...");
        const savedCharacters: Character[] = [];

        for (const characterData of generationResult.characters) {
            const characterId: string = `char_${nanoid(16)}`;
            const now: string = new Date().toISOString();

            // 7. Validate character data before insertion
            const validatedCharacter: ReturnType<
                typeof insertCharacterSchema.parse
            > = insertCharacterSchema.parse({
                id: characterId,
                storyId: validatedData.storyId,
                name: characterData.name || "Unnamed Character",
                isMain: characterData.isMain ?? false,
                summary: characterData.summary ?? null,
                coreTrait: characterData.coreTrait ?? null,
                internalFlaw: characterData.internalFlaw ?? null,
                externalGoal: characterData.externalGoal ?? null,
                personality: characterData.personality ?? null,
                backstory: characterData.backstory ?? null,
                relationships: null, // Relationships are built separately
                physicalDescription: characterData.physicalDescription ?? null,
                voiceStyle: characterData.voiceStyle ?? null,
                imageUrl: null,
                imageVariants: null,
                visualStyle: null,
                createdAt: now,
                updatedAt: now,
            });

            // 8. Insert validated character data into database
            const savedCharacterArray: Character[] = (await db
                .insert(characters)
                .values(validatedCharacter)
                .returning()) as Character[];
            const savedCharacter: Character = savedCharacterArray[0];
            savedCharacters.push(savedCharacter);

            console.log(
                `[CHARACTERS API] ✅ Saved character: ${savedCharacter.name}`,
            );
        }

        console.log(
            `[CHARACTERS API] ✅ Saved ${savedCharacters.length} characters to database`,
        );

        // 10. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[CHARACTERS API] ✅ Cache invalidated");

        console.log("✅ [CHARACTERS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 11. Return typed response
        const response: GenerateCharactersResponse = {
            success: true,
            characters: savedCharacters,
            metadata: {
                totalGenerated: savedCharacters.length,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [CHARACTERS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateCharactersErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateCharactersErrorResponse = {
            error: "Failed to generate and save characters",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
