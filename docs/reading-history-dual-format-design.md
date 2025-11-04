# Reading History Dual-Format Design

## Overview

This document outlines the design for separating reading history into two distinct formats: **novels** (text-based) and **comics** (visual/panel-based).

## Problem Statement

Currently, the reading history system tracks all story views without distinguishing between:
1. **Novel format** - Text-based reading with scene-by-scene navigation
2. **Comic format** - Visual reading with panel-by-panel/page-by-page navigation

This creates issues:
- Cannot track separate progress for the same story in different formats
- Cannot provide format-specific "Continue Reading" features
- Cannot analyze user preferences between novel vs comic consumption

## Design Goals

1. **Separation of Concerns** - Track novel and comic reading independently
2. **Same Story, Different Progress** - Allow users to read the same story in both formats with separate progress
3. **Backward Compatibility** - Migrate existing data without loss
4. **Format-Specific Tracking** - Store appropriate progress data for each format
5. **Clean API** - Simple, intuitive interface for components

## Database Schema Changes

### Current Schema

```sql
CREATE TABLE reading_history (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  story_id text NOT NULL,
  last_read_at timestamp DEFAULT now() NOT NULL,
  read_count integer DEFAULT 1 NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT user_story_unique UNIQUE(user_id, story_id)
);
```

### New Schema

```sql
-- Add reading format enum
CREATE TYPE reading_format AS ENUM ('novel', 'comic');

-- Updated table with format support
CREATE TABLE reading_history (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  story_id text NOT NULL,
  reading_format reading_format NOT NULL DEFAULT 'novel',
  last_read_at timestamp DEFAULT now() NOT NULL,
  read_count integer DEFAULT 1 NOT NULL,

  -- Format-specific progress tracking
  last_scene_id text, -- For novel format (which scene was last read)
  last_panel_id text, -- For comic format (which panel was last viewed)
  last_page_number integer, -- For comic format (which page was last viewed)

  created_at timestamp DEFAULT now() NOT NULL,

  -- Updated unique constraint to include format
  CONSTRAINT user_story_format_unique UNIQUE(user_id, story_id, reading_format)
);

-- Indexes for performance
CREATE INDEX reading_history_user_format_idx ON reading_history(user_id, reading_format);
CREATE INDEX reading_history_story_format_idx ON reading_history(story_id, reading_format);
CREATE INDEX reading_history_last_read_at_idx ON reading_history(last_read_at DESC);
```

### Key Changes

1. **`reading_format` column** - Enum with values 'novel' or 'comic'
2. **Updated unique constraint** - Now `(user_id, story_id, reading_format)` allowing separate entries per format
3. **Format-specific fields** - Optional fields for tracking progress in each format
4. **Additional indexes** - For efficient filtering by format

## Migration Strategy

### Step 1: Add New Columns (Non-Breaking)

```sql
-- Add reading_format column with default 'novel' for existing rows
ALTER TABLE reading_history
ADD COLUMN reading_format text NOT NULL DEFAULT 'novel';

-- Add format-specific progress columns
ALTER TABLE reading_history ADD COLUMN last_scene_id text;
ALTER TABLE reading_history ADD COLUMN last_panel_id text;
ALTER TABLE reading_history ADD COLUMN last_page_number integer;
```

### Step 2: Drop Old Constraint, Add New One

```sql
-- Drop old unique constraint
ALTER TABLE reading_history
DROP CONSTRAINT IF EXISTS user_story_unique;

-- Add new unique constraint including format
ALTER TABLE reading_history
ADD CONSTRAINT user_story_format_unique UNIQUE(user_id, story_id, reading_format);
```

### Step 3: Add Indexes

```sql
CREATE INDEX IF NOT EXISTS reading_history_user_format_idx
ON reading_history(user_id, reading_format);

CREATE INDEX IF NOT EXISTS reading_history_story_format_idx
ON reading_history(story_id, reading_format);
```

### Step 4: Backfill Existing Data (Optional)

```sql
-- All existing entries are already 'novel' format by default
-- If we want to infer format from sceneId presence, we could:
-- UPDATE reading_history SET last_scene_id = scene_id WHERE scene_id IS NOT NULL;
```

## Code Changes

### 1. Type Definitions

```typescript
// src/types/novels-history.ts
export type ReadingFormat = 'novel' | 'comic';

export interface HistoryItem {
  storyId: string;
  timestamp: number;
  format: ReadingFormat;
  sceneId?: string; // For novels
  panelId?: string; // For comics
  pageNumber?: number; // For comics
}

export interface StorageData {
  version: number;
  items: HistoryItem[];
}
```

### 2. Reading History Manager Updates

```typescript
// src/lib/storage/novels-history-manager.ts

class ReadingHistoryManager {
  // Separate storage keys for each format
  private getStorageKey(format: ReadingFormat): string {
    return `fictures:reading-history:${format}`;
  }

  // Add story to history with format
  public addToHistory(
    storyId: string,
    format: ReadingFormat,
    options?: {
      sceneId?: string;
      panelId?: string;
      pageNumber?: number;
    }
  ): void {
    // Implementation with format support
  }

  // Get history for specific format
  public getHistory(format: ReadingFormat): Set<string> {
    // Implementation
  }

  // Sync with server for specific format
  public async syncWithServer(
    userId: string,
    format: ReadingFormat
  ): Promise<Set<string> | null> {
    // Implementation
  }
}
```

