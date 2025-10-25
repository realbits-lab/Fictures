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
  dialogue?: PanelDialogue[];
  sfx?: PanelSFX[];
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
  dialogue = [],
  sfx = [],
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

  // Get responsive image sizes for Next.js Image component
  const getImageSizes = () => {
    return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1792px';
  };

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

        {/* Background image */}
        <Image
          src={imageUrl}
          alt={`Panel ${panelNumber}${shotType ? ` - ${shotType}` : ''}`}
          fill
          sizes={getImageSizes()}
          className={cn(
            'object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          priority={priority}
          onLoad={handleImageLoad}
          quality={90}
        />

        {/* Dialogue bubbles overlay */}
        {dialogue.length > 0 && (
          <DialogueBubbleGroup
            dialogues={dialogueWithNames}
            className="absolute inset-0"
          />
        )}

        {/* SFX text overlay */}
        {sfx.length > 0 && (
          <SFXTextGroup
            sfxList={sfx}
            className="absolute inset-0"
          />
        )}

        {/* Panel number indicator (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
            #{panelNumber}
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
