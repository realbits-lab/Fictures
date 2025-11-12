/**
 * SceneViewBadge Component
 *
 * Displays scene view counts in a compact badge format
 * - Shows total, novel, and comic views
 * - Multiple display modes (compact, split, detailed)
 */

import { Eye } from "lucide-react";
import React from "react";
import { formatCount } from "@/components/ui/view-count";

interface SceneViewBadgeProps {
    totalViews: number;
    novelViews?: number;
    comicViews?: number;
    mode?: "compact" | "split" | "detailed";
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function SceneViewBadge({
    totalViews,
    novelViews,
    comicViews,
    mode = "compact",
    size = "md",
    className = "",
}: SceneViewBadgeProps) {
    const sizeClasses = {
        sm: "text-xs px-2 py-0.5",
        md: "text-sm px-2.5 py-1",
        lg: "text-base px-3 py-1.5",
    };

    const iconSizeClasses = {
        sm: "w-3 h-3",
        md: "w-3.5 h-3.5",
        lg: "w-4 h-4",
    };

    if (mode === "compact") {
        return (
            <div
                className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium ${sizeClasses[size]} ${className}`}
                title={`${totalViews.toLocaleString()} total views`}
            >
                <Eye className={iconSizeClasses[size]} aria-hidden="true" />
                <span>{formatCount(totalViews)}</span>
            </div>
        );
    }

    if (
        mode === "split" &&
        novelViews !== undefined &&
        comicViews !== undefined
    ) {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                <div
                    className={`inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium ${sizeClasses[size]}`}
                    title={`${novelViews.toLocaleString()} novel views`}
                >
                    <span>📖</span>
                    <span>{formatCount(novelViews)}</span>
                </div>
                <div
                    className={`inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium ${sizeClasses[size]}`}
                    title={`${comicViews.toLocaleString()} comic views`}
                >
                    <span>🎨</span>
                    <span>{formatCount(comicViews)}</span>
                </div>
            </div>
        );
    }

    if (mode === "detailed") {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <div
                    className={`inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 ${sizeClasses[size]}`}
                >
                    <Eye className={iconSizeClasses[size]} aria-hidden="true" />
                    <span className="font-medium">
                        {formatCount(totalViews)}
                    </span>
                    <span className="text-xs text-gray-500">total</span>
                </div>
                {novelViews !== undefined && comicViews !== undefined && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600 dark:text-blue-400">
                            📖 {formatCount(novelViews)}
                        </span>
                        <span className="text-purple-600 dark:text-purple-400">
                            🎨 {formatCount(comicViews)}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return null;
}

export { formatCount };
