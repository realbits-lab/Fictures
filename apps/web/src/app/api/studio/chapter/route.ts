import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiChapterErrorResponse,
    ApiChapterRequest,
    ApiChapterResponse,
} from "@/lib/schemas/api/studio";
import { chapterService } from "@/lib/studio/services/chapter-service";

export const runtime = "nodejs";

const generateChapterSchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
    partId: z.string().min(1, "partId is required"),
    promptVersion: z.string().optional(), // Optional chapter prompt version (e.g., "v1.1")
});

/**
 * POST /api/studio/chapter - Generate ONE next chapter (Extreme Incremental)
 *
 * Generates the next chapter in sequence with full context of all previous chapters.
 * This is the extreme incremental approach where chapters are generated one at a time.
 */
export const POST = requireScopes("stories:write")(
    withAuthentication(async (request: NextRequest) => {
        try {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("📖 [CHAPTER API] POST request received (Singular)");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [CHAPTER API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // 2. Parse and validate request body with type safety
            const body: ApiChapterRequest =
                (await request.json()) as ApiChapterRequest;
            const validatedData: z.infer<typeof generateChapterSchema> =
                generateChapterSchema.parse(body);

            console.log("[CHAPTER API] Request parameters:", {
                storyId: validatedData.storyId,
                partId: validatedData.partId,
            });

            // 3. Generate using service (handles fetch, validation, generation, persistence)
            // API key is automatically retrieved from context
            console.log(
                "[CHAPTER API] 🤖 Calling chapter service (singular)...",
            );
            const serviceResult = await chapterService.generateAndSave({
                storyId: validatedData.storyId,
                partId: validatedData.partId,
                userId: auth.userId!,
                promptVersion: validatedData.promptVersion, // Pass chapter prompt version to service
            });

            console.log(
                "[CHAPTER API] ✅ Chapter generation and save completed:",
                {
                    chapterId: serviceResult.chapter.id,
                    title: serviceResult.chapter.title,
                    chapterIndex: serviceResult.metadata.chapterIndex,
                    totalChapters: serviceResult.metadata.totalChapters,
                    generationTime: serviceResult.metadata.generationTime,
                },
            );

            // 4. Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[CHAPTER API] ✅ Cache invalidated");

            console.log("✅ [CHAPTER API] Request completed successfully");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 5. Return typed response
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
                console.error("[CHAPTER API] Zod Validation Error Details:");
                error.issues.forEach((issue, index) => {
                    console.error(`  Issue ${index + 1}:`, {
                        path: issue.path,
                        message: issue.message,
                        code: issue.code,
                        expected: (issue as any).expected,
                        received: (issue as any).received,
                    });
                });
                const errorResponse: ApiChapterErrorResponse = {
                    error: "Invalid input",
                    details: error.issues,
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            const errorResponse: ApiChapterErrorResponse = {
                error: "Failed to generate and save chapter",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);
