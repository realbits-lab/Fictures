# Like/Dislike Implementation Guide

## Overview
Added thumbs up/down like and dislike functionality to comments and scenes on reading pages.

## Completed Work

### 1. Created LikeDislikeButton Component
**File**: `src/components/novels/LikeDislikeButton.tsx`

Features:
- ✅ Thumbs up/down SVG icons
- ✅ Separate buttons for like and dislike
- ✅ Count display for both likes and dislikes
- ✅ Three sizes: sm, md, lg
- ✅ Mutual exclusivity (liking removes dislike and vice versa)
- ✅ Visual feedback with colors (green for like, red for dislike)
- ✅ Supports: story, chapter, scene, comment entity types

### 2. Database Changes

#### Added Tables:
- `comment_dislikes` - Tracks dislikes on comments
- `scene_dislikes` - Tracks dislikes on scenes

#### Updated Tables:
- `comments` - Added `dislike_count` column

#### Schema Relations:
- `commentDislikesRelations` - Relations for comment dislikes
- `sceneDislikesRelations` - Relations for scene dislikes

**Migration Script**: `scripts/add-dislike-tables.mjs`

### 3. API Endpoints

#### Comment Dislike API
**File**: `src/app/api/comments/[commentId]/dislike/route.ts`

- ✅ POST `/api/comments/[commentId]/dislike` - Toggle dislike
- ✅ Removes like if user dislikes (mutual exclusivity)
- ✅ Updates both like and dislike counts
- ✅ Returns current state: `{ liked, disliked, likeCount, dislikeCount }`

#### Updated Comment Like API
**File**: `src/app/api/comments/[commentId]/like/route.ts`

- ✅ Now removes dislike when liking
- ✅ Returns both like and dislike states

## ~~Remaining~~ Completed Implementation Steps

### ✅ Step 1: Update CommentItem Component

**File**: `src/components/novels/CommentItem.tsx`

Replaced the LikeButton with LikeDislikeButton:

```typescript
// Line 147 - Replace:
<LikeButton
  entityId={comment.id}
  entityType="comment"
  initialCount={comment.likeCount}
/>

// With:
<LikeDislikeButton
  entityId={comment.id}
  entityType="comment"
  initialLikeCount={comment.likeCount}
  initialDislikeCount={comment.dislikeCount}
  size="sm"
/>
```

Also update the Comment interface to include dislikeCount:

```typescript
// Line 9 - Add dislikeCount:
interface Comment {
  id: string;
  content: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  parentCommentId: string | null;
  depth: number;
  likeCount: number;
  dislikeCount: number;  // ADD THIS LINE
  replyCount: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}
```

### ✅ Step 2: Add Scene Like/Dislike API Endpoints

Created two new API endpoint files:

#### File: `src/app/api/scenes/[id]/like/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, sceneLikes, sceneDislikes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if scene exists
    const [scene] = await db.select().from(scenes).where(eq(scenes.id, sceneId)).limit(1);
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Check existing like and dislike
    const [existingLike] = await db
      .select()
      .from(sceneLikes)
      .where(and(eq(sceneLikes.sceneId, sceneId), eq(sceneLikes.userId, session.user.id)))
      .limit(1);

    const [existingDislike] = await db
      .select()
      .from(sceneDislikes)
      .where(and(eq(sceneDislikes.sceneId, sceneId), eq(sceneDislikes.userId, session.user.id)))
      .limit(1);

    if (existingLike) {
      // Remove like
      await db.delete(sceneLikes).where(eq(sceneLikes.id, existingLike.id));

      // Get updated counts
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneLikes).where(eq(sceneLikes.sceneId, sceneId));
      const [dislikeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneDislikes).where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: false,
        disliked: !!existingDislike,
        likeCount: likeCount.count,
        dislikeCount: dislikeCount.count,
      });
    } else {
      // Remove dislike if exists
      if (existingDislike) {
        await db.delete(sceneDislikes).where(eq(sceneDislikes.id, existingDislike.id));
      }

      // Add like
      await db.insert(sceneLikes).values({
        id: nanoid(),
        sceneId,
        userId: session.user.id,
        createdAt: new Date(),
      });

      // Get updated counts
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneLikes).where(eq(sceneLikes.sceneId, sceneId));
      const [dislikeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneDislikes).where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: true,
        disliked: false,
        likeCount: likeCount.count,
        dislikeCount: dislikeCount.count,
      });
    }
  } catch (error) {
    console.error('Error toggling scene like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}
```

#### File: `src/app/api/scenes/[id]/dislike/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, sceneLikes, sceneDislikes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const { sceneId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if scene exists
    const [scene] = await db.select().from(scenes).where(eq(scenes.id, sceneId)).limit(1);
    if (!scene) {
      return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
    }

    // Check existing like and dislike
    const [existingLike] = await db
      .select()
      .from(sceneLikes)
      .where(and(eq(sceneLikes.sceneId, sceneId), eq(sceneLikes.userId, session.user.id)))
      .limit(1);

    const [existingDislike] = await db
      .select()
      .from(sceneDislikes)
      .where(and(eq(sceneDislikes.sceneId, sceneId), eq(sceneDislikes.userId, session.user.id)))
      .limit(1);

    if (existingDislike) {
      // Remove dislike
      await db.delete(sceneDislikes).where(eq(sceneDislikes.id, existingDislike.id));

      // Get updated counts
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneLikes).where(eq(sceneLikes.sceneId, sceneId));
      const [dislikeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneDislikes).where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: !!existingLike,
        disliked: false,
        likeCount: likeCount.count,
        dislikeCount: dislikeCount.count,
      });
    } else {
      // Remove like if exists
      if (existingLike) {
        await db.delete(sceneLikes).where(eq(sceneLikes.id, existingLike.id));
      }

      // Add dislike
      await db.insert(sceneDislikes).values({
        id: nanoid(),
        sceneId,
        userId: session.user.id,
        createdAt: new Date(),
      });

      // Get updated counts
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneLikes).where(eq(sceneLikes.sceneId, sceneId));
      const [dislikeCount] = await db.select({ count: sql<number>`count(*)` }).from(sceneDislikes).where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: false,
        disliked: true,
        likeCount: likeCount.count,
        dislikeCount: dislikeCount.count,
      });
    }
  } catch (error) {
    console.error('Error toggling scene dislike:', error);
    return NextResponse.json({ error: 'Failed to toggle dislike' }, { status: 500 });
  }
}
```

### ✅ Step 3: Add Like/Dislike to Scene Display

**File**: `src/components/novels/ChapterReader.tsx`

Added the LikeDislikeButton after each scene content:

```typescript
import { LikeDislikeButton } from './LikeDislikeButton';

