"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui";

interface StoryCardData {
	id: string;
	title: string;
	genre: string;
	stats: {
		viewCount: number;
		chapterCount: number;
		rating: number;
	};
}

interface TrendingStoriesProps {
	stories: StoryCardData[];
}

export function TrendingStories({ stories }: TrendingStoriesProps) {
	if (!stories || stories.length === 0) {
		return null;
	}

	return (
		<section className="py-16 bg-[rgb(var(--color-background))]">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<div className="text-center mb-12">
					<h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))] mb-4">
						🔥 Trending Now
					</h2>
					<p className="text-xl text-[rgb(var(--color-muted-foreground))] max-w-2xl mx-auto">
						Discover what readers are loving right now
					</p>
				</div>

				{/* Stories Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
					{stories.map((story) => (
						<Link key={story.id} href={`/novels/${story.id}`}>
							<Card className="h-full transition-all hover:scale-105 hover:shadow-xl cursor-pointer group">
								<CardContent className="p-6">
									{/* Icon */}
									<div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
										📖
									</div>

									{/* Genre Badge */}
									<div className="mb-3">
										<span className="inline-block bg-[rgb(var(--color-primary)/10%)] text-[rgb(var(--color-primary))] text-xs font-semibold px-2 py-1 rounded-full">
											{story.genre}
										</span>
									</div>

									{/* Title */}
									<h3 className="text-lg font-bold text-[rgb(var(--color-foreground))] mb-4 line-clamp-2 min-h-[3.5rem]">
										{story.title}
									</h3>

									{/* Stats */}
									<div className="grid grid-cols-3 gap-2 text-center border-t border-[rgb(var(--color-border))] pt-4">
										<div>
											<div className="text-sm font-bold text-[rgb(var(--color-primary))]">
												{story.stats.chapterCount}
											</div>
											<div className="text-xs text-[rgb(var(--color-muted-foreground))]">
												Chapters
											</div>
										</div>
										<div>
											<div className="text-sm font-bold text-[rgb(var(--color-primary))]">
												{story.stats.viewCount >= 1000
													? `${(story.stats.viewCount / 1000).toFixed(1)}k`
													: story.stats.viewCount}
											</div>
											<div className="text-xs text-[rgb(var(--color-muted-foreground))]">
												Views
											</div>
										</div>
										<div>
											<div className="text-sm font-bold text-[rgb(var(--color-primary))]">
												{story.stats.rating > 0
													? story.stats.rating.toFixed(1)
													: "N/A"}
											</div>
											<div className="text-xs text-[rgb(var(--color-muted-foreground))]">
												Rating
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>

				{/* View All Link */}
				<div className="text-center mt-10">
					<Link
						href="/novels"
						className="inline-flex items-center text-[rgb(var(--color-primary))] hover:underline text-lg font-medium"
					>
						View All Stories
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
