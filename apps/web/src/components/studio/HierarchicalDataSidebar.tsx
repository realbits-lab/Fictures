"use client";

import type React from "react";
import { useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

// Simple SVG icon components
const ChevronRight = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M9 18l6-6-6-6" />
	</svg>
);

const ChevronDown = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M6 9l6 6 6-6" />
	</svg>
);

const BookOpen = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
		<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
	</svg>
);

const FileText = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<path d="M14 2v6h6" />
		<path d="M16 13H8" />
		<path d="M16 17H8" />
		<path d="M10 9H8" />
	</svg>
);

const Edit3 = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
	</svg>
);

const Camera = ({ size = 16 }: { size?: number }) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth={2}
	>
		<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
		<circle cx="12" cy="13" r="4" />
	</svg>
);

interface StoryData {
	title: string;
	genre: string;
	theme?: string;
	structure?: {
		type: string;
		parts: string[];
		dist: number[];
	};
	characters?: any[];
	settings?: any[];
}

interface PartData {
	title: string;
	theme?: string;
	characters?: any[];
	settings?: any[];
}

interface ChapterData {
	title: string;
	purpose?: string;
	hook?: string;
	characterFocus?: string;
	pov?: string;
	acts?: any;
}

interface SceneData {
	id: string;
	summary?: string;
	time?: string;
	place?: string;
	pov?: string;
	characters?: string[];
	goal?: string;
	obstacle?: string;
	outcome?: string;
	beats?: string[];
	shift?: string;
	leads_to?: string;
	image_prompt?: string;
}

interface HierarchicalDataSidebarProps {
	storyData?: StoryData;
	partData?: PartData;
	chapterData?: ChapterData;
	sceneData?: SceneData;
	currentLevel: "story" | "part" | "chapter" | "scene";
}

export function HierarchicalDataSidebar({
	storyData,
	partData,
	chapterData,
	sceneData,
	currentLevel,
}: HierarchicalDataSidebarProps) {
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(["story"]),
	);

	const toggleSection = (sectionId: string) => {
		const newExpanded = new Set(expandedSections);
		if (newExpanded.has(sectionId)) {
			newExpanded.delete(sectionId);
		} else {
			newExpanded.add(sectionId);
		}
		setExpandedSections(newExpanded);
	};

	const renderDataField = (
		key: string,
		value: any,
		level: number = 0,
	): React.ReactNode => {
		if (value === null || value === undefined) return null;

		const indent = level * 12;

		if (typeof value === "object" && !Array.isArray(value)) {
			return (
				<div key={key} style={{ marginLeft: `${indent}px` }} className="mb-2">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
						{key
							.replace(/([A-Z])/g, " $1")
							.replace(/^./, (str) => str.toUpperCase())}
						:
					</div>
					<div className="ml-2">
						{Object.entries(value).map(([subKey, subValue]) =>
							renderDataField(subKey, subValue, level + 1),
						)}
					</div>
				</div>
			);
		}

		if (Array.isArray(value)) {
			return (
				<div key={key} style={{ marginLeft: `${indent}px` }} className="mb-2">
					<div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
						{key
							.replace(/([A-Z])/g, " $1")
							.replace(/^./, (str) => str.toUpperCase())}
						:
					</div>
					<div className="ml-2">
						{value.map((item, index) => (
							<div
								key={index}
								className="text-xs text-gray-600 dark:text-gray-400 mb-1"
							>
								•{" "}
								{typeof item === "object" ? JSON.stringify(item) : String(item)}
							</div>
						))}
					</div>
				</div>
			);
		}

		return (
			<div key={key} style={{ marginLeft: `${indent}px` }} className="mb-2">
				<div className="text-xs">
					<span className="font-medium text-gray-700 dark:text-gray-300">
						{key
							.replace(/([A-Z])/g, " $1")
							.replace(/^./, (str) => str.toUpperCase())}
						:
					</span>
					<span className="ml-2 text-gray-600 dark:text-gray-400">
						{String(value)}
					</span>
				</div>
			</div>
		);
	};

	const sections = [
		{
			id: "story",
			title: "Story Data",
			icon: <BookOpen size={14} />,
			data: storyData,
			show: !!storyData && currentLevel === "scene",
			editable: false,
		},
		{
			id: "part",
			title: "Part Data",
			icon: <FileText size={14} />,
			data: partData,
			show: !!partData && currentLevel === "scene",
			editable: false,
		},
		{
			id: "chapter",
			title: "Chapter Data",
			icon: <Edit3 size={14} />,
			data: chapterData,
			show: !!chapterData && currentLevel === "scene",
			editable: false,
		},
		{
			id: "scene",
			title: "Scene Data",
			icon: <Camera size={14} />,
			data: sceneData,
			show: !!sceneData && currentLevel === "scene",
			editable: true,
		},
	];

	return (
		<Card className="h-fit">
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center gap-2">
					📊 Hierarchical Data
				</CardTitle>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="space-y-2 max-h-[calc(100vh-20rem)] overflow-y-auto">
					{sections.map((section) => {
						if (!section.show) return null;

						const isExpanded = expandedSections.has(section.id);

						return (
							<div key={section.id} className="border rounded-lg">
								<Button
									variant="ghost"
									className="w-full justify-between p-3 h-auto text-left"
									onClick={() => toggleSection(section.id)}
								>
									<div className="flex items-center gap-2">
										{section.icon}
										<span className="text-xs font-medium">{section.title}</span>
										<Badge variant="default" className="text-xs">
											{section.id === currentLevel ? "Current" : "Context"}
										</Badge>
										{section.editable && (
											<Badge variant="secondary" className="text-xs">
												Editable
											</Badge>
										)}
									</div>
									{isExpanded ? (
										<ChevronDown size={12} />
									) : (
										<ChevronRight size={12} />
									)}
								</Button>

								{isExpanded && section.data && (
									<div className="px-3 pb-3">
										<div
											className={`p-3 rounded-lg ${
												section.editable
													? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
													: "bg-gray-50 dark:bg-gray-800 opacity-75"
											}`}
										>
											{Object.entries(section.data).map(([key, value]) =>
												renderDataField(key, value),
											)}
											{!section.editable && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
													Read-only context data
												</div>
											)}
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
