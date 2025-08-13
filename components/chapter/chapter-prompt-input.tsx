'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChapterPromptInputProps } from '@/types/chapter-v2';

export default function ChapterPromptInput({
  onSubmit,
  disabled,
  placeholder = "What should happen in this chapter?",
  className = ""
}: ChapterPromptInputProps) {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 200; // Maximum height in pixels
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
    }
  }, []);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
      setIsExpanded(false);
      adjustTextareaHeight();
    }
  }, [value, disabled, onSubmit, adjustTextareaHeight]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter adds a new line
        return;
      } else {
        // Enter submits the form
        e.preventDefault();
        handleSubmit(e);
      }
    }

    if (e.key === 'Escape') {
      // Escape clears the input and collapses
      setValue('');
      setIsExpanded(false);
      adjustTextareaHeight();
      textareaRef.current?.blur();
    }
  }, [handleSubmit, adjustTextareaHeight]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setIsExpanded(false);
    }
  }, [value]);

  // Initialize height on mount
  useEffect(() => {
    adjustTextareaHeight();
  }, [adjustTextareaHeight]);

  // Focus when component mounts (if it's the only input)
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (textareaRef.current && !disabled) {
        textareaRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(focusTimer);
  }, [disabled]);

  return (
    <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          data-testid="chapter-prompt-input"
          id="chapter-prompt-input"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full resize-none border border-gray-300 rounded-lg px-4 py-3 text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200
            ${isExpanded ? 'min-h-[100px]' : 'min-h-[60px]'}
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{
            lineHeight: '1.5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          rows={isExpanded ? 4 : 2}
        />

        {/* Character counter */}
        {isExpanded && value.length > 0 && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {value.length} / 2000
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="space-x-2">
          <span>
            <kbd className="px-1 py-0.5 bg-gray-200 rounded">Enter</kbd> to submit
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-200 rounded">Shift+Enter</kbd> for new line
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-200 rounded">Esc</kbd> to clear
          </span>
        </div>
        
        {value.length > 1500 && (
          <span className="text-orange-500">
            {2000 - value.length} characters remaining
          </span>
        )}
      </div>

      {/* Submit button (hidden, form submission handled by Enter key) */}
      <button type="submit" className="sr-only" aria-hidden="true">
        Submit
      </button>
    </form>
  );
}