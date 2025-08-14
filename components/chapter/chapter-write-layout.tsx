'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useChapterGeneration } from '@/hooks/use-chapter-generation';
import { useChapterEditor } from '@/hooks/use-chapter-editor';
import ChapterChatPanel from './chapter-chat-panel';
import ChapterViewerPanel from './chapter-viewer-panel';

interface ChapterWriteLayoutProps {
  bookId: string;
  bookTitle: string;
  chapterNumber: number;
  chapterId: string;
  initialContent?: string;
}

export default function ChapterWriteLayout({ bookId, bookTitle, chapterNumber, chapterId, initialContent = '' }: ChapterWriteLayoutProps) {
  const [panelSizes, setPanelSizes] = useState({ chat: 50, viewer: 50 });
  const [isResizing, setIsResizing] = useState(false);

  const generation = useChapterGeneration(bookId, chapterNumber);
  const editor = useChapterEditor(bookId, chapterNumber, initialContent || generation.content);

  // Sync generation content with editor
  React.useEffect(() => {
    if (generation.content && generation.content !== editor.content) {
      editor.setContent(generation.content);
    }
  }, [generation.content, editor.setContent, editor.content]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            editor.save();
            break;
          case 'g':
            event.preventDefault();
            // Focus on chat panel for generation
            const chatInput = document.querySelector('[data-testid="chapter-prompt-input"]') as HTMLElement;
            chatInput?.focus();
            break;
        }
      }

      if (event.key === 'Escape' && generation.isGenerating) {
        generation.cancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, generation]);

  // Load panel sizes from localStorage
  useEffect(() => {
    const savedSizes = localStorage.getItem('chapter-panel-sizes');
    if (savedSizes) {
      try {
        const sizes = JSON.parse(savedSizes);
        setPanelSizes(sizes);
      } catch (error) {
        console.warn('Failed to parse saved panel sizes:', error);
      }
    }
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((chatPercent: number) => {
    const newSizes = { chat: chatPercent, viewer: 100 - chatPercent };
    setPanelSizes(newSizes);
    localStorage.setItem('chapter-panel-sizes', JSON.stringify(newSizes));
  }, []);

  // Handle generation
  const handleGenerate = useCallback(async (prompt: string) => {
    await generation.generate(prompt);
  }, [generation]);

  // Handle save
  const handleSave = useCallback(async (content: string) => {
    editor.setContent(content);
    await editor.save();
  }, [editor]);

  // Handle edit
  const handleEdit = useCallback((content: string) => {
    editor.setContent(content);
    editor.startEditing();
  }, [editor]);

  // Memoize status message
  const statusMessage = useMemo(() => {
    if (generation.isGenerating) return 'Generating chapter...';
    if (editor.isSaving) return 'Saving chapter...';
    if (generation.error) return generation.error;
    if (editor.isDirty) return 'Unsaved changes';
    if (editor.lastSaved) return `Saved at ${editor.lastSaved.toLocaleTimeString()}`;
    return 'Ready';
  }, [generation.isGenerating, generation.error, editor.isSaving, editor.isDirty, editor.lastSaved]);

  // Error boundary fallback
  const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reload Page
        </button>
      </div>
    </div>
  );

  try {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Status bar */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/books/${bookId}`} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to {bookTitle}
            </Link>
            <span className="text-gray-400">|</span>
            <h1 className="text-lg font-semibold">Chapter {chapterNumber}</h1>
            <div className="text-sm text-gray-600">{editor.wordCount} words</div>
          </div>
          
          <div 
            role="status" 
            aria-live="polite"
            className={`text-sm px-2 py-1 rounded ${
              generation.error ? 'text-red-600 bg-red-50' :
              editor.isDirty ? 'text-yellow-600 bg-yellow-50' :
              generation.isGenerating || editor.isSaving ? 'text-blue-600 bg-blue-50' :
              'text-green-600 bg-green-50'
            }`}
          >
            {statusMessage}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* Chat Panel */}
          <div 
            role="region"
            aria-label="Chapter writing prompt"
            className="border-r border-gray-200 flex flex-col min-w-0"
            style={{ width: `${panelSizes.chat}%` }}
          >
            <React.Suspense fallback={<div className="p-4">Loading chat panel...</div>}>
              <ChapterChatPanel
                storyId={bookId}
                chapterNumber={chapterNumber}
                onGenerate={handleGenerate}
                isGenerating={generation.isGenerating}
                generationHistory={generation.generationHistory}
                error={generation.error}
              />
            </React.Suspense>
          </div>

          {/* Resize handle */}
          <div 
            data-testid="panel-resize-handle"
            className="w-1 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors"
            onMouseDown={(e) => {
              setIsResizing(true);
              const startX = e.clientX;
              const startChatWidth = panelSizes.chat;

              const handleMouseMove = (e: MouseEvent) => {
                const containerWidth = document.documentElement.clientWidth;
                const deltaX = e.clientX - startX;
                const deltaPercent = (deltaX / containerWidth) * 100;
                const newChatWidth = Math.max(20, Math.min(80, startChatWidth + deltaPercent));
                handlePanelResize(newChatWidth);
              };

              const handleMouseUp = () => {
                setIsResizing(false);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          />

          {/* Viewer Panel */}
          <div 
            role="region"
            aria-label="Chapter content viewer"
            className="flex flex-col min-w-0"
            style={{ width: `${panelSizes.viewer}%` }}
          >
            <React.Suspense fallback={<div className="p-4">Loading viewer panel...</div>}>
              <ChapterViewerPanel
                storyId={bookId}
                chapterNumber={chapterNumber}
                content={editor.content}
                onSave={handleSave}
                onEdit={handleEdit}
                isSaving={editor.isSaving}
                isEditing={editor.isEditing}
                lastSaved={editor.lastSaved}
                wordCount={editor.wordCount}
                isGenerating={generation.isGenerating}
              />
            </React.Suspense>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <ErrorFallback error={error as Error} />;
  }
}