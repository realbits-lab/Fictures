# Mobile Scene Title in Second GNB Fix

## Issue
Scene title was not visible in the second GNB (Global Navigation Bar) on mobile devices, only on desktop (lg breakpoint and above). This made it difficult for mobile users to know which scene they were currently reading.

## Requirements
1. ✅ Show scene title in second GNB on mobile
2. ✅ Keep scene title visible on desktop (already working)
3. ✅ Don't show scene time/timestamp in reading view

## Solution

### Before
```typescript
// Scene title only visible on lg+ screens (desktop)
{selectedScene && (
  <div className="hidden lg:flex items-center gap-2">
    <span className="text-gray-300 dark:text-gray-600">/</span>
    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
      🎬 {selectedScene.title}
    </span>
  </div>
)}
```

### After
```typescript
// Scene title visible on all screen sizes
{selectedScene && (
  <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial">
    <span className="hidden md:inline text-gray-300 dark:text-gray-600">/</span>
    <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs">
      🎬 {selectedScene.title}
    </span>
  </div>
)}
```

## Changes Made

### File: `src/components/reading/ChapterReaderClient.tsx` (Lines 622-629)

1. **Visibility**: Changed from `hidden lg:flex` to `flex` (visible on all sizes)
2. **Layout**: Added `min-w-0 flex-1 md:flex-initial` for better mobile responsiveness
3. **Separator**: Made "/" separator desktop-only with `hidden md:inline`
4. **Truncation**: Adjusted max-width to `max-w-[150px]` on mobile, `sm:max-w-xs` on larger screens

## Responsive Behavior

| Screen Size | Scene Title | Separator "/" | Max Width |
|-------------|-------------|---------------|-----------|
| Mobile (<640px) | ✅ Visible | ❌ Hidden | 150px |
| Tablet (640px-768px) | ✅ Visible | ❌ Hidden | 384px (max-w-xs) |
| Desktop (≥768px) | ✅ Visible | ✅ Visible | 384px (max-w-xs) |

## Layout Structure

### Mobile (375px wide)
```
[☰] [Story Title] [🎬 Scene Title Truncat...]
```
- Hamburger menu (40px)
- Story title (120px)
- Scene title (remaining space, truncated)

### Desktop (1920px wide)
```
[← Browse] / [Story Title] / [🎬 Scene Title]
```
- Browse link
- Story title
- Scene title with full context

## Scene Time Display
**Note**: No "scene time" or timestamp is displayed in the reading view. The Scene interface includes a `generated_at` field for scene images, but this is not rendered to users. If time display is needed in the future, it should be added as a separate metadata line below the title, not in the GNB.

## Test Results

### Automated Test
```bash
dotenv --file .env.local run node scripts/test-mobile-scene-title.mjs
```

**Results**:
- ✅ Mobile: Scene title visible in GNB
- ✅ Desktop: Scene title visible in GNB
- ✅ Mobile: No time displayed
- ✅ Desktop: No time displayed

### Screenshots
- `logs/mobile-scene-title-gnb.png` - Mobile viewport (375×667)
- `logs/desktop-scene-title-gnb.png` - Desktop viewport (1920×1080)

## Benefits

### For Mobile Users
- **Instant context**: Know which scene they're reading without checking sidebar
- **Navigation clarity**: Easier to understand reading progress
- **Reduced confusion**: No need to open sidebar to see current scene

### For Desktop Users
- **No change**: Existing behavior preserved
- **Consistent experience**: Same information across all devices

## Technical Details

### Text Truncation
- Mobile: `truncate max-w-[150px]` - Ensures scene title doesn't overflow on small screens
- Tablet+: `truncate sm:max-w-xs` - Allows longer titles on larger screens
- CSS `truncate` utility adds `text-overflow: ellipsis` automatically

### Flexbox Behavior
- `flex items-center gap-2` - Always flex container, centered items, 8px gap
- `min-w-0` - Allows text truncation to work correctly in flex container
- `flex-1 md:flex-initial` - Takes remaining space on mobile, auto-width on desktop

## Files Modified
1. `src/components/reading/ChapterReaderClient.tsx` - Scene title visibility fix
2. `scripts/test-mobile-scene-title.mjs` - Automated test
3. `docs/mobile-scene-title-gnb-fix.md` - This documentation

## Future Considerations

### If Scene Time Display is Needed
If future requirements include showing scene time/reading time:

```typescript
// Add below scene title, NOT in GNB
<div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
  📖 5 min read • Updated 2 hours ago
</div>
```

**Recommendation**: Keep GNB clean with only essential navigation info (story + scene title). Display metadata below the scene title in the content area.

## Conclusion
Scene title is now visible on mobile devices in the second GNB, providing better context for readers across all screen sizes while maintaining a clean, responsive design.
