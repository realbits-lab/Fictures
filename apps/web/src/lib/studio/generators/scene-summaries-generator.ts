/**
 * Scene Summaries Generator
 *
 * Generates scene summaries using the Adversity-Triumph Engine.
 * This is the sixth phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { SceneSummaryJsonSchema } from "@/lib/novels/json-schemas";
import { SCENE_SUMMARY_PROMPT } from "@/lib/novels/system-prompts";
import type { CyclePhase, Scene } from "@/lib/novels/types";
import type {
	GenerateSceneSummariesParams,
	GenerateSceneSummariesResult,
} from "./types";

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

			// Build scene summary prompt
			const sceneSummaryPrompt = `${SCENE_SUMMARY_PROMPT}

Generate scene ${i + 1} of ${scenesPerChapter} for this chapter.

Chapter Context:
Title: ${chapter.title}
Summary: ${chapter.summary}
Cycle Phase: ${cyclePhase}

Setting Options:
${settings.map((s, idx) => `${idx + 1}. ${s.name}: ${s.description}`).join("\n")}

Return as JSON:
{
  "title": "Scene ${i + 1}: ...",
  "summary": "...",
  "cyclePhase": "${cyclePhase}",
  "emotionalBeat": "...",
  "dialogueVsDescription": "balanced",
  "suggestedLength": "medium",
  "characterFocus": ["${chapter.characterId}"],
  "settingId": "${settings[i % settings.length].id}",
  "sensoryAnchors": ["...", "...", "..."]
}`;

			// Generate scene summary
			const response = await textGenerationClient.generate({
				prompt: sceneSummaryPrompt,
				temperature: 0.8,
				maxTokens: 8192,
				responseFormat: "json",
				responseSchema: SceneSummaryJsonSchema,
			});

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
