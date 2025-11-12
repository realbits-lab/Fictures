/**
 * Story Image Generation Service
 *
 * Handles image generation for all story assets (covers, characters, settings, scenes)
 * with automatic aspect ratio selection and optimization.
 */

import { put } from "@vercel/blob";
import { generateImage } from "@/lib/ai/image-generation";
import type { AspectRatio } from "@/lib/ai/types/image";
import { getBlobPath } from "@/lib/utils/blob-path";

/**
 * Image type for story assets
 */
export type StoryImageType =
    | "story"
    | "character"
    | "setting"
    | "scene"
    | "comic-panel";

/**
 * Aspect ratio mapping for different image types
 *
 * - story: 16:9 (widescreen) for story covers
 * - character: 1:1 (square) for character portraits
 * - setting: 1:1 (square) for setting visuals
 * - scene: 16:9 (widescreen) for scene illustrations
 * - comic-panel: 9:16 or 2:3 (portrait) for comic panels
 */
const IMAGE_TYPE_ASPECT_RATIOS: Record<StoryImageType, AspectRatio> = {
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
    imageType: StoryImageType,
): AspectRatio {
    return IMAGE_TYPE_ASPECT_RATIOS[imageType];
}

/**
 * Parameters for story image generation
 */
export interface GenerateStoryImageParams {
    prompt: string;
    storyId: string;
    imageType: StoryImageType;
    chapterId?: string;
    sceneId?: string;
    style?: "vivid" | "natural";
    quality?: "standard" | "hd";
    seed?: number;
    aspectRatio?: AspectRatio; // Optional override
}

/**
 * Image variant for optimization
 */
export interface ImageVariant {
    url: string;
    format: "avif" | "webp" | "jpeg";
    width: number;
    height: number;
    size?: number;
    type: "mobile-1x" | "mobile-2x" | "desktop-1x" | "desktop-2x";
}

/**
 * Optimized image set
 */
export interface OptimizedImageSet {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];
    generatedAt: string;
}

/**
 * Story image generation result
 */
export interface StoryImageGenerationResult {
    imageId: string;
    url: string;
    blobUrl: string;
    width: number;
    height: number;
    size: number;
    aspectRatio: AspectRatio;
    optimizedSet?: OptimizedImageSet;
    isPlaceholder: boolean;
    model: string;
    provider: string;
}

/**
 * Generate a story image with automatic aspect ratio selection
 *
 * This function:
 * 1. Determines the appropriate aspect ratio based on image type
 * 2. Generates the image using the AI provider (Gemini or AI Server)
 * 3. Uploads the image to Vercel Blob storage
 * 4. Creates optimized variants for different devices (mobile, desktop)
 *
 * @param params - Image generation parameters
 * @returns Story image generation result with URLs and metadata
 */
