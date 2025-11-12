"use client";

import { cn } from "@/lib/utils/cn";

interface MetricCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    description?: string;
    className?: string;
}

export function MetricCard({
    title,
    value,
    change,
    icon,
    trend,
    description,
    className,
}: MetricCardProps) {
    const trendColor = {
        up: "text-green-600 dark:text-green-400",
        down: "text-red-600 dark:text-red-400",
        neutral: "text-gray-600 dark:text-gray-400",
    };

    const trendIcon = {
        up: "↗",
        down: "↘",
        neutral: "→",
    };

    return (
        <div
            className={cn(
                "bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700",
                className,
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {title}
                </p>
                {icon && <div className="text-2xl">{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {value}
                </p>
                {change !== undefined && trend && (
                    <span
                        className={cn("text-sm font-medium", trendColor[trend])}
                    >
                        {trendIcon[trend]} {Math.abs(change).toFixed(1)}%
                    </span>
                )}
            </div>

            {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {description}
                </p>
            )}
        </div>
    );
}
