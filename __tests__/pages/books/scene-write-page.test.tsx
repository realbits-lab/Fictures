import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import SceneWritePage from '@/app/books/[bookId]/stories/[storyId]/parts/[partId]/chapters/[chapterId]/scenes/[sceneId]/write/page';

// Mock the components
jest.mock('@/components/books/hierarchy/content-tree', () => {
  return function MockContentTree({ bookId }: any) {
    return <div data-testid="content-tree">Content Tree for {bookId}</div>;
  };
});

jest.mock('@/components/books/hierarchy/hierarchy-breadcrumb', () => {
  return function MockHierarchyBreadcrumb() {
    return <div data-testid="hierarchy-breadcrumb">Breadcrumb Navigation</div>;
  };
});

jest.mock('@/components/books/writing/scene-editor', () => {
  return function MockSceneEditor({ sceneId, chapterId }: any) {
    return <div data-testid="scene-editor">Scene Editor for {sceneId} in {chapterId}</div>;
  };
});

jest.mock('@/components/books/writing/ai-context-panel', () => {
  return function MockAIContextPanel({ sceneId }: any) {
    return <div data-testid="ai-context-panel">AI Context for {sceneId}</div>;
  };
});

jest.mock('@/components/books/navigation/quick-jump', () => {
  return function MockQuickJump({ bookId }: any) {
    return <div data-testid="quick-jump">Quick Jump for {bookId}</div>;
  };
});

jest.mock('@/components/books/navigation/level-switcher', () => {
  return function MockLevelSwitcher({ levelData }: any) {
    return <div data-testid="level-switcher">Level Switcher</div>;
  };
});

// Mock Next.js navigation
const mockParams = {
  bookId: 'book-1',
  storyId: 'story-1',
  partId: 'part-1',
  chapterId: 'chapter-1',
  sceneId: 'scene-1'
};

jest.mock('next/navigation', () => ({
  useParams: () => mockParams,
  usePathname: () => '/books/book-1/stories/story-1/parts/part-1/chapters/chapter-1/scenes/scene-1/write',
  useRouter: () => ({ push: jest.fn() })
}));

// Mock auth
jest.mock('@/app/auth', () => ({
  auth: jest.fn(() => Promise.resolve({
    user: { id: 'user-1', email: 'test@example.com' }
  }))
}));

// Mock API responses
global.fetch = jest.fn();

