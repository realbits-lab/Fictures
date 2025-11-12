/**
 * Settings Generator
 *
 * Generates story settings using the Adversity-Triumph Engine.
 * This is the third phase of novel generation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route).
 */

import { textGenerationClient } from "./ai-client";
import { buildStoryContext } from "./context-builders";
import { promptManager } from "./prompt-manager";
import type {
    GenerateSettingsParams,
    GenerateSettingsResult,
    SettingPromptParams,
} from "./types";
import {
    type AiSettingType,
    AiSettingZodSchema,
} from "./zod-schemas.generated";

/**
 * Generate story settings
 *
 * @param params - Settings generation parameters
 * @returns Settings data (caller responsible for database save)
 */
export async function generateSettings(
    params: GenerateSettingsParams,
): Promise<GenerateSettingsResult> {
    const startTime: number = Date.now();

    // 1. Extract and set default parameters
    const { story, settingCount, onProgress }: GenerateSettingsParams = params;

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
            textGenerationClient.getProviderType(),
            "setting",
            promptParams,
        );

        console.log(
            `[settings-generator] Generating setting ${i + 1} using structured output`,
        );

        // 6. Generate setting using structured output
        const settingData: AiSettingType =
            await textGenerationClient.generateStructured(
                userPromptText,
                AiSettingZodSchema,
                {
                    systemPrompt,
                    temperature: 0.85,
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
    const result: GenerateSettingsResult = {
        settings,
        metadata: {
            totalGenerated: settings.length,
            generationTime: totalTime,
        },
    };

    return result;
}
