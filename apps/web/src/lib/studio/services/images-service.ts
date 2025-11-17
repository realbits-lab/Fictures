/**
 * Images Service (Orchestration Layer)
 *
 * Service layer for image generation with Vercel Blob upload and database persistence.
 * Follows Adversity-Triumph Engine architecture pattern.
 *
 * Architecture:
 * - Generator layer: Pure image generation (no DB, no uploads)
 * - Service layer: Orchestration, Blob uploads, DB operations (this file)
 * - API layer: HTTP requests
 *
 * Type Flow:
 * ApiImagesRequest (API Layer)
 *     ↓
 * ServiceImagesParams (Service Layer)
 *     ↓ imagesService.generateAndSave()
 * GeneratorImageParams (Generator Layer)
 *     ↓ generateImage()
 * GeneratorImageResult (Generator Layer)
 *     ↓ Upload to Vercel Blob + Optimize
 * ServiceImagesResult (Service Layer)
 *     ↓
 * ApiImagesResponse (API Layer)
 */

import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";
import type { AspectRatio } from "@/lib/schemas/domain/image";
import type {
    GeneratorImageParams,
    GeneratorImageResult,
    GeneratorImageType,
} from "@/lib/schemas/generators/types";
import {
    type OptimizedImageSet,
    optimizeImage,
} from "@/lib/studio/services/image-optimization-service";
import { getBlobPath } from "@/lib/utils/blob-path";
import { generateImage } from "../generators/images-generator";

// ============================================================================
// Service Layer Types
// ============================================================================

/**
 * Aspect ratio mapping for different image types
 */
const IMAGE_TYPE_ASPECT_RATIOS: Record<GeneratorImageType, AspectRatio> = {
    story: "16:9",
    character: "1:1",
    setting: "1:1",
    scene: "16:9",
    "comic-panel": "9:16",
};

const ITERATION_DIMENSIONS: Record<
    AspectRatio,
    { width: number; height: number }
> = {
    "16:9": { width: 1344, height: 756 },
    "1:1": { width: 896, height: 896 },
    "9:16": { width: 768, height: 1365 },
    "2:3": { width: 768, height: 1152 },
};

/**
 * Get aspect ratio for a given image type
 */
export function getAspectRatioForImageType(
    imageType: GeneratorImageType,
): AspectRatio {
    return IMAGE_TYPE_ASPECT_RATIOS[imageType];
}

function getIterationDimensions(
    aspectRatio: AspectRatio,
): { width: number; height: number } | undefined {
    return ITERATION_DIMENSIONS[aspectRatio];
}

/**
 * Service parameters for image generation
 *
 * Pattern: Maps from ApiImagesRequest
 */
export interface ServiceImagesParams {
    prompt: string;
    contentId: string; // Entity ID (storyId, characterId, settingId, or sceneId)
    imageType: GeneratorImageType;
    userId: string; // For authorization checks
    generationProfile?: "full" | "iteration";
}

/**
 * Service result for image generation
 *
 * Pattern: Maps to ApiImagesResponse
 */
export interface ServiceImagesResult {
    imageId: string;
    imageUrl: string; // Original Vercel Blob URL
    blobUrl: string; // Same as imageUrl (for compatibility)
    width: number;
    height: number;
    size: number;
    aspectRatio: AspectRatio;
    optimizedSet: OptimizedImageSet;
    isPlaceholder: boolean;
    model: string;
    provider: "gemini" | "ai-server";
    metadata: {
        generationTime: number;
        uploadTime: number;
        optimizationTime: number;
        dbUpdateTime: number;
        totalTime: number;
    };
}

// ============================================================================
// Images Service Class
// ============================================================================

