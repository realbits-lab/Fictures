'use client';

// Define types inline to avoid server-only imports
export interface Story {
  id: string;
  title: string;
  description: string | null;
  genre: string | null;
  status: 'draft' | 'ongoing' | 'completed' | 'hiatus';
  authorId: string;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  chapterCount: number;
  readCount: number;
  likeCount: number;
  coverImageUrl: string | null;
  tags: string[];
  mature: boolean;
}

export interface User {
  id: string;
  email: string;
  password: string | null;
  name: string | null;
  image: string | null;
}

export interface StoryWithAuthor extends Story {
  author: User;
}

interface ReadingProgress {
  currentChapterNumber: number;
  totalChapters: number;
  progressPercentage: number;
}

interface StoryCardProps {
  story: StoryWithAuthor;
  showActions?: boolean;
  onLike?: (storyId: string) => void;
  readingProgress?: ReadingProgress;
}

import { Heart, BookOpen, Eye, Calendar, Bookmark, Clock, Star } from 'lucide-react';

export function StoryCard({ 
  story, 
  showActions = true, 
  onLike,
  readingProgress 
}: StoryCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'hiatus': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getGenreColor = (genre: string | null) => {
    switch (genre?.toLowerCase()) {
      case 'fantasy': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'sci-fi': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'romance': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
      case 'mystery': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'horror': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  return (
    <div className="group bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-200">
      {/* Cover Image */}
      {story.coverImageUrl && (
        <div className="aspect-[3/4] mb-4 rounded-lg overflow-hidden">
          <img 
            src={story.coverImageUrl} 
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>
      )}

      {/* Reading Progress */}
      {readingProgress && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Chapter {readingProgress.currentChapterNumber} of {readingProgress.totalChapters}</span>
            <span>{readingProgress.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress.progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Story Content */}
      <div className="space-y-4">
        {/* Title and Mature Content */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {story.title}
            </h3>
            {story.mature && (
              <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 text-xs rounded-full ml-2 flex-shrink-0">
                18+
              </span>
            )}
          </div>
          
          {story.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {story.description}
            </p>
          )}
        </div>

        {/* Author and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {story.author.name?.charAt(0) || 'A'}
              </span>
            </div>
            <span className="text-sm font-medium text-foreground">
              {story.author.name || 'Anonymous'}
            </span>
          </div>
          
          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(story.status)}`}>
            {story.status}
          </span>
        </div>

        {/* Genre and Tags */}
        <div className="flex flex-wrap gap-2">
          {story.genre && (
            <span className={`px-2 py-1 text-xs rounded-full ${getGenreColor(story.genre)}`}>
              {story.genre}
            </span>
          )}
          {story.tags?.slice(0, 2).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {story.tags && story.tags.length > 2 && (
            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              +{story.tags.length - 2}
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{story.wordCount?.toLocaleString() || '0'} words</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{story.chapterCount} chapters</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{story.readCount?.toLocaleString() || '0'} reads</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{story.likeCount || '0'} likes</span>
          </div>
        </div>

        {/* Publication Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {story.publishedAt 
              ? `Published ${formatDate(story.publishedAt)}`
              : `Created ${formatDate(story.createdAt)}`
            }
          </span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-2">
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent hover:border-accent-foreground/20 transition-colors">
              <Bookmark className="h-3 w-3" />
              Bookmark
            </button>
            <button 
              onClick={() => onLike?.(story.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-md hover:bg-accent hover:border-accent-foreground/20 transition-colors"
            >
              <Heart className="h-3 w-3" />
              Like
            </button>
            <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-auto">
              Read Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}