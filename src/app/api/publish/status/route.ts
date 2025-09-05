import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stories, chapters } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's stories and chapters for scheduling
    const userStories = await db
      .select()
      .from(stories)
      .where(eq(stories.userId, session.user.id))
      .orderBy(desc(stories.updatedAt))
      .limit(10);

    const userChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.userId, session.user.id))
      .orderBy(desc(chapters.updatedAt))
      .limit(20);

    // Mock publish status data based on actual user data
    const scheduledItems = userChapters.slice(0, 4).map((chapter, index) => ({
      id: chapter.id,
      date: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      title: chapter.title || `Chapter ${index + 1}`,
      time: ['12:00 PM', '2:00 PM', '6:00 PM', '9:00 AM'][index],
      status: ['ready', 'draft', 'planned', 'idea'][index]
    }));

    const readyToPublish = userChapters.find(chapter => chapter.status === 'completed') || userChapters[0];

    const publishStatus = {
      scheduledItems,
      readyToPublish: readyToPublish ? {
        id: readyToPublish.id,
        title: readyToPublish.title || 'Untitled Chapter',
        wordCount: readyToPublish.wordCount || 0,
        targetWordCount: 4000,
        shortTitle: readyToPublish.title?.substring(0, 20) || 'Untitled',
        preview: readyToPublish.content?.substring(0, 150) + '...' || 'No preview available',
        scheduledTime: 'Tomorrow at 2:00 PM',
        communityPoll: '"What happens next?"'
      } : null,
      pending: userChapters.filter(c => c.status === 'draft').length
    };

    return NextResponse.json(publishStatus);
  } catch (error) {
    console.error("Publish status API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch publish status" },
      { status: 500 }
    );
  }
}