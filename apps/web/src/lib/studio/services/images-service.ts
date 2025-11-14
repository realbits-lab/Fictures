/**
 * Images Service (Orchestration Layer)
 *
 * Service layer for generating and saving story images with optimization.
 * Handles database operations and Vercel Blob uploads.
 *
 * Following Adversity-Triumph Engine pattern:
 * - Generator layer: Pure generation logic (no DB, no uploads)
 * - Service layer: Orchestration, DB operations, uploads
 * - API layer: HTTP requests
 */

import { put } from "@vercel/blob";
import type { AspectRatio } from "@/lib/schemas/domain/image";
import type { GeneratorImageType } from "@/lib/schemas/generators/types";
import {
    type OptimizedImageSet,
    optimizeImage,
} from "@/lib/services/image-optimization";
import { getBlobPath } from "@/lib/utils/blob-path";
import { generateImage } from "../generators/images-generator";

/**
 * Image type for service layer
 */
export type ServiceImageType = GeneratorImageType;

/**
 * Aspect ratio mapping for different image types
 */
const IMAGE_TYPE_ASPECT_RATIOS: Record<ServiceImageType, AspectRatio> = {
    story: "16:9",
    character: "1:1",
    setting: "1:1",
    scene: "16:9",
    "comic-panel": "9:16",
};

/**
 * Get aspect ratio for a given image type
 */
export function getAspectRatioForImageType(
    imageType: ServiceImageType,
): AspectRatio {
    return IMAGE_TYPE_ASPECT_RATIOS[imageType];
}

/**
 * Service parameters for image generation
 */
export interface ServiceImageParams {
    prompt: string;
    storyId: string;
    imageType: ServiceImageType;
    chapterId?: string;
    sceneId?: string;
    panelNumber?: number;
    style?: "vivid" | "natural";
    quality?: "standard" | "hd";
    seed?: number;
    aspectRatio?: AspectRatio; // Optional override
}

/**
 * Service result for image generation
 */
export interface ServiceImageResult {
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
        optimizationTime: number;
        uploadTime: number;
        totalTime: number;
    };
}

/**
 * Images Service Class
 */
export class ImagesService {
    /**
     * Generate and save image with automatic optimization
     *
     * This method:
     * 1. Calls generator to create image
     * 2. Uploads original to Vercel Blob
     * 3. Creates optimized variants
     * 4. Returns URLs and metadata (caller saves to database)
     */
    async generateAndUpload(
        params: ServiceImageParams,
    ): Promise<ServiceImageResult> {
        const serviceStartTime: number = Date.now();
        const {
            prompt,
            storyId,
            imageType,
            chapterId,
            sceneId,
            panelNumber,
            seed,
            aspectRatio: aspectRatioOverride,
        }: ServiceImageParams = params;

        console.log(
            `[images-service] =� Generating and uploading ${imageType} image for story ${storyId}`,
        );

        // 1. Determine aspect ratio
        const aspectRatio: AspectRatio =
            aspectRatioOverride || getAspectRatioForImageType(imageType);

        console.log(`[images-service] Using aspect ratio: ${aspectRatio}`);

        // 2. Generate image via generator (pure generation, no upload)
        const generateResult = await generateImage({
            prompt,
            aspectRatio,
            seed,
            imageType,
        });

        console.log(
            `[images-service]  Image generated (${generateResult.generationTime}ms)`,
        );

        // 3. Upload original to Vercel Blob
        const uploadStartTime: number = Date.now();
        const blobPath: string = this.buildBlobPath({
            storyId,
            imageType,
            chapterId,
            sceneId,
            panelNumber,
        });

        console.log(`[images-service] Uploading to Vercel Blob: ${blobPath}`);

        const blob = await put(blobPath, generateResult.imageBuffer, {
            access: "public",
            contentType: "image/png",
        });

        const uploadTime: number = Date.now() - uploadStartTime;

        console.log(
            `[images-service]  Uploaded successfully (${uploadTime}ms)`,
        );
        console.log(`[images-service] Blob URL: ${blob.url}`);

        // 4. Generate optimized variants
        const optimizationStartTime: number = Date.now();

        console.log(`[images-service] Generating optimized variants...`);

        // Generate unique image ID
        const imageId: string = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
            storyId,
            optimizationImageType,
            sceneId,
        );

        const optimizationTime: number = Date.now() - optimizationStartTime;

        console.log(
            `[images-service]  Created ${optimizedSet.variants.length} variants (${optimizationTime}ms)`,
        );

        const totalTime: number = Date.now() - serviceStartTime;

        console.log(
            `[images-service]  Image generation complete (${totalTime}ms total)`,
        );

        // 5. Return result (caller saves to database)
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
                optimizationTime,
                uploadTime,
                totalTime,
            },
        };
    }

    /**
     * Build Vercel Blob path for image
     */
    private buildBlobPath(params: {
        storyId: string;
        imageType: ServiceImageType;
        chapterId?: string;
        sceneId?: string;
        panelNumber?: number;
    }): string {
        const { storyId, imageType, chapterId, sceneId, panelNumber } = params;

        let path: string;

        if (imageType === "story") {
            path = `stories/${storyId}/cover.png`;
        } else if (imageType === "character") {
            path = `stories/${storyId}/characters/${Date.now()}.png`;
        } else if (imageType === "setting") {
            path = `stories/${storyId}/settings/${Date.now()}.png`;
        } else if (imageType === "scene" && chapterId && sceneId) {
            path = `stories/${storyId}/chapters/${chapterId}/scenes/${sceneId}/image.png`;
        } else if (
            imageType === "comic-panel" &&
            sceneId &&
            panelNumber !== undefined
        ) {
            path = `stories/${storyId}/comics/${sceneId}/panel-${panelNumber}.png`;
        } else {
            path = `stories/${storyId}/${imageType}/${Date.now()}.png`;
        }

        // Apply environment prefix (develop/ or main/)
        return getBlobPath(path);
    }
}

// Export singleton instance
export const imagesService = new ImagesService();
