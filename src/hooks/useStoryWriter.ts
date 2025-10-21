'use client';

import { usePersistedSWR, CACHE_CONFIGS } from '@/lib/hooks/use-persisted-swr';
import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

export interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  wordCount: number;
  status: 'completed' | 'in_progress' | 'planned';
  goal?: string;
  conflict?: string;
  outcome?: string;
}

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  orderIndex: number;
  wordCount: number;
  targetWordCount: number;
  status: string;
  scenes?: Scene[];
}

export interface Part {
  id: string;
  title: string;
  orderIndex: number;
  chapters: Chapter[];
}

export interface Story {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  wordCount?: number;
  status: string;
  isPublic?: boolean;
  hnsData?: Record<string, unknown>;
  parts: Part[];
  chapters: Chapter[];
  scenes?: Scene[];
  userId: string;
}

export interface StoryWriterResponse {
  story: Story;
  isOwner: boolean;
  metadata: {
    fetchedAt: string;
    totalChapters: number;
    totalScenes: number;
    lastModified: string;
  };
}

export interface UseStoryWriterReturn {
  story: Story | undefined;
  isOwner: boolean;
  allChapters: Chapter[];
  allScenes: Scene[];
  isLoading: boolean;
  isValidating: boolean;
  error: any;
  mutate: () => Promise<StoryWriterResponse | undefined>;
  refreshStory: () => Promise<StoryWriterResponse | undefined>;
}

// Fetcher function for story writing data
const fetcher = async (url: string): Promise<StoryWriterResponse> => {
  const res = await fetch(url, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  
  return res.json();
};

/**
 * Custom hook for writing story data with SWR caching
 * Provides cached access to story structure, chapters, and scenes with writing-specific optimizations
 */
export function useStoryWriter(storyId: string | null): UseStoryWriterReturn {
  const { data: session, status: sessionStatus } = useSession();
  
  // Only fetch if we have a story ID and session is loaded
  const shouldFetch = storyId && sessionStatus !== 'loading';
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = usePersistedSWR<StoryWriterResponse>(
    shouldFetch ? `/api/stories/${storyId}/write` : null,
    fetcher,
    {
      ...CACHE_CONFIGS.writing, // 30min TTL + compression for frequent updates
      // Override TTL based on story editing frequency
      ttl: 30 * 60 * 1000  // 30min TTL for active writing sessions
    },
    {
      revalidateOnFocus: true,  // Revalidate when user returns to tab
      revalidateOnReconnect: true,
      refreshInterval: 0, // No automatic polling to avoid conflicts while writing
      dedupingInterval: 10 * 1000, // 10 seconds deduplication for rapid edits
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error(`Story writer error for ID ${storyId}:`, error);
      },
      onSuccess: (data) => {
        console.log(`Story writing data cached for: ${data.story.title} (${data.metadata.totalChapters} chapters, ${data.metadata.totalScenes} scenes)`);
      }
    }
  );

  // Calculate all chapters (memoized for performance)
  const allChapters = useMemo(() => {
    if (!data?.story) return [];
    
    return [
      ...data.story.parts.flatMap(part => part.chapters),
      ...data.story.chapters
    ];
  }, [data?.story]);

  // Calculate all scenes (memoized for performance)
  const allScenes = useMemo(() => {
    if (!data?.story) return [];
    
    const scenesFromChapters = allChapters.flatMap(chapter => chapter.scenes || []);
    const scenesFromStory = data.story.scenes || [];
    
    return [...scenesFromChapters, ...scenesFromStory];
  }, [data?.story, allChapters]);

  return {
    story: data?.story,
    isOwner: data?.isOwner ?? false,
    allChapters,
    allScenes,
    isLoading: sessionStatus === 'loading' || isLoading,
    isValidating,
    error,
    mutate,
    refreshStory: () => mutate()
  };
}

/**
 * Hook for prefetching story writing data (useful for navigation preloading)
 */
export function usePrefetchStoryWriter() {
  return {
    prefetch: async (storyId: string) => {
      try {
        await fetch(`/api/stories/${storyId}/write`, {
          credentials: 'include',
        });
      } catch (error) {
        console.debug('Prefetch failed for story writer:', storyId, error);
      }
    }
  };
}

/**
 * Hook for managing writing position/progress and auto-save functionality
 */
