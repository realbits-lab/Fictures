# Notification System Specification

**Status:** 🚧 Partial Implementation (Real-time events implemented, system notifications pending)
**Last Updated:** 2025-11-04

## Table of Contents

- [Overview](#overview)
- [Notification Types](#notification-types)
- [Notification Channels](#notification-channels)
- [Event Categories](#event-categories)
- [User Preferences](#user-preferences)
- [Notification Delivery](#notification-delivery)
- [Data Model](#data-model)
- [Notification Priority](#notification-priority)
- [Related Documentation](#related-documentation)

---

## Overview

The Fictures notification system delivers real-time updates and system notifications to users across multiple channels. The system follows the principle: **"The right message, to the right user, with the right frequency, via the right channel, at the right time."**

### Key Goals

1. **Real-Time Updates**: Instant notifications for time-sensitive events (`<100ms` latency)
2. **Multi-Channel Delivery**: Support in-app, push, and email notifications
3. **User Control**: Granular preferences for notification types and channels
4. **Scalability**: Handle thousands of concurrent users with minimal server load
5. **Progressive Enhancement**: Graceful degradation when real-time features unavailable

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Event Generation Layer                    │
│  (User actions, system events, scheduled tasks)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Event Processing Layer                    │
│  - Validate event                                            │
│  - Determine recipients                                      │
│  - Check user preferences                                    │
│  - Apply rate limiting                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Notification Queue Layer                  │
│  (Redis Pub/Sub, Message Queue)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬───────────────┐
        │            │            │               │
        ▼            ▼            ▼               ▼
┌─────────────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐
│  In-App     │ │  Push  │ │  Email   │ │  SMS         │
│  (SSE/WS)   │ │ Notif. │ │          │ │  (Future)    │
└─────────────┘ └────────┘ └──────────┘ └──────────────┘
```

---

## Notification Types

### 1. Real-Time Events (Implemented ✅)

**Purpose**: Instant updates for user-generated events
**Latency**: `<100ms`
**Technology**: Server-Sent Events (SSE) + Redis Pub/Sub

**Event Types:**
- Story published
- Story updated
- Story deleted
- Community post created
- Community post updated
- Community post deleted
- New comment/reply
- New like/bookmark

### 2. System Notifications (Planned 📋)

**Purpose**: Important system messages and user activity
**Delivery**: In-app notification center + optional push/email
**Persistence**: Stored in database, viewable in notification center

**Categories:**

#### Content Events
- New story from followed author
- New chapter published in reading story
- Story completion milestone (reading progress)
- Story recommendation based on reading history

#### Social Events
- Someone commented on your story
- Someone replied to your comment
- Someone liked your story/post
- Someone bookmarked your story
- New follower

#### System Events
- Welcome message for new users
- Publishing schedule reminders
- Story generation completed
- Scene evaluation completed
- System maintenance notifications
- Terms of service updates

#### Achievement Events
- First story published
- 100 readers milestone
- Story featured in community
- Writing streak achievements

---

## Notification Channels

### Channel Comparison

| Channel | Latency | Persistence | User Control | Use Case |
|---------|---------|-------------|--------------|----------|
| **In-App (Real-Time)** | `<100ms` | No (ephemeral) | Always on | Live updates while browsing |
| **In-App (Notification Center)** | Instant | Yes | Filterable | Activity history, unread notifications |
| **Push Notifications** | Seconds | No | Opt-in/out | Re-engagement when offline |
| **Email** | Minutes | Yes (inbox) | Opt-in/out | Digest, important updates |
| **SMS** | Seconds | No | Opt-in only | Critical alerts (future) |

### 1. In-App Real-Time Updates

**Technology**: Server-Sent Events (SSE) via `/api/community/events`

**Characteristics:**
- Unidirectional (server → client)
- Persistent HTTP connection
- Automatic reconnection
- Low overhead
- No persistence (ephemeral)

**Usage:**
```typescript
useCommunityEvents({
  onStoryPublished: (event) => {
    toast.success(`New story: ${event.title}`);
  },
  autoRevalidate: true,
});
```

**Best For:**
- Story list updates
- Live activity feed
- Typing indicators
- Real-time counters

### 2. In-App Notification Center (Future)

**UI Location**: Header bell icon with unread count badge

**Features:**
- Persistent notification history
- Mark as read/unread
- Filter by category
- Archive/delete
- Configurable retention (30 days default)

**Example:**
```
┌────────────────────────────────────────┐
│  Notifications (3 new)         [Filter]│
├────────────────────────────────────────┤
│  🔔 John Doe liked your story          │
│     "The Last Journey" - 5 mins ago    │
├────────────────────────────────────────┤
│  📖 New chapter published              │
│     "Moonlit Tales" - 1 hour ago       │
├────────────────────────────────────────┤
│  💬 Sarah replied to your comment      │
│     "Great story!" - 2 hours ago       │
└────────────────────────────────────────┘
```

### 3. Push Notifications (Future)

**Platform Support:**
- Web Push API (Chrome, Firefox, Edge, Safari)
- Mobile (via PWA)

**Requirements:**
- User permission grant
- Service Worker registration
- Push subscription management

**Use Cases:**
- New story from followed author (when offline)
- Reply to your comment
- Story milestone reached
- Publishing reminder

### 4. Email Notifications (Future)

**Delivery Types:**
- **Instant**: Critical events (account security, password reset)
- **Batched**: Daily/weekly digest of activity
- **Scheduled**: Weekly publishing reminders

**Templates:**
- Welcome email
- Activity digest
- Publishing reminder
- New follower summary

---

## Event Categories

### Category 1: Story Events

**Events:**
- `story:published` - Author publishes story
- `story:updated` - Author updates published story
- `story:deleted` - Author deletes story
- `story:chapter-published` - New chapter available
- `story:scene-published` - New scene available (weekly publishing)

**Recipients:**
- Story followers
- Author (for own story updates)
- Community page viewers (real-time)

**Channels:**
- In-app real-time (SSE)
- Notification center (persistent)
- Push notification (if enabled)

### Category 2: Social Events

**Events:**
- `social:comment-created` - Someone comments on your content
- `social:comment-reply` - Someone replies to your comment
- `social:like-received` - Someone likes your content
- `social:bookmark-added` - Someone bookmarks your story
- `social:follower-gained` - Someone follows you

**Recipients:**
- Content author
- Comment author (for replies)

**Channels:**
- Notification center (persistent)
- Push notification (opt-in)
- Email digest (opt-in)

### Category 3: Community Events

**Events:**
- `community:post-created` - New discussion post
- `community:post-updated` - Post edited
- `community:post-deleted` - Post removed
- `community:trending-story` - Story trending in community

**Recipients:**
- Community page viewers
- Topic followers
- All users (for trending stories)

**Channels:**
- In-app real-time (SSE)
- Notification center (for followed topics)

### Category 4: System Events

**Events:**
- `system:generation-complete` - Story generation finished
- `system:evaluation-complete` - Scene evaluation done
- `system:publish-scheduled` - Publishing scheduled successfully
- `system:maintenance-scheduled` - Upcoming maintenance
- `system:account-security` - Security alert

**Recipients:**
- Specific user (for their actions)
- All users (for system-wide events)

**Channels:**
- Notification center (persistent)
- Email (for security and maintenance)
- Banner notification (for critical system events)

---

## User Preferences

### Preference Categories

Users can control notifications at multiple levels:

#### 1. Global Preferences

```typescript
interface NotificationPreferences {
  enabled: boolean;              // Master on/off switch
  quietHours: {
    enabled: boolean;
    start: string;               // "22:00"
    end: string;                 // "08:00"
    timezone: string;            // "America/Los_Angeles"
  };
  doNotDisturb: boolean;         // Temporarily disable all
}
```

#### 2. Channel Preferences

```typescript
interface ChannelPreferences {
  inApp: {
    realTime: boolean;           // SSE events
    notificationCenter: boolean; // Persistent notifications
  };
  push: {
    enabled: boolean;
    storyEvents: boolean;
    socialEvents: boolean;
    systemEvents: boolean;
  };
  email: {
    enabled: boolean;
    instant: boolean;            // Immediate emails
    digest: 'daily' | 'weekly' | 'never';
    marketing: boolean;
  };
}
```

#### 3. Event-Level Preferences

```typescript
interface EventPreferences {
  storyPublished: {
    enabled: boolean;
    channels: ('inApp' | 'push' | 'email')[];
    frequency: 'all' | 'followed-only';
  };
  commentReceived: {
    enabled: boolean;
    channels: ('inApp' | 'push' | 'email')[];
  };
  newFollower: {
    enabled: boolean;
    channels: ('inApp' | 'push' | 'email')[];
  };
  // ... other events
}
```

### Default Settings

**New Users:**
- In-app notifications: Enabled (all)
- Push notifications: Disabled (requires opt-in)
- Email notifications: Enabled (digest only)
- Quiet hours: Disabled

**Principles:**
- Opt-out for in-app (non-intrusive)
- Opt-in for push (requires permission)
- Opt-in for marketing emails (GDPR compliance)
- Sensible defaults with easy customization

---

## Notification Delivery

### Delivery Flow

```typescript
// 1. Event Generation
const event = {
  type: 'story:published',
  actorId: 'user-123',
  targetId: 'story-456',
  metadata: { title: 'My Story', genre: 'fantasy' },
  timestamp: new Date(),
};

// 2. Recipient Determination
const recipients = await determineRecipients(event);
// Returns: followers of author + community viewers

// 3. Preference Checking
const deliveries = await checkPreferences(recipients, event);
// Filters by user preferences and quiet hours

// 4. Channel Distribution
await Promise.all([
  sendRealTimeEvent(deliveries.realTime, event),      // SSE
  persistNotifications(deliveries.persistent, event), // Database
  sendPushNotifications(deliveries.push, event),      // Push API
  queueEmailNotifications(deliveries.email, event),   // Email queue
]);
```

### Rate Limiting

**Purpose**: Prevent notification spam and respect user attention

**Limits:**

1. **Per-User Limits**
   - Max 50 notifications per hour
   - Max 200 notifications per day
   - Max 5 push notifications per hour

2. **Per-Event-Type Limits**
   - Group similar events (e.g., "3 people liked your story")
   - Batch digest for high-frequency events
   - Debounce rapid updates (1 second cooldown)

3. **Global Limits**
   - Max 10,000 real-time events per second (system-wide)
   - Queue overflow protection

**Implementation:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';

const notificationRateLimit = new Ratelimit({
  redis: getRedisClient(),
  limiter: Ratelimit.slidingWindow(50, '1 h'),
});

const { success } = await notificationRateLimit.limit(userId);
if (!success) {
  // Skip notification or queue for digest
}
```

### Notification Grouping

**When to Group:**
- Multiple likes/comments in short time
- Batch updates from same author
- Daily/weekly digest emails

**Example:**
```
Instead of:
- "John liked your story"
- "Mary liked your story"
- "Bob liked your story"

Show:
- "John, Mary, and Bob liked your story"

Or for many:
- "15 people liked your story"
```

---

## Data Model

### Database Schema

#### `notifications` Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Recipient
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  type VARCHAR(50) NOT NULL,           -- 'story:published', 'social:comment-created', etc.
  actor_id UUID REFERENCES users(id),  -- Who triggered the event
  target_id UUID,                      -- Story ID, comment ID, etc.
  target_type VARCHAR(50),             -- 'story', 'comment', 'post', etc.

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT,
  metadata JSONB,                      -- Additional event data

  -- Action
  action_url VARCHAR(500),             -- Where to go when clicked

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                -- Auto-delete after 30 days

  -- Indexes
  INDEX idx_notifications_user_unread (user_id, is_read, created_at),
  INDEX idx_notifications_type (type, created_at),
  INDEX idx_notifications_expires (expires_at)
);
```

#### `notification_preferences` Table

```sql
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

  -- Channel preferences (JSONB for flexibility)
  channel_preferences JSONB DEFAULT '{
    "inApp": {"realTime": true, "notificationCenter": true},
    "push": {"enabled": false},
    "email": {"enabled": true, "digest": "weekly", "instant": false}
  }',

  -- Event preferences (JSONB)
  event_preferences JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id)
);
```

#### `push_subscriptions` Table (Future)

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Push subscription details (Web Push API)
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,

  -- Metadata
  user_agent TEXT,
  device_type VARCHAR(50),           -- 'desktop', 'mobile', 'tablet'

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,

  -- Indexes
  INDEX idx_push_subscriptions_user (user_id),
  UNIQUE(endpoint)
);
```

### TypeScript Interfaces

```typescript
// Notification entity
export interface Notification {
  id: string;
  userId: string;

  // Event
  type: NotificationType;
  actorId: string | null;
  targetId: string | null;
  targetType: string | null;

  // Content
  title: string;
  message: string | null;
  metadata: Record<string, any>;
  actionUrl: string | null;

  // Status
  isRead: boolean;
  isArchived: boolean;
  deliveredAt: Date | null;
  readAt: Date | null;

  // Timestamps
  createdAt: Date;
  expiresAt: Date | null;
}

// Notification event types
export type NotificationType =
  // Story events
  | 'story:published'
  | 'story:updated'
  | 'story:deleted'
  | 'story:chapter-published'
  | 'story:scene-published'
  // Social events
  | 'social:comment-created'
  | 'social:comment-reply'
  | 'social:like-received'
  | 'social:bookmark-added'
  | 'social:follower-gained'
  // Community events
  | 'community:post-created'
  | 'community:post-updated'
  | 'community:trending-story'
  // System events
  | 'system:generation-complete'
  | 'system:evaluation-complete'
  | 'system:publish-scheduled'
  | 'system:maintenance-scheduled'
  | 'system:account-security';

// Notification preferences
export interface NotificationPreferences {
  id: string;
  userId: string;

  // Global
  enabled: boolean;
  doNotDisturb: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;

  // Channel preferences
  channelPreferences: ChannelPreferences;

  // Event preferences
  eventPreferences: Record<NotificationType, EventPreference>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelPreferences {
  inApp: {
    realTime: boolean;
    notificationCenter: boolean;
  };
  push: {
    enabled: boolean;
    storyEvents: boolean;
    socialEvents: boolean;
    systemEvents: boolean;
  };
  email: {
    enabled: boolean;
    instant: boolean;
    digest: 'daily' | 'weekly' | 'never';
    marketing: boolean;
  };
}

export interface EventPreference {
  enabled: boolean;
  channels: ('inApp' | 'push' | 'email')[];
  frequency?: 'all' | 'followed-only' | 'mentions-only';
}
```

---

## Notification Priority

### Priority Levels

Notifications are classified by priority to ensure important messages are never missed:

| Priority | Latency | Channels | Examples |
|----------|---------|----------|----------|
| **Critical** | Immediate | All (override quiet hours) | Security alerts, account issues |
| **High** | `<5 seconds` | In-app + Push (if enabled) | Comments on your story, new follower |
| **Medium** | `<1 minute` | In-app + Notification center | Story published, new chapter |
| **Low** | Batched/Digest | Notification center only | Daily activity summary |

### Priority Rules

```typescript
function getNotificationPriority(type: NotificationType): Priority {
  switch (type) {
    // Critical (override all settings)
    case 'system:account-security':
    case 'system:maintenance-scheduled':
      return 'critical';

    // High (immediate delivery)
    case 'social:comment-created':
    case 'social:comment-reply':
    case 'social:follower-gained':
      return 'high';

    // Medium (near real-time)
    case 'story:published':
    case 'story:chapter-published':
    case 'community:post-created':
      return 'medium';

    // Low (batched)
    case 'social:like-received':
    case 'social:bookmark-added':
      return 'low';

    default:
      return 'medium';
  }
}
```

---

## Related Documentation

### Implementation Guides
- **[notification-development.md](./notification-development.md)** - Implementation guide with code examples
- **[real-time-story-updates.md](./real-time-story-updates.md)** - SSE implementation details
- **[real-time-implementation-summary.md](./real-time-implementation-summary.md)** - SSE completion report

### Comparison & Analysis
- **[real-time-comparison.md](./real-time-comparison.md)** - Technology comparison (SSE vs WebSocket vs Polling)

### Related Systems
- **[docs/community/community-specification.md](../community/community-specification.md)** - Community features
- **[docs/publish/publish-specification.md](../publish/publish-specification.md)** - Weekly publishing system

---

## Status Summary

### Implemented ✅
- Real-time story events (SSE)
- Redis Pub/Sub infrastructure
- Event broadcasting to connected clients
- Automatic reconnection
- SWR cache auto-revalidation

### In Progress 🚧
- Toast notification UI
- Connection status indicator

### Planned 📋
- Persistent notification center
- User preference management
- Push notifications (Web Push API)
- Email notifications
- Notification grouping and batching
- SMS notifications (future)

---

**Next Steps:**
1. Implement persistent notification center UI
2. Create notification preferences page
3. Add database schema for notifications
4. Implement notification grouping logic
5. Add Web Push API support
6. Create email notification templates

---

**Last Updated**: 2025-11-04
**Related Issues**: #43 (Real-time updates)
