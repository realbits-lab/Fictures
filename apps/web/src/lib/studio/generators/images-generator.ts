/**
 * Images Generator (Core Business Logic)
 *
 * Pure generation function - NO database operations, NO Vercel Blob uploads.
 * Orchestrates AI image generation and optimization.
 *
 * Following Adversity-Triumph Engine pattern:
 * - Generator layer: Core business logic only
 * - Service layer handles database operations and uploads
 * - API layer handles HTTP requests
 *
 * NOTE: This generator does NOT save to database or upload to Vercel Blob.
 * Database operations and uploads are handled by the caller (Service layer).
 */

import { createImageGenerationClient } from "@/lib/ai/image-generation";
import type {
    GeneratorImageParams,
    GeneratorImageResult,
} from "@/lib/schemas/generators/types";

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

    // 1. Create AI client (API key from auth context)
    const client = createImageGenerationClient();
    const providerType: string = client.getProviderType();

    console.log(`[images-generator] Using provider: ${providerType}`);

    // 2. Generate image via AI provider
    const result = await client.generate({
        prompt,
        aspectRatio,
        seed,
    });

    console.log(`[images-generator] ✓ Image generated successfully`);
    console.log(
        `[images-generator] Dimensions: ${result.width}×${result.height}`,
    );
    console.log(`[images-generator] Model: ${result.model}`);

    // 3. Fetch image data from provider URL
    const imageResponse: Response = await fetch(result.imageUrl);
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

    // 4. Return image data (caller handles upload and database save)
    return {
        imageUrl: result.imageUrl,
        imageBuffer,
        width: result.width,
        height: result.height,
        size: imageSize,
        aspectRatio,
        model: result.model,
        provider: result.provider,
        generationTime,
    };
}
