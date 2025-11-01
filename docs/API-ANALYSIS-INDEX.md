# API Routes Analysis - Complete Index

**Analysis Date**: 2025-11-01  
**Repository**: https://github.com/realbits-lab/Fictures  
**Analysis Scope**: All 76 API route handlers and their usage across the codebase

---

## 📊 Analysis Documents

### 1. **Comprehensive Analysis** (700 lines)
**File**: `docs/api-usage-analysis.md`

Complete deep-dive analysis including:
- All 76 API routes organized by category (Stories, Chapters, Scenes, etc.)
- Detailed usage map showing where each API is called
- Route-by-route status table
- Critical issues and recommendations
- Data on working (14), unused (25), and missing (21) routes

**Start here if you need**: Full understanding of the API ecosystem

---

### 2. **Quick Reference Guide**
**File**: `docs/api-quick-reference.md`

Quick lookup tables including:
- Summary statistics
- List of working APIs
- List of missing but called APIs
- List of completely unused APIs
- API path convention problems
- Files that need fixes with priority levels

**Start here if you need**: Quick answers about specific APIs

---

## 🚨 Critical Issues Found

### Issue #1: Story Editing is Broken ⚠️ CRITICAL
The main writing editor (`UnifiedWritingEditor.tsx`) calls these non-existent endpoints:
- `/studio/api/stories/{id}/write`
- `/studio/api/chapters/{id}/write`
- `/studio/api/scenes/{id}`
- `/studio/api/parts/{id}/write`

**Impact**: Users cannot save story edits

---

### Issue #2: API Path Prefix Mismatch
Routes are defined at `/api/*` but components call `/studio/api/*`, `/publish/api/*`, `/writing/api/*`

**Impact**: 21+ features are broken due to 404 errors

---

### Issue #3: Missing Feature APIs
Multiple analyzer and publishing endpoints are called but don't exist:
- Story analyzer API
- Chapter analyzer API  
- Part analyzer API
- Scene analyzer API
- Publishing/scheduling APIs
- Reading history APIs
- Settings APIs

**Impact**: Analysis features, publishing workflow, history tracking all broken

---

## 📈 Statistics

```
Total Routes:                76
├─ Working/Properly Used:   14 (18%)
├─ Completely Unused:       25 (33%)
├─ Called but Missing:      21 (27%)
└─ Unknown/Unclear:         16 (21%)
```

---

## ✅ Working APIs (14 routes)

These are confirmed working and actively used:

```
✅ /api/stats
✅ /api/chapters/[id]/scenes
✅ /api/scenes/[id]/view
✅ /api/scenes/[id]/comic/*
✅ /api/community/posts
✅ /api/community/events
✅ /api/comments/[id]/like
✅ /api/comic/generate-panels
✅ /api/generate-image
✅ /api/upload/image
✅ /api/studio/agent
```

**Use these when implementing new features!**

---

## ❌ Unused Routes (25 routes)

These routes have **no callers** and can be safely removed:

```
❌ /api/admin/database
❌ /api/ai/* (all 4 endpoints)
❌ /api/auth/change-password
❌ /api/cache/clear
❌ /api/chapters/[id]/autosave
❌ /api/chapters/[id]/like
❌ /api/chapters/[id]/publish
❌ /api/chapters/[id]/unpublish
❌ /api/chapters/generate
... and 16 more
```

**Recommendation**: Remove these to reduce code maintenance burden

---

## 🔴 Critical Missing Routes (21 routes)

These are **actively called from UI** but **don't exist**:

### Saving Content (Story Editor Broken!)
```
❌ /studio/api/stories/{id}/write
❌ /studio/api/chapters/{id}/write
❌ /studio/api/scenes/{id}
❌ /studio/api/parts/{id}/write
```

### Fetching Stories
```
❌ /studio/api/stories
❌ /studio/api/stories/drafts
```

### Analysis Features
```
❌ /studio/api/story-analyzer
❌ /studio/api/chapter-analyzer
❌ /studio/api/part-analyzer
❌ /studio/api/scene-analyzer
❌ /studio/api/novels/generate
```

### Publishing
```
❌ /publish/api/schedules
❌ /publish/api/scenes/{id}
❌ /publish/api/chapters/{id}
❌ /publish/api/scenes/{id}/unpublish
❌ /publish/api/chapters/{id}/unpublish
❌ /publish/api/scenes/{id}/visibility
❌ /publish/api/chapters/{id}/visibility
```

### Reading & Settings
```
❌ /comics/api/history
❌ /novels/api/history
❌ /settings/api/user
```