export class ImagesService {
    /**
     * Generate image and save to database
     *
     * Following Adversity-Triumph Engine pattern:
     * 1. Determine aspect ratio
     * 2. Generate image via generator (pure generation, no upload)
     * 3. Upload original to Vercel Blob
     * 4. Create optimized variants
     * 5. Update database with imageUrl and imageVariants
     * 6. Return result with metadata
     *
     * @param params - Service parameters
     * @returns Service result with URLs and metadata
     */
    async generateAndSave(
        params: ServiceImagesParams,
    ): Promise<ServiceImagesResult> {
        const serviceStartTime = Date.now();
        const {
            prompt,
            contentId,
            imageType,
            userId,
            generationProfile = "full",
        } = params;

        const isIterationProfile = generationProfile === "iteration";

        console.log(
            `[images-service] 🎨 Generating and saving ${imageType} image for content ${contentId}`,
        );

        // 1. Determine aspect ratio (automatic by image type)
        const aspectRatio = getAspectRatioForImageType(imageType);

        console.log(`[images-service] Using aspect ratio: ${aspectRatio}`);

        // 2. Verify ownership before generating
        await this.verifyOwnership(contentId, imageType, userId);

        // 3. Generate image via generator (pure generation, no upload)
        const iterationDimensions = isIterationProfile
            ? getIterationDimensions(aspectRatio)
            : undefined;

        const generatorParams: GeneratorImageParams = {
            prompt,
            aspectRatio,
            imageType,
            ...(iterationDimensions ? { customDimensions: iterationDimensions } : {}),
            ...(isIterationProfile ? { inferenceSteps: 3 } : {}),
        };

        const generateResult: GeneratorImageResult =
            await generateImage(generatorParams);

        console.log(
            `[images-service] ✓ Image generated (${generateResult.generationTime}ms)`,
        );

        // 4. Upload original to Vercel Blob
        const uploadStartTime = Date.now();
        const blobPath = this.buildBlobPath(contentId, imageType);

        console.log(`[images-service] Uploading to Vercel Blob: ${blobPath}`);

        const blob = await put(blobPath, generateResult.imageBuffer, {
            access: "public",
            contentType: "image/png",
        });

        const uploadTime = Date.now() - uploadStartTime;

        console.log(
            `[images-service] ✓ Uploaded successfully (${uploadTime}ms)`,
        );
        console.log(`[images-service] Blob URL: ${blob.url}`);

        // 5. Generate optimized variants
        const optimizationStartTime = Date.now();

        console.log(`[images-service] Generating optimized variants...`);

        // Generate unique image ID
        const imageId = `img_${Date.now()}_${nanoid(8)}`;

        // Map GeneratorImageType to OptimizationImageType
        const optimizationImageType:
            | "story"
            | "scene"
            | "character"
            | "setting"
            | "panel" = imageType === "comic-panel" ? "panel" : imageType;

        const optimizedSet: OptimizedImageSet = await optimizeImage(
            blob.url,
            imageId,
            contentId,
            optimizationImageType,
            imageType === "scene" || imageType === "comic-panel"
                ? contentId
                : undefined,
            isIterationProfile ? { resolutions: ["1x"] } : undefined,
        );

        const optimizationTime = Date.now() - optimizationStartTime;

        console.log(
            `[images-service] ✓ Created ${optimizedSet.variants.length} variants (${optimizationTime}ms)`,
        );

        // 6. Update database with imageUrl and imageVariants
        const dbUpdateStartTime = Date.now();

        await this.updateDatabase(contentId, imageType, blob.url, optimizedSet);

        const dbUpdateTime = Date.now() - dbUpdateStartTime;

        console.log(`[images-service] ✓ Database updated (${dbUpdateTime}ms)`);

        const totalTime = Date.now() - serviceStartTime;

        console.log(
            `[images-service] ✅ Image generation complete (${totalTime}ms total)`,
        );

        // 7. Return result
        return {
            imageId,
            imageUrl: blob.url,
            blobUrl: blob.url,
            width: generateResult.width,
            height: generateResult.height,
            size: generateResult.size,
            aspectRatio,
            optimizedSet,
            isPlaceholder: false,
            model: generateResult.model,
            provider: generateResult.provider,
            metadata: {
                generationTime: generateResult.generationTime,
                uploadTime,
                optimizationTime,
                dbUpdateTime,
                totalTime,
            },
        };
    }

