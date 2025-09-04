"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  wordCount: number;
  status: string;
}

interface Chapter {
  id: string;
  title: string;
  content?: string;
  orderIndex: number;
  wordCount: number;
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
  wordCount?: number;
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
    <div data-testid="chapter-reader" className="absolute inset-0 top-16 bg-white dark:bg-gray-900 flex">
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
                    </section>
                  ))}
                </>
              ) : (
                <>
                  {console.log(`📄 Rendering chapter content directly (no scenes) for: ${selectedChapter.title}`)}
                  {console.log(`📏 Chapter content length: ${selectedChapter.content?.length || 0} chars`)}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {selectedChapter.content || (
                      <p className="text-gray-500 dark:text-gray-400 italic">
                        This chapter is empty.
                      </p>
                    )}
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
  );
}