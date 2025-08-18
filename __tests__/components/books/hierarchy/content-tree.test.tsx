import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import ContentTree from '@/components/books/hierarchy/content-tree';

// Mock next/router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1',
  query: { bookId: 'book-1', storyId: 'story-1', partId: 'part-1', chapterId: 'chapter-1' }
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useParams: () => mockRouter.query
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('ContentTree Component', () => {
  const mockHierarchyData = {
    bookId: 'book-1',
    stories: [
      {
        id: 'story-1',
        title: 'The Beginning',
        order: 0,
        bookId: 'book-1',
        wordCount: 5000,
        partCount: 2,
        isActive: true,
        parts: [
          {
            id: 'part-1',
            storyId: 'story-1',
            title: 'Origins',
            partNumber: 1,
            order: 0,
            wordCount: 2500,
            chapterCount: 2,
            chapters: [
              {
                id: 'chapter-1',
                partId: 'part-1',
                title: 'Chapter One',
                chapterNumber: 1,
                globalChapterNumber: 1,
                order: 0,
                wordCount: 1200,
                sceneCount: 3,
                isPublished: true,
                scenes: [
                  {
                    id: 'scene-1',
                    chapterId: 'chapter-1',
                    title: 'Opening Scene',
                    sceneNumber: 1,
                    order: 0,
                    wordCount: 400,
                    sceneType: 'action',
                    isComplete: true
                  },
                  {
                    id: 'scene-2',
                    chapterId: 'chapter-1',
                    title: 'Dialogue Scene',
                    sceneNumber: 2,
                    order: 1,
                    wordCount: 500,
                    sceneType: 'dialogue',
                    isComplete: true
                  },
                  {
                    id: 'scene-3',
                    chapterId: 'chapter-1',
                    title: 'Cliffhanger',
                    sceneNumber: 3,
                    order: 2,
                    wordCount: 300,
                    sceneType: 'climax',
                    isComplete: false
                  }
                ]
              },
              {
                id: 'chapter-2',
                partId: 'part-1',
                title: 'Chapter Two',
                chapterNumber: 2,
                globalChapterNumber: 2,
                order: 1,
                wordCount: 1300,
                sceneCount: 2,
                isPublished: false,
                scenes: [
                  {
                    id: 'scene-4',
                    chapterId: 'chapter-2',
                    title: 'Revelation',
                    sceneNumber: 1,
                    order: 0,
                    wordCount: 700,
                    sceneType: 'exposition',
                    isComplete: true
                  }
                ]
              }
            ]
          },
          {
            id: 'part-2',
            storyId: 'story-1',
            title: 'Development',
            partNumber: 2,
            order: 1,
            wordCount: 2500,
            chapterCount: 1,
            chapters: [
              {
                id: 'chapter-3',
                partId: 'part-2',
                title: 'Chapter Three',
                chapterNumber: 3,
                globalChapterNumber: 3,
                order: 0,
                wordCount: 2500,
                sceneCount: 4,
                isPublished: false,
                scenes: []
              }
            ]
          }
        ]
      },
      {
        id: 'story-2',
        title: 'The Sequel',
        order: 1,
        bookId: 'book-1',
        wordCount: 0,
        partCount: 0,
        isActive: false,
        parts: []
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ hierarchy: mockHierarchyData })
    });
  });

  describe('Component Rendering', () => {
    it('should render the tree structure with proper hierarchy', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Should show story level
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('The Sequel')).toBeInTheDocument();
    });

    it('should display story statistics correctly', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Should show word count and part count
      expect(screen.getByText('5,000 words')).toBeInTheDocument();
      expect(screen.getByText('2 parts')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<ContentTree bookId="book-1" />);

      expect(screen.getByTestId('content-tree-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading hierarchy...')).toBeInTheDocument();
    });

    it('should handle error state when API fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-tree-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load book hierarchy')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should show empty state when no stories exist', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hierarchy: { bookId: 'book-1', stories: [] } })
      });

      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-tree-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No stories found')).toBeInTheDocument();
    });
  });

  describe('Tree Expansion and Collapse', () => {
    it('should expand and collapse story nodes', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Should be collapsed initially
      expect(screen.queryByText('Origins')).not.toBeInTheDocument();

      // Click expand button
      const expandButton = screen.getByTestId('expand-story-story-1');
      fireEvent.click(expandButton);

      // Should show parts after expansion
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
        expect(screen.getByText('Development')).toBeInTheDocument();
      });

      // Click collapse button
      fireEvent.click(expandButton);

      // Should hide parts after collapse
      await waitFor(() => {
        expect(screen.queryByText('Origins')).not.toBeInTheDocument();
      });
    });

    it('should expand and collapse part nodes', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand story first
      fireEvent.click(screen.getByTestId('expand-story-story-1'));

      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      // Should be collapsed initially
      expect(screen.queryByText('Chapter One')).not.toBeInTheDocument();

      // Click expand part
      const expandButton = screen.getByTestId('expand-part-part-1');
      fireEvent.click(expandButton);

      // Should show chapters after expansion
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
        expect(screen.getByText('Chapter Two')).toBeInTheDocument();
      });
    });

    it('should expand and collapse chapter nodes', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand story and part
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Should be collapsed initially
      expect(screen.queryByText('Opening Scene')).not.toBeInTheDocument();

      // Click expand chapter
      const expandButton = screen.getByTestId('expand-chapter-chapter-1');
      fireEvent.click(expandButton);

      // Should show scenes after expansion
      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
        expect(screen.getByText('Dialogue Scene')).toBeInTheDocument();
        expect(screen.getByText('Cliffhanger')).toBeInTheDocument();
      });
    });

    it('should remember expansion state when navigating', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to chapter level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Navigate to a different page and back
      mockRouter.pathname = '/books/book-1';
      fireEvent.click(screen.getByText('Chapter One'));

      // Should maintain expansion state
      expect(screen.getByText('Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter One')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('should navigate to story page when story is clicked', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('The Beginning'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');
    });

    it('should navigate to part page when part is clicked', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand story first
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Origins'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1');
    });

    it('should navigate to chapter page when chapter is clicked', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to chapter level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Chapter One'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1');
    });

    it('should navigate to scene write page when scene is clicked', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to scene level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-chapter-chapter-1'));
      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Opening Scene'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write');
    });
  });

  describe('Current Location Highlighting', () => {
    it('should highlight current story', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1';
      
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const currentStory = screen.getByTestId('tree-node-story-story-1');
      expect(currentStory).toHaveClass('bg-primary-50', 'border-primary-200');
    });

    it('should highlight current part', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1/parts/part-1';
      
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to show part
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      const currentPart = screen.getByTestId('tree-node-part-part-1');
      expect(currentPart).toHaveClass('bg-primary-50', 'border-primary-200');
    });

    it('should highlight current chapter', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1';
      
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to show chapter
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      const currentChapter = screen.getByTestId('tree-node-chapter-chapter-1');
      expect(currentChapter).toHaveClass('bg-primary-50', 'border-primary-200');
    });

    it('should highlight current scene', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write';
      
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to show scene
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-chapter-chapter-1'));
      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
      });

      const currentScene = screen.getByTestId('tree-node-scene-scene-1');
      expect(currentScene).toHaveClass('bg-primary-50', 'border-primary-200');
    });
  });

  describe('Visual Indicators', () => {
    it('should show correct expand/collapse icons', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Should show right arrow for collapsed state
      const expandButton = screen.getByTestId('expand-story-story-1');
      expect(expandButton).toHaveAttribute('aria-expanded', 'false');
      expect(expandButton.querySelector('[data-icon="chevron-right"]')).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      // Should show down arrow for expanded state
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
      expect(expandButton.querySelector('[data-icon="chevron-down"]')).toBeInTheDocument();
    });

    it('should show status indicators for published/unpublished content', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to chapter level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Published chapter should have published indicator
      const publishedChapter = screen.getByTestId('tree-node-chapter-chapter-1');
      expect(publishedChapter.querySelector('[data-icon="check-circle"]')).toBeInTheDocument();

      // Unpublished chapter should have draft indicator
      const draftChapter = screen.getByTestId('tree-node-chapter-chapter-2');
      expect(draftChapter.querySelector('[data-icon="edit"]')).toBeInTheDocument();
    });

    it('should show completion status for scenes', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Expand to scene level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('expand-chapter-chapter-1'));
      await waitFor(() => {
        expect(screen.getByText('Opening Scene')).toBeInTheDocument();
      });

      // Complete scenes should have check icon
      const completeScene1 = screen.getByTestId('tree-node-scene-scene-1');
      expect(completeScene1.querySelector('[data-icon="check"]')).toBeInTheDocument();

      const completeScene2 = screen.getByTestId('tree-node-scene-scene-2');
      expect(completeScene2.querySelector('[data-icon="check"]')).toBeInTheDocument();

      // Incomplete scene should have clock icon
      const incompleteScene = screen.getByTestId('tree-node-scene-scene-3');
      expect(incompleteScene.querySelector('[data-icon="clock"]')).toBeInTheDocument();
    });

    it('should show word count for each level', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Story level word count
      expect(screen.getByText('5,000 words')).toBeInTheDocument();

      // Expand to show part level
      fireEvent.click(screen.getByTestId('expand-story-story-1'));
      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      expect(screen.getByText('2,500 words')).toBeInTheDocument();

      // Expand to show chapter level
      fireEvent.click(screen.getByTestId('expand-part-part-1'));
      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      expect(screen.getByText('1,200 words')).toBeInTheDocument();
      expect(screen.getByText('1,300 words')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      // Focus first story
      const firstStory = screen.getByTestId('tree-node-story-story-1');
      firstStory.focus();

      // Arrow down should move to next story
      await user.keyboard('{ArrowDown}');
      
      const secondStory = screen.getByTestId('tree-node-story-story-2');
      expect(secondStory).toHaveFocus();

      // Arrow up should move back
      await user.keyboard('{ArrowUp}');
      expect(firstStory).toHaveFocus();
    });

    it('should support expand/collapse with Enter and Space', async () => {
      const user = userEvent.setup();
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const expandButton = screen.getByTestId('expand-story-story-1');
      expandButton.focus();

      // Enter should expand
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      // Space should collapse
      await user.keyboard('{Space}');

      await waitFor(() => {
        expect(screen.queryByText('Origins')).not.toBeInTheDocument();
      });
    });

    it('should support right arrow to expand and left arrow to collapse', async () => {
      const user = userEvent.setup();
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const firstStory = screen.getByTestId('tree-node-story-story-1');
      firstStory.focus();

      // Right arrow should expand
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      // Left arrow should collapse
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByText('Origins')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const tree = screen.getByRole('tree');
      expect(tree).toHaveAttribute('aria-label', 'Book hierarchy navigation');

      const treeItem = screen.getByRole('treeitem', { name: /The Beginning/ });
      expect(treeItem).toHaveAttribute('aria-expanded', 'false');
      expect(treeItem).toHaveAttribute('aria-level', '1');
    });

    it('should update ARIA attributes when expanding/collapsing', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const treeItem = screen.getByRole('treeitem', { name: /The Beginning/ });
      const expandButton = screen.getByTestId('expand-story-story-1');

      expect(treeItem).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Origins')).toBeInTheDocument();
      });

      expect(treeItem).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have proper heading structure', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const treeHeading = screen.getByRole('heading', { level: 2 });
      expect(treeHeading).toHaveTextContent('Book Structure');
    });

    it('should announce changes to screen readers', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Expand story
      fireEvent.click(screen.getByTestId('expand-story-story-1'));

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Expanded The Beginning story, showing 2 parts');
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily when props remain the same', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <ContentTree {...props} />;
      };

      const { rerender } = render(<TestWrapper bookId="book-1" />);
      rerender(<TestWrapper bookId="book-1" />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle large hierarchy data efficiently', async () => {
      // Create large dataset
      const largeHierarchy = {
        bookId: 'book-1',
        stories: Array.from({ length: 100 }, (_, i) => ({
          id: `story-${i}`,
          title: `Story ${i}`,
          order: i,
          bookId: 'book-1',
          wordCount: 1000,
          partCount: 5,
          isActive: true,
          parts: Array.from({ length: 5 }, (_, j) => ({
            id: `part-${i}-${j}`,
            storyId: `story-${i}`,
            title: `Part ${j}`,
            partNumber: j,
            order: j,
            wordCount: 200,
            chapterCount: 4,
            chapters: []
          }))
        }))
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hierarchy: largeHierarchy })
      });

      const startTime = performance.now();
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('Story 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 1 second)
      expect(renderTime).toBeLessThan(1000);
    });

    it('should virtualize long lists to improve performance', async () => {
      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const treeContainer = screen.getByTestId('content-tree-container');
      expect(treeContainer).toHaveAttribute('data-virtualized', 'true');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API errors gracefully and allow retry', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-tree-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to load book hierarchy')).toBeInTheDocument();

      // Mock successful retry
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hierarchy: mockHierarchyData })
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });
    });

    it('should handle malformed hierarchy data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hierarchy: { bookId: 'book-1', stories: null } })
      });

      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        expect(screen.getByTestId('content-tree-empty')).toBeInTheDocument();
      });

      expect(screen.getByText('No stories found')).toBeInTheDocument();
    });

    it('should handle missing IDs gracefully', async () => {
      const malformedData = {
        bookId: 'book-1',
        stories: [
          {
            // Missing id
            title: 'Story Without ID',
            order: 0,
            bookId: 'book-1',
            wordCount: 1000,
            partCount: 0,
            isActive: true,
            parts: []
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ hierarchy: malformedData })
      });

      render(<ContentTree bookId="book-1" />);

      await waitFor(() => {
        // Should not crash and should display what it can
        expect(screen.getByText('Story Without ID')).toBeInTheDocument();
      });
    });
  });
});