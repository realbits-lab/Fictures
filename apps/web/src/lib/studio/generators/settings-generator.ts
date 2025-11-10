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
import { promptManager } from "./prompt-manager";
import type {
    GenerateSettingsParams,
    GenerateSettingsResult,
    SettingPromptParams,
} from "./types";
import {
    type GeneratedSettingData,
    GeneratedSettingSchema,
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

    const settings: GeneratedSettingData[] = [];

    // 2. Generate each setting in sequence
    for (let i = 0; i < settingCount; i++) {
        console.log(
            `[settings-generator] 🏰 Generating setting ${i + 1}/${settingCount}...`,
        );

        // 3. Report progress callback if provided
        if (onProgress) {
            onProgress(i + 1, settingCount);
        }

        // 4. Get the prompt template for setting generation
        const promptParams: SettingPromptParams = {
            settingNumber: String(i + 1),
            settingCount: String(settingCount),
            storyTitle: story.title,
            storyGenre: story.genre ?? "General Fiction",
            storySummary: story.summary ?? "A story of adversity and triumph",
            moralFramework: story.moralFramework ?? "Universal human virtues",
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

        // 5. Generate setting using structured output
        const settingData: GeneratedSettingData =
            await textGenerationClient.generateStructured(
                userPromptText,
                GeneratedSettingSchema,
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

    // 6. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log(
        "[settings-generator] ✅ All settings generated successfully:",
        {
            count: settings.length,
            generationTime: totalTime,
        },
    );

    // 7. Build and return result with metadata
    const result: GenerateSettingsResult = {
        settings,
        metadata: {
            totalGenerated: settings.length,
            generationTime: totalTime,
        },
    };

    return result;
}
