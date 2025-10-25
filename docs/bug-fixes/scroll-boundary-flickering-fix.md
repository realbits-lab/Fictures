# Scroll Boundary Flickering Fix

## Issue
When scrolling to the bottom of scene content with the mouse cursor positioned at the bottom, the GNB (Global Navigation Bar) would show and hide repeatedly, causing a distracting flickering effect.

## Root Cause
The immersive reading mode scroll detection was too sensitive near scroll boundaries (top/bottom). When users reached the bottom and tried to scroll further (overscroll), the scroll position would fluctuate slightly, triggering rapid UI toggle events.

### Why It Happened
1. **No boundary detection**: The code didn't check if user was at top/bottom
2. **Overscroll behavior**: Browsers allow slight scroll position changes at boundaries
3. **Too sensitive threshold**: 50px scroll threshold was too low
4. **No toggle rate limiting**: UI could toggle multiple times rapidly

## Solution

### Changes Made

#### File: `src/components/reading/ChapterReaderClient.tsx` (Lines 317-395)

### 1. **Boundary Detection** 🎯
Added logic to detect when user is within 50px of top or bottom:

```typescript
// Calculate distances from top and bottom
const distanceFromTop = currentScrollTop;
const distanceFromBottom = scrollHeight - (currentScrollTop + clientHeight);

const boundaryThreshold = 50; // Distance from top/bottom to ignore UI toggling
const isNearTop = distanceFromTop < boundaryThreshold;
const isNearBottom = distanceFromBottom < boundaryThreshold;
```

### 2. **Prevent Toggling at Boundaries** 🚫
When near boundaries, UI toggling is disabled:

```typescript
if (isNearTop || isNearBottom) {
  // Near boundaries - don't toggle UI
  if (isNearTop && !isUIVisible) {
    setIsUIVisible(true); // Show UI at top
  }
  // Don't hide/show UI when near bottom to prevent flickering
  setLastScrollY(currentScrollTop);
  return; // Exit early
}
```

### 3. **Rate Limiting with Flag** ⏱️
Added `isHandlingScroll` flag with 300ms timeout:

```typescript
let isHandlingScroll = false; // Prevent rapid toggling

const handleScroll = () => {
  if (selectedSceneId && mainContentElement && isScrollRestored && !isHandlingScroll) {
    // ... scroll logic ...

    isHandlingScroll = true;
    setIsUIVisible(false);
    setTimeout(() => { isHandlingScroll = false; }, 300);
  }
};
```

### 4. **Increased Thresholds** 📏
- **Scroll threshold**: 50px → 80px (requires more scroll to trigger)
- **Throttle delay**: 150ms → 200ms (reduces event frequency)

```typescript
const scrollThreshold = 80; // Increased from 50
// ...
scrollTimeout = setTimeout(handleScroll, 200); // Increased from 150ms
```

## How It Works

### Scroll Detection Flow

```
User Scrolls
    ↓
Throttled Event (200ms)
    ↓
Calculate Position
    ↓
Is Near Boundary? ────YES──→ Skip Toggle (return early)
    ↓ NO                      Show UI if at top
Is Toggle In Progress? ─YES→ Skip (return early)
    ↓ NO
Check Scroll Direction & Threshold
    ↓
Toggle UI if conditions met
    ↓
Set 300ms cooldown
```

### Boundary Zones

```
┌─────────────────────────┐
│   Top Boundary (50px)   │ ← UI always visible
├─────────────────────────┤
│                         │
│    Active Zone          │ ← UI can toggle
│    (Immersive Mode)     │
│                         │
├─────────────────────────┤
│  Bottom Boundary (50px) │ ← UI stays in current state
└─────────────────────────┘
```

## Test Results

### Automated Test
```bash
dotenv --file .env.local run node scripts/test-scroll-boundary-fix.mjs
```

**Results**:
```
Total UI toggles: 1
Toggles at bottom boundary: 0 ✅
Toggles at top boundary: 0 ✅
Rapid toggles (<300ms apart): 0 ✅

✅ SUCCESS: No flickering at boundaries!
```

### Test Scenarios
1. **Scroll to middle** → UI hides (expected)
2. **Scroll to bottom** → No toggles (0 during 5 scroll attempts)
3. **Try to scroll beyond bottom** → No flickering
4. **Scroll back to top** → UI shows (expected)
5. **Try to scroll above top** → No flickering

