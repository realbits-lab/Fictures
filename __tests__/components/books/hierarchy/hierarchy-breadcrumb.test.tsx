import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import HierarchyBreadcrumb from '@/components/books/hierarchy/hierarchy-breadcrumb';

// Mock next/router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write',
  query: { bookId: 'book-1', storyId: 'story-1', partId: 'part-1', chapterId: 'chapter-1', sceneId: 'scene-1' }
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => mockRouter.pathname,
  useParams: () => mockRouter.query
}));

// Mock the fetch API
global.fetch = jest.fn();

describe('HierarchyBreadcrumb Component', () => {
  const mockBreadcrumbData = {
    bookId: 'book-1',
    bookTitle: 'My Novel',
    storyId: 'story-1',
    storyTitle: 'The Beginning',
    partId: 'part-1',
    partTitle: 'Origins',
    partNumber: 1,
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterNumber: 1,
    globalChapterNumber: 1,
    sceneId: 'scene-1',
    sceneTitle: 'Opening Scene',
    sceneNumber: 1,
    currentLevel: 'scene',
    currentPage: 'write'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBreadcrumbData)
    });
  });

  describe('Component Rendering', () => {
    it('should render full breadcrumb for scene-level navigation', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
      expect(screen.getByText('Scene 1: Opening Scene')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
    });

    it('should render breadcrumb for chapter-level navigation', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockBreadcrumbData,
          sceneId: null,
          sceneTitle: null,
          sceneNumber: null,
          currentLevel: 'chapter',
          currentPage: null
        })
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
      expect(screen.queryByText('Opening Scene')).not.toBeInTheDocument();
    });

    it('should render breadcrumb for part-level navigation', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1/parts/part-1';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockBreadcrumbData,
          chapterId: null,
          chapterTitle: null,
          chapterNumber: null,
          sceneId: null,
          sceneTitle: null,
          sceneNumber: null,
          currentLevel: 'part',
          currentPage: null
        })
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      expect(screen.queryByText('Chapter One')).not.toBeInTheDocument();
    });

    it('should render breadcrumb for story-level navigation', async () => {
      mockRouter.pathname = '/books/book-1/stories/story-1';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockBreadcrumbData,
          partId: null,
          partTitle: null,
          partNumber: null,
          chapterId: null,
          chapterTitle: null,
          chapterNumber: null,
          sceneId: null,
          sceneTitle: null,
          sceneNumber: null,
          currentLevel: 'story',
          currentPage: null
        })
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.queryByText('Origins')).not.toBeInTheDocument();
    });

    it('should render breadcrumb for book-level navigation', async () => {
      mockRouter.pathname = '/books/book-1';
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          bookId: 'book-1',
          bookTitle: 'My Novel',
          currentLevel: 'book',
          currentPage: null
        })
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.queryByText('The Beginning')).not.toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<HierarchyBreadcrumb />);

      expect(screen.getByTestId('breadcrumb-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading navigation...')).toBeInTheDocument();
    });

    it('should handle error state when API fails', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb-error')).toBeInTheDocument();
      });

      expect(screen.getByText('Navigation unavailable')).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should navigate to book when book title is clicked', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('My Novel'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1');
    });

    it('should navigate to story when story title is clicked', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('The Beginning'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');
    });

    it('should navigate to part when part title is clicked', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Part 1: Origins'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1');
    });

    it('should navigate to chapter when chapter title is clicked', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Chapter 1: Chapter One'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1');
    });

    it('should navigate to scene when scene title is clicked', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Scene 1: Opening Scene')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Scene 1: Opening Scene'));

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1');
    });

    it('should not navigate when clicking current page indicator', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Write')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Write'));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Visual Indicators', () => {
    it('should show separators between breadcrumb items', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const separators = screen.getAllByTestId('breadcrumb-separator');
      expect(separators).toHaveLength(5); // Between each level + current page
    });

    it('should highlight current level item', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Write')).toBeInTheDocument();
      });

      const currentItem = screen.getByTestId('breadcrumb-current');
      expect(currentItem).toHaveTextContent('Write');
      expect(currentItem).toHaveClass('text-primary-600', 'font-semibold');
    });

    it('should style clickable items differently from current item', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const clickableItem = screen.getByTestId('breadcrumb-item-book');
      expect(clickableItem).toHaveClass('text-gray-600', 'hover:text-gray-900', 'cursor-pointer');

      const currentItem = screen.getByTestId('breadcrumb-current');
      expect(currentItem).toHaveClass('text-primary-600', 'font-semibold');
      expect(currentItem).not.toHaveClass('cursor-pointer');
    });

    it('should show icons for different levels', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      // Check for level-specific icons
      expect(screen.getByTestId('icon-book')).toBeInTheDocument();
      expect(screen.getByTestId('icon-story')).toBeInTheDocument();
      expect(screen.getByTestId('icon-part')).toBeInTheDocument();
      expect(screen.getByTestId('icon-chapter')).toBeInTheDocument();
      expect(screen.getByTestId('icon-scene')).toBeInTheDocument();
    });

    it('should show truncated titles for long names', async () => {
      const longTitleData = {
        ...mockBreadcrumbData,
        bookTitle: 'This is a Very Long Book Title That Should Be Truncated',
        storyTitle: 'This is a Very Long Story Title That Should Be Truncated',
        partTitle: 'This is a Very Long Part Title That Should Be Truncated'
      };

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(longTitleData)
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('This is a Very Long Book Title That Should Be Truncated')).toBeInTheDocument();
      });

      const bookItem = screen.getByTestId('breadcrumb-item-book');
      expect(bookItem).toHaveClass('truncate', 'max-w-32');
    });
  });

  describe('Responsive Design', () => {
    it('should collapse to dropdown on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Mobile width
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb-mobile-dropdown')).toBeInTheDocument();
      });

      expect(screen.getByTestId('breadcrumb-mobile-trigger')).toBeInTheDocument();
      expect(screen.queryByText('My Novel')).not.toBeInTheDocument(); // Hidden in mobile
    });

    it('should show full breadcrumb on desktop', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Desktop width
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('breadcrumb-mobile-dropdown')).not.toBeInTheDocument();
    });

    it('should show collapsible middle items on tablet', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Tablet width
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      // Should show first and last items, with ellipsis for middle
      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('Write')).toBeInTheDocument();
      expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();
    });

    it('should expand ellipsis when clicked', async () => {
      const user = userEvent.setup();

      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb-ellipsis')).toBeInTheDocument();
      });

      const ellipsis = screen.getByTestId('breadcrumb-ellipsis');
      await user.click(ellipsis);

      // Should show all items after expansion
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation between clickable items', async () => {
      const user = userEvent.setup();
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const bookItem = screen.getByTestId('breadcrumb-item-book');
      const storyItem = screen.getByTestId('breadcrumb-item-story');

      // Tab should move between clickable items
      await user.tab();
      expect(bookItem).toHaveFocus();

      await user.tab();
      expect(storyItem).toHaveFocus();
    });

    it('should support Enter key navigation', async () => {
      const user = userEvent.setup();
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const bookItem = screen.getByTestId('breadcrumb-item-book');
      bookItem.focus();

      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/books/book-1');
    });

    it('should support Space key navigation', async () => {
      const user = userEvent.setup();
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      const storyItem = screen.getByTestId('breadcrumb-item-story');
      storyItem.focus();

      await user.keyboard('{Space}');

      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');
    });

    it('should not navigate when pressing Enter on current item', async () => {
      const user = userEvent.setup();
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Write')).toBeInTheDocument();
      });

      const currentItem = screen.getByTestId('breadcrumb-current');
      currentItem.focus();

      await user.keyboard('{Enter}');

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');

      const breadcrumb = screen.getByRole('list');
      expect(breadcrumb).toBeInTheDocument();

      const breadcrumbItems = screen.getAllByRole('listitem');
      expect(breadcrumbItems.length).toBeGreaterThan(0);
    });

    it('should mark current page appropriately', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('Write')).toBeInTheDocument();
      });

      const currentItem = screen.getByTestId('breadcrumb-current');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });

    it('should have descriptive link text', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const bookLink = screen.getByTestId('breadcrumb-item-book');
      expect(bookLink).toHaveAttribute('aria-label', 'Navigate to book: My Novel');

      const storyLink = screen.getByTestId('breadcrumb-item-story');
      expect(storyLink).toHaveAttribute('aria-label', 'Navigate to story: The Beginning');
    });

    it('should announce navigation changes to screen readers', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      fireEvent.click(screen.getByText('My Novel'));

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent('Navigating to My Novel');
      });
    });

    it('should support screen reader text for separators', async () => {
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const separators = screen.getAllByTestId('breadcrumb-separator');
      separators.forEach(separator => {
        expect(separator).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when location stays the same', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <HierarchyBreadcrumb {...props} />;
      };

      const { rerender } = render(<TestWrapper />);
      rerender(<TestWrapper />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize navigation handlers', async () => {
      const { rerender } = render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const bookItem = screen.getByTestId('breadcrumb-item-book');
      const initialHandler = bookItem.onclick;

      rerender(<HierarchyBreadcrumb />);

      const bookItemAfterRerender = screen.getByTestId('breadcrumb-item-book');
      expect(bookItemAfterRerender.onclick).toBe(initialHandler);
    });

    it('should debounce rapid navigation attempts', async () => {
      const user = userEvent.setup();
      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      const bookItem = screen.getByTestId('breadcrumb-item-book');

      // Rapid clicks
      await user.click(bookItem);
      await user.click(bookItem);
      await user.click(bookItem);

      // Should only navigate once due to debouncing
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Refresh', () => {
    it('should refresh breadcrumb data when route changes', async () => {
      const { rerender } = render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(1);

      // Simulate route change
      mockRouter.pathname = '/books/book-1/stories/story-1';
      
      rerender(<HierarchyBreadcrumb />);

      // Should refetch data for new route
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle stale data gracefully', async () => {
      // Mock slow API response
      (fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve(mockBreadcrumbData)
          }), 1000)
        )
      );

      render(<HierarchyBreadcrumb />);

      expect(screen.getByTestId('breadcrumb-loading')).toBeInTheDocument();

      // Change route before first request completes
      mockRouter.pathname = '/books/book-1/stories/story-2';

      // Should not show stale data when new route loads
      await waitFor(() => {
        expect(screen.queryByText('The Beginning')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Error Recovery', () => {
    it('should retry loading breadcrumb data on error', async () => {
      (fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBreadcrumbData)
        });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByTestId('breadcrumb-error')).toBeInTheDocument();
      });

      // Component should auto-retry
      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fallback to basic navigation when detailed data unavailable', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          bookId: 'book-1',
          bookTitle: 'My Novel',
          currentLevel: 'unknown'
        })
      });

      render(<HierarchyBreadcrumb />);

      await waitFor(() => {
        expect(screen.getByText('My Novel')).toBeInTheDocument();
      });

      // Should show at least book level
      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.queryByTestId('breadcrumb-error')).not.toBeInTheDocument();
    });
  });
});