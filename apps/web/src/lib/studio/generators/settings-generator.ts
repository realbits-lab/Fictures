/**
 * Settings Generator
 *
 * Generates story settings using the Adversity-Triumph Engine.
 * This is the third phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "@/lib/novels/ai-client";
import { SettingJsonSchema } from "@/lib/novels/json-schemas";
import type { Setting } from "@/lib/novels/types";
import type { GenerateSettingsParams, GenerateSettingsResult } from "./types";

/**
 * Generate story settings
 *
 * @param params - Settings generation parameters
 * @returns Settings data (caller responsible for database save)
 */
export async function generateSettings(
	params: GenerateSettingsParams,
): Promise<GenerateSettingsResult> {
	const startTime = Date.now();
	const { story, settingCount, onProgress } = params;

	const settings: Setting[] = [];

	for (let i = 0; i < settingCount; i++) {
		// Report progress
		if (onProgress) {
			onProgress(i + 1, settingCount);
		}

		// Build setting prompt
		const settingPrompt = `Generate a story setting that serves as an emotional environment for the Adversity-Triumph narrative framework.

Story Context:
Title: ${story.title}
Genre: ${story.genre}
Summary: ${story.summary}
Moral Framework: ${story.moralFramework}

Generate setting ${i + 1} of ${settingCount}:

Return as JSON with this exact structure:
{
  "id": "setting_${i + 1}",
  "name": "...",
  "description": "...",
  "adversityElements": {
    "physicalObstacles": ["...", "..."],
    "scarcityFactors": ["...", "..."],
    "dangerSources": ["...", "..."],
    "socialDynamics": ["...", "..."]
  },
  "symbolicMeaning": "...",
  "cycleAmplification": {
    "setup": "...",
    "confrontation": "...",
    "virtue": "...",
    "consequence": "...",
    "transition": "..."
  },
  "mood": "...",
  "emotionalResonance": "...",
  "sensory": {
    "sight": ["...", "...", "..."],
    "sound": ["...", "...", "..."],
    "smell": ["...", "..."],
    "touch": ["...", "..."],
    "taste": []
  },
  "architecturalStyle": "...",
  "visualStyle": "realistic",
  "visualReferences": ["...", "..."],
  "colorPalette": ["...", "...", "..."]
}`;

		// Generate setting
		const response = await textGenerationClient.generate({
			prompt: settingPrompt,
			temperature: 0.85,
			maxTokens: 8192,
			responseFormat: "json",
			responseSchema: SettingJsonSchema,
		});

		const settingData = JSON.parse(response.text);
		settings.push(settingData);

		console.log(
			`[settings-generator] Generated setting ${i + 1}/${settingCount}:`,
			{
				name: settingData.name,
				mood: settingData.mood,
			},
		);
	}

	console.log("[settings-generator] All settings generated:", {
		count: settings.length,
		generationTime: Date.now() - startTime,
	});

	return {
		settings,
		metadata: {
			totalGenerated: settings.length,
			generationTime: Date.now() - startTime,
		},
	};
}
