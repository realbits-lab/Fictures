# Mobile Bottom Navigation Fix

## Issue
On mobile devices, when scrolling down the scene content in `/reading/[id]` page, the bottom navigation bar (Previous/Next buttons) was getting hidden due to the immersive reading mode. This made it difficult for mobile users to navigate between scenes.

## Root Cause
The immersive reading mode was hiding ALL UI elements (including bottom navigation) when scrolling down:

```typescript
// Before: Bottom nav hidden when isUIVisible = false
<div className={`... ${isUIVisible ? 'translate-y-0' : 'translate-y-full'}`}>
```

## Solution
Changed the bottom navigation to:
1. **Always stay visible on mobile** (screens < 768px)
2. **Hide on desktop** when immersive mode activates (preserves desktop experience)
3. **Added bottom padding** to content to prevent overlap

### Code Changes

#### 1. Bottom Navigation Visibility
**File**: `src/components/reading/ChapterReaderClient.tsx`

```typescript
// After: Bottom nav always visible on mobile, hides on desktop
<div className={`... ${
  isUIVisible ? 'translate-y-0' : 'translate-y-0 md:translate-y-full'
}`}>
```

#### 2. Content Padding
Added `pb-24 md:pb-8` to all content areas to prevent overlap:

- Article content (line 748)
- Loading skeleton (line 545)
- Empty state (line 905)

```typescript
// Mobile: 96px bottom padding | Desktop: 32px
className="... pb-24 md:pb-8"
```

## Test Results

### Mobile Test (iPhone SE, 375×667)
✅ Bottom nav stays visible when scrolling down
✅ Navigation buttons accessible
✅ Content has proper padding (no overlap)
✅ Scene navigation works correctly

### Key Metrics
- **Bottom nav height**: 61px
- **Content padding**: 96px (24 × 4px = sufficient clearance)
- **No overlap**: Last content at y=-299, nav at y=606

## Why This Approach?

### Mobile Priority
- Mobile users need **easy access** to navigation
- **Limited screen space** makes hidden navigation problematic
- **Bottom nav designed for thumb zones** on mobile
- **Sequential reading** is primary use case on mobile

### Desktop Experience Preserved
- Desktop still gets **immersive reading mode**
- Larger screens don't need persistent navigation
- Users can use keyboard shortcuts or scroll up to show UI

## Responsive Behavior

| Screen Size | Bottom Nav Behavior | Content Padding |
|-------------|-------------------|----------------|
| Mobile (<768px) | Always visible | 96px (pb-24) |
| Tablet/Desktop (≥768px) | Hides on scroll down | 32px (pb-8) |

## Files Modified
1. `src/components/reading/ChapterReaderClient.tsx` - Core fix
2. `scripts/test-mobile-bottom-nav.mjs` - Automated test

## Testing
Run the automated test:
```bash
dotenv --file .env.local run node scripts/test-mobile-bottom-nav.mjs
```

Manual test:
1. Open `/reading` on mobile device or mobile viewport
2. Click any story to open reader
3. Scroll down content
4. Verify bottom navigation stays visible
5. Tap Previous/Next buttons
6. Verify content doesn't get cut off at bottom

## Screenshots
Test screenshot saved to: `logs/mobile-bottom-nav-test.png`
