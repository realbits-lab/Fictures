"use client";

import { useEffect, useState } from "react";
import {
    ArrowDown,
    ArrowUp,
    DollarSign,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface ROIData {
    story: {
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
    };
    summary: {
        totalScenes: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        totalTokens: number;
        totalCost: number;
        totalCostFormatted: string;
        totalRevenue: number;
        totalRevenueFormatted: string;
        profit: number;
        profitFormatted: string;
        roi: number | null;
        profitMargin: number | null;
        totalAdImpressions: number;
    };
    sceneBreakdown: Array<{
        id: string;
        title: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        cost: number;
        costFormatted: string;
        modelUsed: string;
        adImpressions: number;
        adRevenue: number;
        adRevenueFormatted: string;
        viewCount: number;
        profit: number;
        profitFormatted: string;
    }>;
    insights: string[];
}

interface ROIAnalysisDashboardProps {
    storyId: string;
}

export function ROIAnalysisDashboard({ storyId }: ROIAnalysisDashboardProps) {
    const [data, setData] = useState<ROIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchROIData() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/analysis/roi/${storyId}`);

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch ROI data: ${response.statusText}`,
                    );
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("Error fetching ROI data:", err);
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to load ROI data",
                );
            } finally {
                setLoading(false);
            }
        }

        fetchROIData();
    }, [storyId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="text-center py-12">
                <div className="text-red-500 dark:text-red-400 mb-4">
                    <DollarSign className="w-12 h-12 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                    Failed to Load ROI Data
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    {error || "An unknown error occurred"}
                </p>
            </div>
        );
    }

    const isProfitable = data.summary.profit > 0;
    const hasPositiveROI = (data.summary.roi ?? 0) > 0;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Revenue */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.totalRevenueFormatted}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.totalAdImpressions.toLocaleString()}{" "}
                            ad impressions
                        </p>
                    </CardContent>
                </Card>

                {/* Total Cost */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Cost
                        </CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.summary.totalCostFormatted}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.totalTokens.toLocaleString()} tokens
                            used
                        </p>
                    </CardContent>
                </Card>

                {/* Profit */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Profit
                        </CardTitle>
                        {isProfitable ? (
                            <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                            <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${
                                isProfitable
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {data.summary.profitFormatted}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isProfitable ? "Profitable" : "In deficit"}
                        </p>
                    </CardContent>
                </Card>

                {/* ROI */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            ROI
                        </CardTitle>
                        {hasPositiveROI ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`text-2xl font-bold ${
                                hasPositiveROI
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                            }`}
                        >
                            {data.summary.roi !== null
                                ? `${data.summary.roi.toFixed(1)}%`
                                : "N/A"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.profitMargin !== null
                                ? `${data.summary.profitMargin.toFixed(1)}% margin`
                                : "No margin data"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Insights */}
            {data.insights.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.insights.map((insight, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm"
                                >
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                                        •
                                    </span>
                                    <span className="text-gray-700 dark:text-gray-300">
                                        {insight}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Scene Breakdown Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Scene-Level Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Scene</TableHead>
                                    <TableHead className="text-right">
                                        Tokens
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Cost
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Views
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Revenue
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Profit
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.sceneBreakdown.map((scene) => (
                                    <TableRow key={scene.id}>
                                        <TableCell className="font-medium">
                                            {scene.title}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {scene.totalTokens.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {scene.costFormatted}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-muted-foreground">
                                            {scene.viewCount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right text-sm">
                                            {scene.adRevenueFormatted}
                                        </TableCell>
                                        <TableCell
                                            className={`text-right text-sm font-medium ${
                                                scene.profit > 0
                                                    ? "text-green-600 dark:text-green-400"
                                                    : scene.profit < 0
                                                      ? "text-red-600 dark:text-red-400"
                                                      : ""
                                            }`}
                                        >
                                            {scene.profitFormatted}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {data.sceneBreakdown.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            No scenes found for this story.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
