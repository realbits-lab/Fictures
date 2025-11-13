/**
 * ScenePerformanceTable Component
 *
 * Displays detailed scene performance metrics in table format
 * - Sortable by different metrics
 * - Shows novel/comic breakdown
 * - Trend indicators for performance changes
 */

"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { FormatDistributionBar } from "@/components/ui/format-distribution";
import { SceneViewBadge } from "@/components/ui/scene-view-badge";

interface ScenePerformanceTableProps {
    storyId: string;
    className?: string;
}

type SortField = "views" | "novel" | "comic" | "recent";
type SortOrder = "asc" | "desc";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ScenePerformanceTable({
    storyId,
    className = "",
}: ScenePerformanceTableProps) {
    const [sortBy, setSortBy] = useState<SortField>("views");
    const [order, setOrder] = useState<SortOrder>("desc");
    const [limit] = useState(20);

    const { data, error, isLoading } = useSWR(
        `/api/studio/story/${storyId}/scene-stats?sortBy=${sortBy}&order=${order}&limit=${limit}`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 300000, // 5 minutes
        },
    );

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setOrder(order === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setOrder("desc");
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortBy !== field) return null;
        return order === "asc" ? (
            <ChevronUp className="w-4 h-4" />
        ) : (
            <ChevronDown className="w-4 h-4" />
        );
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>📊 Scene Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error || !data?.success) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>📊 Scene Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-red-600 dark:text-red-400">
                        Failed to load scene performance data
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { scenes, stats } = data;

    if (!scenes || scenes.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>📊 Scene Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No scene data available yet
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>📊 Scene Performance</CardTitle>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {stats.totalViews.toLocaleString()} total views •{" "}
                        {stats.totalScenes} scenes
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <div className="col-span-4">Scene</div>
                    <div
                        className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => handleSort("views")}
                    >
                        Total <SortIcon field="views" />
                    </div>
                    <div
                        className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => handleSort("novel")}
                    >
                        📖 Novel <SortIcon field="novel" />
                    </div>
                    <div
                        className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                        onClick={() => handleSort("comic")}
                    >
                        🎨 Comic <SortIcon field="comic" />
                    </div>
                    <div className="col-span-2">Distribution</div>
                </div>

                {/* Table Body */}
                <div className="space-y-2 mt-3">
                    {scenes.map((scene: any, index: number) => (
                        <div
                            key={scene.id}
                            className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                            {/* Scene Info */}
                            <div className="col-span-4 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-gray-100 truncate text-sm">
                                    Ch{scene.chapter.number}, Scene{" "}
                                    {scene.sceneNumber}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {scene.title}
                                </div>
                            </div>

                            {/* Total Views */}
                            <div className="col-span-2">
                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                    {scene.views.total.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {scene.views.unique.toLocaleString()} unique
                                </div>
                            </div>

                            {/* Novel Views */}
                            <div className="col-span-2">
                                <div className="font-medium text-blue-600 dark:text-blue-400">
                                    {scene.views.novel.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {scene.views.novelUnique.toLocaleString()}{" "}
                                    unique
                                </div>
                            </div>

                            {/* Comic Views */}
                            <div className="col-span-2">
                                <div className="font-medium text-purple-600 dark:text-purple-400">
                                    {scene.views.comic.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {scene.views.comicUnique.toLocaleString()}{" "}
                                    unique
                                </div>
                            </div>

                            {/* Distribution Bar */}
                            <div className="col-span-2">
                                <FormatDistributionBar
                                    novelViews={scene.views.novel}
                                    comicViews={scene.views.comic}
                                    height="h-2"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
