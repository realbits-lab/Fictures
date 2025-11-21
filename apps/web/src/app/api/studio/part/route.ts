import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireScopes } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import type {
    ApiPartErrorResponse,
    ApiPartRequest,
    ApiPartResponse,
} from "@/lib/schemas/api/studio";
import { partService } from "@/lib/studio/services/part-service";

export const runtime = "nodejs";

const generatePartSchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
});

/**
 * POST /api/studio/part - Generate ONE next part (Extreme Incremental)
 *
 * Generates the next part in sequence with full context of all previous parts.
 * This is the extreme incremental approach where parts are generated one at a time.
 */
export const POST = requireScopes("stories:write")(
    async (request: NextRequest) => {
        try {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🎬 [PART API] POST request received (Singular)");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [PART API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // 2. Parse and validate request body with type safety
            const body: ApiPartRequest =
                (await request.json()) as ApiPartRequest;
            const validatedData: z.infer<typeof generatePartSchema> =
                generatePartSchema.parse(body);

            console.log("[PART API] Request parameters:", {
                storyId: validatedData.storyId,
            });

            // 3. Generate using service (handles fetch, validation, generation, persistence)
            // API key is automatically retrieved from context
            console.log("[PART API] 🤖 Calling part service (singular)...");
            const serviceResult = await partService.generateAndSave({
                storyId: validatedData.storyId,
                userId: auth.userId!,
            });

            console.log("[PART API] ✅ Part generation and save completed:", {
                partId: serviceResult.part.id,
                title: serviceResult.part.title,
                partIndex: serviceResult.metadata.partIndex,
                totalParts: serviceResult.metadata.totalParts,
                generationTime: serviceResult.metadata.generationTime,
            });

            // 4. Invalidate cache
            await invalidateStudioCache(auth.userId!);
            console.log("[PART API] ✅ Cache invalidated");

            console.log("✅ [PART API] Request completed successfully");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 5. Return typed response
            const response: ApiPartResponse = {
                success: true,
                part: serviceResult.part,
                metadata: {
                    generationTime: serviceResult.metadata.generationTime,
                    partIndex: serviceResult.metadata.partIndex,
                    totalParts: serviceResult.metadata.totalParts,
                },
            };

            return NextResponse.json(response, { status: 201 });
        } catch (error) {
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.error("❌ [PART API] Error:", error);
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            if (error instanceof z.ZodError) {
                const errorResponse: ApiPartErrorResponse = {
                    error: "Invalid input",
                    details: error.issues,
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            const errorResponse: ApiPartErrorResponse = {
                error: "Failed to generate and save part",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    },
);
