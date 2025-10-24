"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStoryReader, useReadingProgress } from '@/hooks/useStoryReader';
import { useChapterScenes } from '@/hooks/useChapterScenes';
import { ProgressIndicator } from './ProgressIndicator';
import { CommentSection } from './CommentSection';
import type { Chapter } from '@/hooks/useStoryReader';
import { trackReading } from '@/lib/analytics/google-analytics';

interface ChapterReaderClientProps {
  storyId: string;
}

export function ChapterReaderClient({ storyId }: ChapterReaderClientProps) {
  const { data: session } = useSession();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isScrollRestored, setIsScrollRestored] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allScenes, setAllScenes] = useState<Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string }>>([]);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Scene scroll position management - moved outside useEffect dependencies
  const scrollPositionKey = React.useCallback((sceneId: string) => `fictures_scene_scroll_${storyId}_${sceneId}`, [storyId]);

  const saveScrollPosition = React.useCallback((sceneId: string, position: number) => {
    try {
      // Only save if position is meaningful (not at top, not undefined)
      if (position > 0 && !isNaN(position)) {
        localStorage.setItem(scrollPositionKey(sceneId), position.toString());
        console.log(`💾 Saved scroll position for scene ${sceneId}: ${position}px`);
      } else if (position === 0) {
        // Remove saved position if user scrolled back to top
        localStorage.removeItem(scrollPositionKey(sceneId));
        console.log(`🗑️ Cleared scroll position for scene ${sceneId} (at top)`);
      }
    } catch (error) {
      console.warn('Failed to save scroll position:', error);

      // If quota exceeded, try to clean up old scroll positions
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.log('Attempting to clear old scroll positions due to quota...');
        clearOldScrollPositions();
      }
    }
  }, [scrollPositionKey]);

  const getScrollPosition = React.useCallback((sceneId: string): number => {
    try {
      const saved = localStorage.getItem(scrollPositionKey(sceneId));
      const position = saved ? parseInt(saved, 10) : 0;
      console.log(`📖 Retrieved scroll position for scene ${sceneId}: ${position}px`);
      return position;
    } catch (error) {
      console.warn('Failed to get scroll position:', error);
      return 0;
    }
  }, [scrollPositionKey]);

  // Clear old scroll positions to free up localStorage space
  const clearOldScrollPositions = React.useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      const scrollKeys = keys.filter(key => key.startsWith('fictures_scene_scroll_'));

      // Keep only the last 50 scroll positions (most recent story)
      const currentStoryKeys = scrollKeys.filter(key => key.includes(storyId));
      const otherStoryKeys = scrollKeys.filter(key => !key.includes(storyId));

      // Remove scroll positions from other stories
      otherStoryKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🧹 Cleaned up ${otherStoryKeys.length} old scroll positions`);
    } catch (error) {
      console.warn('Failed to clear old scroll positions:', error);
    }
  }, [storyId]);

  const handleSceneSelect = React.useCallback((sceneId: string, chapterId: string) => {
    console.log(`🎬 Switching to scene: ${sceneId} in chapter: ${chapterId}`);

    // Save current scroll position before switching
    if (selectedSceneId && mainContentRef.current) {
      const currentScrollTop = mainContentRef.current.scrollTop;
      saveScrollPosition(selectedSceneId, currentScrollTop);
      console.log(`💾 Saved current scene ${selectedSceneId} position: ${currentScrollTop}px`);
    }

    // Reset scroll restoration state and switch scene
    setIsScrollRestored(false);
    setSelectedChapterId(chapterId);
    setSelectedSceneId(sceneId);

    // Close sidebar on mobile after scene selection
    setIsSidebarOpen(false);
  }, [selectedSceneId, saveScrollPosition]);

  // Use the new SWR hook for data fetching with caching
  const {
    story,
    isOwner,
    availableChapters,
    isLoading,
    isValidating,
    error,
    refreshStory
  } = useStoryReader(storyId);

  // Reading progress management
  const readingProgress = useReadingProgress(storyId, selectedChapterId);

  // Fetch scenes for selected chapter on demand
  const {
    scenes: chapterScenes,
    isLoading: scenesLoading,
    isValidating: scenesValidating,
    error: scenesError
  } = useChapterScenes(selectedChapterId);

  // Fetch all scenes from all chapters and create a flat ordered list
  useEffect(() => {
    const fetchAllScenes = async () => {
      if (!story || availableChapters.length === 0) return;

      const scenesList: Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string; globalOrder: number }> = [];
      let globalOrder = 0;

      // Process parts and their chapters in order
      for (const part of [...story.parts].sort((a, b) => a.orderIndex - b.orderIndex)) {
        const partChapters = part.chapters
          .filter(chapter => isOwner || chapter.status === 'published')
          .sort((a, b) => a.orderIndex - b.orderIndex);

        for (const chapter of partChapters) {
          try {
            const response = await fetch(`/writing/api/chapters/${chapter.id}/scenes`, {
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              const sortedScenes = [...data.scenes].sort((a, b) => a.orderIndex - b.orderIndex);

              sortedScenes.forEach((scene) => {
                scenesList.push({
                  scene,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  partTitle: part.title,
                  globalOrder: globalOrder++
                });
              });
            }
          } catch (error) {
            console.error(`Error fetching scenes for chapter ${chapter.id}:`, error);
          }
        }
      }

      // Process standalone chapters if story has no parts
      if (story.chapters.length > 0 && story.parts.length === 0) {
        const standaloneChapters = [...story.chapters]
          .filter(chapter => isOwner || chapter.status === 'published')
          .sort((a, b) => a.orderIndex - b.orderIndex);

        for (const chapter of standaloneChapters) {
          try {
            const response = await fetch(`/writing/api/chapters/${chapter.id}/scenes`, {
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              const sortedScenes = [...data.scenes].sort((a, b) => a.orderIndex - b.orderIndex);

              sortedScenes.forEach((scene) => {
                scenesList.push({
                  scene,
                  chapterId: chapter.id,
                  chapterTitle: chapter.title,
                  globalOrder: globalOrder++
                });
              });
            }
          } catch (error) {
            console.error(`Error fetching scenes for chapter ${chapter.id}:`, error);
          }
        }
      }

      setAllScenes(scenesList);
    };

    fetchAllScenes();
  }, [story, availableChapters, isOwner]);

  // Auto-select first scene on load
  useEffect(() => {
    if (!selectedSceneId && allScenes.length > 0) {
      const firstScene = allScenes[0];
      if (firstScene) {
        setSelectedChapterId(firstScene.chapterId);
        setSelectedSceneId(firstScene.scene.id);

        // Track reading start
        trackReading.startReading(storyId, firstScene.chapterId);
      }
    }
  }, [selectedSceneId, allScenes, storyId]);

  // Restore scroll position when scene changes
  useEffect(() => {
    if (selectedSceneId && !isScrollRestored) {
      const savedPosition = getScrollPosition(selectedSceneId);
      console.log(`🔄 Attempting to restore scroll position for scene ${selectedSceneId}: ${savedPosition}px`);

      // Wait for content to render before restoring scroll position
      let retryCount = 0;
      const maxRetries = 10;

      const restoreScrollPosition = () => {
        if (mainContentRef.current) {
          // Check if content is actually rendered by checking scrollHeight
          const hasContent = mainContentRef.current.scrollHeight > mainContentRef.current.clientHeight;

          if (hasContent || retryCount >= maxRetries) {
            console.log(`📦 Restoring scroll position to: ${savedPosition}px (attempt ${retryCount + 1})`);

            // Use smooth scroll for better UX if position is not too far
            const shouldSmoothScroll = savedPosition > 0 && savedPosition < 3000;

            if (shouldSmoothScroll) {
              mainContentRef.current.scrollTo({
                top: savedPosition,
                behavior: 'smooth'
              });
            } else {
              mainContentRef.current.scrollTop = savedPosition;
            }

            setIsScrollRestored(true);

            // Verify restoration after smooth scroll completes
            if (shouldSmoothScroll) {
              setTimeout(() => {
                if (mainContentRef.current) {
                  const actualPosition = mainContentRef.current.scrollTop;
                  if (Math.abs(actualPosition - savedPosition) > 10) {
                    console.log(`📌 Fine-tuning scroll position: ${actualPosition}px → ${savedPosition}px`);
                    mainContentRef.current.scrollTop = savedPosition;
                  }
                }
              }, 300);
            }
          } else {
            // Content not ready yet, retry
            retryCount++;
            console.log(`⏳ Content not ready, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(restoreScrollPosition, 50);
          }
        } else {
          console.warn('⚠️ mainContentRef.current is null, retrying...');
          retryCount++;
          if (retryCount < maxRetries) {
            setTimeout(restoreScrollPosition, 50);
          } else {
            console.error('❌ Failed to restore scroll position after max retries');
            setIsScrollRestored(true); // Give up and mark as restored
          }
        }
      };

      // Use multiple async methods to ensure content is ready
      requestAnimationFrame(() => {
        setTimeout(restoreScrollPosition, 10);
      });
    }
  }, [selectedSceneId, isScrollRestored, getScrollPosition]);

  // Save scroll position during scrolling
  useEffect(() => {
    const mainContentElement = mainContentRef.current;
    if (!mainContentElement || !selectedSceneId || !isScrollRestored) return;

    const handleScroll = () => {
      if (selectedSceneId && mainContentElement && isScrollRestored) {
        const currentScrollTop = mainContentElement.scrollTop;
        saveScrollPosition(selectedSceneId, currentScrollTop);
      }
    };

    // Throttle scroll events for performance
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 150);
    };

    mainContentElement.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      mainContentElement.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedSceneId, isScrollRestored, saveScrollPosition]);

  // Setup non-passive wheel event listeners for independent scrolling
  useEffect(() => {
    const sidebarElement = sidebarScrollRef.current;
    const mainContentElement = mainContentRef.current;

    const handleSidebarWheel = (e: WheelEvent) => {
      e.stopPropagation();
      
      if (sidebarElement && sidebarElement.scrollHeight > sidebarElement.clientHeight) {
        return;
      }
      
      e.preventDefault();
    };

    const handleMainContentWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };

    if (sidebarElement) {
      sidebarElement.addEventListener('wheel', handleSidebarWheel, { passive: false });
    }
    
    if (mainContentElement) {
      mainContentElement.addEventListener('wheel', handleMainContentWheel, { passive: false });
    }

    return () => {
      if (sidebarElement) {
        sidebarElement.removeEventListener('wheel', handleSidebarWheel);
      }
      if (mainContentElement) {
        mainContentElement.removeEventListener('wheel', handleMainContentWheel);
      }
    };
  }, []);

  // Save reading position on chapter change
  useEffect(() => {
    if (selectedChapterId) {
      readingProgress.savePosition(selectedChapterId, 0);
    }
  }, [selectedChapterId, readingProgress]);

  const selectedChapter = availableChapters.find(ch => ch.id === selectedChapterId);
  const selectedScene = chapterScenes.find(scene => scene.id === selectedSceneId);
  const selectedSceneData = allScenes.find(item => item.scene.id === selectedSceneId);

  // Calculate global chapter number
  const getGlobalChapterNumber = (chapterId: string) => {
    if (!story) return 0;
    
    let chapterNumber = 0;
    
    for (const part of story.parts) {
      for (const chapter of part.chapters) {
        chapterNumber++;
        if (chapter.id === chapterId) return chapterNumber;
      }
    }
    
    for (const chapter of story.chapters) {
      chapterNumber++;
      if (chapter.id === chapterId) return chapterNumber;
    }
    
    return chapterNumber;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "published": return "🚀";
      case "in_progress": return "🔄";
      case "draft": return "📝";
      default: return "📝";
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Story
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.status === 404 
              ? "This story could not be found." 
              : error.status === 403
              ? "You don't have permission to read this story."
              : "There was an error loading the story content."
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refreshStory()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/reading"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading || !story) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="absolute inset-0 top-16 flex flex-col">
          {/* Loading GNB */}
          <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 md:px-6 py-3">
              <div className="flex items-center gap-3 md:gap-4">
                {/* Hamburger menu skeleton - mobile only */}
                <div className="md:hidden h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                <div className="hidden md:block h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="hidden md:block h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 relative">
            {/* Sidebar Loading - Hidden on mobile, visible on desktop */}
            <div className="hidden md:block w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              {/* Story header skeleton */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              </div>

              {/* Scene list skeleton */}
              <div className="p-4 animate-pulse">
                {/* "Scenes" header skeleton */}
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-3"></div>

                {/* Scene items skeleton */}
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
                      <div className="flex items-start gap-2">
                        {/* Icon placeholder */}
                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Scene title placeholder */}
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          {/* Chapter/part subtitle placeholder */}
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Loading - Full width on mobile, flex-1 on desktop */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                {/* Scene title skeleton */}
                <div className="h-8 md:h-10 bg-gray-200 dark:bg-gray-700 rounded w-4/5 md:w-2/3"></div>

                {/* Scene metadata skeleton */}
                <div className="h-3 md:h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 md:w-1/4"></div>

                {/* Content skeleton */}
                <div className="space-y-3 mt-8">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No chapters available
  if (availableChapters.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No published chapters available yet.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Check back later for new content!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="chapter-reader" className="absolute inset-0 top-16 bg-white dark:bg-gray-900 flex flex-col">
      {/* Second GNB - Reading Navigation Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 md:px-6 py-3">
          {/* Left: Hamburger Menu (Mobile) + Story Info & Chapter Navigation */}
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Toggle chapter navigation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <Link
                href="/reading"
                className="hidden sm:inline text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
              >
                ← Browse
              </Link>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-xs">
                {story.title}
              </span>
              {/* Cache status indicator */}
              {isValidating && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Updating..."></div>
              )}
            </div>
            {selectedScene && (
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                  🎬 {selectedScene.title}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Backdrop Overlay - Mobile Only */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Container */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar - Chapter Navigation */}
        <div className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          fixed md:relative
          inset-y-0 left-0
          z-50 md:z-0
          w-80 bg-gray-50 dark:bg-gray-800
          border-r border-gray-200 dark:border-gray-700
          flex flex-col h-full
          transition-transform duration-300 ease-in-out
          top-0 md:top-auto
        `}>
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
          <div
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Scenes
              </h2>

              {/* Flat Scene List */}
              {allScenes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  Loading scenes...
                </div>
              ) : (
                <div className="space-y-1">
                  {allScenes.map((item, index) => {
                    const isSceneSelected = selectedSceneId === item.scene.id;

                    return (
                      <button
                        key={item.scene.id}
                        onClick={() => handleSceneSelect(item.scene.id, item.chapterId)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSceneSelected
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
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link 
              href="/reading"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back to Browse
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div 
          ref={mainContentRef}
          className="flex-1 h-full overflow-y-auto min-h-0"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'auto'
          }}
        >
          {selectedChapter ? (
            <article className="max-w-4xl mx-auto px-8 py-8">
              {/* Scene Header */}
              <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedScene ? selectedScene.title : selectedChapter.title}
                </h1>
              </header>

              {/* Scene Content */}
              <div className="prose prose-lg max-w-none" style={{ color: 'rgb(var(--foreground))' }}>
                {scenesError ? (
                  <div className="text-center py-12 text-red-500 dark:text-red-400">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-semibold mb-4">❌ Error Loading Scenes</h3>
                      <p className="text-sm mb-4">
                        Failed to load scenes for this chapter.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : scenesLoading ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="max-w-md mx-auto">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      </div>
                      <p className="text-sm mt-4">Loading scene...</p>
                    </div>
                  </div>
                ) : selectedScene && isScrollRestored ? (
                  <>
                    {console.log(`📖 Rendering selected scene: ${selectedScene.title}`)}
                    {/* Scene Image */}
                    {selectedScene.sceneImage?.url && (
                      <div className="mb-6">
                        <div className="rounded-lg overflow-hidden shadow-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedScene.sceneImage.url}
                            alt={`Scene: ${selectedScene.title}`}
                            className="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {/* Scene Content */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {selectedScene.content || (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          This scene is empty.
                        </p>
                      )}
                    </div>
                  </>
                ) : selectedScene ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="max-w-md mx-auto">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      </div>
                      <p className="text-sm mt-4">Preparing scene...</p>
                    </div>
                  </div>
                ) : chapterScenes.length > 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="max-w-md mx-auto">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4 mx-auto"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                      </div>
                      <p className="text-sm mt-4">Preparing content...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {console.log(`⚠️  Chapter has no scenes: ${selectedChapter?.title} - Architecture violation!`)}
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <div className="max-w-md mx-auto">
                        <h3 className="text-lg font-semibold mb-4">📝 Chapter Not Ready</h3>
                        <p className="text-sm mb-4">
                          This chapter hasn&apos;t been structured into scenes yet.
                          Chapters must be organized into scenes to be readable.
                        </p>
                        {isOwner && (
                          <p className="text-xs text-gray-400">
                            As the author, please use the writing interface to create scenes for this chapter.
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Scene Navigation */}
              <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                {(() => {
                  const currentSceneIndex = allScenes.findIndex(item => item.scene.id === selectedSceneId);
                  const prevSceneItem = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null;
                  const nextSceneItem = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null;

                  return (
                    <>
                      <div>
                        {prevSceneItem && (
                          <button
                            onClick={() => handleSceneSelect(prevSceneItem.scene.id, prevSceneItem.chapterId)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            ← Previous Scene: {prevSceneItem.scene.title}
                          </button>
                        )}
                      </div>

                      <div className="text-center">
                        {allScenes.length > 0 && selectedSceneId && currentSceneIndex >= 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Scene {currentSceneIndex + 1} of {allScenes.length}
                          </span>
                        )}
                      </div>

                      <div>
                        {nextSceneItem && (
                          <button
                            onClick={() => handleSceneSelect(nextSceneItem.scene.id, nextSceneItem.chapterId)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            Next Scene: {nextSceneItem.scene.title} →
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Comments Section */}
              {selectedSceneId && (
                <div className="mt-12 pt-6">
                  <CommentSection
                    storyId={storyId}
                    chapterId={selectedChapterId || undefined}
                    sceneId={selectedSceneId}
                    currentUserId={session?.user?.id}
                  />
                </div>
              )}
            </article>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md mx-auto text-center">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mx-auto"></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading content...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}