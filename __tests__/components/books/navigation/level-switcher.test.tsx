import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import LevelSwitcher from '@/components/books/navigation/level-switcher';

// Mock next/navigation
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

describe('LevelSwitcher Component', () => {
  const mockLevelData = {
    currentLevel: 'scene',
    currentPath: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write',
    availableLevels: [
      {
        level: 'book',
        title: 'My Novel',
        path: '/books/book-1',
        isActive: false,
        description: 'Book overview and story management'
      },
      {
        level: 'story',
        title: 'The Beginning',
        path: '/books/book-1/stories/story-1',
        isActive: false,
        description: 'Story arc and character development'
      },
      {
        level: 'part',
        title: 'Part 1: Origins',
        path: '/books/book-1/stories/story-1/parts/part-1',
        isActive: false,
        description: 'Thematic focus: Self-discovery'
      },
      {
        level: 'chapter',
        title: 'Chapter 1: Chapter One',
        path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1',
        isActive: false,
        description: 'Chapter summary and scene management'
      },
      {
        level: 'scene',
        title: 'Scene 1: The Awakening',
        path: '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write',
        isActive: true,
        description: 'Scene writing and editing'
      }
    ],
    stats: {
      book: { totalWords: 25000, totalChapters: 15, progress: 60 },
      story: { totalWords: 5000, totalParts: 3, progress: 40 },
      part: { totalWords: 2500, totalChapters: 5, progress: 80 },
      chapter: { totalWords: 1200, totalScenes: 4, progress: 75 },
      scene: { totalWords: 400, progress: 50 }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render level tabs with current level highlighted', () => {
      render(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByTestId('level-switcher')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-book')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-story')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-part')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-chapter')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-scene')).toBeInTheDocument();

      // Current level should be highlighted
      const currentTab = screen.getByTestId('level-tab-scene');
      expect(currentTab).toHaveClass('bg-primary-100', 'border-primary-300', 'text-primary-800');
    });

    it('should display level titles correctly', () => {
      render(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Part 1: Origins')).toBeInTheDocument();
      expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
      expect(screen.getByText('Scene 1: The Awakening')).toBeInTheDocument();
    });

    it('should show level icons for each tab', () => {
      render(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByTestId('icon-book')).toBeInTheDocument();
      expect(screen.getByTestId('icon-story')).toBeInTheDocument();
      expect(screen.getByTestId('icon-part')).toBeInTheDocument();
      expect(screen.getByTestId('icon-chapter')).toBeInTheDocument();
      expect(screen.getByTestId('icon-scene')).toBeInTheDocument();
    });

    it('should render in compact mode on small screens', () => {
      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<LevelSwitcher levelData={mockLevelData} compact={true} />);

      expect(screen.getByTestId('level-switcher-compact')).toBeInTheDocument();
      expect(screen.getByTestId('current-level-dropdown')).toBeInTheDocument();
      
      // Should show only current level initially
      expect(screen.getByText('Scene 1: The Awakening')).toBeInTheDocument();
      expect(screen.queryByText('My Novel')).not.toBeInTheDocument();
    });

    it('should show loading state when level data is not available', () => {
      render(<LevelSwitcher levelData={null} />);

      expect(screen.getByTestId('level-switcher-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading navigation...')).toBeInTheDocument();
    });
  });

  describe('Level Navigation', () => {
    it('should navigate to selected level when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const bookTab = screen.getByTestId('level-tab-book');
      await user.click(bookTab);

      expect(mockPush).toHaveBeenCalledWith('/books/book-1');
    });

    it('should not navigate when clicking current level tab', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const sceneTab = screen.getByTestId('level-tab-scene');
      await user.click(sceneTab);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('should navigate using keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      // Alt + 1 should go to book level
      await user.keyboard('{Alt>}1{/Alt}');
      expect(mockPush).toHaveBeenCalledWith('/books/book-1');

      // Alt + 2 should go to story level
      await user.keyboard('{Alt>}2{/Alt}');
      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');

      // Alt + 3 should go to part level
      await user.keyboard('{Alt>}3{/Alt}');
      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1');
    });

    it('should support arrow key navigation between tabs', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const bookTab = screen.getByTestId('level-tab-book');
      bookTab.focus();

      // Right arrow should move to next tab
      await user.keyboard('{ArrowRight}');
      
      const storyTab = screen.getByTestId('level-tab-story');
      expect(storyTab).toHaveFocus();

      // Left arrow should move back
      await user.keyboard('{ArrowLeft}');
      expect(bookTab).toHaveFocus();
    });

    it('should wrap around when navigating with arrow keys', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const sceneTab = screen.getByTestId('level-tab-scene');
      sceneTab.focus();

      // Right arrow from last tab should wrap to first
      await user.keyboard('{ArrowRight}');
      
      const bookTab = screen.getByTestId('level-tab-book');
      expect(bookTab).toHaveFocus();

      // Left arrow from first tab should wrap to last
      await user.keyboard('{ArrowLeft}');
      expect(sceneTab).toHaveFocus();
    });

    it('should navigate to focused tab with Enter or Space', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const storyTab = screen.getByTestId('level-tab-story');
      storyTab.focus();

      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1');

      jest.clearAllMocks();

      const partTab = screen.getByTestId('level-tab-part');
      partTab.focus();

      await user.keyboard('{Space}');
      expect(mockPush).toHaveBeenCalledWith('/books/book-1/stories/story-1/parts/part-1');
    });
  });

  describe('Compact Mode', () => {
    it('should show dropdown in compact mode', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} compact={true} />);

      const dropdown = screen.getByTestId('current-level-dropdown');
      await user.click(dropdown);

      expect(screen.getByTestId('level-dropdown-menu')).toBeInTheDocument();
      expect(screen.getByText('My Novel')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
    });

    it('should navigate from dropdown selection', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} compact={true} />);

      const dropdown = screen.getByTestId('current-level-dropdown');
      await user.click(dropdown);

      const bookOption = screen.getByTestId('dropdown-option-book');
      await user.click(bookOption);

      expect(mockPush).toHaveBeenCalledWith('/books/book-1');
    });

    it('should close dropdown when selecting option', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} compact={true} />);

      const dropdown = screen.getByTestId('current-level-dropdown');
      await user.click(dropdown);

      expect(screen.getByTestId('level-dropdown-menu')).toBeInTheDocument();

      const storyOption = screen.getByTestId('dropdown-option-story');
      await user.click(storyOption);

      expect(screen.queryByTestId('level-dropdown-menu')).not.toBeInTheDocument();
    });

    it('should close dropdown when clicking outside', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} compact={true} />);

      const dropdown = screen.getByTestId('current-level-dropdown');
      await user.click(dropdown);

      expect(screen.getByTestId('level-dropdown-menu')).toBeInTheDocument();

      // Click outside
      await user.click(document.body);

      expect(screen.queryByTestId('level-dropdown-menu')).not.toBeInTheDocument();
    });
  });

  describe('Level Statistics Display', () => {
    it('should show statistics for each level on hover', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showStats={true} />);

      const bookTab = screen.getByTestId('level-tab-book');
      await user.hover(bookTab);

      await waitFor(() => {
        expect(screen.getByTestId('stats-tooltip-book')).toBeInTheDocument();
      });

      expect(screen.getByText('25,000 words')).toBeInTheDocument();
      expect(screen.getByText('15 chapters')).toBeInTheDocument();
      expect(screen.getByText('60% complete')).toBeInTheDocument();
    });

    it('should display different stats for different levels', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showStats={true} />);

      const chapterTab = screen.getByTestId('level-tab-chapter');
      await user.hover(chapterTab);

      await waitFor(() => {
        expect(screen.getByTestId('stats-tooltip-chapter')).toBeInTheDocument();
      });

      expect(screen.getByText('1,200 words')).toBeInTheDocument();
      expect(screen.getByText('4 scenes')).toBeInTheDocument();
      expect(screen.getByText('75% complete')).toBeInTheDocument();
    });

    it('should hide tooltip when mouse leaves', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showStats={true} />);

      const bookTab = screen.getByTestId('level-tab-book');
      await user.hover(bookTab);

      await waitFor(() => {
        expect(screen.getByTestId('stats-tooltip-book')).toBeInTheDocument();
      });

      await user.unhover(bookTab);

      await waitFor(() => {
        expect(screen.queryByTestId('stats-tooltip-book')).not.toBeInTheDocument();
      });
    });

    it('should show progress bars for completion status', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showStats={true} />);

      const storyTab = screen.getByTestId('level-tab-story');
      await user.hover(storyTab);

      await waitFor(() => {
        expect(screen.getByTestId('progress-bar-story')).toBeInTheDocument();
      });

      const progressBar = screen.getByTestId('progress-bar-story');
      expect(progressBar).toHaveStyle('width: 40%');
    });
  });

  describe('Level Descriptions', () => {
    it('should show level descriptions in tooltips', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showDescriptions={true} />);

      const partTab = screen.getByTestId('level-tab-part');
      await user.hover(partTab);

      await waitFor(() => {
        expect(screen.getByText('Thematic focus: Self-discovery')).toBeInTheDocument();
      });
    });

    it('should show descriptions for each level type', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} showDescriptions={true} />);

      const bookTab = screen.getByTestId('level-tab-book');
      await user.hover(bookTab);

      await waitFor(() => {
        expect(screen.getByText('Book overview and story management')).toBeInTheDocument();
      });

      await user.unhover(bookTab);

      const sceneTab = screen.getByTestId('level-tab-scene');
      await user.hover(sceneTab);

      await waitFor(() => {
        expect(screen.getByText('Scene writing and editing')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should switch to compact mode on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      render(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByTestId('level-switcher-compact')).toBeInTheDocument();
    });

    it('should show full tabs on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByTestId('level-switcher')).toBeInTheDocument();
      expect(screen.queryByTestId('level-switcher-compact')).not.toBeInTheDocument();
    });

    it('should handle viewport changes', () => {
      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { rerender } = render(<LevelSwitcher levelData={mockLevelData} />);
      expect(screen.getByTestId('level-switcher')).toBeInTheDocument();

      // Switch to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      // Trigger resize event
      fireEvent(window, new Event('resize'));
      rerender(<LevelSwitcher levelData={mockLevelData} />);

      expect(screen.getByTestId('level-switcher-compact')).toBeInTheDocument();
    });

    it('should show abbreviated titles on tablet', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<LevelSwitcher levelData={mockLevelData} />);

      // Should show shortened titles
      expect(screen.getByText('Book')).toBeInTheDocument();
      expect(screen.getByText('Story')).toBeInTheDocument();
      expect(screen.getByText('Part 1')).toBeInTheDocument();
      expect(screen.getByText('Ch. 1')).toBeInTheDocument();
      expect(screen.getByText('Scene 1')).toBeInTheDocument();
    });
  });

  describe('Custom Level Configurations', () => {
    it('should support hiding specific levels', () => {
      const customLevelData = {
        ...mockLevelData,
        availableLevels: mockLevelData.availableLevels.filter(level => level.level !== 'part')
      };

      render(<LevelSwitcher levelData={customLevelData} />);

      expect(screen.getByTestId('level-tab-book')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-story')).toBeInTheDocument();
      expect(screen.queryByTestId('level-tab-part')).not.toBeInTheDocument();
      expect(screen.getByTestId('level-tab-chapter')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-scene')).toBeInTheDocument();
    });

    it('should support custom level order', () => {
      const customLevelData = {
        ...mockLevelData,
        availableLevels: [
          mockLevelData.availableLevels[4], // scene first
          mockLevelData.availableLevels[3], // chapter second
          mockLevelData.availableLevels[0]  // book third
        ]
      };

      render(<LevelSwitcher levelData={customLevelData} />);

      const tabs = screen.getAllByTestId(/^level-tab-/);
      expect(tabs[0]).toHaveAttribute('data-testid', 'level-tab-scene');
      expect(tabs[1]).toHaveAttribute('data-testid', 'level-tab-chapter');
      expect(tabs[2]).toHaveAttribute('data-testid', 'level-tab-book');
    });

    it('should support disabled levels', () => {
      const customLevelData = {
        ...mockLevelData,
        availableLevels: mockLevelData.availableLevels.map(level => ({
          ...level,
          disabled: level.level === 'story'
        }))
      };

      render(<LevelSwitcher levelData={customLevelData} />);

      const storyTab = screen.getByTestId('level-tab-story');
      expect(storyTab).toHaveClass('opacity-50', 'cursor-not-allowed');
      expect(storyTab).toHaveAttribute('aria-disabled', 'true');
    });

    it('should not navigate to disabled levels', async () => {
      const user = userEvent.setup();
      const customLevelData = {
        ...mockLevelData,
        availableLevels: mockLevelData.availableLevels.map(level => ({
          ...level,
          disabled: level.level === 'story'
        }))
      };

      render(<LevelSwitcher levelData={customLevelData} />);

      const storyTab = screen.getByTestId('level-tab-story');
      await user.click(storyTab);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LevelSwitcher levelData={mockLevelData} />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toHaveAttribute('aria-label', 'Book hierarchy levels');

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);

      tabs.forEach((tab, index) => {
        expect(tab).toHaveAttribute('aria-selected', 
          tab.getAttribute('data-testid') === 'level-tab-scene' ? 'true' : 'false'
        );
        expect(tab).toHaveAttribute('tabindex', 
          tab.getAttribute('data-testid') === 'level-tab-scene' ? '0' : '-1'
        );
      });
    });

    it('should support keyboard navigation with Tab key', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const sceneTab = screen.getByTestId('level-tab-scene');
      expect(sceneTab).toHaveFocus();

      // Tab should move focus to next focusable element (not next tab)
      await user.tab();
      expect(sceneTab).not.toHaveFocus();
    });

    it('should announce tab changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      const bookTab = screen.getByTestId('level-tab-book');
      await user.click(bookTab);

      expect(liveRegion).toHaveTextContent('Navigating to book level: My Novel');
    });

    it('should have descriptive tab labels', () => {
      render(<LevelSwitcher levelData={mockLevelData} />);

      const bookTab = screen.getByTestId('level-tab-book');
      expect(bookTab).toHaveAttribute('aria-label', 'Navigate to book level: My Novel');

      const sceneTab = screen.getByTestId('level-tab-scene');
      expect(sceneTab).toHaveAttribute('aria-label', 'Current level - Scene 1: The Awakening');
    });

    it('should support screen reader shortcuts announcement', () => {
      render(<LevelSwitcher levelData={mockLevelData} showKeyboardHelp={true} />);

      expect(screen.getByText('Keyboard shortcuts:')).toBeInTheDocument();
      expect(screen.getByText('Alt+1-5 to jump to levels')).toBeInTheDocument();
      expect(screen.getByText('Arrow keys to navigate')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = (props: any) => {
        renderSpy();
        return <LevelSwitcher {...props} />;
      };

      const { rerender } = render(<TestWrapper levelData={mockLevelData} />);
      rerender(<TestWrapper levelData={mockLevelData} />);

      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize level calculations', () => {
      const calculateSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const { rerender } = render(<LevelSwitcher levelData={mockLevelData} />);
      rerender(<LevelSwitcher levelData={mockLevelData} />);

      // Level calculations should not run again for same data
      expect(calculateSpy).toHaveBeenCalledTimes(0);

      calculateSpy.mockRestore();
    });

    it('should handle rapid navigation attempts', async () => {
      const user = userEvent.setup();
      render(<LevelSwitcher levelData={mockLevelData} />);

      const bookTab = screen.getByTestId('level-tab-book');
      
      // Rapid clicks
      await user.click(bookTab);
      await user.click(bookTab);
      await user.click(bookTab);

      // Should only navigate once due to debouncing
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed level data gracefully', () => {
      const malformedData = {
        currentLevel: 'scene',
        availableLevels: [
          { level: 'book' }, // Missing required fields
          null, // Invalid level
          { level: 'story', title: 'Valid Story', path: '/valid' }
        ]
      };

      render(<LevelSwitcher levelData={malformedData as any} />);

      // Should not crash and should render valid levels
      expect(screen.getByText('Valid Story')).toBeInTheDocument();
      expect(screen.queryByTestId('level-tab-book')).not.toBeInTheDocument();
    });

    it('should handle missing current level gracefully', () => {
      const dataWithoutCurrent = {
        ...mockLevelData,
        currentLevel: 'nonexistent'
      };

      render(<LevelSwitcher levelData={dataWithoutCurrent} />);

      // Should render all levels without highlighting
      expect(screen.getByTestId('level-tab-book')).toBeInTheDocument();
      expect(screen.getByTestId('level-tab-story')).toBeInTheDocument();
      
      // No level should be marked as active
      const tabs = screen.getAllByRole('tab');
      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
      });
    });

    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup();
      mockPush.mockRejectedValue(new Error('Navigation failed'));

      render(<LevelSwitcher levelData={mockLevelData} />);

      const bookTab = screen.getByTestId('level-tab-book');
      await user.click(bookTab);

      // Should show error state but not crash
      expect(screen.getByText('Navigation error')).toBeInTheDocument();
    });
  });
});