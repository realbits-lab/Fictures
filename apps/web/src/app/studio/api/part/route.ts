import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { partService } from "@/lib/studio/services/part-service";
import type {
    ApiPartErrorResponse,
    ApiPartRequest,
    ApiPartResponse,
} from "../types";

export const runtime = "nodejs";

const generatePartSchema = z.object({
    storyId: z.string().min(1, "storyId is required"),
});

/**
 * POST /studio/api/part - Generate ONE next part (Extreme Incremental)
 *
 * Generates the next part in sequence with full context of all previous parts.
 * This is the extreme incremental approach where parts are generated one at a time.
 */
export async function POST(request: NextRequest) {
    try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🎬 [PART API] POST request received (Singular)");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        // 1. Authenticate the request
        const authResult: Awaited<ReturnType<typeof authenticateRequest>> =
            await authenticateRequest(request);

        if (!authResult) {
            console.error("❌ [PART API] Authentication failed");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // 2. Check if user has permission to write stories
        if (!hasRequiredScope(authResult, "stories:write")) {
            console.error("❌ [PART API] Insufficient scopes:", {
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

        console.log("✅ [PART API] Authentication successful:", {
            type: authResult.type,
            userId: authResult.user.id,
            email: authResult.user.email,
        });

        // 3. Parse and validate request body with type safety
        const body: ApiPartRequest = (await request.json()) as ApiPartRequest;
        const validatedData: z.infer<typeof generatePartSchema> =
            generatePartSchema.parse(body);

        console.log("[PART API] Request parameters:", {
            storyId: validatedData.storyId,
        });

        // 4. Extract API key from request header (for AI server authentication)
        const apiKey: string | null = request.headers.get("x-api-key");
        console.log("[PART API] API key provided:", !!apiKey);

        // 5. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[PART API] 🤖 Calling part service (singular)...");
        const serviceResult = await partService.generateAndSave({
            storyId: validatedData.storyId,
            userId: authResult.user.id,
            apiKey: apiKey || undefined,
        });

        console.log("[PART API] ✅ Part generation and save completed:", {
            partId: serviceResult.part.id,
            title: serviceResult.part.title,
            partIndex: serviceResult.metadata.partIndex,
            totalParts: serviceResult.metadata.totalParts,
            generationTime: serviceResult.metadata.generationTime,
        });

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[PART API] ✅ Cache invalidated");

        console.log("✅ [PART API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
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
            details: error instanceof Error ? error.message : "Unknown error",
        };

        return NextResponse.json(errorResponse, { status: 500 });
    }
}
