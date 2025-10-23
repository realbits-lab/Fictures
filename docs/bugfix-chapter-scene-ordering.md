# Bug Fix: Chapter and Scene Ordering

## Problem

Chapters and scenes were displayed in the wrong order on the reading page. The sidebar showed:
1. The Stardust Falls
2. The First Tremors
3. The Maw's Embrace

But based on the Part orderIndex, the correct order should be:
1. The Stardust Falls (Part 1: "The Failsafe Failure")
2. The First Tremors (Part 2: "Gravitational Grasp")
3. The Maw's Embrace (Part 3: "The Final Descent")

## Root Cause

### Chapter Ordering Issue

The `availableChapters` calculation in `useStoryReader` hook had two problems:

1. **No sorting at all**: Chapters were simply concatenated without any ordering
2. **Missing Part context**: When chapters are nested in Parts, the Part's `orderIndex` determines the reading order, not just the chapter's `orderIndex`

The data structure shows:
- Each Part has an `orderIndex` (1, 2, 3, etc.)
- Each Chapter within a Part has its own `orderIndex` (usually 1 for the first chapter in that part)
- All three chapters had `orderIndex: 1` because they were each the first (and only) chapter in their respective parts

### Scene Ordering Issue

Scenes were being sorted in the UI rendering (`sort((a, b) => a.orderIndex - b.orderIndex)`), but when using navigation logic with `chapterScenes.findIndex()` and array indexing, the unsorted array was being used, causing incorrect navigation.

## Solution

### Fix Chapter Ordering

Modified `src/hooks/useStoryReader.ts` to:

1. Attach `partOrderIndex` to each chapter when flattening
2. Sort by `partOrderIndex` first, then `orderIndex` within each part

```typescript
// Create chapters with part context for proper sorting
const chaptersWithPartOrder = data.story.parts.flatMap(part =>
  part.chapters.map(chapter => ({
    ...chapter,
    partOrderIndex: part.orderIndex
  }))
);

// Add root-level chapters (no part)
const rootChapters = data.story.chapters.map(chapter => ({
  ...chapter,
  partOrderIndex: 0 // Root chapters come first
}));

// Sort by part orderIndex first, then chapter orderIndex within that part
return uniqueChapters.sort((a, b) => {
  if (a.partOrderIndex !== b.partOrderIndex) {
    return a.partOrderIndex - b.partOrderIndex;
  }
  return a.orderIndex - b.orderIndex;
});
```

### Fix Scene Ordering

Modified `src/hooks/useChapterScenes.ts` to:

1. Sort scenes by `orderIndex` in the hook itself
2. Return pre-sorted array so all navigation logic uses the correct order

```typescript
// Sort scenes by orderIndex to ensure correct reading order
const sortedScenes = data?.scenes
  ? [...data.scenes].sort((a, b) => a.orderIndex - b.orderIndex)
  : [];

return {
  scenes: sortedScenes,
  // ... other fields
};
```

## Changes Made

### `/src/hooks/useStoryReader.ts`
- Added `partOrderIndex` to chapters during flattening (lines 186-197)
- Implemented two-level sorting: part orderIndex → chapter orderIndex (lines 217-222)
- Ensures correct chapter order across parts

### `/src/hooks/useChapterScenes.ts`
- Added scene sorting by `orderIndex` in the hook return (lines 143-146)
- Ensures consistent scene order for both UI rendering and navigation logic

## Testing

### Chapter Order Verification ✅

Expected order after fix:
1. "The Stardust Falls" (Part: The Failsafe Failure, partOrder: 1)
2. "The First Tremors" (Part: Gravitational Grasp, partOrder: 2)
3. "The Maw's Embrace" (Part: The Final Descent, partOrder: 3)

**Result**: ✅ Chapters now display in correct reading order

### Navigation Testing ✅

1. **First chapter shows "Next Chapter" button** ✅
2. **Last chapter hides "Next Chapter" button** ✅
3. **Next Chapter button navigates correctly** ✅

## Benefits

- **Correct Reading Order**: Chapters and scenes follow their intended sequence
- **Proper Navigation**: "Next Chapter" button navigates to the correct next chapter
- **Part-Aware Ordering**: Respects the hierarchical structure of Parts → Chapters
- **Consistent Behavior**: Both UI rendering and navigation use the same sorted order

## Files Modified

1. `src/hooks/useStoryReader.ts` - Fixed chapter ordering with part context
2. `src/hooks/useChapterScenes.ts` - Fixed scene ordering in hook return
3. `docs/bugfix-chapter-scene-ordering.md` - Created documentation

## Related Issues

This fix also ensures:
- ✅ Correct chapter deduplication (from previous fix)
- ✅ Proper "Next Chapter" button behavior
- ✅ Consistent scene navigation within chapters
