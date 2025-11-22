"use client";

import {
    Bot,
    Brain,
    DollarSign,
    Lightbulb,
    RefreshCw,
    Users,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Insight {
    id: string;
    storyId: string;
    insightType: string;
    title: string;
    description: string;
    severity: string;
    actionItems: string[];
    metrics: Record<string, unknown>;
    aiModel: string;
    confidenceScore: string;
    createdAt: string;
}

interface AIInsightsPanelProps {
    storyId: string;
}

export function AIInsightsPanel({ storyId }: AIInsightsPanelProps) {
    const [isGeneratingEditor, setIsGeneratingEditor] = useState(false);
    const [isGeneratingMarketer, setIsGeneratingMarketer] = useState(false);

    const {
        data: insightsData,
        isLoading,
        mutate,
    } = useSWR<{ insights: Insight[] }>(
        `/api/analysis/insights?storyId=${storyId}`,
        fetcher,
        {
            revalidateOnFocus: false,
            refreshInterval: 0,
        },
    );

    const insights = insightsData?.insights || [];

    // Filter insights by agent type
    const editorInsightTypes = [
        "community_engagement",
        "content_demand",
        "retention_strategy",
        "user_churn_risk",
    ];
    const marketerInsightTypes = [
        "ad_optimization",
        "revenue_opportunity",
        "publishing_schedule",
        "audience_growth",
    ];

    const editorInsights = insights.filter((i) =>
        editorInsightTypes.includes(i.insightType),
    );
    const marketerInsights = insights.filter((i) =>
        marketerInsightTypes.includes(i.insightType),
    );

    const handleGenerateEditorInsights = async () => {
        setIsGeneratingEditor(true);
        try {
            const response = await fetch("/api/analysis/insights/editor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to generate insights");
            }

            // Refresh insights list
            await mutate();
        } catch (error) {
            console.error("Failed to generate editor insights:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to generate editor insights",
            );
        } finally {
            setIsGeneratingEditor(false);
        }
    };

    const handleGenerateMarketerInsights = async () => {
        setIsGeneratingMarketer(true);
        try {
            const response = await fetch("/api/analysis/insights/marketer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to generate insights");
            }

            // Refresh insights list
            await mutate();
        } catch (error) {
            console.error("Failed to generate marketer insights:", error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to generate marketer insights",
            );
        } finally {
            setIsGeneratingMarketer(false);
        }
    };

    const getIconForInsightType = (type: string) => {
        switch (type) {
            case "community_engagement":
                return <Users className="w-5 h-5" />;
            case "content_demand":
                return <Lightbulb className="w-5 h-5" />;
            case "retention_strategy":
                return <Brain className="w-5 h-5" />;
            case "user_churn_risk":
                return <Users className="w-5 h-5" />;
            case "ad_optimization":
                return <DollarSign className="w-5 h-5" />;
            case "revenue_opportunity":
                return <DollarSign className="w-5 h-5" />;
            case "publishing_schedule":
                return <Bot className="w-5 h-5" />;
            case "audience_growth":
                return <Users className="w-5 h-5" />;
            default:
                return <Bot className="w-5 h-5" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "warning":
                return "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20";
            case "error":
                return "border-l-red-500 bg-red-50 dark:bg-red-950/20";
            default:
                return "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20";
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-[rgb(var(--color-muted))] rounded-lg animate-pulse"></div>
                <div className="h-32 bg-[rgb(var(--color-muted))] rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* AI Editor Section */}
            <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                                AI Editor
                            </h3>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Community engagement & retention insights
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerateEditorInsights}
                        disabled={isGeneratingEditor}
                        variant="outline"
                        size="sm"
                    >
                        {isGeneratingEditor ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate Insights
                            </>
                        )}
                    </Button>
                </div>

                {editorInsights.length === 0 ? (
                    <div className="text-center py-8 text-[rgb(var(--color-muted-foreground))]">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No editor insights yet</p>
                        <p className="text-sm mt-1">
                            Click "Generate Insights" to analyze community
                            engagement
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {editorInsights.map((insight) => (
                            <div
                                key={insight.id}
                                className={`border-l-4 rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        {getIconForInsightType(
                                            insight.insightType,
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-[rgb(var(--color-foreground))] mb-1">
                                            {insight.title}
                                        </h4>
                                        <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-3">
                                            {insight.description}
                                        </p>
                                        {insight.actionItems &&
                                            insight.actionItems.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                                                        Recommended Actions:
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-[rgb(var(--color-muted-foreground))]">
                                                        {insight.actionItems.map(
                                                            (action) => (
                                                                <li key={action}>
                                                                    {action}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        <div className="mt-3 flex items-center gap-2 text-xs text-[rgb(var(--color-muted-foreground))]">
                                            <span>
                                                AI Confidence:{" "}
                                                {insight.confidenceScore}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(
                                                    insight.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Marketer Section */}
            <div className="bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))]">
                                AI Marketer
                            </h3>
                            <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                                Ad optimization & revenue insights
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleGenerateMarketerInsights}
                        disabled={isGeneratingMarketer}
                        variant="outline"
                        size="sm"
                    >
                        {isGeneratingMarketer ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate Insights
                            </>
                        )}
                    </Button>
                </div>

                {marketerInsights.length === 0 ? (
                    <div className="text-center py-8 text-[rgb(var(--color-muted-foreground))]">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No marketer insights yet</p>
                        <p className="text-sm mt-1">
                            Click "Generate Insights" to analyze ad performance
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {marketerInsights.map((insight) => (
                            <div
                                key={insight.id}
                                className={`border-l-4 rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        {getIconForInsightType(
                                            insight.insightType,
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-[rgb(var(--color-foreground))] mb-1">
                                            {insight.title}
                                        </h4>
                                        <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-3">
                                            {insight.description}
                                        </p>
                                        {insight.actionItems &&
                                            insight.actionItems.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                                                        Recommended Actions:
                                                    </p>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-[rgb(var(--color-muted-foreground))]">
                                                        {insight.actionItems.map(
                                                            (action) => (
                                                                <li key={action}>
                                                                    {action}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        <div className="mt-3 flex items-center gap-2 text-xs text-[rgb(var(--color-muted-foreground))]">
                                            <span>
                                                AI Confidence:{" "}
                                                {insight.confidenceScore}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(
                                                    insight.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
