"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, StoryImage } from "@/components/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  status: string;
  isPublic: boolean;
  viewCount: number;
  rating: number;
  currentWordCount: number;
  createdAt: Date;
  hnsData?: {
    storyImage?: {
      url: string;
    };
  };
  author: {
    id: string;
    name: string;
  };
}

interface StoryGridProps {
  stories: Story[];
  currentUserId?: string;
}

const genres = ["All", "Fantasy", "Science Fiction", "Romance", "Mystery", "Thriller", "Detective", "Adventure"];

export function StoryGrid({ stories = [], currentUserId }: StoryGridProps) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "rating">("latest");

  const filteredStories = stories.filter(story => 
    selectedGenre === "All" || story.genre === selectedGenre
  );

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return (b.viewCount || 0) - (a.viewCount || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "latest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div>
      {/* Filters - Top Right Position */}
      <div className="mb-8 flex justify-end">
        <div className="flex items-center gap-3">
          {/* Genre Select */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Genre:</span>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By Select */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "popular" | "rating")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Story Grid */}
      {sortedStories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedStories.map((story) => {
            const imageUrl = story.hnsData?.storyImage?.url;

            return (
            <div
              key={story.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col overflow-hidden"
            >
              {/* Story Image */}
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800">
                <StoryImage
                  src={imageUrl || ''}
                  alt={story.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2 flex-shrink-0">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 truncate max-w-16">
                  {story.genre}
                </span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  story.isPublic
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                }`}>
                  {story.isPublic ? 'Public' : 'Private'}
                </span>
              </div>

              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 flex-shrink-0">
                {story.title}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden">
                {story.description || "No description available."}
              </p>

              <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 flex-shrink-0 truncate">
                by {story.author.name}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3 flex-shrink-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span>👥</span>
                    <span className="truncate">{(story.viewCount || 0).toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span>⭐</span>
                    <span>{((story.rating || 0) / 10).toFixed(1)}</span>
                  </span>
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <span>📝</span>
                    <span className="truncate">{(story.currentWordCount || 0).toLocaleString()}w</span>
                  </span>
                </div>
              </div>

              <Link href={`/reading/${story.id}`} className="w-full flex-shrink-0">
                <Button size="sm" className="w-full text-xs py-1.5">
                  📖 Read Story
                </Button>
              </Link>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No stories found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedGenre !== "All" 
              ? `No stories found in the ${selectedGenre} genre. Try selecting a different genre.`
              : "No published stories available yet. Check back later!"
            }
          </p>
        </div>
      )}
    </div>
  );
}