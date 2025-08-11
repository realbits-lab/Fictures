'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Bookmark, 
  Heart, 
  Share,
  Menu,
  ArrowLeft,
  Eye,
  Clock
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: any; // ProseMirror JSON content
  wordCount: number;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  authorNote: string | null;
}

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
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ReadingProgress {
  currentChapterNumber: number;
  currentPosition: number;
  lastReadAt: Date;
  totalTimeRead: number;
  isCompleted: boolean;
}

interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  width: 'narrow' | 'medium' | 'wide';
}

interface StoryReaderProps {
  storyId: string;
  chapterNumber?: number;
  userId?: string;
  initialStory?: Story;
  initialChapter?: Chapter;
}

const SAMPLE_STORY: Story = {
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
    name: 'Sarah Chen',
    email: 'author1@example.com',
  },
};

const SAMPLE_CHAPTER: Chapter = {
  id: 'chapter1',
  storyId: '1',
  chapterNumber: 1,
  title: 'The Awakening',
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'The morning sun cast long shadows across the cobblestone streets of Valdris, its golden rays barely penetrating the thick canopy of ancient oak trees that lined the main thoroughfare. Aria Moonwhisper pulled her hood lower over her silver hair, her violet eyes scanning the bustling marketplace with practiced caution.'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'At seventeen, she had learned to hide her true nature well. In a world where magic was not just forbidden but punishable by death, being born with the ability to commune with the elements was both a blessing and a curse. Her grandmother had taught her well—suppress the power, blend in with the ordinary folk, and never, ever let anyone discover what she truly was.'
          }
        ]
      }
    ]
  },
  wordCount: 1250,
  isPublished: true,
  publishedAt: new Date('2024-01-15'),
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-15'),
  authorNote: 'Welcome to the world of Eldara! This is where our journey begins...',
};

