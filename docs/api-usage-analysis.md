# API Routes Usage Analysis Report
## Fictures Project

**Date**: 2025-11-01
**Repository**: @dev.realbits/Fictures
**Analysis Scope**: All API route handlers in `src/app/api/` and their usage across the application

---

## Executive Summary

This report analyzes the **76 API route handlers** defined in `src/app/api/` and identifies:

1. **Working/Used APIs**: 20+ endpoints actively called from components and hooks
2. **Orphaned/Unused APIs**: 30+ endpoint handlers with no identified callers
3. **Mismatched Routes**: 25+ components calling endpoints that don't exist in the codebase

---

## Part 1: API Routes Organized by Category

### 1. **STORIES API** (9 routes)
```
/api/stories/                          [GET, POST]      - List/create stories
/api/stories/generate                  [POST]           - Generate story (HNS)
/api/stories/generate-stream           [POST]           - Streaming story generation
/api/stories/published                 [GET]            - List published stories
/api/stories/[id]/                     [GET, PUT, DELETE] - Get/update/delete story
/api/stories/[id]/write                [PATCH]          - Update story HNS data
/api/stories/[id]/read                 [GET]            - Get story for reading
/api/stories/[id]/visibility           [PATCH]          - Update visibility (private/public)
/api/stories/[id]/like                 [POST]           - Toggle like on story
/api/stories/[id]/comments             [GET]            - List story comments
/api/stories/[id]/characters           [GET]            - Get story characters
/api/stories/[id]/characters-places    [GET]            - Get characters and places
/api/stories/[id]/download             [GET]            - Download story
/api/stories/[id]/scene-stats          [GET]            - Get scene statistics
/api/stories/[id]/settings             [PATCH]          - Update story settings
/api/stories/[id]/structure            [GET]            - Get story structure
/api/stories/[id]/scenes/[sceneId]     [GET]            - Get specific scene
```

**Status**: PARTIALLY USED
- ✅ Used in components/hooks: `/api/stories/[id]/comments` (CommentForm)
- ❌ Missing implementations called from components:
  - `/studio/api/stories` (useStories.ts calls `/studio/api/stories`)
  - `/studio/api/stories/drafts` (use-page-cache.ts)
  - `/studio/api/stories/{id}/write` (UnifiedWritingEditor.tsx)

---

### 2. **CHAPTERS API** (8 routes)
```
/api/chapters/                         [GET, POST]      - List/create chapters
/api/chapters/generate                 [POST]           - Generate chapter
/api/chapters/[id]/                    [GET, PATCH, DELETE] - CRUD operations
/api/chapters/[id]/write               [PATCH]          - Update chapter HNS data
/api/chapters/[id]/autosave            [PATCH]          - Auto-save chapter
/api/chapters/[id]/like                [POST]           - Toggle like
/api/chapters/[id]/publish             [POST]           - Publish chapter
/api/chapters/[id]/unpublish           [POST]           - Unpublish chapter
/api/chapters/[id]/scenes              [GET]            - List chapter scenes
```

**Status**: PARTIALLY USED
- ✅ Route exists at `/api/chapters/[id]/scenes` (called from useChapterScenes.ts)
- ❌ Missing implementations:
  - `/studio/api/chapters/{id}/write` (UnifiedWritingEditor.tsx)
  - `/studio/api/chapters/{id}/scenes` (called but route is at `/api/chapters/[id]/scenes`)

---

### 3. **SCENES API** (9 routes)
```
/api/scenes/                           [GET, POST]      - List/create scenes
/api/scenes/generate                   [POST]           - Generate scene
/api/scenes/[id]/                      [PATCH]          - Update scene
/api/scenes/[id]/write                 [PATCH]          - Update scene content
/api/scenes/[id]/view                  [GET]            - View scene (analytics)
/api/scenes/[id]/like                  [POST]           - Toggle like
/api/scenes/[id]/dislike               [POST]           - Toggle dislike
/api/scenes/[id]/comic/generate        [POST]           - Generate comic panels
/api/scenes/[id]/comic/publish         [POST]           - Publish comic
/api/scenes/[id]/comic/unpublish       [POST]           - Unpublish comic
```

**Status**: MOSTLY USED
- ✅ Used in components:
  - Comic endpoints (comic-status-card.tsx)
  - View endpoint (useSceneView.ts)
