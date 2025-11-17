/**
 * Images API Route
 *
 * API Layer for image generation following Adversity-Triumph Engine architecture.
 * Handles HTTP requests and maps to service layer.
 *
 * Architecture:
 * API Layer (this file) → Service Layer (images-service.ts) → Generator Layer (images-generator.ts)
 *
 * Type Flow:
 * ApiImagesRequest (HTTP body)
 *     ↓
 * ServiceImagesParams (service input)
 *     ↓ imagesService.generateAndSave()
 * ServiceImagesResult (service output)
 *     ↓
 * ApiImagesResponse (HTTP response)
 */

import { type NextRequest, NextResponse } from "next/server";
import { requireScopes, withAuthentication } from "@/lib/auth/middleware";
import { getAuth } from "@/lib/auth/server-context";
import type {
    ApiImagesErrorResponse,
    ApiImagesRequest,
    ApiImagesResponse,
} from "@/lib/schemas/api/studio";
import { generateImagesSchema } from "@/lib/schemas/api/studio";
import { imagesService } from "@/lib/studio/services/images-service";

export const runtime = "nodejs";

/**
 * POST /api/studio/images - Generate image for story assets
 *
 * Generates images for story covers, characters, settings, and scenes using Gemini 2.5 Flash Image.
 * Automatically creates optimized variants (2 AVIF variants: mobile 1x/2x).
 *
 * Dimensions by type:
 * - story: 16:9 (1664×936)
 * - character: 1:1 (832×832)
 * - setting: 1:1 (832×832)
 * - scene: 16:9 (1664×936)
 * - comic-panel: 9:16 (936×1664)
 *
 * Optimization: 2 AVIF variants (mobile 1x + 2x)
 */
export const POST = requireScopes("images:write")(
    withAuthentication(async (request: NextRequest) => {
        try {
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🎨 [IMAGES API] POST request received");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            // 1. Get authentication from context
            const auth = getAuth();

            console.log("✅ [IMAGES API] Authentication successful:", {
                type: auth.type,
                userId: auth.userId,
                email: auth.email,
            });

            // 2. Parse and validate request body
            const body: ApiImagesRequest =
                (await request.json()) as ApiImagesRequest;

            console.log("[IMAGES API] Request parameters:", {
                prompt: body.prompt?.substring(0, 100) || "(empty)",
                contentId: body.contentId,
                imageType: body.imageType,
            });

            // 3. Validate using Zod schema
            const validationResult = generateImagesSchema.safeParse(body);

            if (!validationResult.success) {
                console.error(
                    "❌ [IMAGES API] Validation failed:",
                    validationResult.error.issues,
                );
                const errorResponse: ApiImagesErrorResponse = {
                    error: "Validation failed",
                    details: validationResult.error.issues
                        .map((e) => `${e.path.join(".")}: ${e.message}`)
                        .join(", "),
                };
                return NextResponse.json(errorResponse, { status: 400 });
            }

            const { prompt, contentId, imageType, generationProfile } =
                validationResult.data;

            console.log("✅ [IMAGES API] Validation passed");

            // 4. Call service layer (handles generation, upload, DB persistence)
            console.log("[IMAGES API] 🎨 Calling images service...");

            const serviceResult = await imagesService.generateAndSave({
                prompt,
                contentId,
                imageType,
                userId: auth.userId!,
                generationProfile,
            });

            console.log(
                "[IMAGES API] ✅ Image generation and save completed:",
                {
                    imageId: serviceResult.imageId,
                    imageUrl: serviceResult.imageUrl,
                    totalTime: serviceResult.metadata.totalTime,
                },
            );

            console.log("✅ [IMAGES API] Request completed successfully");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            // 5. Map ServiceImagesResult to ApiImagesResponse
            const response: ApiImagesResponse = {
                success: true,
                imageType,
                imageId: serviceResult.imageId,
                originalUrl: serviceResult.imageUrl,
                blobUrl: serviceResult.blobUrl,
                dimensions: {
                    width: serviceResult.width,
                    height: serviceResult.height,
                },
                size: serviceResult.size,
                aspectRatio: serviceResult.aspectRatio,
                model: serviceResult.model,
                provider: serviceResult.provider,
                optimizedSet: serviceResult.optimizedSet,
                isPlaceholder: serviceResult.isPlaceholder,
                metadata: serviceResult.metadata,
            };

            return NextResponse.json(response, { status: 201 });
        } catch (error) {
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.error("❌ [IMAGES API] Error:", error);
            console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            const errorResponse: ApiImagesErrorResponse = {
                error: "Failed to generate image",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            };

            return NextResponse.json(errorResponse, { status: 500 });
        }
    }),
);