export function StoryReader({ 
  storyId, 
  chapterNumber = 1, 
  userId,
  initialStory,
  initialChapter 
}: StoryReaderProps) {
  const [story, setStory] = useState<Story>(initialStory || SAMPLE_STORY);
  const [chapter, setChapter] = useState<Chapter>(initialChapter || SAMPLE_CHAPTER);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  const [settings, setSettings] = useState<ReaderSettings>({
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    theme: 'light',
    width: 'medium',
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Track reading progress
  useEffect(() => {
    const trackProgress = () => {
      if (!contentRef.current || !userId) return;
      
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight;
      const clientHeight = element.clientHeight;
      
      const progressPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;
      scrollPositionRef.current = Math.min(progressPercentage, 100);
      
      // Update progress in database (mock)
      if (progressPercentage > 10) { // Only track if user has read some content
        // Mock API call - in real app would call updateReadingProgress
        setProgress({
          currentChapterNumber: chapter.chapterNumber,
          currentPosition: progressPercentage,
          lastReadAt: new Date(),
          totalTimeRead: (progress?.totalTimeRead || 0) + 1,
          isCompleted: progressPercentage > 90,
        });
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', trackProgress);
      return () => element.removeEventListener('scroll', trackProgress);
    }
  }, [userId, chapter.chapterNumber, progress?.totalTimeRead]);

  const renderContent = (content: any): string => {
    if (!content || !content.content) return '';
    
    return content.content.map((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        const text = node.content.map((textNode: any) => textNode.text || '').join('');
        return `<p class="mb-4">${text}</p>`;
      }
      return '';
    }).join('');
  };

  const handlePreviousChapter = async () => {
    if (chapter.chapterNumber > 1) {
      setLoading(true);
      try {
        // Mock API call - in real app would fetch previous chapter
        await new Promise(resolve => setTimeout(resolve, 300));
        // For demo, just update chapter number
        setChapter({
          ...chapter,
          chapterNumber: chapter.chapterNumber - 1,
          title: `Chapter ${chapter.chapterNumber - 1}`,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleNextChapter = async () => {
    if (chapter.chapterNumber < story.chapterCount) {
      setLoading(true);
      try {
        // Mock API call - in real app would fetch next chapter
        await new Promise(resolve => setTimeout(resolve, 300));
        setChapter({
          ...chapter,
          chapterNumber: chapter.chapterNumber + 1,
          title: `Chapter ${chapter.chapterNumber + 1}`,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLikeToggle = async () => {
    try {
      setIsLiked(!isLiked);
      // Mock API call - in real app would call likeStory/unlikeStory
      setStory(prev => ({
        ...prev,
        likeCount: isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
    } catch (error) {
      console.error('Like toggle failed:', error);
      setIsLiked(!isLiked); // Revert on error
    }
  };

  const handleBookmarkToggle = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      // Mock API call - in real app would call bookmarkStory/unbookmarkStory
    } catch (error) {
      console.error('Bookmark toggle failed:', error);
      setIsBookmarked(!isBookmarked); // Revert on error
    }
  };

  const getWidthClass = () => {
    switch (settings.width) {
      case 'narrow': return 'max-w-2xl';
      case 'wide': return 'max-w-6xl';
      default: return 'max-w-4xl';
    }
  };

  const getThemeClass = () => {
    switch (settings.theme) {
      case 'dark': return 'bg-gray-900 text-gray-100';
      case 'sepia': return 'bg-yellow-50 text-yellow-900';
      default: return 'bg-white text-gray-900';
    }
  };

  return (
    <div className={`min-h-screen ${getThemeClass()}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{story.title}</h1>
              <p className="text-sm text-muted-foreground">{chapter.title}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkToggle}
              className={isBookmarked ? 'text-blue-600' : ''}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeToggle}
              className={isLiked ? 'text-red-600' : ''}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Reading Progress Bar */}
        {progress && (
          <div className="w-full bg-gray-200 dark:bg-gray-700 h-1">
            <div 
              className="bg-primary h-1 transition-all duration-300"
              style={{ width: `${progress.currentPosition}%` }}
            />
          </div>
        )}
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-16 right-4 z-40 p-4 w-80 shadow-lg">
          <h3 className="font-medium mb-4">Reader Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Font Size</label>
              <input
                type="range"
                min="12"
                max="24"
                value={settings.fontSize}
                onChange={(e) => setSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Theme</label>
              <select 
                value={settings.theme}
                onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Width</label>
              <select 
                value={settings.width}
                onChange={(e) => setSettings(prev => ({ ...prev, width: e.target.value as any }))}
                className="w-full p-2 border rounded"
              >
                <option value="narrow">Narrow</option>
                <option value="medium">Medium</option>
                <option value="wide">Wide</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex">
        {/* Chapter Content */}
        <main className="flex-1">
          <div className={`mx-auto px-4 py-8 ${getWidthClass()}`}>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>Loading chapter...</p>
              </div>
            ) : (
              <>
                {/* Chapter Header */}
                <header className="text-center mb-8 border-b pb-6">
                  <h1 className="text-2xl font-bold mb-2">{chapter.title}</h1>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.ceil(chapter.wordCount / 200)} min read
                    </span>
                    <span>{chapter.wordCount.toLocaleString()} words</span>
                  </div>
                </header>

                {/* Chapter Content */}
                <div 
                  ref={contentRef}
                  className="prose prose-lg max-w-none"
                  style={{ 
                    fontSize: settings.fontSize,
                    lineHeight: settings.lineHeight,
                    fontFamily: settings.fontFamily,
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: renderContent(chapter.content) 
                  }}
                />

                {/* Author Note */}
                {chapter.authorNote && (
                  <Card className="mt-8 p-4 bg-muted/50">
                    <h4 className="font-medium mb-2">Author's Note</h4>
                    <p className="text-sm text-muted-foreground">{chapter.authorNote}</p>
                  </Card>
                )}

                {/* Chapter Navigation */}
                <div className="flex items-center justify-between mt-12 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePreviousChapter}
                    disabled={chapter.chapterNumber <= 1 || loading}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Chapter {chapter.chapterNumber} of {story.chapterCount}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={handleNextChapter}
                    disabled={chapter.chapterNumber >= story.chapterCount || loading}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Sidebar - Table of Contents */}
        {showSidebar && (
          <aside className="w-80 border-l bg-card/50 p-6">
            <h3 className="font-medium mb-4">Table of Contents</h3>
            <div className="space-y-2">
              {[...Array(story.chapterCount)].map((_, index) => {
                const chapterNum = index + 1;
                const isCurrentChapter = chapterNum === chapter.chapterNumber;
                
                return (
                  <button
                    key={chapterNum}
                    className={`block w-full text-left p-2 rounded text-sm hover:bg-accent ${
                      isCurrentChapter ? 'bg-accent font-medium' : ''
                    }`}
                    onClick={() => {
                      // Mock chapter navigation
                      setChapter({
                        ...chapter,
                        chapterNumber: chapterNum,
                        title: `Chapter ${chapterNum}`,
                      });
                    }}
                  >
                    Chapter {chapterNum}
                  </button>
                );
              })}
            </div>

            {/* Story Stats */}
            <Card className="mt-6 p-4">
              <h4 className="font-medium mb-2">Story Stats</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Chapters:</span>
                  <span>{story.chapterCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Word Count:</span>
                  <span>{story.wordCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reads:</span>
                  <span>{story.readCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Likes:</span>
                  <span>{story.likeCount}</span>
                </div>
              </div>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}