"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface InsightCardProps {
    insight: {
        id: string;
        insightType: string;
        title: string;
        summary: string;
        severity: "info" | "warning" | "critical" | "success";
        actionItems: string[];
        metrics: Record<string, unknown>;
        confidenceScore: string;
        createdAt: string | Date;
    };
    onDismiss?: (id: string) => void;
    onFeedback?: (id: string, wasHelpful: boolean) => void;
}

export function InsightCard({
    insight,
    onDismiss,
    onFeedback,
}: InsightCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [feedbackGiven, setFeedbackGiven] = useState(false);

    const severityConfig = {
        info: {
            icon: "ℹ️",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-200 dark:border-blue-800",
            textColor: "text-blue-800 dark:text-blue-200",
        },
        warning: {
            icon: "⚠️",
            bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
            borderColor: "border-yellow-200 dark:border-yellow-800",
            textColor: "text-yellow-800 dark:text-yellow-200",
        },
        critical: {
            icon: "🚨",
            bgColor: "bg-red-50 dark:bg-red-900/20",
            borderColor: "border-red-200 dark:border-red-800",
            textColor: "text-red-800 dark:text-red-200",
        },
        success: {
            icon: "✅",
            bgColor: "bg-green-50 dark:bg-green-900/20",
            borderColor: "border-green-200 dark:border-green-800",
            textColor: "text-green-800 dark:text-green-200",
        },
    };

    const config = severityConfig[insight.severity];

    const handleFeedback = async (wasHelpful: boolean) => {
        setFeedbackGiven(true);
        onFeedback?.(insight.id, wasHelpful);
    };

    const handleDismiss = () => {
        onDismiss?.(insight.id);
    };

    return (
        <div
            className={cn(
                "rounded-lg border-2 p-6 transition-all",
                config.bgColor,
                config.borderColor,
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{config.icon}</span>
                    <div>
                        <h3
                            className={cn(
                                "text-lg font-semibold",
                                config.textColor,
                            )}
                        >
                            {insight.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {insight.summary}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    ✕
                </button>
            </div>

            {insight.confidenceScore && (
                <div className="mb-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500"
                                style={{
                                    width: `${parseFloat(insight.confidenceScore) * 100}%`,
                                }}
                            />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {(
                                parseFloat(insight.confidenceScore) * 100
                            ).toFixed(0)}
                            % confidence
                        </span>
                    </div>
                </div>
            )}

            {insight.actionItems.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                        {isExpanded ? "▼" : "▶"} {insight.actionItems.length}{" "}
                        recommended actions
                    </button>

                    {isExpanded && (
                        <ul className="mt-3 space-y-2">
                            {insight.actionItems.map((action, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                                >
                                    <span className="text-blue-500 mt-0.5">
                                        •
                                    </span>
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {!feedbackGiven ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Was this helpful?</span>
                        <button
                            onClick={() => handleFeedback(true)}
                            className="px-3 py-1 rounded bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30"
                        >
                            👍 Yes
                        </button>
                        <button
                            onClick={() => handleFeedback(false)}
                            className="px-3 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30"
                        >
                            👎 No
                        </button>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Thanks for your feedback!
                    </p>
                )}
            </div>
        </div>
    );
}
