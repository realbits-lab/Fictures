import React from "react";
import { StoryCard } from "./StoryCard";
import { CreateStoryCard } from "./CreateStoryCard";
import { RecentActivity } from "./RecentActivity";
import { PublishingSchedule } from "./PublishingSchedule";
import { AIAssistantWidget } from "./AIAssistantWidget";
import { CommunityHighlights } from "./CommunityHighlights";
import { Button } from "@/components/ui";

// Sample story data
const sampleStories = [
  {
    id: "1",
    title: "The Shadow Keeper",
    genre: "Urban Fantasy",
    parts: { completed: 3, total: 3 },
    chapters: { completed: 15, total: 15 },
    readers: 2400,
    rating: 4.7,
    status: "publishing" as const,
    wordCount: 63000
  },
  {
    id: "2", 
    title: "Dragon Chronicles",
    genre: "Epic Fantasy",
    parts: { completed: 5, total: 7 },
    chapters: { completed: 28, total: 35 },
    readers: 890,
    rating: 4.2,
    status: "draft" as const,
    wordCount: 45000
  }
];

export function Dashboard() {
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
          {sampleStories.map((story) => (
            <StoryCard key={story.id} {...story} />
          ))}
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