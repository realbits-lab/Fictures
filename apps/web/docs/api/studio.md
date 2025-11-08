# Studio APIs

Story creation, editing, and management endpoints for the Studio workspace.

## Overview

The Studio APIs provide comprehensive functionality for writers to:
1. **Story Management**: Create, read, update, delete stories
2. **Chapter Management**: Organize and edit chapters
3. **Scene Management**: Write and edit individual scenes
4. **AI Generation**: Generate story content using AI
5. **Scene Evaluation**: Assess and improve scene quality

**Base Path:** `/studio/api/*`

**Authentication:** Required (Session or API key with `stories:write` scope)

---

## Story Management

### List User Stories

Get all stories for the authenticated user with detailed dashboard data.

**Endpoint:** `GET /studio/api/stories`

**Authentication:** Required (API Key with `stories:read` OR Session)

**Query Parameters:** None

**Success Response (200):**

```json
{
  "stories": [
    {
      "id": "story_abc123",
      "title": "The Adventure Begins",
      "summary": "A hero's journey...",
      "genre": "Fantasy",
      "parts": {
        "completed": 2,
        "total": 3
      },
      "chapters": {
        "completed": 15,
        "total": 20
      },
      "readers": 1250,
      "rating": 4.7,
      "status": "publishing",
      "firstChapterId": "chapter_xyz",
      "isPublic": false,
      "imageUrl": "https://blob.vercel-storage.com/...",
      "imageVariants": { /* optimized variants */ }
    }
  ],
  "metadata": {
    "fetchedAt": "2024-01-15T10:30:00.000Z",
    "userId": "user_abc",
    "totalStories": 5,
    "lastUpdated": "2024-01-15T10:30:00.000Z"
  }
}
```

**Caching:**
- Redis cache: 15 minutes (private)
- ETag support for efficient updates
- Cache invalidated on story modifications

**Example:**

```bash
curl -X GET http://localhost:3000/studio/api/stories \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

### Create New Story

Create a new empty story.

**Endpoint:** `POST /studio/api/stories`

**Authentication:** Required (API Key with `stories:write` OR Session)

**Request Body:**

```json
{
  "title": "My New Story",
  "summary": "An exciting adventure...",
  "genre": "Science Fiction"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Story title (1-255 characters) |
| summary | string | No | Story summary/description |
| genre | string | No | Story genre |

**Success Response (201):**

```json
{
  "story": {
    "id": "story_abc123",
    "title": "My New Story",
    "summary": "An exciting adventure...",
    "genre": "Science Fiction",
    "authorId": "user_xyz",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Cache Invalidation:** Automatically invalidates user's story list cache

**Example:**

```bash
curl -X POST http://localhost:3000/studio/api/stories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "title": "My New Story",
    "summary": "An exciting adventure...",
    "genre": "Science Fiction"
  }'
