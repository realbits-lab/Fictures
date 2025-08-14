import { useState, useCallback, useEffect, useRef } from 'react';
import { UseChapterEditorReturn } from '@/types/chapter-v2';

export function useChapterEditor(
  bookId: string, 
  chapterNumber: number,
  initialContent: string = ''
): UseChapterEditorReturn {
  const [content, setContentState] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const originalContentRef = useRef(initialContent);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Auto-save functionality
  useEffect(() => {
    if (isDirty && !isSaving) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      // Set new timer for auto-save after 5 seconds of inactivity
      autoSaveTimerRef.current = setTimeout(() => {
        save();
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, isSaving, content]);

  const setContent = useCallback((newContent: string) => {
    setContentState(newContent);
    setIsDirty(newContent !== originalContentRef.current);
  }, []);

  const startEditing = useCallback(() => {
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const save = useCallback(async () => {
    if (!isDirty || isSaving) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/chapters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId,
          chapterNumber,
          title: `Chapter ${chapterNumber}`,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Save failed: ${response.statusText}`);
      }

      // Update state after successful save
      originalContentRef.current = content;
      setIsDirty(false);
      setLastSaved(new Date());

      // Clear auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    } catch (error) {
      console.error('Failed to save chapter:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [bookId, chapterNumber, content, isDirty, isSaving]);

  const revert = useCallback(() => {
    setContentState(originalContentRef.current);
    setIsDirty(false);
    setIsEditing(false);

    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  const exportMarkdown = useCallback(() => {
    return content;
  }, [content]);

  const exportHTML = useCallback(() => {
    // Simple markdown to HTML conversion
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^\s*/, '<p>')
      .replace(/\s*$/, '</p>');
  }, [content]);

  const exportDocx = useCallback(async () => {
    // This would require a library like officegen or docx
    // For now, create a simple text blob
    const blob = new Blob([content], { type: 'application/msword' });
    return blob;
  }, [content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    isEditing,
    isDirty,
    isSaving,
    lastSaved,
    wordCount,
    setContent,
    startEditing,
    stopEditing,
    save,
    revert,
    exportMarkdown,
    exportHTML,
    exportDocx,
  };
}