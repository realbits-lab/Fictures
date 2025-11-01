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
import { InFeedAd } from "@/components/ads";
import { trackSearch, trackStoryEvent } from '@/lib/analytics/google-analytics';
import { readingHistoryManager } from '@/lib/storage/reading-history-manager';
import { STORY_GENRES } from '@/lib/constants/genres';
import type { ReadingFormat } from '@/types/reading-history';

interface Story {
  id: string;
  title: string;
  summary: string; // Story summary from database
  genre: string;
  status: string;
  isPublic: boolean;
  viewCount: number;
  rating: number;
  createdAt: Date;
  imageUrl?: string;
  imageVariants?: any;
  author: {
    id: string;
    name: string;
  };
}

interface StoryGridProps {
  stories: Story[];
  currentUserId?: string;
  pageType?: 'novels' | 'comics' | 'reading' | 'studio';
}

const genres = ["All", ...STORY_GENRES];

export function StoryGrid({ stories = [], currentUserId, pageType = 'reading' }: StoryGridProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "rating">("latest");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [filterMode, setFilterMode] = useState<"all" | "history">("all");
  const [readingHistory, setReadingHistory] = useState<Set<string>>(new Set());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Determine reading format based on pageType
  const format: ReadingFormat = pageType === 'comics' ? 'comic' : 'novel';

  // Fetch reading history when component mounts
  useEffect(() => {
    async function fetchHistory() {
      // For studio page, skip history fetching (all stories are user's own)
      if (pageType === 'studio') {
        setIsLoadingHistory(false);
        return;
      }

      if (!session?.user?.id) {
        // Anonymous user - use localStorage for specific format
        const localHistory = readingHistoryManager.getHistory(format);
        setReadingHistory(localHistory);
        setIsLoadingHistory(false);
        return;
      }

      // Authenticated user - use API and sync with localStorage
      try {
        const response = await fetch(`/${pageType}/api/history`);
        if (response.ok) {
          const data = await response.json();
          const storyIds = new Set<string>(data.history.map((h: any) => h.storyId as string));
          setReadingHistory(storyIds);
        } else {
          // API failed, fallback to localStorage
          const localHistory = readingHistoryManager.getHistory(format);
          setReadingHistory(localHistory);
        }
      } catch (error) {
        console.error(`Error fetching ${format} reading history:`, error);
        // Fallback to localStorage
        const localHistory = readingHistoryManager.getHistory(format);
        setReadingHistory(localHistory);
      } finally {
        setIsLoadingHistory(false);
      }
    }

    fetchHistory();
  }, [session?.user?.id, pageType, format]);

  // Record story view with format-specific tracking
  const recordStoryView = async (storyId: string, storyTitle?: string) => {
    // Skip history tracking for studio page (user's own stories)
    if (pageType === 'studio') {
      return;
    }

    // Track story view in GA (always track, regardless of auth)
    trackStoryEvent.view(storyId, storyTitle);

    if (!session?.user?.id) {
      // Anonymous user - use localStorage only with format
      readingHistoryManager.addToHistory(storyId, format);
      setReadingHistory(prev => new Set([...prev, storyId]));
      return;
    }

    // Authenticated user - use API + localStorage as backup
    try {
      const response = await fetch(`/${pageType}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, format }),
      });

      if (response.ok) {
        // Also update localStorage as backup/cache with format
        readingHistoryManager.addToHistory(storyId, format);
        setReadingHistory(prev => new Set([...prev, storyId]));
      } else {
        // API failed, fallback to localStorage
        readingHistoryManager.addToHistory(storyId, format);
        setReadingHistory(prev => new Set([...prev, storyId]));
      }
    } catch (error) {
      console.error(`Error recording ${format} story view:`, error);
      // Fallback to localStorage
      readingHistoryManager.addToHistory(storyId, format);
      setReadingHistory(prev => new Set([...prev, storyId]));
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
      {/* Filters - Responsive Layout */}
      <div className="mb-10">
        {/* Mobile: 2 rows, Desktop: 1 row */}
        <div className="flex flex-col md:flex-row md:justify-end items-stretch md:items-center gap-3">
          {/* First row on mobile: History/All + View toggles (or just View toggle for studio) */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* History/All Toggle - Hide for studio page */}
            {pageType !== 'studio' && (
              <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-1 flex-1 md:flex-initial">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`inline-flex items-center justify-center rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all flex-1 md:flex-initial ${
                    filterMode === "all"
                      ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
                      : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
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
                    className="md:mr-2"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                  <span className="hidden md:inline">All Stories</span>
                  <span className="md:hidden">All</span>
                </button>
                <button
                  onClick={() => setFilterMode("history")}
                  className={`inline-flex items-center justify-center rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all flex-1 md:flex-initial ${
                    filterMode === "history"
                      ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
                      : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
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
                    className="md:mr-2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="hidden md:inline">My History</span>
                  <span className="md:hidden">History</span>
                </button>
              </div>
            )}

            {/* View Toggle */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] p-1 flex-1 md:flex-initial">
              <button
                onClick={() => setViewMode("card")}
                className={`inline-flex items-center justify-center rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === "card"
                    ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
                    : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
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
                  className="md:mr-2"
                >
                  <rect width="7" height="7" x="3" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="3" rx="1" />
                  <rect width="7" height="7" x="14" y="14" rx="1" />
                  <rect width="7" height="7" x="3" y="14" rx="1" />
                </svg>
                <span className="hidden md:inline">Card</span>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center justify-center rounded-md px-2 md:px-3 py-1.5 text-sm font-medium transition-all flex-1 md:flex-initial ${
                  viewMode === "table"
                    ? "bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] shadow-sm"
                    : "text-[rgb(var(--color-muted-foreground))] hover:bg-[rgb(var(--color-muted))] hover:text-[rgb(var(--color-foreground))]"
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
                  className="md:mr-2"
                >
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="3" x2="21" y1="12" y2="12" />
                  <line x1="3" x2="21" y1="18" y2="18" />
                </svg>
                <span className="hidden md:inline">Table</span>
              </button>
            </div>
          </div>

          {/* Second row on mobile: Genre + Sort selects */}
          <div className="flex items-center justify-between md:justify-end gap-3">
            {/* Genre Select */}
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex-1 md:flex-initial">
              <Select value={selectedGenre} onValueChange={(genre) => {
                setSelectedGenre(genre);
                // Track genre filter
                if (genre !== 'All') {
                  trackSearch.filterByGenre(genre);
                }
              }}>
                <SelectTrigger className="border-0 bg-transparent hover:bg-[rgb(var(--color-muted))] focus:ring-0 focus:ring-offset-0 w-full">
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
            <div className="inline-flex rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-background))] flex-1 md:flex-initial">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "latest" | "popular" | "rating")}>
                <SelectTrigger className="border-0 bg-transparent hover:bg-[rgb(var(--color-muted))] focus:ring-0 focus:ring-offset-0 w-full">
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
      </div>

      {/* Story Display - Card or Table View */}
      {sortedStories.length > 0 ? (
        viewMode === "card" ? (
          /* Card View with In-Feed Ads */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedStories.map((story, index) => {
              const imageUrl = story.imageUrl;
              const shouldShowAd = (index + 1) % 8 === 0 && index !== sortedStories.length - 1;

              return (
                <React.Fragment key={story.id}>
                  {/* Story Card */}
              <div
                key={story.id}
                onClick={async () => {
                  // For studio page, navigate to edit page instead of reading page
                  if (pageType === 'studio') {
                    router.push(`/studio/edit/story/${story.id}`);
                  } else {
                    await recordStoryView(story.id, story.title);
                    router.push(`/${pageType}/${story.id}`);
                  }
                }}
                onMouseEnter={() => {
                  // Prefetch story data on hover for instant navigation
                  fetch(`/studio/api/stories/${story.id}/read`, {
                    credentials: 'include',
                  }).catch(() => {
                    // Silently fail - prefetch is optional
                  });
                }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer"
              >
                {/* Story Image - 16:9 Aspect Ratio */}
                <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
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
                  {story.summary || "No summary available."}
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
                      <span>{(story.rating || 0).toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                </div>
              </div>

                  {/* In-Feed Ad - Insert after every 8 cards */}
                  {shouldShowAd && (
                    <InFeedAd
                      slot="1781061545" // Replace with your actual In-feed AdSense slot ID
                      layoutKey="-fb+5w+4e-db+86" // Get from AdSense dashboard
                      className="col-span-1"
                    />
                  )}
                </React.Fragment>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStories.map((story) => {
                  const imageUrl = story.imageUrl;

                  return (
                    <TableRow
                      key={story.id}
                      onClick={async () => {
                        // For studio page, navigate to edit page instead of reading page
                        if (pageType === 'studio') {
                          router.push(`/studio/edit/story/${story.id}`);
                        } else {
                          await recordStoryView(story.id, story.title);
                          router.push(`/${pageType}/${story.id}`);
                        }
                      }}
                      onMouseEnter={() => {
                        // Prefetch story data on hover for instant navigation
                        fetch(`/studio/api/stories/${story.id}/read`, {
                          credentials: 'include',
                        }).catch(() => {
                          // Silently fail - prefetch is optional
                        });
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
                            {story.summary || "No summary available."}
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
                          <span>{(story.rating || 0).toFixed(1)}</span>
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