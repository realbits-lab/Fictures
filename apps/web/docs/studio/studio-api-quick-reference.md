# Studio API Quick Reference

## API Endpoint Summary

### Actively Used Endpoints (22+)

| Category | Endpoint | Method | Status |
|----------|----------|--------|--------|
| **Agent** | `/agent` | POST | ✅ Used |
| **Analyzers** | `/story-analyzer` | POST | ✅ Used |
| | `/chapter-analyzer` | POST | ✅ Used |
| | `/scene-analyzer` | POST | ✅ Used |
| | `/part-analyzer` | POST | ✅ Used |
| **Stories** | `/stories` | GET/POST | ✅ Used |
| | `/stories/[id]` | GET/PUT/DELETE | ✅ Used |
| | `/stories/[id]/write` | PUT | ✅ Used |
| | `/stories/[id]/visibility` | PUT | ✅ Used |
| | `/stories/[id]/read` | GET/POST | ✅ Used |
| | `/stories/[id]/characters` | GET | ✅ Used |
| | `/stories/[id]/settings` | GET | ✅ Used |
| | `/stories/[id]/comments` | GET/POST | ✅ Used |
| **Chapters** | `/chapters/[id]/write` | PUT | ✅ Used |
| | `/chapters/[id]/autosave` | PUT | ✅ Used |
| | `/chapters/[id]/scenes` | GET | ✅ Used |
| **Scenes** | `/scenes/[id]` | GET/PUT | ✅ Used |
| **Parts** | `/parts/[id]/write` | PUT | ✅ Used |
| **Generation** | `/generation/story-summary` | POST | ✅ Used |
| | `/generation/characters` | POST | ✅ Used |
| | `/generation/settings` | POST | ✅ Used |
| | `/generation/parts` | POST | ✅ Used |
| | `/generation/chapters` | POST | ✅ Used |
| | `/generation/scene-summaries` | POST | ✅ Used |
| | `/generation/scene-content` | POST | ✅ Used |
| | `/generation/scene-evaluation` | POST | ✅ Used |
| | `/generation/images` | POST | ✅ Used |
| **Novels** | `/novels/generate` | POST | ✅ Used |

### Defined but Partially Used (12+)

| Category | Endpoint | Status | Note |
|----------|----------|--------|------|
| **Stories** | `/stories/[id]/like` | ⚠️ Defined | Verify usage |
| | `/stories/[id]/structure` | ⚠️ Defined | Verify usage |
| | `/stories/[id]/download` | ⚠️ Defined | 587 lines |
| | `/stories/[id]/characters-places` | ⚠️ Defined | Might duplicate |
| | `/stories/published` | ⚠️ Defined | Verify usage |
| **Chapters** | `/chapters` | ⚠️ Defined | CRUD endpoints |
| | `/chapters/[id]/publish` | ⚠️ Defined | Verify usage |
| | `/chapters/[id]/unpublish` | ⚠️ Defined | Verify usage |
| | `/chapters/[id]/like` | ⚠️ Defined | Verify usage |
| **Parts** | All CRUD | ⚠️ Defined | Verify usage |
| **Scenes** | All CRUD | ⚠️ Defined | Verify usage |
| **Evaluation** | `/evaluate/scene` | ⚠️ Defined | Quality check |
| **Analysis** | `/story-analysis` | ⚠️ Defined | Verify usage |
| | `/story-update` | ⚠️ Defined | Verify usage |

### Review Needed (1)

| Endpoint | Status | Note |
|----------|--------|------|
| `/stories/[id]/characters-places` | ⚠️ Review | Might duplicate `/characters` + `/settings` |

### Legacy APIs Removed (2025-11-01)

| Endpoint | Status | Replacement |
|----------|--------|-------------|
| ~~`/stories/generate`~~ | ✅ Removed | Use `/generation/*` system |
| ~~`/stories/generate-stream`~~ | ✅ Removed | Use `/generation/*` system |

---

## Component Usage Map

