---
title: Independent Scrolling Implementation
---

# Independent Scrolling Implementation

This document describes the implementation method for achieving completely independent vertical scrolling in multi-panel layouts, preventing any cross-panel scroll interference and eliminating page body scrolling.

## Overview

The implementation ensures that each panel in a resizable three-panel layout (left, middle, right) can scroll independently without affecting other panels or triggering default page scrolling. This is critical for story editor interfaces where users need to navigate different content areas simultaneously.

## Problem Statement

### Issues to Solve

1. **Cross-Panel Scroll Leakage**: Scrolling in one panel causes other panels to scroll
2. **Page Body Scroll**: Scrolling within panels triggers default browser page scrolling
3. **Overscroll Effects**: Scroll momentum at panel boundaries transfers to parent elements
4. **Side Effects**: After scrolling to top/bottom, mouse movement causes unwanted scrolling in other areas

## Solution Architecture

The solution consists of three key components working together:

### 1. Global Body Scroll Prevention

Completely disable scrolling on the page body and HTML element to ensure only designated panels can scroll.

```jsx
<style jsx global>{`
  html, body {
    overflow: hidden;           /* Prevent any default page scrolling */
    height: 100%;               /* Full viewport height without scroll */
    overscroll-behavior: none;  /* Critical: Prevent scroll chaining and bounce */
  }
`}</style>
```

**Key Properties:**
- `overflow: hidden` - Eliminates scrollbars and scroll capability on page body
- `height: 100%` - Ensures full viewport coverage without creating scroll
- `overscroll-behavior: none` - **Most Important**: Prevents scroll momentum transfer and iOS/macOS bounce effects

### 2. Capture Phase Event Listeners

Intercept wheel events in the capture phase (before they reach child elements) and implement custom scroll handling.

```javascript
const leftPanelRef = useRef<HTMLDivElement>(null);
const middlePanelRef = useRef<HTMLDivElement>(null);
const rightChatRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const panels = [leftPanelRef.current, middlePanelRef.current, rightChatRef.current];

  const handleWheel = (e: WheelEvent) => {
    // ALWAYS prevent default and stop propagation
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const canScroll = scrollHeight > clientHeight;

    // If element can scroll, manually update scrollTop
    if (canScroll) {
      const newScrollTop = scrollTop + e.deltaY;
      const maxScroll = scrollHeight - clientHeight;

      // Clamp scroll position to valid range
      target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    }
    // If element cannot scroll, do nothing (event already prevented)
  };

  panels.forEach((panel) => {
    if (panel) {
      // Capture phase ensures we intercept events before child elements
      panel.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    }
  });

  return () => {
    panels.forEach((panel) => {
      if (panel) {
        panel.removeEventListener('wheel', handleWheel, { capture: true });
      }
    });
  };
}, []);
```

**Why Capture Phase?**
- Events are intercepted **before** they reach nested child elements
- Prevents child elements from handling wheel events first
- Ensures consistent scroll behavior across all panel content

**Why Manual Scroll Control?**
- `preventDefault()` blocks browser's default scroll behavior
- Manual `scrollTop` updates give precise control over scroll position
- Prevents overscroll and scroll chaining to parent elements

### 3. Panel-Specific Scroll Containment

Configure each scrollable panel with appropriate CSS classes.

```jsx
{/* Left Panel */}
<div
  ref={leftPanelRef}
  className="flex-1 min-h-0 pr-2 overflow-y-auto [overscroll-behavior-y:contain]"
>
  {/* Panel content */}
</div>

{/* Middle Panel */}
<div
  ref={middlePanelRef}
  className="flex-1 min-h-0 px-2 overflow-y-auto [overscroll-behavior-y:contain]"
>
  {/* Panel content */}
</div>

{/* Right Chat Panel */}
<div
  ref={rightChatRef}
  className="flex-1 p-4 overflow-y-auto text-foreground min-h-0 [overscroll-behavior-y:contain]"
>
  {/* Panel content */}
</div>
```

**Critical CSS Classes:**
- `overflow-y-auto` - Enable vertical scrolling when content exceeds height
- `min-h-0` - Allow flex items to shrink below content size (enables scrolling in flex containers)
- `flex-1` - Grow to fill available space
- `[overscroll-behavior-y:contain]` - Prevent scroll from propagating to parent elements

## Implementation Steps

### Step 1: Add Global Styles

Add global styles to the page component to prevent body scrolling:

```jsx
export default function YourPage() {
  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>

      {/* Rest of your component */}
    </>
  );
}
```

### Step 2: Create Panel Refs

Create refs for each scrollable panel:

