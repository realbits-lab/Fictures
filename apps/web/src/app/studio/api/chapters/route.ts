/**
 * Chapters API Route
 *
 * POST /studio/api/chapters - Generate chapters using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { chapters, characters, parts, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateChapters } from "@/lib/studio/generators/chapters-generator";
import type { GenerateChaptersParams } from "@/lib/studio/generators/types";
import {
    insertChapterSchema,
    type Character,
    type Part,
    type Story,
} from "@/lib/studio/generators/zod-schemas.generated";
import type {
    GenerateChaptersErrorResponse,
    GenerateChaptersRequest,
    GenerateChaptersResponse,
} from "../types";
import { generateChaptersSchema } from "../validation-schemas";

export const runtime = "nodejs";

/**
 * POST /studio/api/chapters
 *
 * Generate chapters for a story using AI
 *
 * Required scope: stories:write
 */
export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📚 [CHAPTERS API] POST request received");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [CHAPTERS API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [CHAPTERS API] Insufficient scopes:", {
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

        console.log("✅ [CHAPTERS API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: GenerateChaptersRequest =
            (await request.json()) as GenerateChaptersRequest;
        const validatedData: z.infer<typeof generateChaptersSchema> =
            generateChaptersSchema.parse(body);

        console.log("[CHAPTERS API] Request parameters:", {
            storyId: validatedData.storyId,
            chaptersPerPart: validatedData.chaptersPerPart,
            language: validatedData.language,
        });

        // 4. Fetch story and verify ownership
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedData.storyId))) as Story[];
        const story: Story | undefined = storyResult[0];

        if (!story) {
            console.error("❌ [CHAPTERS API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error("❌ [CHAPTERS API] Access denied - not story author");
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [CHAPTERS API] Story verified:", {
            id: story.id,
            title: story.title,
        });

        // 5. Fetch parts for the story
        const storyParts: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, validatedData.storyId))
            .orderBy(parts.orderIndex)) as Part[];

        if (storyParts.length === 0) {
            console.error("❌ [CHAPTERS API] No parts found for story");
            return NextResponse.json(
                { error: "Story must have parts before generating chapters" },
                { status: 400 },
            );
        }

        console.log(`✅ [CHAPTERS API] Found ${storyParts.length} parts`);

        // 6. Fetch characters for the story
        const storyCharacters: Character[] = (await db
            .select()
            .from(characters)
            .where(
                eq(characters.storyId, validatedData.storyId),
            )) as Character[];

        if (storyCharacters.length === 0) {
            console.error("❌ [CHAPTERS API] No characters found for story");
            return NextResponse.json(
                {
                    error: "Story must have characters before generating chapters",
                },
                { status: 400 },
            );
        }

        console.log(
            `✅ [CHAPTERS API] Found ${storyCharacters.length} characters`,
        );

        // 7. Generate chapters using AI
        console.log("[CHAPTERS API] 🤖 Calling chapters generator...");
        const generateParams: GenerateChaptersParams = {
            storyId: validatedData.storyId,
            story,
            parts: storyParts,
            characters: storyCharacters,
            chaptersPerPart: validatedData.chaptersPerPart,
        };

        const generationResult: Awaited<ReturnType<typeof generateChapters>> =
            await generateChapters(generateParams);

        console.log("[CHAPTERS API] ✅ Chapters generation completed:", {
            count: generationResult.chapters.length,
            generationTime: generationResult.metadata.generationTime,
        });

        // 8. Save generated chapters to database
        console.log("[CHAPTERS API] 💾 Saving chapters to database...");
        const savedChapters: Array<typeof chapters.$inferSelect> = [];

        for (let i = 0; i < generationResult.chapters.length; i++) {
            const chapterData = generationResult.chapters[i];
            const chapterId: string = `chapter_${nanoid(16)}`;
            const now: string = new Date().toISOString();

            // Validate chapter data before insert
            const validatedChapter: ReturnType<typeof insertChapterSchema.parse> =
                insertChapterSchema.parse({
                    id: chapterId,
                    storyId: validatedData.storyId,
                    partId: chapterData.partId || null,
                    title: chapterData.title || `Chapter ${i + 1}`,
                    summary: chapterData.summary || null,
                    orderIndex: i + 1,
                    status: "writing",
                    createdAt: now,
                    updatedAt: now,
                });

            const savedChapterResult: Array<typeof chapters.$inferSelect> =
                await db
                    .insert(chapters)
                    .values(validatedChapter)
                    .returning();
            const savedChapter: typeof chapters.$inferSelect =
                savedChapterResult[0];

            savedChapters.push(savedChapter);
        }

        console.log(
            `[CHAPTERS API] ✅ Saved ${savedChapters.length} chapters to database`,
        );

        // 9. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[CHAPTERS API] ✅ Cache invalidated");

        console.log("✅ [CHAPTERS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 10. Return typed response
        const response: GenerateChaptersResponse = {
            success: true,
            chapters: savedChapters,
            metadata: {
                totalGenerated: savedChapters.length,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [CHAPTERS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GenerateChaptersErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GenerateChaptersErrorResponse = {
            error: "Failed to generate and save chapters",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