- ❌ Missing implementations:
  - `/studio/api/scenes/{id}` (UnifiedWritingEditor.tsx)

---

### 4. **PARTS API** (4 routes)
```
/api/parts/                            [GET, POST]      - List/create parts
/api/parts/generate                    [POST]           - Generate part
/api/parts/[id]/                       [GET, PATCH, DELETE] - CRUD operations
/api/parts/[id]/write                  [PATCH]          - Update part HNS data
```

**Status**: UNUSED in components
- ❌ Missing implementation: `/studio/api/parts/{id}/write` (UnifiedWritingEditor.tsx)

---

### 5. **COMMENTS API** (4 routes)
```
/api/comments/[[...comment]]/          [GET, POST]      - List/create comments
/api/comments/[commentId]/             [PATCH, DELETE]  - Update/delete comment
/api/comments/[commentId]/like         [POST]           - Like comment
/api/comments/[commentId]/dislike      [POST]           - Dislike comment
```

**Status**: PARTIALLY USED
- ✅ Used in components:
  - Like endpoint (LikeButton.tsx calls `/api/comments/{id}/like`)
  - Comment creation (CommentForm.tsx calls `/studio/api/stories/{id}/comments`)
- ⚠️ Path mismatch: Component calls `/studio/api/` prefix but route is at `/api/`

---

### 6. **COMMUNITY API** (6 routes)
```
/api/community/posts/                  [GET, POST]      - List/create posts
/api/community/posts/[postId]/         [GET, PATCH, DELETE] - CRUD operations
/api/community/posts/[postId]/view     [GET]            - View analytics
/api/community/posts/[postId]/like     [POST]           - Like post
/api/community/posts/[postId]/replies  [GET]            - List replies
/api/community/events                  [GET/SSE]        - Event streaming
/api/community/stories/[storyId]/      [GET]            - Get community story
/api/community/stories/[storyId]/posts [GET]            - List story posts
```

**Status**: USED
- ✅ EventSource usage in use-community-events.ts
- ✅ Post creation in CreatePostForm.tsx
- ✅ Post deletion in CommunityPostsList.tsx

---

### 7. **COMIC API** (2 routes)
```
/comics/api/generate-panels            [POST]           - Generate comic panels
/comics/api/[sceneId]/panels           [GET]            - Get comic panels
```

**Status**: USED
- ✅ Referenced in comic-panel-generator-button.tsx
- ✅ Referenced in comic-viewer.tsx
- ✅ Referenced in ImageContentDisplay.tsx

---

### 8. **AUTHENTICATION API** (3 routes)
```
/api/auth/[...nextauth]                [GET, POST]      - NextAuth handler
/api/auth/register                     [POST]           - User registration
/api/auth/change-password              [POST]           - Change password
```

**Status**: Used by NextAuth system

---

### 9. **IMAGE & UPLOAD API** (2 routes)
```
/api/generate-image                    [POST]           - Generate AI image
/api/images/generate                   [POST]           - Generate images
/api/upload/image                      [POST]           - Upload image
```

**Status**: USED
- ✅ Referenced in StoryPromptWriter.tsx
- ✅ Referenced in upload.ts utility

---

### 10. **STUDIO AI API** (1 route)
```
/api/studio/agent                      [POST, GET]      - Studio agent chat
```

**Status**: USED
- ✅ Referenced in use-studio-agent-chat.ts

---

### 11. **UTILITY APIs** (5 routes)
```
/api/stats                             [GET]            - Get user statistics
/api/search                            [GET]            - Search stories
/api/validation                        [GET]            - Validation endpoint
/api/validation/dialogue-formatter     [POST]           - Format dialogue
/api/cache/clear                       [POST]           - Clear cache
```

**Status**: USED
- ✅ `/api/stats` used in useStats.ts

---

### 12. **ADMIN API** (1 route)
```
/api/admin/database                    [GET]            - Database info
```

**Status**: UNKNOWN (Admin-only)

---

### 13. **AI ENDPOINTS** (4 routes)
```
/api/ai/chat                           [POST]           - Chat endpoint
/api/ai/generate                       [POST]           - Generate content
/api/ai/analyze                        [POST]           - Analyze content
/api/ai/suggestions                    [POST]           - Get suggestions
```

