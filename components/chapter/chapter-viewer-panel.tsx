'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChapterViewerPanelProps } from '@/types/chapter-v2';
import ChapterContentDisplay from './chapter-content-display';

export default function ChapterViewerPanel({
  storyId,
  chapterNumber,
  content,
  onSave,
  onEdit,
  isSaving,
  isEditing,
  lastSaved,
  wordCount
}: ChapterViewerPanelProps) {
  const [localContent, setLocalContent] = useState(content);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Sync content changes
  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    onEdit(newContent);
  }, [onEdit]);

  const handleSave = useCallback(() => {
    onSave(localContent);
  }, [onSave, localContent]);

  const handleExportMarkdown = useCallback(() => {
    const blob = new Blob([localContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${chapterNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [localContent, chapterNumber]);

  const handleExportTxt = useCallback(() => {
    const blob = new Blob([localContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${chapterNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  }, [localContent, chapterNumber]);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localContent);
      // Show temporary success message (you could use a toast here)
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [localContent]);

  const formatLastSaved = useCallback(() => {
    if (!lastSaved) return 'Never saved';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just saved';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours}h ago`;
    
    return `Saved ${lastSaved.toLocaleDateString()}`;
  }, [lastSaved]);

  return (
    <div data-testid="chapter-viewer-panel" className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Chapter {chapterNumber}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{formatLastSaved()}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Edit/View toggle button */}
            <button
              onClick={() => {
                if (isEditing) {
                  // Stop editing (this would be handled by the parent)
                } else {
                  // Start editing
                  onEdit(localContent);
                }
              }}
              disabled={!content.trim()}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing ? 'View' : 'Edit'}
            </button>

            {/* Export button */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!content.trim()}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-haspopup="true"
                aria-expanded={showExportMenu}
              >
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={handleExportMarkdown}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as Markdown
                    </button>
                    <button
                      onClick={handleExportTxt}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Download as Text
                    </button>
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isSaving ? 'Saving...' : 'Save Chapter'}
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-4 mt-2">
          {isEditing && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Editing</span>
            </div>
          )}

          {!lastSaved && content.trim() && (
            <div className="flex items-center space-x-1 text-xs text-orange-600">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span>Unsaved changes</span>
            </div>
          )}

          {isSaving && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-spin"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {content.trim() ? (
          <ChapterContentDisplay
            content={localContent}
            isEditing={isEditing}
            onContentChange={handleContentChange}
            wordCount={wordCount}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center p-8">
            <div className="max-w-md">
              <div className="text-6xl text-gray-300 mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Content Yet</h3>
              <p className="text-gray-500 text-sm mb-4">
                Use the prompt panel on the left to generate your chapter content. 
                Be specific about what you want to happen in Chapter {chapterNumber}.
              </p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Describe scenes, dialogue, or character development</p>
                <p>• Include plot points or story progression</p>
                <p>• Generated content will appear here for editing</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="space-x-4">
            <span>Chapter {chapterNumber}</span>
            {content.trim() && <span>{wordCount} words</span>}
          </div>
          
          <div className="space-x-2">
            {lastSaved && (
              <span className="text-green-600">
                ✓ {formatLastSaved()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}