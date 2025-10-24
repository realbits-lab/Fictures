"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { StoryImage, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
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
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "rating">("latest");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filterMode, setFilterMode] = useState<"all" | "history">("all");
  const [readingHistory, setReadingHistory] = useState<Set<string>>(new Set());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch reading history when component mounts
  useEffect(() => {
    async function fetchHistory() {
      if (!session?.user?.id) {
        setIsLoadingHistory(false);
        return;
      }

      try {
        const response = await fetch('/reading/api/history');
        if (response.ok) {
          const data = await response.json();
          const storyIds = new Set(data.history.map((h: any) => h.storyId));
          setReadingHistory(storyIds);
        }
      } catch (error) {
        console.error('Error fetching reading history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [session?.user?.id]);

  // Record story view
  const recordStoryView = async (storyId: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/reading/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId }),
      });

      if (response.ok) {
        // Add to local history state
        setReadingHistory(prev => new Set([...prev, storyId]));
      }
    } catch (error) {
      console.error('Error recording story view:', error);
    }
  };

  const filteredStories = stories.filter(story => {
    // Genre filter
    const matchesGenre = selectedGenre === "All" || story.genre === selectedGenre;

    // History filter - only show stories in reading history when "history" mode is selected
    const matchesHistory = filterMode === "all" ? true : readingHistory.has(story.id);

    return matchesGenre && matchesHistory;
  });

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
      <div className="mb-8 flex justify-end items-center">
        <div className="flex items-center gap-3">
          {/* History/All Toggle */}
          <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1">
            <button
              onClick={() => setFilterMode("all")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                filterMode === "all"
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              All Stories
            </button>
            <button
              onClick={() => setFilterMode("history")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                filterMode === "history"
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              My History
            </button>
          </div>

          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] p-1">
            <button
              onClick={() => setViewMode("card")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "card"
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              Card
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                viewMode === "table"
                  ? "bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))] shadow-sm"
                  : "text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
              Table
            </button>
          </div>

          {/* Genre Select */}
          <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="border-0 bg-transparent hover:bg-[rgb(var(--muted))] focus:ring-0 focus:ring-offset-0">
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
          <div className="inline-flex rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))]">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "popular" | "rating")}>
              <SelectTrigger className="border-0 bg-transparent hover:bg-[rgb(var(--muted))] focus:ring-0 focus:ring-offset-0">
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

      {/* Story Display - Card or Table View */}
      {sortedStories.length > 0 ? (
        viewMode === "card" ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedStories.map((story) => {
              const imageUrl = story.hnsData?.storyImage?.url;

              return (
              <div
                key={story.id}
                onClick={async () => {
                  await recordStoryView(story.id);
                  router.push(`/reading/${story.id}`);
                }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
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

                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
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
                </div>
              </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[120px]">Genre</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-[100px] text-center">Views</TableHead>
                  <TableHead className="w-[100px] text-center">Rating</TableHead>
                  <TableHead className="w-[120px] text-center">Words</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStories.map((story) => {
                  const imageUrl = story.hnsData?.storyImage?.url;

                  return (
                    <TableRow
                      key={story.id}
                      onClick={async () => {
                        await recordStoryView(story.id);
                        router.push(`/reading/${story.id}`);
                      }}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                          <StoryImage
                            src={imageUrl || ''}
                            alt={story.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {story.title}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {story.description || "No description available."}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {story.genre}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          story.isPublic
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {story.isPublic ? 'Public' : 'Private'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {story.author.name}
                      </TableCell>
                      <TableCell className="text-center text-gray-600 dark:text-gray-400">
                        <span className="flex items-center justify-center gap-1">
                          <span>👥</span>
                          <span>{(story.viewCount || 0).toLocaleString()}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-600 dark:text-gray-400">
                        <span className="flex items-center justify-center gap-1">
                          <span>⭐</span>
                          <span>{((story.rating || 0) / 10).toFixed(1)}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-600 dark:text-gray-400">
                        <span className="flex items-center justify-center gap-1">
                          <span>📝</span>
                          <span>{(story.currentWordCount || 0).toLocaleString()}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
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