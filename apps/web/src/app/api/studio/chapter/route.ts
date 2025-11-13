import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { chapterService } from "@/lib/studio/services/chapter-service";
import type {
    ApiChapterErrorResponse,
    ApiChapterRequest,
    ApiChapterResponse,
} from "../types";

export const runtime = "nodejs";

const generateChapterSchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
    partId: z.string().min(1, "partId is required"),
});

/**
 * POST /api/studio/chapter - Generate ONE next chapter (Extreme Incremental)
 *
 * Generates the next chapter in sequence with full context of all previous chapters.
 * This is the extreme incremental approach where chapters are generated one at a time.
 */
export async function POST(request: NextRequest) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📖 [CHAPTER API] POST request received (Singular)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [CHAPTER API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [CHAPTER API] Insufficient scopes:", {
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

        console.log("✅ [CHAPTER API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: ApiChapterRequest =
            (await request.json()) as ApiChapterRequest;
        const validatedData: z.infer<typeof generateChapterSchema> =
            generateChapterSchema.parse(body);

        console.log("[CHAPTER API] Request parameters:", {
            storyId: validatedData.storyId,
            partId: validatedData.partId,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[CHAPTER API] API key provided:", !!apiKey);

        // 5. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[CHAPTER API] 🤖 Calling chapter service (singular)...");
        const serviceResult = await chapterService.generateAndSave({
            storyId: validatedData.storyId,
            partId: validatedData.partId,
            userId: authResult.user.id,
            apiKey: apiKey || undefined,
        });

        console.log("[CHAPTER API] ✅ Chapter generation and save completed:", {
            chapterId: serviceResult.chapter.id,
            title: serviceResult.chapter.title,
            chapterIndex: serviceResult.metadata.chapterIndex,
            totalChapters: serviceResult.metadata.totalChapters,
            generationTime: serviceResult.metadata.generationTime,
        });

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[CHAPTER API] ✅ Cache invalidated");

        console.log("✅ [CHAPTER API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: ApiChapterResponse = {
            success: true,
            chapter: serviceResult.chapter,
            metadata: {
                generationTime: serviceResult.metadata.generationTime,
                chapterIndex: serviceResult.metadata.chapterIndex,
                totalChapters: serviceResult.metadata.totalChapters,
            },
        };

        return NextResponse.json(response, { status: 201 });
    } catch (error) {
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("❌ [CHAPTER API] Error:", error);
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        if (error instanceof z.ZodError) {
            const errorResponse: ApiChapterErrorResponse = {
                error: "Invalid input",
                details: error.issues,
            };
            return NextResponse.json(errorResponse, { status: 400 });
        }

        const errorResponse: ApiChapterErrorResponse = {
            error: "Failed to generate and save chapter",
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
