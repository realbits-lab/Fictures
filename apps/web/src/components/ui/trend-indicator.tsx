/**
 * TrendIndicator Component
 *
 * Displays growth/decline trends with visual indicators
 * - Shows percentage change with arrow
 * - Color-coded (green for positive, red for negative)
 */

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import React from "react";

interface TrendIndicatorProps {
    value: number; // Percentage change (positive or negative)
    showIcon?: boolean;
    showValue?: boolean;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function TrendIndicator({
    value,
    showIcon = true,
    showValue = true,
    size = "md",
    className = "",
}: TrendIndicatorProps) {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    const sizeClasses = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    };

    const iconSizeClasses = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    const colorClasses = isNeutral
        ? "text-gray-500 dark:text-gray-400"
        : isPositive
          ? "text-green-600 dark:text-green-400"
          : "text-red-600 dark:text-red-400";

    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

    return (
        <div
            className={`inline-flex items-center gap-1 font-medium ${colorClasses} ${sizeClasses[size]} ${className}`}
            title={`${isPositive ? "+" : ""}${value.toFixed(1)}% change`}
        >
            {showIcon && (
                <Icon className={iconSizeClasses[size]} aria-hidden="true" />
            )}
            {showValue && (
                <span>
                    {isPositive && "+"}
                    {value.toFixed(0)}%
                </span>
            )}
        </div>
    );
}

/**
 * Format number with trend indicator
 */
export function TrendValue({
    current,
    previous,
    showIcon = true,
    className = "",
}: {
    current: number;
    previous: number;
    showIcon?: boolean;
    className?: string;
}) {
    const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return (
        <div className={`inline-flex items-center gap-2 ${className}`}>
            <span className="font-bold">{current.toLocaleString()}</span>
            {previous > 0 && (
                <TrendIndicator value={change} showIcon={showIcon} />
            )}
        </div>
    );
}