```javascript
const leftPanelRef = useRef<HTMLDivElement>(null);
const middlePanelRef = useRef<HTMLDivElement>(null);
const rightPanelRef = useRef<HTMLDivElement>(null);
```

### Step 3: Implement Wheel Event Handler

Create the wheel event handler with manual scroll control:

```javascript
useEffect(() => {
  const panels = [leftPanelRef.current, middlePanelRef.current, rightPanelRef.current];

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const canScroll = scrollHeight > clientHeight;

    if (canScroll) {
      const newScrollTop = scrollTop + e.deltaY;
      const maxScroll = scrollHeight - clientHeight;
      target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    }
  };

  panels.forEach((panel) => {
    if (panel) {
      panel.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    }
  });

  return () => {
    panels.forEach((panel) => {
      if (panel) {
        panel.removeEventListener('wheel', handleWheel, { capture: true });
      }
    });
  };
}, []);
```

### Step 4: Apply Refs and CSS Classes

Attach refs and appropriate CSS classes to each scrollable container:

```jsx
<div
  ref={leftPanelRef}
  className="flex-1 min-h-0 overflow-y-auto [overscroll-behavior-y:contain]"
>
  {/* Content */}
</div>
```

## Key Concepts Explained

### Event Capture vs Bubble Phase

JavaScript events propagate in two phases:

1. **Capture Phase** (top-down): From window → document → element
2. **Bubble Phase** (bottom-up): From element → document → window

By using `capture: true`, we intercept wheel events **before** they reach child elements, giving us complete control over scroll behavior.

```javascript
// Without capture: Child elements handle event first
element.addEventListener('wheel', handler); // Bubble phase (default)

// With capture: Parent handles event first
element.addEventListener('wheel', handler, { capture: true }); // Capture phase
```

### Why `passive: false` is Required

By default, modern browsers optimize wheel event listeners by making them "passive" (cannot call `preventDefault()`). We need `passive: false` to enable `preventDefault()` and take manual control:

```javascript
// This would NOT work with passive listeners (default):
element.addEventListener('wheel', (e) => {
  e.preventDefault(); // Would have no effect
});

// Must explicitly set passive: false:
element.addEventListener('wheel', (e) => {
  e.preventDefault(); // Now works!
}, { passive: false });
```

### Overscroll Behavior

The `overscroll-behavior` CSS property controls what happens when scrolling reaches a boundary:

- `auto` (default) - Scroll chains to parent elements
- `contain` - Prevents scroll chaining but allows local effects (bounce on iOS)
- `none` - Prevents both scroll chaining and local effects

```css
/* Apply to body/html to prevent ALL overscroll */
html, body {
  overscroll-behavior: none;
}

/* Apply to panels to prevent scroll propagation */
.scrollable-panel {
  overscroll-behavior-y: contain;
}
```

### Flex Container Scrolling

For scrolling to work inside flex containers, child elements need `min-height: 0` (or `min-width: 0` for horizontal):

```jsx
{/* Without min-h-0, flex items won't shrink below content size */}
<div className="flex flex-col h-full">
  <div className="flex-1 min-h-0 overflow-y-auto">
    {/* This can now scroll */}
  </div>
</div>
```

## Testing

### Manual Testing Checklist

1. **Independent Scrolling**
   - Scroll each panel individually
   - Verify other panels don't move
   - Check page body stays at 0px

2. **Boundary Behavior**
   - Scroll to top of each panel
   - Scroll to bottom of each panel
   - Verify no page scroll occurs

3. **Mouse Movement After Scrolling**
   - Scroll right panel to bottom
   - Move mouse to middle panel
   - Verify no panels move
   - Check page scroll indicator stays at 0px

4. **Overscroll Effects**
   - Rapidly scroll past boundaries
   - Verify no bounce effects
   - Check no momentum transfer to other panels

### Automated Testing with Playwright

```typescript
test('Independent scroll isolation', async ({ page }) => {
  await page.goto('http://localhost:3000/your-page');

  const leftPanel = page.locator('.overflow-y-auto').nth(0);
  const middlePanel = page.locator('.overflow-y-auto').nth(1);
  const rightPanel = page.locator('.overflow-y-auto').nth(2);

  // Get initial positions
  const leftInitial = await leftPanel.evaluate(el => el.scrollTop);
  const middleInitial = await middlePanel.evaluate(el => el.scrollTop);

  // Scroll right panel using real mouse wheel
  const rightBox = await rightPanel.boundingBox();
  if (rightBox) {
    await page.mouse.move(
      rightBox.x + rightBox.width / 2,
      rightBox.y + rightBox.height / 2
    );
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(100);
  }

  // Verify other panels didn't move
  const leftAfter = await leftPanel.evaluate(el => el.scrollTop);
  const middleAfter = await middlePanel.evaluate(el => el.scrollTop);
  const pageScroll = await page.evaluate(() => window.scrollY);

  expect(leftAfter).toBe(leftInitial);
  expect(middleAfter).toBe(middleInitial);
  expect(pageScroll).toBe(0);
});
```