### Writing Components
- **CreateStoryForm.tsx** → `/novels/generate`
- **StoryPromptWriter.tsx** → `/story-analyzer`, `/stories/[id]/write`
- **AIEditor.tsx** → `/story-analyzer`
- **ChapterPromptEditor.tsx** → `/chapter-analyzer`
- **ScenePromptEditor.tsx** → `/scene-analyzer`
- **PartPromptEditor.tsx** → `/part-analyzer`
- **UnifiedWritingEditor.tsx** → Multiple write APIs
- **ChapterEditor.tsx** → `/chapters/[id]/autosave`
- **StoryMetadataEditor.tsx** → `/stories/[id]`

### Reading Components
- **ChapterReaderClient.tsx** → `/chapters/[id]/scenes`
- **CommentSection.tsx** → `/stories/[id]/comments`
- **CommentForm.tsx** → `/stories/[id]/comments`

### Display Components
- **SceneDisplay.tsx** → `/stories/[id]/scenes/[sceneId]`, `/stories/[id]/characters`, `/stories/[id]/settings`
- **CharactersDisplay.tsx** → `/stories/[id]/characters`
- **SettingsDisplay.tsx** → `/stories/[id]/settings`
- **StoryGrid.tsx** → `/stories/[id]/read`

### Hooks
- **useStories.ts** → `GET /studio/api/stories`
- **useChapterScenes.ts** → `GET /studio/api/chapters/[id]/scenes`
- **useStoryReader.ts** → `GET /studio/api/stories/[id]/read`
- **use-studio-agent-chat.ts** → `POST /studio/api/agent`

### Services
- **novels/orchestrator.ts** → All `/generation/*` endpoints

---

## Novel Generation Pipeline (9 Phases)

```
1. Story Summary      → /generation/story-summary
                         ↓
2. Characters         → /generation/characters
                         ↓
3. Settings           → /generation/settings
                         ↓
4. Parts              → /generation/parts
                         ↓
5. Chapters           → /generation/chapters
                         ↓
6. Scene Summaries    → /generation/scene-summaries
                         ↓
7. Scene Content      → /generation/scene-content
                         ↓
8. Scene Evaluation   → /generation/scene-evaluation
                         ↓
9. Images             → /generation/images
```

**Entry Point**: `POST /studio/api/novels/generate`

---

## Analyzer Creative Interpretations

### Story Analyzer
- "Complete story data" → Fill all empty fields
- "Add characters" → Add character details
- "Add locations" → Add setting descriptions
- "Generate images" → Create visual content

### Chapter Analyzer
- "Add emotional depth" → Enhance character interactions
- "More tension" → Create conflicts, add pressure
- "Add dialogue" → Create conversations
- "Character development" → Add growth moments
- "More action" → Add confrontations
- "Better pacing" → Adjust transitions

### Scene Analyzer
- "Add emotional depth" → Enhance emotions, motivations
- "More dialogue" → Create conversations with subtext
- "Add action" → Create movement, conflicts
- "More atmosphere" → Add sensory details
- "Increase tension" → Add conflict elements
- "Better pacing" → Adjust flow

### Part Analyzer
- "Add emotional depth" → Enhance character journeys
- "Add character development" → Add transformation moments
- "Add plot events" → Create escalating conflicts
- "Increase tension" → Add higher stakes
- "Better pacing" → Improve progression

---

## Request/Response Formats

### Story Analyzer Request
```json
{
  "storyJson": "JSON string of current story",
  "userRequest": "What changes user wants"
}
```

### Story Analyzer Response
```json
{
  "success": true,
  "updatedStoryData": { /* updated story */ },
  "responseType": "json|image|mixed|error",
  "toolsUsed": ["tool names"]
}
```

### YAML Analyzer Request
```json
{
  "chapterData": { /* or sceneData or partData */ },
  "userRequest": "Modification request"
}
```

### YAML Analyzer Response
```yaml
success: true
updatedChapterData:
  # Modified data structure
```

### Novel Generation Request
```json
{
  "concept": "Story idea",
  "genre": "Genre",
  "themes": ["theme1", "theme2"],
  "targetWordCount": 50000,
  "tone": "epic",
  "targetAudience": "young adults"
}
```