**Status**: UNKNOWN (May be deprecated)

---

### 14. **USER API** (1 route)
```
/api/users/[userId]/role               [PATCH]          - Update user role
```

**Status**: UNKNOWN

---

### 15. **FEATURED STORY API** (1 route)
```
/api/featured-story                    [GET]            - Get featured story
```

**Status**: UNKNOWN

---

## Part 2: Missing Route Implementations

### Critical: Routes Called but Don't Exist

The following endpoints are **actively called from components/hooks** but **have NO route implementation**:

#### Studio Analyzer APIs (5 endpoints)
```
Called from: components/writing/*.tsx
❌ /studio/api/story-analyzer          (StoryPromptWriter, AIEditor)
❌ /studio/api/chapter-analyzer        (ChapterPromptEditor)
❌ /studio/api/part-analyzer           (PartPromptEditor)
❌ /studio/api/scene-analyzer          (ScenePromptEditor)
❌ /studio/api/novels/generate         (CreateStoryForm)
```

**Impact**: CRITICAL - UI components are calling these but will receive 404 errors

#### Studio Data APIs (5 endpoints)
```
Called from: components/writing/UnifiedWritingEditor.tsx, hooks/useStories.ts
❌ /studio/api/stories                 (useStories.ts line 48)
❌ /studio/api/stories/drafts          (use-page-cache.ts)
❌ /studio/api/stories/{id}/write      (UnifiedWritingEditor.tsx)
❌ /studio/api/chapters/{id}/write     (UnifiedWritingEditor.tsx)
❌ /studio/api/chapters/{id}/scenes    (UnifiedWritingEditor.tsx)
❌ /studio/api/parts/{id}/write        (UnifiedWritingEditor.tsx)
❌ /studio/api/scenes/{id}             (UnifiedWritingEditor.tsx)
```

**Impact**: CRITICAL - Writing editor cannot save changes

#### History & Reading APIs (2 endpoints)
```
Called from: components/browse/StoryGrid.tsx
❌ /{pageType}/api/history             (StoryGrid - comics/api/history, novels/api/history)
```

**Impact**: HIGH - Reading history tracking doesn't work

#### Publish/Settings APIs (8 endpoints)
```
Called from: components/publish/QuickActions.tsx, components/settings/ThemeSelector.tsx, ScheduleBuilder.tsx
❌ /publish/api/schedules              (ScheduleBuilder)
❌ /publish/api/scenes/{id}            (QuickActions)
❌ /publish/api/chapters/{id}          (QuickActions)
❌ /publish/api/scenes/{id}/unpublish  (QuickActions)
❌ /publish/api/chapters/{id}/unpublish (QuickActions)
❌ /publish/api/scenes/{id}/visibility (QuickActions)
❌ /publish/api/chapters/{id}/visibility (QuickActions)
❌ /settings/api/user                  (ThemeSelector)
```

**Impact**: HIGH - Publishing and settings features won't work

#### Community APIs (3 endpoints)
```
Called from: components/browse/StoryGrid.tsx, other components
❌ /community/api/stats                
❌ /community/api/stories              
❌ /novels/api/published               
❌ /novels/api/stories/featured        
```

---

## Part 3: Actual Usage Map

### Where APIs Are Actually Called

#### **useStories.ts** (Custom Hook)
```typescript
Line 48: fetch('/studio/api/stories')  ❌ DOESN'T EXIST
Expected: /api/stories
```
**Usage**: Fetching user's stories list in Studio

#### **useStats.ts** (Custom Hook)
```typescript
Line 35: fetch('/api/stats')  ✅ EXISTS
```
**Usage**: Getting user statistics (word count, readers, etc.)

#### **useStoryReader.ts** (Custom Hook)
```typescript
Line 84: fetch('/studio/api/stories/{storyId}/read')  ❌ DOESN'T EXIST
Expected: /api/stories/{id}/read
```
**Usage**: Fetching story for reading interface

#### **useSceneView.ts** (Custom Hook)
```typescript
Line 34: fetch('/api/scenes/{sceneId}/view')  ✅ EXISTS
```
**Usage**: Recording scene views (analytics)

