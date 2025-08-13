import { useState, useCallback, useRef } from 'react';
import { 
  UseChapterGenerationReturn, 
  ChapterGenerationHistory, 
  ChapterGenerationContext 
} from '@/types/chapter-v2';

export function useChapterGeneration(
  storyId: string, 
  chapterNumber: number
): UseChapterGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<ChapterGenerationHistory[]>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async (prompt: string) => {
    try {
      setIsGenerating(true);
      setError(null);

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chapters/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          chapterNumber,
          prompt,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body received');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let generatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          generatedContent += chunk;
          setContent(generatedContent);
        }

        // Add to generation history
        const historyEntry: ChapterGenerationHistory = {
          id: Date.now().toString(),
          prompt,
          content: generatedContent,
          timestamp: new Date(),
          tokens: generatedContent.split(' ').length, // Rough token estimate
        };

        setGenerationHistory(prev => [...prev, historyEntry]);
      } finally {
        reader.releaseLock();
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Generation was cancelled');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [storyId, chapterNumber]);

  const regenerate = useCallback(async (historyId: string) => {
    const historyEntry = generationHistory.find(entry => entry.id === historyId);
    if (historyEntry) {
      await generate(historyEntry.prompt);
    }
  }, [generationHistory, generate]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clear = useCallback(() => {
    setContent('');
    setError(null);
    setGenerationHistory([]);
  }, []);

  const getContext = useCallback(async (): Promise<ChapterGenerationContext> => {
    const response = await fetch(`/api/chapters/context?storyId=${storyId}&chapterNumber=${chapterNumber}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch chapter context');
    }

    return response.json();
  }, [storyId, chapterNumber]);

  const saveContent = useCallback(async () => {
    if (!content.trim()) {
      throw new Error('No content to save');
    }

    const response = await fetch('/api/chapters/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyId,
        chapterNumber,
        title: `Chapter ${chapterNumber}`,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }
  }, [storyId, chapterNumber, content]);

  return {
    isGenerating,
    content,
    error,
    generationHistory,
    generate,
    regenerate,
    cancel,
    clear,
    getContext,
    saveContent,
  };
}