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

interface StoryEditorProps {
	storyId?: string;
	storyData?: StoryData;
	hasChanges?: boolean;
	onStoryUpdate?: (data: StoryData) => void;
	onSave?: (data: StoryData) => Promise<void>;
	onCancel?: () => void;
	onGenerate?: (data: StoryData) => Promise<void>;
}

export function StoryEditor({
	storyId,
	storyData: externalStoryData,
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

	const renderCharacters = () => (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					🎭 Characters
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					{Object.entries(storyData.chars).map(([name, char]) => (
						<div key={name} className="flex items-center gap-2 text-sm">
							<Badge variant="outline">{char.role}</Badge>
							<span className="font-medium">{name}:</span>
							<span>{char.arc}</span>
						</div>
					))}
				</div>
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
				{renderBasicInfo()}
				{renderUniversalPattern()}
				{renderCharacters()}
				{renderParts()}
			</div>

			{/* YAML Preview */}
			<Card>
				<CardHeader>
					<CardTitle>📄 YAML Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
						<code>
							{`story:
  title: "${storyData.title}"
  genre: "${storyData.genre}"
  words: ${storyData.words}
  question: "${storyData.question}"
  
  # Universal pattern
  goal: "${storyData.goal}"
  conflict: "${storyData.conflict}"
  outcome: "${storyData.outcome}"
  
  # Characters (${Object.keys(storyData.chars).length})
  chars:`}
							{Object.entries(storyData.chars)
								.map(
									([name, char]) =>
										`    ${name}: { role: "${char.role}", arc: "${char.arc}" }`,
								)
								.join("\n")}
							{`
  
  # Structure
  structure:
    type: "${storyData.structure.type}"
    parts: [${storyData.structure.parts.map((p) => `"${p}"`).join(", ")}]
    dist: [${storyData.structure.dist.join(", ")}]
  
  # Parts (${storyData.parts.length})
  parts:`}
							{storyData.parts
								.map(
									(part) =>
										`    - part: ${part.part}
      goal: "${part.goal}"
      conflict: "${part.conflict}"
      tension: "${part.tension}"`,
								)
								.join("\n")}
						</code>
					</pre>
				</CardContent>
			</Card>
		</div>
	);
}