## Common Pitfalls

### 1. Forgetting `min-h-0` on Flex Items

**Problem**: Flex items won't shrink below content size, preventing scroll

```jsx
{/* ❌ Wrong - no min-h-0 */}
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto">
    {/* Won't scroll! */}
  </div>
</div>

{/* ✅ Correct - with min-h-0 */}
<div className="flex flex-col h-full">
  <div className="flex-1 min-h-0 overflow-y-auto">
    {/* Will scroll! */}
  </div>
</div>
```

### 2. Using Bubble Phase Instead of Capture

**Problem**: Child elements handle events before parent, causing inconsistent behavior

```javascript
// ❌ Wrong - bubble phase (default)
panel.addEventListener('wheel', handler);

// ✅ Correct - capture phase
panel.addEventListener('wheel', handler, { capture: true });
```

### 3. Forgetting `passive: false`

**Problem**: `preventDefault()` has no effect, browser continues default scroll

```javascript
// ❌ Wrong - passive listener (default in modern browsers)
panel.addEventListener('wheel', (e) => {
  e.preventDefault(); // No effect!
});

// ✅ Correct - non-passive listener
panel.addEventListener('wheel', (e) => {
  e.preventDefault(); // Works!
}, { passive: false });
```

### 4. Not Setting `overscroll-behavior` on Body

**Problem**: Overscroll effects and scroll chaining still occur

```css
/* ❌ Wrong - missing overscroll-behavior */
html, body {
  overflow: hidden;
  height: 100%;
}

/* ✅ Correct - with overscroll-behavior */
html, body {
  overflow: hidden;
  height: 100%;
  overscroll-behavior: none; /* Critical! */
}
```

### 5. Nested Scrollable Containers Without Proper Refs

**Problem**: Event listener attached to outer container, inner container can't scroll

```jsx
{/* ❌ Wrong - ref on outer non-scrollable div */}
<div ref={rightPanelRef} className="h-full">
  <div className="overflow-y-auto">
    {/* Can't scroll! */}
  </div>
</div>

{/* ✅ Correct - ref on actual scrollable container */}
<div className="h-full">
  <div ref={rightPanelRef} className="overflow-y-auto">
    {/* Can scroll! */}
  </div>
</div>
```

## Browser Compatibility

This solution works across all modern browsers:

- ✅ Chrome/Edge 63+ (Chromium)
- ✅ Firefox 59+
- ✅ Safari 13.1+
- ✅ iOS Safari 13.4+
- ✅ Android Chrome/Firefox

**Note**: `overscroll-behavior` is not supported in IE11, but `overflow: hidden` and manual scroll control still work.

## Performance Considerations

### Event Listener Performance

Using `passive: false` disables browser scroll optimizations, but the performance impact is negligible for modern devices:

- Single-threaded scroll handling
- Minimal JavaScript execution per wheel event
- No layout thrashing or reflows

### Memory Management

Always clean up event listeners in the `useEffect` cleanup function:

```javascript
useEffect(() => {
  // Setup
  panels.forEach(panel => {
    panel?.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  });

  // Cleanup - CRITICAL!
  return () => {
    panels.forEach(panel => {
      panel?.removeEventListener('wheel', handleWheel, { capture: true });
    });
  };
}, []);
```

## Real-World Example

See the complete implementation in:
- **Component**: `src/app/test-story-editor-mockup/page.tsx`
- **Test**: `tests/test-scroll-side-effect.e2e.spec.ts`

## Related Documentation

- [React Resizable Panels](https://github.com/bvaughn/react-resizable-panels)
- [MDN: overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)
- [MDN: EventTarget.addEventListener()](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
- [MDN: WheelEvent](https://developer.mozilla.org/en-US/docs/Web/API/WheelEvent)

## Summary

The independent scrolling solution combines three techniques:

1. **Global scroll prevention** - `overflow: hidden` + `overscroll-behavior: none` on body
2. **Capture phase event handling** - Intercept wheel events before child elements
3. **Manual scroll control** - Programmatically update `scrollTop` with bounds checking

This ensures completely isolated, independent scrolling in multi-panel layouts without any cross-panel interference or unwanted page scrolling.