#### **useChapterScenes.ts** (Custom Hook)
```typescript
Line 34: fetch('/studio/api/chapters/{chapterId}/scenes')  ⚠️ PARTIALLY EXISTS
Actual route: /api/chapters/{id}/scenes
```
**Usage**: Loading scenes for chapter reader

#### **use-studio-agent-chat.ts** (Custom Hook)
```typescript
Line 22: api: '/api/studio/agent'  ✅ EXISTS
Line 49: fetch('/api/studio/agent/{currentChatId}/messages')  ⚠️ AMBIGUOUS
```
**Usage**: Studio AI assistant chat interface

#### **CommentForm.tsx** (Component)
```typescript
Line 52: fetch('/studio/api/stories/{storyId}/comments')  ❌ DOESN'T EXIST
Expected: /api/stories/{id}/comments or /api/comments
```
**Usage**: Creating comments on stories

#### **LikeButton.tsx** (Component)
```typescript
Line 35: fetch('/writing/api/stories/{entityId}/like')  ❌ DOESN'T EXIST
Line 38: fetch('/writing/api/chapters/{entityId}/like')  ❌ DOESN'T EXIST
Line 41: fetch('/writing/api/scenes/{entityId}/like')  ❌ DOESN'T EXIST
Line 44: fetch('/api/comments/{entityId}/like')  ✅ EXISTS
```
**Usage**: Liking stories, chapters, scenes, and comments

#### **UnifiedWritingEditor.tsx** (Component)
```typescript
Line 695: fetch('/studio/api/scenes/{sceneId}', PATCH)  ❌ DOESN'T EXIST
Line 718: fetch('/studio/api/chapters/{chapterId}/write', PATCH)  ❌ DOESN'T EXIST
Line 741: fetch('/studio/api/stories/{story.id}/write', PATCH)  ❌ DOESN'T EXIST
Line 770: fetch('/studio/api/parts/{partId}/write', PATCH)  ❌ DOESN'T EXIST
Line 866: fetch('/studio/api/chapters/{chapterId}/{endpoint}', PATCH)  ❌ DOESN'T EXIST
Line 915: fetch('/studio/api/stories/{story.id}/visibility', PATCH)  ❌ DOESN'T EXIST
Line 980: fetch('/studio/api/scenes/{sceneId}', PATCH)  ❌ DOESN'T EXIST
Line 1575: fetch('/studio/api/stories/{story.id}', DELETE)  ❌ DOESN'T EXIST
```
**Usage**: Saving all story/chapter/scene/part edits

#### **StoryGrid.tsx** (Component)
```typescript
Line 76: fetch('/{pageType}/api/history')  ❌ DOESN'T EXIST
Line 113: fetch('/{pageType}/api/history', POST)  ❌ DOESN'T EXIST
```
**Usage**: Reading history tracking (comics/api/history, novels/api/history)

#### **CreateStoryForm.tsx** (Component)
```typescript
Line 120: fetch('/studio/api/novels/generate', POST)  ❌ DOESN'T EXIST
```
**Usage**: Creating new story via novel generation

#### **StoryPromptWriter.tsx** (Component)
```typescript
Line 78: fetch('/studio/api/story-analyzer', POST)  ❌ DOESN'T EXIST
Line 174: fetch('/api/generate-image', POST)  ✅ EXISTS
Line 453: fetch('/studio/api/story-analyzer', PATCH)  ❌ DOESN'T EXIST
```
**Usage**: Story analysis and image generation

#### **AIEditor.tsx** (Component)
```typescript
Line 38: fetch('/studio/api/story-analyzer', POST)  ❌ DOESN'T EXIST
```
**Usage**: Story analysis

#### **ChapterPromptEditor.tsx** (Component)
```typescript
Line 54: fetch('/studio/api/chapter-analyzer', POST)  ❌ DOESN'T EXIST
```
**Usage**: Chapter analysis

#### **PartPromptEditor.tsx** (Component)
```typescript
Line 65: fetch('/studio/api/part-analyzer', POST)  ❌ DOESN'T EXIST
```
**Usage**: Part analysis

#### **ScenePromptEditor.tsx** (Component)
```typescript
Line 57: fetch('/studio/api/scene-analyzer', POST)  ❌ DOESN'T EXIST
```
**Usage**: Scene analysis