describe('SceneWritePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        scene: {
          id: 'scene-1',
          title: 'Opening Scene',
          content: 'Scene content...',
          chapterId: 'chapter-1'
        }
      })
    });
  });

  describe('Page Layout', () => {
    it('should render the three-panel layout', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('scene-write-layout')).toBeInTheDocument();
      expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-editor')).toBeInTheDocument();
      expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    });

    it('should display content tree in left sidebar', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('content-tree')).toBeInTheDocument();
      expect(screen.getByText('Content Tree for book-1')).toBeInTheDocument();
    });

    it('should display breadcrumb navigation in main area', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('hierarchy-breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Breadcrumb Navigation')).toBeInTheDocument();
    });

    it('should display scene editor in main area', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('scene-editor')).toBeInTheDocument();
      expect(screen.getByText('Scene Editor for scene-1 in chapter-1')).toBeInTheDocument();
    });

    it('should display AI context panel in right sidebar', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('ai-context-panel')).toBeInTheDocument();
      expect(screen.getByText('AI Context for scene-1')).toBeInTheDocument();
    });

    it('should render quick jump component', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('quick-jump')).toBeInTheDocument();
      expect(screen.getByText('Quick Jump for book-1')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should adapt layout for mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(await SceneWritePage({ params: mockParams }));

      const layout = screen.getByTestId('scene-write-layout');
      expect(layout).toHaveClass('flex-col', 'lg:flex-row');
    });

    it('should hide sidebars on mobile by default', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(await SceneWritePage({ params: mockParams }));

      const leftSidebar = screen.getByTestId('left-sidebar');
      const rightSidebar = screen.getByTestId('right-sidebar');

      expect(leftSidebar).toHaveClass('hidden', 'lg:block');
      expect(rightSidebar).toHaveClass('hidden', 'lg:block');
    });

    it('should show sidebar toggle buttons on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('toggle-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-ai-panel')).toBeInTheDocument();
    });

    it('should toggle sidebars when buttons are clicked', async () => {
      const user = userEvent.setup();
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(await SceneWritePage({ params: mockParams }));

      const toggleNav = screen.getByTestId('toggle-navigation');
      const leftSidebar = screen.getByTestId('left-sidebar');

      expect(leftSidebar).toHaveClass('hidden');

      await user.click(toggleNav);

      expect(leftSidebar).not.toHaveClass('hidden');
      expect(leftSidebar).toHaveClass('block');
    });
  });

  describe('Authentication and Permissions', () => {
    it('should redirect to login if user is not authenticated', async () => {
      const { auth } = require('@/app/auth');
      auth.mockResolvedValue(null);

      const mockRedirect = jest.fn();
      jest.doMock('next/navigation', () => ({
        redirect: mockRedirect
      }));

      try {
        await SceneWritePage({ params: mockParams });
      } catch (error) {
        // Should redirect
      }

      expect(mockRedirect).toHaveBeenCalledWith('/login');
    });

    it('should check user permissions for the book', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403
      });

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('permission-error')).toBeInTheDocument();
      expect(screen.getByText('You do not have permission to edit this book')).toBeInTheDocument();
    });

    it('should handle scene not found error', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('scene-not-found')).toBeInTheDocument();
      expect(screen.getByText('Scene not found')).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should support global keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(await SceneWritePage({ params: mockParams }));

      // Cmd+K should trigger quick jump
      await user.keyboard('{Meta>}k{/Meta}');

      expect(screen.getByTestId('quick-jump-active')).toBeInTheDocument();
    });

    it('should support sidebar toggle shortcuts', async () => {
      const user = userEvent.setup();
      render(await SceneWritePage({ params: mockParams }));

      const leftSidebar = screen.getByTestId('left-sidebar');

      // Cmd+B should toggle navigation sidebar
      await user.keyboard('{Meta>}b{/Meta}');

      expect(leftSidebar).toHaveClass('w-0', 'lg:w-0');
    });

    it('should support focus management shortcuts', async () => {
      const user = userEvent.setup();
      render(await SceneWritePage({ params: mockParams }));

      // Cmd+1 should focus editor
      await user.keyboard('{Meta>}1{/Meta}');

      const editor = screen.getByTestId('scene-editor');
      expect(editor).toHaveClass('ring-2', 'ring-primary-500');
    });
  });

  describe('Auto-save and Persistence', () => {
    it('should handle browser tab/window closing', async () => {
      render(await SceneWritePage({ params: mockParams }));

      // Simulate beforeunload event
      const beforeUnloadEvent = new Event('beforeunload');
      Object.defineProperty(beforeUnloadEvent, 'returnValue', {
        writable: true,
        value: ''
      });

      window.dispatchEvent(beforeUnloadEvent);

      // Should prevent default if there are unsaved changes
      expect(beforeUnloadEvent.returnValue).toBe('You have unsaved changes. Are you sure you want to leave?');
    });

    it('should handle browser back/forward navigation', async () => {
      render(await SceneWritePage({ params: mockParams }));

      // Simulate popstate event (browser back/forward)
      const popstateEvent = new PopStateEvent('popstate', {
        state: { sceneId: 'scene-2' }
      });

      window.dispatchEvent(popstateEvent);

      // Should save current scene before navigating
      expect(fetch).toHaveBeenCalledWith(
        '/api/books/scene-1/save',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should periodically save changes', async () => {
      jest.useFakeTimers();
      
      render(await SceneWritePage({ params: mockParams }));

      // Fast forward 30 seconds (auto-save interval)
      jest.advanceTimersByTime(30000);

      expect(fetch).toHaveBeenCalledWith(
        '/api/books/scene-1/save',
        expect.objectContaining({ method: 'POST' })
      );

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should show error boundary for component errors', async () => {
      // Mock console.error to avoid test output pollution
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Force an error in scene editor
      const SceneEditor = require('@/components/books/writing/scene-editor');
      SceneEditor.mockImplementation(() => {
        throw new Error('Editor failed to load');
      });

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('api-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load scene data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should provide fallback UI for missing components', async () => {
      // Mock missing component
      const ContentTree = require('@/components/books/hierarchy/content-tree');
      ContentTree.mockImplementation(() => null);

      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByTestId('fallback-navigation')).toBeInTheDocument();
      expect(screen.getByText('Navigation temporarily unavailable')).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should lazy load non-critical components', async () => {
      const dynamicImportSpy = jest.spyOn(React, 'lazy');
      
      render(await SceneWritePage({ params: mockParams }));

      expect(dynamicImportSpy).toHaveBeenCalled();
    });

    it('should prefetch related scenes and chapters', async () => {
      render(await SceneWritePage({ params: mockParams }));

      // Should prefetch adjacent scenes
      expect(fetch).toHaveBeenCalledWith(
        '/api/books/chapter-1/scenes?prefetch=true',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should cleanup resources on unmount', () => {
      const { unmount } = render(<div>placeholder</div>);

      // Mock component with cleanup
      const cleanupSpy = jest.fn();
      React.useEffect = jest.fn(() => cleanupSpy);

      unmount();

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('SEO and Metadata', () => {
    it('should set proper page title', async () => {
      render(await SceneWritePage({ params: mockParams }));

      // Check if title is set
      expect(document.title).toContain('Opening Scene');
      expect(document.title).toContain('Chapter One');
    });

    it('should set meta description', async () => {
      render(await SceneWritePage({ params: mockParams }));

      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toHaveAttribute('content', expect.stringContaining('Edit scene'));
    });

    it('should set canonical URL', async () => {
      render(await SceneWritePage({ params: mockParams }));

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      expect(canonicalLink).toHaveAttribute('href', expect.stringContaining('/scenes/scene-1/write'));
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(await SceneWritePage({ params: mockParams }));

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent(/Scene.*Opening Scene/);

      const sectionHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it('should have proper landmark regions', async () => {
      render(await SceneWritePage({ params: mockParams }));

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    it('should support keyboard navigation between regions', async () => {
      const user = userEvent.setup();
      render(await SceneWritePage({ params: mockParams }));

      const navigation = screen.getByRole('navigation');
      const main = screen.getByRole('main');
      const complementary = screen.getByRole('complementary');

      // Should be able to navigate between regions with Tab
      navigation.focus();
      await user.tab();
      expect(main).toHaveFocus();

      await user.tab();
      expect(complementary).toHaveFocus();
    });

    it('should have skip links for screen readers', async () => {
      render(await SceneWritePage({ params: mockParams }));

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveAttribute('href', '#main-content');
      expect(skipLink).toHaveClass('sr-only', 'focus:not-sr-only');
    });

    it('should announce page changes to screen readers', async () => {
      render(await SceneWritePage({ params: mockParams }));

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent('Scene writing interface loaded');
    });
  });
});