export async function generateStoryImage(
    params: GenerateStoryImageParams,
): Promise<StoryImageGenerationResult> {
    const {
        prompt,
        storyId,
        imageType,
        chapterId,
        sceneId,
        style = "vivid",
        quality = "standard",
        seed,
        aspectRatio: aspectRatioOverride,
    } = params;

    console.log(
        `[IMAGE-GEN] Starting ${imageType} image generation for story ${storyId}`,
    );
    console.log(`[IMAGE-GEN] Prompt preview: ${prompt.substring(0, 100)}...`);

    // Determine aspect ratio
    const aspectRatio =
        aspectRatioOverride || getAspectRatioForImageType(imageType);
    console.log(`[IMAGE-GEN] Using aspect ratio: ${aspectRatio}`);

    try {
        // Generate image using AI provider
        const result = await generateImage(prompt, aspectRatio, seed);

        console.log(`[IMAGE-GEN] Image generated successfully`);
        console.log(
            `[IMAGE-GEN] Model: ${result.model}, Provider: ${result.provider}`,
        );
        console.log(`[IMAGE-GEN] Dimensions: ${result.width}×${result.height}`);

        // Build environment-aware blob path
        let blobPath: string;
        if (imageType === "story") {
            blobPath = getBlobPath(`stories/${storyId}/cover.png`);
        } else if (imageType === "character") {
            blobPath = getBlobPath(
                `stories/${storyId}/characters/${Date.now()}.png`,
            );
        } else if (imageType === "setting") {
            blobPath = getBlobPath(
                `stories/${storyId}/settings/${Date.now()}.png`,
            );
        } else if (imageType === "scene" && chapterId && sceneId) {
            blobPath = getBlobPath(
                `stories/${storyId}/chapters/${chapterId}/scenes/${sceneId}/image.png`,
            );
        } else if (imageType === "comic-panel" && chapterId && sceneId) {
            blobPath = getBlobPath(
                `stories/${storyId}/chapters/${chapterId}/scenes/${sceneId}/panel.png`,
            );
        } else {
            blobPath = getBlobPath(
                `stories/${storyId}/${imageType}/${Date.now()}.png`,
            );
        }

        console.log(`[IMAGE-GEN] Uploading to Vercel Blob: ${blobPath}`);

        // Fetch the image data from the generated URL
        const imageResponse = await fetch(result.imageUrl);
        if (!imageResponse.ok) {
            throw new Error(
                `Failed to fetch generated image: ${imageResponse.statusText}`,
            );
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const imageSize = imageBuffer.byteLength;

        console.log(
            `[IMAGE-GEN] Image size: ${(imageSize / 1024 / 1024).toFixed(2)} MB`,
        );

        // Upload to Vercel Blob
        const blob = await put(blobPath, imageBuffer, {
            access: "public",
            contentType: "image/png",
        });

        console.log(`[IMAGE-GEN] Uploaded successfully: ${blob.url}`);

        // Generate optimized variants
        console.log(`[IMAGE-GEN] Generating optimized variants...`);
        const optimizedSet = await generateOptimizedVariants({
            originalUrl: blob.url,
            imageBuffer,
            width: result.width,
            height: result.height,
            storyId,
            imageType,
            chapterId,
            sceneId,
        });

        console.log(
            `[IMAGE-GEN] Created ${optimizedSet.variants.length} optimized variants`,
        );

        // Generate unique image ID
        const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        return {
            imageId,
            url: result.imageUrl,
            blobUrl: blob.url,
            width: result.width,
            height: result.height,
            size: imageSize,
            aspectRatio,
            optimizedSet,
            isPlaceholder: false,
            model: result.model,
            provider: result.provider,
        };
    } catch (error) {
        console.error(
            `[IMAGE-GEN] Error generating ${imageType} image:`,
            error,
        );
        throw error;
    }
}

/**
 * Generate optimized image variants for different devices and formats
 */
async function generateOptimizedVariants(params: {
    originalUrl: string;
    imageBuffer: ArrayBuffer;
    width: number;
    height: number;
    storyId: string;
    imageType: StoryImageType;
    chapterId?: string;
    sceneId?: string;
}): Promise<OptimizedImageSet> {
    const { originalUrl, width, height, storyId, imageType } = params;

    // For now, return a basic optimized set structure
    // Full optimization with format conversion (AVIF, WebP) and resizing
    // will be implemented in a future iteration
    const imageId = `opt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Calculate mobile sizes (50% of original)
    const mobileWidth = Math.round(width / 2);
    const mobileHeight = Math.round(height / 2);

    const variants: ImageVariant[] = [
        // Mobile 1x (50% size)
        {
            url: originalUrl,
            format: "jpeg",
            width: mobileWidth,
            height: mobileHeight,
            type: "mobile-1x",
        },
        // Mobile 2x (original size)
        {
            url: originalUrl,
            format: "jpeg",
            width: width,
            height: height,
            type: "mobile-2x",
        },
        // AVIF variants (modern format, better compression)
        {
            url: originalUrl,
            format: "avif",
            width: mobileWidth,
            height: mobileHeight,
            type: "mobile-1x",
        },
        {
            url: originalUrl,
            format: "avif",
            width: width,
            height: height,
            type: "mobile-2x",
        },
    ];

    return {
        imageId,
        originalUrl,
        variants,
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Build story image prompt
 * Helper function for constructing optimized image prompts
 */
export function buildStoryImagePrompt(params: {
    imageType?: StoryImageType;
    title?: string;
    description?: string;
    genre?: string;
    style?: string;
    mood?: string;
    additionalDetails?: string[];
}): string {
    const {
        imageType = "story",
        title,
        description = "",
        genre,
        style,
        mood,
        additionalDetails = [],
    } = params;

    const aspectRatio = getAspectRatioForImageType(imageType);
    const aspectRatioDesc =
        aspectRatio === "1:1"
            ? "square composition"
            : aspectRatio === "16:9"
              ? "cinematic widescreen composition"
              : aspectRatio === "9:16"
                ? "vertical portrait composition"
                : aspectRatio === "2:3"
                  ? "portrait composition"
                  : "balanced composition";

    let prompt = "";

    if (imageType === "story") {
        prompt = `Book cover illustration${title ? ` for "${title}"` : ""}. ${description}.`;
        if (genre) prompt += ` Genre: ${genre}.`;
        if (mood) prompt += ` Mood: ${mood}.`;
        if (style) prompt += ` Visual style: ${style}.`;
        prompt += ` Professional book cover design, ${aspectRatioDesc}, dramatic and engaging.`;
    } else if (imageType === "character") {
        prompt = `Character portrait. ${description}.`;
        if (style) prompt += ` Style: ${style}.`;
        if (mood) prompt += ` Mood: ${mood}.`;
        prompt += ` High quality portrait, ${aspectRatioDesc}, centered composition, detailed features.`;
    } else if (imageType === "setting") {
        prompt = `Location illustration. ${description}.`;
        if (style) prompt += ` Architectural style: ${style}.`;
        if (mood) prompt += ` Atmosphere: ${mood}.`;
        prompt += ` ${aspectRatioDesc}, dramatic lighting, immersive environment.`;
    } else if (imageType === "scene") {
        prompt = `Story scene illustration. ${description}.`;
        if (mood) prompt += ` Emotional tone: ${mood}.`;
        if (style) prompt += ` Visual style: ${style}.`;
        prompt += ` ${aspectRatioDesc}, story illustration, dramatic moment capture.`;
    } else if (imageType === "comic-panel") {
        prompt = `Comic panel illustration. ${description}.`;
        if (mood) prompt += ` Tone: ${mood}.`;
        if (style) prompt += ` Art style: ${style}.`;
        prompt += ` ${aspectRatioDesc}, comic book art, dynamic framing.`;
    }

    // Add additional details
    if (additionalDetails.length > 0) {
        prompt += ` ${additionalDetails.join(". ")}.`;
    }

    return prompt.trim();
}
