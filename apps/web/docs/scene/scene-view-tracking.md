# Scene View Tracking System

**Complete view tracking for both logged-in and anonymous users**

This document describes the scene view tracking system that tracks how many times scenes are viewed, with support for both authenticated and anonymous users.

## Overview

The view tracking system provides:
- **Accurate view counts** for each scene
- **Unique visitor tracking** to distinguish new viewers from repeat visitors
- **Anonymous user support** using session cookies
- **Privacy-friendly** tracking without storing personally identifiable information
- **Real-time updates** with automatic cache invalidation

## Architecture

### Database Schema

**Schema Location:** `src/lib/schemas/database/index.ts`

**`scene_views` Table** (lines 1453-1484):
```typescript
export const sceneViews = pgTable("scene_views", {
  id: text().default("gen_random_uuid()").primaryKey().notNull(),
  sceneId: text("scene_id").notNull(),
  userId: text("user_id"),
  sessionId: text("session_id"),
  readingFormat: readingFormat("reading_format").default("novel").notNull(), // "novel" | "comic"
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at", { mode: "string" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});
```

**Foreign Keys**:
- `scene_id` → `scenes.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE SET NULL)

**`scenes` Table Analytics Fields** (lines 652-663):
```typescript
// === ANALYTICS ===
// Aggregate totals (novel + comic combined, maintained by API)
viewCount: integer("view_count").default(0).notNull(),           // = novel_view_count + comic_view_count
uniqueViewCount: integer("unique_view_count").default(0).notNull(), // incremented per new viewer per format

// Format-specific counts
novelViewCount: integer("novel_view_count").default(0).notNull(),
novelUniqueViewCount: integer("novel_unique_view_count").default(0).notNull(),
comicViewCount: integer("comic_view_count").default(0).notNull(),
comicUniqueViewCount: integer("comic_unique_view_count").default(0).notNull(),

lastViewedAt: timestamp("last_viewed_at", { mode: "string" }),
```

### Session Management

**For Anonymous Users**:
- Session ID generated on first visit: `sess_`<3`2-char-nanoid>`
- Stored in HTTP-only cookie: `fictures_session_id`
- Expires after 30 days
- Secure in production (HTTPS only)
- SameSite: lax (CSRF protection)

**Location**: `src/lib/utils/session.ts`

```typescript
// Get or create session ID for current user
const sessionId = await getOrCreateSessionId(userId);

// Returns:
// - null for logged-in users (use userId instead)
// - existing or new session ID for anonymous users
```

## API Endpoints

**Location:** `src/app/api/studio/scenes/[id]/view/route.ts`

### POST `/api/studio/scenes/[id]/view`

Track a scene view with format-specific tracking.

**Request Body**:
```json
{
  "reading_format": "novel"  // "novel" | "comic" (default: "novel")
}
```

**Behavior**:
1. Get user ID (if logged in) or session ID (if anonymous)
2. Check if this user/session already viewed this scene **in this format**
3. If new viewer for this format:
   - Create `scene_views` record with `reading_format`
   - Increment scene's `unique_view_count`
   - Increment format-specific `novel_unique_view_count` or `comic_unique_view_count`
4. Always increment scene's `view_count` and format-specific view count
5. Update `last_viewed_at` timestamp
6. Return updated counts (total and format-specific)

**Response**:
```json
{
  "success": true,
  "sceneId": "scene_abc123",
  "isNewView": true,
  "readingFormat": "novel",
  "viewCount": 156,
  "uniqueViewCount": 98,
  "novelViewCount": 120,
  "novelUniqueViewCount": 75,
  "comicViewCount": 36,
  "comicUniqueViewCount": 23,
  "viewer": {
    "userId": "user_xyz789",
    "sessionId": null,
    "isAuthenticated": true
  }
}
```

**Client Usage**:
```typescript
const response = await fetch(`/api/studio/scenes/${sceneId}/view`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reading_format: 'novel' })
});

