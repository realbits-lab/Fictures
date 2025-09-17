"use client";

import React, { useState, useEffect } from "react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	Button,
	Progress,
	Badge,
} from "@/components/ui";
import yaml from "js-yaml";

// Story YAML interface based on story-specification.md
interface StoryData {
	title: string;
	genre: string;
	words: number;
	question: string;
	goal: string;
	conflict: string;
	outcome: string;
	chars: Record<
		string,
		{
			role: string;
			arc: string;
			flaw?: string;
			goal?: string;
			secret?: string;
		}
	>;
	themes: string[];
	structure: {
		type: string;
		parts: string[];
		dist: number[];
	};
	setting: {
		primary: string[];
		secondary: string[];
	};
	parts: Array<{
		part: number;
		goal: string;
		conflict: string;
		outcome: string;
		tension: string;
	}>;
	serial: {
		schedule: string;
		duration: string;
		chapter_words: number;
		breaks: string[];
		buffer: string;
	};
	hooks: {
		overarching: string[];
		mysteries: string[];
		part_endings: string[];
	};
}

interface Character {
	id: string;
	name: string;
	role?: string;
	description?: string;
	personality?: string;
	background?: string;
	appearance?: string;
	motivations?: string;
	flaws?: string;
	strengths?: string;
	relationships?: string;
	arc?: string;
	dialogue_style?: string;
	secrets?: string;
	goals?: string;
	conflicts?: string;
	imageUrl?: string;
	isMain?: boolean;
	createdAt: string;
	updatedAt: string;
}

interface Place {
	id: string;
	name: string;
	storyId: string;
	isMain?: boolean;
	content?: string;
	createdAt: string;
	updatedAt: string;
}

interface StoryEditorProps {
	storyId?: string;
	storyData?: StoryData;
	characters?: Character[];
	places?: Place[];
	hasChanges?: boolean;
	onStoryUpdate?: (data: StoryData) => void;
	onSave?: (data: StoryData) => Promise<void>;
	onCancel?: () => void;
	onGenerate?: (data: StoryData) => Promise<void>;
}

