# Story Removal Documentation

Complete guide to removing stories and all related data from Fictures.

## Overview

The story removal system provides safe, comprehensive deletion of stories including:
- Database records (story, parts, chapters, scenes, characters, settings)
- Vercel Blob storage images (ALL images via prefix-based discovery)
- Community data (posts, likes, replies, bookmarks)
- Analytics data (reading sessions, insights, events)

## Scripts

### Single Story Removal

**Script:** `scripts/remove-story.mjs`

Removes a single story and all related data.

**Usage:**
```bash
# Remove a story
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID

# Preview what will be deleted (dry run)
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID --dry-run

# Run in background with logging
dotenv --file .env.local run node scripts/remove-story.mjs STORY_ID > logs/story-removal.log 2>&1 &
```

**Example Output:**
```
🔐 Loading authentication...
🔍 Finding story: abc123xyz

📖 Story: "The Stolen Painting"
   Genre: Mystery
   Status: published
   Created: 1/15/2025

🔍 Finding related data...
   📚 Parts: 3
   📝 Chapters: 8
   👥 Characters: 5 (5 with images)
   🏞️  Settings: 3 (3 with images)

⚠️  This will permanently delete all story data and images.
Press Ctrl+C to cancel, or wait 3 seconds to proceed...

🗑️  Starting removal process...

📦 Found 8 blob images to delete
   ⚡ Batch deleting 8 images...
   ✅ Batch deleted 8 images in 0.45s

🗑️  Removing database records...

✅ Story removed successfully!

📊 Cleanup Summary:
   Story: "The Stolen Painting" (ID: abc123xyz)
   Parts: 3
   Chapters: 8
   Characters: 5
   Settings: 3
   Blob images deleted: 8

✨ All data has been permanently removed.
```

### Bulk Story Removal

**Script:** `scripts/remove-all-stories.mjs`

Removes all stories for the authenticated user.

**Usage:**
```bash
# Remove all stories (requires confirmation)
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm

# Preview all deletions (dry run)
dotenv --file .env.local run node scripts/remove-all-stories.mjs --dry-run

# Run in background
dotenv --file .env.local run node scripts/remove-all-stories.mjs --confirm > logs/bulk-removal.log 2>&1 &
```

**Example Output:**
```
🔐 Loading authentication...
🔍 Finding all stories...

📖 Found 3 stories:

   - "The Stolen Painting" (abc123xyz)
     Genre: Mystery, Status: published
     Characters: 5 (5 with images)
     Settings: 3 (3 with images)

   - "Time Traveler's Dilemma" (def456uvw)
     Genre: Sci-Fi, Status: writing
     Characters: 7 (6 with images)
     Settings: 4 (4 with images)

   - "Dragon's Quest" (ghi789rst)
     Genre: Fantasy, Status: published
     Characters: 10 (9 with images)
     Settings: 6 (6 with images)

📊 Total Summary:
   Stories: 3
   Blob images: 32

⚠️  This will PERMANENTLY delete ALL stories and related data!
Press Ctrl+C to cancel, or wait 5 seconds to proceed...

🗑️  Starting removal process...

[1/3] Removing "The Stolen Painting"...
   ⚡ Batch deleted 8 images in 0.32s
   ✓ Story removed

[2/3] Removing "Time Traveler's Dilemma"...
   ⚡ Batch deleted 10 images in 0.41s
   ✓ Story removed

[3/3] Removing "Dragon's Quest"...
   ⚡ Batch deleted 15 images in 0.56s
   ✓ Story removed

✅ Removal complete!

📊 Final Summary:
   Stories removed: 3
   Blob images deleted: 33

✨ All stories and data have been permanently removed.
```

## API Endpoint

### DELETE /api/stories/[id]

The API endpoint handles cascading deletion of all related data.

**Authentication:** Required (NextAuth.js session)

**Authorization:** User must own the story or be an admin

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/stories/abc123xyz \
  -H "Cookie: authjs.session-token=YOUR_SESSION_TOKEN"
