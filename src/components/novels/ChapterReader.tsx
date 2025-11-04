"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { LikeDislikeButton } from './LikeDislikeButton';

interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  status: string;
}

interface Chapter {
  id: string;
  title: string;
  content?: string;
  orderIndex: number;
  status: string;
  scenes?: Scene[];
}

interface Part {
  id: string;
  title: string;
  orderIndex: number;
  chapters: Chapter[];
}

interface Story {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  status: string;
  parts: Part[];
  chapters: Chapter[];
}

interface ChapterReaderProps {
  story: Story;
  isOwner: boolean;
}

export function ChapterReader({ story, isOwner }: ChapterReaderProps) {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Get all chapters across parts and standalone chapters
  const allChapters = [
    ...story.parts.flatMap(part => part.chapters),
    ...story.chapters
  ];

  // Filter to only published chapters (or all if owner)
  const availableChapters = allChapters.filter(chapter => 
    isOwner || chapter.status === 'published'
  );

  // Auto-select first published chapter on load
  useEffect(() => {
    if (!selectedChapterId && availableChapters.length > 0) {
      const firstPublishedChapter = availableChapters.find(ch => ch.status === 'published') || availableChapters[0];
      setSelectedChapterId(firstPublishedChapter.id);
    }
  }, [selectedChapterId, availableChapters]);

  // Setup non-passive wheel event listeners for independent scrolling
  useEffect(() => {
    const sidebarElement = sidebarScrollRef.current;
    const mainContentElement = mainContentRef.current;

    const handleSidebarWheel = (e: WheelEvent) => {
      e.stopPropagation();
      
      // If sidebar is scrollable, allow scrolling within sidebar only
      if (sidebarElement && sidebarElement.scrollHeight > sidebarElement.clientHeight) {
        // Let the sidebar scroll naturally, but prevent bubbling to parent
        return;
      }
      
      // If sidebar is not scrollable, prevent all default behavior to avoid affecting main content
      e.preventDefault();
    };

    const handleMainContentWheel = (e: WheelEvent) => {
      e.stopPropagation();
      // Allow normal scrolling in main content
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

  const selectedChapter = availableChapters.find(ch => ch.id === selectedChapterId);

  // Calculate global chapter number
  const getGlobalChapterNumber = (chapterId: string) => {
    let chapterNumber = 0;
    
    // Count chapters in parts
    for (const part of story.parts) {
      for (const chapter of part.chapters) {
        chapterNumber++;
        if (chapter.id === chapterId) return chapterNumber;
      }
    }
    
    // Count standalone chapters
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
                href="/novels"
                className="hidden sm:inline text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
              >
                ← Browse
              </Link>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">/</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px] sm:max-w-xs">
                {story.title}
              </span>
            </div>
            {selectedChapter && (
              <div className="hidden lg:flex items-center gap-2">
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
          <div className="flex items-center gap-2 md:gap-3">
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
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={prevChapter ? `Previous: ${prevChapter.title}` : 'No previous chapter'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400 px-2">
                    {currentIndex + 1} of {availableChapters.length}
                  </span>

                  <button
                    onClick={() => nextChapter && setSelectedChapterId(nextChapter.id)}
                    disabled={!nextChapter}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={nextChapter ? `Next: ${nextChapter.title}` : 'No next chapter'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              );
            })()}

            {/* Reading Progress - Hidden on mobile */}
            {selectedChapter && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                <span>📖</span>
              </div>
            )}

            {/* Share Button - Hidden on mobile */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && selectedChapter) {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
              className="hidden sm:flex p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Copy chapter link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
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
            {story.summary && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {story.summary}
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
                        onClick={() => {
                          setSelectedChapterId(chapter.id);
                          setIsSidebarOpen(false); // Close sidebar on mobile after selection
                        }}
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
                        onClick={() => {
                          setSelectedChapterId(chapter.id);
                          setIsSidebarOpen(false); // Close sidebar on mobile after selection
                        }}
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
          className="flex-1 h-full overflow-y-auto min-h-0"
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'auto'
          }}
        >
          {selectedChapter ? (
            <article className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8">
              {/* Chapter Header */}
              <header className="mb-6 md:mb-8 border-b border-gray-200 dark:border-gray-800 pb-4 md:pb-6">
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
                </div>
              </header>

              {/* Chapter Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {selectedChapter.scenes && selectedChapter.scenes.length > 0 ? (
                  <>
                    {console.log(`📖 Rendering ${selectedChapter.scenes.length} scenes for chapter: ${selectedChapter.title}`)}
                    {selectedChapter.scenes.map((scene, index) => (
                      <section key={scene.id} className="mb-8">
                        {selectedChapter.scenes!.length > 1 && (
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
                        <div className="mt-4 flex items-center justify-end">
                          <LikeDislikeButton
                            entityId={scene.id}
                            entityType="scene"
                            initialLikeCount={0}
                            initialDislikeCount={0}
                            size="md"
                          />
                        </div>
                      </section>
                    ))}
                  </>
                ) : (
                  <>
                    {console.log(`⚠️  Chapter has no scenes: ${selectedChapter.title} - Architecture violation!`)}
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
