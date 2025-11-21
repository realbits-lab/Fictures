"use client";

/**
 * OptimizedImage Component
 *
 * Responsive image component optimized with 2-variant AVIF-only system.
 * Mobile-first approach with desktop fallback using mobile 2x.
 *
 * Features:
 * - AVIF-only format (93.8% browser support)
 * - 2 variants: mobile 1x/2x
 * - Desktop uses mobile 2x (acceptable upscaling)
 * - ~45KB total per image (15KB 1x + 30KB 2x)
 * - Uses Next.js Image for optimal loading
 * - Original PNG fallback for unsupported browsers
 *
 * Usage:
 * ```tsx
 * <OptimizedImage
 *   imageUrl={story.imageUrl}
 *   imageVariants={story.imageVariants}
 *   alt="Story cover"
 *   priority={true}
 * />
 * ```
 */

import Image from "next/image";
import type { ImageVariant } from "@/lib/studio/services/image-optimization-service";

export interface OptimizedImageProps {
    imageUrl?: string | null;
    imageVariants?: Record<string, unknown> | null;
    alt: string;
    className?: string;
    priority?: boolean;
    fill?: boolean;
    sizes?: string;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
    width?: number;
    height?: number;
    onLoad?: () => void;
    onError?: () => void;
}

interface OptimizedImageSet {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];
    generatedAt: string;
}

/**
 * Get image format - AVIF-only
 * Optimized for AVIF-only system (93.8% browser support)
 */
function getSupportedFormat(): "avif" {
    return "avif";
}

/**
 * Get the best variant for current viewport and format
 * Optimized for 2-variant AVIF system: mobile 1x/2x only
 * Desktop automatically uses mobile 2x
 */
function getBestVariant(
    variants: ImageVariant[],
    format: "avif",
    viewportWidth: number = 1440,
): string | null {
    // Filter by AVIF format only
    const formatVariants = variants.filter((v) => v.format === format);

    if (formatVariants.length === 0) {
        return null;
    }

    // Account for device pixel ratio
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
 * Generate srcSet string for AVIF format
 * Optimized for 2-variant system: mobile 1x/2x only
 */
function generateSrcSet(variants: ImageVariant[], format: "avif"): string {
    const formatVariants = variants
        .filter((v) => v.format === format)
        .sort((a, b) => a.width - b.width);

    return formatVariants.map((v) => `${v.url} ${v.width}w`).join(", ");
}

export function OptimizedImage({
    imageUrl,
    imageVariants,
    alt,
    className = "",
    priority = false,
    fill = false,
    sizes = "(max-width: 640px) 100vw, 100vw",
    objectFit = "cover",
    width,
    height,
    onLoad,
    onError,
}: OptimizedImageProps) {
    // If no image provided, don't render anything
    if (!imageUrl) {
        return null;
    }

    // Parse image variants if available
    const optimizedSet = imageVariants as OptimizedImageSet | null;

    // If no optimized variants, use original image with Next.js Image
    if (
        !optimizedSet ||
        !optimizedSet.variants ||
        optimizedSet.variants.length === 0
    ) {
        if (fill) {
            return (
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    className={`${className} m-0`}
                    style={{ objectFit }}
                    priority={priority}
                    sizes={sizes}
                    onLoad={onLoad}
                    onError={onError}
                />
            );
        }

        return (
            <Image
                src={imageUrl}
                alt={alt}
                width={width || 1792}
                height={height || 1024}
                className={`${className} m-0`}
                priority={priority}
                sizes={sizes}
                onLoad={onLoad}
                onError={onError}
            />
        );
    }

    // Use optimized variants with picture element for format fallbacks
    // Optimized for 4-variant system: AVIF with JPEG fallback
    const variants = optimizedSet.variants;
    const supportedFormat = getSupportedFormat();

    // Generate srcsets for each format
    const avifSrcSet = generateSrcSet(variants, "avif");
    // Get best variant for AVIF as fallback
    const bestVariant = getBestVariant(variants, supportedFormat) || imageUrl;

    return (
        <picture className={className}>
            {/* AVIF - only format (93.8% browser support) */}
            {avifSrcSet && (
                <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
            )}

            {/* Fallback img tag with Next.js Image optimization */}
            {fill ? (
                <Image
                    src={bestVariant}
                    alt={alt}
                    fill
                    style={{ objectFit }}
                    priority={priority}
                    sizes={sizes}
                    onLoad={onLoad}
                    onError={onError}
                    className="m-0"
                />
            ) : (
                <Image
                    src={bestVariant}
                    alt={alt}
                    width={width || 1792}
                    height={height || 1024}
                    priority={priority}
                    sizes={sizes}
                    onLoad={onLoad}
                    onError={onError}
                    className="m-0"
                />
            )}
        </picture>
    );
}

/**
 * Helper component for story cover images
 */
export function StoryCoverImage({
    story,
    className,
    priority = false,
}: {
    story: {
        title: string;
        imageUrl?: string | null;
        imageVariants?: Record<string, unknown> | null;
    };
    className?: string;
    priority?: boolean;
}) {
    return (
        <OptimizedImage
            imageUrl={story.imageUrl}
            imageVariants={story.imageVariants}
            alt={`${story.title} cover`}
            className={className}
            priority={priority}
            fill
            objectFit="cover"
        />
    );
}

/**
 * Helper component for scene images
 * Scene images use 7:4 aspect ratio (1344×768)
 */
export function SceneImage({
    scene,
    className,
    priority = false,
}: {
    scene: {
        title: string;
        imageUrl?: string | null;
        imageVariants?: Record<string, unknown> | null;
    };
    className?: string;
    priority?: boolean;
}) {
    return (
        <OptimizedImage
            imageUrl={scene.imageUrl}
            imageVariants={scene.imageVariants}
            alt={scene.title}
            className={className}
            priority={priority}
            width={1344}
            height={768}
        />
    );
}

/**
 * Helper component for character images
 */
export function CharacterImage({
    character,
    className,
    priority = false,
}: {
    character: {
        name: string;
        imageUrl?: string | null;
        imageVariants?: Record<string, unknown> | null;
    };
    className?: string;
    priority?: boolean;
}) {
    return (
        <OptimizedImage
            imageUrl={character.imageUrl}
            imageVariants={character.imageVariants}
            alt={character.name}
            className={className}
            priority={priority}
        />
    );
}
