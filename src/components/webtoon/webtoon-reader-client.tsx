/**
 * Webtoon Reader Client Component
 *
 * Dedicated webtoon reading interface that displays scenes as webtoon panels
 * instead of text. Optimized for vertical scroll reading experience.
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStoryReader } from '@/hooks/useStoryReader';
import { useChapterScenes } from '@/hooks/useChapterScenes';
import { WebtoonViewer } from '@/components/webtoon/webtoon-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface WebtoonReaderClientProps {
  storyId: string;
  initialData?: any;
}

export function WebtoonReaderClient({ storyId, initialData }: WebtoonReaderClientProps) {
  const componentId = useRef(Math.random().toString(36).substring(7));
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allScenes, setAllScenes] = useState<Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string }>>([]);

  console.log(`[${componentId.current}] 🎨 WebtoonReaderClient MOUNT - Story: ${storyId}`);

  // Fetch story data
  const {
    story,
    availableChapters,
    isLoading,
    error
  } = useStoryReader(storyId, initialData);

  // Fetch scenes for selected chapter
  const {
    scenes: chapterScenes,
    isLoading: scenesLoading
  } = useChapterScenes(selectedChapterId);

  // Fetch all scenes from all chapters
  useEffect(() => {
    const fetchAllScenes = async () => {
      if (!story || availableChapters.length === 0) return;

      const scenesPromises = availableChapters.map(async (chapter) => {
        try {
          const response = await fetch(`/api/chapters/${chapter.id}/scenes`);
          if (!response.ok) return [];
          const data = await response.json();

          return data.scenes.map((scene: any) => ({
            scene,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            partTitle: chapter.partTitle
          }));
        } catch (error) {
          console.error(`Failed to fetch scenes for chapter ${chapter.id}:`, error);
          return [];
        }
      });

      const scenesArrays = await Promise.all(scenesPromises);
      const flatScenes = scenesArrays.flat();
      setAllScenes(flatScenes);

      // Auto-select first scene
      if (!selectedSceneId && flatScenes.length > 0) {
        const firstScene = flatScenes[0];
        setSelectedChapterId(firstScene.chapterId);
        setSelectedSceneId(firstScene.scene.id);
      }
    };

    fetchAllScenes();
  }, [story, availableChapters, selectedSceneId]);

  // Handle scene selection
  const handleSceneSelect = (sceneId: string, chapterId: string) => {
    setSelectedChapterId(chapterId);
    setSelectedSceneId(sceneId);
    setIsSidebarOpen(false);
  };

  const selectedScene = chapterScenes.find(scene => scene.id === selectedSceneId);
  const currentSceneIndex = allScenes.findIndex(item => item.scene.id === selectedSceneId);
  const prevScene = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null;
  const nextScene = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null;

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Story</AlertTitle>
          <AlertDescription>
            {error.message || 'An error occurred while loading the story.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading webtoon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Story Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link
                href="/webtoon"
                className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 text-sm font-medium whitespace-nowrap"
              >
                ← Back
              </Link>
              <div className="hidden md:block w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {story.title}
              </h1>
              {selectedScene && (
                <>
                  <span className="hidden md:inline text-gray-400 dark:text-gray-500">/</span>
                  <span className="hidden md:inline text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {selectedScene.title}
                  </span>
                </>
              )}
            </div>

            {/* Menu Toggle */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar - Scene Navigation */}
        <div
          className={`
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            fixed md:relative
            inset-y-0 left-0 top-[57px] md:top-0
            z-40
            w-80 bg-white dark:bg-gray-800
            border-r border-gray-200 dark:border-gray-700
            overflow-y-auto
            transition-transform duration-300 ease-in-out
          `}
        >
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Scenes
            </h2>
            <div className="space-y-1">
              {allScenes.map((item, index) => {
                const isSelected = item.scene.id === selectedSceneId;
                return (
                  <button
                    key={item.scene.id}
                    onClick={() => handleSceneSelect(item.scene.id, item.chapterId)}
                    className={`
                      w-full text-left px-3 py-2 rounded transition-colors
                      ${isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {item.partTitle && `${item.partTitle} • `}{item.chapterTitle}
                    </div>
                    <div className="text-sm font-medium line-clamp-1">
                      {index + 1}. {item.scene.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Webtoon Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {selectedScene ? (
            <div className="max-w-[1792px] mx-auto">
              {/* Webtoon Viewer */}
              <WebtoonViewer
                sceneId={selectedScene.id}
                className="pb-8"
              />

              {/* Navigation Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    {prevScene ? (
                      <button
                        onClick={() => handleSceneSelect(prevScene.scene.id, prevScene.chapterId)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Previous</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {currentSceneIndex + 1} / {allScenes.length}
                    </div>

                    {nextScene ? (
                      <button
                        onClick={() => handleSceneSelect(nextScene.scene.id, nextScene.chapterId)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                      >
                        <span className="text-sm font-medium">Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  No Scenes Available
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This story doesn't have any scenes yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
