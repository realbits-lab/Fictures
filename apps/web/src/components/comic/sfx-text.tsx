/**
 * SFXText Component
 *
 * Renders sound effects (SFX) text for comic panels with emphasis styling.
 * Supports normal, large, and dramatic emphasis levels.
 */

'use client';

import { cn } from '@/lib/utils';

interface SFXTextProps {
  text: string;
  emphasis?: 'normal' | 'large' | 'dramatic';
  position?: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  rotation?: number; // Rotation in degrees
  className?: string;
}

export function SFXText({
  text,
  emphasis = 'normal',
  position = { x: 50, y: 50 },
  rotation = 0,
  className,
}: SFXTextProps) {
  // Determine styling based on emphasis
  const getEmphasisStyle = () => {
    switch (emphasis) {
      case 'dramatic':
        return {
          size: 'text-6xl md:text-7xl',
          weight: 'font-black',
          color: 'text-red-600',
          stroke: 'stroke-red-800',
          shadow: 'drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]',
          letterSpacing: 'tracking-widest',
        };
      case 'large':
        return {
          size: 'text-4xl md:text-5xl',
          weight: 'font-extrabold',
          color: 'text-orange-600',
          stroke: 'stroke-orange-800',
          shadow: 'drop-shadow-[0_4px_4px_rgba(0,0,0,0.4)]',
          letterSpacing: 'tracking-wide',
        };
      case 'normal':
      default:
        return {
          size: 'text-2xl md:text-3xl',
          weight: 'font-bold',
          color: 'text-gray-700',
          stroke: 'stroke-gray-900',
          shadow: 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]',
          letterSpacing: 'tracking-normal',
        };
    }
  };

  const style = getEmphasisStyle();

  return (
    <div
      className={cn(
        'absolute z-20 pointer-events-none select-none',
        className
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
    >
      <div
        className={cn(
          'relative whitespace-nowrap font-sans uppercase',
          style.size,
          style.weight,
          style.color,
          style.shadow,
          style.letterSpacing
        )}
        style={{
          WebkitTextStroke: emphasis === 'dramatic' ? '2px black' : emphasis === 'large' ? '1.5px black' : '1px black',
          textShadow: emphasis === 'dramatic'
            ? '4px 4px 0px #000, -4px -4px 0px #000, 4px -4px 0px #000, -4px 4px 0px #000'
            : emphasis === 'large'
            ? '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000'
            : '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/**
 * SFXTextGroup Component
 *
 * Renders multiple SFX texts for a panel, handling automatic positioning.
 */

interface SFXTextGroupProps {
  sfxList: Array<{
    text: string;
    emphasis: 'normal' | 'large' | 'dramatic';
  }>;
  className?: string;
}

export function SFXTextGroup({
  sfxList,
  className,
}: SFXTextGroupProps) {
  if (!sfxList || sfxList.length === 0) {
    return null;
  }

  // Auto-position SFX to avoid overlap and create dynamic feel
  const getAutoPosition = (index: number, total: number, emphasis: string) => {
    // Dramatic SFX typically go center or top-center
    if (emphasis === 'dramatic') {
      return {
        position: { x: 50, y: 30 },
        rotation: 0,
      };
    }

    // Large SFX positioned prominently
    if (emphasis === 'large') {
      const positions = [
        { position: { x: 30, y: 40 }, rotation: -5 },
        { position: { x: 70, y: 40 }, rotation: 5 },
        { position: { x: 50, y: 25 }, rotation: 0 },
      ];
      return positions[index % positions.length];
    }

    // Normal SFX positioned more subtly
    const positions = [
      { position: { x: 20, y: 20 }, rotation: -10 },
      { position: { x: 80, y: 25 }, rotation: 10 },
      { position: { x: 15, y: 70 }, rotation: -5 },
      { position: { x: 85, y: 75 }, rotation: 5 },
    ];
    return positions[index % positions.length];
  };

  return (
    <div className={className}>
      {sfxList.map((sfx, index) => {
        const { position, rotation } = getAutoPosition(index, sfxList.length, sfx.emphasis);
        return (
          <SFXText
            key={`sfx-${index}`}
            text={sfx.text}
            emphasis={sfx.emphasis}
            position={position}
            rotation={rotation}
          />
        );
      })}
    </div>
  );
}