const data = await response.json();
console.log(`Total views: ${data.viewCount}`);
console.log(`Novel views: ${data.novelViewCount}`);
console.log(`Comic views: ${data.comicViewCount}`);
```

### GET `/api/studio/scenes/[id]/view`

Get view statistics for a scene.

**Response**:
```json
{
  "sceneId": "scene_abc123",
  "viewCount": 156,
  "uniqueViewCount": 98,
  "lastViewedAt": "2025-10-26T12:34:56.789Z",
  "novelViewCount": 120,
  "novelUniqueViewCount": 75,
  "comicViewCount": 36,
  "comicUniqueViewCount": 23,
  "hasViewedByCurrentUser": true
}
```

## React Hook Integration

### useSceneView Hook

**Location**: `src/hooks/use-scene-view.ts`

Automatically tracks scene views when scenes are loaded, with format-specific tracking.

**Features**:
- Debounces API calls (1 second default)
- Prevents duplicate tracking in same session **per format**
- Format-specific tracking key: `${sceneId}:${readingFormat}`
- Works with React component lifecycle
- Automatic SWR cache revalidation

**Usage**:
```typescript
import { useSceneView } from '@/hooks/use-scene-view';

function SceneReader({ sceneId }: { sceneId: string }) {
  // Automatically tracks novel view when sceneId changes
  const { hasViewed } = useSceneView(sceneId);

  return (
    <div>
      <h1>Scene Content</h1>
      {hasViewed && <span>✓ Tracked</span>}
    </div>
  );
}
```

**Options**:
```typescript
useSceneView(sceneId, {
  enabled: true,           // Enable/disable tracking
  debounceMs: 1000,        // Debounce delay (default: 1000ms)
  readingFormat: 'novel'   // 'novel' | 'comic' (default: 'novel')
});
```

**Format-Specific Tracking Example**:
```typescript
// Track novel views in novel reader
useSceneView(sceneId, { readingFormat: 'novel' });

// Track comic views in comic reader
useSceneView(sceneId, { readingFormat: 'comic' });

// Same scene can be tracked separately for each format
```

**Integration Example** (`ChapterReaderClient.tsx`):
```typescript
// Track views automatically when scene is selected
useSceneView(selectedSceneId, { readingFormat: 'novel' });
```

## UI Components

### ViewCount Component

**Location**: `src/components/ui/view-count.tsx`

Displays view counts with eye icon.

**Basic Usage**:
```typescript
import { ViewCount } from '@/components/ui/view-count';

<ViewCount viewCount={156} />
// Shows: 👁️ 156

<ViewCount viewCount={1500} />
// Shows: 👁️ 1.5K

<ViewCount viewCount={2500000} />
// Shows: 👁️ 2.5M
```

**Show Unique Views**:
```typescript
<ViewCount
  viewCount={156}
  uniqueViewCount={98}
  showUnique={true}
/>
// Shows: 👁️ 98 (156)
```

**Sizes**:
```typescript
<ViewCount viewCount={156} size="sm" />  // Small (text-xs)
<ViewCount viewCount={156} size="md" />  // Medium (text-sm) - default
<ViewCount viewCount={156} size="lg" />  // Large (text-base)
```

**Badge Variant**:
```typescript
import { ViewCountBadge } from '@/components/ui/view-count';

<ViewCountBadge viewCount={156} />
// Rounded pill badge with background
```

**Loading State**:
```typescript
import { ViewCountSkeleton } from '@/components/ui/view-count';

<ViewCountSkeleton size="md" />
// Animated loading skeleton
```

## View Count Types

### Total Views (`viewCount`)
- **What**: All view records for this scene
- **Includes**: Repeat views from same user/session
- **Use Case**: Overall popularity, engagement metrics
- **Increment**: Every time API is called

### Unique Views (`uniqueViewCount`)
- **What**: Distinct viewers (unique users + unique sessions)
- **Includes**: Only first view per user/session **per format**
- **Use Case**: Reach metrics, audience size
- **Increment**: Only for new viewers in that format

### Format-Specific Views
- **`novelViewCount`** / **`novelUniqueViewCount`**: Views from novel reader
- **`comicViewCount`** / **`comicUniqueViewCount`**: Views from comic reader
- Same user viewing both formats = 2 unique views (one per format)

### Example Scenario:
```
User A (logged in) views scene as novel twice, then as comic once:
  - First novel view: viewCount +1, novelViewCount +1, uniqueViewCount +1, novelUniqueViewCount +1
  - Second novel view: viewCount +1, novelViewCount +1
  - First comic view: viewCount +1, comicViewCount +1, uniqueViewCount +1, comicUniqueViewCount +1

