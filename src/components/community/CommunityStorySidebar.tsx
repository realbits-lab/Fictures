"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";

// Mock data - replace with real API calls
const allStories = [
  {
    id: "yWzfrPc85xT0SfF3rzxjU",
    title: "Digital Nexus: The Code Between Worlds",
    genre: "Science Fiction/Fantasy",
    author: "Thomas Jeon",
    totalPosts: 89,
    totalMembers: 1247,
    isActive: true,
    status: "published",
    lastActivity: "2 hours ago",
  },
  {
    id: "IiE1KTLwsDAVJvzEVzoRi",
    title: "The Last Guardian", 
    genre: "Epic Fantasy",
    author: "Thomas Jeon",
    totalPosts: 156,
    totalMembers: 892,
    isActive: true,
    status: "draft",
    lastActivity: "5 hours ago",
  },
  {
    id: "A97aQ6OzNmOoCJ1svugJY",
    title: "Mirrors of Reality",
    genre: "Psychological Mystery", 
    author: "Thomas Jeon",
    totalPosts: 67,
    totalMembers: 543,
    isActive: false,
    status: "draft",
    lastActivity: "1 day ago",
  },
  {
    id: "uzvfKaRxAgNzIW1tRreGb",
    title: "The Digital Awakening",
    genre: "Cyberpunk Thriller",
    author: "Thomas Jeon",
    totalPosts: 234,
    totalMembers: 1567,
    isActive: true,
    status: "draft",
    lastActivity: "6 hours ago",
  },
];

interface CommunityStorySidebarProps {
  currentStoryId: string;
}

export function CommunityStorySidebar({ currentStoryId }: CommunityStorySidebarProps) {
  const pathname = usePathname();
  
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
          {allStories.map((story) => {
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
                      variant={story.status === 'published' ? 'default' : 'secondary'}
                      className="text-xs py-0 px-1"
                    >
                      {story.status === 'published' ? '🚀' : '📝'}
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
            const currentStory = allStories.find(s => s.id === currentStoryId);
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge 
                    variant={currentStory.status === 'published' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {currentStory.status === 'published' ? 'Published' : 'Draft'}
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