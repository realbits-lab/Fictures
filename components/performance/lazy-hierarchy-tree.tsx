'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded components for better performance
const ContentTreeCore = dynamic(
  () => import('@/components/books/hierarchy/content-tree').then(mod => ({ default: mod.ContentTree })),
  {
    loading: () => <HierarchyTreeSkeleton />,
    ssr: false // Disable SSR for heavy interactive components
  }
);

const SceneEditorCore = dynamic(
  () => import('@/components/books/writing/scene-editor').then(mod => ({ default: mod.SceneEditor })),
  {
    loading: () => <EditorSkeleton />,
    ssr: false
  }
);

const AIContextPanelCore = dynamic(
  () => import('@/components/books/writing/ai-context-panel').then(mod => ({ default: mod.AIContextPanel })),
  {
    loading: () => <AIPanelSkeleton />,
    ssr: false
  }
);

// Optimized loading skeletons
function HierarchyTreeSkeleton() {
  return (
    <div className="space-y-2 p-4" data-testid="hierarchy-loading-skeleton">
      <Skeleton className="h-8 w-full" />
      <div className="ml-4 space-y-2">
        <Skeleton className="h-6 w-5/6" />
        <div className="ml-4 space-y-1">
          <Skeleton className="h-5 w-4/6" />
          <Skeleton className="h-5 w-3/6" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </div>
      <div className="ml-4 space-y-2">
        <Skeleton className="h-6 w-4/6" />
        <div className="ml-4 space-y-1">
          <Skeleton className="h-5 w-3/6" />
          <Skeleton className="h-5 w-4/6" />
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="space-y-4 p-4" data-testid="editor-loading-skeleton">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

function AIPanelSkeleton() {
  return (
    <div className="space-y-3 p-4" data-testid="ai-panel-loading-skeleton">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

// Virtual scrolling wrapper for large lists
interface VirtualScrollListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}

export function VirtualScrollList({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem 
}: VirtualScrollListProps) {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // Buffer for smooth scrolling
  const startIndex = 0; // In real implementation, this would be calculated from scroll position
  const visibleItems = items.slice(startIndex, startIndex + visibleCount);

  return (
    <div 
      style={{ height: containerHeight, overflow: 'auto' }}
      data-testid="virtual-scroll-container"
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id || index}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              width: '100%',
              height: itemHeight
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoized hierarchy components
import { memo } from 'react';

export const LazyContentTree = memo(function LazyContentTree(props: any) {
  return (
    <Suspense fallback={<HierarchyTreeSkeleton />}>
      <ContentTreeCore {...props} />
    </Suspense>
  );
});

export const LazySceneEditor = memo(function LazySceneEditor(props: any) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <SceneEditorCore {...props} />
    </Suspense>
  );
});

export const LazyAIContextPanel = memo(function LazyAIContextPanel(props: any) {
  return (
    <Suspense fallback={<AIPanelSkeleton />}>
      <AIContextPanelCore {...props} />
    </Suspense>
  );
});

// Image optimization component
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false, 
  className 
}: OptimizedImageProps) {
  return (
    <picture>
      <source 
        srcSet={`${src}?format=avif&w=${width || 800}`} 
        type="image/avif" 
      />
      <source 
        srcSet={`${src}?format=webp&w=${width || 800}`} 
        type="image/webp" 
      />
      <img
        src={`${src}?w=${width || 800}`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        className={className}
        data-testid="optimized-image"
      />
    </picture>
  );
}

// Performance monitoring hook
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current++;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName}:`, {
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current
          });
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    startRender: () => {
      renderStartTime.current = performance.now();
    },
    endRender: () => {
      if (renderStartTime.current) {
        return performance.now() - renderStartTime.current;
      }
      return 0;
    }
  };
}

// Memory cleanup utilities
export function useCleanupEffect(cleanup: () => void, deps?: React.DependencyList) {
  useEffect(() => {
    return cleanup;
  }, deps);
}

export function useAbortController() {
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    abortController.current = new AbortController();
    
    return () => {
      abortController.current?.abort();
    };
  }, []);

  return abortController.current;
}