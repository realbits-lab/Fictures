'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChapterChatPanelProps } from '@/types/chapter-v2';
import ChapterPromptInput from './chapter-prompt-input';

export default function ChapterChatPanel({
  bookId,
  chapterNumber,
  onGenerate,
  isGenerating,
  generationHistory,
  error
}: ChapterChatPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Focus on prompt input when component mounts
  useEffect(() => {
    const input = document.querySelector('[data-testid="chapter-prompt-input"]') as HTMLElement;
    if (input) {
      input.focus();
    }
  }, []);

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [generationHistory]);

  const handleSubmit = useCallback((promptText: string) => {
    if (!promptText.trim() || isGenerating) return;
    
    setPrompt(promptText);
    onGenerate(promptText);
  }, [onGenerate, isGenerating]);

  const handleRegenerateFromHistory = useCallback((historyItem: any) => {
    if (isGenerating) return;
    
    setPrompt(historyItem.prompt);
    onGenerate(historyItem.prompt);
  }, [onGenerate, isGenerating]);

  return (
    <div data-testid="chapter-chat-panel" className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chapter Prompt</h2>
          {generationHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-blue-600 hover:text-blue-800"
              aria-expanded={showHistory}
              aria-controls="generation-history"
            >
              {showHistory ? 'Hide' : 'Show'} History ({generationHistory.length})
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          Describe what you want to happen in Chapter {chapterNumber}. Be specific about plot points, 
          character development, or scenes you want to include.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4" role="alert">
          <div className="text-red-700">
            <p className="font-medium">Generation Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Generation History */}
      {showHistory && generationHistory.length > 0 && (
        <div 
          id="generation-history"
          className="border-b border-gray-200 max-h-64 overflow-y-auto"
          ref={historyRef}
        >
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Previous Generations</h3>
            {generationHistory.map((item, index) => (
              <div 
                key={item.id}
                className="bg-gray-50 rounded-lg p-3 text-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1">{item.prompt}</p>
                    <div className="text-xs text-gray-500">
                      {item.timestamp.toLocaleString()} • {item.tokens} words
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleRegenerateFromHistory(item)}
                    disabled={isGenerating}
                    className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Regenerate from this prompt"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {/* Context information */}
        <div data-testid="chapter-context-display" className="bg-blue-50 rounded-lg p-3">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Writing Context</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Story information and previous chapters will be included automatically</li>
            <li>• Focus on specific scenes, dialogue, or plot developments</li>
            <li>• The AI will maintain consistency with your story's style and characters</li>
          </ul>
        </div>

        {/* Current generation status */}
        {isGenerating && prompt && (
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Generating Chapter {chapterNumber}</p>
                <p className="text-xs text-yellow-700 mt-1">"{prompt}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {!isGenerating && !error && generationHistory.length > 0 && (
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-sm text-green-800">
              Chapter generated successfully! You can edit the content in the viewer panel or generate a new version with a different prompt.
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Prompt input */}
        <div className="space-y-2">
          <label 
            htmlFor="chapter-prompt-input" 
            className="block text-sm font-medium text-gray-700"
          >
            Chapter Prompt
          </label>
          
          <ChapterPromptInput
            onSubmit={handleSubmit}
            disabled={isGenerating}
            placeholder={`What should happen in Chapter ${chapterNumber}? Be specific about scenes, character development, or plot points...`}
          />

          {/* Generation button */}
          <button
            onClick={() => {
              const input = document.querySelector('[data-testid="chapter-prompt-input"]') as HTMLTextAreaElement;
              if (input?.value.trim()) {
                handleSubmit(input.value);
              }
            }}
            disabled={isGenerating}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? 'Generating...' : `Generate Chapter ${chapterNumber}`}
          </button>

          {/* Cancel button during generation */}
          {isGenerating && (
            <button
              onClick={() => {
                // This would be handled by the parent component's ESC key handler
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
              }}
              className="w-full py-1 px-4 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm"
            >
              Cancel Generation
            </button>
          )}
        </div>
      </div>

      {/* Footer with shortcuts */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <p><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+G</kbd> Focus prompt input</p>
          <p><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Ctrl+S</kbd> Save chapter</p>
          <p><kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Esc</kbd> Cancel generation</p>
        </div>
      </div>
    </div>
  );
}