'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, Clock, Star, Filter, BookOpen } from 'lucide-react';
import { StoryCard, type StoryWithAuthor } from './story/story-card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Select } from './ui/select';

interface ReadingProgress {
  currentChapterNumber: number;
  totalChapters: number;
  progressPercentage: number;
}

interface StoryWithProgress extends StoryWithAuthor {
  readingProgress?: ReadingProgress;
}

interface StoryDiscoveryProps {
  userId?: string;
  initialStories?: StoryWithAuthor[];
}

const SAMPLE_STORIES: StoryWithAuthor[] = [
  {
    id: '1',
    title: 'The Chronicles of Eldara',
    description: 'A young mage discovers her true heritage in a world where magic is forbidden.',
    genre: 'Fantasy',
    status: 'ongoing',
    authorId: 'author1',
    isPublished: true,
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    wordCount: 45000,
    chapterCount: 15,
    readCount: 1250,
    likeCount: 89,
    coverImageUrl: null,
    tags: ['Magic', 'Adventure', 'Coming of Age'],
    mature: false,
    author: {
      id: 'author1',
      email: 'author1@example.com',
      password: null,
      name: 'Sarah Chen',
      image: null,
    },
  },
  {
    id: '2',
    title: 'Neon Dreams',
    description: 'In 2087, a hacker uncovers a conspiracy that threatens the last free city on Earth.',
    genre: 'Sci-Fi',
    status: 'completed',
    authorId: 'author2',
    isPublished: true,
    publishedAt: new Date('2023-12-01'),
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-15'),
    wordCount: 78000,
    chapterCount: 22,
    readCount: 2340,
    likeCount: 156,
    coverImageUrl: null,
    tags: ['Cyberpunk', 'Thriller', 'AI'],
    mature: true,
    author: {
      id: 'author2',
      email: 'author2@example.com',
      password: null,
      name: 'Alex Rivera',
      image: null,
    },
  }
];

export function StoryDiscovery({ userId, initialStories = [] }: StoryDiscoveryProps) {
  const [stories, setStories] = useState<StoryWithProgress[]>(
    initialStories.length > 0 ? initialStories : SAMPLE_STORIES
  );
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'discover' | 'trending' | 'recent' | 'following'>('discover');

  // Mock reading progress for demo
  useEffect(() => {
    if (userId) {
      const storiesWithProgress = stories.map((story, index) => ({
        ...story,
        readingProgress: index % 3 === 0 ? {
          currentChapterNumber: Math.ceil(story.chapterCount * 0.3),
          totalChapters: story.chapterCount,
          progressPercentage: Math.ceil(30 + (index * 10) % 40),
        } : undefined,
      }));
      setStories(storiesWithProgress);
    }
  }, [userId, stories.length]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Mock search - in real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 500));
      // Filter stories based on search query, genre, and status
      let filteredStories = SAMPLE_STORIES;
      
      if (searchQuery) {
        filteredStories = filteredStories.filter(story => 
          story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          story.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (selectedGenre !== 'all') {
        filteredStories = filteredStories.filter(story => 
          story.genre?.toLowerCase() === selectedGenre.toLowerCase()
        );
      }
      
      if (selectedStatus !== 'all') {
        filteredStories = filteredStories.filter(story => story.status === selectedStatus);
      }
      
      setStories(filteredStories);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeStory = async (storyId: string) => {
    try {
      // Mock like action - in real app, this would call the API
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likeCount: story.likeCount + 1 }
          : story
      ));
    } catch (error) {
      console.error('Like failed:', error);
    }
  };

  const filteredStories = stories.filter(story => {
    if (activeTab === 'following') {
      // Mock: show stories where user follows author
      return story.author.name !== 'Anonymous';
    }
    if (activeTab === 'trending') {
      return story.readCount > 1000;
    }
    if (activeTab === 'recent') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return story.publishedAt && story.publishedAt > oneWeekAgo;
    }
    return true; // discover shows all
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col space-y-6">
            {/* Title and Description */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Discover Stories</h1>
              <p className="text-muted-foreground">
                Explore thousands of stories from talented writers around the world
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto w-full">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stories, authors, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="px-4 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Genres</option>
                  <option value="fantasy">Fantasy</option>
                  <option value="sci-fi">Sci-Fi</option>
                  <option value="romance">Romance</option>
                  <option value="mystery">Mystery</option>
                  <option value="horror">Horror</option>
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">On Hiatus</option>
                </select>
                
                <Button 
                  onClick={handleSearch} 
                  disabled={loading}
                  className="px-6"
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center">
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                {[
                  { id: 'discover', label: 'Discover', icon: BookOpen },
                  { id: 'trending', label: 'Trending', icon: TrendingUp },
                  { id: 'recent', label: 'Recent', icon: Clock },
                  { id: 'following', label: 'Following', icon: Star },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === id 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="space-y-4">
                  <div className="aspect-[3/4] bg-muted rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                readingProgress={story.readingProgress}
                onLike={handleLikeStory}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No stories found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse different categories
            </p>
          </div>
        )}
      </div>
    </div>
  );
}