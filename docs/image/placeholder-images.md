# Placeholder Images Guide

## Overview

The Fictures platform uses local placeholder images instead of external placeholder services (like placeholder.co). This ensures faster loading, consistent design, and no external dependencies.

## Available Placeholders

### 1. Story Placeholder
- **File**: `/public/images/placeholder-story.svg`
- **Dimensions**: 1344×768 (7:4 aspect ratio)
- **Use for**: Story covers, scene images, setting visuals
- **Design**: Book icon with gradient background

### 2. Character Placeholder
- **File**: `/public/images/placeholder-character.svg`
- **Dimensions**: 1024×1024 (square)
- **Use for**: Character portraits and profile images
- **Design**: Character silhouette with gradient background

### 3. Inline SVG Placeholder
- **Type**: Component-level fallback
- **Use for**: Generic fallback when no specific placeholder type is set
- **Design**: Lightweight book icon SVG rendered inline

## Usage

### Basic Usage (Default - Inline SVG)

```tsx
import { StoryImage } from '@/components/ui/story-image';

<StoryImage
  src={imageUrl || ''}
  alt="Story title"
  fill
  className="object-cover"
/>
```

### Story Placeholder

```tsx
<StoryImage
  src={imageUrl || ''}
  alt="Story title"
  fill
  className="object-cover"
  placeholderType="story" // Uses /images/placeholder-story.svg
/>
```

### Character Placeholder

```tsx
<StoryImage
  src={characterImageUrl || ''}
  alt="Character name"
  fill
  className="object-cover"
  placeholderType="character" // Uses /images/placeholder-character.svg
/>
```

## Placeholder Behavior

The `StoryImage` component automatically shows a placeholder when:
1. The `src` prop is empty or undefined
2. The image fails to load (404, network error, etc.)

### Placeholder Priority

1. **Image placeholders** (`story` or `character` type) - Used when `placeholderType` is specified
2. **Inline SVG placeholder** - Default fallback for all other cases

## Image Dimensions Reference

| Type | Dimensions | Aspect Ratio | Usage |
|------|-----------|--------------|-------|
| Story/Scene/Setting | 1344×768 | 7:4 | Story covers, scenes, settings |
| Character Portrait | 1024×1024 | 1:1 | Character images |
| Display (UI) | aspect-video | 16:9 | Story card display containers |

## Migration from placeholder.co

The platform previously supported placeholder.co in `next.config.mjs` but it was never actually used. The configuration has been removed in favor of local placeholders:

**Before:**
```javascript
{
  protocol: 'https',
  hostname: 'placeholder.co',
  port: '',
  pathname: '/**',
}
```

**After:**
Local SVG files in `/public/images/` with no external dependencies.

## Benefits of Local Placeholders

1. **Performance**: No external HTTP requests for placeholder images
2. **Reliability**: No dependency on external services
3. **Consistency**: Unified design across all placeholder types
4. **Privacy**: No data sent to third-party services
5. **Offline Support**: Works even without internet connection

## Customization

To customize placeholder designs:

1. Edit the SVG files directly in `/public/images/`
2. Update gradients, colors, or icons as needed
3. Ensure dimensions remain consistent:
   - Story: 1344×768 (7:4)
   - Character: 1024×1024 (1:1)

## Dark Mode Support

The inline SVG placeholder automatically adapts to dark mode using CSS color variables. For custom image placeholders, consider creating separate dark mode versions if needed.

## Example Implementation

See `src/components/browse/StoryGrid.tsx` for a complete example of StoryImage usage with proper placeholder handling in both card and table views.
