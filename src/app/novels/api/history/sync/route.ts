import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingHistory } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface HistoryItem {
  storyId: string;
  timestamp: number;
  sceneId?: string;
}

/**
 * POST /reading/api/history/sync
 * Sync localStorage reading history to server when user logs in
 * Merges local history with existing server history
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body as { items: HistoryItem[] };

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid request body - items must be an array' },
        { status: 400 }
      );
    }

    console.log(`Syncing ${items.length} reading history items for user ${session.user.id}`);

    // Process each item from localStorage
    let syncedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      if (!item.storyId) {
        skippedCount++;
        continue;
      }

      try {
        // Check if entry already exists
        const existing = await db
          .select()
          .from(readingHistory)
          .where(
            and(
              eq(readingHistory.userId, session.user.id),
              eq(readingHistory.storyId, item.storyId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Entry exists - only update if localStorage timestamp is newer
          const existingTimestamp = existing[0].lastReadAt.getTime();
          if (item.timestamp > existingTimestamp) {
            await db
              .update(readingHistory)
              .set({
                lastReadAt: new Date(item.timestamp),
                // Don't increment readCount - this is a sync, not a new view
              })
              .where(
                and(
                  eq(readingHistory.userId, session.user.id),
                  eq(readingHistory.storyId, item.storyId)
                )
              );
            syncedCount++;
          } else {
            // Server has more recent data, skip
            skippedCount++;
          }
        } else {
          // Create new entry from localStorage data
          await db.insert(readingHistory).values({
            id: nanoid(),
            userId: session.user.id,
            storyId: item.storyId,
            lastReadAt: new Date(item.timestamp),
            readCount: 1,
            createdAt: new Date(),
          });
          syncedCount++;
        }
      } catch (itemError) {
        console.error(`Error syncing story ${item.storyId}:`, itemError);
        skippedCount++;
      }
    }

    // Fetch and return merged history
    const mergedHistory = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, session.user.id))
      .orderBy(desc(readingHistory.lastReadAt));

    console.log(
      `Sync complete: ${syncedCount} synced, ${skippedCount} skipped, ${mergedHistory.length} total`
    );

    return NextResponse.json({
      message: 'Reading history synced successfully',
      synced: syncedCount,
      skipped: skippedCount,
      total: mergedHistory.length,
      history: mergedHistory,
    });
  } catch (error) {
    console.error('Error syncing reading history:', error);
    return NextResponse.json(
      { error: 'Failed to sync reading history' },
      { status: 500 }
    );
  }
}
