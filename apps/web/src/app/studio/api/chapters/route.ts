/**
 * Chapters API Route
 *
 * POST /studio/api/chapters - Generate chapters using AI
 *
 * Authentication: Dual auth (API key OR session) with stories:write scope required
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { invalidateStudioCache } from "@/lib/db/studio-queries";
import { chapterService } from "@/lib/studio/services";
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

        // 4. Generate using service (handles fetch, validation, generation, persistence)
        console.log("[CHAPTERS API] 🤖 Calling chapter service...");
        const serviceResult = await chapterService.generateAndSave({
            storyId: validatedData.storyId,
            chaptersPerPart: validatedData.chaptersPerPart,
            userId: authResult.user.id,
        });

        console.log(
            "[CHAPTERS API] ✅ Chapters generation and save completed:",
            {
                count: serviceResult.chapters.length,
                generationTime: serviceResult.metadata.generationTime,
            },
        );

        // 5. Invalidate cache
        await invalidateStudioCache(authResult.user.id);
        console.log("[CHAPTERS API] ✅ Cache invalidated");

        console.log("✅ [CHAPTERS API] Request completed successfully");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // 6. Return typed response
        const response: GenerateChaptersResponse = {
            success: true,
            chapters: serviceResult.chapters,
            metadata: {
                totalGenerated: serviceResult.chapters.length,
                generationTime: serviceResult.metadata.generationTime,
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
