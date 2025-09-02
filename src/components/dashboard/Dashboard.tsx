import React from "react";
import { StoryCard } from "./StoryCard";
import { CreateStoryCard } from "./CreateStoryCard";
import { RecentActivity } from "./RecentActivity";
import { PublishingSchedule } from "./PublishingSchedule";
import { AIAssistantWidget } from "./AIAssistantWidget";
import { CommunityHighlights } from "./CommunityHighlights";
import { Button } from "@/components/ui";
import { auth } from "@/lib/auth";
import { getUserStories } from "@/lib/db/queries";

export async function Dashboard() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Please sign in to view your dashboard.</div>;
  }

  const userStories = await getUserStories(session.user.id);

  // Transform database stories to match StoryCard props
  const transformedStories = userStories.map((story) => ({
    id: story.id,
    title: story.title,
    genre: story.genre || "General",
    parts: { completed: 0, total: 0 }, // TODO: Calculate from parts table
    chapters: { completed: 0, total: 0 }, // TODO: Calculate from chapters table
    readers: story.viewCount || 0,
    rating: (story.rating || 0) / 10, // Convert from database format (47 = 4.7)
    status: story.status as "draft" | "publishing" | "completed",
    wordCount: story.currentWordCount || 0
  }));

  return (
    <div className="space-y-8">
      {/* Stories Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>📚</span>
            My Stories
          </h2>
          <Button>+ New Story</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {transformedStories.length > 0 ? (
            transformedStories.map((story) => (
              <StoryCard key={story.id} {...story} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <p className="text-xl mb-2">📝 No stories yet</p>
              <p>Start your writing journey by creating your first story!</p>
            </div>
          )}
          <CreateStoryCard />
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