User B (anonymous) views scene as novel three times:
  - First view: viewCount +1, novelViewCount +1, uniqueViewCount +1, novelUniqueViewCount +1
  - Second view: viewCount +1, novelViewCount +1
  - Third view: viewCount +1, novelViewCount +1

Final counts:
  - viewCount: 6 (total views)
  - uniqueViewCount: 3 (User A novel + User A comic + User B novel)
  - novelViewCount: 5 (2 from A + 3 from B)
  - novelUniqueViewCount: 2 (User A + User B)
  - comicViewCount: 1 (from A)
  - comicUniqueViewCount: 1 (User A)
```

## Privacy & GDPR Compliance

### Data Collected
- **User ID**: Only for logged-in users (already authenticated)
- **Session ID**: Random anonymous identifier (no PII)
- **IP Address**: Optional, for analytics only (can be disabled)
- **User Agent**: Browser information (standard HTTP header)

### Privacy Features
- Session IDs are random and cannot be traced to individuals
- No tracking of browsing history beyond current site
- HTTP-only cookies prevent JavaScript access
- Secure cookies in production (HTTPS only)
- 30-day expiry automatically removes old sessions

### User Rights
- Users can clear cookies to reset session tracking
- Logged-in users can request data deletion
- No cross-site tracking or third-party sharing

## Performance Considerations

### Database Performance
- **Indexes**: All queries use indexed columns
- **Constraints**: Unique indexes prevent duplicate tracking
- **Cascade Deletion**: Views automatically deleted when scene is deleted

### Query Performance:
```sql
-- Check if user viewed scene (uses unique index)
SELECT id FROM scene_views
WHERE scene_id = ? AND user_id = ?
LIMIT 1;
-- Execution time: `<1ms`

-- Get scene view counts (uses primary key)
SELECT view_count, unique_view_count FROM scenes
WHERE id = ?;
-- Execution time: `<1ms`
```

### Caching Strategy
- Scene data cached in Redis (includes view counts)
- Cache invalidated when view is tracked
- Uses SWR pattern for optimistic updates

### API Performance
- Debounced tracking (1 second) prevents spam
- Client-side deduplication per session
- Async processing doesn't block rendering

## Testing

### Unit Tests
```bash
# Test session management
pnpm test -- __tests__/session.test.ts

# Test view tracking API
pnpm test -- __tests__/api/scenes/view.test.ts

# Test ViewCount component
pnpm test -- __tests__/components/view-count.test.ts
```

### Integration Testing

**Test Anonymous User Flow**:
```typescript
// 1. Visit scene without login
await page.goto('/novels/story-id');

// 2. Check cookie is set
const cookies = await page.context().cookies();
const sessionCookie = cookies.find(c => c.name === 'fictures_session_id');
expect(sessionCookie).toBeDefined();

// 3. Verify view was tracked
const response = await page.request.get(`/api/scenes/${sceneId}/view`);
const data = await response.json();
expect(data.viewCount).toBeGreaterThan(0);
```

**Test Logged-In User Flow**:
```typescript
// 1. Login
await page.goto('/login');
await page.fill('[name="email"]', 'test@example.com');
await page.click('button[type="submit"]');

// 2. Visit scene
await page.goto('/novels/story-id');

// 3. Verify tracking uses user ID
const response = await page.request.get(`/api/scenes/${sceneId}/view`);
const data = await response.json();
expect(data.hasViewedByCurrentUser).toBe(true);
```

**Test Duplicate Prevention**:
```typescript
// Track view twice
await fetch(`/api/scenes/${sceneId}/view`, { method: 'POST' });
const first = await fetch(`/api/scenes/${sceneId}/view`, { method: 'POST' });
const second = await fetch(`/api/scenes/${sceneId}/view`, { method: 'POST' });

