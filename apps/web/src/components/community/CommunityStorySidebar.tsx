"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SceneViewStats } from "@/components/community/SceneViewStats";
import {
	Badge,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

interface Character {
	id: string;
	name: string;
	role: string | null;
	archetype: string | null;
	summary: string | null;
	storyline: string | null;
	personality: {
		traits?: string[];
		myers_briggs?: string;
		enneagram?: string;
	} | null;
	backstory: Record<string, string> | null;
	motivations: {
		primary?: string;
		secondary?: string;
		fear?: string;
	} | null;
	physicalDescription: Record<string, unknown> | null;
	imageUrl: string | null;
	isMain: boolean | null;
}

interface Setting {
	id: string;
	name: string;
	summary: string | null;
	mood: string | null;
	sensory: Record<string, string[]> | null;
	visualStyle: string | null;
	architecturalStyle: string | null;
	colorPalette: string[] | null;
	imageUrl: string | null;
}

interface CommunityStorySidebarProps {
	currentStoryId: string;
	characters: Character[];
	settings: Setting[];
}

export function CommunityStorySidebar({
	currentStoryId,
	characters,
	settings,
}: CommunityStorySidebarProps) {
	const [expandedCharacter, setExpandedCharacter] = useState<string | null>(
		null,
	);
	const [expandedSetting, setExpandedSetting] = useState<string | null>(null);

	const toggleCharacter = (id: string) => {
		setExpandedCharacter(expandedCharacter === id ? null : id);
	};

	const toggleSetting = (id: string) => {
		setExpandedSetting(expandedSetting === id ? null : id);
	};

	return (
		<div className="space-y-4">
			{/* Back to Community Hub */}
			<Card>
				<CardContent className="p-4">
					<Link
						href="/community"
						className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors"
					>
						<span>←</span>
						<span>Community Hub</span>
					</Link>
				</CardContent>
			</Card>

			{/* Characters Section */}
			{characters.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center gap-2">
							<span>👥</span>
							Characters ({characters.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-0 space-y-3">
						{characters.map((character) => {
							const isExpanded = expandedCharacter === character.id;

							return (
								<div
									key={character.id}
									onClick={() => toggleCharacter(character.id)}
									className={`
                    cursor-pointer rounded-lg overflow-hidden transition-all duration-300
                    ${
											isExpanded
												? "ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg"
												: "hover:bg-gray-50 dark:hover:bg-gray-800/50"
										}
                  `}
								>
									{/* Collapsed View */}
									{!isExpanded && (
										<div className="flex gap-3 p-2">
											{/* Character Image - 16:9 aspect ratio */}
											<div className="relative w-24 h-[54px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
												{character.imageUrl ? (
													<Image
														src={character.imageUrl}
														alt={character.name}
														fill
														className="object-cover"
														sizes="96px"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-2xl">
														👤
													</div>
												)}
											</div>

											{/* Character Info */}
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-1 mb-1">
													<h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
														{character.name}
													</h4>
													{character.isMain && (
														<Badge
															variant="default"
															className="text-xs px-1 py-0"
														>
															Main
														</Badge>
													)}
												</div>
												{character.role && (
													<p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
														{character.role}
													</p>
												)}
												{character.summary && (
													<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
														{character.summary}
													</p>
												)}
											</div>
										</div>
									)}

									{/* Expanded View */}
									{isExpanded && (
										<div className="animate-in fade-in duration-300">
											{/* Character Image - Full Width with 16:9 aspect ratio */}
											{character.imageUrl && (
												<div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
													<Image
														src={character.imageUrl}
														alt={character.name}
														fill
														className="object-cover"
														sizes="320px"
													/>
													<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
													<div className="absolute bottom-3 left-3 right-3">
														<div className="flex items-center gap-2 mb-1">
															<h3 className="text-lg font-bold text-white">
																{character.name}
															</h3>
															{character.isMain && (
																<Badge variant="default" className="text-xs">
																	Main Character
																</Badge>
															)}
														</div>
														{character.role && (
															<p className="text-sm text-blue-300 font-medium">
																{character.role}
															</p>
														)}
													</div>
												</div>
											)}

											{/* Character Details */}
											<div className="p-4 space-y-3 bg-white dark:bg-gray-800">
												{/* Archetype */}
												{character.archetype && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Archetype
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100">
															{character.archetype}
														</p>
													</div>
												)}

												{/* Summary */}
												{character.summary && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Summary
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
															{character.summary}
														</p>
													</div>
												)}

												{/* Storyline */}
												{character.storyline && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Storyline
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
															{character.storyline}
														</p>
													</div>
												)}

												{/* Personality */}
												{character.personality && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Personality
														</h5>
														<div className="space-y-2">
															{character.personality.traits &&
																character.personality.traits.length > 0 && (
																	<div className="flex flex-wrap gap-1">
																		{character.personality.traits.map(
																			(trait, idx) => (
																				<span
																					key={idx}
																					className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
																				>
																					{trait}
																				</span>
																			),
																		)}
																	</div>
																)}
															<div className="flex gap-2 text-xs">
																{character.personality.myers_briggs && (
																	<span className="text-gray-600 dark:text-gray-400">
																		MBTI:{" "}
																		<span className="font-semibold text-gray-900 dark:text-gray-100">
																			{character.personality.myers_briggs}
																		</span>
																	</span>
																)}
																{character.personality.enneagram && (
																	<span className="text-gray-600 dark:text-gray-400">
																		Enneagram:{" "}
																		<span className="font-semibold text-gray-900 dark:text-gray-100">
																			{character.personality.enneagram}
																		</span>
																	</span>
																)}
															</div>
														</div>
													</div>
												)}

												{/* Motivations */}
												{character.motivations && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Motivations
														</h5>
														<div className="space-y-1 text-sm">
															{character.motivations.primary && (
																<p className="text-gray-900 dark:text-gray-100">
																	<span className="font-semibold text-green-600 dark:text-green-400">
																		Primary:
																	</span>{" "}
																	{character.motivations.primary}
																</p>
															)}
															{character.motivations.secondary && (
																<p className="text-gray-900 dark:text-gray-100">
																	<span className="font-semibold text-blue-600 dark:text-blue-400">
																		Secondary:
																	</span>{" "}
																	{character.motivations.secondary}
																</p>
															)}
															{character.motivations.fear && (
																<p className="text-gray-900 dark:text-gray-100">
																	<span className="font-semibold text-red-600 dark:text-red-400">
																		Fear:
																	</span>{" "}
																	{character.motivations.fear}
																</p>
															)}
														</div>
													</div>
												)}

												{/* Backstory */}
												{character.backstory && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Backstory
														</h5>
														<div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
															{typeof character.backstory === "string" ? (
																<p>{character.backstory}</p>
															) : typeof character.backstory === "object" &&
																Object.keys(character.backstory).length > 0 ? (
																<div className="space-y-2">
																	{Object.values(character.backstory).map(
																		(value, index) =>
																			typeof value === "string" &&
																			value.trim() && (
																				<p key={index}>{value}</p>
																			),
																	)}
																</div>
															) : null}
														</div>
													</div>
												)}

												{/* Click to collapse hint */}
												<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
													<p className="text-xs text-center text-gray-500 dark:text-gray-400">
														Click to collapse
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</CardContent>
				</Card>
			)}

			{/* Settings Section */}
			{settings.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm flex items-center gap-2">
							<span>🏞️</span>
							Settings ({settings.length})
						</CardTitle>
					</CardHeader>
					<CardContent className="pt-0 space-y-3">
						{settings.map((setting) => {
							const isExpanded = expandedSetting === setting.id;

							return (
								<div
									key={setting.id}
									onClick={() => toggleSetting(setting.id)}
									className={`
                    cursor-pointer rounded-lg overflow-hidden transition-all duration-300
                    ${
											isExpanded
												? "ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg"
												: "hover:ring-2 hover:ring-blue-400 dark:hover:ring-blue-500"
										}
                  `}
								>
									{/* Collapsed View */}
									{!isExpanded && (
										<div className="flex gap-3 p-2">
											{/* Setting Image - 16:9 aspect ratio */}
											<div className="relative w-24 h-[54px] flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
												{setting.imageUrl ? (
													<Image
														src={setting.imageUrl}
														alt={setting.name}
														fill
														className="object-cover"
														sizes="96px"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-2xl">
														🏞️
													</div>
												)}
											</div>

											{/* Setting Info */}
											<div className="flex-1 min-w-0">
												<h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">
													{setting.name}
												</h4>
												{setting.mood && (
													<p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
														{setting.mood}
													</p>
												)}
												{setting.summary && (
													<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
														{setting.summary}
													</p>
												)}
											</div>
										</div>
									)}

									{/* Expanded View */}
									{isExpanded && (
										<div className="animate-in fade-in duration-300">
											{/* Setting Image - Full Width with 16:9 aspect ratio */}
											{setting.imageUrl && (
												<div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-800">
													<Image
														src={setting.imageUrl}
														alt={setting.name}
														fill
														className="object-cover"
														sizes="320px"
													/>
													<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
													<div className="absolute bottom-3 left-3 right-3">
														<h3 className="text-lg font-bold text-white mb-1">
															{setting.name}
														</h3>
														{setting.mood && (
															<p className="text-sm text-purple-300 font-medium">
																{setting.mood}
															</p>
														)}
													</div>
												</div>
											)}

											{/* Setting Details */}
											<div className="p-4 space-y-3 bg-white dark:bg-gray-800">
												{/* Summary */}
												{setting.summary && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Summary
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
															{setting.summary}
														</p>
													</div>
												)}

												{/* Visual Style */}
												{setting.visualStyle && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Visual Style
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100">
															{setting.visualStyle}
														</p>
													</div>
												)}

												{/* Architectural Style */}
												{setting.architecturalStyle && (
													<div>
														<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
															Architecture
														</h5>
														<p className="text-sm text-gray-900 dark:text-gray-100">
															{setting.architecturalStyle}
														</p>
													</div>
												)}

												{/* Color Palette */}
												{setting.colorPalette &&
													setting.colorPalette.length > 0 && (
														<div>
															<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
																Color Palette
															</h5>
															<div className="flex flex-wrap gap-2">
																{setting.colorPalette.map((color, idx) => (
																	<div
																		key={idx}
																		className="flex items-center gap-2"
																	>
																		<div
																			className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
																			style={{ backgroundColor: color }}
																		/>
																		<span className="text-xs text-gray-600 dark:text-gray-400">
																			{color}
																		</span>
																	</div>
																))}
															</div>
														</div>
													)}

												{/* Sensory Details */}
												{setting.sensory &&
													Object.keys(setting.sensory).length > 0 && (
														<div>
															<h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
																Sensory Details
															</h5>
															<div className="space-y-2">
																{Object.entries(setting.sensory).map(
																	([sense, details]) => (
																		<div key={sense}>
																			<p className="text-xs font-semibold text-gray-700 dark:text-gray-300 capitalize mb-1">
																				{sense}:
																			</p>
																			<div className="flex flex-wrap gap-1">
																				{details.map((detail, idx) => (
																					<span
																						key={idx}
																						className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300"
																					>
																						{detail}
																					</span>
																				))}
																			</div>
																		</div>
																	),
																)}
															</div>
														</div>
													)}

												{/* Click to collapse hint */}
												<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
													<p className="text-xs text-center text-gray-500 dark:text-gray-400">
														Click to collapse
													</p>
												</div>
											</div>
										</div>
									)}
								</div>
							);
						})}
					</CardContent>
				</Card>
			)}

			{/* Scene View Stats */}
			<SceneViewStats storyId={currentStoryId} />

			{/* Community Guidelines */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center gap-2">
						<span>📋</span>
						Guidelines
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
						<div className="flex items-start gap-2">
							<span>✅</span>
							<span>Be respectful to all community members</span>
						</div>
						<div className="flex items-start gap-2">
							<span>🚫</span>
							<span>No spoilers without proper tags</span>
						</div>
						<div className="flex items-start gap-2">
							<span>💡</span>
							<span>Share theories and discussions</span>
						</div>
						<div className="flex items-start gap-2">
							<span>🎨</span>
							<span>Fan art and creative content welcome</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
