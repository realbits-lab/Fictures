# Comics Storage Architecture Update

## Summary

Updated comics panel storage path from `/scenes/` to `/comics/` for better semantic clarity and architectural consistency.

## Changes Made

### 1. Image Generation Service
**File**: `src/lib/services/image-generation.ts`

**Changed**:
```typescript
// OLD (confusing)
filename = `stories/${storyId}/scenes/${sceneId}/panels/panel-${panelNumber}-original.png`;

// NEW (clear first-class content type)
filename = `stories/${storyId}/comics/${sceneId}/panel-${panelNumber}.png`;
```

### 2. Documentation
**File**: `docs/comics-generation-system.md`

**Updated storage architecture diagram** to show:
```
stories/{storyId}/
  ├── story/      # Story cover images (1 per story)
  ├── character/  # Character portraits (1 per character)
  ├── setting/    # Setting visuals (1 per setting)
  ├── scene/      # Scene illustrations (1 per scene) ⬅️ singular
  └── comics/     # Comic panels (first-class content type) ⬅️ NEW
      └── {sceneId}/
          ├── panel-1.png
          ├── panel-2.png
          └── panel-3.png
```

## Rationale

### Problems with Old Architecture (`/scenes/`)
1. **Confusing naming**: `scene` vs `scenes` looked like inconsistency
2. **Mixed principles**: 
   - Scene images used flat structure (`scene/{imageId}`)
   - Comics used nested structure (`scenes/{sceneId}/panels/`)
3. **Wrong categorization**: Comics treated as "scene images" instead of distinct content type

### Benefits of New Architecture (`/comics/`)

1. **Clear semantic separation**:
   - Scene illustrations = single hero image for novel reading
   - Comic panels = sequential visual storytelling for comic reading
   
2. **Consistent principles**:
   - Flat structure for single images (`story/`, `character/`, `scene/`)
   - Nested structure for multi-image content (`comics/{sceneId}/`)

3. **First-class content type**:
   - Comics recognized as separate reading format
   - Easy to add comic-specific features (covers, extras, etc.)
   
4. **Better management**:
   - Delete all panels for scene: remove single directory
   - Clear visual hierarchy in blob storage
   - No confusion with scene illustrations

## URL Format

### Before
```
https://[blob].vercel-storage.com/stories/3JpLd.../scenes/s25AR.../panels/panel-1-original.png
                                                   ^^^^^^ ^^^^^^^^^^^^^ ^^^^^^
                                                   confusing hierarchy
```

### After
```
https://[blob].vercel-storage.com/stories/3JpLd.../comics/s25AR.../panel-1.png
                                                   ^^^^^^ ^^^^^^^^^ ^^^^^^^^
                                                   clear content type
```

## Migration Notes

- **Code**: Updated `src/lib/services/image-generation.ts`
- **Documentation**: Updated `docs/comics-generation-system.md`
- **Database**: No changes needed (stores URLs as text)
- **Existing images**: Old paths still work, new generations use new path
- **Frontend**: No changes needed (reads URLs from database)

## Date
2025-10-26
