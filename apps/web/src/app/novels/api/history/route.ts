import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { readingHistory } from "@/lib/db/schema";

const FORMAT = "novel" as const;

// GET /novels/api/history - Fetch user's novel reading history
export async function GET(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Fetch reading history for novels only, sorted by most recently read
		const history = await db
			.select()
			.from(readingHistory)
			.where(
				and(
					eq(readingHistory.userId, session.user.id),
					eq(readingHistory.readingFormat, FORMAT),
				),
			)
			.orderBy(desc(readingHistory.lastReadAt));

		return NextResponse.json({
			history,
			count: history.length,
			format: FORMAT,
		});
	} catch (error) {
		console.error("Error fetching novel reading history:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reading history" },
			{ status: 500 },
		);
	}
}

// POST /novels/api/history - Record a novel story view
export async function POST(request: NextRequest) {
	try {
		const session = await auth();

		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { storyId, sceneId } = body;

		if (!storyId) {
			return NextResponse.json(
				{ error: "Story ID is required" },
				{ status: 400 },
			);
		}

		// Check if history entry exists for this story in novel format
		const existing = await db
			.select()
			.from(readingHistory)
			.where(
				and(
					eq(readingHistory.userId, session.user.id),
					eq(readingHistory.storyId, storyId),
					eq(readingHistory.readingFormat, FORMAT),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			// Update existing entry
			await db
				.update(readingHistory)
				.set({
					lastReadAt: new Date().toISOString(),
					readCount: existing[0].readCount + 1,
					lastSceneId: sceneId || existing[0].lastSceneId,
				})
				.where(
					and(
						eq(readingHistory.userId, session.user.id),
						eq(readingHistory.storyId, storyId),
						eq(readingHistory.readingFormat, FORMAT),
					),
				);

			return NextResponse.json({
				message: "Novel reading history updated",
				format: FORMAT,
				readCount: existing[0].readCount + 1,
			});
		} else {
			// Create new entry
			await db.insert(readingHistory).values({
				id: nanoid(),
				userId: session.user.id,
				storyId,
				readingFormat: FORMAT,
				lastReadAt: new Date().toISOString(),
				readCount: 1,
				lastSceneId: sceneId || null,
				lastPanelId: null,
				lastPageNumber: null,
				createdAt: new Date().toISOString(),
			});

			return NextResponse.json({
				message: "Novel reading history created",
				format: FORMAT,
				readCount: 1,
			});
		}
	} catch (error) {
		console.error("Error recording novel reading history:", error);
		return NextResponse.json(
			{ error: "Failed to record reading history" },
			{ status: 500 },
		);
	}
}
