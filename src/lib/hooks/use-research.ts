'use client';

import useSWR from 'swr';
import { usePersistedSWR, CACHE_CONFIGS } from './use-persisted-swr';

export interface ResearchItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}

export interface ResearchListResponse {
  items: ResearchItem[];
  count: number;
  metadata: {
    fetchedAt: string;
    lastUpdated: string;
  };
}

export interface ResearchItemResponse {
  item: ResearchItem;
}

// Fetcher for research list
const researchListFetcher = async (url: string): Promise<ResearchListResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch research items');
  }
  return res.json();
};

// Fetcher for single research item
const researchItemFetcher = async (url: string): Promise<ResearchItemResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch research item');
  }
  return res.json();
};

// Hook to fetch all research items for the current user
export function useResearch() {
  const { data, error, isLoading, mutate } = usePersistedSWR<ResearchListResponse>(
    '/api/research',
    researchListFetcher,
    {
      ttl: 30 * 60 * 1000, // 30min cache (same as CACHE_CONFIGS.writing)
      version: '1.0.0',
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds deduplication
    }
  );

  return {
    items: data?.items || [],
    count: data?.count || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Hook to fetch a single research item
export function useResearchItem(id: string | null) {
  const { data, error, isLoading, mutate } = usePersistedSWR<ResearchItemResponse>(
    id ? `/api/research/${id}` : null,
    researchItemFetcher,
    {
      ttl: 30 * 60 * 1000, // 30min cache
      version: '1.0.0',
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds deduplication
    }
  );

  return {
    item: data?.item || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

// Helper function to create a new research item
export async function createResearchItem(data: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<ResearchItem> {
  const res = await fetch('/api/research', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create research item');
  }

  const response = await res.json();
  return response.item;
}

// Helper function to update a research item
export async function updateResearchItem(
  id: string,
  data: {
    title: string;
    content: string;
    tags?: string[];
  }
): Promise<ResearchItem> {
  const res = await fetch(`/api/research/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update research item');
  }

  const response = await res.json();
  return response.item;
}

// Helper function to delete a research item
export async function deleteResearchItem(id: string): Promise<void> {
  const res = await fetch(`/api/research/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete research item');
  }
}
