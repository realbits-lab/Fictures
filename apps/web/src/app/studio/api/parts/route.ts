import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import { parts, stories } from "@/lib/db/schema";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type { Story } from "@/lib/studio/generators/zod-schemas.generated";
import { partService } from "@/lib/studio/services";
import type {
    GeneratePartsErrorResponse,
    GeneratePartsRequest,
    GeneratePartsResponse,
} from "../types";
import { generatePartsSchema } from "../validation-schemas";

export const runtime = "nodejs";

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
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))) as Story[];
        const story: Story | undefined = storyResult[0];

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

        // 4. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[PARTS API] 🤖 Calling part service...");
        const serviceResult = await partService.generateAndSave({
            storyId: validatedData.storyId,
            partsCount: validatedData.partsCount,
            userId: authResult.user.id,
        });

        console.log("[PARTS API] ✅ Parts generation and save completed:", {
            count: serviceResult.parts.length,
            generationTime: serviceResult.metadata.generationTime,
        });

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[PARTS API] ✅ Cache invalidated");

        console.log("✅ [PARTS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: GeneratePartsResponse = {
            success: true,
            parts: serviceResult.parts,
            metadata: {
                totalGenerated: serviceResult.parts.length,
                generationTime: serviceResult.metadata.generationTime,
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
