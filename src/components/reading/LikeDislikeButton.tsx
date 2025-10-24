'use client';

import React, { useState, useTransition } from 'react';
import { cn } from '@/lib/utils/cn';

interface LikeDislikeButtonProps {
  entityId: string;
  entityType: 'story' | 'chapter' | 'scene' | 'comment';
  initialLiked?: boolean;
  initialDisliked?: boolean;
  initialLikeCount?: number;
  initialDislikeCount?: number;
  onVoteChange?: (liked: boolean | null, disliked: boolean | null, likeCount: number, dislikeCount: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LikeDislikeButton({
  entityId,
  entityType,
  initialLiked = false,
  initialDisliked = false,
  initialLikeCount = 0,
  initialDislikeCount = 0,
  onVoteChange,
  className,
  size = 'md',
}: LikeDislikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [dislikeCount, setDislikeCount] = useState(initialDislikeCount);
  const [isPending, startTransition] = useTransition();

  const handleVote = async (voteType: 'like' | 'dislike') => {
    startTransition(async () => {
      try {
        let endpoint = '';

        switch (entityType) {
          case 'story':
            endpoint = `/writing/api/stories/${entityId}/${voteType}`;
            break;
          case 'chapter':
            endpoint = `/writing/api/chapters/${entityId}/${voteType}`;
            break;
          case 'scene':
            endpoint = `/writing/api/scenes/${entityId}/${voteType}`;
            break;
          case 'comment':
            endpoint = `/api/comments/${entityId}/${voteType}`;
            break;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to ${voteType}`);
        }

        const data = await response.json();

        // Update state based on response
        const newLiked = data.liked || false;
        const newDisliked = data.disliked || false;
        const newLikeCount = data.likeCount !== undefined ? data.likeCount : likeCount;
        const newDislikeCount = data.dislikeCount !== undefined ? data.dislikeCount : dislikeCount;

        setLiked(newLiked);
        setDisliked(newDisliked);
        setLikeCount(newLikeCount);
        setDislikeCount(newDislikeCount);

        onVoteChange?.(
          newLiked ? true : null,
          newDisliked ? true : null,
          newLikeCount,
          newDislikeCount
        );
      } catch (error) {
        console.error(`Error toggling ${voteType}:`, error);
      }
    });
  };

  const sizeClasses = {
    sm: 'gap-1 px-2 py-1 text-xs',
    md: 'gap-1.5 px-2.5 py-1.5 text-sm',
    lg: 'gap-2 px-3 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      {/* Like Button */}
      <button
        onClick={() => handleVote('like')}
        disabled={isPending}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all',
          sizeClasses[size],
          liked
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
          isPending && 'opacity-50 cursor-not-allowed'
        )}
        title="Like"
      >
        {/* Thumbs Up SVG */}
        <svg
          className={cn(
            'transition-transform',
            iconSizes[size],
            liked && 'scale-110'
          )}
          fill={liked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"
          />
        </svg>
        {likeCount > 0 && (
          <span className="tabular-nums font-semibold">{likeCount}</span>
        )}
        <span className="sr-only">{liked ? 'Unlike' : 'Like'}</span>
      </button>

      {/* Dislike Button */}
      <button
        onClick={() => handleVote('dislike')}
        disabled={isPending}
        className={cn(
          'inline-flex items-center rounded-full font-medium transition-all',
          sizeClasses[size],
          disliked
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
          isPending && 'opacity-50 cursor-not-allowed'
        )}
        title="Dislike"
      >
        {/* Thumbs Down SVG */}
        <svg
          className={cn(
            'transition-transform',
            iconSizes[size],
            disliked && 'scale-110'
          )}
          fill={disliked ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
          />
        </svg>
        {dislikeCount > 0 && (
          <span className="tabular-nums font-semibold">{dislikeCount}</span>
        )}
        <span className="sr-only">{disliked ? 'Remove dislike' : 'Dislike'}</span>
      </button>
    </div>
  );
}
