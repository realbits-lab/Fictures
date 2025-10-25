'use client';

/**
 * OptimizedImage Component
 *
 * Responsive image component that automatically serves the best format and size
 * for the user's device and browser.
 *
 * Features:
 * - Automatic format selection (AVIF → WebP → JPEG fallback)
 * - Responsive sizing based on viewport
 * - Uses Next.js Image for optimal loading
 * - Supports lazy loading and priority loading
 * - Proper srcset generation for all variants
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

import Image from 'next/image';
import { type ImageVariant } from '@/lib/services/image-optimization';

export interface OptimizedImageProps {
  imageUrl?: string | null;
  imageVariants?: Record<string, unknown> | null;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
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
 * Detect browser support for modern image formats
 */
function getSupportedFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') {
    return 'avif'; // Default to AVIF for SSR
  }

  // Check for AVIF support
  const avifSupport = document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
  if (avifSupport) return 'avif';

  // Check for WebP support
  const webpSupport = document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') === 0;
  if (webpSupport) return 'webp';

  // Fallback to JPEG
  return 'jpeg';
}

/**
 * Get the best variant for current viewport and format
 */
function getBestVariant(
  variants: ImageVariant[],
  format: 'avif' | 'webp' | 'jpeg',
  viewportWidth: number = 1440
): string | null {
  // Filter by format
  let formatVariants = variants.filter((v) => v.format === format);

  // Fallback to WebP if AVIF not available
  if (formatVariants.length === 0 && format === 'avif') {
    formatVariants = variants.filter((v) => v.format === 'webp');
  }

  // Fallback to JPEG if WebP not available
  if (formatVariants.length === 0) {
    formatVariants = variants.filter((v) => v.format === 'jpeg');
  }

  if (formatVariants.length === 0) {
    return null;
  }

  // Account for device pixel ratio
  const effectiveWidth = viewportWidth * (typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 2 : 1);

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
 * Generate srcSet string for a format
 */
function generateSrcSet(variants: ImageVariant[], format: 'avif' | 'webp' | 'jpeg'): string {
  const formatVariants = variants
    .filter((v) => v.format === format)
    .sort((a, b) => a.width - b.width);

  return formatVariants.map((v) => `${v.url} ${v.width}w`).join(', ');
}

export function OptimizedImage({
  imageUrl,
  imageVariants,
  alt,
  className = '',
  priority = false,
  fill = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1440px',
  objectFit = 'cover',
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
  if (!optimizedSet || !optimizedSet.variants || optimizedSet.variants.length === 0) {
    if (fill) {
      return (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          className={className}
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
        className={className}
        priority={priority}
        sizes={sizes}
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  // Use optimized variants with picture element for format fallbacks
  const variants = optimizedSet.variants;
  const supportedFormat = getSupportedFormat();

  // Generate srcsets for each format
  const avifSrcSet = generateSrcSet(variants, 'avif');
  const webpSrcSet = generateSrcSet(variants, 'webp');
  const jpegSrcSet = generateSrcSet(variants, 'jpeg');

  // Get best variant for the supported format as fallback
  const bestVariant = getBestVariant(variants, supportedFormat) || imageUrl;

  return (
    <picture className={className}>
      {/* AVIF - best compression */}
      {avifSrcSet && (
        <source
          type="image/avif"
          srcSet={avifSrcSet}
          sizes={sizes}
        />
      )}

      {/* WebP - good compression, wider support */}
      {webpSrcSet && (
        <source
          type="image/webp"
          srcSet={webpSrcSet}
          sizes={sizes}
        />
      )}

      {/* JPEG - universal fallback */}
      {jpegSrcSet && (
        <source
          type="image/jpeg"
          srcSet={jpegSrcSet}
          sizes={sizes}
        />
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
