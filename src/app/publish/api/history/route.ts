import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { chapters, stories } from "@/lib/db/schema";
import { eq, and, desc, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get published chapters as publication history
    // Join with stories table to filter by author
    const publishedChapters = await db
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
          isNotNull(chapters.publishedAt)
        )
      )
      .orderBy(desc(chapters.publishedAt))
      .limit(50);

    const publications = publishedChapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title || 'Untitled Chapter',
      publishedAt: chapter.publishedAt,
      views: Math.floor(Math.random() * 1000) + 100, // Mock data
      comments: Math.floor(Math.random() * 50) + 5,
      reactions: Math.floor(Math.random() * 200) + 20,
      status: 'published',
      engagement: Math.floor(Math.random() * 30) + 70 // 70-100%
    }));

    const publishHistory = {
      publications,
      totalPublished: publications.length,
      thisMonth: publications.filter(p => {
        if (!p.publishedAt) return false;
        const publishDate = new Date(p.publishedAt);
        const now = new Date();
        return publishDate.getMonth() === now.getMonth() && 
               publishDate.getFullYear() === now.getFullYear();
      }).length
    };

    return NextResponse.json(publishHistory);
  } catch (error) {
    console.error("Publish history API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch publish history" },
      { status: 500 }
    );
  }
}