'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { mutate } from 'swr';

// Event payload interfaces
export interface StoryPublishedEvent {
  storyId: string;
  title: string;
  authorId: string;
  genre: string | null;
  timestamp: string;
}

export interface StoryUpdatedEvent {
  storyId: string;
  timestamp: string;
}

export interface StoryDeletedEvent {
  storyId: string;
  timestamp: string;
}

export interface PostCreatedEvent {
  postId: string;
  storyId: string;
  authorId: string;
  title: string;
  type: string;
  timestamp: string;
}

export interface PostUpdatedEvent {
  postId: string;
  storyId: string;
  timestamp: string;
}

export interface PostDeletedEvent {
  postId: string;
  storyId: string;
  timestamp: string;
}

// Hook options
export interface UseCommunityEventsOptions {
  onStoryPublished?: (event: StoryPublishedEvent) => void;
  onStoryUpdated?: (event: StoryUpdatedEvent) => void;
  onStoryDeleted?: (event: StoryDeletedEvent) => void;
  onPostCreated?: (event: PostCreatedEvent) => void;
  onPostUpdated?: (event: PostUpdatedEvent) => void;
  onPostDeleted?: (event: PostDeletedEvent) => void;
  onConnected?: () => void;
  onError?: (error: Error) => void;
  autoRevalidate?: boolean; // Default: true - automatically revalidate SWR cache
  enabled?: boolean; // Default: true - control whether to connect
}

export interface UseCommunityEventsReturn {
  isConnected: boolean;
  error: Error | null;
  disconnect: () => void;
  reconnect: () => void;
}

export function useCommunityEvents(
  options: UseCommunityEventsOptions = {}
): UseCommunityEventsReturn {
  const {
    onStoryPublished,
    onStoryUpdated,
    onStoryDeleted,
    onPostCreated,
    onPostUpdated,
    onPostDeleted,
    onConnected,
    onError,
    autoRevalidate = true,
    enabled = true,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const isManuallyDisconnected = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(() => {
    // Don't connect if disabled or manually disconnected
    if (!enabled || isManuallyDisconnected.current) {
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // Create new EventSource connection
      const eventSource = new EventSource('/api/community/events');
      eventSourceRef.current = eventSource;
      setError(null);

      console.log('[SSE Client] Connecting to community events...');

      // Connection established
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('[SSE Client] Connected:', data.message);
        setIsConnected(true);
        reconnectAttempts.current = 0; // Reset attempts on successful connection
        onConnected?.();
      });

      // Story published event
      eventSource.addEventListener('story-published', (event) => {
        const data: StoryPublishedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Story published:', data.title);

        // Auto-revalidate community stories list
        if (autoRevalidate) {
          mutate('/community/api/stories');
        }

        // Call custom handler
        onStoryPublished?.(data);
      });

      // Story updated event
      eventSource.addEventListener('story-updated', (event) => {
        const data: StoryUpdatedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Story updated:', data.storyId);

        if (autoRevalidate) {
          mutate('/community/api/stories');
          mutate(`/community/api/stories/${data.storyId}/posts`);
        }

        onStoryUpdated?.(data);
      });

      // Story deleted event
      eventSource.addEventListener('story-deleted', (event) => {
        const data: StoryDeletedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Story deleted:', data.storyId);

        if (autoRevalidate) {
          mutate('/community/api/stories');
        }

        onStoryDeleted?.(data);
      });

      // Post created event
      eventSource.addEventListener('post-created', (event) => {
        const data: PostCreatedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Post created:', data.title);

        if (autoRevalidate) {
          // Revalidate specific story's posts
          mutate(`/community/api/stories/${data.storyId}/posts`);
          // Also revalidate story list (to update post counts)
          mutate('/community/api/stories');
        }

        onPostCreated?.(data);
      });

      // Post updated event
      eventSource.addEventListener('post-updated', (event) => {
        const data: PostUpdatedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Post updated:', data.postId);

        if (autoRevalidate) {
          mutate(`/community/api/stories/${data.storyId}/posts`);
        }

        onPostUpdated?.(data);
      });

      // Post deleted event
      eventSource.addEventListener('post-deleted', (event) => {
        const data: PostDeletedEvent = JSON.parse(event.data);
        console.log('[SSE Client] Post deleted:', data.postId);

        if (autoRevalidate) {
          mutate(`/community/api/stories/${data.storyId}/posts`);
          mutate('/community/api/stories');
        }

        onPostDeleted?.(data);
      });

      // Keep-alive ping (no action needed, just logs)
      eventSource.addEventListener('ping', () => {
        // Keep-alive received - connection is healthy
      });

      // Error event
      eventSource.addEventListener('error', (event) => {
        console.log('[SSE Client] SSE error event received');
      });

      // Handle connection errors
      eventSource.onerror = (err) => {
        console.error('[SSE Client] Connection error');
        setIsConnected(false);

        const connectionError = new Error('SSE connection failed');
        setError(connectionError);
        onError?.(connectionError);

        eventSource.close();

        // Exponential backoff reconnection
        if (
          !isManuallyDisconnected.current &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(
            `[SSE Client] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('[SSE Client] Max reconnection attempts reached');
          const maxAttemptsError = new Error(
            'Failed to connect after maximum retry attempts'
          );
          setError(maxAttemptsError);
          onError?.(maxAttemptsError);
        }
      };
    } catch (err) {
      console.error('[SSE Client] Error creating EventSource:', err);
      const createError =
        err instanceof Error ? err : new Error('Failed to create EventSource');
      setError(createError);
      onError?.(createError);
    }
  }, [
    enabled,
    onStoryPublished,
    onStoryUpdated,
    onStoryDeleted,
    onPostCreated,
    onPostUpdated,
    onPostDeleted,
    onConnected,
    onError,
    autoRevalidate,
  ]);

  const disconnect = useCallback(() => {
    console.log('[SSE Client] Manually disconnecting...');
    isManuallyDisconnected.current = true;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
    setError(null);
  }, []);

  const reconnect = useCallback(() => {
    console.log('[SSE Client] Manually reconnecting...');
    isManuallyDisconnected.current = false;
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect, enabled]);

  return {
    isConnected,
    error,
    disconnect,
    reconnect,
  };
}
