import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readingHistory } from "@/lib/schemas/drizzle";
import type { HistoryItem, ReadingFormat } from "@/types/reading-history";

/**
 * POST /api/novels/history/sync
 * Sync localStorage reading history to server when user logs in
 * Merges local history with existing server history for novel format
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const { items, format = "novel" } = body as {
            items: HistoryItem[];
            format?: ReadingFormat;
        };

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid request body - items must be an array" },
                { status: 400 },
            );
        }

        console.log(
            `Syncing ${items.length} ${format} reading history items for user ${session.user.id}`,
        );

        // Process each item from localStorage
        let syncedCount = 0;
        let skippedCount = 0;

        for (const item of items) {
            if (!item.storyId) {
                skippedCount++;
                continue;
            }

            try {
                // Check if entry already exists for this story + format
                const existing = await db
                    .select()
                    .from(readingHistory)
                    .where(
                        and(
                            eq(readingHistory.userId, session.user.id),
                            eq(readingHistory.storyId, item.storyId),
                            eq(readingHistory.readingFormat, format),
                        ),
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
                                lastSceneId:
                                    item.sceneId || existing[0].lastSceneId,
                                lastPanelId:
                                    item.panelId || existing[0].lastPanelId,
                                lastPageNumber:
                                    item.pageNumber ||
                                    existing[0].lastPageNumber,
                                // Don't increment readCount - this is a sync, not a new view
                            })
                            .where(
                                and(
                                    eq(readingHistory.userId, session.user.id),
                                    eq(readingHistory.storyId, item.storyId),
                                    eq(readingHistory.readingFormat, format),
                                ),
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
                        readingFormat: format,
                        lastReadAt: new Date(item.timestamp),
                        readCount: 1,
                        lastSceneId: item.sceneId || null,
                        lastPanelId: item.panelId || null,
                        lastPageNumber: item.pageNumber || null,
                        createdAt: new Date().toISOString(),
                    });
                    syncedCount++;
                }
            } catch (itemError) {
                console.error(
                    `Error syncing ${format} story ${item.storyId}:`,
                    itemError,
                );
                skippedCount++;
            }
        }

        // Fetch and return merged history for this format
        const mergedHistory = await db
            .select()
            .from(readingHistory)
            .where(
                and(
                    eq(readingHistory.userId, session.user.id),
                    eq(readingHistory.readingFormat, format),
                ),
            )
            .orderBy(desc(readingHistory.lastReadAt));

        console.log(
            `Sync complete: ${syncedCount} synced, ${skippedCount} skipped, ${mergedHistory.length} total ${format} entries`,
        );

        return NextResponse.json({
            message: `${format} reading history synced successfully`,
            format,
            synced: syncedCount,
            skipped: skippedCount,
            total: mergedHistory.length,
            history: mergedHistory,
        });
    } catch (error) {
        console.error("Error syncing reading history:", error);
        return NextResponse.json(
            { error: "Failed to sync reading history" },
            { status: 500 },
        );
    }
}
