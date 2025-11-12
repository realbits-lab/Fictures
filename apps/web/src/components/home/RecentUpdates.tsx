"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

interface RecentUpdate {
    storyId: string;
    storyTitle: string;
    chapterId: string;
    chapterTitle: string;
    chapterNumber: number;
    genre: string;
    updatedAt: Date;
}

interface RecentUpdatesProps {
    updates: RecentUpdate[];
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}

export function RecentUpdates({ updates }: RecentUpdatesProps) {
    if (!updates || updates.length === 0) {
        return null;
    }

    return (
        <section className="py-16 bg-[rgb(var(--color-background))]">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))] mb-4">
                        ✨ Fresh Chapters
                    </h2>
                    <p className="text-xl text-[rgb(var(--color-muted-foreground))] max-w-2xl mx-auto">
                        Recently updated stories - new content to enjoy
                    </p>
                </div>

                {/* Updates List */}
                <div className="max-w-4xl mx-auto space-y-4">
                    {updates.map((update, index) => (
                        <Link
                            key={`${update.storyId}-${update.chapterId}-${index}`}
                            href={`/novels/${update.storyId}`}
                        >
                            <Card className="transition-all hover:shadow-lg hover:border-[rgb(var(--color-primary))] cursor-pointer group">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: Story Info */}
                                        <div className="flex-1 min-w-0">
                                            {/* Genre Badge */}
                                            <div className="mb-2">
                                                <span className="inline-block bg-[rgb(var(--color-primary)/10%)] text-[rgb(var(--color-primary))] text-xs font-semibold px-2 py-1 rounded-full">
                                                    {update.genre}
                                                </span>
                                            </div>

                                            {/* Story Title */}
                                            <h3 className="text-lg font-bold text-[rgb(var(--color-foreground))] mb-1 group-hover:text-[rgb(var(--color-primary))] transition-colors">
                                                {update.storyTitle}
                                            </h3>

                                            {/* Chapter Info */}
                                            <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-2">
                                                <span className="font-medium">
                                                    Chapter{" "}
                                                    {update.chapterNumber}:
                                                </span>{" "}
                                                {update.chapterTitle}
                                            </p>

                                            {/* Update Time */}
                                            <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-muted-foreground))]">
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                                <span>
                                                    Updated{" "}
                                                    {formatTimeAgo(
                                                        update.updatedAt,
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Right: Icon */}
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-primary)/60%)] flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                📖
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* View All Updates Link */}
                <div className="text-center mt-10">
                    <Link
                        href="/novels"
                        className="inline-flex items-center text-[rgb(var(--color-primary))] hover:underline text-lg font-medium"
                    >
                        See All Updates
                        <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
