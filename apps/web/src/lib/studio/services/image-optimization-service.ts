/**
 * Image Optimization Service
 *
 * Handles responsive image generation for optimal web performance:
 * - Generates 2 size variants for mobile (1x and 2x)
 * - Converts to AVIF format only
 * - Uploads optimized variants to Vercel Blob
 *
 * Based on 2025 best practices:
 * - AVIF: 50% smaller than JPEG, 93.8% browser support
 * - Mobile-only optimization for story/scene images
 */

import { put } from "@vercel/blob";
import sharp from "sharp";
import { getBlobPath } from "@/lib/utils/blob-path";

// Image size configuration (7:4 aspect ratio, optimized for Gemini 2.5 Flash Image)
// Original Gemini output: 1344×768 pixels = 7:4 aspect ratio (1.75:1) - landscape format
// Mobile 2x uses original size (1344×768) - no resizing, just format conversion
// Mobile 1x is exact half (672×384) for optimal scaling while maintaining 7:4 ratio
export const IMAGE_SIZES = {
    mobile: {
        "1x": { width: 672, height: 384 }, // Mobile standard displays (exact half)
        "2x": { width: 1344, height: 768, noResize: true }, // Original size - no resize needed!
    },
} as const;

// Original image dimensions from Gemini 2.5 Flash Image
export const ORIGINAL_IMAGE_SIZE = {
    width: 1344,
    height: 768,
} as const;

// Supported output format: AVIF only
export const IMAGE_FORMATS = ["avif"] as const;
export type ImageFormat = (typeof IMAGE_FORMATS)[number];
export type DeviceType = keyof typeof IMAGE_SIZES;
export type DeviceResolution = "1x" | "2x";

// Quality settings for AVIF
const QUALITY_SETTINGS: Record<ImageFormat, number> = {
    avif: 75, // AVIF can maintain quality at lower settings
};

export interface ImageVariant {
    format: ImageFormat;
    device: DeviceType;
    resolution: DeviceResolution;
    width: number;
    height: number;
    url: string;
    size: number; // File size in bytes
}

export interface OptimizedImageSet {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];
    generatedAt: string;
}

/**
 * Download image from URL as buffer with retry logic for CDN propagation
 */
