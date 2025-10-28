/**
 * Comic Reader Client Component
 *
 * Dedicated comic reading interface that displays scenes as comic panels
 * instead of text. Optimized for vertical scroll reading experience.
 */

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStoryReader } from '@/hooks/useStoryReader';
import { useChapterScenes } from '@/hooks/useChapterScenes';
import { ComicViewer } from '@/components/comic/comic-viewer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface ComicReaderClientProps {
  storyId: string;
  initialData?: any;
}

export function ComicReaderClient({ storyId, initialData }: ComicReaderClientProps) {
  const componentId = useRef(Math.random().toString(36).substring(7));
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allScenes, setAllScenes] = useState<Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string }>>([]);

  console.log(`[${componentId.current}] 🎨 ComicReaderClient MOUNT - Story: ${storyId}`);

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
            partTitle: (chapter as any).partTitle
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {/* Friendly illustration */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center shadow-xl">
              <span className="text-6xl">🎨</span>
            </div>
          </div>

          {/* Friendly message */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Story Temporarily Unavailable
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">
            We're having trouble loading this story. Don't worry, it's still here!
            Try refreshing the page or come back in a few moments.
          </p>

          {/* Technical details (collapsible) */}
          <details className="mb-8 text-left mx-auto max-w-md">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-center">
              What happened?
            </summary>
            <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-600 dark:text-gray-400">
              <p className="mb-2 font-medium">Technical Details:</p>
              <div className="font-mono text-xs break-words bg-white dark:bg-gray-900 p-3 rounded">
                {error.message || 'An error occurred while loading the story.'}
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Link href="/comics">
              <button className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium">
                Browse Comics
              </button>
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg shadow-lg transition-all font-medium"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          {/* Animated illustration with comic book flipping effect */}
          <div className="mb-10 relative">
            {/* Background gradient glow */}
            <div className="absolute inset-0 w-40 h-40 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>

            {/* Main animated element */}
            <div className="relative w-40 h-40 mx-auto">
              {/* Rotating comic pages */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-32 h-32">
                  {/* Page 1 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-800 rounded-lg shadow-2xl transform -rotate-12 animate-pulse" style={{ animationDuration: '2s' }}>
                    <div className="p-4 h-full flex items-center justify-center">
                      <div className="w-full h-1 bg-purple-400 dark:bg-purple-600 rounded mb-2"></div>
                    </div>
                  </div>

                  {/* Page 2 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-pink-300 dark:from-pink-700 dark:to-pink-800 rounded-lg shadow-xl transform -rotate-6 animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>
                    <div className="p-4 h-full flex items-center justify-center">
                      <div className="w-full h-1 bg-pink-400 dark:bg-pink-600 rounded mb-2"></div>
                    </div>
                  </div>

                  {/* Page 3 - Front page with icon */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-800 dark:to-orange-900 rounded-lg shadow-2xl flex items-center justify-center animate-pulse" style={{ animationDuration: '2s', animationDelay: '0.6s' }}>
                    <span className="text-5xl animate-bounce" style={{ animationDuration: '1.8s' }}>🎨</span>
                  </div>
                </div>
              </div>

              {/* Orbiting sparkles */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full shadow-lg"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-400 rounded-full shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Loading text */}
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-3 animate-pulse">
            Loading Your Comic Story
          </h2>

          <p className="text-gray-700 dark:text-gray-300 mb-8 text-lg">
            Setting up panels, preparing scenes, and painting your adventure...
          </p>

          {/* Progress bar */}
          <div className="max-w-xs mx-auto mb-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full animate-pulse w-2/3"></div>
            </div>
          </div>

          {/* Loading steps with animated dots */}
          <div className="flex justify-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span>Panels</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span>Scenes</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span>Story</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 top-16 bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Story Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link
              href="/comics"
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors text-sm font-medium whitespace-nowrap"
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
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg flex-shrink-0"
            aria-label="Toggle scene navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
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
            inset-y-0 left-0
            z-50 md:z-20
            w-80 bg-gray-50 dark:bg-gray-800
            border-r border-gray-200 dark:border-gray-700
            flex flex-col h-full
            transition-transform duration-300 ease-in-out
            top-0 md:top-auto
          `}
        >
          {/* Story Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {story.title}
            </h1>
            {story.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {story.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {story.genre || 'No genre'}
              </span>
            </div>
          </div>

          {/* Scene List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Scenes
              </h2>
            <div className="space-y-1">
              {allScenes.map((item, index) => {
                const isSelected = item.scene.id === selectedSceneId;
                return (
                  <button
                    key={item.scene.id}
                    onClick={() => handleSceneSelect(item.scene.id, item.chapterId)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">🎬</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.scene.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {item.partTitle && <span>{item.partTitle} • </span>}
                          {item.chapterTitle}
                        </div>
                        {item.scene.comicUniqueViewCount !== undefined && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            <span>👁️</span>
                            <span>{item.scene.comicUniqueViewCount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/comics"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back to Browse
            </Link>
          </div>
        </div>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Comic Content */}
        <div className="flex-1 overflow-y-auto bg-white">
          {selectedScene ? (
            <div className="w-full max-w-md md:max-w-4xl mx-auto pb-24 md:pb-8">
              {/* Comic Viewer */}
              <ComicViewer
                sceneId={selectedScene.id}
                className=""
              />
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  No Scenes Available
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  This story doesn&apos;t have any scenes yet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Navigation - Previous/Next Buttons */}
      {/* Always visible on all screen sizes for easy navigation */}
      {(() => {
        const currentSceneIndex = allScenes.findIndex(item => item.scene.id === selectedSceneId);
        const prevSceneItem = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null;
        const nextSceneItem = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null;

        return (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
              {/* Previous Button - Left (Thumb Zone) */}
              <div className="flex-1">
                {prevSceneItem ? (
                  <button
                    onClick={() => handleSceneSelect(prevSceneItem.scene.id, prevSceneItem.chapterId)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    aria-label="Previous scene"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                ) : (
                  <div></div>
                )}
              </div>

              {/* Scene Counter - Center */}
              <div className="flex-shrink-0 text-center px-4">
                {allScenes.length > 0 && selectedSceneId && currentSceneIndex >= 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    {currentSceneIndex + 1} / {allScenes.length}
                  </span>
                )}
              </div>

              {/* Next Button - Right (Thumb Zone) */}
              <div className="flex-1 flex justify-end">
                {nextSceneItem ? (
                  <button
                    onClick={() => handleSceneSelect(nextSceneItem.scene.id, nextSceneItem.chapterId)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium"
                    aria-label="Next scene"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
