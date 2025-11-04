'use client';

import React, { useState, useTransition } from 'react';
import { cn } from '@/lib/utils/cn';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { trackCommunity } from '@/lib/analysis/google-analytics';

interface CommentFormProps {
  storyId: string;
  chapterId?: string;
  sceneId?: string;
  parentCommentId?: string;
  initialContent?: string;
  mode?: 'create' | 'edit' | 'reply';
  onSuccess?: (comment: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function CommentForm({
  storyId,
  chapterId,
  sceneId,
  parentCommentId,
  initialContent = '',
  mode = 'create',
  onSuccess,
  onCancel,
  className,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length > 5000) {
      setError('Comment is too long (max 5000 characters)');
      return;
    }

    startTransition(async () => {
      try {
        const endpoint = `/studio/api/stories/${storyId}/comments`;
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.trim(),
            chapterId,
            sceneId,
            parentCommentId,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to post comment');
        }

        const data = await response.json();

        // Track comment creation
        if (data.comment?.id) {
          trackCommunity.comment(storyId);
        }

        setContent('');
        onSuccess?.(data.comment);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to post comment');
      }
    });
  };

  const placeholderText = mode === 'reply'
    ? 'Write a reply...'
    : mode === 'edit'
    ? 'Edit your comment...'
    : 'Share your thoughts...';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-3', className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholderText}
        disabled={isPending}
        rows={mode === 'reply' ? 3 : 4}
        className="resize-none"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {content.length} / 5000 characters
        </p>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isPending || !content.trim()}
            loading={isPending}
          >
            {mode === 'edit' ? 'Update' : mode === 'reply' ? 'Reply' : 'Post Comment'}
          </Button>
        </div>
      </div>
    </form>
  );
}
