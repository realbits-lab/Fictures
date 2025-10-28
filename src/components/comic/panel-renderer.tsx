/**
 * PanelRenderer Component
 *
 * Renders a single comic panel with background image, dialogue bubbles,
 * and SFX text overlays. Supports responsive sizing and lazy loading.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DialogueBubbleGroup } from './dialogue-bubble';
import { SFXTextGroup } from './sfx-text';
import { Skeleton } from '@/components/ui/SkeletonLoader';

interface PanelDialogue {
  character_id: string;
  text: string;
  tone?: string;
}

interface PanelSFX {
  text: string;
  emphasis: 'normal' | 'large' | 'dramatic';
}

interface PanelRendererProps {
  panelNumber: number;
  imageUrl: string;
  imageVariants?: {
    variants: Array<{
      url: string;
      format: string;
      width: number;
      height: number;
    }>;
  };
  narrative?: string | null; // Narrative text for panels without dialogue
  dialogue?: PanelDialogue[];
  sfx?: PanelSFX[];
  description?: string | null; // Visual description for the panel
  characterNames?: Record<string, string>; // Map of character_id to character name
  shotType?: string;
  className?: string;
  priority?: boolean; // For above-the-fold images
  onLoad?: () => void;
}

export function PanelRenderer({
  panelNumber,
  imageUrl,
  imageVariants,
  narrative,
  dialogue = [],
  sfx = [],
  description,
  characterNames = {},
  shotType,
  className,
  priority = false,
  onLoad,
}: PanelRendererProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // Prepare dialogue with character names
  const dialogueWithNames = dialogue.map(d => ({
    ...d,
    character_name: characterNames[d.character_id] || 'Unknown',
  }));

  // Helper function to organize variants by format for srcset
  const getVariantsByFormat = (format: string) => {
    if (!imageVariants?.variants) return [];
    return imageVariants.variants
      .filter((v: any) => v.format === format)
      .sort((a: any, b: any) => a.width - b.width); // Sort by width ascending
  };

  // Generate srcset string for a specific format
  const generateSrcSet = (format: string) => {
    const variants = getVariantsByFormat(format);
    if (variants.length === 0) return undefined;

    return variants
      .map((v: any) => `${v.url} ${v.width}w`)
      .join(', ');
  };

  // Use optimized variants if available, otherwise fall back to original
  const useOptimizedImages = imageVariants?.variants && imageVariants.variants.length > 0;

  return (
    <div
      className={cn(
        'relative w-full',
        className
      )}
      data-panel-number={panelNumber}
      data-shot-type={shotType}
    >
      {/* Panel container with 16:9 aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        {/* Loading skeleton */}
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
        )}

        {/* Background image with optimized variants */}
        {useOptimizedImages ? (
          <picture>
            {/* AVIF - Best compression (Chrome, Edge, Opera, Firefox) */}
            {generateSrcSet('avif') && (
              <source
                type="image/avif"
                srcSet={generateSrcSet('avif')}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1440px) 80vw, 1792px"
              />
            )}

            {/* WebP - Good compression (All modern browsers) */}
            {generateSrcSet('webp') && (
              <source
                type="image/webp"
                srcSet={generateSrcSet('webp')}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1440px) 80vw, 1792px"
              />
            )}

            {/* JPEG - Universal fallback */}
            {generateSrcSet('jpeg') && (
              <source
                type="image/jpeg"
                srcSet={generateSrcSet('jpeg')}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1440px) 80vw, 1792px"
              />
            )}

            {/* Fallback image */}
            <img
              src={imageUrl}
              alt={`Panel ${panelNumber}${shotType ? ` - ${shotType}` : ''}`}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading={priority ? 'eager' : 'lazy'}
              onLoad={handleImageLoad}
            />
          </picture>
        ) : (
          /* Fallback to Next.js Image if no variants available */
          <Image
            src={imageUrl}
            alt={`Panel ${panelNumber}${shotType ? ` - ${shotType}` : ''}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1792px"
            className={cn(
              'object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            priority={priority}
            onLoad={handleImageLoad}
            quality={90}
          />
        )}

        {/* Text overlays - Unified design for both narrative and dialogue */}
        {narrative && (
          <div
            className="absolute z-10 max-w-[85%] md:max-w-[70%]"
            style={{
              left: '5%',
              bottom: '8%',
            }}
          >
            <div className="relative px-4 py-3 shadow-lg border-2 border-gray-800 bg-white">
              {/* Narrative text */}
              <div className="leading-relaxed text-gray-900 italic text-sm sm:text-base">
                {narrative}
              </div>
            </div>
          </div>
        )}

        {/* Dialogue bubbles overlay */}
        {dialogue.length > 0 && (
          <DialogueBubbleGroup
            dialogues={dialogueWithNames}
            className="absolute inset-0"
          />
        )}

        {/* SFX text overlay - DISABLED per user request */}
        {/* {sfx.length > 0 && (
          <SFXTextGroup
            sfxList={sfx}
            className="absolute inset-0"
          />
        )} */}

        {/* Panel number indicator (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
            #{panelNumber}
          </div>
        )}

        {/* Shot type and description metadata - Right side overlay */}
        {(shotType || description) && (
          <div className="absolute top-2 right-2 max-w-[30%] bg-black/75 backdrop-blur-sm rounded-lg px-3 py-2 text-white shadow-xl">
            {shotType && (
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-purple-300">
                {shotType.replace(/_/g, ' ')}
              </div>
            )}
            {description && (
              <div className="text-xs leading-relaxed text-gray-200">
                {description}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * PanelRendererSkeleton Component
 *
 * Loading skeleton for panel renderer.
 */

export function PanelRendererSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        <Skeleton className="h-full w-full rounded-none" />
      </div>
    </div>
  );
}