```

---

### Get Story Details

Get detailed information about a specific story including chapters.

**Endpoint:** `GET /studio/api/stories/[id]`

**Authentication:** Required (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Story ID |

**Success Response (200):**

```json
{
  "story": {
    "id": "story_abc123",
    "title": "The Adventure Begins",
    "summary": "A hero's journey...",
    "genre": "Fantasy",
    "status": "publishing",
    "authorId": "user_xyz",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "chapters": [
    {
      "id": "chapter_xyz",
      "title": "Chapter 1: The Beginning",
      "chapterNumber": 1,
      "storyId": "story_abc123",
      "status": "completed"
    }
  ]
}
```

**Example:**

```bash
curl -X GET http://localhost:3000/studio/api/stories/story_abc123 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

---

### Update Story

Update story metadata and settings.

**Endpoint:** `PATCH /studio/api/stories/[id]`

**Authentication:** Required (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Story ID |

**Request Body:**

```json
{
  "title": "Updated Title",
  "summary": "Updated summary...",
  "genre": "Fantasy",
  "status": "published",
  "isPublic": true,
  "coverImage": "https://blob.vercel-storage.com/..."
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Story title (1-255 characters) |
| summary | string | No | Story summary |
| genre | string | No | Story genre |
| status | string | No | Status: `writing` or `published` |
| isPublic | boolean | No | Public visibility |
| coverImage | string | No | Cover image URL |

**Success Response (200):**

```json
{
  "story": {
    "id": "story_abc123",
    "title": "Updated Title",
    "summary": "Updated summary...",
    "status": "published",
    "isPublic": true,
    "updatedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Example:**

```bash
curl -X PATCH http://localhost:3000/studio/api/stories/story_abc123 \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "title": "Updated Title",
    "status": "published"
  }'
```

---

### Delete Story

Delete a story and all associated data (cascading deletion).

**Endpoint:** `DELETE /studio/api/stories/[id]`

**Authentication:** Required (Session)

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Story ID |

**What Gets Deleted:**

1. **Database Records:**
   - Story metadata
   - All parts
   - All chapters
   - All scenes
   - All characters
   - All settings
   - Community posts and replies
   - Analytics data

2. **Blob Storage:**
   - Story cover images
   - Scene images
   - Character portraits
   - Setting images
   - All optimized variants

**Success Response (200):**

```json
{
  "message": "Story deleted successfully",
  "deleted": {
    "story": 1,
    "parts": 3,
    "chapters": 15,
    "scenes": 45,
    "characters": 10,
    "places": 5,
    "communityPosts": 20,
    "images": 87
  }
}
```

**Example:**

```bash
curl -X DELETE http://localhost:3000/studio/api/stories/story_abc123 \
  -H "Cookie: next-auth.session-token=YOUR_SESSION"
```

---

## AI Generation APIs

### Generate Novel (Complete Story)

Generate a complete novel using the Adversity-Triumph Engine.

**Endpoint:** `POST /studio/api/generation`

**Authentication:** Required (API Key with `stories:write` OR Session)

**Content-Type:** `text/event-stream` (Server-Sent Events)

**Request Body:**

```json
{
  "title": "The Hero's Journey",
  "genre": "Fantasy",
  "moral": "courage",
  "setting": "Medieval fantasy world",
  "numParts": 1,
  "numChaptersPerPart": 3,
  "numScenesPerChapter": 5
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | string | Yes | - | Story title |
| genre | string | No | Fantasy | Story genre |
| moral | string | No | courage | Moral framework |
| setting | string | No | - | Story setting description |
| numParts | number | No | 1 | Number of parts |
| numChaptersPerPart | number | No | 3 | Chapters per part |
| numScenesPerChapter | number | No | 5 | Scenes per chapter |

**SSE Event Stream:**

```
event: progress
data: {"phase":"summary","progress":10,"message":"Generating story summary..."}

event: progress
data: {"phase":"characters","progress":20,"message":"Creating characters..."}

event: complete
data: {"storyId":"story_abc123","message":"Novel generation complete"}

event: error
data: {"error":"Generation failed","details":"..."}
```

**Generation Phases:**
1. Story Summary (10%)
2. Characters (20%)
3. Settings (30%)
4. Parts (40%)
5. Chapters (50%)
6. Scene Summaries (60%)
7. Scene Content (70%)
8. Scene Evaluation (85%)
9. Images (100%)

**Estimated Time:** 5-25 minutes depending on size

**Example:**

```bash
curl -X POST http://localhost:3000/studio/api/generation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "title": "The Hero'\''s Journey",
    "genre": "Fantasy",
    "numParts": 1,
    "numChaptersPerPart": 3,
    "numScenesPerChapter": 5
  }'
```

---

### Generate Story Images

Generate images for story, characters, settings, or scenes.

**Endpoint:** `POST /studio/api/generation/images`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "storyId": "story_abc123",
  "targets": [
    {
      "type": "story",
      "id": "story_abc123"
    },
    {
      "type": "scene",
      "id": "scene_xyz789"
    }
  ]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| storyId | string | Yes | Story ID |
| targets | array | Yes | Array of image generation targets |
| targets[].type | string | Yes | Type: `story`, `character`, `setting`, `scene` |
| targets[].id | string | Yes | Target entity ID |

**Success Response (200):**

```json
{
  "results": [
    {
      "type": "story",
      "id": "story_abc123",
      "imageUrl": "https://blob.vercel-storage.com/...",
      "variants": { /* 4 optimized variants */ }
    },
    {
      "type": "scene",
      "id": "scene_xyz789",
      "imageUrl": "https://blob.vercel-storage.com/...",
      "variants": { /* 4 optimized variants */ }
    }
  ]
}
```

---

### Evaluate Scene Quality

Assess scene quality using the "Architectonics of Engagement" framework.

**Endpoint:** `POST /studio/api/evaluate/scene`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "sceneId": "scene_abc123",
  "content": "Scene content to evaluate..."
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sceneId | string | Yes | Scene ID |
| content | string | Yes | Scene content to evaluate |

**Success Response (200):**

```json
{
  "overallScore": 3.4,
  "passed": true,
  "categories": {
    "plot": {
      "score": 3,
      "feedback": "Scene advances plot effectively..."
    },
    "character": {
      "score": 4,
      "feedback": "Strong character development..."
    },
    "pacing": {
      "score": 3,
      "feedback": "Good pacing with tension..."
    },
    "prose": {
      "score": 4,
      "feedback": "Vivid descriptions and dialogue..."
    },
    "worldBuilding": {
      "score": 3,
      "feedback": "Setting details well integrated..."
    }
  },
  "recommendations": [
    "Consider adding more sensory details",
    "Strengthen the scene's conflict"
  ]
}
```

**Scoring:**
- 1: Weak
- 2: Developing
- 3: Effective (passing)
- 4: Strong

**Passing Threshold:** 3.0/4.0

---

## Chapter Management

### Get Chapter Details

Get detailed information about a specific chapter.

**Endpoint:** `GET /studio/api/chapters/[id]`

**Authentication:** Required (Session)

**Success Response (200):**

```json
{
  "chapter": {
    "id": "chapter_abc123",
    "title": "Chapter 1: The Beginning",
    "chapterNumber": 1,
    "storyId": "story_xyz",
    "content": "Chapter content...",
    "status": "completed",
    "sceneCount": 5
  }
}
```

### Update Chapter

Update chapter metadata and content.

**Endpoint:** `PATCH /studio/api/chapters/[id]`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "title": "Updated Chapter Title",
  "content": "Updated content..."
}
```

### Generate Chapter

Generate AI content for a chapter.

**Endpoint:** `POST /studio/api/chapters/generate`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "storyId": "story_abc123",
  "chapterNumber": 1,
  "prompt": "Generate chapter about..."
}
```

---

## Scene Management

### Create Scene

Create a new scene in a chapter.

**Endpoint:** `POST /studio/api/scenes`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "chapterId": "chapter_abc123",
  "title": "Scene Title",
  "content": "Scene content...",
  "sceneNumber": 1
}
```

### Update Scene

Update scene content and metadata.

**Endpoint:** `PATCH /studio/api/scenes/[id]`

**Authentication:** Required (Session)

**Request Body:**

```json
{
  "title": "Updated Scene Title",
  "content": "Updated scene content..."
}
```

### Delete Scene

Delete a specific scene.

**Endpoint:** `DELETE /studio/api/scenes/[id]`

**Authentication:** Required (Session)

---

## Best Practices

### Story Creation Workflow

1. **Create Story**: POST `/studio/api/stories`
2. **Generate Novel**: POST `/studio/api/generation` (optional)
3. **Edit Content**: PATCH `/studio/api/chapters/[id]` or `/studio/api/scenes/[id]`
4. **Evaluate Quality**: POST `/studio/api/evaluate/scene`
5. **Generate Images**: POST `/studio/api/generation/images`
6. **Publish**: PATCH `/studio/api/stories/[id]` with `status: "published"`

### Performance Optimization

1. **Use ETags**: Check `If-None-Match` header for efficient caching
2. **Cache Stories**: Story lists cached 15 minutes in Redis
3. **Batch Operations**: Generate images for multiple targets in one request
4. **SSE Streaming**: Use Server-Sent Events for long-running operations

### Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error type",
  "message": "Human-readable message",
  "details": "Additional details"
}
```

---

## Rate Limits

| Operation | Limit | Time Window |
|-----------|-------|-------------|
| Story Creation | 10 requests | per hour |
| Novel Generation | 3 requests | per hour |
| Scene Evaluation | 50 requests | per hour |
| Image Generation | 20 requests | per hour |
| Other Operations | 120 requests | per minute |

---

## Related Documentation

- [Novel Generation System](../novels/novels-specification.md)
- [Scene Quality Evaluation](../scene/scene-quality-pipeline.md)
- [Image Generation](../image/image-generation.md)
- [Authentication](./authentication.md)