```

**Response (Success):**
```json
{
  "message": "Story deleted successfully",
  "deleted": {
    "story": 1,
    "parts": 3,
    "chapters": 8,
    "scenes": 24,
    "characters": 5,
    "places": 3,
    "communityPosts": 2,
    "images": 8
  }
}
```

**Response (Not Found):**
```json
{
  "error": "Story not found or access denied"
}
```

**Response (Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

## Database Cleanup

The DELETE endpoint removes records in the following order to respect foreign key constraints:

1. **Community replies** (depends on posts)
2. **Community posts** (depends on story)
3. **Scenes** (depends on chapters)
4. **Chapters** (depends on story and parts)
5. **Parts** (depends on story)
6. **Characters** (depends on story)
7. **Places** (depends on story)
8. **Settings** (depends on story)
9. **Story** (main record)

Additionally cleaned:
- **Story likes** (user interactions)
- **Story bookmarks** (user saves)
- **Reading sessions** (analytics)
- **Story insights** (analytics)
- **AI interactions** (generation history)

## Blob Storage Cleanup

### Image Discovery Method (Improved 2025-10-26)

**Current Approach:** Vercel Blob List API (Prefix-based discovery)

The system uses Vercel Blob's `list()` API to find ALL images under the `stories/{storyId}/` prefix:

```javascript
async function getStoryBlobs(storyId) {
  const prefix = `stories/${storyId}/`;
  const { blobs } = await list({ prefix });
  return blobs.map(blob => blob.url);
}
```

**Benefits:**
1. ✅ **Complete coverage** - Finds ALL images regardless of database state
2. ✅ **Database-independent** - Works even if records are already deleted
3. ✅ **Catches orphans** - Finds images never recorded in database
4. ✅ **Future-proof** - Automatically handles new image types without code changes

**Previous Approach (Deprecated):**

The old method extracted URLs from database records only:
- Only checked `characters.imageUrl` and `settings.imageUrl`
- Missed story cover images and scene images
- Failed if database records were deleted first
- Required code updates for new image types

### Image Types Removed

All images stored under `stories/{storyId}/` prefix:

1. **Story Cover Images**
   - Path: `stories/{id}/story/*`
   - Format: 1792×1024 PNG (16:9 widescreen)
   - AI-generated via DALL-E 3

2. **Scene Images**
   - Path: `stories/{id}/scenes/*`
   - Format: 1792×1024 PNG (16:9 widescreen)
   - AI-generated via DALL-E 3

3. **Character Portraits**
   - Path: `stories/{id}/characters/*`
   - Format: 1024×1024 PNG
   - AI-generated via DALL-E 3

4. **Setting Visuals**
   - Path: `stories/{id}/settings/*`
   - Format: 1792×1024 PNG (16:9 widescreen)
   - AI-generated via DALL-E 3

5. **Optimized Image Variants**
   - Path: Same directories with format suffixes
   - Formats: AVIF, WebP, JPEG
   - Sizes: 6 sizes per format (mobile, tablet, desktop at 1x and 2x)
   - Total: 18 variants per original image

### Deletion Process

1. **Discover all images** via Vercel Blob list API
   - Query: `list({ prefix: 'stories/{storyId}/' })`
   - Returns: ALL blob URLs under prefix
   - No database dependency

2. **Batch delete from Vercel Blob** using `@vercel/blob` SDK
   - ✅ **Optimized:** Single batch operation for all URLs
   - ⚡ **Fast:** Deletes hundreds of images in `<1` second
   - 🔄 **Fallback:** Individual deletion if batch fails

3. **Handle failures gracefully**
   - Logs failed deletions with specific URLs
   - Continues with remaining deletions
   - Reports orphaned images for manual cleanup

4. **Report deletion counts** with timing metrics

### Performance Optimization

**Batch Deletion** (Implemented 2025-10-25):
- Uses Vercel Blob's array deletion: `del([url1, url2, ...])`

**Performance Comparison:**

| Image Count | Before (Sequential) | After (Batch) | Speedup |
|-------------|---------------------|---------------|---------|
| 10 images   | ~1.0 seconds       | ~0.3 seconds  | 3.3x    |
| 50 images   | ~5.0 seconds       | ~0.5 seconds  | 10x     |
| 100 images  | ~10.0 seconds      | ~0.6 seconds  | 16.7x   |
| 200 images  | ~20.0 seconds      | ~0.8 seconds  | 25x     |

**Fallback Strategy:**
- If batch deletion fails, automatically falls back to individual deletion
- Ensures reliable cleanup even with partial failures
- Logs specific errors for failed individual deletions

### Utility Scripts

**List all blobs for a story:**
```bash
dotenv --file .env.local run node scripts/list-blob-storage.mjs "stories/STORY_ID"
```

**Clean up orphaned blobs:**
```bash
dotenv --file .env.local run node scripts/cleanup-story-blobs.mjs STORY_ID [--dry-run]
```

**Query stories in database:**
```bash
dotenv --file .env.local run node scripts/query-stories-db.mjs [search-term]
```

## Safety Features

### 1. Confirmation Prompts

**Single story:** 3-second delay with warning
**Bulk removal:** 5-second delay with full list

### 2. Dry-Run Mode

Preview deletions without actual changes:
```bash
node scripts/remove-story.mjs STORY_ID --dry-run
node scripts/remove-all-stories.mjs --dry-run
```

### 3. Authorization Checks

- Verify user session
- Check story ownership
- Only owner or admin can delete

### 4. Transaction Safety

- Database operations use transactions
- Rollback on errors
- Atomic deletions

### 5. Audit Logging

- Console logs for all operations
- Real-time event publishing
- Error tracking

## Event Publishing

When a story is deleted, a real-time event is published:

```typescript
{
  channel: 'STORY_DELETED',
  payload: {
    storyId: 'abc123xyz',
    timestamp: '2025-01-25T10:30:00.000Z'
  }
}
```

This allows real-time UI updates across all connected clients.

## Error Handling

### Story Not Found
```
❌ Story not found.

The story ID "abc123xyz" doesn't exist in the database.
Please verify the story ID and try again.
```

### Permission Denied
```
❌ Permission denied.

You don't have permission to delete this story.
Only the story author or admins can remove stories.
```

### Partial Deletion
```
⚠️  Partial deletion occurred.

Database records were removed, but some Blob images failed to delete:
- Failed images: https://blob.vercel-storage.com/xyz.png

The story data is removed, but orphaned images may remain.
You can manually delete them from the Vercel dashboard.
```

### Authentication Error
```
❌ Failed to load authentication: No session cookie found

Please ensure .auth/user.json contains valid credentials.
```

## Claude Code Skill

### story-remover

**Location:** `.claude/skills/story-remover/SKILL.md`

**Activation phrases:**
- "remove a story..."
- "delete a story..."
- "clean up story..."
- "remove all stories..."

**Workflow:**
1. Identify target stories (by ID or query)
2. Preview what will be deleted
3. Request user confirmation
4. Execute removal
5. Report cleanup summary

**Features:**
- Automatic authentication
- Dry-run support
- Progress monitoring
- Detailed reporting
- Error handling with actionable solutions

## Best Practices

### Before Deletion

1. **Verify story ID** - Check the story exists and you own it
2. **Use dry-run** - Preview what will be deleted
3. **Consider backup** - Export story content if needed
4. **Check dependencies** - Verify no critical integrations

### During Deletion

1. **Monitor logs** - Watch for errors or failures
2. **Don't interrupt** - Let the process complete
3. **Background execution** - Use logging for long operations

### After Deletion

1. **Verify cleanup** - Check database and Blob storage
2. **Review logs** - Look for failed deletions
3. **Manual cleanup** - Remove orphaned images if needed using utility scripts
4. **Clear caches** - Refresh UI to reflect changes

### Image Cleanup Best Practices

1. **Always use Blob list API** for finding story-related images
2. **Never rely on database records** for blob cleanup
3. **Use prefix-based organization** for all blob storage (`stories/{id}/...`)
4. **Test with real data** to ensure complete cleanup
5. **Document storage organization** in code comments

## Troubleshooting

### Q: Can I recover a deleted story?
**A:** No, deletion is permanent. Consider using dry-run mode first or implement backup before deletion.

### Q: Some images weren't deleted
**A:** Use the cleanup utility script:
```bash
dotenv --file .env.local run node scripts/cleanup-story-blobs.mjs STORY_ID
```
This will find and remove any orphaned images using the Blob list API.

### Q: Database records remain after deletion
**A:** Check for foreign key constraint violations. The endpoint should handle cascading deletes automatically.

### Q: How do I find a story ID?
**A:**
- Check the URL when editing: `/writing/{storyId}`
- Use the list script: `node scripts/list-stories.mjs [search]`
- Use the API: `GET /api/stories`
- Check database: `SELECT id, title FROM stories`

### Q: Can I delete someone else's story?
**A:** No, only the story owner or admin role can delete a story.

### Q: How do I verify all images were deleted?
**A:** Use the list blob utility:
```bash
dotenv --file .env.local run node scripts/list-blob-storage.mjs "stories/STORY_ID"
```
This should return no results if cleanup was complete.

## Performance

**Single story removal:**
- Database operations: < 1 second
- Blob deletions: 0.3-1 second (depending on image count)
- Total time: 1-3 seconds

**Bulk removal (10 stories):**
- Database operations: 5-10 seconds
- Blob deletions: 3-8 seconds (batch optimized)
- Total time: 8-18 seconds

**Storage Savings:**
- Each story: 10-50+ images (5-100+ MB)
- Proper cleanup prevents storage cost accumulation
- Batch deletion 10-25x faster than sequential

## Implementation History

### 2025-10-26: Blob Discovery Improvements
- **Changed:** Replaced database-based URL extraction with Vercel Blob list API
- **Why:** Database method missed story/scene images and failed if records deleted first
- **Result:** Complete, reliable image cleanup regardless of database state

### 2025-10-25: Batch Deletion Optimization
- **Changed:** Implemented batch deletion using `del([urls])` instead of sequential
- **Why:** Sequential deletion too slow for stories with many images
- **Result:** 10-25x faster cleanup, sub-second deletion for most stories

## Related Documentation

- [Story Generation](../CLAUDE.md#story-generation)
- [Story Image Generation](./story-image-generation.md)
- [Image Optimization](./image-optimization.md)
- [Database Schema](../../src/lib/db/schema.ts)
- [API Routes](../../src/app/api/stories/[id]/route.ts)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
