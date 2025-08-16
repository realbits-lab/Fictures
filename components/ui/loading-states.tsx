'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, BookOpen, FileText, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

// Loading spinner with different sizes
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

// Hierarchy-specific loading skeletons
export function HierarchyTreeSkeleton() {
  return (
    <div className="space-y-3 p-4" data-testid="hierarchy-tree-skeleton">
      {/* Book level */}
      <div className="flex items-center space-x-2">
        <BookOpen className="h-5 w-5 text-muted-foreground animate-pulse" />
        <Skeleton className="h-6 w-48" />
      </div>
      
      {/* Story level */}
      <div className="ml-6 space-y-2">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-muted-foreground animate-pulse" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-muted-foreground animate-pulse" />
          <Skeleton className="h-5 w-36" />
        </div>
        
        {/* Part level */}
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="h-3 w-3 text-muted-foreground animate-pulse" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-3 w-3 text-muted-foreground animate-pulse" />
            <Skeleton className="h-4 w-28" />
          </div>
          
          {/* Chapter level */}
          <div className="ml-6 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-26" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
        <div className="mt-4 flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SceneEditorSkeleton() {
  return (
    <div className="space-y-4 p-4" data-testid="scene-editor-skeleton">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      {/* Content editor */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-64 w-full" />
      </div>
      
      {/* Metadata */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex space-x-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function AIContextPanelSkeleton() {
  return (
    <div className="space-y-4 p-4" data-testid="ai-context-panel-skeleton">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-3/4" />
      </div>
      
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

// List loading skeletons
export function BookListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChapterListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

// Progress loading states
interface ProgressLoadingProps {
  progress: number; // 0-100
  text?: string;
  className?: string;
}

export function ProgressLoading({ progress, text, className }: ProgressLoadingProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">
          {text || 'Processing...'} {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// Adaptive loading based on content type
interface AdaptiveLoadingProps {
  type: 'hierarchy' | 'editor' | 'ai-panel' | 'book-list' | 'chapter-list';
  count?: number;
  className?: string;
}

export function AdaptiveLoading({ type, count, className }: AdaptiveLoadingProps) {
  const LoadingComponent = {
    hierarchy: HierarchyTreeSkeleton,
    editor: SceneEditorSkeleton,
    'ai-panel': AIContextPanelSkeleton,
    'book-list': () => <BookListSkeleton count={count} />,
    'chapter-list': () => <ChapterListSkeleton count={count} />,
  }[type];

  return (
    <div className={className}>
      <LoadingComponent />
    </div>
  );
}

// Loading state with retry functionality
interface LoadingWithRetryProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry: () => void;
  loadingComponent: React.ReactNode;
  children: React.ReactNode;
}

export function LoadingWithRetry({
  isLoading,
  error,
  onRetry,
  loadingComponent,
  children
}: LoadingWithRetryProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center space-y-4 p-8">
        <p className="text-destructive text-sm text-center">
          {error.message || 'Something went wrong'}
        </p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <>{loadingComponent}</>;
  }

  return <>{children}</>;
}

// Shimmer effect for enhanced loading feel
export function ShimmerWrapper({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div 
      className={cn(
        'relative overflow-hidden rounded',
        'before:absolute before:inset-0',
        'before:-translate-x-full before:animate-[shimmer_2s_infinite]',
        'before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}