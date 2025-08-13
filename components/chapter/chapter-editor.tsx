'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface ChapterEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ChapterEditor({
  content,
  onChange,
  onSave,
  onCancel,
  readOnly = false,
  placeholder = "Start writing your chapter...",
  className = ""
}: ChapterEditorProps) {
  const [localContent, setLocalContent] = useState(content);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external content changes
  useEffect(() => {
    if (content !== localContent) {
      setLocalContent(content);
    }
  }, [content, localContent]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 600)}px`;
    }
  }, [localContent]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    onChange(newContent);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onCancel?.();
      }
    }

    if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
  }, [onSave, onCancel, isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const wordCount = localContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  const paragraphCount = localContent.split('\n\n').filter(p => p.trim()).length;

  return (
    <div 
      data-testid="chapter-editor"
      className={`relative flex flex-col ${
        isFullscreen 
          ? 'fixed inset-0 z-50 bg-white' 
          : 'h-full'
      } ${className}`}
    >
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{paragraphCount} paragraphs</span>
            {readOnly && (
              <>
                <span>•</span>
                <span className="text-amber-600">Read only</span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
              title={isFullscreen ? "Exit fullscreen (F11)" : "Fullscreen (F11)"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                )}
              </svg>
            </button>

            {/* Action buttons */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
            )}

            {onSave && !readOnly && (
              <button
                type="button"
                onClick={onSave}
                className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 p-4 overflow-hidden">
        <textarea
          ref={textareaRef}
          data-testid="text-editor-content"
          value={localContent}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          placeholder={placeholder}
          className="w-full h-full resize-none border-0 focus:outline-none text-gray-800 leading-relaxed font-serif"
          style={{
            fontSize: '16px',
            lineHeight: '1.7',
            fontFamily: 'Georgia, "Times New Roman", serif',
            minHeight: isFullscreen ? 'calc(100vh - 140px)' : '300px',
          }}
        />
      </div>

      {/* Status bar */}
      <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>
              {readOnly ? 'Read-only mode' : 'Editing'}
            </span>
            {!readOnly && (
              <>
                <span>•</span>
                <span>Ctrl+S to save</span>
                <span>•</span>
                <span>F11 for fullscreen</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span>{localContent.length} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}