### Chapter Scenes Response
```json
{
  "scenes": [
    {
      "id": "scene_id",
      "title": "Scene Title",
      "content": "Scene text",
      "orderIndex": 1,
      "status": "published",
      "sceneImage": {
        "url": "image_url",
        "prompt": "generation prompt"
      }
    }
  ],
  "metadata": {
    "fetchedAt": "ISO date",
    "chapterId": "chapter_id",
    "totalScenes": 5
  }
}
```

---

## Caching Strategy

### HTTP Caching (ETag)
- **Used By**: `useChapterScenes`, `useStoryReader`
- **TTL**: 1 hour
- **Max Cache Size**: 50 (chapters), 20 (stories)

### SWR Configuration
- **useStories**: 5 second dedup
- **useChapterScenes**: 30 minute dedup
- **useStoryReader**: 30 minute dedup
- **revalidateOnFocus**: false
- **keepPreviousData**: true

---

## File Sizes (Implementation Complexity)

| Endpoint | Size | Complexity |
|----------|------|------------|
| `/novels/generate` | 648 lines | Very High |
| `/generation/chapters` | 477 lines | High |
| `/generation/parts` | 394 lines | High |
| `/generation/scene-summaries` | 408 lines | High |
| `/story-analyzer` | 418 lines | High |
| `/generation/scene-content` | 275 lines | Medium |
| `/stories/[id]/download` | 587 lines | High |
| `/generation/settings` | 289 lines | Medium |
| `/stories/[id]/write` | 292 lines | Medium |
| `/story-analysis` | 292 lines | Medium |
| `/story-update` | 366 lines | Medium |
| `/stories/[id]/comments` | 232 lines | Medium |
| `/agent` | 219 lines | High |
| `/evaluate/scene` | 218 lines | Medium |
| `/generation/characters` | 201 lines | Medium |
| `/generation/scene-evaluation` | 195 lines | Medium |
| `/scenes/[id]` | 195 lines | Medium |
| `/stories/[id]` | 311 lines | Medium |
| `/chapters` | Variable | Medium |
| Analyzers | Simple | Low |

---

## Dependencies & Integrations

### AI Models Used
- **Gemini 2.0 Flash** (Multi-step reasoning, 10 steps max)
- **Gemini 2.5 Flash** (Text generation, image generation)
- **Gemini 2.5 Flash Lite** (Cost optimization)
- **Gateway**: Vercel AI SDK for API management

### Database Operations
- **Drizzle ORM**: All DB operations via `src/lib/db/queries`
- **PostgreSQL**: Neon database
- **Cascading Deletes**: Story → Parts → Chapters → Scenes

### Storage
- **Vercel Blob**: Generated images storage
- **Image Variants**: 4 per image (AVIF, JPEG × mobile 1x/2x)

### Authentication
- **NextAuth.js**: Session management
- **Scopes**: `stories:read` required for GET `/stories`

---

## Performance Tips

### Caching
1. Use SWR with dedup intervals to prevent redundant requests
2. Leverage ETag caching for read-heavy endpoints
3. Keep `keepPreviousData: true` for better UX

### Generation
1. Novel generation is I/O heavy (5-25 minutes)
2. Use streaming responses to show progress
3. Implement timeout handling for long operations

### API Calls
1. Batch related requests when possible
2. Use `mutate()` to invalidate cache after writes
3. Implement optimistic updates for better UX

---

## Known Issues & TODOs

### High Priority
- [ ] Verify legacy `/stories/generate` endpoints
- [ ] Verify `/stories/[id]/characters-places` for duplication
- [ ] Add consistent error handling
- [ ] Document all request/response schemas

### Medium Priority
- [ ] Add JSDoc comments to all routes
- [ ] Implement request validation middleware
- [ ] Add rate limiting
- [ ] Create OpenAPI documentation

### Low Priority
- [ ] Add request logging/metrics
- [ ] Optimize slow endpoints
- [ ] Add comprehensive API tests
- [ ] Consider deprecation strategy

---

## Related Documents

- [Full Analysis](./studio-api-analysis.md)
- [Novel Generation](../novels/novels-development.md)
- [Caching Strategy](../caching-strategy.md)
- [Image System](../image/image-architecture.mdx)

