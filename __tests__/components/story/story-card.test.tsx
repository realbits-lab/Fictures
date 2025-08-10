import { describe, test, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryCard, type StoryWithAuthor } from '@/components/story/story-card';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

describe('StoryCard Component', () => {
  const mockStory: StoryWithAuthor = {
    id: 'story-123',
    title: 'Test Story Title',
    description: 'This is a test story description that should be displayed in the card.',
    genre: 'fantasy',
    status: 'ongoing',
    authorId: 'author-123',
    isPublished: true,
    publishedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    wordCount: 15000,
    chapterCount: 5,
    readCount: 100,
    likeCount: 25,
    coverImageUrl: 'https://example.com/cover.jpg',
    tags: ['magic', 'adventure', 'dragons'],
    mature: false,
    author: {
      id: 'author-123',
      name: 'John Author',
      email: 'john@example.com',
      image: 'https://example.com/avatar.jpg',
      password: null,
    },
  };

  const user = userEvent.setup();

  test('should render story title and description', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const { container } = render(<StoryCard story={mockStory} />);
    console.log('Container HTML:', container.innerHTML);
    
    expect(screen.getByText('Test Story Title')).toBeInTheDocument();
    expect(screen.getByText(/This is a test story description/)).toBeInTheDocument();
  });

  test('should display author information', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText('John Author')).toBeInTheDocument();
    expect(screen.getByAltText('John Author avatar')).toBeInTheDocument();
  });

  test('should show story statistics', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText(/15,000\s+words/i)).toBeInTheDocument();
    expect(screen.getByText(/5\s+chapters/i)).toBeInTheDocument();
    expect(screen.getByText(/100\s+reads/i)).toBeInTheDocument();
    expect(screen.getByText(/25\s+likes/i)).toBeInTheDocument();
  });

  test('should display genre and status', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Ongoing')).toBeInTheDocument();
  });

  test('should render story tags', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText('magic')).toBeInTheDocument();
    expect(screen.getByText('adventure')).toBeInTheDocument();
    expect(screen.getByText('dragons')).toBeInTheDocument();
  });

  test('should display cover image when provided', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    const coverImage = screen.getByAltText('Test Story Title cover');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  test('should show default cover when no image provided', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const storyWithoutCover = { ...mockStory, coverImageUrl: null };
    render(<StoryCard story={storyWithoutCover} />);
    
    expect(screen.getByText(/no cover/i)).toBeInTheDocument();
  });

  test('should indicate mature content when applicable', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const matureStory = { ...mockStory, mature: true };
    render(<StoryCard story={matureStory} />);
    
    expect(screen.getByText(/mature/i)).toBeInTheDocument();
    expect(screen.getByText(/18\+/i)).toBeInTheDocument();
  });

  test('should show publication date', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    expect(screen.getByText(/jan 1, 2024/i)).toBeInTheDocument();
  });

  test('should be clickable and link to story page', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} />);
    
    const storyLink = screen.getByRole('link');
    expect(storyLink).toHaveAttribute('href', '/stories/story-123');
  });

  test('should show bookmark button for logged-in users', () => {
    // This test will fail because StoryCard component doesn't exist yet
    render(<StoryCard story={mockStory} showActions={true} />);
    
    expect(screen.getByRole('button', { name: /bookmark/i })).toBeInTheDocument();
  });

  test('should show like button and handle like interaction', async () => {
    // This test will fail because StoryCard component doesn't exist yet
    const mockOnLike = jest.fn();
    render(<StoryCard story={mockStory} showActions={true} onLike={mockOnLike} />);
    
    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeInTheDocument();
    
    await user.click(likeButton);
    expect(mockOnLike).toHaveBeenCalledWith('story-123');
  });

  test('should truncate long descriptions', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const longDescription = 'A'.repeat(300);
    const storyWithLongDesc = { ...mockStory, description: longDescription };
    
    render(<StoryCard story={storyWithLongDesc} />);
    
    const description = screen.getByText(/A+/);
    expect(description.textContent).toHaveLength(150); // Assuming 150 char limit
    expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
  });

  test('should handle different story statuses', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const completedStory = { ...mockStory, status: 'completed' as const };
    render(<StoryCard story={completedStory} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByTestId('status-completed')).toHaveClass('text-green-600');
  });

  test('should show reading progress when provided', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const readingProgress = {
      currentChapterNumber: 3,
      totalChapters: 5,
      progressPercentage: 60,
    };
    
    render(<StoryCard story={mockStory} readingProgress={readingProgress} />);
    
    expect(screen.getByText(/chapter 3 of 5/i)).toBeInTheDocument();
    expect(screen.getByText(/60% complete/i)).toBeInTheDocument();
  });

  test('should display last update information', () => {
    // This test will fail because StoryCard component doesn't exist yet
    const recentUpdate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    const recentlyUpdatedStory = { ...mockStory, updatedAt: recentUpdate };
    
    render(<StoryCard story={recentlyUpdatedStory} />);
    
    expect(screen.getByText(/updated 1 day ago/i)).toBeInTheDocument();
  });
});