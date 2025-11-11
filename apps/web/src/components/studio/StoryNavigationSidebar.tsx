"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

interface Chapter {
	id: string;
	title: string;
	orderIndex: number;
	status: string;
	wordCount: number;
	targetWordCount: number;
}

interface Part {
	id: string;
	title: string;
	orderIndex: number;
	chapters: Chapter[];
}

interface Story {
	id: string;
	title: string;
	genre: string;
	status: string;
	parts: Part[];
	chapters: Chapter[]; // Chapters not in parts
}

interface StoryNavigationSidebarProps {
	story: Story;
	currentChapterId?: string;
}

export function StoryNavigationSidebar({
	story,
	currentChapterId,
}: StoryNavigationSidebarProps) {
	const pathname = usePathname();

	const getChapterStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return "✅";
			case "published":
				return "🚀";
			case "in_progress":
				return "✏️";
			case "draft":
				return "📝";
			default:
				return "📝";
		}
	};

	const getProgressPercentage = (
		wordCount: number,
		targetWordCount: number,
	) => {
		if (targetWordCount === 0) return 0;
		return Math.round((wordCount / targetWordCount) * 100);
	};

	const isCurrentChapter = (chapterId: string) => {
		return (
			pathname === `/studio/edit/${chapterId}` || currentChapterId === chapterId
		);
	};

	return (
		<Card className="h-fit">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<span>📖</span>
					<div className="flex-1 min-w-0">
						<div className="font-semibold truncate">{story.title}</div>
						<div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
							<Badge variant="secondary">{story.genre}</Badge>
							<Badge
								variant={
									story.status === "publishing" ? "default" : "secondary"
								}
							>
								{story.status}
							</Badge>
						</div>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2">
					{/* Parts with Chapters */}
					{story.parts.map((part) => (
						<div
							key={part.id}
							className="border border-gray-200 dark:border-gray-700 rounded-lg"
						>
							<div className="w-full px-3 py-2 text-left flex items-center justify-between rounded-lg">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
										📚 {part.title}
									</span>
									<Badge variant="secondary">{part.chapters.length}</Badge>
								</div>
								<svg
									className="w-4 h-4 text-gray-400 rotate-90"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</div>
							{/* Always show chapters for uncollapsed tree view */}
							<div className="px-3 pb-2 space-y-1">
								{part.chapters.map((chapter) => (
									<Link
										key={chapter.id}
										href={`/studio/edit/${chapter.id}`}
										className={`block px-3 py-2 rounded text-sm transition-colors ${
											isCurrentChapter(chapter.id)
												? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium"
												: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
										}`}
									>
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2 min-w-0">
												<span>{getChapterStatusIcon(chapter.status)}</span>
												<span className="truncate">{chapter.title}</span>
											</div>
											<div className="text-xs text-gray-500 ml-2">
												{getProgressPercentage(
													chapter.wordCount,
													chapter.targetWordCount,
												)}
												%
											</div>
										</div>
									</Link>
								))}
							</div>
						</div>
					))}

					{/* Standalone Chapters (not in parts) */}
					{story.chapters.length > 0 && (
						<div className="space-y-1">
							<div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-1 py-1">
								📄 Chapters
							</div>
							{story.chapters.map((chapter) => (
								<Link
									key={chapter.id}
									href={`/studio/edit/${chapter.id}`}
									className={`block px-3 py-2 rounded text-sm transition-colors ${
										isCurrentChapter(chapter.id)
											? "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium"
											: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
									}`}
								>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2 min-w-0">
											<span>{getChapterStatusIcon(chapter.status)}</span>
											<span className="truncate">{chapter.title}</span>
										</div>
										<div className="text-xs text-gray-500 ml-2">
											{getProgressPercentage(
												chapter.wordCount,
												chapter.targetWordCount,
											)}
											%
										</div>
									</div>
								</Link>
							))}
						</div>
					)}

					{/* Add Chapter Button */}
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start mt-3"
					>
						<span className="mr-2">➕</span>
						Add Chapter
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