async function downloadImage(
    url: string,
    maxRetries = 3,
    initialDelay = 1000,
): Promise<Buffer> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                if (attempt > 1) {
                    console.log(
                        `[Image Optimization] ✓ Download succeeded on attempt ${attempt}/${maxRetries}`,
                    );
                }
                return Buffer.from(arrayBuffer);
            }

            // If 404, it might be CDN propagation delay - retry
            if (response.status === 404 && attempt < maxRetries) {
                const delay = initialDelay * 2 ** (attempt - 1); // Exponential backoff
                console.log(
                    `[Image Optimization] ⏳ Image not found (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }

            // Other errors or final 404 - throw
            throw new Error(`Failed to download image: ${response.statusText}`);
        } catch (error) {
            lastError = error as Error;
            if (
                attempt < maxRetries &&
                (error as any).code !== "ECONNREFUSED"
            ) {
                const delay = initialDelay * 2 ** (attempt - 1);
                console.log(
                    `[Image Optimization] ⏳ Download failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`,
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else if (attempt === maxRetries) {
                throw lastError;
            }
        }
    }

    throw lastError || new Error("Failed to download image after retries");
}

/**
 * Generate a single optimized image variant
 *
 * @param noResize - Skip resizing (for mobile 2x which uses original 1344×768)
 */
async function generateVariant(
    imageBuffer: Buffer,
    width: number,
    height: number,
    format: ImageFormat,
    quality: number,
    noResize: boolean = false,
): Promise<{ buffer: Buffer; size: number }> {
    let sharpInstance = sharp(imageBuffer);

    // Skip resize for mobile 2x (already at optimal 1344×768)
    // This saves processing time and maintains original quality
    if (!noResize) {
        sharpInstance = sharpInstance.resize(width, height, {
            fit: "cover",
            position: "center",
        });
    }

    // Apply AVIF conversion
    sharpInstance = sharpInstance.avif({ quality, effort: 6 });

    const buffer = await sharpInstance.toBuffer();
    return { buffer, size: buffer.length };
}

/**
 * Upload image variant to Vercel Blob
 */
async function uploadVariant(
    buffer: Buffer,
    basePath: string,
    format: ImageFormat,
    width: number,
    height: number,
    imageId: string,
): Promise<string> {
    const filename = `${imageId}.${format}`;
    const relativePath = `${basePath}/${format}/${width}x${height}/${filename}`;
    const path = getBlobPath(relativePath);

    const blob = await put(path, buffer, {
        access: "public",
        contentType: `image/${format}`,
        addRandomSuffix: true, // Avoid conflicts with existing files
    });

    return blob.url;
}

/**
 * Generate all optimized variants of an image
 *
 * @param originalImageUrl - URL of the original image (from DALL-E or upload)
 * @param imageId - Unique identifier for this image
 * @param storyId - Story ID for organizing storage
 * @param imageType - Type of image: 'story', 'scene', 'character', 'setting'
 * @returns OptimizedImageSet with all generated variants
 */
export async function optimizeImage(
    originalImageUrl: string,
    imageId: string,
    storyId: string,
    imageType: "story" | "scene" | "character" | "setting" | "panel" = "story",
    sceneId?: string,
): Promise<OptimizedImageSet> {
    console.log(
        `[Image Optimization] Starting optimization for ${imageType} image ${imageId}`,
    );

    // Download original image
    const originalBuffer = await downloadImage(originalImageUrl);

    // Define storage path - place panel variants under specific scene directory
    const basePath =
        imageType === "panel" && sceneId
            ? `stories/${storyId}/comics/${sceneId}/panel`
            : imageType === "panel"
              ? `stories/${storyId}/comics/panel`
              : `stories/${storyId}/${imageType}`;

    // Store original (use addRandomSuffix to avoid conflicts)
    const originalRelativePath = `${basePath}/original/${imageId}.png`;
    const originalPath = getBlobPath(originalRelativePath);
    const originalBlob = await put(originalPath, originalBuffer, {
        access: "public",
        contentType: "image/png",
        addRandomSuffix: true,
    });

    const variants: ImageVariant[] = [];
    let processedCount = 0;
    const totalVariants =
        Object.keys(IMAGE_SIZES).length *
        Object.keys(IMAGE_SIZES.mobile).length *
        IMAGE_FORMATS.length;

    // Generate all variants (device × resolution × format)
    for (const [device, resolutions] of Object.entries(IMAGE_SIZES)) {
        for (const [resolution, dimensions] of Object.entries(resolutions)) {
            const { width, height, noResize } = dimensions as {
                width: number;
                height: number;
                noResize?: boolean;
            };

            for (const format of IMAGE_FORMATS) {
                processedCount++;
                const action = noResize ? "convert only" : "resize + convert";
                console.log(
                    `[Image Optimization] Processing variant ${processedCount}/${totalVariants}: ${device} ${resolution} ${format} (${width}x${height}) [${action}]`,
                );

                try {
                    // Generate optimized variant (skip resize for mobile 2x)
                    const { buffer, size } = await generateVariant(
                        originalBuffer,
                        width,
                        height,
                        format,
                        QUALITY_SETTINGS[format],
                        noResize || false,
                    );

                    // Upload to Vercel Blob
                    const url = await uploadVariant(
                        buffer,
                        basePath,
                        format,
                        width,
                        height,
                        imageId,
                    );

                    variants.push({
                        format,
                        device: device as DeviceType,
                        resolution: resolution as DeviceResolution,
                        width,
                        height,
                        url,
                        size,
                    });

                    console.log(
                        `[Image Optimization] ✓ Generated ${format} ${width}x${height} (${Math.round(size / 1024)}KB)`,
                    );
                } catch (error) {
                    console.error(
                        `[Image Optimization] ✗ Failed to generate ${format} ${width}x${height}:`,
                        error,
                    );
                    // Continue with other variants even if one fails
                }
            }
        }
    }

    const result: OptimizedImageSet = {
        imageId,
        originalUrl: originalBlob.url,
        variants,
        generatedAt: new Date().toISOString(),
    };

    console.log(
        `[Image Optimization] Complete! Generated ${variants.length}/${totalVariants} variants`,
    );
    console.log(
        `[Image Optimization] Total size: ${Math.round(variants.reduce((sum, v) => sum + v.size, 0) / 1024)}KB across all variants`,
    );

    return result;
}

/**
 * Get the best image variant for a given viewport width
 * Optimized for 4-variant system: mobile 1x/2x only
 * Desktop automatically uses mobile 2x (1344×768 - original Gemini size)
 *
 * @param variants - Array of available image variants
 * @param viewportWidth - Current viewport width in pixels
 * @param format - Preferred format (defaults to 'avif' with fallback)
 * @returns URL of the best matching variant
 */
export function getBestVariant(
    variants: ImageVariant[],
    viewportWidth: number,
    format: ImageFormat = "avif",
): string | null {
    // Filter variants in AVIF format
    const formatVariants = variants.filter((v) => v.format === format);

    // No variants available
    if (formatVariants.length === 0) {
        return null;
    }

    // Account for device pixel ratio (assume 2x for retina)
    const effectiveWidth =
        viewportWidth *
        (typeof window !== "undefined" && window.devicePixelRatio > 1 ? 2 : 1);

    // Find smallest variant that's still larger than viewport
    const suitable = formatVariants
        .filter((v) => v.width >= effectiveWidth)
        .sort((a, b) => a.width - b.width);

    // Return smallest suitable variant, or largest if none are big enough
    return suitable.length > 0
        ? suitable[0].url
        : formatVariants.sort((a, b) => b.width - a.width)[0].url;
}

/**
 * Generate srcSet string for <img> or Next.js Image component
 *
 * @param variants - Array of available image variants
 * @param format - Format to generate srcset for
 * @returns srcSet string for use in img tag
 */
export function generateSrcSet(
    variants: ImageVariant[],
    format: ImageFormat = "avif",
): string {
    const formatVariants = variants
        .filter((v) => v.format === format)
        .sort((a, b) => a.width - b.width);

    return formatVariants.map((v) => `${v.url} ${v.width}w`).join(", ");
}

/**
 * Generate sizes attribute for responsive images
 * Optimized for 4-variant system: mobile 1x/2x only
 * Desktop uses mobile 2x (1280×720) as fallback
 *
 * @returns sizes string for use in img tag
 */
export function generateSizesAttribute(): string {
    return "(max-width: 640px) 100vw, 100vw";
}
