/**
 * Chapters Generator
 *
 * Generates story chapters using the Adversity-Triumph Engine.
 * This is the fifth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { ChapterJsonSchema } from "@/lib/novels/json-schemas";
import { CHAPTERS_GENERATION_PROMPT } from "@/lib/novels/system-prompts";
import type { Chapter } from "@/lib/novels/types";
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

			// Build chapter prompt
			const chapterPrompt = `${CHAPTERS_GENERATION_PROMPT}

Generate Chapter ${chapterIndex} for ${part.title}.

Story Context:
Title: ${story.title}
Part: ${part.title}
Part Summary: ${part.summary}

Previous Chapter: ${chapters.length > 0 ? chapters[chapters.length - 1].summary : "None (this is the first chapter)"}

Return as JSON:
{
  "id": "chapter_${chapterIndex}",
  "partId": "${part.id}",
  "title": "Chapter ${chapterIndex}: ...",
  "summary": "...",
  "characterId": "${characters[0].id}",
  "arcPosition": "${i === 0 ? "beginning" : i === chaptersPerPart - 1 ? "climax" : "middle"}",
  "contributesToMacroArc": "...",
  "focusCharacters": ["${characters[0].id}"],
  "adversityType": "both",
  "virtueType": "courage",
  "seedsPlanted": [],
  "seedsResolved": [],
  "connectsToPreviousChapter": "${chapters.length > 0 ? "Previous chapter resolution creates this adversity" : "Story beginning"}",
  "createsNextAdversity": "..."
}`;

			// Generate chapter
			const response = await textGenerationClient.generate({
				prompt: chapterPrompt,
				temperature: 0.85,
				maxTokens: 8192,
				responseFormat: "json",
				responseSchema: ChapterJsonSchema,
			});

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