## Behavior Comparison

### Before Fix ❌
| Scenario | UI Behavior | Issue |
|----------|-------------|-------|
| Scroll to bottom | Toggle, Toggle, Toggle... | Rapid flickering |
| Try scrolling further | Hide, Show, Hide, Show... | Continues flickering |
| Mouse at bottom | Constant toggling | Unusable |

### After Fix ✅
| Scenario | UI Behavior | Result |
|----------|-------------|--------|
| Scroll to bottom | No change | Smooth, stable |
| Try scrolling further | No change | No flickering |
| Mouse at bottom | Stays in current state | Usable |

## Configuration

### Adjustable Parameters

```typescript
// Boundary detection
const boundaryThreshold = 50; // px from top/bottom (increase for larger dead zone)

// Scroll sensitivity
const scrollThreshold = 80; // px scroll required to trigger (increase = less sensitive)

// Rate limiting
const toggleCooldown = 300; // ms between toggles (increase = more stable)
const throttleDelay = 200; // ms scroll event throttle (increase = smoother)
```

### Recommended Values
- **Mobile**: Current settings work well
- **Desktop with mouse wheel**: Current settings work well
- **Touchpad with inertia scrolling**: May want to increase `boundaryThreshold` to 100px

## Edge Cases Handled

### 1. **Overscroll at Bottom** ✅
Browser allows scroll position slightly beyond content height
- **Solution**: 50px boundary zone prevents toggle

### 2. **Elastic Scrolling (iOS Safari)** ✅
Content bounces at boundaries
- **Solution**: Boundary detection catches bounce zone

### 3. **Rapid Mouse Wheel** ✅
Multiple quick scroll events
- **Solution**: 300ms cooldown prevents rapid toggles

### 4. **Smooth Scrolling Animation** ✅
Animated scroll triggers many events
- **Solution**: Throttling + cooldown stabilizes

### 5. **Short Content** ✅
Content shorter than viewport
- **Solution**: Boundary check handles edge case gracefully

## Files Modified
1. `src/components/reading/ChapterReaderClient.tsx` - Core scroll handling logic
2. `scripts/test-scroll-boundary-fix.mjs` - Automated boundary test
3. `docs/scroll-boundary-flickering-fix.md` - This documentation

## User Experience Impact

### Before
- 😠 Frustrating flickering when reading end of scenes
- 🤕 Difficult to use navigation controls at bottom
- 📉 Poor reading experience at boundaries

### After
- 😊 Smooth, stable UI at all scroll positions
- ✨ No distracting visual changes at boundaries
- 📈 Improved reading experience throughout

## Technical Notes

### Why 50px Boundary?
- Typical scroll wheel detent: ~20-40px
- Touchpad inertia: ~30-60px overscroll
- **50px catches most boundary fluctuations**

### Why 300ms Cooldown?
- Typical scroll event frequency: 50-100ms
- Animation frame duration: 16.67ms (60fps)
- **300ms ensures animation completes + buffer**

### Why 80px Scroll Threshold?
- Mouse wheel scroll: ~20-40px per detent
- Touchpad two-finger scroll: ~30-100px per gesture
- **80px requires deliberate scroll action**

## Debugging

### Enable Console Logs
The scroll handler includes console logs:
- `📖 Immersive mode: Hiding UI`
- `📖 Immersive mode: Showing UI`
- `📖 Near top: Showing UI`

Check browser console to see toggle events and timing.

### Visual Debug
Add temporary border to content to see boundary zones:

```typescript
// Add to mainContentRef style
style={{
  borderTop: '50px solid rgba(255,0,0,0.2)',
  borderBottom: '50px solid rgba(255,0,0,0.2)',
}}
```

## Future Improvements

### Potential Enhancements
1. **Adaptive thresholds** based on scroll velocity
2. **Device-specific settings** (mouse vs touch vs trackpad)
3. **User preference** to disable immersive mode entirely
4. **Scroll velocity detection** for more intelligent toggling

### User Settings (Future)
```typescript
interface ReadingPreferences {
  immersiveModeEnabled: boolean;
  scrollSensitivity: 'low' | 'medium' | 'high';
  boundaryBehavior: 'stable' | 'responsive';
}
```

## Conclusion
The scroll boundary flickering is now fixed with proper boundary detection, rate limiting, and increased thresholds. Users can scroll to the bottom of content without experiencing distracting UI toggles.
