import React from "react";
import { auth } from "@/lib/auth";
import { getPublishedStories } from "@/lib/db/queries";
import { BrowseHero } from "./BrowseHero";
import { StoryGrid } from "./StoryGrid";

export async function Browse() {
  const session = await auth();
  const publishedStories = await getPublishedStories();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <BrowseHero />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Discover Amazing Stories
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explore thousands of creative works from talented writers around the world.
          </p>
        </div>

        <StoryGrid stories={publishedStories} currentUserId={session?.user?.id} />
      </div>
    </div>
  );
}