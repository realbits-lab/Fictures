"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui";

interface SceneWritingProps {
	initialContent?: string;
	sceneId?: string | number;
	sceneNumber?: number;
	onSave: (data: { content: string; wordCount: number }) => void;
	onWrite?: (data: any) => void;
	disabled?: boolean;
}

export function SceneWriting({
	initialContent = "",
	sceneId,
	sceneNumber,
	onSave,
	onWrite,
	disabled = false,
}: SceneWritingProps) {
	const [sceneContent, setSceneContent] = useState(initialContent);
	const [isSaving, setIsSaving] = useState(false);
	const [isWriting, setIsWriting] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// Calculate word count
	const wordCount = sceneContent
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;

	// Define handleAutoSave before using it in useEffect
	const handleAutoSave = useCallback(async () => {
		if (disabled) return;

		setIsSaving(true);
		try {
			await onSave({
				content: sceneContent,
				wordCount,
			});
			setLastSaved(new Date());
		} catch (error) {
			console.error("Auto-save failed:", error);
		} finally {
			setIsSaving(false);
		}
	}, [disabled, onSave, sceneContent, wordCount]);

	// Auto-save functionality
	useEffect(() => {
		const autoSaveTimer = setTimeout(() => {
			if (sceneContent !== initialContent && sceneContent.trim() !== "") {
				handleAutoSave();
			}
		}, 5000); // Auto-save after 5 seconds of inactivity

		return () => clearTimeout(autoSaveTimer);
	}, [sceneContent, initialContent, handleAutoSave]);

	// Update content when initialContent changes
	useEffect(() => {
		setSceneContent(initialContent);
	}, [initialContent]);

	const handleManualSave = async () => {
		if (disabled) return;

		setIsSaving(true);
		try {
			await onSave({
				content: sceneContent,
				wordCount: wordCount,
			});
			setLastSaved(new Date());
		} catch (error) {
			console.error("Save failed:", error);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAIWrite = async () => {
		if (disabled || !onWrite) return;

		setIsWriting(true);
		try {
			await onWrite({
				content: sceneContent,
				wordCount: wordCount,
				sceneId: sceneId,
				sceneNumber: sceneNumber,
			});
		} catch (error) {
			console.error("AI writing failed:", error);
		} finally {
			setIsWriting(false);
		}
	};

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	return (
		<div className="h-full flex flex-col space-y-4">
			{/* Writing Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="text-xl font-bold">✍️ Scene Writing</h2>
					<Badge variant="default" className="flex items-center gap-1"></Badge>
					{lastSaved && (
						<span className="text-xs text-[rgb(var(--color-muted-foreground))]">
							Last saved: {formatTime(lastSaved)}
						</span>
					)}
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={handleManualSave}
						disabled={isSaving || disabled}
						size="sm"
					>
						{isSaving ? "💾 Saving..." : "💾 Save"}
					</Button>
					{onWrite && (
						<Button
							onClick={handleAIWrite}
							disabled={isWriting || disabled}
							size="sm"
						>
							{isWriting ? "✍️ Writing..." : "✍️ AI Write"}
						</Button>
					)}
				</div>
			</div>

			{/* Main Writing Area */}
			<Card className="flex-1 h-full">
				<CardContent className="p-6 h-full">
					<div className="h-full">
						<div
							contentEditable={!disabled}
							onInput={(e) =>
								setSceneContent(e.currentTarget.textContent || "")
							}
							className="w-full h-full min-h-[600px] p-4 border border-[rgb(var(--color-border))] rounded-[var(--radius)] font-serif text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-ring))] focus:border-transparent overflow-y-auto bg-white dark:bg-gray-900"
							style={{ whiteSpace: "pre-wrap" }}
							suppressContentEditableWarning={true}
							data-placeholder="Write your scene here using the MRU (Motivation-Reaction Unit) structure..."
						>
							{sceneContent}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Status Indicators */}
			{(isSaving || isWriting) && (
				<Card className="border-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary)/10%)]">
					<CardContent className="p-3">
						<div className="flex items-center gap-2 text-sm text-[rgb(var(--color-primary))]">
							<div className="w-4 h-4 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
							{isSaving && <span>Auto-saving scene content...</span>}
							{isWriting && <span>AI is generating scene content...</span>}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
