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

export function StoryCard({ 
  story, 
  showActions = false, 
  onLike,
  readingProgress 
}: StoryCardProps) {
  return (
    <div>
      <h3>{story.title}</h3>
      <span>{story.author.name}</span>
      <p>{story.description}</p>
      <div>Test</div>
    </div>
  );
}