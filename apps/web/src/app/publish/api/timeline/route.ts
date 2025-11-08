import { and, eq, gte, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	chapters,
	scenes,
	scheduledPublications,
	stories,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
	try {
		const session = await auth();
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const storyId = searchParams.get("storyId");
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");

		// Get user's stories
		const userStories = await db
			.select({ id: stories.id })
			.from(stories)
			.where(eq(stories.authorId, session.user.id));

		const storyIds = userStories.map((s) => s.id);

		if (storyIds.length === 0) {
			return NextResponse.json({ events: [] });
		}

		// Build query
		const conditions: any[] = [];

		// Filter by story ownership
		conditions.push(
			sql`${scheduledPublications.storyId} IN (${sql.join(
				storyIds.map((id) => sql`${id}`),
				sql`, `,
			)})`,
		);

		if (storyId) {
			conditions.push(eq(scheduledPublications.storyId, storyId));
		}

		if (startDate) {
			conditions.push(
				gte(scheduledPublications.scheduledFor, new Date(startDate)),
			);
		}

		if (endDate) {
			conditions.push(
				lte(scheduledPublications.scheduledFor, new Date(endDate)),
			);
		}

		const results = await db
			.select({
				publication: scheduledPublications,
				scene: scenes,
				chapter: chapters,
			})
			.from(scheduledPublications)
			.leftJoin(scenes, eq(scheduledPublications.sceneId, scenes.id))
			.leftJoin(chapters, eq(scheduledPublications.chapterId, chapters.id))
			.where(and(...conditions));

		const events = results.map((r) => ({
			id: r.publication.id,
			sceneId: r.publication.sceneId,
			chapterId: r.publication.chapterId,
			title: r.scene?.title || r.chapter?.title || "Untitled",
			date: r.publication.scheduledFor,
			status: r.publication.status,
			type: r.scene ? "scene" : "chapter",
		}));

		return NextResponse.json({ events });
	} catch (error) {
		console.error("Failed to fetch timeline:", error);
		return NextResponse.json(
			{ error: "Failed to fetch timeline" },
			{ status: 500 },
		);
	}
}
