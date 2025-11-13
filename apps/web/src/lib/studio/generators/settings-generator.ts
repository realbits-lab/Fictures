/**
 * Settings Generator
 *
 * Generates story settings using the Adversity-Triumph Engine.
 * This is the third phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { createTextGenerationClient } from "./ai-client";
import { buildStoryContext } from "./context-builders";
import { promptManager } from "./prompt-manager";
import type {
    GeneratorSettingsParams,
    GeneratorSettingsResult,
    SettingPromptParams,
} from "./types";
import { type AiSettingType, AiSettingZodSchema } from "./zod-schemas";

/**
 * Generate story settings
 *
 * @param params - Settings generation parameters
 * @returns Settings data (caller responsible for database save)
 */
export async function generateSettings(
    params: GeneratorSettingsParams,
): Promise<GeneratorSettingsResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const { story, settingCount, onProgress, apiKey }: GeneratorSettingsParams =
        params;

    // 2. Create text generation client with API key
    const client = createTextGenerationClient(apiKey);

    const settings: AiSettingType[] = [];

    // 2. Build story context once (used for all settings)
    const storyContext: string = buildStoryContext(story);
    console.log("[settings-generator] Story context prepared");

    // 3. Generate each setting in sequence
    for (let i = 0; i < settingCount; i++) {
        console.log(
            `[settings-generator] 🏰 Generating setting ${i + 1}/${settingCount}...`,
        );

        // 4. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, settingCount);
        }

        // 5. Get the prompt template for setting generation
        const promptParams: SettingPromptParams = {
            settingNumber: String(i + 1),
            settingCount: String(settingCount),
            story: storyContext,
        };

        const {
            system: systemPrompt,
            user: userPromptText,
        }: { system: string; user: string } = promptManager.getPrompt(
            client.getProviderType(),
            "setting",
            promptParams,
        );

        console.log(
            `[settings-generator] Generating setting ${i + 1} using structured output`,
        );

        // 6. Generate setting using structured output
        const settingData: AiSettingType = await client.generateStructured(
            userPromptText,
            AiSettingZodSchema,
            {
                systemPrompt,
                temperature: 0.3, // Low temperature for consistent JSON structure
                maxTokens: 8192,
            },
        );

        settings.push(settingData);

        console.log(
            `[settings-generator] ✅ Generated setting ${i + 1}/${settingCount}:`,
            {
                name: settingData.name,
                mood: settingData.mood,
                summary: settingData.summary,
            },
        );
    }

    // 7. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        "[settings-generator] ✅ All settings generated successfully:",
        {
            count: settings.length,
            generationTime: totalTime,
        },
    );

    // 8. Build and return result with metadata
    const result: GeneratorSettingsResult = {
        settings,
        metadata: {
            totalGenerated: settings.length,
            generationTime: totalTime,
        },
    };

    return result;
}
