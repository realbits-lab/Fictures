'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChapterContentDisplayProps } from '@/types/chapter-v2';

export default function ChapterContentDisplay({
  content,
  isEditing,
  onContentChange,
  wordCount,
  isGenerating = false
}: ChapterContentDisplayProps & { isGenerating?: boolean }) {
  const [localContent, setLocalContent] = useState(content);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync content changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Auto-resize textarea in edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [isEditing, localContent]);

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onContentChange(newContent);
  }, [onContentChange]);

  // Handle keyboard shortcuts in edit mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Exit editing mode (would be handled by parent)
      textareaRef.current?.blur();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      // Save would be handled by parent component
    }

    if (e.key === 'F11' || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F')) {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Format content for display (simple markdown-like formatting)
  const formatContent = useCallback((text: string) => {
    if (!text) return '';

    return text
      .split('\n\n') // Split into paragraphs
      .map((paragraph, index) => {
        if (!paragraph.trim()) return null;

        // Handle basic formatting
        let formatted = paragraph
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
          .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
          .replace(/_(.*?)_/g, '<em>$1</em>') // Alternative italic
          .replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code

        return (
          <p key={index} className="mb-4 leading-relaxed text-gray-800">
            <span dangerouslySetInnerHTML={{ __html: formatted }} />
          </p>
        );
      })
      .filter(Boolean);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const displayContent = formatContent(localContent);

  return (
    <div 
      ref={containerRef}
      className={`relative ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-white' 
          : 'h-full'
      }`}
    >
      {/* Fullscreen header */}
      {isFullscreen && (
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chapter Content</h2>
          <button
            onClick={toggleFullscreen}
            className="text-gray-500 hover:text-gray-700"
            title="Exit fullscreen (F11)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className={`border-b border-gray-200 p-2 flex items-center justify-between bg-gray-50 ${isFullscreen ? '' : ''}`}>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{localContent.split('\n\n').filter(p => p.trim()).length} paragraphs</span>
        </div>

        <div className="flex items-center space-x-2">
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Fullscreen view (F11)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinecap="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className={`overflow-y-auto ${isFullscreen ? 'h-full' : 'flex-1'} p-6`}>
        {isEditing ? (
          // Edit mode
          <div className="h-full">
            <textarea
              ref={textareaRef}
              value={localContent}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full resize-none border-0 focus:outline-none text-gray-800 leading-relaxed"
              style={{
                fontSize: '16px',
                lineHeight: '1.6',
                fontFamily: 'Georgia, "Times New Roman", serif',
                minHeight: isFullscreen ? 'calc(100vh - 200px)' : '400px',
              }}
              placeholder="Start writing your chapter content here..."
            />
          </div>
        ) : (
          // View mode
          <div 
            className="prose prose-lg max-w-none h-full"
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'Georgia, "Times New Roman", serif',
            }}
          >
            {displayContent.length > 0 ? (
              <div className="space-y-4">
                {displayContent}
                {isGenerating && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                    <span className="text-sm italic">Generating more content...</span>
                  </div>
                )}
              </div>
            ) : isGenerating ? (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <div className="text-4xl text-purple-600 mb-4 animate-pulse">✨</div>
                  <p className="text-gray-700 text-lg">Generating content...</p>
                  <p className="text-gray-500 text-sm mt-2">Your chapter is being written</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-center">
                <div>
                  <div className="text-4xl text-gray-300 mb-4">📄</div>
                  <p className="text-gray-500 text-lg">No content to display</p>
                  <p className="text-gray-400 text-sm mt-2">Generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t border-gray-200 p-2 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>{isEditing ? 'Editing' : 'Reading'} mode</span>
          {isEditing && <span>Press Esc to stop editing</span>}
        </div>
        
        <div className="flex items-center space-x-2">
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">F11</kbd>
          <span>Fullscreen</span>
        </div>
      </div>
    </div>
  );
}