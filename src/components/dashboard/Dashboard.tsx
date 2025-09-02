import React from "react";
import { StoryCard } from "./StoryCard";
import { CreateStoryCard } from "./CreateStoryCard";
import { RecentActivity } from "./RecentActivity";
import { PublishingSchedule } from "./PublishingSchedule";
import { AIAssistantWidget } from "./AIAssistantWidget";
import { CommunityHighlights } from "./CommunityHighlights";
import { auth } from "@/lib/auth";
import { getUserStoriesWithFirstChapter } from "@/lib/db/queries";

export async function Dashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  const userStories = await getUserStoriesWithFirstChapter(session.user.id);

  // Transform database stories to match StoryCard props
  const transformedStories = userStories.map((story) => ({
    id: story.id,
    title: story.title,
    genre: story.genre || "General",
    parts: { completed: story.completedParts || 0, total: story.totalParts || 0 },
    chapters: { completed: story.completedChapters || 0, total: story.totalChapters || 0 },
    readers: story.viewCount || 0,
    rating: (story.rating || 0) / 10, // Convert from database format (47 = 4.7)
    status: story.status as "draft" | "publishing" | "completed",
    wordCount: story.currentWordCount || 0,
    firstChapterId: story.firstChapterId
  }));

  return (
    <div className="space-y-8">
      {/* Stories Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>📚</span>
              My Stories
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage and organize all your creative works</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CreateStoryCard />
          {transformedStories.map((story) => (
            <StoryCard key={story.id} {...story} />
          ))}
          {transformedStories.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-xl mb-2">📝 Ready to start writing?</p>
              <p>Click the "Create New Story" card above to begin your first story!</p>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard Widgets */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <RecentActivity />
          <AIAssistantWidget />
        </div>
        <div className="space-y-6">
          <PublishingSchedule />
          <CommunityHighlights />
        </div>
      </section>
    </div>
  );
}