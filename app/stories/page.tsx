'use client';

import { Search, Filter, BookOpen, Heart, Bookmark, Eye, Calendar } from 'lucide-react';

export default function StoriesPage() {
  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-card rounded-lg p-6 shadow-sm border">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              data-testid="story-search-input"
              type="text"
              placeholder="Search stories..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <select
              data-testid="genre-filter"
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Genres</option>
              <option data-testid="genre-filter-fantasy" value="fantasy">Fantasy</option>
              <option data-testid="genre-filter-sci-fi" value="sci-fi">Sci-Fi</option>
              <option data-testid="genre-filter-romance" value="romance">Romance</option>
            </select>

            <select
              data-testid="sort-dropdown"
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Sort by...</option>
              <option data-testid="sort-by-popularity" value="popularity">Popularity</option>
              <option data-testid="sort-by-newest" value="newest">Newest</option>
            </select>

            <div data-testid="mature-content-toggle" className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="mature-content"
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="mature-content" className="text-sm text-foreground">
                Show Mature Content
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div data-testid="story-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Story Card 1 */}
        <div data-testid="story-card" className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 data-testid="story-title" className="text-lg font-semibold text-foreground line-clamp-2">
                The Dragon's Quest
              </h3>
              <p data-testid="story-description" className="text-sm text-muted-foreground line-clamp-3">
                A fantasy adventure about magic and dragons in a mystical world.
              </p>
            </div>

            <div className="space-y-2">
              <p data-testid="story-author" className="text-sm font-medium text-foreground">
                John Fantasy Author
              </p>
              <div className="flex items-center gap-2">
                <span data-testid="story-genre" className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Fantasy
                </span>
              </div>
            </div>

            <div data-testid="story-stats" className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span data-testid="word-count">15,000 words</span>
              </div>
              <div className="flex items-center gap-1">
                <span data-testid="chapter-count">5 chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span data-testid="read-count">100 reads</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span data-testid="like-count">25 likes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid="publication-date">Jan 1, 2024</span>
              </div>
              <div data-testid="mature-indicator" style={{ display: 'none' }} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                18+
              </div>
            </div>

            <div className="flex gap-2">
              <button
                data-testid="bookmark-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Bookmark className="h-3 w-3" />
                Bookmark
              </button>
              <button
                data-testid="like-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Heart className="h-3 w-3" />
                Like
              </button>
            </div>
          </div>
        </div>

        {/* Story Card 2 */}
        <div data-testid="story-card" className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 data-testid="story-title" className="text-lg font-semibold text-foreground line-clamp-2">
                Space Explorer Chronicles
              </h3>
              <p data-testid="story-description" className="text-sm text-muted-foreground line-clamp-3">
                A thrilling sci-fi adventure through the cosmos.
              </p>
            </div>

            <div className="space-y-2">
              <p data-testid="story-author" className="text-sm font-medium text-foreground">
                Jane Sci-Fi Writer
              </p>
              <div className="flex items-center gap-2">
                <span data-testid="story-genre" className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Sci-Fi
                </span>
              </div>
            </div>

            <div data-testid="story-stats" className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span data-testid="word-count">20,000 words</span>
              </div>
              <div className="flex items-center gap-1">
                <span data-testid="chapter-count">8 chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span data-testid="read-count">150 reads</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span data-testid="like-count">30 likes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid="publication-date">Dec 15, 2023</span>
              </div>
              <div data-testid="mature-indicator" style={{ display: 'none' }} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                18+
              </div>
            </div>

            <div className="flex gap-2">
              <button
                data-testid="bookmark-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Bookmark className="h-3 w-3" />
                Bookmark
              </button>
              <button
                data-testid="like-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Heart className="h-3 w-3" />
                Like
              </button>
            </div>
          </div>
        </div>

        {/* Story Card 3 */}
        <div data-testid="story-card" className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 data-testid="story-title" className="text-lg font-semibold text-foreground line-clamp-2">
                Magic Academy: First Year
              </h3>
              <p data-testid="story-description" className="text-sm text-muted-foreground line-clamp-3">
                Young wizards learn the ways of magic in this fantasy adventure.
              </p>
            </div>

            <div className="space-y-2">
              <p data-testid="story-author" className="text-sm font-medium text-foreground">
                Magic Author
              </p>
              <div className="flex items-center gap-2">
                <span data-testid="story-genre" className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  Fantasy
                </span>
              </div>
            </div>

            <div data-testid="story-stats" className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span data-testid="word-count">12,000 words</span>
              </div>
              <div className="flex items-center gap-1">
                <span data-testid="chapter-count">4 chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span data-testid="read-count">75 reads</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span data-testid="like-count">20 likes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid="publication-date">Feb 10, 2024</span>
              </div>
              <div data-testid="mature-indicator" className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                18+
              </div>
            </div>

            <div className="flex gap-2">
              <button
                data-testid="bookmark-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Bookmark className="h-3 w-3" />
                Bookmark
              </button>
              <button
                data-testid="like-button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent transition-colors"
              >
                <Heart className="h-3 w-3" />
                Like
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div data-testid="pagination" className="flex justify-center">
        <button
          data-testid="next-page-button"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Next Page
        </button>
      </div>
    </div>
  );
}