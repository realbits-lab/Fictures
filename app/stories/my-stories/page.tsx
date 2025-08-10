'use client';

import { useState } from 'react';
import { StoryCard } from '@/components/story/story-card';
import { 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  Edit3, 
  Eye, 
  TrendingUp,
  Clock,
  Star,
  Calendar,
  BarChart3
} from 'lucide-react';

// Mock data for demonstration
const mockStories = [
  {
    id: '1',
    title: 'The Dragon\'s Quest',
    description: 'A fantasy adventure about magic and dragons in a mystical world filled with ancient mysteries.',
    genre: 'fantasy',
    status: 'ongoing' as const,
    authorId: '1',
    isPublished: true,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-15'),
    wordCount: 15000,
    chapterCount: 5,
    readCount: 1250,
    likeCount: 89,
    coverImageUrl: null,
    tags: ['magic', 'dragon', 'adventure'],
    mature: false,
    author: {
      id: '1',
      email: 'author@example.com',
      password: null,
      name: 'John Fantasy Author',
      image: null,
    }
  },
  {
    id: '2',
    title: 'Space Explorer Chronicles',
    description: 'A thrilling sci-fi adventure through the cosmos, exploring distant planets and alien civilizations.',
    genre: 'sci-fi',
    status: 'completed' as const,
    authorId: '1',
    isPublished: true,
    publishedAt: new Date('2023-11-15'),
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-12-01'),
    wordCount: 32000,
    chapterCount: 12,
    readCount: 2100,
    likeCount: 156,
    coverImageUrl: null,
    tags: ['space', 'alien', 'technology'],
    mature: false,
    author: {
      id: '1',
      email: 'author@example.com',
      password: null,
      name: 'John Fantasy Author',
      image: null,
    }
  },
  {
    id: '3',
    title: 'The Midnight Conspiracy',
    description: 'A dark thriller involving corporate espionage, hidden agendas, and dangerous secrets.',
    genre: 'mystery',
    status: 'draft' as const,
    authorId: '1',
    isPublished: false,
    publishedAt: null,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-25'),
    wordCount: 8500,
    chapterCount: 3,
    readCount: 0,
    likeCount: 0,
    coverImageUrl: null,
    tags: ['thriller', 'conspiracy', 'corporate'],
    mature: true,
    author: {
      id: '1',
      email: 'author@example.com',
      password: null,
      name: 'John Fantasy Author',
      image: null,
    }
  }
];

const mockReadingProgress = {
  currentChapterNumber: 3,
  totalChapters: 5,
  progressPercentage: 60
};

export default function MyStoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated');

  const filteredStories = mockStories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedStories = [...filteredStories].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'reads':
        return b.readCount - a.readCount;
      case 'likes':
        return b.likeCount - a.likeCount;
      default:
        return 0;
    }
  });

  const totalWords = mockStories.reduce((sum, story) => sum + story.wordCount, 0);
  const totalReads = mockStories.reduce((sum, story) => sum + story.readCount, 0);
  const totalLikes = mockStories.reduce((sum, story) => sum + story.likeCount, 0);
  const publishedCount = mockStories.filter(story => story.isPublished).length;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Stories</h1>
          <p className="text-muted-foreground">Manage and track your creative works</p>
        </div>
        <a 
          href="/stories/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Create New Story
        </a>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mockStories.length}</p>
              <p className="text-sm text-muted-foreground">Total Stories</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalReads.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Reads</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Star className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalLikes}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              data-testid="my-stories-search"
              type="text"
              placeholder="Search your stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                data-testid="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">On Hiatus</option>
              </select>
            </div>

            <select
              data-testid="sort-dropdown"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="updated">Recently Updated</option>
              <option value="created">Recently Created</option>
              <option value="title">Title A-Z</option>
              <option value="reads">Most Read</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Your Stories ({sortedStories.length})
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            {totalWords.toLocaleString()} total words
          </div>
        </div>
        
        {sortedStories.length > 0 ? (
          <div data-testid="my-stories-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedStories.map((story, index) => (
              <div key={story.id} className="relative">
                <StoryCard 
                  story={story} 
                  readingProgress={index === 0 ? mockReadingProgress : undefined}
                />
                
                {/* Author Action Buttons */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button 
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-border hover:bg-accent transition-colors"
                      title="Edit Story"
                    >
                      <Edit3 className="h-3 w-3 text-muted-foreground" />
                    </button>
                    <button 
                      className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-border hover:bg-accent transition-colors"
                      title="View Analytics"
                    >
                      <BarChart3 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                {/* Draft Overlay */}
                {!story.isPublished && (
                  <div className="absolute top-6 left-6">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs rounded-full font-medium">
                      Draft
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No stories found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating your first story'
              }
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <a 
                href="/stories/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Your First Story
              </a>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-foreground">Chapter 6 added to "The Dragon's Quest"</span>
            </div>
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground">"Space Explorer Chronicles" received 15 new likes</span>
            </div>
            <span className="text-xs text-muted-foreground">1 day ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-foreground">"The Midnight Conspiracy" draft updated</span>
            </div>
            <span className="text-xs text-muted-foreground">3 days ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}