// In the scene rendering section (lines 422-445):
{selectedChapter.scenes.map((scene, index) => (
  <section key={scene.id} className="mb-8">
    {selectedChapter.scenes!.length > 1 && (
      <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 opacity-75">
        {scene.title}
      </h3>
    )}
    <div className="whitespace-pre-wrap leading-relaxed">
      {scene.content || (
        <p className="text-gray-500 dark:text-gray-400 italic">
          This scene is empty.
        </p>
      )}
    </div>
    <div className="mt-4 flex items-center justify-end">
      <LikeDislikeButton
        entityId={scene.id}
        entityType="scene"
        initialLikeCount={0}
        initialDislikeCount={0}
        size="md"
      />
    </div>
  </section>
))}
```

Note: The LikeDislikeButton component fetches the actual like/dislike counts and user state on mount, so initialLikeCount and initialDislikeCount can be set to 0.

## Testing Checklist

### Comments
- [ ] Can like a comment
- [ ] Can dislike a comment
- [ ] Liking removes dislike
- [ ] Disliking removes like
- [ ] Counts update correctly
- [ ] Can remove like by clicking again
- [ ] Can remove dislike by clicking again
- [ ] Icons show correct visual state (green/red)

### Scenes
- [ ] Can like a scene
- [ ] Can dislike a scene
- [ ] Liking removes dislike
- [ ] Disliking removes like
- [ ] Counts persist across page reloads
- [ ] Works for authenticated users only

## Design Specifications

### Button Colors
- **Like (active)**: Green (`bg-green-100 text-green-700`)
- **Dislike (active)**: Red (`bg-red-100 text-red-700`)
- **Neutral**: Gray (`bg-gray-100 text-gray-600`)

### Icons
- **Thumbs Up**: SVG thumbs up icon
- **Thumbs Down**: SVG thumbs down icon (rotated thumbs up)

### Sizes
- **sm**: `w-3 h-3` icon, `text-xs` font
- **md**: `w-4 h-4` icon, `text-sm` font
- **lg**: `w-5 h-5` icon, `text-base` font

## Database Schema

```sql
-- comment_dislikes table
CREATE TABLE comment_dislikes (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT comment_dislike_user_unique UNIQUE (comment_id, user_id)
);

-- scene_dislikes table
CREATE TABLE scene_dislikes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT scene_dislike_user_unique UNIQUE (user_id, scene_id)
);

-- Add dislike_count to comments
ALTER TABLE comments ADD COLUMN dislike_count INTEGER DEFAULT 0 NOT NULL;
```

## API Response Format

All like/dislike endpoints return:

```typescript
{
  liked: boolean;        // Whether user has liked
  disliked: boolean;     // Whether user has disliked
  likeCount: number;     // Total like count
  dislikeCount: number;  // Total dislike count
}
```

## Notes

- Likes and dislikes are mutually exclusive per user
- Only authenticated users can like/dislike
- Counts are cached and updated optimistically in the UI
- Database enforces unique constraint (one vote per user per entity)
- Scene likes/dislikes are counted in real-time (no cached column)

## Status

✅ Database schema updated
✅ Migration script created and run
✅ LikeDislikeButton component created
✅ Comment like API updated
✅ Comment dislike API created
✅ Scene like API updated
✅ Scene dislike API created
✅ CommentItem updated to use LikeDislikeButton
✅ ChapterReader updated with scene like/dislike buttons

## Implementation Complete

All features have been implemented:
- Comment replies now show thumbs up/down like/dislike buttons
- Scenes now show thumbs up/down like/dislike buttons at the end of each scene
- Both comments and scenes support mutual exclusivity (liking removes dislike and vice versa)
- All API endpoints return consistent data: `{ liked, disliked, likeCount, dislikeCount }`

## Date
2025-10-23
