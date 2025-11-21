/**
 * FormatDistribution Component
 *
 * Displays novel vs comic view distribution with visual bar chart
 */

interface FormatDistributionProps {
    novelViews: number;
    comicViews: number;
    showLabels?: boolean;
    showPercentages?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function FormatDistribution({
    novelViews,
    comicViews,
    showLabels = true,
    showPercentages = true,
    size = "md",
    className = "",
}: FormatDistributionProps) {
    const total = novelViews + comicViews;
    const novelPercentage = total > 0 ? (novelViews / total) * 100 : 50;
    const comicPercentage = total > 0 ? (comicViews / total) * 100 : 50;

    const heightClasses = {
        sm: "h-2",
        md: "h-3",
        lg: "h-4",
    };

    const textSizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Novel Bar */}
            {showLabels && (
                <div
                    className={`flex items-center justify-between ${textSizeClasses[size]}`}
                >
                    <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        📖 Novel
                    </span>
                    {showPercentages && (
                        <span className="text-gray-600 dark:text-gray-400">
                            {novelPercentage.toFixed(1)}% (
                            {novelViews.toLocaleString()})
                        </span>
                    )}
                </div>
            )}
            <div
                className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[size]}`}
            >
                <div
                    className="bg-blue-500 dark:bg-blue-400 h-full transition-all duration-300"
                    style={{ width: `${novelPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={novelPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>

            {/* Comic Bar */}
            {showLabels && (
                <div
                    className={`flex items-center justify-between ${textSizeClasses[size]} mt-3`}
                >
                    <span className="text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                        🎨 Comic
                    </span>
                    {showPercentages && (
                        <span className="text-gray-600 dark:text-gray-400">
                            {comicPercentage.toFixed(1)}% (
                            {comicViews.toLocaleString()})
                        </span>
                    )}
                </div>
            )}
            <div
                className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${heightClasses[size]}`}
            >
                <div
                    className="bg-purple-500 dark:bg-purple-400 h-full transition-all duration-300"
                    style={{ width: `${comicPercentage}%` }}
                    role="progressbar"
                    aria-valuenow={comicPercentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                />
            </div>
        </div>
    );
}

/**
 * Compact horizontal distribution bar
 */
export function FormatDistributionBar({
    novelViews,
    comicViews,
    height = "h-3",
    className = "",
}: {
    novelViews: number;
    comicViews: number;
    height?: string;
    className?: string;
}) {
    const total = novelViews + comicViews;
    const novelPercentage = total > 0 ? (novelViews / total) * 100 : 50;
    const comicPercentage = total > 0 ? (comicViews / total) * 100 : 50;

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div
                className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${height}`}
            >
                <div className="flex h-full">
                    <div
                        className="bg-blue-500 dark:bg-blue-400 transition-all duration-300"
                        style={{ width: `${novelPercentage}%` }}
                        title={`Novel: ${novelPercentage.toFixed(1)}%`}
                    />
                    <div
                        className="bg-purple-500 dark:bg-purple-400 transition-all duration-300"
                        style={{ width: `${comicPercentage}%` }}
                        title={`Comic: ${comicPercentage.toFixed(1)}%`}
                    />
                </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                <span className="text-blue-600 dark:text-blue-400">
                    {novelPercentage.toFixed(0)}%
                </span>
                {" / "}
                <span className="text-purple-600 dark:text-purple-400">
                    {comicPercentage.toFixed(0)}%
                </span>
            </div>
        </div>
    );
}
