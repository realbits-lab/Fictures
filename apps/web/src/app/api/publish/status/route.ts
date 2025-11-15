import { desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/schemas/database";

export async function GET(_request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get user's stories for scheduling
        const _userStories = await db
            .select()
            .from(stories)
            .where(eq(stories.authorId, session.user.id))
            .orderBy(desc(stories.updatedAt))
            .limit(10);

        // Get user's scenes by joining with chapters and stories
        const userScenes = await db
            .select({
                id: scenes.id,
                title: scenes.title,
                summary: scenes.summary,
                novelStatus: scenes.novelStatus,
                chapterId: scenes.chapterId,
                updatedAt: scenes.updatedAt,
            })
            .from(scenes)
            .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
            .innerJoin(stories, eq(chapters.storyId, stories.id))
            .where(eq(stories.authorId, session.user.id))
            .orderBy(desc(scenes.updatedAt))
            .limit(20);

        // Mock publish status data based on actual user data
        const scheduledItems = userScenes.slice(0, 4).map((scene, index) => ({
            id: scene.id,
            date: new Date(
                Date.now() + (index + 1) * 24 * 60 * 60 * 1000,
            ).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
            }),
            title: scene.title || `Scene ${index + 1}`,
            time: ["12:00 PM", "2:00 PM", "6:00 PM", "9:00 AM"][index],
            status: ["ready", "draft", "planned", "idea"][index],
        }));

        // For now, just use the first scene since there's no 'completed' status
        const readyToPublish = userScenes[0];

        const publishStatus = {
            scheduledItems,
            readyToPublish: readyToPublish
                ? {
                      id: readyToPublish.id,
                      title: readyToPublish.title || "Untitled Chapter",
                      shortTitle:
                          readyToPublish.title?.substring(0, 20) || "Untitled",
                      preview:
                          `${readyToPublish.summary?.substring(0, 150)}...` ||
                          "No preview available",
                      scheduledTime: "Tomorrow at 2:00 PM",
                      communityPoll: '"What happens next?"',
                  }
                : null,
            pending: userScenes.filter((s) => s.novelStatus === "draft").length,
        };

        return NextResponse.json(publishStatus);
    } catch (error) {
        console.error("Publish status API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch publish status" },
            { status: 500 },
        );
    }
}
