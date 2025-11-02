/**
 * ImageContentDisplay Component
 *
 * Displays image-only content for scenes, characters, and settings.
 * For comic scenes, shows panel images with dialogue/narration overlays.
 * For characters and settings, shows their portrait/visual images.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PanelRenderer, PanelRendererSkeleton } from '@/components/comic/panel-renderer';
import { Skeleton } from '@/components/ui/skeleton-loader';
import { cn } from '@/lib/utils';
import { ContentLoadError } from '@/components/error/ContentLoadError';

interface ImageVariant {
  url: string;
  format: string;
  width: number;
  height: number;
}

interface ImageVariants {
  imageId: string;
  originalUrl: string;
  variants: ImageVariant[];
  generatedAt: string;
}

interface PanelData {
  id: string;
  panel_number: number;
  image_url: string;
  image_variants?: ImageVariants;
  narrative?: string | null;
  dialogue?: Array<{
    character_id: string;
    text: string;
    tone?: string;
  }>;
  shot_type?: string;
  description?: string | null;
}

interface SceneData {
  id: string;
  title: string;
  imageUrl?: string | null;
  imageVariants?: ImageVariants;
}

interface CharacterData {
  id: string;
  name: string;
  imageUrl?: string | null;
  imageVariants?: ImageVariants;
}

interface SettingData {
  id: string;
  name: string;
  imageUrl?: string | null;
  imageVariants?: ImageVariants;
}

interface ImageContentDisplayProps {
  type: 'scene' | 'character' | 'setting';
  format?: 'novel' | 'comic';
  itemId: string;
  storyId: string;
}

export function ImageContentDisplay({
  type,
  format,
  itemId,
  storyId,
}: ImageContentDisplayProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = '';

        if (type === 'scene' && format === 'comic') {
          // Fetch comic panel data
          endpoint = `/api/comic/${itemId}/panels`;
        } else if (type === 'scene') {
          // Fetch novel scene data
          endpoint = `/api/scenes/${itemId}`;
        } else if (type === 'character') {
          // Fetch character data
          endpoint = `/api/characters/${itemId}`;
        } else if (type === 'setting') {
          // Fetch setting data
          endpoint = `/api/settings/${itemId}`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} data`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(`Error fetching ${type} data:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, format, itemId]);

  // Loading state
  if (loading) {
    if (type === 'scene' && format === 'comic') {
      return (
        <div className="space-y-6">
          <PanelRendererSkeleton />
          <PanelRendererSkeleton />
          <PanelRendererSkeleton />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-96">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ContentLoadError
        title={`Error Loading ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        message={error}
        icon={type as "character" | "setting" | "scene"}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Trigger refetch by forcing component to re-run useEffect
          window.location.reload();
        }}
        compact={false}
      />
    );
  }

  // Comic scene with panels
  if (type === 'scene' && format === 'comic' && data?.panels) {
    const panels: PanelData[] = data.panels;
    const characterNames: Record<string, string> = data.characterNames || {};

    return (
      <div className="space-y-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">{data.sceneTitle}</h2>
          {data.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{data.summary}</p>
          )}
        </div>

        {panels.map((panel, index) => (
          <PanelRenderer
            key={panel.id}
            panelNumber={panel.panel_number}
            imageUrl={panel.image_url}
            imageVariants={panel.image_variants}
            narrative={panel.narrative}
            dialogue={panel.dialogue}
            description={panel.description}
            characterNames={characterNames}
            shotType={panel.shot_type}
            priority={index === 0}
          />
        ))}
      </div>
    );
  }

  // Novel scene, character, or setting with single image
  const imageUrl = data?.imageUrl || data?.image_url;
  const imageVariants = data?.imageVariants || data?.image_variants;
  const title = data?.title || data?.name;

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <p>No image available for this {type}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h2 className="text-xl font-bold mb-4">{title}</h2>
      )}

      <div className="relative w-full" style={{ aspectRatio: type === 'character' ? '1/1' : '16/9' }}>
        {imageVariants?.variants && imageVariants.variants.length > 0 ? (
          <OptimizedImage
            imageUrl={imageUrl}
            imageVariants={imageVariants}
            alt={title || `${type} image`}
            aspectRatio={type === 'character' ? '1/1' : '16/9'}
          />
        ) : (
          <Image
            src={imageUrl}
            alt={title || `${type} image`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            className="object-cover rounded-lg"
            priority
            quality={90}
          />
        )}
      </div>

      {/* Additional metadata for characters and settings */}
      {type === 'character' && data?.description && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Description</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.description}</p>
        </div>
      )}

      {type === 'setting' && data?.description && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold mb-2">Description</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">{data.description}</p>
        </div>
      )}
    </div>
  );
}

/**
 * OptimizedImage Component
 *
 * Displays an image with optimized variants (AVIF, WebP, JPEG)
 */
interface OptimizedImageProps {
  imageUrl: string;
  imageVariants: ImageVariants;
  alt: string;
  aspectRatio: string;
}

function OptimizedImage({ imageUrl, imageVariants, alt, aspectRatio }: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Helper function to organize variants by format for srcset
  const getVariantsByFormat = (format: string) => {
    if (!imageVariants?.variants) return [];
    return imageVariants.variants
      .filter((v) => v.format === format)
      .sort((a, b) => a.width - b.width);
  };

  // Generate srcset string for a specific format
  const generateSrcSet = (format: string) => {
    const variants = getVariantsByFormat(format);
    if (variants.length === 0) return undefined;

    return variants
      .map((v) => `${v.url} ${v.width}w`)
      .join(', ');
  };

  return (
    <div className="relative w-full" style={{ aspectRatio }}>
      {!imageLoaded && (
        <Skeleton className="absolute inset-0 h-full w-full" />
      )}

      <picture>
        {/* AVIF - Best compression */}
        {generateSrcSet('avif') && (
          <source
            type="image/avif"
            srcSet={generateSrcSet('avif')}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          />
        )}

        {/* WebP - Good compression */}
        {generateSrcSet('webp') && (
          <source
            type="image/webp"
            srcSet={generateSrcSet('webp')}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          />
        )}

        {/* JPEG - Universal fallback */}
        {generateSrcSet('jpeg') && (
          <source
            type="image/jpeg"
            srcSet={generateSrcSet('jpeg')}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          />
        )}

        {/* Fallback image */}
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-cover rounded-lg transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="eager"
          onLoad={() => setImageLoaded(true)}
        />
      </picture>
    </div>
  );
}
