/**
 * Toonplay Converter Generator
 *
 * Converts narrative prose scenes into structured webtoon toonplay specifications.
 * This is the first phase of novel-to-webtoon adaptation.
 *
 * NOTE: This generator does NOT save to database.
 * Database operations are handled by the caller (API route or service).
 */

import {
    type AiComicToonplayType,
    AiComicToonplayZodSchema,
} from "@/lib/schemas/ai/ai-toonplay";
import type {
    GeneratorToonplayParams,
    GeneratorToonplayResult,
    ToonplayPromptParams,
} from "@/lib/schemas/generators/types";
import { createTextGenerationClient } from "./ai-client";
import { promptManager } from "./prompt-manager";

/**
 * Convert a narrative scene to webtoon toonplay specification
 *
 * @param params - Toonplay generation parameters
 * @returns Toonplay specification (caller responsible for database save)
 */
export async function convertSceneToToonplay(
    params: GeneratorToonplayParams,
): Promise<GeneratorToonplayResult> {
    const startTime: number = Date.now();

    // 1. Extract parameters
    const {
        scene,
        story,
        characters,
        settings,
        language = "English",
    }: GeneratorToonplayParams = params;

    // 2. Create text generation client
    const client = createTextGenerationClient();

    console.log(
        `[toonplay-converter] 🎬 Converting scene to toonplay: ${scene.title}`,
    );

    // 3. Build character descriptions string
    const charactersStr: string = characters
        .map((c) => {
            const physDesc = c.physicalDescription;
            return `- ${c.name}: ${physDesc.age} ${physDesc.appearance}, ${physDesc.distinctiveFeatures}, ${physDesc.style}`;
        })
        .join("\n");

    // 5. Build settings descriptions string
    const settingsStr: string = settings
        .map(
            (s) =>
                `- ${s.name}: ${s.summary || (s as any).description || "N/A"}`,
        )
        .join("\n");

    console.log(
        `[toonplay-converter] Context prepared: ${characters.length} characters, ${settings.length} settings`,
    );

    // 6. Build prompt parameters
    const promptParams: ToonplayPromptParams = {
        sceneContent: (scene as any).content || "",
        sceneTitle: scene.title,
        sceneSummary: scene.summary || "",
        storyGenre: story.genre,
        storyTone: story.tone,
        characters: charactersStr,
        settings: settingsStr,
        language,
    };

    const {
        system: systemPrompt,
        user: userPromptText,
    }: { system: string; user: string } = promptManager.getPrompt(
        client.getProviderType(),
        "toonplay",
        promptParams,
    );

    console.log(
        "[toonplay-converter] Generating toonplay using structured output",
    );

    // 7. Generate toonplay using structured output
    const toonplayData: AiComicToonplayType = await client.generateStructured(
        userPromptText,
        AiComicToonplayZodSchema,
        {
            systemPrompt,
            temperature: 0.7, // Balance creativity with structure
            maxTokens: 16384, // Large enough for 8-12 panels with full specs
        },
    );

    // 8. Calculate total generation time
    const totalTime: number = Date.now() - startTime;

    console.log("[toonplay-converter] ✅ Generated toonplay:", {
        sceneId: (scene as any).id || "unknown",
        totalPanels: toonplayData.total_panels,
        generationTime: totalTime,
    });

    // 9. Return toonplay result
    return {
        toonplay: toonplayData,
        metadata: {
            generationTime: totalTime,
            model: client.getProviderType(),
        },
    };
}
