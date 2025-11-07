import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { readingHistory } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { HistoryItem, ReadingFormat } from '@/types/reading-history';

const FORMAT: ReadingFormat = 'comic';

/**
 * POST /comics/api/history/sync
 * Sync localStorage reading history to server when user logs in
 * Merges local history with existing server history for comic format
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

    console.log(`Syncing ${items.length} comic reading history items for user ${session.user.id}`);

    // Process each item from localStorage
    let syncedCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      if (!item.storyId) {
        skippedCount++;
        continue;
      }

      try {
        // Check if entry already exists for this story in comic format
        const existing = await db
          .select()
          .from(readingHistory)
          .where(
            and(
              eq(readingHistory.userId, session.user.id),
              eq(readingHistory.storyId, item.storyId),
              eq(readingHistory.readingFormat, FORMAT)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Entry exists - only update if localStorage timestamp is newer
          const existingTimestamp = new Date(existing[0].lastReadAt).getTime();
          if (item.timestamp > existingTimestamp) {
            await db
              .update(readingHistory)
              .set({
                lastReadAt: new Date(item.timestamp).toISOString(),
                lastPanelId: item.panelId || existing[0].lastPanelId,
                lastPageNumber: item.pageNumber !== undefined ? item.pageNumber : existing[0].lastPageNumber,
                // Don't increment readCount - this is a sync, not a new view
              })
              .where(
                and(
                  eq(readingHistory.userId, session.user.id),
                  eq(readingHistory.storyId, item.storyId),
                  eq(readingHistory.readingFormat, FORMAT)
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
            readingFormat: FORMAT,
            lastReadAt: new Date(item.timestamp).toISOString(),
            readCount: 1,
            lastSceneId: null,
            lastPanelId: item.panelId || null,
            lastPageNumber: item.pageNumber !== undefined ? item.pageNumber : null,
            createdAt: new Date().toISOString(),
          });
          syncedCount++;
        }
      } catch (itemError) {
        console.error(`Error syncing comic story ${item.storyId}:`, itemError);
        skippedCount++;
      }
    }

    // Fetch and return merged history for comic format
    const mergedHistory = await db
      .select()
      .from(readingHistory)
      .where(
        and(
          eq(readingHistory.userId, session.user.id),
          eq(readingHistory.readingFormat, FORMAT)
        )
      )
      .orderBy(desc(readingHistory.lastReadAt));

    console.log(
      `Sync complete: ${syncedCount} synced, ${skippedCount} skipped, ${mergedHistory.length} total comic entries`
    );

    return NextResponse.json({
      message: 'Comic reading history synced successfully',
      format: FORMAT,
      synced: syncedCount,
      skipped: skippedCount,
      total: mergedHistory.length,
      history: mergedHistory,
    });
  } catch (error) {
    console.error('Error syncing comic reading history:', error);
    return NextResponse.json(
      { error: 'Failed to sync reading history' },
      { status: 500 }
    );
  }
}
