'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Heart, 
  BookOpen, 
  TrendingUp,
  Calendar,
  Clock,
  Users,
  MoreHorizontal,
  Trash2,
  Settings,
  Bookmark,
  Share,
  PlusCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

interface Story {
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

interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  wordCount: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface WriterStats {
  totalStories: number;
  totalWords: number;
  totalReads: number;
  totalLikes: number;
  followersCount: number;
}

interface StoryWriterDashboardProps {
  userId: string;
  userName?: string;
}

const SAMPLE_STORIES: Story[] = [
  {
    id: '1',
    title: 'The Chronicles of Eldara',
    description: 'A young mage discovers her true heritage in a world where magic is forbidden.',
    genre: 'Fantasy',
    status: 'ongoing',
    authorId: 'user1',
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
  },
  {
    id: '2',
    title: 'Untitled Romance',
    description: null,
    genre: 'Romance',
    status: 'draft',
    authorId: 'user1',
    isPublished: false,
    publishedAt: null,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    wordCount: 2800,
    chapterCount: 2,
    readCount: 0,
    likeCount: 0,
    coverImageUrl: null,
    tags: ['Romance', 'Contemporary'],
    mature: false,
  }
];

const SAMPLE_CHAPTERS: Record<string, Chapter[]> = {
  '1': [
    {
      id: 'ch1',
      storyId: '1',
      chapterNumber: 1,
      title: 'The Awakening',
      wordCount: 3200,
      isPublished: true,
      publishedAt: new Date('2024-01-15'),
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'ch2',
      storyId: '1',
      chapterNumber: 2,
      title: 'The Discovery',
      wordCount: 2900,
      isPublished: true,
      publishedAt: new Date('2024-01-17'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-17'),
    },
    {
      id: 'ch3',
      storyId: '1',
      chapterNumber: 3,
      title: 'The Training Begins',
      wordCount: 3400,
      isPublished: false,
      publishedAt: null,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-20'),
    }
  ]
};

export function StoryWriterDashboard({ userId, userName = 'Writer' }: StoryWriterDashboardProps) {
  const [stories, setStories] = useState<Story[]>(SAMPLE_STORIES);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'stories' | 'chapters' | 'analytics'>('overview');
  const [loading, setLoading] = useState(false);
  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  
  const stats: WriterStats = {
    totalStories: stories.filter(s => s.isPublished).length,
    totalWords: stories.reduce((sum, story) => sum + story.wordCount, 0),
    totalReads: stories.reduce((sum, story) => sum + story.readCount, 0),
    totalLikes: stories.reduce((sum, story) => sum + story.likeCount, 0),
    followersCount: 42, // Mock value
  };

  useEffect(() => {
    if (selectedStory) {
      setChapters(SAMPLE_CHAPTERS[selectedStory.id] || []);
    }
  }, [selectedStory]);

  const handleCreateStory = async (formData: { title: string; description: string; genre: string }) => {
    setLoading(true);
    try {
      // Mock API call - in real app would call createStory
      const newStory: Story = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description || null,
        genre: formData.genre || null,
        status: 'draft',
        authorId: userId,
        isPublished: false,
        publishedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 0,
        chapterCount: 0,
        readCount: 0,
        likeCount: 0,
        coverImageUrl: null,
        tags: [],
        mature: false,
      };
      
      setStories(prev => [newStory, ...prev]);
      setShowNewStoryForm(false);
    } catch (error) {
      console.error('Create story failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishStory = async (storyId: string) => {
    try {
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, isPublished: true, publishedAt: new Date(), status: 'ongoing' as const }
          : story
      ));
    } catch (error) {
      console.error('Publish story failed:', error);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      try {
        setStories(prev => prev.filter(story => story.id !== storyId));
        if (selectedStory?.id === storyId) {
          setSelectedStory(null);
        }
      } catch (error) {
        console.error('Delete story failed:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'hiatus': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Writer Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {userName}!</p>
            </div>
            <Button onClick={() => setShowNewStoryForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Story
            </Button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg mt-6 w-fit">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'stories', label: 'Stories', icon: BookOpen },
              { id: 'chapters', label: 'Chapters', icon: Edit3 },
              { id: 'analytics', label: 'Analytics', icon: Users },
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
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {[
                { label: 'Published Stories', value: stats.totalStories, icon: BookOpen, color: 'text-blue-600' },
                { label: 'Total Words', value: stats.totalWords.toLocaleString(), icon: Edit3, color: 'text-green-600' },
                { label: 'Total Reads', value: stats.totalReads.toLocaleString(), icon: Eye, color: 'text-purple-600' },
                { label: 'Total Likes', value: stats.totalLikes.toLocaleString(), icon: Heart, color: 'text-red-600' },
                { label: 'Followers', value: stats.followersCount.toLocaleString(), icon: Users, color: 'text-orange-600' },
              ].map((stat, index) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </Card>
              ))}
            </div>

            {/* Recent Stories */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Stories</h2>
              <div className="space-y-4">
                {stories.slice(0, 3).map((story) => (
                  <Card key={story.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{story.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(story.status)}`}>
                            {story.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {story.chapterCount} chapters
                          </span>
                          <span className="flex items-center gap-1">
                            <Edit3 className="h-3 w-3" />
                            {story.wordCount.toLocaleString()} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {story.readCount.toLocaleString()} reads
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated {formatDate(story.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Stories ({stories.length})</h2>
              <Button onClick={() => setShowNewStoryForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {stories.map((story) => (
                <Card key={story.id} className="p-6 group hover:shadow-md transition-shadow">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{story.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {story.description || 'No description'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {story.chapterCount} chapters
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Edit3 className="h-3 w-3" />
                        {story.wordCount.toLocaleString()} words
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {story.readCount.toLocaleString()} reads
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        {story.likeCount} likes
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDate(story.updatedAt)}
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedStory(story)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        {!story.isPublished && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePublishStory(story.id)}
                          >
                            Publish
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteStory(story.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chapters' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Chapters</h2>
              {selectedStory && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">for</span>
                  <select 
                    value={selectedStory.id}
                    onChange={(e) => setSelectedStory(stories.find(s => s.id === e.target.value) || null)}
                    className="px-3 py-1 border border-border rounded-md bg-background"
                  >
                    {stories.map(story => (
                      <option key={story.id} value={story.id}>{story.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!selectedStory ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a story</h3>
                <p className="text-muted-foreground">Choose a story to view and edit its chapters</p>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {chapters.length} chapters in "{selectedStory.title}"
                  </h3>
                  <Button size="sm">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Chapter
                  </Button>
                </div>

                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <Card key={chapter.id} className="p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium">
                              Chapter {chapter.chapterNumber}: {chapter.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              chapter.isPublished 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            }`}>
                              {chapter.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Edit3 className="h-3 w-3" />
                              {chapter.wordCount.toLocaleString()} words
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {chapter.publishedAt 
                                ? `Published ${formatDate(chapter.publishedAt)}`
                                : `Updated ${formatDate(chapter.updatedAt)}`
                              }
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {!chapter.isPublished && (
                            <Button variant="outline" size="sm">
                              Publish
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Analytics</h2>
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Analytics Coming Soon</h3>
              <p className="text-muted-foreground">
                Detailed analytics for your stories will be available here, including read statistics, 
                reader demographics, and engagement metrics.
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* New Story Form Modal */}
      {showNewStoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Story</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateStory({
                title: formData.get('title') as string,
                description: formData.get('description') as string,
                genre: formData.get('genre') as string,
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <Input name="title" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    placeholder="What's your story about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Genre</label>
                  <select name="genre" className="w-full px-3 py-2 border border-border rounded-md bg-background">
                    <option value="">Select a genre</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Romance">Romance</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Horror">Horror</option>
                    <option value="Literary">Literary</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-6">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Story'}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowNewStoryForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}