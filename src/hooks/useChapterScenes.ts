'use client';

import { usePersistedSWR, CACHE_CONFIGS } from '@/lib/hooks/use-persisted-swr';
import { useSession } from 'next-auth/react';

export interface Scene {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  wordCount: number;
  status: string;
  sceneImage?: {
    url?: string;
    prompt?: string;
    style?: string;
    mood?: string;
    generated_at?: string;
  };
}

export interface ChapterScenesResponse {
  scenes: Scene[];
  metadata: {
    fetchedAt: string;
    chapterId: string;
    totalScenes: number;
  };
}

// Enhanced fetcher with ETag support
const fetcher = async (url: string): Promise<ChapterScenesResponse> => {
  // Get cached ETag from previous request
  const cachedData = getCachedSceneData(url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (cachedData?.etag) {
    headers['If-None-Match'] = cachedData.etag;
  }

  const res = await fetch(url, {
    credentials: 'include',
    headers,
  });

  // Handle 304 Not Modified - return cached data
  if (res.status === 304 && cachedData?.data) {
    console.log('🎯 Scene data unchanged, using cached version');
    return cachedData.data;
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  
  const data = await res.json();
  
  // Cache the data with ETag for next request
  const etag = res.headers.get('ETag');
  if (etag) {
    cacheSceneData(url, data, etag);
  }
  
  return data;
};

// Simple ETag cache for scene data
const sceneETagCache = new Map<string, { data: ChapterScenesResponse; etag: string; timestamp: number }>();

function getCachedSceneData(url: string) {
  const cached = sceneETagCache.get(url);
  if (cached) {
    // Keep ETag cache for 1 hour
    const isExpired = Date.now() - cached.timestamp > 60 * 60 * 1000;
    if (!isExpired) {
      return cached;
    } else {
      sceneETagCache.delete(url);
    }
  }
  return null;
}

function cacheSceneData(url: string, data: ChapterScenesResponse, etag: string) {
  sceneETagCache.set(url, {
    data,
    etag,
    timestamp: Date.now()
  });
  
  // Limit cache size
  if (sceneETagCache.size > 50) {
    const oldestKey = sceneETagCache.keys().next().value;
    if (oldestKey !== undefined) {
      sceneETagCache.delete(oldestKey);
    }
  }
}

/**
 * Hook for fetching individual chapter scenes on-demand
 */
export function useChapterScenes(chapterId: string | null) {
  const { data: session, status: sessionStatus } = useSession();
  
  const shouldFetch = chapterId && sessionStatus !== 'loading';
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = usePersistedSWR<ChapterScenesResponse>(
    shouldFetch ? `/api/chapters/${chapterId}/scenes` : null,
    fetcher,
    {
      ...CACHE_CONFIGS.reading,
      ttl: 5 * 60 * 1000  // 5min cache for scenes
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 0,
      dedupingInterval: 10 * 1000, // 10 seconds deduplication
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error(`Chapter scenes error for ID ${chapterId}:`, error);
      },
      onSuccess: (data) => {
        console.log(`Chapter scenes loaded: ${data.scenes.length} scenes for chapter ${chapterId}`);
      }
    }
  );

  return {
    scenes: data?.scenes || [],
    isLoading: sessionStatus === 'loading' || isLoading,
    isValidating,
    error,
    mutate,
    refreshScenes: () => mutate()
  };
}