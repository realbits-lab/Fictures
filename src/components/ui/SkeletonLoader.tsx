import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { cn } from '@/lib/utils/cn'

// Utility components for standalone shimmer effects
export function Shimmer({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-shimmer", className)} {...props}>
      {children}
    </div>
  );
}

export function ShimmerPulse({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-shimmer-pulse", className)} {...props}>
      {children}
    </div>
  );
}

export function ShimmerFast({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-shimmer skeleton-shimmer-fast", className)} {...props}>
      {children}
    </div>
  );
}

export function ShimmerDiagonal({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-shimmer skeleton-shimmer-diagonal", className)} {...props}>
      {children}
    </div>
  );
}

interface SkeletonLoaderProps {
  className?: string;
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export function SkeletonLoader({ className, children, theme = 'light' }: SkeletonLoaderProps) {
  const themeColors = {
    light: {
      baseColor: '#f3f4f6',
      highlightColor: '#ffffff',
      duration: 1.2
    },
    dark: {
      baseColor: '#374151',
      highlightColor: '#6b7280',
      duration: 1.2
    }
  };

  return (
    <SkeletonTheme 
      baseColor={themeColors[theme].baseColor} 
      highlightColor={themeColors[theme].highlightColor}
      duration={themeColors[theme].duration}
      enableAnimation={true}
    >
      <div className={cn(className)}>
        {children}
      </div>
    </SkeletonTheme>
  );
}

// Pre-built skeleton components for common use cases
export function StoryCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Skeleton height={24} className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        <Skeleton height={20} width={60} />
      </div>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <Skeleton width={80} />
          <Skeleton width={40} />
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <Skeleton height={8} />
        </div>
        <div className="flex justify-between text-sm">
          <Skeleton width={80} />
          <Skeleton width={40} />
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <Skeleton height={8} />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Skeleton width={20} height={16} />
            <Skeleton width={30} />
          </div>
          <div className="flex items-center space-x-1">
            <Skeleton width={20} height={16} />
            <Skeleton width={30} />
          </div>
        </div>
        <Skeleton height={32} width={80} />
      </div>
    </div>
  );
}

export function DashboardWidgetSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton height={24} width={24} />
        <Skeleton height={24} width={120} />
      </div>
      <div className="space-y-3">
        <Skeleton height={16} />
        <Skeleton height={16} width="90%" />
        <Skeleton height={16} width="70%" />
        <Skeleton height={16} width="50%" />
      </div>
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-3">
      <Skeleton height={40} width={40} className="rounded-full" />
      <div className="flex-1">
        <Skeleton height={16} width="70%" className="mb-1" />
        <Skeleton height={14} width="50%" />
      </div>
      <Skeleton height={32} width={80} />
    </div>
  );
}

export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton 
          key={i} 
          height={16} 
          width={i === lines - 1 ? '70%' : '100%'} 
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton() {
  return <Skeleton height={40} width={120} className="rounded-lg" />;
}

export function ImageSkeleton({ width = 200, height = 200 }: { width?: number; height?: number }) {
  return <Skeleton height={height} width={width} className="rounded-lg" />;
}