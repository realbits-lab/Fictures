import { and, desc, eq, isNotNull } from "drizzle-orm";
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

        // Get published scenes as publication history
        // Join with chapters and stories tables to filter by author
        const publishedScenes = await db
            .select({
                id: scenes.id,
                title: scenes.title,
                publishedAt: scenes.publishedAt,
                chapterId: scenes.chapterId,
            })
            .from(scenes)
            .innerJoin(chapters, eq(scenes.chapterId, chapters.id))
            .innerJoin(stories, eq(chapters.storyId, stories.id))
            .where(
                and(
                    eq(stories.authorId, session.user.id),
                    isNotNull(scenes.publishedAt),
                ),
            )
            .orderBy(desc(scenes.publishedAt))
            .limit(50);

        const publications = publishedScenes.map((scene) => ({
            id: scene.id,
            title: scene.title || "Untitled Scene",
            publishedAt: scene.publishedAt,
            views: Math.floor(Math.random() * 1000) + 100, // Mock data
            comments: Math.floor(Math.random() * 50) + 5,
            reactions: Math.floor(Math.random() * 200) + 20,
            status: "published",
            engagement: Math.floor(Math.random() * 30) + 70, // 70-100%
        }));

        const publishHistory = {
            publications,
            totalPublished: publications.length,
            thisMonth: publications.filter((p) => {
                if (!p.publishedAt) return false;
                const publishDate = new Date(p.publishedAt);
                const now = new Date();
                return (
                    publishDate.getMonth() === now.getMonth() &&
                    publishDate.getFullYear() === now.getFullYear()
                );
            }).length,
        };

        return NextResponse.json(publishHistory);
    } catch (error) {
        console.error("Publish history API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch publish history" },
            { status: 500 },
        );
    }
}