    /**
     * Verify user owns the content entity before generating image
     */
    private async verifyOwnership(
        contentId: string,
        imageType: GeneratorImageType,
        userId: string,
    ): Promise<void> {
        let authorId: string | undefined;

        if (imageType === "story") {
            const [story] = await db
                .select({ authorId: stories.authorId })
                .from(stories)
                .where(eq(stories.id, contentId))
                .limit(1);
            authorId = story?.authorId;
        } else if (imageType === "character") {
            // Characters reference story, need to check story.authorId
            const [character] = await db
                .select({ storyId: characters.storyId })
                .from(characters)
                .where(eq(characters.id, contentId))
                .limit(1);

            if (character) {
                const [story] = await db
                    .select({ authorId: stories.authorId })
                    .from(stories)
                    .where(eq(stories.id, character.storyId))
                    .limit(1);
                authorId = story?.authorId;
            }
        } else if (imageType === "setting") {
            // Settings reference story, need to check story.authorId
            const [setting] = await db
                .select({ storyId: settings.storyId })
                .from(settings)
                .where(eq(settings.id, contentId))
                .limit(1);

            if (setting) {
                const [story] = await db
                    .select({ authorId: stories.authorId })
                    .from(stories)
                    .where(eq(stories.id, setting.storyId))
                    .limit(1);
                authorId = story?.authorId;
            }
        } else if (imageType === "scene" || imageType === "comic-panel") {
            // Scenes reference chapter → part → story, need to check story.authorId
            const [scene] = await db
                .select({
                    chapterId: scenes.chapterId,
                })
                .from(scenes)
                .where(eq(scenes.id, contentId))
                .limit(1);

            if (scene) {
                // Query story through joins
                const [result] = await db
                    .select({ authorId: stories.authorId })
                    .from(scenes)
                    .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
                    .innerJoin(stories, eq(chapters.storyId, stories.id))
                    .where(eq(scenes.id, contentId))
                    .limit(1);

                authorId = result?.authorId;
            }
        }

        if (!authorId) {
            throw new Error(`Content not found: ${contentId}`);
        }

        if (authorId !== userId) {
            throw new Error(
                `Unauthorized: User ${userId} does not own content ${contentId}`,
            );
        }
    }

    /**
     * Update database with image URL and variants
     */
    private async updateDatabase(
        contentId: string,
        imageType: GeneratorImageType,
        imageUrl: string,
        imageVariants: OptimizedImageSet,
    ): Promise<void> {
        const now = new Date().toISOString();

        if (imageType === "story") {
            await db
                .update(stories)
                .set({
                    imageUrl,
                    imageVariants,
                    updatedAt: now,
                })
                .where(eq(stories.id, contentId));
        } else if (imageType === "character") {
            await db
                .update(characters)
                .set({
                    imageUrl,
                    imageVariants,
                    updatedAt: now,
                })
                .where(eq(characters.id, contentId));
        } else if (imageType === "setting") {
            await db
                .update(settings)
                .set({
                    imageUrl,
                    imageVariants,
                    updatedAt: now,
                })
                .where(eq(settings.id, contentId));
        } else if (imageType === "scene" || imageType === "comic-panel") {
            await db
                .update(scenes)
                .set({
                    imageUrl,
                    imageVariants,
                    updatedAt: now,
                })
                .where(eq(scenes.id, contentId));
        }
    }

    /**
     * Build Vercel Blob path for image
     */
    private buildBlobPath(
        contentId: string,
        imageType: GeneratorImageType,
    ): string {
        const timestamp = Date.now();

        let path: string;

        if (imageType === "story") {
            path = `stories/${contentId}/story/original/${timestamp}.png`;
        } else if (imageType === "character") {
            path = `stories/${contentId}/character/original/${timestamp}.png`;
        } else if (imageType === "setting") {
            path = `stories/${contentId}/setting/original/${timestamp}.png`;
        } else if (imageType === "scene") {
            path = `stories/${contentId}/scene/original/${timestamp}.png`;
        } else if (imageType === "comic-panel") {
            path = `stories/${contentId}/panel/original/${timestamp}.png`;
        } else {
            path = `stories/${contentId}/${imageType}/original/${timestamp}.png`;
        }

        // Apply environment prefix (develop/ or main/)
        return getBlobPath(path);
    }
}

// Export singleton instance
export const imagesService = new ImagesService();
