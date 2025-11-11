"use client";

import {
	BookOpen,
	FileIcon,
	FileText,
	MapPin,
	ScrollText,
	Users,
} from "lucide-react";
import { useState } from "react";
import { type TreeDataItem, TreeView } from "@/components/ui/tree-view";
import { BeautifulJSONDisplay } from "../studio/BeautifulJSONDisplay";
import { useStoryCreation } from "./StoryCreationContext";

export function JsonDataSidebar() {
	const { jsonData } = useStoryCreation();
	const [activeTab, setActiveTab] = useState("story");
	const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

	// Parse JSON data safely
	const parseJSONSafely = (data?: string) => {
		if (!data || !data.trim()) return null;
		try {
			return JSON.parse(data);
		} catch {
			return null;
		}
	};

	const tabs = [
		{ id: "story", label: "Story", data: jsonData.storyJson, icon: FileText },
		{ id: "parts", label: "Parts", data: jsonData.partsJson, icon: BookOpen },
		{
			id: "characters",
			label: "Characters",
			data: jsonData.charactersJson,
			icon: Users,
		},
		{ id: "places", label: "Places", data: jsonData.placesJson, icon: MapPin },
		{
			id: "chapters",
			label: "Chapters",
			data: jsonData.chaptersJson,
			icon: ScrollText,
		},
		{
			id: "scenes",
			label: "Scenes",
			data: jsonData.scenesJson,
			icon: FileIcon,
		},
	];

	const hasAnyData = Object.values(jsonData).some(
		(data) => data && data.trim().length > 0,
	);
	const activeTabData = tabs.find((tab) => tab.id === activeTab);
	const parsedData = parseJSONSafely(activeTabData?.data);

	// Build tree data for arrays
	const buildTreeData = (data: any, tabId: string): TreeDataItem[] | null => {
		if (!data) return null;

		if (tabId === "story") {
			// Story is a single object, not an array
			return null;
		}

		if (Array.isArray(data)) {
			return data.map((item, index) => {
				let name = "";
				let id = "";

				switch (tabId) {
					case "parts":
						name = item.part_title || `Part ${index + 1}`;
						id = item.part_id || `part-${index}`;
						break;
					case "characters":
						name = item.name || item.character_name || `Character ${index + 1}`;
						id = item.character_id || `character-${index}`;
						break;
					case "places":
						name = item.name || item.setting_name || `Setting ${index + 1}`;
						id = item.setting_id || `setting-${index}`;
						break;
					case "chapters":
						name = item.chapter_title || `Chapter ${index + 1}`;
						id = item.chapter_id || `chapter-${index}`;
						break;
					case "scenes":
						name = item.scene_title || `Scene ${index + 1}`;
						id = item.scene_id || `scene-${index}`;
						break;
					default:
						name = `Item ${index + 1}`;
						id = `item-${index}`;
				}

				return {
					id,
					name,
					data: item,
				};
			});
		}

		return null;
	};

	const treeData = buildTreeData(parsedData, activeTab);
	const selectedItem = treeData?.find((item) => item.id === selectedItemId);

	return (
		<div className="sticky top-8">
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
					Generated JSON Data
				</h3>

				{!hasAnyData ? (
					<div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 min-h-[400px] flex items-center justify-center">
						<div className="text-center text-gray-500 dark:text-gray-400">
							<div className="text-2xl mb-2">📝</div>
							<p>Waiting for story generation...</p>
						</div>
					</div>
				) : (
					<div>
						{/* Tabs */}
						<div className="flex flex-wrap gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const hasData = tab.data && tab.data.trim().length > 0;
								return (
									<button
										key={tab.id}
										onClick={() => {
											setActiveTab(tab.id);
											setSelectedItemId(undefined); // Reset selection when switching tabs
										}}
										className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
											activeTab === tab.id
												? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
												: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
										}`}
									>
										<Icon className="w-3 h-3" />
										{tab.label}
										{hasData && (
											<span className="ml-1 w-2 h-2 bg-green-500 rounded-full inline-block"></span>
										)}
									</button>
								);
							})}
						</div>

						{/* Content */}
						{treeData && treeData.length > 0 ? (
							<div>
								{/* Tree View for arrays */}
								<div className="mb-4 max-h-[200px] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-2">
									<TreeView
										data={treeData}
										initialSelectedItemId={selectedItemId}
										onSelectChange={(item) => setSelectedItemId(item?.id)}
										defaultLeafIcon={
											activeTab === "characters"
												? Users
												: activeTab === "places"
													? MapPin
													: activeTab === "chapters"
														? ScrollText
														: activeTab === "scenes"
															? FileIcon
															: FileText
										}
									/>
								</div>

								{/* Display selected item or first item */}
								<div className="mt-4">
									{selectedItem || treeData[0] ? (
										<BeautifulJSONDisplay
											title={selectedItem?.name || treeData[0].name}
											icon={
												activeTab === "characters"
													? "👤"
													: activeTab === "places"
														? "📍"
														: activeTab === "chapters"
															? "📖"
															: activeTab === "scenes"
																? "🎬"
																: activeTab === "parts"
																	? "📚"
																	: "📄"
											}
											data={(selectedItem?.data || treeData[0]?.data) as any}
										/>
									) : null}
								</div>
							</div>
						) : // Single object display (like story)
						parsedData ? (
							<BeautifulJSONDisplay
								title={activeTabData?.label || "Data"}
								icon={
									activeTab === "story"
										? "📖"
										: activeTab === "parts"
											? "📚"
											: "📄"
								}
								data={parsedData}
							/>
						) : (
							<div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 min-h-[400px] flex items-center justify-center">
								<div className="text-center text-gray-500 dark:text-gray-400">
									<p>No data generated yet...</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