#### **ComicStatusCard.tsx** (Component)
```typescript
Line 50: fetch('/api/scenes/{sceneId}/comic/publish', POST)  ✅ EXISTS
Line 79: fetch('/api/scenes/{sceneId}/comic/unpublish', POST)  ✅ EXISTS
Line 108: fetch('/api/scenes/{sceneId}/comic/generate', POST)  ✅ EXISTS
```
**Usage**: Managing comic panel generation and publishing

#### **CreatePostForm.tsx** (Component)
```typescript
Line 63: fetch('/api/community/posts', POST)  ✅ EXISTS
```
**Usage**: Creating community posts

#### **CommunityPostsList.tsx** (Component)
```typescript
Line 90: fetch('/api/community/posts/{postId}', DELETE)  ✅ EXISTS
```
**Usage**: Deleting community posts

#### **QuickActions.tsx** (Component)
```typescript
Line 33: fetch('/publish/api/scenes/{sceneId}', POST)  ❌ DOESN'T EXIST
Line 33: fetch('/publish/api/chapters/{chapterId}', POST)  ❌ DOESN'T EXIST
Line 63: fetch('/publish/api/scenes/{sceneId}/unpublish', POST)  ❌ DOESN'T EXIST
Line 63: fetch('/publish/api/chapters/{chapterId}/unpublish', POST)  ❌ DOESN'T EXIST
Line 89: fetch('/publish/api/scenes/{sceneId}/visibility', PATCH)  ❌ DOESN'T EXIST
Line 89: fetch('/publish/api/chapters/{chapterId}/visibility', PATCH)  ❌ DOESN'T EXIST
```
**Usage**: Publishing chapters/scenes and setting visibility

#### **ScheduleBuilder.tsx** (Component)
```typescript
Line 78: fetch('/publish/api/schedules', POST)  ❌ DOESN'T EXIST
```
**Usage**: Scheduling content publication

#### **ThemeSelector.tsx** (Component)
```typescript
Line 259: fetch('/settings/api/user', PUT)  ❌ DOESN'T EXIST
```
**Usage**: Updating user settings

#### **use-community-events.ts** (Hook)
```typescript
EventSource('/api/community/events')  ✅ EXISTS
```
**Usage**: Real-time community events

#### **upload.ts** (Utility)
```typescript
Line: fetch('/api/upload/image', POST)  ✅ EXISTS
```
**Usage**: Image upload utility

#### **comic-panel-generator-button.tsx** (Component)
```typescript
fetch('/comics/api/generate-panels', POST)  ✅ EXISTS
```
**Usage**: Generating comic panels

#### **comic-viewer.tsx** (Component)
```typescript
fetch('/comics/api/{sceneId}/panels')  ✅ EXISTS
```
**Usage**: Fetching comic panels for display

#### **ImageContentDisplay.tsx** (Component)
```typescript
fetch('/comics/api/{itemId}/panels')  ✅ EXISTS
```
**Usage**: Loading comic panel images

---

## Part 4: Summary Tables

### Completely Unused/Orphaned API Routes

These routes have **no callers** in components or hooks:

```
❌ /api/admin/database
❌ /api/ai/analyze
❌ /api/ai/chat
❌ /api/ai/generate
❌ /api/ai/suggestions
❌ /api/auth/change-password
❌ /api/cache/clear
❌ /api/chapters/[id]/autosave
❌ /api/chapters/[id]/like
❌ /api/chapters/[id]/publish
❌ /api/chapters/[id]/unpublish
❌ /api/chapters/generate
❌ /api/community/posts/[postId]/replies
❌ /api/community/stories/[storyId]/posts
❌ /api/community/stories/[storyId]
❌ /api/featured-story
❌ /api/images/generate
❌ /api/parts/generate
❌ /api/scenes/[id]/dislike
❌ /api/scenes/generate
❌ /api/search
❌ /api/users/[userId]/role
❌ /api/validation
❌ /api/validation/dialogue-formatter
```

**Total Unused**: 25 routes (33% of all routes)

---

### Working/Used API Routes

These routes **have implementations AND active callers**:

