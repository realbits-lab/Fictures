import { and, desc, eq, isNotNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, stories } from "@/lib/schemas/drizzle";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        // Get the latest published chapter for analysis
        // Join with stories table to filter by author
        const latestChapter = await db
            .select({
                id: chapters.id,
                title: chapters.title,
                publishedAt: chapters.publishedAt,
                storyId: chapters.storyId,
            })
            .from(chapters)
            .innerJoin(stories, eq(chapters.storyId, stories.id))
            .where(
                and(
                    eq(stories.authorId, session.user.id),
                    isNotNull(chapters.publishedAt),
                ),
            )
            .orderBy(desc(chapters.publishedAt))
            .limit(1);

        const chapter = latestChapter[0];

        // Mock analysis data
        const publishAnalysis = {
            latestChapter: chapter
                ? {
                      id: chapter.id,
                      title: chapter.title || "Latest Chapter",
                      publishedAgo: getTimeAgo(chapter.publishedAt!),
                      views: Math.floor(Math.random() * 5000) + 1000,
                      comments: Math.floor(Math.random() * 200) + 50,
                      reactions: Math.floor(Math.random() * 500) + 100,
                      rating: (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0
                      engagementRate: Math.floor(Math.random() * 20) + 80, // 80-100%
                      trendingRank: Math.floor(Math.random() * 10) + 1,
                      genre: "Fantasy",
                  }
                : {
                      title: "No published chapters",
                      publishedAgo: "N/A",
                      views: 0,
                      comments: 0,
                      reactions: 0,
                      rating: "0.0",
                      engagementRate: 0,
                      trendingRank: 0,
                      genre: "N/A",
                  },
            prepublishBuzz: {
                theories: Math.floor(Math.random() * 100) + 50,
                comments: Math.floor(Math.random() * 300) + 100,
                anticipation: Math.floor(Math.random() * 10) + 90, // 90-100%
            },
            optimalTime: {
                time: getOptimalPublishTime(),
                activeReaderPercentage: Math.floor(Math.random() * 10) + 85, // 85-95%
            },
        };

        return NextResponse.json(publishAnalysis);
    } catch (error) {
        console.error("Publish analysis API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch publish analysis" },
            { status: 500 },
        );
    }
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
}

function getOptimalPublishTime(): string {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["9:00 AM", "12:00 PM", "2:00 PM", "6:00 PM", "8:00 PM"];

    const randomDay = days[Math.floor(Math.random() * days.length)];
    const randomTime = times[Math.floor(Math.random() * times.length)];

    return `${randomDay} ${randomTime} PST`;
}
