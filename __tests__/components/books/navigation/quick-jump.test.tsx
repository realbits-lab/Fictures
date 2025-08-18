import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import QuickJump from '@/components/books/navigation/quick-jump';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}));

// Mock fetch for search API
global.fetch = jest.fn();

describe('QuickJump Component', () => {
  const mockSearchResults = {
    results: [
      {
        id: 'story-1',
        type: 'story',
        title: 'The Beginning',
        path: '/books/book-1/stories/story-1',
        breadcrumb: ['My Novel', 'The Beginning'],
        content: 'A young hero begins their journey...',
        wordCount: 5000,
        lastModified: '2024-01-15T10:30:00Z'
      },
      {
        id: 'part-1',
        type: 'part',
        title: 'Origins',
        path: '/books/book-1/stories/story-1/parts/part-1',
        breadcrumb: ['My Novel', 'The Beginning', 'Part 1: Origins'],
        content: 'The hero discovers their powers...',
        wordCount: 2500,
        lastModified: '2024-01-14T15:20:00Z'
      },
      {
        id: 'chapter-1',
        type: 'chapter',
        title: 'Chapter One',
        path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1',
        breadcrumb: ['My Novel', 'The Beginning', 'Part 1: Origins', 'Chapter 1: Chapter One'],
        content: 'The hero wakes from a strange dream...',
        wordCount: 1200,
        lastModified: '2024-01-16T09:45:00Z'
      },
      {
        id: 'scene-1',
        type: 'scene',
        title: 'The Awakening',
        path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write',
        breadcrumb: ['My Novel', 'The Beginning', 'Part 1: Origins', 'Chapter 1: Chapter One', 'Scene 1: The Awakening'],
        content: 'Hero awakens with newfound abilities...',
        wordCount: 400,
        lastModified: '2024-01-16T14:20:00Z'
      }
    ],
    totalResults: 4,
    searchTime: 45
  };

  const mockRecentItems = [
    {
      id: 'chapter-2',
      type: 'chapter',
      title: 'Chapter Two',
      path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-2',
      breadcrumb: ['My Novel', 'The Beginning', 'Part 1: Origins', 'Chapter 2: Chapter Two'],
      lastVisited: '2024-01-16T16:30:00Z'
    },
    {
      id: 'scene-3',
      type: 'scene',
      title: 'Confrontation',
      path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-3/write',
      breadcrumb: ['My Novel', 'The Beginning', 'Part 1: Origins', 'Chapter 1: Chapter One', 'Scene 3: Confrontation'],
      lastVisited: '2024-01-16T15:15:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSearchResults)
    });

    // Mock localStorage for recent items
    const localStorageMock = {
      getItem: jest.fn(() => JSON.stringify(mockRecentItems)),
      setItem: jest.fn(),
      removeItem: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  describe('Component Rendering', () => {
    it('should render the quick jump trigger button', () => {
      render(<QuickJump bookId="book-1" />);

      expect(screen.getByTestId('quick-jump-trigger')).toBeInTheDocument();
      expect(screen.getByLabelText('Quick navigation (Cmd+K)')).toBeInTheDocument();
    });

    it('should show the modal when trigger is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      const trigger = screen.getByTestId('quick-jump-trigger');
      await user.click(trigger);

      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should open modal with Cmd+K keyboard shortcut', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();
    });

    it('should open modal with Ctrl+K keyboard shortcut on Windows', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Control>}k{/Control}');

      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();
    });

    it('should close modal when ESC is pressed', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');
      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      expect(screen.queryByTestId('quick-jump-modal')).not.toBeInTheDocument();
    });

    it('should close modal when clicking overlay', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');
      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();

      const overlay = screen.getByTestId('modal-overlay');
      await user.click(overlay);
      expect(screen.queryByTestId('quick-jump-modal')).not.toBeInTheDocument();
    });
  });

  describe('Recent Items Display', () => {
    it('should show recent items when modal opens', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.getByText('Chapter Two')).toBeInTheDocument();
      expect(screen.getByText('Confrontation')).toBeInTheDocument();
    });

    it('should show empty state when no recent items', async () => {
      const user = userEvent.setup();
      window.localStorage.getItem = jest.fn(() => JSON.stringify([]));
      
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByText('No recent items')).toBeInTheDocument();
    });

    it('should navigate to recent item when clicked', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const recentItem = screen.getByTestId('recent-item-chapter-2');
      await user.click(recentItem);

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-2');
      expect(screen.queryByTestId('quick-jump-modal')).not.toBeInTheDocument();
    });

    it('should show relative timestamps for recent items', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByText(/ago/)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should perform search when typing in search input', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/books/book-1/search', 
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"query":"chapter"')
          })
        );
      });
    });

    it('should display search results', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      expect(screen.getByText('The Awakening')).toBeInTheDocument();
      expect(screen.getByText('4 results')).toBeInTheDocument();
    });

    it('should show search loading state', async () => {
      const user = userEvent.setup();
      
      // Mock slow search response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockSearchResults)
          }), 1000)
        )
      );

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });

    it('should show no results state', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [], totalResults: 0, searchTime: 20 })
      });

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });

      expect(screen.getByText('Try a different search term')).toBeInTheDocument();
    });

    it('should handle search errors gracefully', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockRejectedValue(new Error('Search failed'));

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Search error')).toBeInTheDocument();
      });

      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should debounce search requests', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      
      // Type rapidly
      await user.type(searchInput, 'c');
      await user.type(searchInput, 'h');
      await user.type(searchInput, 'a');
      await user.type(searchInput, 'p');

      // Should only make one API call after debounce delay
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    it('should clear search when input is cleared', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      await user.clear(searchInput);

      // Should show recent items again
      expect(screen.getByText('Recent')).toBeInTheDocument();
      expect(screen.queryByText('Chapter One')).not.toBeInTheDocument();
    });
  });

  describe('Search Result Navigation', () => {
    it('should navigate to selected search result', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      const resultItem = screen.getByTestId('search-result-chapter-1');
      await user.click(resultItem);

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1');
      expect(screen.queryByTestId('quick-jump-modal')).not.toBeInTheDocument();
    });

    it('should support keyboard navigation through results', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Arrow down should highlight first result
      await user.keyboard('{ArrowDown}');
      
      const firstResult = screen.getByTestId('search-result-story-1');
      expect(firstResult).toHaveClass('bg-primary-50');

      // Arrow down should move to next result
      await user.keyboard('{ArrowDown}');
      
      const secondResult = screen.getByTestId('search-result-part-1');
      expect(secondResult).toHaveClass('bg-primary-50');
      expect(firstResult).not.toHaveClass('bg-primary-50');
    });

    it('should navigate to highlighted result with Enter', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');
    });

    it('should wrap around when navigating past last result', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Navigate to last result
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      const lastResult = screen.getByTestId('search-result-scene-1');
      expect(lastResult).toHaveClass('bg-primary-50');

      // Arrow down should wrap to first result
      await user.keyboard('{ArrowDown}');
      
      const firstResult = screen.getByTestId('search-result-story-1');
      expect(firstResult).toHaveClass('bg-primary-50');
    });

    it('should support arrow up navigation', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      const secondResult = screen.getByTestId('search-result-part-1');
      expect(secondResult).toHaveClass('bg-primary-50');

      await user.keyboard('{ArrowUp}');

      const firstResult = screen.getByTestId('search-result-story-1');
      expect(firstResult).toHaveClass('bg-primary-50');
    });
  });

  describe('Search Result Display', () => {
    it('should show breadcrumb for each result', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('My Novel > The Beginning')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel > The Beginning > Part 1: Origins')).toBeInTheDocument();
    });

    it('should show content preview for each result', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('A young hero begins their journey...')).toBeInTheDocument();
      });

      expect(screen.getByText('The hero discovers their powers...')).toBeInTheDocument();
    });

    it('should show word count and last modified date', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('5,000 words')).toBeInTheDocument();
      });

      expect(screen.getByText('1,200 words')).toBeInTheDocument();
      expect(screen.getByText(/Jan 16/)).toBeInTheDocument();
    });

    it('should show type indicators for different content types', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByTestId('type-story')).toBeInTheDocument();
      });

      expect(screen.getByTestId('type-part')).toBeInTheDocument();
      expect(screen.getByTestId('type-chapter')).toBeInTheDocument();
      expect(screen.getByTestId('type-scene')).toBeInTheDocument();
    });

    it('should highlight search matches in titles and content', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByTestId('highlighted-title-chapter-1')).toBeInTheDocument();
      });

      const highlightedTitle = screen.getByTestId('highlighted-title-chapter-1');
      expect(highlightedTitle).toHaveClass('bg-yellow-200');
    });
  });

  describe('Filter and Sort Options', () => {
    it('should show filter options', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByTestId('filter-options')).toBeInTheDocument();
      expect(screen.getByLabelText('Stories')).toBeInTheDocument();
      expect(screen.getByLabelText('Parts')).toBeInTheDocument();
      expect(screen.getByLabelText('Chapters')).toBeInTheDocument();
      expect(screen.getByLabelText('Scenes')).toBeInTheDocument();
    });

    it('should filter results by content type', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      // Uncheck chapters filter
      const chaptersFilter = screen.getByLabelText('Chapters');
      await user.click(chaptersFilter);

      expect(screen.queryByText('Chapter One')).not.toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument(); // Story still visible
    });

    it('should show sort options', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByTestId('sort-options')).toBeInTheDocument();
      expect(screen.getByText('Relevance')).toBeInTheDocument();
      expect(screen.getByText('Last Modified')).toBeInTheDocument();
      expect(screen.getByText('Word Count')).toBeInTheDocument();
    });

    it('should sort results by selected option', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      const sortButton = screen.getByText('Last Modified');
      await user.click(sortButton);

      // Results should be reordered by last modified date
      const resultContainer = screen.getByTestId('search-results');
      const firstResult = resultContainer.firstElementChild;
      expect(firstResult).toHaveAttribute('data-testid', 'search-result-scene-1');
    });
  });

  describe('Recent Items Management', () => {
    it('should add visited item to recent list', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Chapter One')).toBeInTheDocument();
      });

      const resultItem = screen.getByTestId('search-result-chapter-1');
      await user.click(resultItem);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'quickJumpRecent-book-1',
        expect.stringContaining('chapter-1')
      );
    });

    it('should limit recent items to maximum count', async () => {
      const user = userEvent.setup();
      
      // Mock localStorage with many items
      const manyRecentItems = Array.from({ length: 15 }, (_, i) => ({
        id: `item-${i}`,
        type: 'chapter',
        title: `Chapter ${i}`,
        path: `/books/book-1/chapters/${i}`,
        breadcrumb: [`Chapter ${i}`],
        lastVisited: new Date().toISOString()
      }));

      window.localStorage.getItem = jest.fn(() => JSON.stringify(manyRecentItems));

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      // Should only show first 10 items (or whatever the limit is)
      const recentItems = screen.getAllByTestId(/^recent-item-/);
      expect(recentItems.length).toBeLessThanOrEqual(10);
    });

    it('should allow clearing recent items', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByText('Chapter Two')).toBeInTheDocument();

      const clearButton = screen.getByTestId('clear-recent');
      await user.click(clearButton);

      expect(window.localStorage.removeItem).toHaveBeenCalledWith('quickJumpRecent-book-1');
      expect(screen.getByText('No recent items')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const modal = screen.getByTestId('quick-jump-modal');
      expect(modal).toHaveAttribute('role', 'dialog');
      expect(modal).toHaveAttribute('aria-label', 'Quick navigation');

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('role', 'combobox');
      expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('should announce search status to screen readers', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(statusRegion).toHaveTextContent('Found 4 results for "chapter"');
      });
    });

    it('should support screen reader navigation', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      const results = screen.getAllByRole('option');
      expect(results).toHaveLength(4);

      results.forEach((result, index) => {
        expect(result).toHaveAttribute('aria-posinset', (index + 1).toString());
        expect(result).toHaveAttribute('aria-setsize', '4');
      });
    });

    it('should trap focus within modal', async () => {
      const user = userEvent.setup();
      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      const closeButton = screen.getByTestId('close-modal');

      expect(searchInput).toHaveFocus();

      // Tab should move to close button
      await user.tab();
      expect(closeButton).toHaveFocus();

      // Tab should wrap back to search input
      await user.tab();
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <QuickJump {...props} />;
      };

      const { rerender } = render(<TestWrapper bookId="book-1" />);
      rerender(<TestWrapper bookId="book-1" />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should virtualize long search results list', async () => {
      const user = userEvent.setup();
      
      // Mock large search result set
      const largeResults = {
        results: Array.from({ length: 100 }, (_, i) => ({
          id: `item-${i}`,
          type: 'chapter',
          title: `Chapter ${i}`,
          path: `/books/book-1/chapters/${i}`,
          breadcrumb: [`Chapter ${i}`],
          content: `Content for chapter ${i}`,
          wordCount: 1000,
          lastModified: new Date().toISOString()
        })),
        totalResults: 100,
        searchTime: 50
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeResults)
      });

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByTestId('virtualized-results')).toBeInTheDocument();
      });

      // Should only render visible items
      const visibleResults = screen.getAllByTestId(/^search-result-/);
      expect(visibleResults.length).toBeLessThan(100);
    });

    it('should cancel pending search requests', async () => {
      const user = userEvent.setup();
      const abortSpy = jest.fn();
      
      global.AbortController = jest.fn(() => ({
        abort: abortSpy,
        signal: {}
      })) as any;

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chap');
      await user.type(searchInput, 'ter');

      expect(abortSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('Search error')).toBeInTheDocument();
      });

      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should recover from localStorage errors', async () => {
      const user = userEvent.setup();
      window.localStorage.getItem = jest.fn(() => {
        throw new Error('localStorage error');
      });

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      // Should still render without crashing
      expect(screen.getByTestId('quick-jump-modal')).toBeInTheDocument();
      expect(screen.getByText('No recent items')).toBeInTheDocument();
    });

    it('should handle malformed search results', async () => {
      const user = userEvent.setup();
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: null })
      });

      render(<QuickJump bookId="book-1" />);

      await user.keyboard('{Meta>}k{/Meta}');

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'chapter');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });
  });
});