```
✅ /api/chapters/[id]/scenes               (useChapterScenes.ts)
✅ /api/comments/[commentId]/like          (LikeButton.tsx)
✅ /comics/api/generate-panels             (comic-panel-generator-button.tsx)
✅ /comics/api/[sceneId]/panels            (comic-viewer.tsx, ImageContentDisplay.tsx)
✅ /api/community/events                   (use-community-events.ts - SSE)
✅ /api/community/posts                    (CreatePostForm.tsx, CommunityPostsList.tsx)
✅ /api/community/posts/[postId]           (CommunityPostsList.tsx)
✅ /api/generate-image                     (StoryPromptWriter.tsx)
✅ /api/scenes/[id]/comic/generate         (ComicStatusCard.tsx)
✅ /api/scenes/[id]/comic/publish          (ComicStatusCard.tsx)
✅ /api/scenes/[id]/comic/unpublish        (ComicStatusCard.tsx)
✅ /api/scenes/[id]/view                   (useSceneView.ts)
✅ /api/stats                              (useStats.ts)
✅ /api/studio/agent                       (use-studio-agent-chat.ts)
✅ /api/upload/image                       (upload.ts utility)
```

**Total Working**: 14 routes (18% of all routes)

---

### Routes Called but Missing

These endpoints **are actively called from components** but **have NO implementation**:

```
🔴 /studio/api/chapter-analyzer            (ChapterPromptEditor.tsx)
🔴 /studio/api/novels/generate             (CreateStoryForm.tsx)
🔴 /studio/api/part-analyzer               (PartPromptEditor.tsx)
🔴 /studio/api/scene-analyzer              (ScenePromptEditor.tsx)
🔴 /studio/api/story-analyzer              (StoryPromptWriter.tsx, AIEditor.tsx)
🔴 /studio/api/stories                     (useStories.ts)
🔴 /studio/api/stories/drafts              (use-page-cache.ts)
🔴 /studio/api/stories/{id}/write          (UnifiedWritingEditor.tsx)
🔴 /studio/api/chapters/{id}/write         (UnifiedWritingEditor.tsx)
🔴 /studio/api/chapters/{id}/scenes        (UnifiedWritingEditor.tsx)
🔴 /studio/api/parts/{id}/write            (UnifiedWritingEditor.tsx)
🔴 /studio/api/scenes/{id}                 (UnifiedWritingEditor.tsx)
🔴 /publish/api/schedules                  (ScheduleBuilder.tsx)
🔴 /publish/api/scenes/{id}                (QuickActions.tsx)
🔴 /publish/api/chapters/{id}              (QuickActions.tsx)
🔴 /publish/api/scenes/{id}/unpublish      (QuickActions.tsx)
🔴 /publish/api/chapters/{id}/unpublish    (QuickActions.tsx)
🔴 /publish/api/scenes/{id}/visibility     (QuickActions.tsx)
🔴 /publish/api/chapters/{id}/visibility   (QuickActions.tsx)
🔴 /settings/api/user                      (ThemeSelector.tsx)
🔴 /{pageType}/api/history                 (StoryGrid.tsx)
```

**Total Missing**: 21 routes/endpoints (27% of all API calls)

---

## Part 5: Issues and Recommendations

### Critical Issues

**Issue 1: API Path Prefix Mismatch**
- Components call `/studio/api/*` and `/publish/api/*` routes
- But API route files are in `/api/` directory
- Routes need to either:
  - Be moved to match called paths, OR
  - Components need to be updated to call correct paths

**Issue 2: Missing Story Management APIs**
- UnifiedWritingEditor.tsx (main editor) calls 7+ endpoints that don't exist
- These are essential for writing functionality
- **Impact**: Users cannot save their story edits

**Issue 3: Missing Analyzer APIs** 
- Story/Chapter/Part/Scene analyzer endpoints called but never implemented
- These appear to be AI analysis features
- **Impact**: Analysis features will 404

**Issue 4: Missing History Tracking**
- Reading history is called with dynamic paths (`/{pageType}/api/history`)
- Routes don't exist at `/comics/api/history` or `/novels/api/history`
- **Impact**: Reading history doesn't work

---

### Recommendations

#### Priority 1: Create Missing Route Implementations
1. Create `/api/studio/api/*` routes OR update components to use `/api/*` prefix
2. Implement missing analyzer endpoints
3. Implement history tracking endpoints
4. Implement publish API endpoints

#### Priority 2: Standardize API Path Conventions
- Decide on single convention: `/api/*` vs `/studio/api/*` vs `/publish/api/*`
- Update all route files to match
- Update all component callers to match