const firstData = await first.json();
const secondData = await second.json();

expect(firstData.isNewView).toBe(true);
expect(secondData.isNewView).toBe(false);
expect(firstData.uniqueViewCount).toBe(secondData.uniqueViewCount);
```

## Analytics & Insights

### View Metrics Available
- **Total Views**: Overall engagement
- **Unique Viewers**: Reach and audience size
- **View Velocity**: Views over time
- **Reader Retention**: Repeat view patterns
- **Popular Scenes**: Most viewed content

### Query Examples

**Most Viewed Scenes**:
```sql
SELECT id, title, view_count, unique_view_count
FROM scenes
WHERE story_id = ?
ORDER BY view_count DESC
LIMIT 10;
```

**View Growth Over Time**:
```sql
SELECT DATE(viewed_at) as date, COUNT(*) as views
FROM scene_views
WHERE scene_id = ?
GROUP BY DATE(viewed_at)
ORDER BY date DESC;
```

**Unique Viewer Ratio**:
```sql
SELECT
  scene_id,
  view_count,
  unique_view_count,
  ROUND(unique_view_count::numeric / NULLIF(view_count, 0) * 100, 2) as unique_ratio
FROM scenes
WHERE story_id = ?;
```

## Troubleshooting

### Views Not Tracking
1. **Check cookie settings**: Session cookie must be enabled
2. **Verify API endpoint**: Check browser console for errors
3. **Check database**: Verify migration ran successfully
4. **Clear cache**: Redis cache may be stale

### Duplicate Tracking
1. **Check unique indexes**: `idx_scene_views_unique_user/session`
2. **Verify session cookie**: Should persist across page loads
3. **Check client-side dedup**: `useSceneView` prevents multiple calls

### Performance Issues
1. **Check indexes**: All lookups should use indexes
2. **Monitor Redis**: Cache hit rate should be >80%
3. **Database connection pool**: May need to increase pool size

## Future Enhancements

### Planned Features
- [ ] Real-time view counter updates (WebSocket)
- [ ] View heatmaps (which parts of scene are read)
- [ ] Reading speed analytics
- [ ] A/B testing support
- [ ] View source tracking (social media, search, direct)
- [ ] Geographic distribution (optional, privacy-conscious)

### Configuration Options
- [ ] Toggle between total/unique view display
- [ ] Disable tracking for private stories
- [ ] Custom tracking intervals
- [ ] Batch view updates for performance

## Related Documentation

- **Database Schema**: `src/lib/schemas/database/index.ts`
  - `scenes` table analytics fields: lines 652-663
  - `scene_views` table: lines 1453-1484
- **Session Management**: `src/lib/utils/session.ts`
- **API Endpoint**: `src/app/api/studio/scenes/[id]/view/route.ts`
- **Scene Stats API**: `src/app/api/studio/story/[id]/scene-stats/route.ts`
- **React Hook**: `src/hooks/use-scene-view.ts`
- **UI Components**:
  - `src/components/ui/view-count.tsx`
  - `src/components/ui/scene-view-badge.tsx`
- **Scene View Analysis**: `docs/scene/scene-view-analysis.md`

## Summary

The scene view tracking system provides:

✅ **Accurate Tracking** - Distinguishes between total and unique views
✅ **Format-Specific Tracking** - Separate counts for novel and comic views
✅ **Anonymous Support** - Works for non-logged-in users with session cookies
✅ **Privacy-Friendly** - No PII stored for anonymous users
✅ **High Performance** - Indexed queries, SWR caching, debounced tracking
✅ **Easy Integration** - Simple React hook for automatic tracking with format option
✅ **Flexible Display** - Reusable UI components with multiple variants

**Key Files:**
- API: `src/app/api/studio/scenes/[id]/view/route.ts`
- Hook: `src/hooks/use-scene-view.ts`
- Schema: `src/lib/schemas/database/index.ts` (lines 652-663, 1453-1484)