export function useWritingProgress(storyId: string, chapterId: string | null, sceneId: string | null) {
  return useMemo(() => ({
    // Save writing position and content
    saveWritingState: (state: {
      chapterId?: string;
      sceneId?: string;
      cursorPosition?: number;
      scrollPosition?: number;
      content?: string;
      wordCount?: number;
      lastEdited?: string; // timestamp
    }) => {
      if (typeof window !== 'undefined') {
        const key = `writing-state-${storyId}`;
        const data = {
          ...state,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
      }
    },
    
    // Get saved writing state
    getWritingState: () => {
      if (typeof window !== 'undefined') {
        const key = `writing-state-${storyId}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    
    // Save draft content (for auto-save)
    saveDraft: (contentId: string, content: string, wordCount: number) => {
      if (typeof window !== 'undefined') {
        const key = `draft-${storyId}-${contentId}`;
        const data = {
          content,
          wordCount,
          timestamp: Date.now(),
          storyId,
          contentId
        };
        localStorage.setItem(key, JSON.stringify(data));
      }
    },
    
    // Get draft content
    getDraft: (contentId: string) => {
      if (typeof window !== 'undefined') {
        const key = `draft-${storyId}-${contentId}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    
    // Clear draft after successful save
    clearDraft: (contentId: string) => {
      if (typeof window !== 'undefined') {
        const key = `draft-${storyId}-${contentId}`;
        localStorage.removeItem(key);
      }
    },
    
    // Get all drafts for this story
    getAllDrafts: () => {
      if (typeof window !== 'undefined') {
        const drafts = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`draft-${storyId}-`)) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || '{}');
              drafts.push({ key, ...data });
            } catch {
              // Skip invalid drafts
            }
          }
        }
        return drafts;
      }
      return [];
    }
  }), [storyId]);
}

/**
 * Hook for managing writing session statistics and tracking
 */
export function useWritingSession(storyId: string) {
  return useMemo(() => ({
    // Start a writing session
    startSession: () => {
      if (typeof window !== 'undefined') {
        const key = `writing-session-${storyId}`;
        const data = {
          startTime: Date.now(),
          wordCountStart: 0,
          keystrokes: 0,
          storyId
        };
        localStorage.setItem(key, JSON.stringify(data));
        return data;
      }
    },
    
    // Update session progress
    updateSession: (updates: {
      wordCount?: number;
      keystrokes?: number;
      lastActivity?: number;
    }) => {
      if (typeof window !== 'undefined') {
        const key = `writing-session-${storyId}`;
        const existing = localStorage.getItem(key);
        if (existing) {
          try {
            const data = JSON.parse(existing);
            const updated = {
              ...data,
              ...updates,
              lastActivity: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(updated));
            return updated;
          } catch {
            // If corrupted, start new session
            return null;
          }
        }
      }
      return null;
    },
    
    // End session and save statistics
    endSession: () => {
      if (typeof window !== 'undefined') {
        const key = `writing-session-${storyId}`;
        const sessionData = localStorage.getItem(key);
        if (sessionData) {
          try {
            const data = JSON.parse(sessionData);
            const endTime = Date.now();
            const duration = endTime - data.startTime;
            
            // Save to session history
            const historyKey = `writing-history-${storyId}`;
            const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
            history.push({
              ...data,
              endTime,
              duration,
              wordsWritten: data.wordCount - data.wordCountStart
            });
            
            // Keep only last 30 sessions
            if (history.length > 30) {
              history.splice(0, history.length - 30);
            }
            
            localStorage.setItem(historyKey, JSON.stringify(history));
            localStorage.removeItem(key); // Clear current session
            
            return { duration, wordsWritten: data.wordCount - data.wordCountStart };
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    
    // Get current session
    getCurrentSession: () => {
      if (typeof window !== 'undefined') {
        const key = `writing-session-${storyId}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return null;
          }
        }
      }
      return null;
    },
    
    // Get writing history/statistics
    getWritingHistory: () => {
      if (typeof window !== 'undefined') {
        const key = `writing-history-${storyId}`;
        const data = localStorage.getItem(key);
        if (data) {
          try {
            return JSON.parse(data);
          } catch {
            return [];
          }
        }
      }
      return [];
    }
  }), [storyId]);
}