---

## 🔧 Files That Need Fixes

### High Priority (Story Editing Broken!)
| File | Issue | Count |
|------|-------|-------|
| `src/components/writing/UnifiedWritingEditor.tsx` | Cannot save story/chapter/scene/part | 8 endpoints |
| `src/hooks/useStories.ts` | Cannot fetch user's stories | 1 endpoint |
| `src/components/stories/CreateStoryForm.tsx` | Cannot create new stories | 1 endpoint |

### Medium Priority (Feature Broken)
| File | Issue | Count |
|------|-------|-------|
| `src/components/publish/QuickActions.tsx` | Cannot publish/unpublish | 6 endpoints |
| `src/components/publish/ScheduleBuilder.tsx` | Cannot schedule publication | 1 endpoint |
| `src/components/browse/StoryGrid.tsx` | Reading history doesn't work | 2 endpoints |

### Low Priority (Secondary Features)
| File | Issue | Count |
|------|-------|-------|
| `src/components/writing/StoryPromptWriter.tsx` | Analyzer missing | 2 endpoints |
| `src/components/writing/AIEditor.tsx` | Analyzer missing | 1 endpoint |
| `src/components/writing/ChapterPromptEditor.tsx` | Analyzer missing | 1 endpoint |
| `src/components/writing/PartPromptEditor.tsx` | Analyzer missing | 1 endpoint |
| `src/components/writing/ScenePromptEditor.tsx` | Analyzer missing | 1 endpoint |
| `src/components/settings/ThemeSelector.tsx` | Cannot save settings | 1 endpoint |

---

## 📋 Recommended Fix Order

### Phase 1: Stabilize (1 week)
1. **Decide on API path convention**
   - Option A: Move routes to `/studio/api/*`, `/publish/api/*`
   - Option B: Update components to use `/api/*` only
   - **Recommendation**: Option B (simpler)

2. **Create critical missing routes**
   - Story save/write endpoints
   - Story listing endpoints
   - These unlock the main writing editor

3. **Fix UnifiedWritingEditor.tsx**
   - Update all fetch calls to use correct API paths
   - Test story save functionality

### Phase 2: Complete (2-3 weeks)
4. **Create remaining missing routes**
   - All analyzer endpoints
   - Publishing endpoints
   - History tracking endpoints
   - Settings endpoints

5. **Update all components**
   - Standardize API paths across codebase
   - Test all features

6. **Add test coverage**
   - E2E tests for all API routes
   - Unit tests for critical paths

### Phase 3: Cleanup (1 week)
7. **Remove unused routes** (25 endpoints)
8. **Create API documentation**
9. **Set up API testing suite**

---

## 🔍 How to Use This Analysis

### I want to...

**...understand the full API ecosystem**
→ Read `api-usage-analysis.md` (Comprehensive Analysis)

**...quickly look up an API**
→ Check `api-quick-reference.md` (Quick Reference)

**...fix the story editing bug**
→ Look at High Priority section above
→ Then read `UnifiedWritingEditor.tsx` lines 695-1575

**...implement a new feature**
→ Check "Working APIs" section
→ Only use confirmed working endpoints
→ Document why for future developers

**...remove unused code**
→ See "Unused Routes (25)" section
→ These can all be safely deleted

**...understand the path mismatch**
→ See "API Path Convention Problem" section in quick reference

---

## 📚 Related Files

**API Implementation**:
- `/src/app/api/` - All API route handlers

**Components Using APIs**:
- `/src/components/writing/UnifiedWritingEditor.tsx` - Main story editor (8 issues)
- `/src/components/publish/` - Publishing features (6 issues)
- `/src/components/browse/StoryGrid.tsx` - Story listing (2 issues)

**Hooks Using APIs**:
- `/src/hooks/useStories.ts` - Stories list (1 issue)
- `/src/hooks/useStoryReader.ts` - Reading interface
- `/src/hooks/useChapterScenes.ts` - Chapter scenes
- `/src/hooks/use-studio-agent-chat.ts` - Agent chat

---

## 🎯 Key Takeaways

1. **76 API routes exist** but only 14 are working correctly
2. **Story editing is broken** - main editor can't save
3. **Path convention mismatch** - components call `/studio/api/*` but routes are at `/api/*`
4. **25 unused routes** can be removed to clean up
5. **21 endpoints** are called but don't exist

**Bottom line**: The API layer needs significant work to match component expectations and enable core features.

---

**Next Step**: Choose which document to read based on your needs above, or start with `api-usage-analysis.md` for the complete picture.

