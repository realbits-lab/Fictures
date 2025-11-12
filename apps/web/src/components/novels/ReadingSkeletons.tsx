/**
 * ⚡ Loading Skeletons for Streaming SSR Performance
 * Strategy 1: Show instant UI placeholders while content streams in
 */

export function StoryHeaderSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Story header */}
            <div className="bg-gray-200 dark:bg-gray-700 h-12 w-2/3 rounded mb-6" />

            {/* Story metadata */}
            <div className="flex gap-4 mb-8">
                <div className="bg-gray-200 dark:bg-gray-700 h-6 w-24 rounded" />
                <div className="bg-gray-200 dark:bg-gray-700 h-6 w-32 rounded" />
            </div>

            {/* Content area */}
            <div className="space-y-4">
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-full rounded" />
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-full rounded" />
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-3/4 rounded" />
            </div>
        </div>
    );
}

export function ChapterListSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                    <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/3 rounded mb-2" />
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 w-full rounded" />
                    <div className="bg-gray-200 dark:bg-gray-700 h-4 w-2/3 rounded mt-2" />
                </div>
            ))}
        </div>
    );
}

export function SceneContentSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            {/* Scene image */}
            <div className="bg-gray-200 dark:bg-gray-700 h-64 w-full rounded-lg" />

            {/* Scene title */}
            <div className="bg-gray-200 dark:bg-gray-700 h-8 w-1/2 rounded" />

            {/* Scene content */}
            <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="bg-gray-200 dark:bg-gray-700 h-4 rounded"
                        style={{ width: `${85 + Math.random() * 15}%` }}
                    />
                ))}
            </div>
        </div>
    );
}
