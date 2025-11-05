'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface QuickActionsProps {
  sceneId?: string;
  chapterId?: string;
  currentStatus: 'writing' | 'published';
  currentVisibility?: 'private' | 'unlisted' | 'public';
  onStatusChange?: () => void;
}

export function QuickActions({
  sceneId,
  chapterId,
  currentStatus,
  currentVisibility = 'private',
  onStatusChange,
}: QuickActionsProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const endpoint = sceneId
        ? `/publish/api/scenes/${sceneId}`
        : `/publish/api/chapters/${chapterId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'public' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to publish');
      }

      toast.success(sceneId ? 'Scene published!' : 'Chapter published!');
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);

    try {
      const endpoint = sceneId
        ? `/publish/api/scenes/${sceneId}/unpublish`
        : `/publish/api/chapters/${chapterId}/unpublish`;

      const response = await fetch(endpoint, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unpublish');
      }

      toast.success(sceneId ? 'Scene unpublished' : 'Chapter unpublished');
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Unpublish error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to unpublish');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleVisibilityChange = async (visibility: 'private' | 'unlisted' | 'public') => {
    try {
      const endpoint = sceneId
        ? `/publish/api/scenes/${sceneId}/visibility`
        : `/publish/api/chapters/${chapterId}/visibility`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update visibility');
      }

      toast.success(`Visibility updated to ${visibility}`);
      setShowVisibilityMenu(false);
      onStatusChange?.();
      router.refresh();
    } catch (error) {
      console.error('Visibility error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'writing' ? (
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-colors',
            'bg-green-600 text-white hover:bg-green-700',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center gap-2'
          )}
        >
          {isPublishing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Publishing...
            </>
          ) : (
            'Publish Now'
          )}
        </button>
      ) : (
        <>
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="px-4 py-2 rounded-lg font-medium border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              {currentVisibility === 'public' && 'Public'}
              {currentVisibility === 'unlisted' && 'Unlisted'}
              {currentVisibility === 'private' && 'Private'}
              <span className="text-xs">▼</span>
            </button>

            {showVisibilityMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowVisibilityMenu(false)}
                />
                <div className="absolute top-full mt-2 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[200px]">
                  <button
                    onClick={() => handleVisibilityChange('public')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                  >
                    Public
                    <span className="text-xs text-gray-500 ml-auto">Visible to all</span>
                  </button>
                  <button
                    onClick={() => handleVisibilityChange('unlisted')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    Unlisted
                    <span className="text-xs text-gray-500 ml-auto">Link only</span>
                  </button>
                  <button
                    onClick={() => handleVisibilityChange('private')}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 rounded-b-lg"
                  >
                    Private
                    <span className="text-xs text-gray-500 ml-auto">Only you</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleUnpublish}
            disabled={isUnpublishing}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              'border-2 border-red-300 dark:border-red-600 text-red-600 dark:text-red-400',
              'hover:bg-red-50 dark:hover:bg-red-900/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center gap-2'
            )}
          >
            {isUnpublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                Unpublishing...
              </>
            ) : (
              'Unpublish'
            )}
          </button>
        </>
      )}
    </div>
  );
}
