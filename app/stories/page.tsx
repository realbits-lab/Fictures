'use client';

import { useState } from 'react';
import { Search, Filter, BookOpen, Heart, Bookmark, Eye, Calendar } from 'lucide-react';

const allStories = [
  {
    id: '1',
    title: 'The Dragon\'s Quest',
    description: 'A fantasy adventure about magic and dragons in a mystical world.',
    author: 'John Fantasy Author',
    genre: 'Fantasy',
    wordCount: '15,000',
    chapterCount: '5',
    readCount: '100',
    likeCount: '25',
    publicationDate: 'Jan 1, 2024',
    mature: false
  },
  {
    id: '2',
    title: 'Space Explorer Chronicles',
    description: 'A thrilling sci-fi adventure through the cosmos.',
    author: 'Jane Sci-Fi Writer',
    genre: 'Sci-Fi',
    wordCount: '20,000',
    chapterCount: '8',
    readCount: '150',
    likeCount: '30',
    publicationDate: 'Dec 15, 2023',
    mature: false
  },
  {
    id: '3',
    title: 'Magic Academy: First Year',
    description: 'Young wizards learn the ways of magic in this fantasy adventure.',
    author: 'Magic Author',
    genre: 'Fantasy',
    wordCount: '12,000',
    chapterCount: '4',
    readCount: '75',
    likeCount: '20',
    publicationDate: 'Feb 10, 2024',
    mature: true
  }
];

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [showMature, setShowMature] = useState(false);

  const filteredStories = allStories.filter(story => {
    // Search filter - search for individual words
    const matchesSearch = searchQuery === '' || 
      searchQuery.toLowerCase().split(' ').some(word => 
        word.trim() && (
          story.title.toLowerCase().includes(word.trim()) ||
          story.description.toLowerCase().includes(word.trim())
        )
      );
    
    // Genre filter
    const matchesGenre = genreFilter === '' || story.genre.toLowerCase() === genreFilter.toLowerCase();
    
    // Mature content filter
    const matchesMature = showMature || !story.mature;
    
    return matchesSearch && matchesGenre && matchesMature;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the filter above
  };
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <select
              data-testid="genre-filter"
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Genres</option>
              <option data-testid="genre-filter-fantasy" value="fantasy">Fantasy</option>
              <option data-testid="genre-filter-sci-fi" value="sci-fi">Sci-Fi</option>
              <option data-testid="genre-filter-romance" value="romance">Romance</option>
            </select>

            <select
              data-testid="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
                checked={showMature}
                onChange={(e) => setShowMature(e.target.checked)}
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
        {filteredStories.map((story) => (
        <div key={story.id} data-testid="story-card" className="bg-card rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 data-testid="story-title" className="text-lg font-semibold text-foreground line-clamp-2">
                {story.title}
              </h3>
              <p data-testid="story-description" className="text-sm text-muted-foreground line-clamp-3">
                {story.description}
              </p>
            </div>

            <div className="space-y-2">
              <p data-testid="story-author" className="text-sm font-medium text-foreground">
                {story.author}
              </p>
              <div className="flex items-center gap-2">
                <span data-testid="story-genre" className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                  {story.genre}
                </span>
              </div>
            </div>

            <div data-testid="story-stats" className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                <span data-testid="word-count">{story.wordCount} words</span>
              </div>
              <div className="flex items-center gap-1">
                <span data-testid="chapter-count">{story.chapterCount} chapters</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span data-testid="read-count">{story.readCount} reads</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                <span data-testid="like-count">{story.likeCount} likes</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span data-testid="publication-date">{story.publicationDate}</span>
              </div>
              {story.mature && (
                <div data-testid="mature-indicator" className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  18+
                </div>
              )}
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
        ))}

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