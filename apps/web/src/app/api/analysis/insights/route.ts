import { and, desc, eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, storyInsights } from "@/lib/schemas/database";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { searchParams } = new URL(request.url);
        const storyId = searchParams.get("storyId");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        const userStories = await db
            .select({ id: stories.id })
            .from(stories)
            .where(eq(stories.authorId, session.user.id));

        const storyIds = userStories.map((s) => s.id);

        if (storyIds.length === 0) {
            return NextResponse.json({ insights: [] });
        }

        let whereConditions = [inArray(storyInsights.storyId, storyIds)];

        if (storyId) {
            whereConditions = [eq(storyInsights.storyId, storyId)];
        }

        if (unreadOnly) {
            whereConditions.push(eq(storyInsights.isRead, false));
        }

        const insights = await db
            .select()
            .from(storyInsights)
            .where(and(...whereConditions))
            .orderBy(desc(storyInsights.createdAt))
            .limit(50);

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("Failed to fetch insights:", error);
        return NextResponse.json(
            { error: "Failed to fetch insights" },
            { status: 500 },
        );
    }
}
