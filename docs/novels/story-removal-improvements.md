# Story Removal Improvements

## Issue
The story removal script (`scripts/remove-story.mjs`) was not properly removing all Vercel Blob images. It only checked for images referenced in the `characters` and `settings` database tables, missing:

1. **Story cover images** - Stored in `stories.imageUrl`
2. **Scene images** - Stored in `scenes.imageUrl`
3. **Optimized image variants** - Additional AVIF/WebP/JPEG variants

This led to orphaned images remaining in Vercel Blob storage after story deletion, wasting storage space.

## Root Cause
The `extractBlobUrls()` function only checked:
```javascript
// OLD - Only checked characters and settings
function extractBlobUrls(data) {
  const urls = [];
  if (data.characters) {
    for (const char of data.characters) {
      if (char.imageUrl) urls.push(char.imageUrl);
    }
  }
  if (data.settings) {
    for (const setting of data.settings) {
      if (setting.imageUrl) urls.push(setting.imageUrl);
    }
  }
  return urls;
}
```

This approach had fundamental problems:
- **Database-dependent**: Only found images that were still in the database
- **Incomplete**: Missed story cover images and scene images
- **Fragile**: If database records were deleted before blob cleanup, images would be orphaned

## Solution
Replaced database-based image discovery with **Vercel Blob list API**:

```javascript
// NEW - Uses Vercel Blob list API
async function getStoryBlobs(storyId) {
  try {
    const prefix = `stories/${storyId}/`;
    const { blobs } = await list({ prefix });
    return blobs.map(blob => blob.url);
  } catch (error) {
    console.warn('⚠️  Failed to list blobs:', error.message);
    return [];
  }
}
```

### Benefits
1. **Complete coverage**: Finds ALL images under `stories/{storyId}/` prefix
2. **Database-independent**: Works even if database records are already deleted
3. **Catches orphans**: Finds images that were never recorded in the database
4. **Future-proof**: Automatically handles new image types without code changes

## Files Updated

### 1. `scripts/remove-story.mjs`
- Added `list` import from `@vercel/blob`
- Replaced `extractBlobUrls()` with `getStoryBlobs()`
- Updated main flow to use Blob list API
- Fixed auth loading to support new profile-based structure

### 2. `.claude/skills/story-remover/SKILL.md`
- Updated Vercel Blob Storage section to document list API usage
- Added story cover images and scene images to removal scope
- Clarified that ALL images are found by prefix, not database records
- Updated technical details section

### 3. `CLAUDE.md`
- Updated "What Gets Removed" section
- Added detailed breakdown of all image types
- Documented the Vercel Blob list API approach

## New Utility Scripts

### 1. `scripts/list-blob-storage.mjs`
Lists all blobs in Vercel Blob storage with grouping by story:
```bash
dotenv --file .env.local run node scripts/list-blob-storage.mjs "stories/STORY_ID"
```

### 2. `scripts/cleanup-story-blobs.mjs`
Standalone script to clean up orphaned blobs for a story:
```bash
dotenv --file .env.local run node scripts/cleanup-story-blobs.mjs STORY_ID [--dry-run]
```

### 3. `scripts/query-stories-db.mjs`
Direct database query to list stories (bypasses API):
```bash
dotenv --file .env.local run node scripts/query-stories-db.mjs [search-term]
```

### 4. `scripts/list-stories.mjs`
Lists stories via API with search filtering:
```bash
dotenv --file .env.local run node scripts/list-stories.mjs [search-term]
```

## Testing

Tested with story "Secrets of the Obsidian Club" (ID: `55vnp7_fxk5rE7-VQWXIF`):

**Before fix:**
- Database records deleted ✓
- Blob images remaining: 3 files (1.64 MB) ✗

**After fix:**
- Database records deleted ✓
- Blob images deleted: 3 files (1.64 MB) ✓

## Image Types Handled

The updated script now properly removes:

1. **Story cover images**: `stories/{id}/storys/*.png` (1792×1024, 16:9)
2. **Scene images**: `stories/{id}/scenes/*.png` (1792×1024, 16:9)
3. **Character images**: `stories/{id}/characters/*.png` (1024×1024)
4. **Setting images**: `stories/{id}/settings/*.png` (1792×1024, 16:9)
5. **Optimized variants**: All AVIF, WebP, JPEG variants in multiple sizes

## Impact

### Storage Savings
- Prevents orphaned images from accumulating
- Each story can have 10-50+ images (5-100+ MB)
- Proper cleanup saves storage costs over time

### Reliability
- Works even if database is already cleaned
- No dependency on database record integrity
- Catches images that were never properly recorded

### Maintainability
- Single source of truth (Blob storage prefix)
- No need to update code when adding new image types
- Simpler logic, easier to understand

## Best Practices Going Forward

1. **Always use Blob list API** for finding story-related images
2. **Never rely on database records** for blob cleanup
3. **Use prefix-based organization** for all blob storage (`stories/{id}/...`)
4. **Test with real data** to ensure complete cleanup
5. **Document storage organization** in code comments

## Related Documentation

- [Story Image Generation](./story-image-generation.md)
- [Image Optimization](./image-optimization.md)
- [Story Removal Skill](./.claude/skills/story-remover/SKILL.md)
