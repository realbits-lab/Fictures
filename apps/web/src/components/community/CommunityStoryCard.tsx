"use client";

import Link from "next/link";
import { StoryImage } from "@/components/ui";

interface CommunityStoryCardProps {
	story: {
		id: string;
		title: string;
		genre: string;
		author: string;
		summary: string;
		totalPosts: number;
		totalMembers: number;
		lastActivity: string;
		isActive: boolean;
		coverImage: string;
		status: string;
	};
	priority?: boolean;
}

export function CommunityStoryCard({
	story,
	priority = false,
}: CommunityStoryCardProps) {
	return (
		<Link href={`/community/story/${story.id}`}>
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-[1.02] hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer">
				{/* Story Image */}
				<div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800">
					<StoryImage
						src={story.coverImage || ""}
						alt={story.title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
						priority={priority}
					/>
				</div>

				<div className="p-4 flex flex-col flex-grow">
					<div className="flex justify-between items-start mb-2 flex-shrink-0">
						<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 truncate max-w-16">
							{story.genre}
						</span>
						<span
							className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
								story.status === "published"
									? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
									: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
							}`}
						>
							{story.status === "published" ? "Published" : "Draft"}
						</span>
					</div>

					<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 flex-shrink-0">
						{story.title}
					</h3>

					<p className="text-gray-600 dark:text-gray-400 text-xs mb-2 line-clamp-3 flex-grow overflow-hidden">
						{story.summary || "No summary available."}
					</p>

					<div className="text-xs text-gray-500 dark:text-gray-500 mb-3 flex-shrink-0 truncate">
						by {story.author}
					</div>

					<div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
						<div className="flex items-center gap-2 overflow-hidden">
							<span className="flex items-center gap-1 flex-shrink-0">
								<span>💬</span>
								<span className="truncate">
									{(story.totalPosts || 0).toLocaleString()}
								</span>
							</span>
							<span className="flex items-center gap-1 flex-shrink-0">
								<span>👥</span>
								<span className="truncate">
									{(story.totalMembers || 0).toLocaleString()}
								</span>
							</span>
							<span className="flex items-center gap-1 flex-shrink-0">
								<span>🕐</span>
								<span className="truncate">{story.lastActivity}</span>
							</span>
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
