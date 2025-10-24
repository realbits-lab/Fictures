# Bug Fix: Next Chapter Button on Last Chapter

## Problem

When viewing the last scene of the last chapter, a "Next Chapter" button was still appearing, which incorrectly pointed to the same chapter (showing "Next Chapter: The Maw's Embrace →" when already in "The Maw's Embrace").

## Root Cause

The `availableChapters` array in `useStoryReader` hook was creating duplicate chapter entries by combining:
1. Chapters from parts: `data.story.parts.flatMap(part => part.chapters)`
2. Root-level chapters: `data.story.chapters`

This caused the same chapter to appear multiple times in the array. For example:
- Before fix: 6 chapters total (with duplicates)
- After fix: 3 unique chapters

## Solution

Added deduplication logic in `src/hooks/useStoryReader.ts` to filter out duplicate chapters by ID:

```typescript
// Calculate available chapters (memoized for performance)
const availableChapters = useMemo(() => {
  if (!data?.story) return [];

  const allChapters = [
    ...data.story.parts.flatMap(part => part.chapters),
    ...data.story.chapters
  ];

  // Filter to only published chapters (or all if owner)
  const filteredChapters = allChapters.filter(chapter =>
    data.isOwner || chapter.status === 'published'
  );

  // Deduplicate by chapter ID (in case same chapter appears in both parts and root chapters)
  const seenIds = new Set<string>();
  return filteredChapters.filter(chapter => {
    if (seenIds.has(chapter.id)) {
      return false;
    }
    seenIds.add(chapter.id);
    return true;
  });
}, [data?.story, data?.isOwner]);
```

## Changes Made

### `/src/hooks/useStoryReader.ts`
- Added deduplication logic to `availableChapters` calculation (lines 182-204)
- Ensures each chapter appears only once in the array

### `/src/components/reading/ChapterReaderClient.tsx`
- Cleaned up debug logging after verification
- No logic changes needed - existing button logic works correctly with deduplicated array

## Testing

Comprehensive Playwright tests verify:

### Test 1: First Chapter Shows Next Button ✅
- Navigated to "The First Tremors" (first chapter)
- Verified "Next Chapter" button appears
- Result: Button correctly shows "Next Chapter: The Stardust Falls →"

### Test 2: Last Chapter Hides Next Button ✅
- Navigated to "The Maw's Embrace" (last chapter)
- Verified NO "Next Chapter" button appears
- Result: No button shown on last chapter

### Test 3: Next Chapter Button Navigation ✅
- Clicked "Next Chapter" button from first chapter
- Verified navigation to next chapter works correctly
- Result: Successfully navigated to "The Stardust Falls"

## Verification Results

**Before Fix:**
```
currentChapterIndex: 2
totalChapters: 6
nextChapterId: 5UTuGNZ1yHDqG3ooD895q (same as current!)
```

**After Fix:**
```
currentChapterIndex: 2
totalChapters: 3
nextChapterId: undefined (correctly null)
```

## Files Modified

1. `src/hooks/useStoryReader.ts` - Added chapter deduplication
2. `src/components/reading/ChapterReaderClient.tsx` - Removed debug logging

## Related Issues

This fix also resolves the related features:
- ✅ Next Chapter button on single-scene chapters
- ✅ Auto-select first scene when navigating to new chapter
- ✅ No button shown on last scene of last chapter
