/**
 * Scene Summaries Generator
 *
 * Generates scene summaries using the Adversity-Triumph Engine.
 * This is the sixth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { SceneSummaryJsonSchema } from "./json-schemas.generated";
import type {
	CyclePhase,
	GenerateSceneSummariesParams,
	GenerateSceneSummariesResult,
} from "./types";
import type { Scene } from "./zod-schemas.generated";

/**
 * Generate scene summaries for all chapters
 *
 * @param params - Scene summaries generation parameters
 * @returns Scene summaries data (caller responsible for database save)
 */
export async function generateSceneSummaries(
	params: GenerateSceneSummariesParams,
): Promise<GenerateSceneSummariesResult> {
	const startTime = Date.now();
	const { chapters, settings, scenesPerChapter, onProgress } = params;

	const scenes: Scene[] = [];
	let sceneIndex = 0;

	for (const chapter of chapters) {
		for (let i = 0; i < scenesPerChapter; i++) {
			sceneIndex++;

			// Report progress
			if (onProgress) {
				onProgress(sceneIndex, chapters.length * scenesPerChapter);
			}

			// Determine cycle phase
			const cyclePhases: CyclePhase[] = [
				"setup",
				"confrontation",
				"virtue",
				"consequence",
				"transition",
			];
			const cyclePhase = cyclePhases[Math.min(i, cyclePhases.length - 1)];

			// Build settings string
			const settingsStr = settings
				.map((s, idx) => `${idx + 1}. ${s.name}: ${s.description}`)
				.join("\n");

			// Generate scene summary using template
			const response = await textGenerationClient.generateWithTemplate(
				"scene_summary",
				{
					sceneNumber: String(i + 1),
					sceneCount: String(scenesPerChapter),
					chapterTitle: chapter.title,
					chapterSummary: chapter.summary,
					cyclePhase,
					settings: settingsStr,
				},
				{
					temperature: 0.8,
					maxTokens: 8192,
					responseFormat: "json",
					responseSchema: SceneSummaryJsonSchema,
				},
			);

			const sceneData = JSON.parse(response.text);
			scenes.push(sceneData);

			console.log(
				`[scene-summaries-generator] Generated scene summary ${sceneIndex}/${chapters.length * scenesPerChapter}:`,
				{
					title: sceneData.title,
					cyclePhase: sceneData.cyclePhase,
				},
			);
		}
	}

	console.log("[scene-summaries-generator] All scene summaries generated:", {
		count: scenes.length,
		generationTime: Date.now() - startTime,
	});

	return {
		scenes,
		metadata: {
			totalGenerated: scenes.length,
			generationTime: Date.now() - startTime,
		},
	};
}
