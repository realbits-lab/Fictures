# Comic UI Integration Guide

## Overview

This guide shows how to integrate the new Comic Status Card component into your Studio UI.

## Component: ComicStatusCard

**Location:** `src/components/comic/comic-status-card.tsx`

**Purpose:** Display comic status and provide publish/unpublish controls for scene comics.

### Props

```typescript
interface ComicStatusCardProps {
  sceneId: string;                    // Scene ID
  comicStatus: 'none' | 'draft' | 'published';
  comicPanelCount?: number;           // Number of panels
  comicPublishedAt?: string | null;   // Publication timestamp
  comicGeneratedAt?: string | null;   // Generation timestamp
  onStatusChange?: () => void;        // Callback after status change
}
```

### Features

- **Status Badge**: Shows current comic status (None, Draft, Published)
- **Panel Count**: Displays number of generated panels
- **Timestamps**: Shows when generated and published
- **Action Buttons**:
  - Draft: "Publish Comic" and "Regenerate"
  - Published: "Unpublish Comic"
  - None: Help text directing to generation
- **Error Handling**: Shows success/error messages
- **Loading States**: Disables buttons during API calls

---

## Integration Example

### 1. Add to Scene Editor

**File:** `src/components/writing/SceneEditor.tsx`

```tsx
import { ComicStatusCard } from '@/components/comic/comic-status-card';

// In your SceneEditor component:
export function SceneEditor({ sceneId, ... }) {
  // Fetch scene data with comic status
  const { data: sceneData, mutate } = useSWR(
    `/api/scenes/${sceneId}`,
    fetcher
  );

  const handleComicStatusChange = () => {
    // Refresh scene data after comic status change
    mutate();
  };

  return (
    <div className="space-y-6">
      {/* Existing content */}

      {/* Comic Panel Generator */}
      <ComicPanelGeneratorButton
        sceneId={sceneId}
        onComplete={handleComicStatusChange}
      />

      {/* NEW: Comic Status Card */}
      {sceneData && (
        <ComicStatusCard
          sceneId={sceneId}
          comicStatus={sceneData.comicStatus}
          comicPanelCount={sceneData.comicPanelCount}
          comicPublishedAt={sceneData.comicPublishedAt}
          comicGeneratedAt={sceneData.comicGeneratedAt}
          onStatusChange={handleComicStatusChange}
        />
      )}
    </div>
  );
}
```

### 2. Update Scene API Response

**File:** `src/app/api/scenes/[id]/route.ts`

Ensure your scene GET endpoint returns the new comic fields:

```typescript
export async function GET(req, { params }) {
  const scene = await db.query.scenes.findFirst({
    where: eq(scenes.id, params.id),
  });

  return NextResponse.json({
    scene: {
      ...scene,
      // Ensure these fields are included:
      comicStatus: scene.comicStatus,
      comicPanelCount: scene.comicPanelCount,
      comicPublishedAt: scene.comicPublishedAt,
      comicGeneratedAt: scene.comicGeneratedAt,
    },
  });
}
```

### 3. Update TypeScript Types

**File:** `src/types/scene.ts` (or wherever your Scene type is defined)

```typescript
export interface Scene {
  // ... existing fields

  // Comic fields
  comicStatus: 'none' | 'draft' | 'published';
  comicPanelCount: number;
  comicPublishedAt: string | null;
  comicUnpublishedAt: string | null;
  comicPublishedBy: string | null;
  comicUnpublishedBy: string | null;
  comicGeneratedAt: string | null;
  comicVersion: number;
}
```

---

## Workflow Example

### Text First, Comics Later

1. **Write Scene Text**
   - Author writes scene content
   - Publishes text (visibility: 'public')
   - Text appears at `/novels/[storyId]`

2. **Generate Comics**
   - Click "Generate Comic Panels"
   - System creates comic panels
   - Status: `comicStatus: 'draft'`
   - Comics NOT visible to readers

3. **Review and Publish Comics**
   - Author previews comic panels
   - Click "Publish Comic" in ComicStatusCard
   - Status: `comicStatus: 'published'`
   - Comics appear at `/comics/[storyId]`

### Both Together

1. **Generate Complete Story** (existing workflow)
   - Generate text + comics
   - Both start in draft/private

2. **Publish Independently**
   - Publish text → visible at `/novels/[storyId]`
   - Publish comics → visible at `/comics/[storyId]`

---

## UI States

### State 1: No Comics (`comicStatus: 'none'`)

```
┌─────────────────────────────────────┐
│ 📷 Comic Status          🔴 No Comics│
├─────────────────────────────────────┤
│ Generate comic panels first to      │
│ enable publishing                   │
└─────────────────────────────────────┘
```

### State 2: Draft Comics (`comicStatus: 'draft'`)

```
┌─────────────────────────────────────┐
│ 📷 Comic Status          ⚠️  Draft   │
├─────────────────────────────────────┤
│ Panels: 6                           │
│ Generated: 2025-10-26               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👁️  Publish Comic                │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🔄 Regenerate                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Preview your comic before publishing│
└─────────────────────────────────────┘
```

### State 3: Published Comics (`comicStatus: 'published'`)

```
┌─────────────────────────────────────┐
│ 📷 Comic Status          ✅ Published│
├─────────────────────────────────────┤
│ Panels: 6                           │
│ Generated: 2025-10-26               │
│ Published: 2025-10-26               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🚫 Unpublish Comic               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Comic is visible at /comics/[id]    │
└─────────────────────────────────────┘
```

---

## API Endpoints Used

The ComicStatusCard component calls these endpoints:

1. **Publish**: `POST /api/scenes/[id]/comic/publish`
2. **Unpublish**: `POST /api/scenes/[id]/comic/unpublish`
3. **Regenerate**: `POST /api/scenes/[id]/comic/generate` (with `regenerate: true`)

All endpoints:
- Require authentication
- Verify scene ownership
- Return updated scene data
- Handle errors gracefully

---

## Testing Checklist

- [ ] Component renders for scenes with no comics
- [ ] Component renders for scenes with draft comics
- [ ] Component renders for scenes with published comics
- [ ] Publish button works and updates status
- [ ] Unpublish button works and reverts status
- [ ] Regenerate button triggers new generation
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Component refreshes after status changes
- [ ] Timestamps format correctly
- [ ] Panel count displays correctly

---

## Styling

The component uses:
- **Card**: UI wrapper with header/content
- **Badge**: Status indicators (success/warning/secondary)
- **Button**: Action buttons with variants (primary/destructive/outline)
- **Alert**: Success/error messages
- **Icons**: Lucide React icons

All styling is consistent with existing UI components and supports dark mode.

---

## Future Enhancements

Potential additions to the ComicStatusCard:

1. **Preview Button**: View comic panels before publishing
2. **Schedule Publishing**: Set future publish date
3. **Version History**: Track comic regenerations
4. **Analytics**: Show comic view count
5. **Export**: Download comic panels
6. **Settings**: Configure panel count, style, etc.

---

## Summary

The ComicStatusCard provides a complete UI for managing scene comic status:
- ✅ Shows current status with visual badges
- ✅ Displays panel count and timestamps
- ✅ Provides publish/unpublish actions
- ✅ Handles errors and success states
- ✅ Integrates seamlessly with existing Studio UI

Simply add it to your SceneEditor after the ComicPanelGeneratorButton and pass the scene's comic fields as props.
