import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { scenes, sceneLikes, sceneDislikes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

// POST /api/scenes/[id]/like - Toggle like on a scene
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sceneId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if scene exists
    const [scene] = await db
      .select()
      .from(scenes)
      .where(eq(scenes.id, sceneId))
      .limit(1);

    if (!scene) {
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      );
    }

    // Check existing like and dislike
    const [existingLike] = await db
      .select()
      .from(sceneLikes)
      .where(
        and(
          eq(sceneLikes.sceneId, sceneId),
          eq(sceneLikes.userId, session.user.id)
        )
      )
      .limit(1);

    const [existingDislike] = await db
      .select()
      .from(sceneDislikes)
      .where(
        and(
          eq(sceneDislikes.sceneId, sceneId),
          eq(sceneDislikes.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingLike) {
      // Remove like
      await db
        .delete(sceneLikes)
        .where(eq(sceneLikes.id, existingLike.id));

      // Get updated counts
      const [likeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sceneLikes)
        .where(eq(sceneLikes.sceneId, sceneId));

      const [dislikeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sceneDislikes)
        .where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: false,
        disliked: !!existingDislike,
        likeCount: Number(likeCount.count),
        dislikeCount: Number(dislikeCount.count),
      });
    } else {
      // Remove dislike if exists
      if (existingDislike) {
        await db
          .delete(sceneDislikes)
          .where(eq(sceneDislikes.id, existingDislike.id));
      }

      // Add like
      await db
        .insert(sceneLikes)
        .values({
          id: nanoid(),
          sceneId,
          userId: session.user.id,
          createdAt: new Date(),
        });

      // Get updated counts
      const [likeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sceneLikes)
        .where(eq(sceneLikes.sceneId, sceneId));

      const [dislikeCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(sceneDislikes)
        .where(eq(sceneDislikes.sceneId, sceneId));

      return NextResponse.json({
        liked: true,
        disliked: false,
        likeCount: Number(likeCount.count),
        dislikeCount: Number(dislikeCount.count),
      });
    }
  } catch (error) {
    console.error('Error toggling scene like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