export function StoryEditor({
	storyId,
	storyData: externalStoryData,
	characters,
	places,
	hasChanges: externalHasChanges,
	onStoryUpdate,
	onSave,
	onCancel,
	onGenerate,
}: StoryEditorProps) {
	const [originalStoryData, setOriginalStoryData] = useState<StoryData>(
		externalStoryData || {
			title: "",
			genre: "urban_fantasy",
			words: 80000,
			question: "",
			goal: "",
			conflict: "",
			outcome: "",
			chars: {
				protagonist: {
					role: "protag",
					arc: "denial→acceptance",
					flaw: "overprotective",
				},
			},
			themes: ["responsibility_for_power", "love_vs_control"],
			structure: {
				type: "3_part",
				parts: ["setup", "confrontation", "resolution"],
				dist: [25, 50, 25],
			},
			setting: {
				primary: ["main_location"],
				secondary: ["secondary_location"],
			},
			parts: [
				{
					part: 1,
					goal: "Protagonist accepts reality",
					conflict: "Denial vs evidence",
					outcome: "Reluctant commitment",
					tension: "denial vs acceptance",
				},
				{
					part: 2,
					goal: "Master new abilities",
					conflict: "Growing power vs corruption risk",
					outcome: "Power embrace despite dangers",
					tension: "power vs integrity",
				},
				{
					part: 3,
					goal: "Final confrontation",
					conflict: "Ultimate power vs moral cost",
					outcome: "Victory through growth",
					tension: "salvation vs corruption",
				},
			],
			serial: {
				schedule: "weekly",
				duration: "18_months",
				chapter_words: 4000,
				breaks: ["part1_end", "part2_end"],
				buffer: "4_chapters_ahead",
			},
			hooks: {
				overarching: ["main_mystery", "protagonist_fate"],
				mysteries: ["hidden_truth", "character_secret"],
				part_endings: ["revelation", "cliffhanger"],
			},
		},
	);
	const [storyData, setStoryData] = useState<StoryData>(originalStoryData);

	// Use external story data when available
	useEffect(() => {
		if (externalStoryData) {
			setOriginalStoryData(externalStoryData);
			setStoryData(externalStoryData);
		}
	}, [externalStoryData]);

	const [isEditing, setIsEditing] = useState(false);
	const [editingSection, setEditingSection] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	// State for collapsible sections
	const [charactersCollapsed, setCharactersCollapsed] = useState(true);
	const [placesCollapsed, setPlacesCollapsed] = useState(true);
	const [collapsedPlaceCards, setCollapsedPlaceCards] = useState<Record<string, boolean>>({});
	const [collapsedCharacterCards, setCollapsedCharacterCards] = useState<Record<string, boolean>>({});

	// Helper function to toggle individual place card collapse
	const togglePlaceCard = (placeId: string) => {
		setCollapsedPlaceCards(prev => ({
			...prev,
			[placeId]: !prev[placeId]
		}));
	};

	// Helper function to toggle individual character card collapse
	const toggleCharacterCard = (characterId: string) => {
		setCollapsedCharacterCards(prev => ({
			...prev,
			[characterId]: !prev[characterId]
		}));
	};

	const handleSave = async () => {
		if (!onSave || !externalHasChanges) return;
		setIsSaving(true);
		try {
			await onSave(storyData);
		} catch (error) {
			console.error("Save failed:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancel = () => {
		if (onCancel) {
			onCancel();
		}
	};

	const handleGenerate = async () => {
		if (!onGenerate) return;
		setIsGenerating(true);
		try {
			await onGenerate(storyData);
		} catch (error) {
			console.error("Generation failed:", error);
		} finally {
			setIsGenerating(false);
		}
	};

	const updateField = (path: string[], value: any) => {
		setStoryData((prev) => {
			const newData = { ...prev };
			let current: any = newData;

			for (let i = 0; i < path.length - 1; i++) {
				if (!current[path[i]]) {
					current[path[i]] = {};
				}
				current = current[path[i]];
			}

			current[path[path.length - 1]] = value;
			return newData;
		});
	};

	const handleStoryUpdate = (updatedData: StoryData) => {
		setStoryData(updatedData);
		if (onStoryUpdate) {
			onStoryUpdate(updatedData);
		}
	};

	const renderBasicInfo = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					📖 Story Foundation
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2 text-sm">
					<div>
						<strong>Title:</strong> {storyData.title || "Untitled Story"}
					</div>
					<div>
						<strong>Genre:</strong>{" "}
						<Badge variant="secondary">{storyData.genre}</Badge>
					</div>
					<div>
						<strong>Target Words:</strong> {storyData.words.toLocaleString()}
					</div>
					<div>
						<strong>Question:</strong> {storyData.question || "Not set"}
					</div>
				</div>
			</CardContent>
		</Card>
	);

	const renderUniversalPattern = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					🎯 Universal Pattern (Goal → Conflict → Outcome)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2 text-sm">
					<div>
						<strong>Goal:</strong> {storyData.goal || "Not set"}
					</div>
					<div>
						<strong>Conflict:</strong> {storyData.conflict || "Not set"}
					</div>
					<div>
						<strong>Outcome:</strong> {storyData.outcome || "Not set"}
					</div>
				</div>
			</CardContent>
		</Card>
	);

	const renderCollapsibleCharacters = () => {
		const hasDatabaseCharacters = characters && characters.length > 0;

		return (
			<Card>
				<CardHeader
					className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
					onClick={() => setCharactersCollapsed(!charactersCollapsed)}
				>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							🎭 Characters
							{hasDatabaseCharacters && (
								<Badge variant="secondary" className="text-xs">
									{characters?.length || 0}
								</Badge>
							)}
						</span>
						<span className="text-sm">
							{charactersCollapsed ? "▶" : "▼"}
						</span>
					</CardTitle>
				</CardHeader>
				{!charactersCollapsed && (
					<CardContent className="space-y-4">
						{hasDatabaseCharacters ? (
							<div className="space-y-4">
								{characters!.map((character) => {
									const isCharacterCollapsed = collapsedCharacterCards[character.id] ?? true;
									return (
										<div key={character.id} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
											<div
												className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
												onClick={() => toggleCharacterCard(character.id)}
											>
												<div className="flex items-center gap-2">
													<span className="font-bold text-lg">{character.name}</span>
													{character.role && (
														<Badge variant="secondary">{character.role}</Badge>
													)}
													{character.isMain && (
														<Badge variant="default">Main Character</Badge>
													)}
												</div>
												<span className="text-sm">
													{isCharacterCollapsed ? "▶" : "▼"}
												</span>
											</div>

											{!isCharacterCollapsed && (
												<div className="p-4 pt-0 space-y-4">
													{/* Basic Info Section */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
														{character.description && (
															<div className="md:col-span-2">
																<strong className="text-gray-600 dark:text-gray-400">Description:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.description}</p>
															</div>
														)}
														{character.personality && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Personality:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.personality}</p>
															</div>
														)}
														{character.background && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Background:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.background}</p>
															</div>
														)}
														{character.appearance && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Appearance:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.appearance}</p>
															</div>
														)}
														{character.motivations && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Motivations:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.motivations}</p>
															</div>
														)}
													</div>

													{/* Character Traits Section */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t pt-3">
														{character.strengths && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Strengths:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.strengths}</p>
															</div>
														)}
														{character.flaws && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Flaws:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.flaws}</p>
															</div>
														)}
														{character.goals && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Goals:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.goals}</p>
															</div>
														)}
														{character.conflicts && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Conflicts:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.conflicts}</p>
															</div>
														)}
													</div>

													{/* Story Development Section */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t pt-3">
														{character.arc && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Character Arc:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.arc}</p>
															</div>
														)}
														{character.relationships && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Relationships:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.relationships}</p>
															</div>
														)}
														{character.dialogue_style && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Dialogue Style:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.dialogue_style}</p>
															</div>
														)}
														{character.secrets && (
															<div>
																<strong className="text-gray-600 dark:text-gray-400">Secrets:</strong>
																<p className="text-gray-700 dark:text-gray-300 mt-1">{character.secrets}</p>
															</div>
														)}
													</div>

													{/* Image Section */}
													{character.imageUrl && (
														<div className="border-t pt-3">
															<strong className="text-gray-600 dark:text-gray-400">Image:</strong>
															<img
																src={character.imageUrl}
																alt={character.name}
																className="mt-2 w-32 h-32 object-cover rounded-md"
															/>
														</div>
													)}

													{/* Timestamps */}
													<div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
														<div>Created: {new Date(character.createdAt).toLocaleDateString()}</div>
														<div>Updated: {new Date(character.updatedAt).toLocaleDateString()}</div>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center text-gray-500 dark:text-gray-400 py-4">
								<p>No characters have been created yet.</p>
								<p className="text-sm">Add characters to your story to see them here.</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>
		);
	};

	const renderCollapsiblePlaces = () => {
		const hasDatabasePlaces = places && places.length > 0;

		return (
			<Card>
				<CardHeader
					className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
					onClick={() => setPlacesCollapsed(!placesCollapsed)}
				>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							🏛️ Places & Settings
							{hasDatabasePlaces && (
								<Badge variant="secondary" className="text-xs">
									{places?.length || 0}
								</Badge>
							)}
						</span>
						<span className="text-sm">
							{placesCollapsed ? "▶" : "▼"}
						</span>
					</CardTitle>
				</CardHeader>
				{!placesCollapsed && (
					<CardContent className="space-y-4">
						{hasDatabasePlaces ? (
							<div className="space-y-4">
								{places!.map((place) => {
									const isPlaceCollapsed = collapsedPlaceCards[place.id] ?? true;
									return (
										<div key={place.id} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
											<div
												className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
												onClick={() => togglePlaceCard(place.id)}
											>
												<div className="flex items-center gap-2">
													<span className="font-bold text-lg">{place.name}</span>
													{place.isMain && (
														<Badge variant="default">Main Location</Badge>
													)}
												</div>
												<span className="text-sm">
													{isPlaceCollapsed ? "▶" : "▼"}
												</span>
											</div>

											{!isPlaceCollapsed && (
												<div className="p-4 pt-0 space-y-3">
													{place.content && (
														<div className="space-y-2">
															<div>
																<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Content:</span>
																<p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
																	{place.content}
																</p>
															</div>
														</div>
													)}

													<div className="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
														<div>Created: {new Date(place.createdAt).toLocaleDateString()}</div>
														<div>Updated: {new Date(place.updatedAt).toLocaleDateString()}</div>
													</div>
												</div>
											)}
										</div>
									);
								})}
							</div>
						) : (
							<div className="text-center text-gray-500 dark:text-gray-400 py-4">
								<p>No places have been created yet.</p>
								<p className="text-sm">Add places to your story to see them here.</p>
							</div>
						)}
					</CardContent>
				)}
			</Card>
		);
	};

	const renderDatabaseCharacters = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					👥 Character Database
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{characters && characters.length > 0 ? (
					<div className="space-y-4">
						{characters.map((character) => (
							<div key={character.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
								<div className="flex items-start gap-3 mb-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<span className="font-bold text-base">{character.name}</span>
											{character.role && (
												<Badge variant="secondary">{character.role}</Badge>
											)}
											{character.isMain && (
												<Badge variant="default">Main Character</Badge>
											)}
										</div>
										{character.description && (
											<p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
												<strong>Description:</strong> {character.description}
											</p>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
									{character.personality && (
										<div>
											<strong className="text-gray-600 dark:text-gray-400">Personality:</strong>
											<p className="text-gray-700 dark:text-gray-300 mt-1">{character.personality}</p>
										</div>
									)}
									{character.background && (
										<div>
											<strong className="text-gray-600 dark:text-gray-400">Background:</strong>
											<p className="text-gray-700 dark:text-gray-300 mt-1">{character.background}</p>
										</div>
									)}
									{character.appearance && (
										<div>
											<strong className="text-gray-600 dark:text-gray-400">Appearance:</strong>
											<p className="text-gray-700 dark:text-gray-300 mt-1">{character.appearance}</p>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						<p>No characters have been created yet.</p>
						<p className="text-sm mt-1">Characters will appear here when they are added to the database.</p>
					</div>
				)}
			</CardContent>
		</Card>
	);

	const renderParts = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					📚 Story Parts ({storyData.structure.type})
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{storyData.parts.map((part, index) => (
					<div key={part.part} className="border rounded p-3">
						<div className="flex items-center gap-2 mb-2">
							<Badge variant="secondary">Part {part.part}</Badge>
							<span className="text-sm font-medium">
								{storyData.structure.parts[index]} (
								{storyData.structure.dist[index]}%)
							</span>
						</div>
						<div className="text-sm space-y-1">
							<div>
								<strong>Goal:</strong> {part.goal}
							</div>
							<div>
								<strong>Conflict:</strong> {part.conflict}
							</div>
							<div>
								<strong>Tension:</strong> {part.tension}
							</div>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);

	return (
		<div className="space-y-6">
			{/* Story Editor Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold">📖 Story Development</h2>
					<p className="text-sm text-gray-600">
						Define the overall narrative structure and themes
					</p>
				</div>
				<div className="flex flex-col sm:flex-row gap-2">
					{externalHasChanges && (
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="lg"
								onClick={handleCancel}
								className="whitespace-nowrap min-w-fit px-6"
							>
								Cancel
							</Button>
							<Button
								size="lg"
								onClick={handleSave}
								disabled={isSaving}
								className="whitespace-nowrap min-w-fit px-6"
							>
								{isSaving ? "💾 Saving..." : "💾 Save Changes"}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Story Development Sections */}
			<div className="space-y-6">
				{renderCollapsibleCharacters()}
				{renderCollapsiblePlaces()}
				{renderBasicInfo()}
				{renderUniversalPattern()}
				{renderParts()}
			</div>

			{/* YAML Preview */}
			<Card>
				<CardHeader>
					<CardTitle>📄 YAML Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
						<code>
							{yaml.dump({ story: storyData }, { indent: 2 })}
						</code>
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
