"use client";

import { useState } from "react";
import { FormatDistributionCard } from "@/components/analysis/FormatDistributionCard";
import { ScenePerformanceTable } from "@/components/analysis/ScenePerformanceTable";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Progress,
	Skeleton,
} from "@/components/ui";
import {
	useReaderAnalysis,
	useStoryAnalysis,
} from "@/lib/hooks/use-page-cache";

// Skeleton components for loading states
function MetricsSkeleton() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
			{Array.from({ length: 4 }).map((_, i) => (
				<Card key={i}>
					<CardContent className="py-6">
						<div className="text-center space-y-2">
							<Skeleton className="h-9 w-15 mx-auto" />
							<Skeleton className="h-3 w-20 mx-auto" />
							<Skeleton className="h-3 w-25 mx-auto" />
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function StoryPerformanceSkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>📈 Story Performance</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{Array.from({ length: 2 }).map((_, i) => (
					<div key={i} className="space-y-3">
						<div className="flex items-center justify-between">
							<div>
								<Skeleton className="h-5 w-38 mb-1" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-6 w-20" />
						</div>
						<div className="space-y-2">
							<div className="flex justify-between">
								<Skeleton className="h-3 w-25" />
								<Skeleton className="h-3 w-10" />
							</div>
							<Skeleton className="h-2 w-full" />
						</div>
						<Skeleton className="h-3 w-4/5" />
						{i < 1 && (
							<div className="border-t border-gray-200 dark:border-gray-700 pt-4" />
						)}
					</div>
				))}
			</CardContent>
		</Card>
	);
}

export function AnalysisDashboard() {
	const {
		data: analysisData,
		isLoading: analysisLoading,
		error: analysisError,
	} = useStoryAnalysis("7d");
	const {
		data: readerData,
		isLoading: readerLoading,
		error: readerError,
	} = useReaderAnalysis("7d");
	const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

	const isLoading = analysisLoading || readerLoading;
	const hasError = analysisError || readerError;

	// TODO: Get actual story ID from user's stories - for now using placeholder
	// This should be replaced with actual story selection logic
	const storyId = selectedStoryId || "placeholder-story-id";

	return (
		<div className="space-y-8">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
					<span>📊</span>
					Analysis Dashboard
				</h1>
				<p className="text-gray-600 dark:text-gray-400 mt-2">
					Track your stories&rsquo; performance and reader engagement
				</p>
			</div>

			{/* Key Metrics */}
			{isLoading ? (
				<MetricsSkeleton />
			) : hasError ? (
				<Card className="border-red-200 dark:border-red-800">
					<CardContent className="py-8 text-center">
						<div className="text-4xl mb-4">⚠️</div>
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
							Failed to load analysis data
						</h3>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							{analysisError?.message ||
								readerError?.message ||
								"Unknown error occurred"}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					<Card>
						<CardContent className="py-6">
							<div className="text-center space-y-2">
								<div className="text-3xl font-bold text-blue-600">
									{analysisData?.totalReaders?.toLocaleString() || "2.4k"}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Total Readers
								</div>
								<div className="flex items-center justify-center text-xs text-green-600">
									↗️ +{analysisData?.readerGrowth || 12}% this week
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="py-6">
							<div className="text-center space-y-2">
								<div className="text-3xl font-bold text-green-600">
									{analysisData?.avgRating || "4.7"}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Avg Rating
								</div>
								<div className="flex items-center justify-center text-xs text-green-600">
									↗️ +{analysisData?.ratingChange || "0.1"} this week
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="py-6">
							<div className="text-center space-y-2">
								<div className="text-3xl font-bold text-purple-600">
									{analysisData?.totalComments?.toLocaleString() || "1.2k"}
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Comments
								</div>
								<div className="flex items-center justify-center text-xs text-green-600">
									↗️ +{analysisData?.commentGrowth || 23}% this week
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="py-6">
							<div className="text-center space-y-2">
								<div className="text-3xl font-bold text-orange-600">
									{analysisData?.engagement || "87"}%
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-400">
									Engagement
								</div>
								<div className="flex items-center justify-center text-xs text-green-600">
									↗️ +{analysisData?.engagementGrowth || 5}% this week
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Story Performance */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{isLoading ? (
					<StoryPerformanceSkeleton />
				) : (
					<Card>
						<CardHeader>
							<CardTitle>📈 Story Performance</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-gray-900 dark:text-gray-100">
											The Shadow Keeper
										</div>
										<div className="text-sm text-gray-600 dark:text-gray-400">
											Urban Fantasy
										</div>
									</div>
									<Badge variant="default">Trending #2</Badge>
								</div>
								<div className="space-y-2">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											Reader Retention
										</span>
										<span className="font-medium">94%</span>
									</div>
									<Progress value={94} />
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									👁️ 3,247 views • 💬 126 comments • ❤️ 456 reactions
								</div>
							</div>

							<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<div>
											<div className="font-medium text-gray-900 dark:text-gray-100">
												Dragon Chronicles
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400">
												Epic Fantasy
											</div>
										</div>
										<Badge variant="secondary">Rising</Badge>
									</div>
									<div className="space-y-2">
										<div className="flex justify-between text-sm">
											<span className="text-gray-600 dark:text-gray-400">
												Reader Retention
											</span>
											<span className="font-medium">78%</span>
										</div>
										<Progress value={78} />
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										👁️ 1,892 views • 💬 67 comments • ❤️ 234 reactions
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{isLoading ? (
					<Card>
						<CardHeader>
							<CardTitle>💬 Community Engagement</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								{Array.from({ length: 3 }).map((_, i) => (
									<div
										key={i}
										className="p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg"
									>
										<div className="flex items-center justify-between mb-2">
											<Skeleton className="h-4 w-30" />
											<Skeleton className="h-5 w-10 rounded-full" />
										</div>
										<Skeleton className="h-4 w-9/10 mb-2" />
										<div className="flex items-center gap-4 mt-2">
											<Skeleton className="h-3 w-20" />
											<Skeleton className="h-3 w-15" />
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>💬 Community Engagement</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-3">
								<div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
											Top Theory Post
										</span>
										<Badge variant="secondary">Hot</Badge>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{readerData?.topPost?.title ||
											"&ldquo;Maya&rsquo;s True Power Theory - MASSIVE PLOT TWIST INCOMING!&rdquo;"}
									</p>
									<div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
										<span>{readerData?.topPost?.replies || 347} replies</span>
										<span>
											{readerData?.topPost?.reactions || 23} reactions
										</span>
									</div>
								</div>

								<div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
											Recent Comment
										</span>
										<Badge variant="default">Positive</Badge>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{readerData?.recentComment?.text ||
											"&ldquo;The way you write Maya&rsquo;s internal conflict is incredible. Can&rsquo;t wait for the finale!&rdquo;"}
									</p>
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
										{readerData?.recentComment?.likes || 45} likes •{" "}
										{readerData?.recentComment?.author || "@FantasyLover99"}
									</div>
								</div>

								<div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
											Fan Content
										</span>
										<Badge variant="default">Art</Badge>
									</div>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{readerData?.fanContent?.title ||
											"&ldquo;Maya vs Void Collector&rdquo; fan art"}{" "}
										by {readerData?.fanContent?.author || "@ArtistPro"}
									</p>
									<div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
										{readerData?.fanContent?.likes || 234} likes •{" "}
										{readerData?.fanContent?.shares || 12} shares
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Reader Demographics */}
			{isLoading ? (
				<Card>
					<CardHeader>
						<CardTitle>👥 Reader Demographics</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i}>
									<Skeleton className="h-5 w-30 mb-3" />
									<div className="space-y-2">
										{Array.from({ length: 3 }).map((_, j) => (
											<div
												key={j}
												className="flex justify-between items-center text-sm"
											>
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-4 w-10" />
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>👥 Reader Demographics</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
									Age Groups
								</h4>
								<div className="space-y-2">
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											18-24
										</span>
										<span className="font-medium">
											{readerData?.demographics?.ageGroups?.["18-24"] || "32"}%
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											25-34
										</span>
										<span className="font-medium">
											{readerData?.demographics?.ageGroups?.["25-34"] || "45"}%
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											35+
										</span>
										<span className="font-medium">
											{readerData?.demographics?.ageGroups?.["35+"] || "23"}%
										</span>
									</div>
								</div>
							</div>

							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
									Reading Time
								</h4>
								<div className="space-y-2">
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											Peak Hours
										</span>
										<span className="font-medium">
											{readerData?.readingTime?.peakHours || "7-9 PM"}
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											Avg Session
										</span>
										<span className="font-medium">
											{readerData?.readingTime?.avgSession || "12"} min
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											Return Rate
										</span>
										<span className="font-medium">
											{readerData?.readingTime?.returnRate || "76"}%
										</span>
									</div>
								</div>
							</div>

							<div>
								<h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
									Top Locations
								</h4>
								<div className="space-y-2">
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											United States
										</span>
										<span className="font-medium">
											{readerData?.demographics?.locations?.us || "48"}%
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											United Kingdom
										</span>
										<span className="font-medium">
											{readerData?.demographics?.locations?.uk || "22"}%
										</span>
									</div>
									<div className="flex justify-between items-center text-sm">
										<span className="text-gray-600 dark:text-gray-400">
											Canada
										</span>
										<span className="font-medium">
											{readerData?.demographics?.locations?.ca || "18"}%
										</span>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Scene Analytics Section */}
			<div className="space-y-6" id="scenes">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<span>📊</span>
						Scene Performance
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mt-1">
						Detailed view tracking for each scene in your stories
					</p>
				</div>

				{/* Scene Performance and Format Distribution */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2">
						<ScenePerformanceTable storyId={storyId} />
					</div>
					<div>
						<FormatDistributionCard storyId={storyId} />
					</div>
				</div>
			</div>
		</div>
	);
}
