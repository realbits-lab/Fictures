# Directory Reorganization Plan

## Overview
Reorganize src/app/ directory structure to align GNB menu names with page directories and co-locate API routes with their related pages.

## Goals
1. Match GNB menu items with directory names (consistency)
2. Move API routes from `/api/*` to page-specific API directories
3. Improve code organization and maintainability

## Directory Structure Changes

### 1. Reading (Browse & Discovery)
**Current:** `src/app/(dashboard)/browse/` (route: `/browse`)
**New:** `src/app/reading/` (route: `/reading`)

**API Routes to Move:**
- Keep `/api/stories/published` → `/reading/api/published/route.ts`
- Consider `/api/community/stories` → shared or keep in community

**URL Changes:**
- Page: `/browse` → `/reading`
- API: `/api/stories/published` → `/reading/api/published`

### 2. Writing (Story Management)
**Current:** `src/app/stories/` (route: `/stories`)
**New:** `src/app/writing/` (route: `/writing`)

**API Routes to Move:**
```
/api/stories/              → /writing/api/stories/
/api/chapters/             → /writing/api/chapters/
/api/scenes/               → /writing/api/scenes/
/api/parts/                → /writing/api/parts/
/api/story-analyzer/       → /writing/api/analyzer/
/api/chapter-analyzer/     → /writing/api/chapters/analyzer/
/api/scene-analyzer/       → /writing/api/scenes/analyzer/
/api/part-analyzer/        → /writing/api/parts/analyzer/
/api/story-analysis/       → /writing/api/analysis/
/api/story-update/         → /writing/api/update/
```

**URL Changes:**
- Page: `/stories` → `/writing`
- API Examples:
  - `/api/stories` → `/writing/api/stories`
  - `/api/chapters` → `/writing/api/chapters`
  - `/api/scenes` → `/writing/api/scenes`

### 3. Community
**Current:** `src/app/community/` (route: `/community`) ✅ Already matches
**New:** Keep location, move API routes

**API Routes to Move:**
```
/api/community/            → /community/api/
```

**URL Changes:**
- Page: `/community` (no change)
- API: `/api/community/*` → `/community/api/*`

### 4. Publish
**Current:** `src/app/publish/` (route: `/publish`) ✅ Already matches
**New:** Keep location, move API routes

**API Routes to Move:**
```
/api/publish/              → /publish/api/
```

**URL Changes:**
- Page: `/publish` (no change)
- API: `/api/publish/*` → `/publish/api/*`

### 5. Analytics
**Current:** `src/app/analytics/` (route: `/analytics`) ✅ Already matches
**New:** Keep location, move API routes

**API Routes to Move:**
```
/api/analytics/            → /analytics/api/
```

**URL Changes:**
- Page: `/analytics` (no change)
- API: `/api/analytics/*` → `/analytics/api/*`

### 6. Settings
**Current:** `src/app/settings/` (route: `/settings`) ✅ Already matches
**New:** Keep location, move API routes

**API Routes to Move:**
```
/api/settings/             → /settings/api/
```

**URL Changes:**
- Page: `/settings` (no change)
- API: `/api/settings/*` → `/settings/api/*`

### 7. Shared/Global APIs (Keep under /api)
These routes are used across multiple features and should remain global:

```
/api/auth/                 # Authentication (NextAuth)
/api/ai/                   # General AI features (used everywhere)
/api/comments/             # Comments (used in stories, chapters, scenes)
/api/upload/               # File uploads (used everywhere)
/api/evaluate/             # Scene evaluation (could move to /writing/api/evaluate)
/api/evaluation/           # Evaluation results
/api/validation/           # Content validation
/api/generate-image/       # Image generation (used everywhere)
/api/cron/                 # Scheduled tasks
/api/admin/                # Admin functions
/api/users/                # User management
/api/stats/                # System statistics
```

## Implementation Steps

### Phase 1: Page Directory Reorganization

1. **Create /reading and move /browse**
   ```bash
   mkdir -p src/app/reading
   mv src/app/\(dashboard\)/browse/* src/app/reading/
   rmdir src/app/\(dashboard\)/browse
   ```

2. **Rename /stories to /writing**
   ```bash
   mv src/app/stories src/app/writing
   ```

### Phase 2: API Route Migration

For each feature area:

1. **Create api directory structure** under each page directory
2. **Move API route files** from `/api/*` to respective directories
3. **Update imports** in moved files
4. **Keep directory structure** within each API area

Example for /writing:
```bash
mkdir -p src/app/writing/api/stories
mv src/app/api/stories/* src/app/writing/api/stories/
```

### Phase 3: Update Code References

1. **GlobalNavigation.tsx** (line 18-54)
   - Update routes: `/stories` → `/writing`, `/browse` → `/reading`

2. **Update all API calls** throughout codebase
   - Search for `/api/stories` → `/writing/api/stories`
   - Search for `/api/chapters` → `/writing/api/chapters`
   - Search for `/api/community` → `/community/api`
   - And so on for all moved APIs

3. **Update middleware** if route-based protection exists

4. **Update any route constants** or configuration files

### Phase 4: Testing

1. **Run build** to check for TypeScript errors
2. **Test each page** to ensure it loads
3. **Test API endpoints** to ensure they respond
4. **Test authentication** flows
5. **Test navigation** between pages

## Breaking Changes

⚠️ **API URL Changes**: All moved API endpoints will have new URLs
- Frontend code making API calls must be updated
- Any external integrations will break
- API documentation must be updated

## Files to Update

Based on common patterns, search for and update:

1. **API call files:**
   - Components using `fetch('/api/...')`
   - Service files with API calls
   - React Query/SWR hooks

2. **Configuration files:**
   - Any route manifests
   - Middleware configurations
   - Testing configurations

3. **Documentation:**
   - API documentation
   - README files
   - Developer guides

## Rollback Plan

If issues arise:
1. Keep git branches for easy rollback
2. Can revert directory moves with `git revert`
3. Database schema unchanged, so no data migration needed

## Estimated Scope

- **Directory moves:** ~6 major moves
- **API routes to move:** ~40+ route files
- **Files to update:** 100+ (all components making API calls)
- **Time estimate:** 2-3 hours for full migration + testing

## Success Criteria

- ✅ All pages accessible at new routes
- ✅ All API endpoints respond correctly
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ Navigation works correctly
- ✅ Authentication flows work
- ✅ All tests pass
