# Notification System Development Guide

**Status:** 🚧 Partial Implementation
**Last Updated:** 2025-11-04

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Real-Time Notifications (Implemented)](#real-time-notifications-implemented)
- [Persistent Notifications (Planned)](#persistent-notifications-planned)
- [Push Notifications (Planned)](#push-notifications-planned)
- [Email Notifications (Planned)](#email-notifications-planned)
- [Frontend Integration](#frontend-integration)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
│  - useCommunityEvents (SSE client hook)                      │
│  - NotificationCenter component (future)                     │
│  - Toast notifications (sonner)                              │
│  - Connection status indicator                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
│  - GET /api/community/events (SSE endpoint)                  │
│  - POST /api/notifications (create notification)             │
│  - GET /api/notifications (fetch notifications)              │
│  - PUT /api/notifications/:id/read (mark as read)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  - NotificationService (business logic)                      │
│  - EventPublisher (Redis pub/sub)                            │
│  - PreferenceChecker (user preferences)                      │
│  - RateLimiter (anti-spam)                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│  PostgreSQL  │          │  Redis       │
│  (Neon)      │          │  (Upstash)   │
│              │          │              │
│ - notifs     │          │ - Pub/Sub    │
│ - prefs      │          │ - Rate limit │
└──────────────┘          └──────────────┘
```

---

## Technology Stack

### Backend

- **Runtime**: Next.js 15 API Routes (Node.js)
- **Real-Time**: Server-Sent Events (SSE) via native Web API
- **Message Queue**: Redis Pub/Sub (ioredis)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Rate Limiting**: @upstash/ratelimit

### Frontend

- **React Hook**: Custom useCommunityEvents hook
- **Notifications**: sonner (toast library)
- **State Management**: SWR for cache management
- **Connection**: EventSource API (native browser API)

### Infrastructure

- **Hosting**: Vercel (Edge Runtime support)
- **Redis**: Upstash (Redis-compatible)
- **Database**: Neon PostgreSQL (serverless)
- **CDN**: Vercel Edge Network

---

## Real-Time Notifications (Implemented)

### 1. Redis Infrastructure

**File**: `src/lib/redis/client.ts`

```typescript
import { Redis } from 'ioredis';

// Singleton publisher for sending events
let redisPublisher: Redis | null = null;

export function getRedisPublisher(): Redis {
  if (!redisPublisher) {
    redisPublisher = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisPublisher.on('error', (error) => {
      console.error('[Redis Publisher] Error:', error);
    });

    redisPublisher.on('connect', () => {
      console.log('[Redis Publisher] Connected');
    });
  }

  return redisPublisher;
}

// Singleton subscriber for receiving events
let redisSubscriber: Redis | null = null;

export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    redisSubscriber = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisSubscriber.on('error', (error) => {
      console.error('[Redis Subscriber] Error:', error);
    });

    redisSubscriber.on('connect', () => {
      console.log('[Redis Subscriber] Connected');
    });
  }

  return redisSubscriber;
}

// Channel definitions
export const CHANNELS = {
  // Story events
  STORY_PUBLISHED: 'story:published',
  STORY_UPDATED: 'story:updated',
  STORY_DELETED: 'story:deleted',
  STORY_CHAPTER_PUBLISHED: 'story:chapter-published',
  STORY_SCENE_PUBLISHED: 'story:scene-published',

  // Social events
  SOCIAL_COMMENT_CREATED: 'social:comment-created',
  SOCIAL_COMMENT_REPLY: 'social:comment-reply',
  SOCIAL_LIKE_RECEIVED: 'social:like-received',
  SOCIAL_BOOKMARK_ADDED: 'social:bookmark-added',
  SOCIAL_FOLLOWER_GAINED: 'social:follower-gained',

  // Community events
  COMMUNITY_POST_CREATED: 'community:post-created',
  COMMUNITY_POST_UPDATED: 'community:post-updated',
  COMMUNITY_POST_DELETED: 'community:post-deleted',
  COMMUNITY_TRENDING_STORY: 'community:trending-story',

  // System events
  SYSTEM_GENERATION_COMPLETE: 'system:generation-complete',
  SYSTEM_EVALUATION_COMPLETE: 'system:evaluation-complete',
  SYSTEM_PUBLISH_SCHEDULED: 'system:publish-scheduled',
  SYSTEM_MAINTENANCE: 'system:maintenance-scheduled',
  SYSTEM_ACCOUNT_SECURITY: 'system:account-security',
} as const;

// Event payload interfaces
export interface StoryPublishedEvent {
  storyId: string;
  title: string;
  authorId: string;
  authorName: string;
  genre: string | null;
  coverImageUrl: string | null;
  timestamp: string;
}

export interface SocialCommentEvent {
  commentId: string;
  storyId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId: string | null; // null = top-level, non-null = reply
  timestamp: string;
}

export interface SocialLikeEvent {
  likeId: string;
  targetId: string;
  targetType: 'story' | 'post' | 'comment';
  userId: string;
  userName: string;
  timestamp: string;
}

// Helper function to publish events
export async function publishEvent(
  channel: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const publisher = getRedisPublisher();
    const message = JSON.stringify(payload);
    await publisher.publish(channel, message);
    console.log(`[Redis] Published event to ${channel}:`, payload);
  } catch (error) {
    console.error(`[Redis] Failed to publish event to ${channel}:`, error);
    throw error;
  }
}
```

### 2. SSE Endpoint

**File**: `src/app/api/community/events/route.ts`

```typescript
import { getRedisSubscriber, CHANNELS } from '@/lib/redis/client';
import { auth } from '@/lib/auth/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Track active connections
let activeConnections = 0;

export async function GET(request: Request) {
  // Optional: Authenticate user
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      activeConnections++;
      console.log(`[SSE] Client connected (userId: ${userId}). Active: ${activeConnections}`);

      const subscriber = getRedisSubscriber();

      // Helper to send SSE events
      const sendEvent = (eventName: string, data: any) => {
        try {
          const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (error) {
          console.error('[SSE] Error sending event:', error);
        }
      };

      // Send initial connection confirmation
      sendEvent('connected', {
        message: 'Connected to Fictures real-time events',
        userId,
        timestamp: new Date().toISOString(),
      });

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        sendEvent('ping', { timestamp: new Date().toISOString() });
      }, 30000);

      // Subscribe to all event channels
      const channels = Object.values(CHANNELS);
      await subscriber.subscribe(...channels);

      console.log(`[SSE] Subscribed to ${channels.length} channels`);

      // Handle incoming Redis messages
      subscriber.on('message', async (channel, message) => {
        try {
          const data = JSON.parse(message);

          // Optional: Filter events based on user preferences
          // const shouldSend = await checkUserPreferences(userId, channel, data);
          // if (!shouldSend) return;

          // Map channel to SSE event name
          const eventName = channel.replace(':', '-'); // 'story:published' → 'story-published'

          // Send event to client
          sendEvent(eventName, data);

          console.log(`[SSE] Sent ${eventName} to user ${userId}`);
        } catch (error) {
          console.error('[SSE] Error processing message:', error);
        }
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        activeConnections--;
        console.log(`[SSE] Client disconnected (userId: ${userId}). Active: ${activeConnections}`);

        // Cleanup
        clearInterval(keepAliveInterval);
        subscriber.unsubscribe();
        subscriber.quit();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
```

### 3. Publishing Events

**Example**: Story visibility API

**File**: `src/app/api/stories/[id]/visibility/route.ts`

```typescript
import { publishEvent, CHANNELS } from '@/lib/redis/client';
import { db } from '@/lib/db';
import { stories } from '@/lib/db/schema';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { visibility } = await request.json();
  const status = visibility === 'public' ? 'published' : 'writing';

  // Update story in database
  const [updatedStory] = await db
    .update(stories)
    .set({ status, updatedAt: new Date() })
    .where(and(
      eq(stories.id, params.id),
      eq(stories.authorId, session.user.id)
    ))
    .returning();

  if (!updatedStory) {
    return new Response('Story not found', { status: 404 });
  }

  // Publish event to Redis when story becomes public
  if (status === 'published') {
    try {
      await publishEvent(CHANNELS.STORY_PUBLISHED, {
        storyId: updatedStory.id,
        title: updatedStory.title,
        authorId: updatedStory.authorId,
        authorName: session.user.name || 'Anonymous',
        genre: updatedStory.genre,
        coverImageUrl: updatedStory.coverImageUrl,
        timestamp: new Date().toISOString(),
      });

      console.log(`[API] Published story:published event for story ${updatedStory.id}`);
    } catch (error) {
      console.error('[API] Failed to publish event:', error);
      // Don't fail the request if event publishing fails
    }
  }

  return NextResponse.json(updatedStory);
}
```

### 4. Client-Side Hook

**File**: `src/lib/hooks/use-community-events.ts`

```typescript
'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { mutate } from 'swr';

export interface UseCommunityEventsOptions {
  onStoryPublished?: (event: StoryPublishedEvent) => void;
  onStoryUpdated?: (event: StoryUpdatedEvent) => void;
  onStoryDeleted?: (event: StoryDeletedEvent) => void;
  onPostCreated?: (event: PostCreatedEvent) => void;
  onCommentCreated?: (event: SocialCommentEvent) => void;
  onCommentReply?: (event: SocialCommentEvent) => void;
  onLikeReceived?: (event: SocialLikeEvent) => void;
  autoRevalidate?: boolean;
  enabled?: boolean;
}

export function useCommunityEvents(options: UseCommunityEventsOptions = {}) {
  const {
    onStoryPublished,
    onStoryUpdated,
    onStoryDeleted,
    onPostCreated,
    onCommentCreated,
    onCommentReply,
    onLikeReceived,
    autoRevalidate = true,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('[SSE Client] Connecting to community events...');

    const eventSource = new EventSource('/api/community/events');
    eventSourceRef.current = eventSource;

    // Connection opened
    eventSource.addEventListener('connected', (event) => {
      const data = JSON.parse(event.data);
      console.log('[SSE Client] Connected:', data.message);
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    });

    // Keep-alive ping
    eventSource.addEventListener('ping', () => {
      // Silent keep-alive
    });

    // Story events
    eventSource.addEventListener('story-published', (event) => {
      const data: StoryPublishedEvent = JSON.parse(event.data);
      console.log('[SSE Client] Story published:', data.title);

      if (autoRevalidate) {
        mutate('/community/api/stories');
      }

      onStoryPublished?.(data);
    });

    eventSource.addEventListener('story-updated', (event) => {
      const data: StoryUpdatedEvent = JSON.parse(event.data);
      console.log('[SSE Client] Story updated:', data.storyId);

      if (autoRevalidate) {
        mutate('/community/api/stories');
        mutate(`/api/stories/${data.storyId}`);
      }

      onStoryUpdated?.(data);
    });

    eventSource.addEventListener('story-deleted', (event) => {
      const data: StoryDeletedEvent = JSON.parse(event.data);
      console.log('[SSE Client] Story deleted:', data.storyId);

      if (autoRevalidate) {
        mutate('/community/api/stories');
      }

      onStoryDeleted?.(data);
    });

    // Social events
    eventSource.addEventListener('social-comment-created', (event) => {
      const data: SocialCommentEvent = JSON.parse(event.data);
      console.log('[SSE Client] Comment created:', data.commentId);

      if (autoRevalidate) {
        mutate(`/api/stories/${data.storyId}/comments`);
      }

      onCommentCreated?.(data);
    });

    eventSource.addEventListener('social-comment-reply', (event) => {
      const data: SocialCommentEvent = JSON.parse(event.data);
      console.log('[SSE Client] Comment reply:', data.commentId);

      if (autoRevalidate) {
        mutate(`/api/stories/${data.storyId}/comments`);
      }

      onCommentReply?.(data);
    });

    eventSource.addEventListener('social-like-received', (event) => {
      const data: SocialLikeEvent = JSON.parse(event.data);
      console.log('[SSE Client] Like received:', data.likeId);

      if (autoRevalidate) {
        // Update like counts
        mutate(`/api/${data.targetType}s/${data.targetId}/likes`);
      }

      onLikeReceived?.(data);
    });

    // Error handling
    eventSource.onerror = (err) => {
      console.error('[SSE Client] Connection error:', err);
      setIsConnected(false);
      setError(new Error('SSE connection failed'));
      eventSource.close();

      // Exponential backoff reconnection
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`[SSE Client] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        console.error('[SSE Client] Max reconnection attempts reached');
        setError(new Error('Failed to reconnect after multiple attempts'));
      }
    };
  }, [
    enabled,
    onStoryPublished,
    onStoryUpdated,
    onStoryDeleted,
    onPostCreated,
    onCommentCreated,
    onCommentReply,
    onLikeReceived,
    autoRevalidate,
  ]);

  useEffect(() => {
    connect();

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return {
    isConnected,
    error,
    disconnect: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setIsConnected(false);
      }
    },
    reconnect: () => {
      reconnectAttempts.current = 0;
      connect();
    },
  };
}
```

### 5. Usage in Components

**File**: `src/app/community/page.tsx`

```typescript
'use client';

import { useCommunityEvents } from '@/lib/hooks/use-community-events';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CommunityPage() {
  const [newStoryCount, setNewStoryCount] = useState(0);

  const { isConnected, error } = useCommunityEvents({
    onStoryPublished: (event) => {
      console.log('📚 New story published:', event.title);

      toast.success(`New story published: ${event.title}`, {
        description: `by ${event.authorName}`,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = `/novels/${event.storyId}`;
          },
        },
      });

      setNewStoryCount((prev) => prev + 1);
    },

    onCommentCreated: (event) => {
      console.log('💬 New comment:', event.content);

      toast.info(`New comment on "${event.storyTitle}"`, {
        description: event.content.substring(0, 100),
      });
    },

    autoRevalidate: true,
  });

  return (
    <div>
      {/* Connection status indicator */}
      <div className="flex items-center gap-2 mb-4">
        {isConnected && (
          <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
        )}
        {error && (
          <span className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Disconnected
          </span>
        )}
      </div>

      {/* New stories banner */}
      {newStoryCount > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
          <button
            onClick={() => {
              setNewStoryCount(0);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            {newStoryCount} new {newStoryCount === 1 ? 'story' : 'stories'} published. Click to view.
          </button>
        </div>
      )}

      {/* Rest of community page content */}
    </div>
  );
}
```

---

## Persistent Notifications (Planned)

### 1. Database Schema

**Migration**: `drizzle/migrations/XXXX_create_notifications.sql`

```sql
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  type VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_id UUID,
  target_type VARCHAR(50),

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  action_url VARCHAR(500),

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),

  -- Indexes
  INDEX idx_notifications_user_unread (user_id, is_read, created_at DESC),
  INDEX idx_notifications_type (type, created_at DESC),
  INDEX idx_notifications_expires (expires_at)
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Global settings
  enabled BOOLEAN DEFAULT TRUE,
  do_not_disturb BOOLEAN DEFAULT FALSE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Channel preferences (JSON)
  channel_preferences JSONB DEFAULT '{
    "inApp": {"realTime": true, "notificationCenter": true},
    "push": {"enabled": false, "storyEvents": true, "socialEvents": true, "systemEvents": true},
    "email": {"enabled": true, "instant": false, "digest": "weekly", "marketing": false}
  }',

  -- Event preferences (JSON)
  event_preferences JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Auto-delete expired notifications (run daily via cron)
CREATE INDEX idx_notifications_cleanup ON notifications(expires_at) WHERE expires_at IS NOT NULL;
```

### 2. Notification Service

**File**: `src/lib/services/notification-service.ts`

```typescript
import { db } from '@/lib/db';
import { notifications, notificationPreferences } from '@/lib/db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { publishEvent, CHANNELS } from '@/lib/redis/client';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  actorId?: string;
  targetId?: string;
  targetType?: string;
  title: string;
  message?: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
}

export class NotificationService {
  /**
   * Create and deliver a notification
   */
  static async createNotification(input: CreateNotificationInput) {
    // Check user preferences
    const preferences = await this.getUserPreferences(input.userId);

    if (!preferences.enabled || preferences.doNotDisturb) {
      console.log(`[Notification] Skipping notification for user ${input.userId} (disabled)`);
      return null;
    }

    // Check quiet hours
    if (this.isQuietHours(preferences)) {
      console.log(`[Notification] Skipping notification for user ${input.userId} (quiet hours)`);
      return null;
    }

    // Check event-specific preferences
    if (!this.shouldSendNotification(preferences, input.type)) {
      console.log(`[Notification] Skipping notification type ${input.type} for user ${input.userId}`);
      return null;
    }

    // Create notification in database
    const [notification] = await db.insert(notifications).values({
      userId: input.userId,
      type: input.type,
      actorId: input.actorId,
      targetId: input.targetId,
      targetType: input.targetType,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      actionUrl: input.actionUrl,
      deliveredAt: new Date(),
    }).returning();

    console.log(`[Notification] Created notification ${notification.id} for user ${input.userId}`);

    // Publish real-time event
    await publishEvent(CHANNELS.NOTIFICATION_CREATED, {
      notificationId: notification.id,
      userId: input.userId,
      type: input.type,
      title: input.title,
      actionUrl: input.actionUrl,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send push notification if enabled
    // TODO: Queue email notification if enabled

    return notification;
  }

  /**
   * Get user's notification preferences
   */
  static async getUserPreferences(userId: string) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Return default preferences if not found
    if (!prefs) {
      return {
        enabled: true,
        doNotDisturb: false,
        quietHoursEnabled: false,
        quietHoursStart: null,
        quietHoursEnd: null,
        timezone: 'UTC',
        channelPreferences: {
          inApp: { realTime: true, notificationCenter: true },
          push: { enabled: false },
          email: { enabled: true, digest: 'weekly' },
        },
        eventPreferences: {},
      };
    }

    return prefs;
  }

  /**
   * Check if current time is within user's quiet hours
   */
  static isQuietHours(preferences: any): boolean {
    if (!preferences.quietHoursEnabled) return false;

    // TODO: Implement timezone-aware quiet hours check
    return false;
  }

  /**
   * Check if notification type should be sent based on preferences
   */
  static shouldSendNotification(preferences: any, type: string): boolean {
    const eventPrefs = preferences.eventPreferences[type];

    if (!eventPrefs) return true; // Default: allow

    return eventPrefs.enabled !== false;
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ))
      .returning();

    return updated;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ));

    return result[0]?.count || 0;
  }

  /**
   * Fetch notifications for user
   */
  static async getUserNotifications(userId: string, limit = 50, offset = 0) {
    return db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isArchived, false)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  /**
   * Delete expired notifications (run via cron)
   */
  static async cleanupExpiredNotifications() {
    const result = await db
      .delete(notifications)
      .where(lt(notifications.expiresAt, new Date()));

    console.log(`[Notification] Deleted ${result.rowCount} expired notifications`);
    return result.rowCount;
  }
}
```

### 3. API Endpoints

**File**: `src/app/api/notifications/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { NotificationService } from '@/lib/services/notification-service';

// GET /api/notifications - Fetch user's notifications
export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const notifications = await NotificationService.getUserNotifications(
    session.user.id,
    limit,
    offset
  );

  const unreadCount = await NotificationService.getUnreadCount(session.user.id);

  return NextResponse.json({
    notifications,
    unreadCount,
    hasMore: notifications.length === limit,
  });
}

// POST /api/notifications - Create notification (internal use)
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // TODO: Add admin/system check

  const body = await request.json();
  const notification = await NotificationService.createNotification(body);

  return NextResponse.json(notification);
}
```

**File**: `src/app/api/notifications/[id]/read/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { NotificationService } from '@/lib/services/notification-service';

// PUT /api/notifications/:id/read - Mark notification as read
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const notification = await NotificationService.markAsRead(
    params.id,
    session.user.id
  );

  if (!notification) {
    return new Response('Notification not found', { status: 404 });
  }

  return NextResponse.json(notification);
}
```

---

## Push Notifications (Planned)

### 1. Service Worker Registration

**File**: `public/sw.js`

```javascript
// Service Worker for Web Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();

  const options = {
    body: data.message,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: {
      url: data.actionUrl,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 2. Push Subscription Management

**File**: `src/lib/services/push-service.ts`

```typescript
export class PushService {
  static async subscribeToPush(userId: string): Promise<PushSubscription | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push notifications not supported');
      return null;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');

      // Request notification permission
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.error('Notification permission denied');
        return null;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Save subscription to database
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          subscription: subscription.toJSON(),
        }),
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  static async unsubscribeFromPush(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;

      await subscription.unsubscribe();

      // Remove subscription from database
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    }
  }
}
```

---

## Email Notifications (Planned)

### 1. Email Service

**File**: `src/lib/services/email-service.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendNotificationEmail(
    to: string,
    subject: string,
    html: string
  ) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'Fictures <notifications@fictures.com>',
        to,
        subject,
        html,
      });

      if (error) {
        console.error('[Email] Failed to send:', error);
        return null;
      }

      console.log('[Email] Sent successfully:', data.id);
      return data;
    } catch (error) {
      console.error('[Email] Error:', error);
      return null;
    }
  }

  static async sendDigestEmail(userId: string, notifications: any[]) {
    // TODO: Implement digest email template
  }
}
```

---

## Frontend Integration

### Notification Center Component (Future)

**File**: `src/components/notifications/NotificationCenter.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  };

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    fetchNotifications();
  };

  return (
    <div className="relative">
      {/* Bell icon with badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !notif.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                  }`}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.actionUrl) {
                      window.location.href = notif.actionUrl;
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="font-medium">{notif.title}</p>
                      {notif.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notif.message}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <button className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Testing

### Unit Tests

**File**: `__tests__/notification-service.test.ts`

```typescript
import { NotificationService } from '@/lib/services/notification-service';

describe('NotificationService', () => {
  it('should create notification', async () => {
    const notification = await NotificationService.createNotification({
      userId: 'user-123',
      type: 'story:published',
      title: 'New story published',
      message: 'Check out the new story!',
    });

    expect(notification).toBeDefined();
    expect(notification.title).toBe('New story published');
  });

  it('should respect quiet hours', async () => {
    // TODO: Implement
  });

  it('should respect do not disturb', async () => {
    // TODO: Implement
  });
});
```

### E2E Tests

**File**: `tests/notifications.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Real-time notifications', () => {
  test('should receive story published notification', async ({ page, context }) => {
    // Login as reader
    await page.goto('http://localhost:3000/community');

    // Open writer page in new tab
    const writerPage = await context.newPage();
    await writerPage.goto('http://localhost:3000/studio');

    // Publish story
    await writerPage.click('[data-testid="publish-button"]');

    // Reader page should show notification
    await expect(page.locator('[data-testid="notification-toast"]')).toBeVisible({
      timeout: 2000,
    });
  });
});
```

---

## Deployment

### Environment Variables

```bash
# .env.local
REDIS_URL=redis://...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
RESEND_API_KEY=...
```

### Vercel Configuration

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-notifications",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Monitoring

```typescript
// Track SSE connection count
console.log(`[SSE] Active connections: ${activeConnections}`);

// Track notification delivery
console.log(`[Notification] Delivered ${count} notifications in ${ms}ms`);

// Track failed deliveries
console.error(`[Notification] Failed to deliver to user ${userId}`);
```

---

## Related Documentation

- **[notification-specification.md](./notification-specification.md)** - Complete system specification
- **[real-time-story-updates.md](./real-time-story-updates.md)** - SSE implementation details
- **[real-time-comparison.md](./real-time-comparison.md)** - Technology comparison

---

**Status**: 🚧 Partial implementation (real-time events complete, persistent notifications planned)
**Last Updated**: 2025-11-04
