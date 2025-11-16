/**
 * Images Generator (Core Business Logic)
 *
 * Pure generation function - NO database operations, NO Vercel Blob uploads.
 * Calls AI server directly with authentication context.
 *
 * Following Adversity-Triumph Engine pattern:
 * - Generator layer: Core business logic only
 * - Service layer handles database operations and uploads
 * - API layer handles HTTP requests
 *
 * NOTE: This generator does NOT save to database or upload to Vercel Blob.
 * Database operations and uploads are handled by the caller (Service layer).
 */

import { getApiKey } from "@/lib/auth/server-context";
import type { AspectRatio } from "@/lib/schemas/domain/image";
import type {
    GeneratorImageParams,
    GeneratorImageResult,
} from "@/lib/schemas/generators/types";

/**
 * Get dimensions for aspect ratio
 */
function getImageDimensions(aspectRatio: AspectRatio): {
    width: number;
    height: number;
} {
    const dimensionsMap: Record<
        AspectRatio,
        { width: number; height: number }
    > = {
        "1:1": { width: 1024, height: 1024 },
        "16:9": { width: 1664, height: 936 },
        "9:16": { width: 928, height: 1664 },
        "2:3": { width: 832, height: 1248 },
    };
    return dimensionsMap[aspectRatio];
}

/**
 * Generate image using AI provider
 *
 * This is a pure generation function that:
 * 1. Creates AI client
 * 2. Generates image via AI provider
 * 3. Fetches image data
 * 4. Returns image data (NO upload, NO database save)
 *
 * Now uses authentication context instead of passing API keys as parameters.
 *
 * @param params - Image generation parameters
 * @returns Image generation result (caller handles upload/save)
 */
export async function generateImage(
    params: GeneratorImageParams,
): Promise<GeneratorImageResult> {
    const startTime: number = Date.now();
    const { prompt, aspectRatio, seed, imageType }: GeneratorImageParams =
        params;

    console.log(`[images-generator] 🎨 Generating ${imageType} image`);
    console.log(`[images-generator] Aspect ratio: ${aspectRatio}`);
    console.log(
        `[images-generator] Prompt preview: ${prompt.substring(0, 100)}...`,
    );

    // 1. Get API key from auth context
    const apiKey = getApiKey();

    if (!apiKey) {
        console.error(
            "[images-generator] ERROR: No API key found in authentication context!",
        );
        throw new Error("No API key available for AI server image generation");
    }

    console.log(
        "[images-generator] API key from context:",
        `${apiKey.substring(0, 10)}...`,
    );

    // 2. Get dimensions for aspect ratio
    const dimensions = getImageDimensions(aspectRatio);
    console.log(
        `[images-generator] Dimensions: ${dimensions.width}×${dimensions.height}`,
    );

    // 3. Call AI server directly
    const aiServerUrl =
        process.env.AI_SERVER_IMAGE_URL || "http://localhost:8000";
    const timeout = parseInt(
        process.env.AI_SERVER_IMAGE_TIMEOUT || "120000",
        10,
    );

    console.log(`[images-generator] Calling AI server: ${aiServerUrl}`);

    const response = await fetch(`${aiServerUrl}/api/v1/images/generate`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify({
            prompt,
            width: dimensions.width,
            height: dimensions.height,
            num_inference_steps: 4,
            guidance_scale: 1.0,
            seed,
        }),
        signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`AI Server error: ${response.status} - ${error}`);
    }

    const result = await response.json();

    console.log(`[images-generator] ✓ Image generated successfully`);
    console.log(`[images-generator] Model: ${result.model}`);

    // 4. Fetch image data from AI server URL
    const imageResponse: Response = await fetch(result.image_url);
    if (!imageResponse.ok) {
        throw new Error(
            `Failed to fetch generated image: ${imageResponse.statusText}`,
        );
    }

    const imageBuffer: ArrayBuffer = await imageResponse.arrayBuffer();
    const imageSize: number = imageBuffer.byteLength;

    console.log(
        `[images-generator] Image size: ${(imageSize / 1024 / 1024).toFixed(2)} MB`,
    );

    const generationTime: number = Date.now() - startTime;

    console.log(
        `[images-generator] ✓ Generation complete (${generationTime}ms)`,
    );

    // 5. Return image data (caller handles upload and database save)
    return {
        imageUrl: result.image_url,
        imageBuffer,
        width: result.width,
        height: result.height,
        size: imageSize,
        aspectRatio,
        model: result.model,
        provider: "ai-server",
        generationTime,
    };
}
