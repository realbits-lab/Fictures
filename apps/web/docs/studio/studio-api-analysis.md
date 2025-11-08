# Studio API Routes Analysis Report

## Overview

This document provides a comprehensive analysis of all Studio API routes in the Fictures platform, tracking their implementation status, usage locations, and integration points with the frontend application.

## Statistics

- **Total API Route Files**: 49
- **Total Endpoints**: 49+
- **Actively Used**: 22+
- **Defined but Partially Verified**: 12+
- **Legacy APIs Removed**: 2 (generate, generate-stream)

## API Routes by Category

### 1. Agent APIs (1 endpoint)

#### POST `/studio/api/agent`
- **File**: `src/app/studio/api/agent/route.ts` (219 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/hooks/use-studio-agent-chat.ts`
- **Function**: Multi-step reasoning editing agent with tool execution
- **Features**:
  - Streaming text with Gemini 2.0 Flash
  - Multi-step reasoning (maxSteps: 10)
  - CRUD tool integration for story management
  - Tool execution tracking and logging
- **Request Schema**:
  ```typescript
  {
    chatId?: string;
    message: { content: string };
    storyContext?: { storyId?: string };
  }
  ```
- **Response**: Server-sent event stream with chat response

---

### 2. Analyzer APIs (4 endpoints)

These endpoints provide AI-powered analysis and modification of story elements using YAML format.

#### POST `/studio/api/story-analyzer`
- **File**: `src/app/studio/api/story-analyzer/route.ts` (418 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/StoryPromptWriter.tsx` (line 173)
  - `src/components/studio/AIEditor.tsx` (line 37)
- **Function**: Multi-tool story analysis and modification
- **Tools Available**:
  1. `modifyStoryStructure` - Title, genre, plot, themes, word count
  2. `modifyCharacterData` - Add, modify, enhance character information
  3. `modifyPlaceData` - Add, modify, enhance locations and settings
  4. `generateImageDescription` - Generate images using Gemini
- **Request Schema**:
  ```typescript
  {
    storyJson: string;        // Current story data as JSON text
    userRequest: string;      // User's modification request
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    updatedStoryData?: Record<string, unknown>;
    imageDescription?: string;
    responseType: 'json' | 'image' | 'mixed' | 'error';
    toolsUsed: string[];
  }
  ```

#### POST `/studio/api/chapter-analyzer`
- **File**: `src/app/studio/api/chapter-analyzer/route.ts`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/ChapterPromptEditor.tsx` (line 53)
- **Function**: Modify chapter structure based on user requests
- **Format**: YAML input/output with JSON fallback
- **Request Schema**:
  ```typescript
  {
    chapterData: any;    // Current chapter data
    userRequest: string; // User's modification request
  }
  ```
- **Creative Interpretations**:
  - "Add emotional depth" → Enhance character interactions, conflicts
  - "More tension" → Create conflicts, add time pressure
  - "Add dialogue" → Create realistic conversations
  - "Character development" → Add growth moments, revelations
  - "More action" → Add physical confrontations, movement
  - "Better pacing" → Adjust transitions, vary tension

#### POST `/studio/api/scene-analyzer`
- **File**: `src/app/studio/api/scene-analyzer/route.ts` (178 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/ScenePromptEditor.tsx` (line 56)
- **Function**: Modify scene structure based on user requests
- **Format**: YAML input/output with JSON fallback
- **Request Schema**:
  ```typescript
  {
    sceneData: any;      // Current scene data
    userRequest: string; // User's modification request
  }
  ```
- **Creative Interpretations**:
  - "Add emotional depth" → Enhance character emotions, motivations
  - "More dialogue" → Create conversations with subtext
  - "Add action" → Create physical movement, conflicts
  - "More atmosphere" → Add sensory details, mood
  - "Increase tension" → Add conflict elements, time pressure
  - "Character development" → Add growth, revelations
  - "Better pacing" → Adjust flow, vary tension

#### POST `/studio/api/part-analyzer`
- **File**: `src/app/studio/api/part-analyzer/route.ts` (181 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/PartPromptEditor.tsx` (line 64)
- **Function**: Modify story part structure based on user requests
- **Format**: YAML input/output with JSON fallback
- **Request Schema**:
  ```typescript
  {
    partData: any;       // Current part data
    userRequest: string; // User's modification request
  }
  ```
- **Creative Interpretations**:
  - "Add emotional depth" → Enhance character journeys, internal conflicts
  - "More character development" → Add transformation moments, relationship dynamics
  - "Add plot events" → Create specific developments, escalating conflicts
  - "Increase tension" → Add escalating conflicts, higher stakes
  - "Better pacing" → Adjust flow, vary tension, improve progression

---

### 3. Stories APIs (13 endpoints)

#### GET `/studio/api/stories`
- **File**: `src/app/studio/api/stories/route.ts` (311 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/hooks/useStories.ts` (line 48)
  - `src/lib/hooks/use-page-cache.ts`
  - `src/components/studio/UnifiedWritingEditor.tsx` (mutate)
- **Function**: Get user's stories with metadata for dashboard
- **Response Schema**:
  ```typescript
  {
    stories: {
      id: string;
      title: string;
      genre: string;
      parts: { completed: number; total: number };
      chapters: { completed: number; total: number };
      readers: number;
      rating: number;
      status: 'draft' | 'publishing' | 'completed' | 'published';
      firstChapterId: string | null;
    }[];
  }
  ```
- **Scopes Required**: `stories:read`

#### POST `/studio/api/stories`
- **File**: `src/app/studio/api/stories/route.ts`
- **Status**: ⚠️ DEFINED BUT NEEDS VERIFICATION
- **Function**: Create new story
- **Request Schema**:
  ```typescript
  {
    title: string;       // Min 1, max 255 chars
    description?: string;
    genre?: string;
  }
  ```
- **Validation**: Uses Zod schema `createStorySchema`

#### GET `/studio/api/stories/[id]`
- **File**: `src/app/studio/api/stories/[id]/route.ts` (311 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/StoryMetadataEditor.tsx` (line 34)
- **Function**: Get specific story details
- **Response**: Story object with metadata, parts, chapters, characters, settings

#### PUT/PATCH `/studio/api/stories/[id]`
- **File**: `src/app/studio/api/stories/[id]/route.ts`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 1575)
- **Function**: Update story metadata
- **Fields Updatable**: title, description, genre, status, etc.

#### DELETE `/studio/api/stories/[id]`
- **File**: `src/app/studio/api/stories/[id]/route.ts`
- **Status**: ✅ DEFINED
- **Function**: Delete story with cascading deletion

#### PUT `/studio/api/stories/[id]/write`
- **File**: `src/app/studio/api/stories/[id]/write/route.ts` (292 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/StoryPromptWriter.tsx` (line 452)
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 741)
- **Function**: Update story content via AI assistance
- **Request Schema**:
  ```typescript
  {
    userRequest: string;  // User's writing request
  }
  ```

#### PUT `/studio/api/stories/[id]/visibility`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 915)
- **Function**: Toggle story visibility (public/private)
- **Request Schema**:
  ```typescript
  {
    isPublic: boolean;
  }
  ```

#### GET/POST `/studio/api/stories/[id]/read`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/browse/StoryGrid.tsx` (line 343, 447)
  - `src/hooks/useStoryReader.ts` (line 261)
- **Function**: Get story data for reading interface
- **Response**: Complete story structure with chapters, scenes, characters
- **Caching**: Uses ETag-based HTTP caching for optimization

#### GET `/studio/api/stories/[id]/characters`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/SceneDisplay.tsx` (line 79)
  - `src/components/studio/CharactersDisplay.tsx` (line 39)
- **Function**: Get story characters list
- **Response**:
  ```typescript
  {
    characters: {
      id: string;
      name: string;
      role: string;
      description?: string;
      imageUrl?: string;
    }[];
  }
  ```

#### GET `/studio/api/stories/[id]/characters-places`
- **Status**: ⚠️ DEFINED (might duplicate /characters)
- **Function**: Get characters and places combined
- **Note**: Verify if this duplicates `/characters` and `/settings`

#### GET `/studio/api/stories/[id]/settings`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/SceneDisplay.tsx` (line 93)
  - `src/components/studio/SettingsDisplay.tsx` (line 38)
- **Function**: Get story locations/settings
- **Response**:
  ```typescript
  {
    settings: {
      id: string;
      name: string;
      description?: string;
      imageUrl?: string;
    }[];
  }
  ```

#### GET/POST `/studio/api/stories/[id]/comments`
- **File**: `src/app/studio/api/stories/[id]/comments/route.ts` (232 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/novels/CommentSection.tsx`
  - `src/components/novels/CommentForm.tsx` (line 136)
- **Function**: Get and create story comments
- **GET Response**:
  ```typescript
  {
    comments: {
      id: string;
      content: string;
      authorId: string;
      createdAt: string;
    }[];
  }
  ```

#### POST `/studio/api/stories/[id]/like`
- **Status**: ✅ DEFINED
- **Function**: Toggle like on story
- **Request Schema**: `{ liked?: boolean }`

#### GET `/studio/api/stories/[id]/structure`
- **Status**: ✅ DEFINED
- **Function**: Get story structure (parts, chapters, scenes hierarchy)
- **Response**: Hierarchical story structure

#### GET `/studio/api/stories/[id]/download`
- **File**: `src/app/studio/api/stories/[id]/download/route.ts` (587 lines)
- **Status**: ✅ DEFINED
- **Function**: Download story as file (PDF, EPUB, TXT)
- **Features**:
  - File format selection
  - Content formatting
  - Large file support
- **Response**: File download with appropriate MIME type

#### GET `/studio/api/stories/[id]/scenes/[sceneId]`
- **Status**: ✅ DEFINED
- **Function**: Get specific scene data
- **Response**: Scene with content, metadata, images

#### GET `/studio/api/stories/published`
- **Status**: ✅ DEFINED
- **Function**: Get published stories
- **Response**: Array of published stories with metadata

**Note**: The platform uses the unified `/studio/api/generation/*` system with the Adversity-Triumph Engine methodology for all story generation.

---

### 4. Chapters APIs (9 endpoints)

#### GET `/studio/api/chapters`
- **Status**: ✅ DEFINED
- **Function**: Get chapter list

#### POST `/studio/api/chapters`
- **Status**: ✅ DEFINED
- **Function**: Create new chapter

#### GET `/studio/api/chapters/[id]`
- **Status**: ✅ DEFINED
- **Function**: Get chapter details

#### PUT `/studio/api/chapters/[id]`
- **Status**: ✅ DEFINED
- **Function**: Update chapter

#### PUT `/studio/api/chapters/[id]/write`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 718)
- **Function**: Update chapter via AI assistance

#### PUT `/studio/api/chapters/[id]/autosave`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/ChapterEditor.tsx` (line 111)
- **Function**: Auto-save chapter changes

#### POST `/studio/api/chapters/[id]/publish`
- **Status**: ✅ DEFINED
- **Function**: Publish chapter

#### POST `/studio/api/chapters/[id]/unpublish`
- **Status**: ✅ DEFINED
- **Function**: Unpublish chapter

#### POST `/studio/api/chapters/[id]/like`
- **Status**: ✅ DEFINED
- **Function**: Toggle like on chapter

#### GET `/studio/api/chapters/[id]/scenes`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/hooks/useChapterScenes.ts` (line 141)
  - `src/components/novels/ChapterReaderClient.tsx` (line 282)
- **Function**: Get scenes in a chapter
- **Caching**: ETag-based HTTP caching
- **Response**:
  ```typescript
  {
    scenes: {
      id: string;
      title: string;
      content: string;
      orderIndex: number;
      status: string;
      sceneImage?: { url?: string; ... };
    }[];
    metadata: {
      fetchedAt: string;
      chapterId: string;
      totalScenes: number;
    };
  }
  ```

#### POST `/studio/api/chapters/generate`
- **Status**: ✅ DEFINED
- **Function**: Generate chapter content

---

### 5. Parts APIs (4 endpoints)

#### GET `/studio/api/parts`
- **Status**: ✅ DEFINED
- **Function**: Get part list

#### POST `/studio/api/parts`
- **Status**: ✅ DEFINED
- **Function**: Create new part

#### GET/PUT `/studio/api/parts/[id]`
- **Status**: ✅ DEFINED
- **Function**: Get/update part

#### PUT `/studio/api/parts/[id]/write`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 770)
- **Function**: Update part via AI assistance

#### POST `/studio/api/parts/generate`
- **Status**: ✅ DEFINED
- **Function**: Generate part content

---

### 6. Scenes APIs (4 endpoints)

#### GET `/studio/api/scenes`
- **Status**: ✅ DEFINED
- **Function**: Get scene list

#### GET `/studio/api/scenes/[id]`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 695)
- **Function**: Get scene details
- **Response**: 195 lines implementation

#### PUT `/studio/api/scenes/[id]`
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/components/studio/UnifiedWritingEditor.tsx` (line 980)
- **Function**: Update scene
- **Response**: 195 lines implementation

#### POST `/studio/api/scenes/[id]/like`
- **Status**: ✅ DEFINED
- **Function**: Toggle like on scene

#### PUT `/studio/api/scenes/[id]/write`
- **Status**: ✅ DEFINED
- **Function**: Update scene via AI

#### POST `/studio/api/scenes/generate`
- **Status**: ✅ DEFINED
- **Function**: Generate scene content

---

### 7. Generation APIs (8 endpoints - Novel Generation Pipeline)

These endpoints implement the 9-phase Adversity-Triumph Engine novel generation system.

#### POST `/studio/api/generation/story`
- **Phase**: 1 - Story Generation
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts`, `src/lib/studio/agent-generation-tools.ts`
- **Function**: Generate initial story foundation
- **Input**: Story concept, genre, themes

#### POST `/studio/api/generation/characters`
- **Phase**: 2 - Character Generation
- **File**: `src/app/studio/api/generation/characters/route.ts` (201 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 183)
- **Function**: Generate story characters
- **Output**: Character profiles with AI-generated portraits

#### POST `/studio/api/generation/settings`
- **Phase**: 3 - Settings Generation
- **File**: `src/app/studio/api/generation/settings/route.ts` (289 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 242)
- **Function**: Generate story locations/settings
- **Output**: Setting descriptions with environment images

#### POST `/studio/api/generation/parts`
- **Phase**: 4 - Parts Generation
- **File**: `src/app/studio/api/generation/parts/route.ts` (394 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 316)
- **Function**: Generate story parts (structure)
- **Output**: Parts with goals, conflicts, emotional progression

#### POST `/studio/api/generation/chapters`
- **Phase**: 5 - Chapters Generation
- **File**: `src/app/studio/api/generation/chapters/route.ts` (477 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 389)
- **Function**: Generate chapters
- **Output**: Chapter structure with outlines

#### POST `/studio/api/generation/scene-summaries`
- **Phase**: 6 - Scene Summaries Generation
- **File**: `src/app/studio/api/generation/scene-summaries/route.ts` (408 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 456)
- **Function**: Generate scene summaries
- **Output**: Scene outlines with goals

#### POST `/studio/api/generation/scene-content`
- **Phase**: 7 - Scene Content Generation
- **File**: `src/app/studio/api/generation/scene-content/route.ts` (275 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/lib/novels/orchestrator.ts` (line 522)
- **Function**: Generate full scene content
- **Features**:
  - Full narrative prose
  - Dialogue and action
  - Emotional beats
  - Scene formatting with max 3 sentences per paragraph

#### POST `/studio/api/generation/scene-evaluation`
- **Phase**: 8 - Scene Evaluation
- **File**: `src/app/studio/api/generation/scene-evaluation/route.ts` (195 lines)
- **Status**: ✅ ACTIVELY USED
- **Function**: Evaluate scene quality
- **Framework**: Architectonics of Engagement
- **Scoring**: 1-4 scale across 5 categories
  - Plot Development
  - Character Dynamics
  - Pacing & Tension
  - Prose Quality
  - World-Building
- **Passing Score**: 3.0/4.0 ("Effective" level)
- **Max Iterations**: 2 improvement cycles

#### POST `/studio/api/generation/images`
- **Phase**: 9 - Image Generation
- **Status**: ✅ ACTIVELY USED
- **Used In**:
  - `src/app/studio/api/generation/route.ts` (4 calls)
  - `src/lib/novels/orchestrator.ts`
- **Function**: Generate images for story elements
- **Features**:
  - Image generation using Gemini 2.5 Flash
  - Automatic optimization (4 variants per image)
  - AVIF and JPEG formats
  - Mobile 1x and 2x sizes
  - Storage in Vercel Blob

---

### 8. Novels APIs (1 endpoint)

#### POST `/studio/api/generation`
- **File**: `src/app/studio/api/generation/route.ts` (648 lines)
- **Status**: ✅ ACTIVELY USED
- **Used In**: `src/components/stories/CreateStoryForm.tsx` (line 119)
- **Function**: Main entry point for novel generation
- **Features**:
  - Complete 9-phase generation orchestration
  - Streaming progress updates
  - Database persistence
  - Error handling and recovery
  - Image generation integration
- **Request Schema**:
  ```typescript
  {
    concept: string;
    genre: string;
    themes: string[];
    targetWordCount: number;
    tone?: string;
    targetAudience?: string;
  }
  ```
- **Response**: Streaming SSE with generation progress and final story

---

### 9. Evaluation APIs (1 endpoint)

#### POST `/studio/api/evaluate/scene`
- **File**: `src/app/studio/api/evaluate/scene/route.ts` (218 lines)
- **Status**: ✅ DEFINED
- **Function**: Evaluate and improve scene quality
- **Uses**: Architectonics of Engagement framework
- **Request Schema**:
  ```typescript
  {
    content: string;
    metadata?: {
      genre?: string;
      tone?: string;
    };
  }
  ```
- **Response**:
  ```typescript
  {
    score: number;           // 1-4 scale
    categories: {
      plot: number;
      character: number;
      pacing: number;
      prose: number;
      worldBuilding: number;
    };
    feedback: string;
    improvements: string[];
  }
  ```

---

### 10. Analysis/Update APIs (3 endpoints)

#### POST `/studio/api/story-analysis`
- **File**: `src/app/studio/api/story-analysis/route.ts` (292 lines)
- **Status**: ✅ DEFINED
- **Function**: Analyze story data
- **Features**: Complex story analysis logic

#### POST `/studio/api/story-update`
- **File**: `src/app/studio/api/story-update/route.ts` (366 lines)
- **Status**: ✅ DEFINED
- **Function**: Update story with analysis results
- **Features**: Story modification with validation

---

## Integration Points

### Component Usage Map

| Component | APIs Called | Purpose |
|-----------|------------|---------|
| `CreateStoryForm.tsx` | `/novels/generate` | Create new story via generation |
| `StoryPromptWriter.tsx` | `/story-analyzer`, `/stories/[id]/write` | AI-assisted story writing |
| `AIEditor.tsx` | `/story-analyzer` | AI story editing |
| `ChapterPromptEditor.tsx` | `/chapter-analyzer` | AI chapter analysis |
| `ScenePromptEditor.tsx` | `/scene-analyzer` | AI scene analysis |
| `PartPromptEditor.tsx` | `/part-analyzer` | AI part analysis |
| `UnifiedWritingEditor.tsx` | Multiple write APIs | Unified editing interface |
| `ChapterEditor.tsx` | `/chapters/[id]/autosave` | Chapter auto-save |
| `SceneDisplay.tsx` | `/stories/[id]/scenes/[sceneId]`, `/stories/[id]/characters`, `/stories/[id]/settings` | Scene display |
| `CharactersDisplay.tsx` | `/stories/[id]/characters` | Character list |
| `SettingsDisplay.tsx` | `/stories/[id]/settings` | Settings list |
| `StoryMetadataEditor.tsx` | `/stories/[id]` | Story metadata editing |
| `ChapterReaderClient.tsx` | `/chapters/[id]/scenes` | Chapter reading |
| `CommentSection.tsx` | `/stories/[id]/comments` | Comments viewing |
| `CommentForm.tsx` | `/stories/[id]/comments` | Comment creation |
| `StoryGrid.tsx` | `/stories/[id]/read` | Story preview |

### Hook Usage Map

| Hook | APIs Called | Purpose |
|------|------------|---------|
| `useStories.ts` | `GET /studio/api/stories` | Story list management |
| `useChapterScenes.ts` | `GET /studio/api/chapters/[id]/scenes` | Scene fetching with caching |
| `useStoryReader.ts` | `GET /studio/api/stories/[id]/read` | Story reading data |
| `use-studio-agent-chat.ts` | `POST /studio/api/agent` | Agent chat operations |

### Service/Library Usage Map

| Service | APIs Called | Purpose |
|---------|------------|---------|
| `novels/orchestrator.ts` | All `/generation/*` | 9-phase novel generation |

---

## Caching Strategy

### HTTP Caching (ETag)
- **Used In**:
  - `useChapterScenes.ts` - Chapter scenes data
  - `useStoryReader.ts` - Story reading data
- **TTL**: 1 hour
- **Cache Size**: Limited to 50 entries (chapters), 20 entries (stories)

### SWR (Stale-While-Revalidate)
- **Configuration**:
  - `dedupingInterval`: 5-30 minutes
  - `refreshInterval`: 0 (no automatic refresh)
  - `revalidateOnFocus`: false
  - `keepPreviousData`: true
- **Used In**:
  - `useStories.ts` - 5 second dedup
  - `useChapterScenes.ts` - 30 minute dedup
  - `useStoryReader.ts` - 30 minute dedup

---

## Status Classification

### ✅ Actively Used (22+ endpoints)
Routes with confirmed usage in components/hooks:
1. Agent Chat
2. Story/Chapter/Scene/Part Analyzers (4)
3. Story CRUD and extended operations (9)
4. Chapter read/write/autosave (4)
5. Scene get/update (2)
6. Parts write (1)
7. Generation pipeline (8)
8. Novel generation main entry (1)

### ⚠️ Defined but Partially Verified (12+ endpoints)
Routes with implementation but limited usage evidence:
1. Story Like/Structure/Download/Published
2. Chapter Like/Publish/Unpublish/Generate
3. Scene Like/Write/Generate
4. Parts CRUD/generate
5. Story Analysis/Update APIs
6. Scene Evaluation API

### ⚠️ Review Needed (1 endpoint)
Routes that may need review:
1. Characters-Places (possible duplicate - may overlap with /characters and /settings endpoints)

### ✅ Legacy APIs Removed (2025-11-01)
Superseded by `/studio/api/generation/*` with Adversity-Triumph Engine:
1. ~~Story Generate (legacy HNS)~~ - **REMOVED**
2. ~~Story Generate Stream (legacy HNS)~~ - **REMOVED**

---

## Performance Notes

### Large File Operations
- **Story Download** (587 lines): Complex file generation and export
- **Novel Generate** (648 lines): Heavy multi-phase orchestration
- **Generation Chapters** (477 lines): Complex narrative generation

### Streaming Operations
- **Agent Chat**: Server-sent events with multi-step reasoning
- **Novel Generate**: Progressive SSE updates for long-running operation
- **Story Analyzer**: Tool-based streaming with multiple tool calls

### Database Operations
- **Read**: GET endpoints with ETag caching
- **Write**: PUT/POST endpoints with immediate cache invalidation
- **Delete**: Cascading deletions for story hierarchy

---

## Recommendations

### High Priority
1. ~~**Verify Legacy Endpoints**~~: ✅ **COMPLETED** - Legacy HNS generation endpoints removed (2025-11-01)
2. **Document Missing Endpoints**: Add JSDoc comments to all route handlers
3. **Consolidate Duplicates**: Review `/characters-places` for duplication with `/characters` and `/settings`
4. **Error Handling**: Standardize error responses across all endpoints

### Medium Priority
1. **Add Request Validation**: Implement consistent request schema validation
2. **Rate Limiting**: Add rate limiting to prevent abuse
3. **API Documentation**: Create OpenAPI/Swagger documentation
4. **Monitoring**: Add request logging and performance metrics

### Low Priority
1. **Deprecation**: Mark legacy endpoints for deprecation
2. **Optimization**: Review slow endpoints for performance improvements
3. **Testing**: Add comprehensive API tests
4. **Caching**: Optimize cache TTL values based on usage patterns

---

## Related Documentation

- [Novel Generation System](../novels/novels-development.md)
- [Image Generation & Optimization](../image/image-architecture.mdx)
- [Scene Quality Evaluation](../novels/novels-specification.mdx)
- [Caching Strategy](../caching-strategy.md)

