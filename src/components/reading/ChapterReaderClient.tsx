"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStoryReader, useReadingProgress } from '@/hooks/useStoryReader';
import { useChapterScenes } from '@/hooks/useChapterScenes';
import { ProgressIndicator } from './ProgressIndicator';
import type { Chapter } from '@/hooks/useStoryReader';

interface ChapterReaderClientProps {
  storyId: string;
}

export function ChapterReaderClient({ storyId }: ChapterReaderClientProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

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

  // Auto-select first published chapter on load
  useEffect(() => {
    if (!selectedChapterId && availableChapters.length > 0) {
      // Check if we have a saved reading position
      const savedPosition = readingProgress.getPosition();
      const targetChapterId = savedPosition?.chapterId || availableChapters.find(ch => ch.status === 'published')?.id || availableChapters[0]?.id;
      
      if (targetChapterId) {
        setSelectedChapterId(targetChapterId);
      }
    }
  }, [selectedChapterId, availableChapters, readingProgress]);

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
              href="/browse"
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
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* Sidebar Loading */}
            <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="space-y-2 mt-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Loading */}
            <div className="flex-1 p-8">
              <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="space-y-3 mt-8">
                  {[1, 2, 3, 4, 5, 6].map(i => (
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
        <div className="flex items-center justify-between px-6 py-3">
          {/* Left: Story Info & Chapter Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Link 
                href="/browse"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                ← Browse
              </Link>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                {story.title}
              </span>
              {/* Cache status indicator */}
              {isValidating && (
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" title="Updating..."></div>
              )}
            </div>
            {selectedChapter && (
              <div className="flex items-center gap-2">
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getStatusIcon(selectedChapter.status)}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-sm">
                    Ch {getGlobalChapterNumber(selectedChapter.id)}: {selectedChapter.title}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Reading Controls */}
          <div className="flex items-center gap-3">
            {/* Progress Indicator */}
            <ProgressIndicator 
              isLoading={isLoading || scenesLoading} 
              isValidating={isValidating || scenesValidating}
              className="shrink-0"
            />
            {/* Chapter Navigation */}
            {(() => {
              const currentIndex = availableChapters.findIndex(ch => ch.id === selectedChapterId);
              const prevChapter = currentIndex > 0 ? availableChapters[currentIndex - 1] : null;
              const nextChapter = currentIndex < availableChapters.length - 1 ? availableChapters[currentIndex + 1] : null;
              
              return (
                <>
                  <button
                    onClick={() => prevChapter && setSelectedChapterId(prevChapter.id)}
                    disabled={!prevChapter}
                    className="h-10 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={prevChapter ? `Previous: ${prevChapter.title}` : 'No previous chapter'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400 px-2 h-10 flex items-center">
                    {currentIndex + 1} of {availableChapters.length}
                  </span>
                  
                  <button
                    onClick={() => nextChapter && setSelectedChapterId(nextChapter.id)}
                    disabled={!nextChapter}
                    className="h-10 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={nextChapter ? `Next: ${nextChapter.title}` : 'No next chapter'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              );
            })()}

            {/* Reading Progress */}
            {selectedChapter && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 h-10">
                <span>📖</span>
                <span>{selectedChapter.wordCount || 0} words</span>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => refreshStory()}
              disabled={isValidating}
              className="h-10 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Refresh story content"
            >
              <svg className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Share Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && selectedChapter) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="h-10 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Copy chapter link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Chapter Navigation */}
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
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
              <span className="text-gray-500 dark:text-gray-400">
                📚 {availableChapters.length} chapters
              </span>
            </div>
          </div>

          {/* Chapter List */}
          <div 
            ref={sidebarScrollRef}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Chapters
              </h2>
              
              {/* Chapters in Parts */}
              {story.parts.map((part) => {
                const partChapters = part.chapters.filter(chapter => 
                  isOwner || chapter.status === 'published'
                );
                
                if (partChapters.length === 0) return null;
                
                return (
                  <div key={part.id} className="mb-4">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                      Part {part.orderIndex}: {part.title}
                    </div>
                    {partChapters.map((chapter) => {
                      const globalChapterNumber = getGlobalChapterNumber(chapter.id);
                      const isSelected = selectedChapterId === chapter.id;
                      
                      return (
                        <button
                          key={chapter.id}
                          onClick={() => setSelectedChapterId(chapter.id)}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getStatusIcon(chapter.status)}</span>
                            <span className="font-medium text-sm truncate">
                              Ch {globalChapterNumber}: {chapter.title}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {chapter.wordCount || 0} words
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              
              {/* Standalone Chapters */}
              {story.chapters.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                    Standalone Chapters
                  </div>
                  {story.chapters
                    .filter(chapter => isOwner || chapter.status === 'published')
                    .map((chapter) => {
                      const globalChapterNumber = getGlobalChapterNumber(chapter.id);
                      const isSelected = selectedChapterId === chapter.id;
                      
                      return (
                        <button
                          key={chapter.id}
                          onClick={() => setSelectedChapterId(chapter.id)}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{getStatusIcon(chapter.status)}</span>
                            <span className="font-medium text-sm truncate">
                              Ch {globalChapterNumber}: {chapter.title}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {chapter.wordCount || 0} words
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
              href="/browse"
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
              {/* Chapter Header */}
              <header className="mb-8 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                  <span>{getStatusIcon(selectedChapter.status)}</span>
                  <span>Chapter {getGlobalChapterNumber(selectedChapter.id)}</span>
                  {selectedChapter.status !== 'published' && (
                    <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs">
                      {selectedChapter.status}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedChapter.title}
                </h1>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedChapter.wordCount || 0} words
                </div>
              </header>

              {/* Chapter Content */}
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
                      <p className="text-sm mt-4">Loading scenes...</p>
                    </div>
                  </div>
                ) : chapterScenes.length > 0 ? (
                  <>
                    {console.log(`📖 Rendering ${chapterScenes.length} scenes for chapter: ${selectedChapter.title}`)}
                    {chapterScenes.map((scene, index) => (
                      <section key={scene.id} className="mb-8">
                        {chapterScenes.length > 1 && (
                          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 opacity-75">
                            {scene.title}
                          </h3>
                        )}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {scene.content || (
                            <p className="text-gray-500 dark:text-gray-400 italic">
                              This scene is empty.
                            </p>
                          )}
                        </div>
                      </section>
                    ))}
                  </>
                ) : (
                  <>
                    {console.log(`⚠️  Chapter has no scenes: ${selectedChapter.title} - Architecture violation!`)}
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

              {/* Navigation */}
              <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                {(() => {
                  const currentIndex = availableChapters.findIndex(ch => ch.id === selectedChapterId);
                  const prevChapter = currentIndex > 0 ? availableChapters[currentIndex - 1] : null;
                  const nextChapter = currentIndex < availableChapters.length - 1 ? availableChapters[currentIndex + 1] : null;
                  
                  return (
                    <>
                      <div>
                        {prevChapter && (
                          <button
                            onClick={() => setSelectedChapterId(prevChapter.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            ← Previous: {prevChapter.title}
                          </button>
                        )}
                      </div>
                      
                      <div>
                        {nextChapter && (
                          <button
                            onClick={() => setSelectedChapterId(nextChapter.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          >
                            Next: {nextChapter.title} →
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </article>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Select a chapter to start reading</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}