### 3. API Endpoint Updates

```typescript
// src/app/novels/api/history/route.ts
// src/app/comics/api/history/route.ts

export async function POST(request: NextRequest) {
  const { storyId, sceneId, panelId, pageNumber } = await request.json();
  const format = request.url.includes('/novels/') ? 'novel' : 'comic';

  // Insert or update with format
  await db.insert(readingHistory).values({
    id: nanoid(),
    userId: session.user.id,
    storyId,
    readingFormat: format,
    lastSceneId: sceneId,
    lastPanelId: panelId,
    lastPageNumber: pageNumber,
    lastReadAt: new Date(),
    readCount: 1,
  }).onConflictDoUpdate({
    target: [
      readingHistory.userId,
      readingHistory.storyId,
      readingHistory.readingFormat
    ],
    set: {
      lastReadAt: new Date(),
      readCount: sql`${readingHistory.readCount} + 1`,
      lastSceneId: sceneId || sql`${readingHistory.lastSceneId}`,
      lastPanelId: panelId || sql`${readingHistory.lastPanelId}`,
      lastPageNumber: pageNumber || sql`${readingHistory.lastPageNumber}`,
    }
  });
}

export async function GET(request: NextRequest) {
  const format = request.url.includes('/novels/') ? 'novel' : 'comic';

  const history = await db
    .select()
    .from(readingHistory)
    .where(
      and(
        eq(readingHistory.userId, session.user.id),
        eq(readingHistory.readingFormat, format)
      )
    )
    .orderBy(desc(readingHistory.lastReadAt));

  return NextResponse.json({ history });
}
```

### 4. Component Updates

```typescript
// src/components/browse/StoryGrid.tsx

export function StoryGrid({
  stories,
  pageType = 'reading' // 'novels' | 'comics'
}: StoryGridProps) {
  const format: ReadingFormat = pageType === 'novels' ? 'novel' : 'comic';

  // Fetch history for specific format
  useEffect(() => {
    async function fetchHistory() {
      const response = await fetch(`/${pageType}/api/history`);
      // ... format-specific history
    }
    fetchHistory();
  }, [pageType]);

  // Record view with format
  const recordStoryView = async (storyId: string) => {
    readingHistoryManager.addToHistory(storyId, format);

    await fetch(`/${pageType}/api/history`, {
      method: 'POST',
      body: JSON.stringify({ storyId, format })
    });
  };
}
```

## localStorage Structure

### Before (Single Key)

```json
{
  "fictures:reading-history": {
    "version": 1,
    "items": [
      { "storyId": "story_1", "timestamp": 1234567890 }
    ]
  }
}
```

### After (Format-Specific Keys)

```json
{
  "fictures:reading-history:novel": {
    "version": 2,
    "items": [
      {
        "storyId": "story_1",
        "timestamp": 1234567890,
        "format": "novel",
        "sceneId": "scene_xyz"
      }
    ]
  },
  "fictures:reading-history:comic": {
    "version": 2,
    "items": [
      {
        "storyId": "story_1",
        "timestamp": 1234567891,
        "format": "comic",
        "panelId": "panel_abc",
        "pageNumber": 5
      }
    ]
  }
}
```

## Benefits

1. **Separate Progress** - Users can read the same story as both novel and comic with independent progress
2. **Better Analytics** - Track which format users prefer
3. **Improved UX** - "Continue Reading" can show correct position for each format
4. **Future-Proof** - Easy to add more formats (e.g., audio, interactive)

## Testing Strategy

1. **Unit Tests** - Test reading history manager with both formats
2. **Integration Tests** - Test API endpoints for novel and comic separately
3. **E2E Tests** - Test user journey reading same story in both formats
4. **Migration Tests** - Verify existing data migrates correctly

## Rollout Plan

1. **Phase 1** - Database migration (add columns, update constraints)
2. **Phase 2** - Update backend APIs and manager
3. **Phase 3** - Update frontend components
4. **Phase 4** - Test thoroughly
5. **Phase 5** - Deploy to production
6. **Phase 6** - Monitor and verify

## Example User Flow

1. User reads "Story A" as a **novel** → Progress saved with `format: 'novel'`, `sceneId: 'scene_5'`
2. User switches to read "Story A" as a **comic** → New entry created with `format: 'comic'`, `pageNumber: 1`
3. User returns to **novel** format → Resumes at scene 5 (not page 1)
4. User returns to **comic** format → Resumes at page 1 (not scene 5)

## Future Enhancements

1. **Format Conversion Tracking** - Track when users switch between formats
2. **Format Preferences** - Learn which format users prefer per genre
3. **Smart Recommendations** - Suggest format based on user history
4. **Progress Sync** - Optionally sync progress between formats (e.g., scene 5 in novel = page 10 in comic)
