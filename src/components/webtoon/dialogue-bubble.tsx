/**
 * DialogueBubble Component
 *
 * Renders a dialogue bubble for webtoon panels with character name and text.
 * Supports different tones and positioning.
 */

'use client';

import { cn } from '@/lib/utils';

interface DialogueBubbleProps {
  characterName: string;
  text: string;
  tone?: string;
  position?: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  className?: string;
}

export function DialogueBubble({
  characterName,
  text,
  tone = 'normal',
  position = { x: 50, y: 10 },
  className,
}: DialogueBubbleProps) {
  // Determine bubble styling based on tone
  const getBubbleStyle = () => {
    switch (tone?.toLowerCase()) {
      case 'shouting':
      case 'angry':
        return {
          border: 'border-4 border-red-600',
          bg: 'bg-red-50',
          text: 'text-red-900 font-bold',
        };
      case 'whispering':
      case 'quiet':
        return {
          border: 'border-2 border-dashed border-gray-400',
          bg: 'bg-gray-50',
          text: 'text-gray-700 text-sm italic',
        };
      case 'thinking':
      case 'internal':
        return {
          border: 'border-2 border-blue-400',
          bg: 'bg-blue-50',
          text: 'text-blue-900 italic',
        };
      case 'scared':
      case 'nervous':
        return {
          border: 'border-3 border-purple-500',
          bg: 'bg-purple-50',
          text: 'text-purple-900',
        };
      default:
        return {
          border: 'border-2 border-gray-800',
          bg: 'bg-white',
          text: 'text-gray-900',
        };
    }
  };

  const style = getBubbleStyle();

  return (
    <div
      className={cn(
        'absolute z-10 max-w-[80%] md:max-w-[60%]',
        className
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, 0)',
      }}
    >
      <div
        className={cn(
          'relative rounded-2xl px-4 py-3 shadow-lg',
          style.border,
          style.bg
        )}
      >
        {/* Character name label */}
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
          {characterName}
        </div>

        {/* Dialogue text */}
        <div className={cn('leading-relaxed', style.text)}>
          {text}
        </div>

        {/* Speech bubble pointer (optional, can be styled based on position) */}
        <div
          className={cn(
            'absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 transform',
            style.bg,
            style.border,
            'border-b-0 border-r-0'
          )}
        />
      </div>
    </div>
  );
}

/**
 * DialogueBubbleGroup Component
 *
 * Renders multiple dialogue bubbles for a panel, handling automatic positioning
 * to avoid overlap.
 */

interface DialogueBubbleGroupProps {
  dialogues: Array<{
    character_id: string;
    character_name: string;
    text: string;
    tone?: string;
  }>;
  className?: string;
}

export function DialogueBubbleGroup({
  dialogues,
  className,
}: DialogueBubbleGroupProps) {
  if (!dialogues || dialogues.length === 0) {
    return null;
  }

  // Auto-position bubbles to avoid overlap
  const getAutoPosition = (index: number, total: number) => {
    if (total === 1) {
      return { x: 50, y: 15 }; // Center top
    }

    if (total === 2) {
      return index === 0
        ? { x: 30, y: 15 }  // Top left
        : { x: 70, y: 60 }; // Bottom right
    }

    if (total === 3) {
      const positions = [
        { x: 25, y: 15 },  // Top left
        { x: 75, y: 15 },  // Top right
        { x: 50, y: 70 },  // Bottom center
      ];
      return positions[index] || { x: 50, y: 50 };
    }

    // For 4+ bubbles, distribute evenly
    const row = Math.floor(index / 2);
    const col = index % 2;
    return {
      x: col === 0 ? 30 : 70,
      y: 15 + (row * 25),
    };
  };

  return (
    <div className={className}>
      {dialogues.map((dialogue, index) => (
        <DialogueBubble
          key={`${dialogue.character_id}-${index}`}
          characterName={dialogue.character_name}
          text={dialogue.text}
          tone={dialogue.tone}
          position={getAutoPosition(index, dialogues.length)}
        />
      ))}
    </div>
  );
}
