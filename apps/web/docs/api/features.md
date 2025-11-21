# Feature APIs

APIs for Analytics, Community, Publishing, Comics, Novels, and Settings.

## Table of Contents

- [Analysis APIs](#analysis-apis) - Analytics tracking and stats
- [Community APIs](#community-apis) - Posts, likes, replies
- [Publish APIs](#publish-apis) - Scheduling and publishing
- [Comics APIs](#comics-apis) - Panel generation
- [Novels APIs](#novels-apis) - Reading and history
- [Settings APIs](#settings-apis) - User preferences and API keys

---

## Analysis APIs

Track user interactions and view analytics for stories.

### Track Event

Track an analytics event for user interactions.

**Endpoint:** `POST /analysis/api/track`

**Authentication:** Optional (Session - tracks anonymous if not authenticated)

**Request Body:**

```json
{
  "eventType": "story_view",
  "storyId": "story_abc123",
  "chapterId": "chapter_xyz",
  "sceneId": "scene_def",
  "postId": "post_ghi",
  "metadata": {
    "deviceType": "mobile",
    "source": "discover_page"
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| eventType | string | Yes | Event type (see below) |
| storyId | string | No | Story ID |
| chapterId | string | No | Chapter ID |
| sceneId | string | No | Scene ID |
| postId | string | No | Community post ID |
| metadata | object | No | Additional event data |

**Event Types:**
- `story_view` - Story viewed
- `story_liked` - Story liked
- `comment_created` - Comment posted
- `share` - Story shared
- `bookmark` - Story bookmarked
- `chapter_completed` - Chapter finished reading
- `scene_view` - Scene viewed

**Success Response (200):**

```json
{
  "success": true
}
```

**Note:** Analytics failures are silent (always returns `success: false` on error)

**Example:**

```bash
curl -X POST http://localhost:3000/analysis/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "story_view",
    "storyId": "story_abc123",
    "metadata": {"deviceType": "mobile"}
  }'
```

---

### Get Story Statistics

Get analytics statistics for a specific story.

**Endpoint:** `GET /analysis/api/stats`

**Authentication:** Required (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storyId | string | Yes | Story ID |
| period | string | No | Time period: `7d`, `30d`, `90d`, `all` |

**Success Response (200):**

```json
{
  "storyId": "story_abc123",
  "period": "30d",
  "stats": {
    "totalViews": 1250,
    "uniqueReaders": 450,
    "likes": 89,
    "comments": 45,
    "shares": 12,
    "bookmarks": 67,
    "averageRating": 4.5,
    "completionRate": 0.68
  },
  "trends": {
    "viewsChange": "+15%",
    "readersChange": "+8%"
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/analysis/api/stats?storyId=story_abc123&period=30d" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

---

### Get Daily Metrics

Get daily aggregated metrics for a story.

**Endpoint:** `GET /analysis/api/daily`

**Authentication:** Required (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storyId | string | Yes | Story ID |
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |

**Success Response (200):**

```json
{
  "storyId": "story_abc123",
  "metrics": [
    {
      "date": "2024-01-15",
      "totalViews": 125,
      "uniqueReaders": 45,
      "engagementRate": "12.5",
      "completionRate": "68.2"
    }
  ]
}
```

---

## Community APIs

Manage community posts, likes, and replies.

### Get Community Stories

Get community stories with Redis caching for optimized performance.

**Endpoint:** `GET /api/community/stories`

**Authentication:** Optional (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sort | string | No | Sort: `recent`, `popular`, `rating` |

**Success Response (200):**

```json
{
  "stories": [
    {
      "id": "story_abc123",
      "title": "The Adventure",
      "summary": "A hero's journey...",
      "genre": "Fantasy",
      "coverImageUrl": "https://...",
      "author": {
        "id": "user_xyz",
        "name": "John Doe"
      },
      "likes": 89,
      "views": 1250,
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Caching:**
- Uses 3-layer caching: Redis + HTTP ETag + localStorage
- Cache invalidated on story modifications
- ETag support for efficient client-side caching

---

### Create Post

Create a new community post.

**Endpoint:** `POST /community/api/posts`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "title": "My Thoughts on This Story",
  "content": "I really enjoyed reading this...",
  "contentHtml": "<p>I really enjoyed reading this...</p>",
  "storyId": "story_abc123",
  "type": "discussion",
  "tags": ["review", "feedback"],
  "mentions": ["@author"]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Post title (max 255 chars) |
| content | string | Yes | Post content (Markdown) |
| contentHtml | string | No | Rendered HTML content |
| storyId | string | Yes | Associated story ID |
| type | string | No | Post type (default: `discussion`) |
| tags | array | No | Post tags |
| mentions | array | No | User mentions |

**Post Types:**
- `discussion` - General discussion
- `review` - Story review
- `question` - Question post
- `announcement` - Announcement

**Success Response (201):**

```json
{
  "success": true,
  "post": {
    "id": "post_abc123",
    "title": "My Thoughts on This Story",
    "content": "I really enjoyed reading this...",
    "storyId": "story_abc123",
    "authorId": "user_xyz",
    "type": "discussion",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Cache Invalidation:** Automatically invalidates community caches

**Example:**

```bash
curl -X POST http://localhost:3000/community/api/posts \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "title": "Great Story!",
    "content": "I loved this story...",
    "storyId": "story_abc123"
  }'
```

---

### Get Post

Get detailed information about a post.

**Endpoint:** `GET /community/api/posts/[postId]`

**Authentication:** Optional (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Success Response (200):**

```json
{
  "post": {
    "id": "post_abc123",
    "title": "My Thoughts on This Story",
    "content": "I really enjoyed reading this...",
    "authorId": "user_xyz",
    "author": {
      "id": "user_xyz",
      "name": "John Doe",
      "image": "https://..."
    },
    "storyId": "story_abc123",
    "likes": 42,
    "replyCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Like Post

Like or unlike a community post.

**Endpoint:** `POST /community/api/posts/[postId]/like`

**Authentication:** Required (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| postId | string | Yes | Post ID |

**Success Response (200):**

```json
{
  "success": true,
  "liked": true,
  "likeCount": 43
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/community/api/posts/post_abc123/like \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

---

### Create Reply

Reply to a community post.

**Endpoint:** `POST /community/api/posts/[postId]/replies`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "content": "Great point! I agree...",
  "contentHtml": "<p>Great point! I agree...</p>"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| content | string | Yes | Reply content (Markdown) |
| contentHtml | string | No | Rendered HTML |

**Success Response (201):**

```json
{
  "success": true,
  "reply": {
    "id": "reply_abc123",
    "postId": "post_xyz",
    "content": "Great point! I agree...",
    "authorId": "user_def",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

### Get Story Posts

Get all community posts for a specific story.

**Endpoint:** `GET /community/api/stories/[storyId]/posts`

**Authentication:** Optional (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storyId | string | Yes | Story ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sort | string | No | Sort: `recent`, `popular`, `oldest` |

**Success Response (200):**

```json
{
  "posts": [
    {
      "id": "post_abc123",
      "title": "Great Story!",
      "content": "I loved this...",
      "likes": 42,
      "replyCount": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Publish APIs

Schedule and manage story publishing.

### Create Publishing Schedule

Create a new publishing schedule for a story or chapter.

**Endpoint:** `POST /publish/api/schedules`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "storyId": "story_abc123",
  "chapterId": "chapter_xyz",
  "name": "Weekly Release Schedule",
  "description": "Publish one scene per week",
  "scheduleType": "interval",
  "startDate": "2024-01-20T00:00:00.000Z",
  "endDate": "2024-06-20T00:00:00.000Z",
  "publishTime": "09:00",
  "intervalDays": 7,
  "daysOfWeek": ["monday"],
  "scenesPerPublish": 1
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| storyId | string | Yes | Story ID |
| chapterId | string | No | Chapter ID (if scheduling chapter) |
| name | string | Yes | Schedule name |
| description | string | No | Schedule description |
| scheduleType | string | Yes | Type: `interval`, `weekly`, `custom` |
| startDate | string | Yes | Start date (ISO 8601) |
| endDate | string | No | End date (ISO 8601) |
| publishTime | string | Yes | Publish time (HH:MM) |
| intervalDays | number | No | Days between publications (for `interval` type) |
| daysOfWeek | array | No | Days of week (for `weekly` type) |
| scenesPerPublish | number | No | Scenes to publish each time |

**Schedule Types:**
- `interval` - Publish every N days
- `weekly` - Publish on specific days of week
- `custom` - Custom schedule (manual dates)

**Success Response (201):**

```json
{
  "scheduleId": "schedule_abc123"
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/publish/api/schedules \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "storyId": "story_abc123",
    "name": "Weekly Release",
    "scheduleType": "weekly",
    "startDate": "2024-01-20T00:00:00.000Z",
    "publishTime": "09:00",
    "daysOfWeek": ["monday"],
    "scenesPerPublish": 1
  }'
```

---

### Get Publishing Schedules

Get all publishing schedules for the authenticated user.

**Endpoint:** `GET /publish/api/schedules`

**Authentication:** Required (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storyId | string | No | Filter by story ID |

**Success Response (200):**

```json
{
  "schedules": [
    {
      "id": "schedule_abc123",
      "name": "Weekly Release Schedule",
      "storyId": "story_abc123",
      "scheduleType": "weekly",
      "startDate": "2024-01-20T00:00:00.000Z",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get Publishing Timeline

Get the timeline of scheduled publications.

**Endpoint:** `GET /publish/api/timeline`

**Authentication:** Required (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| scheduleId | string | Yes | Schedule ID |

**Success Response (200):**

```json
{
  "schedule": {
    "id": "schedule_abc123",
    "name": "Weekly Release Schedule"
  },
  "timeline": [
    {
      "date": "2024-01-22T09:00:00.000Z",
      "sceneIds": ["scene_1", "scene_2"],
      "status": "published"
    },
    {
      "date": "2024-01-29T09:00:00.000Z",
      "sceneIds": ["scene_3", "scene_4"],
      "status": "scheduled"
    }
  ]
}
```

---

### Publish Scene

Publish a specific scene.

**Endpoint:** `POST /api/publish/scenes/[sceneId]`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "success": true,
  "sceneId": "scene_abc123",
  "publishedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### Unpublish Scene

Unpublish a previously published scene.

**Endpoint:** `POST /api/publish/scenes/[sceneId]/unpublish`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "success": true,
  "sceneId": "scene_abc123",
  "unpublishedAt": "2024-01-15T10:35:00.000Z"
}
```

---

### Cron Job for Scheduled Publishing

Automated endpoint for scheduled scene publishing.

**Endpoint:** `POST /api/publish/cron`

**Authentication:** Required (`CRON_SECRET`)

**Description:** Triggered by Vercel Cron to publish scheduled scenes.

---

## Comics APIs

Generate and manage comic panels for stories.

### Get Published Comics

Get list of published comics available to read.

**Endpoint:** `GET /api/comics/published`

**Authentication:** Optional (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| sort | string | No | Sort: `recent`, `popular` |

**Success Response (200):**

```json
{
  "comics": [
    {
      "id": "story_abc123",
      "title": "The Adventure",
      "coverImageUrl": "https://...",
      "author": {
        "id": "user_xyz",
        "name": "John Doe"
      },
      "views": 1250,
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

---

### Generate Panels

Generate comic panels for a scene.

**Endpoint:** `POST /comics/api/generate-panels`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "sceneId": "scene_abc123",
  "stylePreset": "manga"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sceneId | string | Yes | Scene ID |
| stylePreset | string | No | Style: `manga`, `webtoon`, `western` |

**Success Response (200):**

```json
{
  "sceneId": "scene_abc123",
  "panels": [
    {
      "id": "panel_1",
      "imageUrl": "https://blob.vercel-storage.com/...",
      "caption": "Panel caption text...",
      "order": 1
    }
  ],
  "totalPanels": 6
}
```

**Example:**

```bash
curl -X POST http://localhost:3000/comics/api/generate-panels \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "sceneId": "scene_abc123",
    "stylePreset": "manga"
  }'
```

---

### Get Scene Panels

Get existing panels for a scene.

**Endpoint:** `GET /comics/api/[sceneId]/panels`

**Authentication:** Optional (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sceneId | string | Yes | Scene ID |

**Success Response (200):**

```json
{
  "sceneId": "scene_abc123",
  "panels": [
    {
      "id": "panel_1",
      "imageUrl": "https://blob.vercel-storage.com/...",
      "caption": "Panel caption...",
      "order": 1
    }
  ]
}
```

---

### Get Reading History

Get user's comic reading history.

**Endpoint:** `GET /comics/api/history`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "history": [
    {
      "storyId": "story_abc123",
      "storyTitle": "The Adventure",
      "lastReadSceneId": "scene_xyz",
      "lastReadAt": "2024-01-15T10:30:00.000Z",
      "progress": 0.65
    }
  ]
}
```

---

## Novels APIs

Reading interface and history for text-based stories.

### Get Published Novels

Get list of published novels available to read.

**Endpoint:** `GET /novels/api/published`

**Authentication:** Optional (Session)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| genre | string | No | Filter by genre |
| sort | string | No | Sort: `recent`, `popular`, `rating` |
| page | number | No | Page number |
| limit | number | No | Items per page |

**Success Response (200):**

```json
{
  "novels": [
    {
      "id": "story_abc123",
      "title": "The Adventure Begins",
      "summary": "A hero's journey...",
      "genre": "Fantasy",
      "coverImageUrl": "https://...",
      "rating": 4.7,
      "views": 1250,
      "publishedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:3000/novels/api/published?genre=Fantasy&sort=popular&page=1" \
  -H "Accept: application/json"
```

---

### Get Reading History

Get user's novel reading history.

**Endpoint:** `GET /novels/api/history`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "history": [
    {
      "storyId": "story_abc123",
      "storyTitle": "The Adventure",
      "lastReadChapterId": "chapter_5",
      "lastReadAt": "2024-01-15T10:30:00.000Z",
      "progress": 0.45
    }
  ]
}
```

---

### Sync Reading History

Update reading history for a story.

**Endpoint:** `POST /novels/api/history/sync`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "storyId": "story_abc123",
  "chapterId": "chapter_5",
  "sceneId": "scene_20",
  "progress": 0.45
}
```

**Success Response (200):**

```json
{
  "success": true
}
```

---

## Settings APIs

User preferences and API key management.

**Note:** API key management endpoints require `admin:all` scope.

### Get User Settings

Get current user account settings and preferences.

**Endpoint:** `GET /api/settings/user`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "writer",
    "preferences": {
      "theme": "dark",
      "language": "en",
      "emailNotifications": true
    }
  }
}
```

---

### Update User Settings

Update user account settings and preferences.

**Endpoint:** `PUT /api/settings/user`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "name": "John Doe",
  "preferences": {
    "theme": "dark",
    "emailNotifications": false
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "preferences": {
      "theme": "dark",
      "emailNotifications": false
    }
  }
}
```

---

### Get Privacy Settings

Get user privacy settings.

**Endpoint:** `GET /api/settings/privacy`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "privacy": {
    "profileVisibility": "public",
    "showReadingHistory": true,
    "allowAnalytics": true
  }
}
```

---

### Update Privacy Settings

Update user privacy settings.

**Endpoint:** `PUT /api/settings/privacy`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "profileVisibility": "private",
  "showReadingHistory": false
}
```

**Success Response (200):**

```json
{
  "success": true,
  "privacy": {
    "profileVisibility": "private",
    "showReadingHistory": false,
    "allowAnalytics": true
  }
}
```

---

### List API Keys

Get all API keys for the authenticated user.

**Endpoint:** `GET /api/settings/api-keys`

**Authentication:** Required (Session with `admin:all` scope)

**Success Response (200):**

```json
{
  "apiKeys": [
    {
      "id": "key_abc123",
      "name": "Production API Key",
      "scopes": ["stories:read", "stories:write"],
      "lastUsedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "expiresAt": null
    }
  ]
}
```

---

### Create API Key

Create a new API key.

**Endpoint:** `POST /api/settings/api-keys`

**Authentication:** Required (Session with `admin:all` scope)

**Request Body:**

```json
{
  "name": "My API Key",
  "scopes": ["stories:read", "stories:write"],
  "expiresIn": "30d"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | API key name |
| scopes | array | Yes | Permission scopes |
| expiresIn | string | No | Expiration: `30d`, `90d`, `never` |

**Available Scopes:**
- `stories:read` - Read stories
- `stories:write` - Create/edit stories
- `admin:all` - Admin access (requires admin role)

**Success Response (201):**

```json
{
  "apiKey": "sk_live_abc123...",
  "id": "key_abc123",
  "name": "My API Key",
  "scopes": ["stories:read", "stories:write"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "expiresAt": "2024-02-14T10:30:00.000Z"
}
```

**Important:** The full API key is only shown once during creation.

---

### Revoke API Key

Revoke an API key.

**Endpoint:** `POST /api/settings/api-keys/[id]/revoke`

**Authentication:** Required (Session with `admin:all` scope)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | API key ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

## Best Practices

### Analytics Tracking

1. **Track Important Events:** Focus on key user interactions
2. **Include Metadata:** Add device type, source, etc.
3. **Silent Failures:** Analytics should never break user experience
4. **Aggregate Data:** Use daily metrics for long-term analysis

### Community Moderation

1. **Content Validation:** Validate post titles (max 255 chars)
2. **Spam Prevention:** Implement rate limiting
3. **Moderation Status:** All posts start as "approved"
4. **Cache Invalidation:** Invalidate after mutations

### Publishing Schedules

1. **Time Zones:** All times are in UTC
2. **Buffer Time:** Start schedules at least 1 day in future
3. **Scene Batching:** Publish 1-3 scenes at a time
4. **Status Monitoring:** Check schedule status regularly

### API Key Security

1. **Minimum Scopes:** Only grant necessary permissions
2. **Key Rotation:** Rotate keys every 90 days
3. **Secure Storage:** Never commit keys to git
4. **Expiration:** Set expiration for non-production keys

---

## Rate Limits

| Feature | Limit | Time Window |
|---------|-------|-------------|
| Analytics Tracking | Unlimited | - |
| Community Posts | 10 posts | per hour |
| Publishing Schedules | 5 schedules | per day |
| Comic Generation | 10 scenes | per hour |
| API Key Creation | 5 keys | per day |

---

## Related Documentation

- [Studio APIs](./studio.md)
- [Image APIs](./images.md)
- [Authentication APIs](./authentication.md)
- [Analysis System](../analysis/analysis-specification.md)
- [Community System](../community/community-specification.md)
- [Publishing System](../publish/publish-specification.md)
