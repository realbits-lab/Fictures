/**
 * Chapters Generator
 *
 * Generates story chapters using the Adversity-Triumph Engine.
 * This is the fifth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { ChapterJsonSchema } from "@/lib/novels/json-schemas";
import { textGenerationClient } from "./ai-client";
import type { Chapter } from "./ai-types";
import type { GenerateChaptersParams, GenerateChaptersResult } from "./types";

/**
 * Generate story chapters
 *
 * @param params - Chapters generation parameters
 * @returns Chapters data (caller responsible for database save)
 */
export async function generateChapters(
	params: GenerateChaptersParams,
): Promise<GenerateChaptersResult> {
	const startTime = Date.now();
	const { story, parts, characters, chaptersPerPart, onProgress } = params;

	const chapters: Chapter[] = [];
	let chapterIndex = 0;

	for (const part of parts) {
		for (let i = 0; i < chaptersPerPart; i++) {
			chapterIndex++;

			// Report progress
			if (onProgress) {
				onProgress(chapterIndex, parts.length * chaptersPerPart);
			}

			// Get character arc for this chapter (simplified - using first character)
			const focusCharacter = characters[0];
			const characterArc = part.characterArcs?.find(
				(arc) => arc.characterId === focusCharacter.id,
			);

			// Generate chapter using template
			const response = await textGenerationClient.generateWithTemplate(
				"chapter",
				{
					chapterNumber: String(chapterIndex),
					totalChapters: String(parts.length * chaptersPerPart),
					partTitle: part.title,
					storyTitle: story.title,
					storyGenre: story.genre,
					storySummary: story.summary,
					partSummary: part.summary,
					characterName: focusCharacter.name,
					characterFlaw: focusCharacter.internalFlaw || "unresolved fear",
					characterArc:
						characterArc?.macroAdversity?.internal || "personal growth",
					previousChapterContext:
						chapters.length > 0
							? chapters[chapters.length - 1].summary
							: "None (this is the first chapter)",
				},
				{
					temperature: 0.85,
					maxTokens: 8192,
					responseFormat: "json",
					responseSchema: ChapterJsonSchema,
				},
			);

			const chapterData = JSON.parse(response.text);
			chapters.push(chapterData);

			console.log(
				`[chapters-generator] Generated chapter ${chapterIndex}/${parts.length * chaptersPerPart}:`,
				{
					title: chapterData.title,
					partId: chapterData.partId,
				},
			);
		}
	}

	console.log("[chapters-generator] All chapters generated:", {
		count: chapters.length,
		generationTime: Date.now() - startTime,
	});

	return {
		chapters,
		metadata: {
			totalGenerated: chapters.length,
			generationTime: Date.now() - startTime,
		},
	};
}
