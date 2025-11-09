import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { RelationshipManager } from "@/lib/db/relationships";
import { characters, parts, settings, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { generateParts } from "@/lib/studio/generators/parts-generator";
import type { GeneratePartsParams } from "@/lib/studio/generators/types";
import type {
    GeneratePartsErrorResponse,
    GeneratePartsRequest,
    GeneratePartsResponse,
} from "../types";

export const runtime = "nodejs";

/**
 * Validation schema for generating parts
 */
const generatePartsSchema = z.object({
    storyId: z.string(),
    partsCount: z.number().min(1).max(10).optional().default(3),
    language: z.string().optional().default("English"),
});

// GET /api/parts - Get parts for a story
export async function GET(request: NextRequest) {
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

        // 3. Get story and check access
        const storyResult: Array<typeof stories.$inferSelect> = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId));
        const story: typeof stories.$inferSelect | undefined = storyResult[0];

        if (!story) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // 4. Check access permissions - only allow author access for now
        if (story.authorId !== authResult.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // 5. Get parts for the story
        const storyParts: Array<typeof parts.$inferSelect> = await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId))
            .orderBy(parts.orderIndex);

        // 6. Return parts with story information
        return NextResponse.json({
            parts: storyParts.map((part) => ({
                ...part,
                story: {
                    id: story.id,
                    title: story.title,
                    authorId: story.authorId,
                },
            })),
        });
    } catch (error) {
        console.error("Error fetching parts:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// POST /api/parts - Generate parts using AI
export async function POST(request: NextRequest) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📚 [PARTS API] POST request received");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [PARTS API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [PARTS API] Insufficient scopes:", {
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

        console.log("✅ [PARTS API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: GeneratePartsRequest =
            (await request.json()) as GeneratePartsRequest;
        const validatedData: z.infer<typeof generatePartsSchema> =
            generatePartsSchema.parse(body);

        console.log("[PARTS API] Request parameters:", {
            storyId: validatedData.storyId,
            partsCount: validatedData.partsCount,
            language: validatedData.language,
        });

        // 4. Fetch story and verify ownership
        const storyResult: Array<typeof stories.$inferSelect> = await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedData.storyId));
        const story: typeof stories.$inferSelect | undefined = storyResult[0];

        if (!story) {
            console.error("❌ [PARTS API] Story not found");
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (story.authorId !== authResult.user.id) {
            console.error("❌ [PARTS API] Access denied - not story author");
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        console.log("✅ [PARTS API] Story verified:", {
            id: story.id,
            title: story.title,
        });

        // 5. Fetch characters for the story
        const storyCharacters: Array<typeof characters.$inferSelect> = await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, validatedData.storyId));

        if (storyCharacters.length === 0) {
            console.error("❌ [PARTS API] No characters found for story");
            return NextResponse.json(
                { error: "Story must have characters before generating parts" },
                { status: 400 },
            );
        }

        console.log(
            `✅ [PARTS API] Found ${storyCharacters.length} characters`,
        );

        // 6. Fetch settings for the story
        const storySettings: Array<typeof settings.$inferSelect> = await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, validatedData.storyId));

        console.log(`[PARTS API] Found ${storySettings.length} settings`);

        // 7. Generate parts using AI
        console.log("[PARTS API] 🤖 Calling parts generator...");
        const generateParams: GeneratePartsParams = {
            storyId: validatedData.storyId,
            story: story as any,
            characters: storyCharacters as any,
            partsCount: validatedData.partsCount,
        };

        const generationResult: Awaited<ReturnType<typeof generateParts>> =
            await generateParts(generateParams);

        console.log("[PARTS API] ✅ Parts generation completed:", {
            count: generationResult.parts.length,
            generationTime: generationResult.metadata.generationTime,
        });

        // 8. Save generated parts to database
        console.log("[PARTS API] 💾 Saving parts to database...");
        const savedParts: Array<typeof parts.$inferSelect> = [];

        for (let i = 0; i < generationResult.parts.length; i++) {
            const partData = generationResult.parts[i];
            const partId: string = await RelationshipManager.addPartToStory(
                validatedData.storyId,
                {
                    title: partData.title || `Part ${i + 1}`,
                    summary: partData.summary || null,
                    orderIndex: i + 1,
                },
            );

            const savedPartResult: Array<typeof parts.$inferSelect> = await db
                .select()
                .from(parts)
                .where(eq(parts.id, partId))
                .limit(1);
            const savedPart: typeof parts.$inferSelect = savedPartResult[0];

            savedParts.push(savedPart);
        }

        console.log(
            `[PARTS API] ✅ Saved ${savedParts.length} parts to database`,
        );

        // 9. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[PARTS API] ✅ Cache invalidated");

        console.log("✅ [PARTS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 10. Return typed response
        const response: GeneratePartsResponse = {
            success: true,
            parts: savedParts,
            metadata: {
                totalGenerated: savedParts.length,
                generationTime: generationResult.metadata.generationTime,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [PARTS API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: GeneratePartsErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: GeneratePartsErrorResponse = {
            error: "Failed to generate and save parts",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
