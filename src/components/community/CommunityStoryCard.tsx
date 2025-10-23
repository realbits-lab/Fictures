"use client";

import Link from "next/link";
import { Card, CardContent, Badge, StoryImage } from "@/components/ui";

interface CommunityStoryCardProps {
  story: {
    id: string;
    title: string;
    genre: string;
    author: string;
    description: string;
    totalPosts: number;
    totalMembers: number;
    lastActivity: string;
    isActive: boolean;
    coverImage: string;
    status: string;
  };
}

export function CommunityStoryCard({ story }: CommunityStoryCardProps) {
  return (
    <Link href={`/community/story/${story.id}`} className="group">
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-blue-300 dark:hover:border-blue-600">
        <CardContent className="p-0">
          {/* Cover Image */}
          <div className="relative w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-lg overflow-hidden">
            <StoryImage
              src={story.coverImage || ''}
              alt={story.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center z-10">
              <div className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                💬 Join Discussion
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title and Genre */}
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                {story.title}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {story.genre}
              </p>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {story.description}
            </p>
            
            {/* Author */}
            <p className="text-xs text-gray-500 dark:text-gray-500">
              by <span className="font-medium">{story.author}</span>
            </p>
            
            {/* Community Stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {story.totalPosts}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Posts
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {story.totalMembers.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Members
                </div>
              </div>
            </div>
            
            {/* Last Activity */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Last activity: <span className="font-medium">{story.lastActivity}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}