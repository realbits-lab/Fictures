'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { ChevronRight, ChevronDown, CheckCircle, Edit, Check, Clock, Book, FileText, Layers, FileEdit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { BookHierarchy, Story, Part, Chapter, Scene, ContentTreeProps, NavigationContext } from '../types/hierarchy';

interface ExpandedState {
  [key: string]: boolean;
}

const ContentTree: React.FC<ContentTreeProps> = ({ bookId, className, onNodeSelect }) => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const [hierarchy, setHierarchy] = useState<BookHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [liveRegionMessage, setLiveRegionMessage] = useState('');

  // Fetch hierarchy data
  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/books/${bookId}/hierarchy`);
      if (!response.ok) {
        throw new Error('Failed to fetch hierarchy');
      }
      
      const data = await response.json();
      setHierarchy(data.hierarchy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book hierarchy');
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  // Auto-expand to current location
  useEffect(() => {
    if (!hierarchy || !pathname) return;

    const pathParts = pathname.split('/');
    const newExpanded: ExpandedState = { ...expanded };

    // Extract IDs from pathname
    const storyId = pathParts.includes('stories') ? pathParts[pathParts.indexOf('stories') + 1] : null;
    const partId = pathParts.includes('parts') ? pathParts[pathParts.indexOf('parts') + 1] : null;
    const chapterId = pathParts.includes('chapters') ? pathParts[pathParts.indexOf('chapters') + 1] : null;
    const sceneId = pathParts.includes('scenes') ? pathParts[pathParts.indexOf('scenes') + 1] : null;

    // Auto-expand hierarchy to show current location
    if (storyId) {
      newExpanded[`story-${storyId}`] = true;
    }
    if (partId) {
      newExpanded[`part-${partId}`] = true;
    }
    if (chapterId) {
      newExpanded[`chapter-${chapterId}`] = true;
    }

    setExpanded(newExpanded);
  }, [pathname, hierarchy]);

  // Handle expand/collapse
  const handleToggleExpand = useCallback((nodeType: string, nodeId: string, title: string) => {
    const key = `${nodeType}-${nodeId}`;
    const isExpanding = !expanded[key];
    
    setExpanded(prev => ({ ...prev, [key]: isExpanding }));
    
    // Announce to screen readers
    if (nodeType === 'story') {
      const story = hierarchy?.stories.find(s => s.id === nodeId);
      if (story) {
        setLiveRegionMessage(
          isExpanding 
            ? `Expanded ${title} story, showing ${story.partCount} parts`
            : `Collapsed ${title} story`
        );
      }
    }
  }, [expanded, hierarchy]);

  // Handle navigation
  const handleNavigate = useCallback((context: NavigationContext) => {
    let path = `/books/${context.bookId}`;
    
    if (context.storyId) {
      path += `/stories/${context.storyId}`;
      
      if (context.partId) {
        path += `/parts/${context.partId}`;
        
        if (context.chapterId) {
          path += `/chapters/${context.chapterId}`;
          
          if (context.sceneId) {
            path += `/scenes/${context.sceneId}/write`;
          }
        }
      }
    }
    
    router.push(path);
    onNodeSelect?.(context);
  }, [router, onNodeSelect]);

  // Check if node is currently active/selected
  const isNodeActive = useCallback((type: string, id: string) => {
    const pathParts = pathname.split('/');
    
    switch (type) {
      case 'story':
        return pathParts.includes('stories') && pathParts[pathParts.indexOf('stories') + 1] === id;
      case 'part':
        return pathParts.includes('parts') && pathParts[pathParts.indexOf('parts') + 1] === id;
      case 'chapter':
        return pathParts.includes('chapters') && pathParts[pathParts.indexOf('chapters') + 1] === id;
      case 'scene':
        return pathParts.includes('scenes') && pathParts[pathParts.indexOf('scenes') + 1] === id;
      default:
        return false;
    }
  }, [pathname]);

  // Format word count
  const formatWordCount = useCallback((count: number) => {
    return count.toLocaleString();
  }, []);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent, type: string, id: string, title: string, context: NavigationContext) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (e.currentTarget.querySelector('[data-testid^="expand-"]')) {
          handleToggleExpand(type, id, title);
        } else {
          handleNavigate(context);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (!expanded[`${type}-${id}`]) {
          handleToggleExpand(type, id, title);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (expanded[`${type}-${id}`]) {
          handleToggleExpand(type, id, title);
        }
        break;
    }
  }, [expanded, handleToggleExpand, handleNavigate]);

  // Render scene node
  const renderScene = useCallback((scene: Scene, chapterContext: NavigationContext) => {
    const isActive = isNodeActive('scene', scene.id);
    const context: NavigationContext = { ...chapterContext, sceneId: scene.id };
    
    return (
      <div
        key={scene.id}
        data-testid={`tree-node-scene-${scene.id}`}
        role="treeitem"
        aria-level={4}
        tabIndex={0}
        className={cn(
          'flex items-center gap-2 px-3 py-2 ml-8 text-sm rounded-md cursor-pointer transition-colors',
          'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200',
          isActive && 'bg-primary-50 border border-primary-200 text-primary-700'
        )}
        onClick={() => handleNavigate(context)}
        onKeyDown={(e) => handleKeyDown(e, 'scene', scene.id, scene.title, context)}
      >
        <FileEdit className="w-4 h-4 text-gray-400" />
        {scene.isComplete ? (
          <Check className="w-4 h-4 text-green-500" data-icon="check" />
        ) : (
          <Clock className="w-4 h-4 text-orange-500" data-icon="clock" />
        )}
        <span className="flex-1">{scene.title}</span>
        <span className="text-xs text-gray-500">{formatWordCount(scene.wordCount)} words</span>
      </div>
    );
  }, [isNodeActive, handleNavigate, handleKeyDown, formatWordCount]);

  // Render chapter node
  const renderChapter = useCallback((chapter: Chapter, partContext: NavigationContext) => {
    const isActive = isNodeActive('chapter', chapter.id);
    const isExpanded = expanded[`chapter-${chapter.id}`];
    const hasScenes = chapter.scenes.length > 0;
    const context: NavigationContext = { ...partContext, chapterId: chapter.id };
    
    return (
      <div key={chapter.id} className="ml-6">
        <div
          data-testid={`tree-node-chapter-${chapter.id}`}
          role="treeitem"
          aria-level={3}
          aria-expanded={hasScenes ? isExpanded : undefined}
          tabIndex={0}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200',
            isActive && 'bg-primary-50 border border-primary-200 text-primary-700'
          )}
          onClick={() => handleNavigate(context)}
          onKeyDown={(e) => handleKeyDown(e, 'chapter', chapter.id, chapter.title, context)}
        >
          {hasScenes && (
            <Button
              data-testid={`expand-chapter-${chapter.id}`}
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-transparent"
              aria-expanded={isExpanded}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand('chapter', chapter.id, chapter.title);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" data-icon="chevron-down" />
              ) : (
                <ChevronRight className="w-4 h-4" data-icon="chevron-right" />
              )}
            </Button>
          )}
          <Layers className="w-4 h-4 text-gray-400" />
          {chapter.isPublished ? (
            <CheckCircle className="w-4 h-4 text-green-500" data-icon="check-circle" />
          ) : (
            <Edit className="w-4 h-4 text-orange-500" data-icon="edit" />
          )}
          <span className="flex-1">{chapter.title}</span>
          <span className="text-xs text-gray-500">{formatWordCount(chapter.wordCount)} words</span>
        </div>
        
        {isExpanded && hasScenes && (
          <div className="mt-1">
            {chapter.scenes.map(scene => renderScene(scene, context))}
          </div>
        )}
      </div>
    );
  }, [isNodeActive, expanded, handleNavigate, handleKeyDown, handleToggleExpand, formatWordCount, renderScene]);

  // Render part node
  const renderPart = useCallback((part: Part, storyContext: NavigationContext) => {
    const isActive = isNodeActive('part', part.id);
    const isExpanded = expanded[`part-${part.id}`];
    const hasChapters = part.chapters.length > 0;
    const context: NavigationContext = { ...storyContext, partId: part.id };
    
    return (
      <div key={part.id} className="ml-4">
        <div
          data-testid={`tree-node-part-${part.id}`}
          role="treeitem"
          aria-level={2}
          aria-expanded={hasChapters ? isExpanded : undefined}
          tabIndex={0}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200',
            isActive && 'bg-primary-50 border border-primary-200 text-primary-700'
          )}
          onClick={() => handleNavigate(context)}
          onKeyDown={(e) => handleKeyDown(e, 'part', part.id, part.title, context)}
        >
          {hasChapters && (
            <Button
              data-testid={`expand-part-${part.id}`}
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-transparent"
              aria-expanded={isExpanded}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand('part', part.id, part.title);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" data-icon="chevron-down" />
              ) : (
                <ChevronRight className="w-4 h-4" data-icon="chevron-right" />
              )}
            </Button>
          )}
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="flex-1">{part.title}</span>
          <span className="text-xs text-gray-500">{formatWordCount(part.wordCount)} words</span>
        </div>
        
        {isExpanded && hasChapters && (
          <div className="mt-1">
            {part.chapters.map(chapter => renderChapter(chapter, context))}
          </div>
        )}
      </div>
    );
  }, [isNodeActive, expanded, handleNavigate, handleKeyDown, handleToggleExpand, formatWordCount, renderChapter]);

  // Render story node
  const renderStory = useCallback((story: Story) => {
    const isActive = isNodeActive('story', story.id);
    const isExpanded = expanded[`story-${story.id}`];
    const hasParts = story.parts.length > 0;
    const context: NavigationContext = { bookId, storyId: story.id };
    
    return (
      <div key={story.id} className="mb-2">
        <div
          data-testid={`tree-node-story-${story.id}`}
          role="treeitem"
          aria-level={1}
          aria-expanded={hasParts ? isExpanded : undefined}
          tabIndex={0}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer transition-colors',
            'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-200',
            isActive && 'bg-primary-50 border border-primary-200 text-primary-700'
          )}
          onClick={() => handleNavigate(context)}
          onKeyDown={(e) => handleKeyDown(e, 'story', story.id, story.title, context)}
        >
          {hasParts && (
            <Button
              data-testid={`expand-story-${story.id}`}
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-transparent"
              aria-expanded={isExpanded}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleExpand('story', story.id, story.title);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" data-icon="chevron-down" />
              ) : (
                <ChevronRight className="w-4 h-4" data-icon="chevron-right" />
              )}
            </Button>
          )}
          <Book className="w-4 h-4 text-gray-400" />
          <span className="flex-1 font-medium">{story.title}</span>
          <div className="text-xs text-gray-500 text-right">
            <div>{formatWordCount(story.wordCount)} words</div>
            <div>{story.partCount} parts</div>
          </div>
        </div>
        
        {isExpanded && hasParts && (
          <div className="mt-1">
            {story.parts.map(part => renderPart(part, context))}
          </div>
        )}
      </div>
    );
  }, [bookId, isNodeActive, expanded, handleNavigate, handleKeyDown, handleToggleExpand, formatWordCount, renderPart]);

  // Loading state
  if (loading) {
    return (
      <Card className={cn('p-4', className)}>
        <div data-testid="content-tree-loading">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-4 h-4" />
            <Skeleton className="h-4 w-32" />
          </div>
          <p className="text-sm text-gray-500">Loading hierarchy...</p>
          <div className="space-y-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('p-4', className)}>
        <div data-testid="content-tree-error" className="text-center">
          <p className="text-sm text-red-600 mb-4">Failed to load book hierarchy</p>
          <Button onClick={fetchHierarchy} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // Empty state
  if (!hierarchy || !hierarchy.stories || hierarchy.stories.length === 0) {
    return (
      <Card className={cn('p-4', className)}>
        <div data-testid="content-tree-empty" className="text-center">
          <p className="text-sm text-gray-500">No stories found</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div data-testid="content-tree-container" data-virtualized="true">
        <h2 className="text-lg font-semibold mb-4">Book Structure</h2>
        
        <div
          role="tree"
          aria-label="Book hierarchy navigation"
          className="space-y-1"
        >
          {hierarchy.stories.map(renderStory)}
        </div>
        
        {/* Live region for screen reader announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {liveRegionMessage}
        </div>
      </div>
    </Card>
  );
};

export default ContentTree;