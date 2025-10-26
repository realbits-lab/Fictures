"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useStoryReader, useReadingProgress } from '@/hooks/useStoryReader';
import { useChapterScenes } from '@/hooks/useChapterScenes';
import { useScenePrefetch } from '@/hooks/useScenePrefetch';
import { useSceneView } from '@/hooks/useSceneView';
import { ProgressIndicator } from './ProgressIndicator';
import { CommentSection } from './CommentSection';
import type { Chapter } from '@/hooks/useStoryReader';
import { trackReading } from '@/lib/analytics/google-analytics';

interface ChapterReaderClientProps {
  storyId: string;
  initialData?: any; // SSR data from server
}

export function ChapterReaderClient({ storyId, initialData }: ChapterReaderClientProps) {
  const componentMountTime = useRef(performance.now());
  const componentId = useRef(Math.random().toString(36).substring(7));

  console.log(`[${componentId.current}] 🎭 ChapterReaderClient MOUNT - Story: ${storyId}${initialData ? ' (with SSR data)' : ' (client-side only)'}`);

  const { data: session } = useSession();
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [isScrollRestored, setIsScrollRestored] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allScenes, setAllScenes] = useState<Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string }>>([]);

  // Immersive reading mode state
  const [isUIVisible, setIsUIVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Prefetch hook for adjacent scenes
  const { prefetchAdjacentScenes } = useScenePrefetch();

  // Track scene views for analytics
  useSceneView(selectedSceneId);

  // Scene scroll position management - moved outside useEffect dependencies
  const scrollPositionKey = React.useCallback((sceneId: string) => `fictures_scene_scroll_${storyId}_${sceneId}`, [storyId]);

  // Debounced scroll position save to reduce localStorage writes
  const saveScrollPosition = React.useCallback((sceneId: string, position: number) => {
    // Clear any pending save
    if (scrollSaveTimeoutRef.current) {
      clearTimeout(scrollSaveTimeoutRef.current);
    }

    // Debounce localStorage write by 500ms
    scrollSaveTimeoutRef.current = setTimeout(() => {
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
    }, 500);
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
    const navStartTime = performance.now();
    const navId = Math.random().toString(36).substring(7);

    console.log(`[${navId}] 🧭 NAVIGATION START - Scene: ${sceneId}, Chapter: ${chapterId}`);

    // Save current scroll position before switching
    if (selectedSceneId && mainContentRef.current) {
      const saveStartTime = performance.now();
      const currentScrollTop = mainContentRef.current.scrollTop;
      saveScrollPosition(selectedSceneId, currentScrollTop);
      const saveDuration = performance.now() - saveStartTime;
      console.log(`[${navId}] 💾 Saved scroll position (${currentScrollTop}px) in ${saveDuration.toFixed(2)}ms`);
    }

    // Reset scroll restoration state and switch scene
    const stateUpdateStartTime = performance.now();
    setIsScrollRestored(false);
    setSelectedChapterId(chapterId);
    setSelectedSceneId(sceneId);
    setIsSidebarOpen(false);
    setIsUIVisible(true);
    const stateUpdateDuration = performance.now() - stateUpdateStartTime;
    console.log(`[${navId}] 🔄 State updates: ${stateUpdateDuration.toFixed(2)}ms`);

    // ⚡ Prefetch adjacent scenes in background for instant navigation
    const prefetchStartTime = performance.now();
    const currentIndex = allScenes.findIndex(item => item.scene.id === sceneId);
    if (currentIndex >= 0) {
      const prevScene = currentIndex > 0 ? allScenes[currentIndex - 1] : null;
      const nextScene = currentIndex < allScenes.length - 1 ? allScenes[currentIndex + 1] : null;

      console.log(`[${navId}] 🔮 Triggering prefetch - Prev: ${prevScene?.chapterId || 'none'}, Next: ${nextScene?.chapterId || 'none'}`);

      prefetchAdjacentScenes(
        chapterId,
        prevScene?.chapterId,
        nextScene?.chapterId
      );
    }
    const prefetchTriggerDuration = performance.now() - prefetchStartTime;

    const totalNavDuration = performance.now() - navStartTime;
    console.log(`[${navId}] ✅ Navigation sync operations: ${totalNavDuration.toFixed(2)}ms`);
    console.log(`[${navId}] 📊 Breakdown: Save=${stateUpdateDuration.toFixed(0)}ms, StateUpdate=${stateUpdateDuration.toFixed(0)}ms, PrefetchTrigger=${prefetchTriggerDuration.toFixed(0)}ms`);
  }, [selectedSceneId, saveScrollPosition, allScenes, prefetchAdjacentScenes]);

  // Toggle UI visibility on tap/click
  const handleContentTap = React.useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't toggle if clicking on interactive elements
    const isInteractive = target.closest('button, a, input, textarea, select, img, video, [role="button"]');
    if (isInteractive) {
      console.log('👆 Clicked interactive element, not toggling UI');
      return;
    }

    setIsUIVisible(prev => {
      console.log(`👆 Content tapped: ${prev ? 'Hiding' : 'Showing'} UI`);
      return !prev;
    });
  }, []);

  // Use the new SWR hook for data fetching with caching
  // Pass SSR data as fallback for instant hydration
  const {
    story,
    isOwner,
    availableChapters,
    isLoading,
    isValidating,
    error,
    refreshStory
  } = useStoryReader(storyId, initialData);

  // Reading progress management
  const readingProgress = useReadingProgress(storyId, selectedChapterId);

  // Fetch scenes for selected chapter on demand
  const {
    scenes: chapterScenes,
    isLoading: scenesLoading,
    isValidating: scenesValidating,
    error: scenesError
  } = useChapterScenes(selectedChapterId);

  // Fetch all scenes from all chapters in PARALLEL (major performance optimization)
  useEffect(() => {
    const fetchAllScenes = async () => {
      if (!story || availableChapters.length === 0) return;

      console.log(`🚀 Starting parallel scene fetch for ${availableChapters.length} chapters...`);
      const startTime = performance.now();

      // Build chapter list with metadata
      const chaptersToFetch: Array<{
        id: string;
        title: string;
        partTitle?: string;
        partOrderIndex: number;
        chapterOrderIndex: number;
      }> = [];

      // Process parts and their chapters in order
      for (const part of [...story.parts].sort((a, b) => a.orderIndex - b.orderIndex)) {
        const partChapters = part.chapters
          .filter(chapter => isOwner || chapter.status === 'published')
          .sort((a, b) => a.orderIndex - b.orderIndex);

        partChapters.forEach(chapter => {
          chaptersToFetch.push({
            id: chapter.id,
            title: chapter.title,
            partTitle: part.title,
            partOrderIndex: part.orderIndex,
            chapterOrderIndex: chapter.orderIndex
          });
        });
      }

      // Process standalone chapters if story has no parts
      if (story.chapters.length > 0 && story.parts.length === 0) {
        const standaloneChapters = [...story.chapters]
          .filter(chapter => isOwner || chapter.status === 'published')
          .sort((a, b) => a.orderIndex - b.orderIndex);

        standaloneChapters.forEach(chapter => {
          chaptersToFetch.push({
            id: chapter.id,
            title: chapter.title,
            partOrderIndex: 0,
            chapterOrderIndex: chapter.orderIndex
          });
        });
      }

      // ⚡ PARALLEL FETCH - Fire all requests simultaneously
      const fetchStartTimes = new Map();
      const fetchPromises = chaptersToFetch.map(async (chapter) => {
        const chapterFetchStart = performance.now();
        fetchStartTimes.set(chapter.id, chapterFetchStart);
        console.log(`🚀 [PARALLEL] Starting fetch for chapter: ${chapter.title} (${chapter.id})`);

        try {
          const response = await fetch(`/studio/api/chapters/${chapter.id}/scenes`, {
            credentials: 'include',
          });

          const fetchDuration = performance.now() - chapterFetchStart;

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ [PARALLEL] Chapter fetch completed: ${chapter.title} in ${fetchDuration.toFixed(0)}ms (${data.scenes?.length || 0} scenes)`);
            return {
              chapter,
              scenes: data.scenes || [],
              success: true
            };
          } else {
            console.warn(`❌ [PARALLEL] Failed fetch: ${chapter.title} - ${response.status} in ${fetchDuration.toFixed(0)}ms`);
            return {
              chapter,
              scenes: [],
              success: false
            };
          }
        } catch (error) {
          const fetchDuration = performance.now() - chapterFetchStart;
          console.error(`❌ [PARALLEL] Error fetching ${chapter.title} after ${fetchDuration.toFixed(0)}ms:`, error);
          return {
            chapter,
            scenes: [],
            success: false
          };
        }
      });

      // Wait for all fetches to complete (truly parallel execution)
      console.log(`⏳ [PARALLEL] Waiting for ${fetchPromises.length} chapter fetches to complete...`);
      const results = await Promise.all(fetchPromises);

      // Build flat scene list with proper ordering
      const scenesList: Array<{ scene: any; chapterId: string; chapterTitle: string; partTitle?: string; globalOrder: number }> = [];
      let globalOrder = 0;

      results.forEach(result => {
        if (result.success && result.scenes.length > 0) {
          const sortedScenes = [...result.scenes].sort((a, b) => a.orderIndex - b.orderIndex);

          sortedScenes.forEach((scene) => {
            scenesList.push({
              scene,
              chapterId: result.chapter.id,
              chapterTitle: result.chapter.title,
              partTitle: result.chapter.partTitle,
              globalOrder: globalOrder++
            });
          });
        }
      });

      setAllScenes(scenesList);

      const endTime = performance.now();
      const duration = (endTime - startTime).toFixed(0);
      console.log(`✅ Parallel fetch completed in ${duration}ms (${results.length} chapters, ${scenesList.length} scenes)`);
      console.log(`⚡ Performance improvement: ${results.length * 500}ms sequential → ${duration}ms parallel = ${((results.length * 500) / parseFloat(duration)).toFixed(1)}x faster`);
    };

    fetchAllScenes();
  }, [story, availableChapters, isOwner]);

  // Auto-select first scene on load
  useEffect(() => {
    if (!selectedSceneId && allScenes.length > 0) {
      const autoSelectStartTime = performance.now();
      const selectId = Math.random().toString(36).substring(7);

      console.log(`[${selectId}] 🎯 AUTO-SELECT first scene - ${allScenes.length} scenes available`);

      const firstScene = allScenes[0];
      if (firstScene) {
        setSelectedChapterId(firstScene.chapterId);
        setSelectedSceneId(firstScene.scene.id);

        // Track reading start
        trackReading.startReading(storyId, firstScene.chapterId);

        const autoSelectDuration = performance.now() - autoSelectStartTime;
        const timeSinceMount = performance.now() - componentMountTime.current;
        console.log(`[${selectId}] ✅ First scene selected: ${autoSelectDuration.toFixed(2)}ms`);
        console.log(`[${selectId}] ⏱️  Time from mount to first scene: ${timeSinceMount.toFixed(2)}ms`);
      }
    }
  }, [selectedSceneId, allScenes, storyId]);

  // ⚡ OPTIMIZED: Async scroll restoration (non-blocking, happens in background)
  useEffect(() => {
    if (selectedSceneId && !isScrollRestored) {
      const scrollRestoreStartTime = performance.now();
      const scrollId = Math.random().toString(36).substring(7);

      const savedPosition = getScrollPosition(selectedSceneId);
      console.log(`[${scrollId}] 📜 SCROLL RESTORE START - Scene: ${selectedSceneId}, Saved position: ${savedPosition}px`);

      // Restore scroll position asynchronously without blocking content display
      requestAnimationFrame(() => {
        const rafStartTime = performance.now();

        if (mainContentRef.current && savedPosition > 0) {
          // Directly set scroll position (instant, no smooth scroll for performance)
          mainContentRef.current.scrollTop = savedPosition;
          const scrollSetDuration = performance.now() - rafStartTime;
          const totalDuration = performance.now() - scrollRestoreStartTime;
          console.log(`[${scrollId}] ✅ Scroll restored to ${savedPosition}px - RAF: ${scrollSetDuration.toFixed(2)}ms, Total: ${totalDuration.toFixed(2)}ms`);
        } else {
          const totalDuration = performance.now() - scrollRestoreStartTime;
          console.log(`[${scrollId}] ℹ️  No scroll to restore - Total: ${totalDuration.toFixed(2)}ms`);
        }
        setIsScrollRestored(true);
      });
    }
  }, [selectedSceneId, isScrollRestored, getScrollPosition]);

  // Save scroll position during scrolling + Handle scroll direction for immersive mode
  useEffect(() => {
    const mainContentElement = mainContentRef.current;
    if (!mainContentElement || !selectedSceneId || !isScrollRestored) return;

    let isHandlingScroll = false; // Prevent rapid toggling

    const handleScroll = () => {
      if (selectedSceneId && mainContentElement && isScrollRestored && !isHandlingScroll) {
        const currentScrollTop = mainContentElement.scrollTop;
        const scrollHeight = mainContentElement.scrollHeight;
        const clientHeight = mainContentElement.clientHeight;

        // Calculate distances from top and bottom
        const distanceFromTop = currentScrollTop;
        const distanceFromBottom = scrollHeight - (currentScrollTop + clientHeight);

        // Save scroll position
        saveScrollPosition(selectedSceneId, currentScrollTop);

        // Handle immersive reading mode (auto-hide/show UI)
        const scrollThreshold = 80; // Increased threshold to reduce sensitivity
        const scrollDifference = currentScrollTop - lastScrollY;
        const boundaryThreshold = 50; // Distance from top/bottom to ignore UI toggling

        // Prevent UI toggling near boundaries (top or bottom)
        const isNearTop = distanceFromTop < boundaryThreshold;
        const isNearBottom = distanceFromBottom < boundaryThreshold;

        if (isNearTop || isNearBottom) {
          // Near boundaries - don't toggle UI, but show UI at top
          if (isNearTop && !isUIVisible) {
            isHandlingScroll = true;
            setIsUIVisible(true);
            console.log('📖 Near top: Showing UI');
            setTimeout(() => { isHandlingScroll = false; }, 300);
          }
          // Don't hide/show UI when near bottom to prevent flickering
          setLastScrollY(currentScrollTop);
          return;
        }

        // Only toggle UI when in the middle of content with significant scroll
        // Scrolling down - hide UI
        if (scrollDifference > scrollThreshold && currentScrollTop > 100) {
          if (isUIVisible) {
            isHandlingScroll = true;
            setIsUIVisible(false);
            console.log('📖 Immersive mode: Hiding UI');
            setTimeout(() => { isHandlingScroll = false; }, 300);
          }
        }
        // Scrolling up - show UI
        else if (scrollDifference < -scrollThreshold) {
          if (!isUIVisible) {
            isHandlingScroll = true;
            setIsUIVisible(true);
            console.log('📖 Immersive mode: Showing UI');
            setTimeout(() => { isHandlingScroll = false; }, 300);
          }
        }

        setLastScrollY(currentScrollTop);
      }
    };

    // Throttle scroll events for performance (increased to reduce sensitivity)
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 200); // Increased from 150ms
    };

    mainContentElement.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      mainContentElement.removeEventListener('scroll', throttledScroll);
      clearTimeout(scrollTimeout);
    };
  }, [selectedSceneId, isScrollRestored, saveScrollPosition, lastScrollY, isUIVisible]);

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
              href="/novels"
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
            <div className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
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
    <div data-testid="chapter-reader" className={`absolute inset-0 ${isUIVisible ? 'top-16 z-auto' : 'top-0 z-[70]'} bg-white dark:bg-gray-900 flex flex-col transition-[top] duration-300 ease-in-out`}>
      {/* Second GNB - Reading Navigation Header */}
      <div className={`${isUIVisible ? 'sticky' : 'fixed'} top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out ${
        isUIVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
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
                href="/novels"
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
              <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
                <span className="hidden md:inline text-gray-300 dark:text-gray-600">/</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs">
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
        {/* Clickable overlay for hidden sidebar space on desktop */}
        {!isUIVisible && (
          <div
            className="hidden md:block absolute inset-y-0 left-0 w-80 cursor-pointer z-10"
            onClick={handleContentTap}
            aria-label="Click to show menu"
          />
        )}

        {/* Left Sidebar - Chapter Navigation */}
        <div
          className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isUIVisible ? 'md:translate-x-0' : 'md:-translate-x-full'}
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
          <div
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Scenes
              </h2>

              {/* Flat Scene List */}
              {/* ⚡ OPTIMIZATION: Show loading only if truly no data (not even cached) */}
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
                            {item.scene.novelUniqueViewCount !== undefined && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
                                <span>👁️</span>
                                <span>{item.scene.novelUniqueViewCount.toLocaleString()}</span>
                              </div>
                            )}
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
              href="/novels"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              ← Back to Browse
            </Link>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          ref={mainContentRef}
          className="flex-1 h-full overflow-y-auto min-h-0 cursor-pointer"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'auto'
          }}
          onClick={handleContentTap}
        >
          {selectedChapter ? (
            <article
              className="max-w-4xl mx-auto px-8 py-8 pb-24 md:pb-8"
            >
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
                ) : (scenesLoading && chapterScenes.length === 0) ? (
                  // ⚡ OPTIMIZATION: Only show skeleton if NO data exists (not cached, not fresh)
                  // If cached data exists, show it immediately even while revalidating
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
                ) : selectedScene ? (
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

                    {/* Scene Content - ⚡ RENDERS IMMEDIATELY (no waiting for scroll restoration) */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {selectedScene.content || (
                        <p className="text-gray-500 dark:text-gray-400 italic">
                          This scene is empty.
                        </p>
                      )}
                    </div>
                  </>
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
                    {/* Skeleton Loading State for Empty Chapter */}
                    <div className="max-w-4xl mx-auto">
                      {/* Scene Title Skeleton */}
                      <div className="animate-pulse mb-8">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3 mb-6"></div>
                      </div>

                      {/* Scene Image Skeleton */}
                      <div className="animate-pulse mb-8">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      </div>

                      {/* Scene Content Skeleton - Multiple paragraphs */}
                      <div className="animate-pulse space-y-6">
                        {/* Paragraph 1 */}
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-10/12"></div>
                        </div>

                        {/* Paragraph 2 */}
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        </div>

                        {/* Paragraph 3 */}
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8/12"></div>
                        </div>

                        {/* Paragraph 4 */}
                        <div className="space-y-3">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-11/12"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-9/12"></div>
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="mt-12 text-center">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {isOwner ? 'Create scenes to publish this chapter' : 'Content being prepared...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
            <div className="h-full flex items-center justify-center p-8 pb-24 md:pb-8">
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

      {/* Sticky Bottom Navigation - Previous/Next Buttons */}
      {/* Always visible on all screen sizes for easy navigation */}
      {(() => {
        const currentSceneIndex = allScenes.findIndex(item => item.scene.id === selectedSceneId);
        const prevSceneItem = currentSceneIndex > 0 ? allScenes[currentSceneIndex - 1] : null;
        const nextSceneItem = currentSceneIndex < allScenes.length - 1 ? allScenes[currentSceneIndex + 1] : null;

        return (
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700">
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