#### Priority 3: Document API Contracts
- Create API documentation showing request/response formats
- Document which endpoints require authentication
- Document rate limits and error codes

#### Priority 4: Clean Up Unused Routes
- Review and remove the 25 unused route handlers
- Reduces bundle size and maintenance burden
- Clarifies what's actually implemented

#### Priority 5: Add API Testing
- Create E2E tests for all active API routes
- Test error paths and edge cases
- Ensure consistency between API and component expectations

---

## Part 6: Route-by-Route Status Table

| Route | Type | Exists | Called | Status |
|-------|------|--------|--------|--------|
| `/api/stories/` | GET,POST | ✅ | ❌ | Unused |
| `/api/stories/generate` | POST | ✅ | ❌ | Unused |
| `/api/stories/generate-stream` | POST | ✅ | ❌ | Unused |
| `/api/stories/published` | GET | ✅ | ❌ | Unused |
| `/api/stories/[id]/` | GET,PUT,DELETE | ✅ | ❌ | Unused |
| `/api/stories/[id]/write` | PATCH | ✅ | ❌ | Unused |
| `/api/stories/[id]/read` | GET | ✅ | ✅ | Called but from wrong path |
| `/api/stories/[id]/visibility` | PATCH | ✅ | ❌ | Unused |
| `/api/stories/[id]/like` | POST | ✅ | ⚠️  | Called from wrong path |
| `/api/stories/[id]/comments` | GET | ✅ | ⚠️  | Called from wrong path |
| `/api/chapters/[id]/scenes` | GET | ✅ | ✅ | **WORKING** |
| `/api/scenes/[id]/view` | GET | ✅ | ✅ | **WORKING** |
| `/api/scenes/[id]/comic/generate` | POST | ✅ | ✅ | **WORKING** |
| `/api/scenes/[id]/comic/publish` | POST | ✅ | ✅ | **WORKING** |
| `/api/scenes/[id]/comic/unpublish` | POST | ✅ | ✅ | **WORKING** |
| `/api/community/posts` | GET,POST | ✅ | ✅ | **WORKING** |
| `/api/community/events` | GET/SSE | ✅ | ✅ | **WORKING** |
| `/api/comments/[id]/like` | POST | ✅ | ✅ | **WORKING** |
| `/api/stats` | GET | ✅ | ✅ | **WORKING** |
| `/api/studio/agent` | POST,GET | ✅ | ✅ | **WORKING** |
| `/api/generate-image` | POST | ✅ | ✅ | **WORKING** |
| `/api/upload/image` | POST | ✅ | ✅ | **WORKING** |
| `/studio/api/stories` | N/A | ❌ | ✅ | **MISSING** |
| `/studio/api/stories/drafts` | N/A | ❌ | ✅ | **MISSING** |
| `/studio/api/stories/{id}/write` | N/A | ❌ | ✅ | **CRITICAL MISSING** |
| `/studio/api/chapters/{id}/write` | N/A | ❌ | ✅ | **CRITICAL MISSING** |
| `/studio/api/scenes/{id}` | N/A | ❌ | ✅ | **CRITICAL MISSING** |
| `/studio/api/story-analyzer` | N/A | ❌ | ✅ | **MISSING** |
| `/studio/api/chapter-analyzer` | N/A | ❌ | ✅ | **MISSING** |
| `/studio/api/part-analyzer` | N/A | ❌ | ✅ | **MISSING** |
| `/studio/api/scene-analyzer` | N/A | ❌ | ✅ | **MISSING** |
| `/publish/api/*` | Various | ❌ | ✅ | **MISSING** |
| `/comics/api/history` | GET,POST | ❌ | ✅ | **MISSING** |
| `/novels/api/history` | GET,POST | ❌ | ✅ | **MISSING** |

---

## Conclusion

The Fictures API has a significant **mismatch between defined routes and active usage**:

- **14 routes** (18%) are working properly
- **25 routes** (33%) are completely unused
- **21 endpoints** (27%) are actively called but don't exist
- **16 routes** (21%) have unclear or unknown status

**Key problems to solve**:
1. API path naming convention inconsistency
2. Critical missing endpoints for story editing
3. Analyzer features not implemented
4. History tracking endpoints missing

This creates a **broken user experience** where key features like story editing don't work.

