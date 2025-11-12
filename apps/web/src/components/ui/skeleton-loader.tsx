import { cn } from "@/lib/utils/cn";

// Base Skeleton Component using Tailwind's animate-pulse with theme-aware colors
export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md", className)}
            style={{
                backgroundColor: "var(--shimmer-base, rgb(203 213 225 / 0.8))",
            }}
            {...props}
        />
    );
}

// Enhanced Shimmer Effects using custom CSS animations with theme colors
export function Shimmer({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("skeleton-shimmer rounded-md", className)}
            style={{
                backgroundColor: "var(--shimmer-base, rgb(203 213 225 / 0.8))",
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export function ShimmerPulse({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("skeleton-shimmer-pulse rounded-md", className)}
            style={{
                backgroundColor: "var(--shimmer-base, rgb(203 213 225 / 0.8))",
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export function ShimmerFast({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "skeleton-shimmer skeleton-shimmer-fast rounded-md",
                className,
            )}
            style={{
                backgroundColor: "var(--shimmer-base, rgb(203 213 225 / 0.8))",
            }}
            {...props}
        >
            {children}
        </div>
    );
}

export function ShimmerDiagonal({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "skeleton-shimmer skeleton-shimmer-diagonal rounded-md",
                className,
            )}
            style={{
                backgroundColor: "var(--shimmer-base, rgb(203 213 225 / 0.8))",
            }}
            {...props}
        >
            {children}
        </div>
    );
}

// Utility component for skeleton container with theme support
interface SkeletonLoaderProps {
    className?: string;
    children: React.ReactNode;
    variant?: "pulse" | "shimmer" | "fast" | "diagonal";
}

export function SkeletonLoader({
    className,
    children,
    variant = "pulse",
}: SkeletonLoaderProps) {
    const variantClasses = {
        pulse: "animate-pulse",
        shimmer: "skeleton-shimmer",
        fast: "skeleton-shimmer skeleton-shimmer-fast",
        diagonal: "skeleton-shimmer skeleton-shimmer-diagonal",
    };

    return (
        <div className={cn(variantClasses[variant], className)}>{children}</div>
    );
}

// Pre-built skeleton components for common use cases
export function StoryCardSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-4 w-3/5" />
                </div>
                <Skeleton className="h-5 w-15" />
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                        <Skeleton className="h-4 w-5" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="flex items-center space-x-1">
                        <Skeleton className="h-4 w-5" />
                        <Skeleton className="h-4 w-8" />
                    </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
        </div>
    );
}

export function DashboardWidgetSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-30" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-2/5" />
            </div>
        </div>
    );
}

export function ListItemSkeleton() {
    return (
        <div className="flex items-center space-x-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-3/5 mb-1" />
                <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
    );
}

export function TextBlockSkeleton({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton
                    key={i}
                    className={cn("h-4", i === lines - 1 ? "w-3/5" : "w-full")}
                />
            ))}
        </div>
    );
}

export function ButtonSkeleton() {
    return <Skeleton className="h-10 w-30 rounded-lg" />;
}

export function ImageSkeleton({
    width = 200,
    height = 200,
}: {
    width?: number;
    height?: number;
}) {
    return <Skeleton className="rounded-lg" style={{ width, height }} />;
}
