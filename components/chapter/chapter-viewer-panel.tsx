'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChapterViewerPanelProps } from '@/types/chapter-v2';
import ChapterContentDisplay from './chapter-content-display';

export default function ChapterViewerPanel({
  bookId,
  chapterNumber,
  content,
  onSave,
  onEdit,
  onStopEditing,
  isSaving,
  isEditing,
  isDirty,
  lastSaved,
  wordCount,
  isGenerating = false,
  isPublished = false,
  onTogglePublish
}: ChapterViewerPanelProps) {
  // Ensure content is always a string
  const safeContent = typeof content === 'string' ? content : '';
  const [localContent, setLocalContent] = useState(safeContent);

  // Sync content changes
  useEffect(() => {
    const safeContent = typeof content === 'string' ? content : '';
    setLocalContent(safeContent);
  }, [content]);


  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    onEdit(newContent);
  }, [onEdit]);

  const handleSave = useCallback(() => {
    onSave(localContent);
  }, [onSave, localContent]);


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
            {/* Publish/Unpublish button */}
            {onTogglePublish && (
              <div className="relative group">
                <button
                  onClick={onTogglePublish}
                  disabled={!safeContent.trim()}
                  className={`px-3 py-1 text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPublished
                      ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 border border-green-200 hover:border-red-200'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
                  }`}
                  title={isPublished ? 'Click to unpublish and move to draft' : 'Click to publish and make visible to readers'}
                >
                  {isPublished ? '📤 Unpublish' : '🚀 Publish'}
                </button>
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {isPublished 
                    ? 'Move to draft (only you can see)' 
                    : 'Make public (readers can see)'
                  }
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            )}

            {/* Edit/View toggle button */}
            <button
              onClick={() => {
                if (isEditing) {
                  // Stop editing - call onStopEditing if provided, otherwise call onEdit with current content
                  if (onStopEditing) {
                    onStopEditing();
                  } else {
                    // Fallback: trigger edit callback with current content to sync state
                    onEdit(localContent);
                  }
                } else {
                  // Start editing
                  onEdit(localContent);
                }
              }}
              disabled={!safeContent.trim()}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isEditing ? 'View' : 'Edit'}
            </button>


            {/* Auto-save status button */}
            <button
              disabled
              className="px-4 py-2 text-sm rounded transition-colors cursor-default"
              style={{
                backgroundColor: isSaving ? '#fbbf24' : (!isDirty ? '#10b981' : '#6b7280'),
                color: 'white'
              }}
            >
              {isSaving ? 'Saving...' : (!isDirty ? 'Saved' : 'Unsaved')}
            </button>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center space-x-4 mt-2">
          {isPublished && (
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span>Published - Visible to readers</span>
            </div>
          )}

          {!isPublished && safeContent.trim() && (
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Draft - Only visible to you</span>
            </div>
          )}

          {isGenerating && (
            <div className="flex items-center space-x-1 text-xs text-purple-600">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
              <span>Generating content...</span>
            </div>
          )}

          {isEditing && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span>Editing</span>
            </div>
          )}

          {!lastSaved && safeContent.trim() && !isGenerating && (
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
      <div className="flex-1 overflow-y-auto">
        {safeContent.trim() || isGenerating ? (
          <ChapterContentDisplay
            content={localContent}
            isEditing={isEditing}
            onContentChange={handleContentChange}
            wordCount={wordCount}
            isGenerating={isGenerating}
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
            {safeContent.trim() && <span>{wordCount} words</span>}
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