import React from "react";
import { auth } from "@/lib/auth";
import { getUserStories } from "@/lib/db/queries";

export async function HomeStats() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return (
      <div className="py-16 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Start Your Writing Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Sign in to begin creating amazing stories with AI assistance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const userStories = await getUserStories(session.user.id);
  
  // Calculate basic stats
  const totalStories = userStories.length;
  const totalReaders = userStories.reduce((sum, story) => sum + (story.viewCount || 0), 0);
  const totalWords = userStories.reduce((sum, story) => sum + (story.currentWordCount || 0), 0);
  const avgRating = userStories.length > 0 
    ? userStories.reduce((sum, story) => sum + (story.rating || 0), 0) / userStories.length / 10
    : 0;

  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Your Writing Progress
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Keep up the great work, {session.user.name}!
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {totalStories}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Stories Created
            </div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {totalWords.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Words Written
            </div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {totalReaders.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Readers
            </div>
          </div>
          
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average Rating
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}