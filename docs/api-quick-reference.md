# API Routes Quick Reference

## Summary Statistics

- **Total Routes**: 76
- **Working Routes**: 14 (18%)
- **Unused Routes**: 25 (33%)
- **Missing Routes**: 21 (27%)

## Critical Issues

### 🔴 CRITICAL: Story Editing Broken
The main writing editor (UnifiedWritingEditor.tsx) calls these non-existent endpoints:
- `/studio/api/stories/{id}/write` - Cannot save story edits
- `/studio/api/chapters/{id}/write` - Cannot save chapter edits
- `/studio/api/scenes/{id}` - Cannot save scene edits
- `/studio/api/parts/{id}/write` - Cannot save part edits

### 🔴 CRITICAL: Path Prefix Mismatch
Components call `/studio/api/*` and `/publish/api/*` but routes are at `/api/*`

## Working APIs (Use These)

```
✅ GET  /api/stats                              - User statistics
✅ GET  /api/chapters/[id]/scenes               - List chapter scenes
✅ GET  /api/scenes/[id]/view                   - Record scene view
✅ POST /api/scenes/[id]/comic/generate         - Generate comic
✅ POST /api/scenes/[id]/comic/publish          - Publish comic
✅ POST /api/scenes/[id]/comic/unpublish        - Unpublish comic
✅ GET  /api/community/posts                    - List posts
✅ POST /api/community/posts                    - Create post
✅ GET  /api/community/events                   - Event stream (SSE)
✅ POST /api/comments/[commentId]/like          - Like comment
✅ POST /api/comic/generate-panels              - Generate panels
✅ POST /api/generate-image                     - Generate image
✅ POST /api/upload/image                       - Upload image
✅ POST /api/studio/agent                       - Agent chat
```

## Missing but Called (Fix These First)

```
❌ GET  /studio/api/stories                     - List user stories
❌ POST /studio/api/novels/generate             - Generate novel
❌ POST /studio/api/story-analyzer              - Analyze story
❌ POST /studio/api/chapter-analyzer            - Analyze chapter
❌ POST /studio/api/part-analyzer               - Analyze part
❌ POST /studio/api/scene-analyzer              - Analyze scene
❌ PATCH /studio/api/stories/{id}/write         - Save story
❌ PATCH /studio/api/chapters/{id}/write        - Save chapter
❌ PATCH /studio/api/scenes/{id}                - Save scene
❌ PATCH /studio/api/parts/{id}/write           - Save part
❌ GET  /comics/api/history                     - Reading history
❌ GET  /novels/api/history                     - Reading history
❌ POST /publish/api/schedules                  - Schedule publish
❌ POST /publish/api/scenes/{id}                - Publish scene
❌ POST /publish/api/chapters/{id}              - Publish chapter
❌ PUT  /settings/api/user                      - Update settings
```

## Completely Unused (Can Remove)

```
❌ /api/admin/database
❌ /api/ai/chat
❌ /api/ai/generate
❌ /api/ai/analyze
❌ /api/ai/suggestions
❌ /api/auth/change-password
❌ /api/cache/clear
❌ /api/chapters/[id]/autosave
❌ /api/chapters/[id]/like
❌ /api/chapters/[id]/publish
❌ /api/chapters/[id]/unpublish
❌ /api/chapters/generate
❌ /api/featured-story
❌ /api/images/generate
❌ /api/parts/generate
❌ /api/scenes/[id]/dislike
❌ /api/scenes/generate
❌ /api/search
❌ /api/users/[userId]/role
❌ /api/validation
❌ /api/validation/dialogue-formatter
❌ /api/community/posts/[postId]/replies
❌ /api/community/stories/[storyId]
```

## API Path Conventions Problem

### Current Situation
- Routes defined at: `/api/*`
- Components call: `/studio/api/*`, `/publish/api/*`, `/writing/api/*`
- Hooks call: `/studio/api/*`

### Solution Needed
Choose one convention:
1. **Option A**: Move all routes to `/studio/api/*`, `/publish/api/*`, etc.
2. **Option B**: Update all components to call `/api/*`

**Recommendation**: Option B is simpler. Update components to remove prefixes.

## Files That Need Route Fixes

**High Priority (Critical Features)**:
- `src/components/writing/UnifiedWritingEditor.tsx` - 8 missing routes
- `src/hooks/useStories.ts` - 1 missing route
- `src/components/stories/CreateStoryForm.tsx` - 1 missing route

**Medium Priority (Feature Features)**:
- `src/components/publish/QuickActions.tsx` - 6 missing routes
- `src/components/publish/ScheduleBuilder.tsx` - 1 missing route
- `src/components/browse/StoryGrid.tsx` - 2 missing routes

**Low Priority (Secondary Features)**:
- `src/components/writing/*Editor.tsx` - 4 analyzer endpoints
- `src/components/settings/ThemeSelector.tsx` - 1 missing route

## Recommended Fix Order

1. **FIRST**: Standardize API paths - decide on convention
2. **SECOND**: Create missing `/api/*` routes or redirect old paths
3. **THIRD**: Update all components to use consistent paths
4. **FOURTH**: Remove unused routes to clean up
5. **FIFTH**: Add tests for all working routes

## See Also

- Full analysis: `/docs/api-usage-analysis.md`
- API Routes: `/src/app/api/`
- Components calling APIs: `/src/components/`
- Hooks using APIs: `/src/hooks/`

