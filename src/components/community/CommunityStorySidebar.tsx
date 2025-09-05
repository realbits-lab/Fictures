"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

// Fallback data for when API is unavailable
const fallbackStories = [
  {
    id: "demo-1",
    title: "Sample Public Story",
    genre: "Fantasy",
    author: { name: "Demo Author" },
    totalPosts: 25,
    totalMembers: 150,
    isActive: true,
    status: "published",
    lastActivity: "2 hours ago",
  },
];

interface CommunityStorySidebarProps {
  currentStoryId: string;
}

export function CommunityStorySidebar({ currentStoryId }: CommunityStorySidebarProps) {
  const pathname = usePathname();
  const [stories, setStories] = useState(fallbackStories);
  
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await fetch('/api/community/stories');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stories.length > 0) {
            setStories(data.stories);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stories for sidebar:', error);
        // Keep fallback stories on error
      }
    };

    fetchStories();
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Back to Community Hub */}
      <Card>
        <CardContent className="p-4">
          <Link 
            href="/community"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
          >
            <span>←</span>
            <span>Community Hub</span>
          </Link>
        </CardContent>
      </Card>

      {/* All Stories */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>📚</span>
            All Stories
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {stories.map((story) => {
            const isCurrentStory = story.id === currentStoryId;
            
            return (
              <Link
                key={story.id}
                href={`/community/story/${story.id}`}
                className={`block p-3 rounded-lg transition-all duration-200 border-2 ${
                  isCurrentStory
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium text-sm leading-tight line-clamp-2 mb-1 ${
                      isCurrentStory 
                        ? 'text-blue-900 dark:text-blue-100' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {story.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {story.genre}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 ml-2">
                    {story.isActive && (
                      <Badge variant="success" className="text-xs py-0 px-1">
                        Live
                      </Badge>
                    )}
                    <Badge 
                      variant="success"
                      className="text-xs py-0 px-1"
                    >
                      🌍 Public
                    </Badge>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  <span>{story.totalPosts} posts</span>
                  <span>{story.totalMembers.toLocaleString()} members</span>
                </div>
                
                <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  {story.lastActivity}
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Stats for Current Story */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>📊</span>
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {(() => {
            const currentStory = stories.find(s => s.id === currentStoryId);
            if (!currentStory) return null;
            
            return (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Posts</span>
                  <span className="font-medium">{currentStory.totalPosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Members</span>
                  <span className="font-medium">{currentStory.totalMembers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Visibility</span>
                  <Badge 
                    variant="success"
                    className="text-xs"
                  >
                    🌍 Public
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Activity</span>
                  <span className={`text-sm font-medium ${
                    currentStory.isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {currentStory.isActive ? 'Active' : 'Quiet'}
                  </span>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>📋</span>
            Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span>✅</span>
              <span>Be respectful to all community members</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🚫</span>
              <span>No spoilers without proper tags</span>
            </div>
            <div className="flex items-start gap-2">
              <span>💡</span>
              <span>Share theories and discussions</span>
            </div>
            <div className="flex items-start gap-2">
              <span>🎨</span>
              <span>Fan art and creative content welcome</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}