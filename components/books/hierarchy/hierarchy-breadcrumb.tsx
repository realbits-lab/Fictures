'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { ChevronRight, Book, BookOpen, FileText, Layers, Edit, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { HierarchyBreadcrumbProps } from '../types/hierarchy';

interface BreadcrumbData {
  bookId: string;
  bookTitle: string;
  storyId?: string;
  storyTitle?: string;
  partId?: string;
  partTitle?: string;
  partNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  globalChapterNumber?: number;
  sceneId?: string;
  sceneTitle?: string;
  sceneNumber?: number;
  currentLevel: string;
  currentPage?: string;
}

interface BreadcrumbItem {
  id: string;
  type: 'book' | 'story' | 'part' | 'chapter' | 'scene' | 'page';
  title: string;
  path: string;
  icon: React.ReactNode;
  isCurrent: boolean;
}

const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({ 
  bookId: propBookId,
  storyId: propStoryId,
  partId: propPartId,
  chapterId: propChapterId,
  sceneId: propSceneId,
  className 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [breadcrumbData, setBreadcrumbData] = useState<BreadcrumbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveRegionMessage, setLiveRegionMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Extract IDs from props or pathname
  const resolvedBookId = propBookId || (params?.bookId as string);
  const resolvedStoryId = propStoryId || (params?.storyId as string);
  const resolvedPartId = propPartId || (params?.partId as string);
  const resolvedChapterId = propChapterId || (params?.chapterId as string);
  const resolvedSceneId = propSceneId || (params?.sceneId as string);

  // Handle viewport changes
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch breadcrumb data
  const fetchBreadcrumbData = useCallback(async () => {
    if (!resolvedBookId) return;

    try {
      setLoading(true);
      setError(null);
      
      let apiPath = `/api/books/${resolvedBookId}/breadcrumb`;
      const searchParams = new URLSearchParams();
      
      if (resolvedStoryId) searchParams.append('storyId', resolvedStoryId);
      if (resolvedPartId) searchParams.append('partId', resolvedPartId);
      if (resolvedChapterId) searchParams.append('chapterId', resolvedChapterId);
      if (resolvedSceneId) searchParams.append('sceneId', resolvedSceneId);
      
      if (searchParams.toString()) {
        apiPath += `?${searchParams.toString()}`;
      }

      const response = await fetch(apiPath);
      if (!response.ok) {
        throw new Error('Failed to fetch breadcrumb data');
      }
      
      const data = await response.json();
      setBreadcrumbData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Navigation unavailable');
      // Auto-retry after error
      setTimeout(fetchBreadcrumbData, 2000);
    } finally {
      setLoading(false);
    }
  }, [resolvedBookId, resolvedStoryId, resolvedPartId, resolvedChapterId, resolvedSceneId]);

  useEffect(() => {
    fetchBreadcrumbData();
  }, [fetchBreadcrumbData, pathname]);

  // Debounced navigation handler
  const navigationTimeoutRef = React.useRef<NodeJS.Timeout>();
  const handleNavigate = useCallback((path: string, title: string) => {
    // Clear existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Debounce navigation
    navigationTimeoutRef.current = setTimeout(() => {
      setLiveRegionMessage(`Navigating to ${title}`);
      router.push(path);
    }, 100);
  }, [router]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Generate breadcrumb items
  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    if (!breadcrumbData) return [];

    const items: BreadcrumbItem[] = [];
    const { bookId, bookTitle, storyId, storyTitle, partId, partTitle, partNumber, 
            chapterId, chapterTitle, chapterNumber, sceneId, sceneTitle, sceneNumber, currentPage } = breadcrumbData;

    // Book level
    items.push({
      id: bookId,
      type: 'book',
      title: bookTitle,
      path: `/books/${bookId}`,
      icon: <Book className="w-4 h-4" />,
      isCurrent: !storyId && !currentPage
    });

    // Story level
    if (storyId && storyTitle) {
      items.push({
        id: storyId,
        type: 'story',
        title: storyTitle,
        path: `/books/${bookId}/stories/${storyId}`,
        icon: <BookOpen className="w-4 h-4" />,
        isCurrent: !partId && !currentPage
      });
    }

    // Part level
    if (partId && partTitle) {
      items.push({
        id: partId,
        type: 'part',
        title: `Part ${partNumber}: ${partTitle}`,
        path: `/books/${bookId}/stories/${storyId}/parts/${partId}`,
        icon: <FileText className="w-4 h-4" />,
        isCurrent: !chapterId && !currentPage
      });
    }

    // Chapter level
    if (chapterId && chapterTitle) {
      items.push({
        id: chapterId,
        type: 'chapter',
        title: `Chapter ${chapterNumber}: ${chapterTitle}`,
        path: `/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}`,
        icon: <Layers className="w-4 h-4" />,
        isCurrent: !sceneId && !currentPage
      });
    }

    // Scene level
    if (sceneId && sceneTitle) {
      items.push({
        id: sceneId,
        type: 'scene',
        title: `Scene ${sceneNumber}: ${sceneTitle}`,
        path: `/books/${bookId}/stories/${storyId}/parts/${partId}/chapters/${chapterId}/scenes/${sceneId}`,
        icon: <Edit className="w-4 h-4" />,
        isCurrent: !currentPage
      });
    }

    // Current page
    if (currentPage) {
      items.push({
        id: 'current-page',
        type: 'page',
        title: currentPage,
        path: pathname,
        icon: <Edit className="w-4 h-4" />,
        isCurrent: true
      });
    }

    return items;
  }, [breadcrumbData, pathname]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, path: string, title: string, isCurrent: boolean) => {
    if (isCurrent) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate(path, title);
    }
  }, [handleNavigate]);

  // Render breadcrumb item
  const renderBreadcrumbItem = useCallback((item: BreadcrumbItem, index: number, isVisible: boolean = true) => {
    const isClickable = !item.isCurrent;
    
    if (!isVisible) return null;

    return (
      <React.Fragment key={item.id}>
        {index > 0 && (
          <ChevronRight 
            className="w-4 h-4 text-gray-400" 
            data-testid="breadcrumb-separator"
            aria-hidden="true"
          />
        )}
        <li role="listitem" className="flex items-center">
          {item.isCurrent ? (
            <span
              data-testid="breadcrumb-current"
              aria-current="page"
              className="flex items-center gap-1 text-primary-600 font-semibold text-sm"
            >
              <span data-testid={`icon-${item.type}`}>{item.icon}</span>
              <span className="truncate max-w-32">{item.title}</span>
            </span>
          ) : (
            <button
              data-testid={`breadcrumb-item-${item.type}`}
              aria-label={`Navigate to ${item.type}: ${item.title}`}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-200 focus:rounded truncate max-w-32"
              onClick={() => handleNavigate(item.path, item.title)}
              onKeyDown={(e) => handleKeyDown(e, item.path, item.title, item.isCurrent)}
              tabIndex={0}
            >
              <span data-testid={`icon-${item.type}`}>{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </button>
          )}
        </li>
      </React.Fragment>
    );
  }, [handleNavigate, handleKeyDown]);

  // Render mobile dropdown
  const renderMobileDropdown = useCallback(() => {
    if (!breadcrumbItems.length) return null;

    const currentItem = breadcrumbItems[breadcrumbItems.length - 1];
    
    return (
      <div data-testid="breadcrumb-mobile-dropdown" className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              data-testid="breadcrumb-mobile-trigger"
              className="flex items-center gap-2"
            >
              {currentItem.icon}
              <span className="truncate max-w-32">{currentItem.title}</span>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {breadcrumbItems.slice(0, -1).map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleNavigate(item.path, item.title)}
                className="flex items-center gap-2"
              >
                {item.icon}
                <span className="truncate">{item.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, [breadcrumbItems, handleNavigate]);

  // Render tablet view with ellipsis
  const renderTabletView = useCallback(() => {
    if (breadcrumbItems.length <= 3) {
      return breadcrumbItems.map((item, index) => renderBreadcrumbItem(item, index));
    }

    const firstItem = breadcrumbItems[0];
    const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
    const middleItems = breadcrumbItems.slice(1, -1);

    return (
      <>
        {renderBreadcrumbItem(firstItem, 0)}
        
        {middleItems.length > 0 && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" aria-hidden="true" />
            <li role="listitem">
              <Button
                variant="ghost"
                size="sm"
                data-testid="breadcrumb-ellipsis"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 px-2"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </li>
          </>
        )}

        {isExpanded && middleItems.map((item, index) => renderBreadcrumbItem(item, index + 1))}
        
        {renderBreadcrumbItem(lastItem, breadcrumbItems.length - 1)}
      </>
    );
  }, [breadcrumbItems, isExpanded, renderBreadcrumbItem]);

  // Loading state
  if (loading) {
    return (
      <nav className={cn('flex items-center', className)} aria-label="Breadcrumb navigation">
        <div data-testid="breadcrumb-loading" className="flex items-center gap-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 w-24" />
          <span className="text-sm text-gray-500">Loading navigation...</span>
        </div>
      </nav>
    );
  }

  // Error state
  if (error) {
    return (
      <nav className={cn('flex items-center', className)} aria-label="Breadcrumb navigation">
        <div data-testid="breadcrumb-error" className="text-sm text-red-600">
          Navigation unavailable
        </div>
      </nav>
    );
  }

  // No data state
  if (!breadcrumbData || !breadcrumbItems.length) {
    return null;
  }

  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb navigation">
      {isMobile ? (
        renderMobileDropdown()
      ) : (
        <ol role="list" className="flex items-center gap-2 flex-wrap">
          {isTablet ? renderTabletView() : breadcrumbItems.map((item, index) => renderBreadcrumbItem(item, index))}
        </ol>
      )}
      
      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>
    </nav>
  );
};

export default HierarchyBreadcrumb;