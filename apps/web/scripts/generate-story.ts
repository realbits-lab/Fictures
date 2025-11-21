#!/usr/bin/env tsx

/**
 * Minimal Story Generation Script
 *
 * Generates the smallest possible complete novel using individual generation APIs.
 * Each phase calls a separate API endpoint for granular control.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts [options]
 *
 * Options:
 *   --prompt <text>           User prompt for story generation (default: artist story)
 *   --characters <n>          Number of characters (default: 2)
 *   --settings <n>            Number of settings (default: 2)
 *   --parts <n>               Number of parts (default: 1)
 *   --chapters-per-part <n>   Chapters per part (default: 2)
 *   --scenes-per-chapter <n>  Scenes per chapter (default: 3)
 *   --language <lang>         Story language (default: English)
 *
 * Examples:
 *   # Default minimal story
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts
 *
 *   # Custom story with more content
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts \
 *     --prompt "A detective solving mysteries" \
 *     --characters 3 \
 *     --parts 2 \
 *     --chapters-per-part 2
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid writer API key in .auth/user.json
 *   - Environment variables: GOOGLE_GENERATIVE_AI_API_KEY, BLOB_READ_WRITE_TOKEN
 */

import fs from "node:fs";
import path from "node:path";
import { loadProfile } from "../src/lib/utils/auth-loader.js";
import { getEnvDisplayName } from "../src/lib/utils/environment.js";

const BASE_URL = "http://localhost:3000";

// Parse command line arguments
function parseArgs(): {
    userPrompt: string;
    characterCount: number;
    settingCount: number;
    partsCount: number;
    chaptersPerPart: number;
    scenesPerChapter: number;
    language: string;
} {
    const args = process.argv.slice(2);
    const options = {
        userPrompt: `A simple story about a young artist who overcomes their fear of showing their work to others.
Genre: Slice of life
Tone: Hopeful and uplifting`,
        characterCount: 2,
        settingCount: 2,
        partsCount: 1,
        chaptersPerPart: 2,
        scenesPerChapter: 3,
        language: "English",
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case "--prompt":
                options.userPrompt = nextArg || options.userPrompt;
                i++;
                break;
            case "--characters":
                options.characterCount =
                    parseInt(nextArg, 10) || options.characterCount;
                i++;
                break;
            case "--settings":
                options.settingCount =
                    parseInt(nextArg, 10) || options.settingCount;
                i++;
                break;
            case "--parts":
                options.partsCount =
                    parseInt(nextArg, 10) || options.partsCount;
                i++;
                break;
            case "--chapters-per-part":
                options.chaptersPerPart =
                    parseInt(nextArg, 10) || options.chaptersPerPart;
                i++;
                break;
            case "--scenes-per-chapter":
                options.scenesPerChapter =
                    parseInt(nextArg, 10) || options.scenesPerChapter;
                i++;
                break;
            case "--language":
                options.language = nextArg || options.language;
                i++;
                break;
            case "--help":
                console.log(`
Usage: dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts [options]

Options:
  --prompt <text>           User prompt for story generation
  --characters <n>          Number of characters (default: 2)
  --settings <n>            Number of settings (default: 2)
  --parts <n>               Number of parts (default: 1)
  --chapters-per-part <n>   Chapters per part (default: 2)
  --scenes-per-chapter <n>  Scenes per chapter (default: 3)
  --language <lang>         Story language (default: English)
  --help                    Show this help message
`);
                process.exit(0);
        }
    }

    return options;
}

// Load writer API key from environment-aware auth
const writer = loadProfile("writer");
const writerApiKey = writer.apiKey;
const currentEnv = getEnvDisplayName();

const options = parseArgs();

console.log("🚀 Starting story generation with individual APIs...\n");
console.log(`🌍 Environment: ${currentEnv}`);
console.log(`🔑 Using API key: ${writerApiKey.slice(0, 20)}...`);
console.log(`\n${"=".repeat(60)}\n`);

console.log("📝 Generation Configuration:");
console.log(`   Prompt: ${options.userPrompt.substring(0, 50)}...`);
console.log(`   Characters: ${options.characterCount}`);
console.log(`   Settings: ${options.settingCount}`);
console.log(`   Parts: ${options.partsCount}`);
console.log(`   Chapters per Part: ${options.chaptersPerPart}`);
console.log(`   Scenes per Chapter: ${options.scenesPerChapter}`);
console.log(`   Language: ${options.language}`);
console.log(`\n${"=".repeat(60)}\n`);

// Helper function to make API calls
async function callApi<T>(
    endpoint: string,
    body: Record<string, unknown>,
    description: string,
): Promise<T> {
    console.log(`\n🔄 ${description}...`);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": writerApiKey,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`${description} failed (${response.status}): ${error}`);
    }

    const result = await response.json();
    console.log(`   ✅ ${description} complete`);
    return result as T;
}

async function generateStory() {
    try {
        const startTime = Date.now();
        const stats = {
            storyId: "",
            title: "",
            parts: 0,
            chapters: 0,
            scenes: 0,
            characters: 0,
            settings: 0,
        };

        // Phase 1: Generate Story Summary
        console.log("\n🎬 PHASE 1: STORY SUMMARY");
        const storyResult = await callApi<{
            success: boolean;
            story: {
                id: string;
                title: string;
                summary: string;
                genre: string;
                tone: string;
            };
        }>(
            "/api/studio/story",
            {
                userPrompt: options.userPrompt,
                language: options.language,
            },
            "Generating story summary",
        );

        const storyId = storyResult.story.id;
        stats.storyId = storyId;
        stats.title = storyResult.story.title;
        console.log(`   Story ID: ${storyId}`);
        console.log(`   Title: ${storyResult.story.title}`);

        // Phase 2: Generate Characters
        console.log("\n🎬 PHASE 2: CHARACTERS");
        const charactersResult = await callApi<{
            success: boolean;
            characters: Array<{ id: string; name: string }>;
        }>(
            "/api/studio/characters",
            {
                storyId,
                characterCount: options.characterCount,
            },
            `Generating ${options.characterCount} characters`,
        );

        stats.characters = charactersResult.characters.length;
        for (const char of charactersResult.characters) {
            console.log(`   - ${char.name}`);
        }

        // Phase 3: Generate Settings
        console.log("\n🎬 PHASE 3: SETTINGS");
        const settingsResult = await callApi<{
            success: boolean;
            settings: Array<{ id: string; name: string }>;
        }>(
            "/api/studio/settings",
            {
                storyId,
                settingCount: options.settingCount,
            },
            `Generating ${options.settingCount} settings`,
        );

        stats.settings = settingsResult.settings.length;
        for (const setting of settingsResult.settings) {
            console.log(`   - ${setting.name}`);
        }

        // Phase 4: Generate Parts
        console.log("\n🎬 PHASE 4: PARTS");
        const partIds: string[] = [];
        for (let p = 0; p < options.partsCount; p++) {
            const partResult = await callApi<{
                success: boolean;
                part: { id: string; title: string };
            }>(
                "/api/studio/part",
                {
                    storyId,
                    partIndex: p,
                },
                `Generating part ${p + 1}/${options.partsCount}`,
            );

            partIds.push(partResult.part.id);
            stats.parts++;
            console.log(`   - ${partResult.part.title}`);
        }

        // Phase 5: Generate Chapters
        console.log("\n🎬 PHASE 5: CHAPTERS");
        const chapterIds: string[] = [];
        for (let p = 0; p < partIds.length; p++) {
            for (let c = 0; c < options.chaptersPerPart; c++) {
                const chapterResult = await callApi<{
                    success: boolean;
                    chapter: { id: string; title: string };
                }>(
                    "/api/studio/chapter",
                    {
                        storyId,
                        partId: partIds[p],
                        chapterIndex: c,
                    },
                    `Generating chapter ${c + 1}/${options.chaptersPerPart} for part ${p + 1}`,
                );

                chapterIds.push(chapterResult.chapter.id);
                stats.chapters++;
                console.log(`   - ${chapterResult.chapter.title}`);
            }
        }

        // Phase 6: Generate Scene Summaries
        console.log("\n🎬 PHASE 6: SCENE SUMMARIES");
        const sceneIds: string[] = [];
        for (let ch = 0; ch < chapterIds.length; ch++) {
            for (let s = 0; s < options.scenesPerChapter; s++) {
                const sceneSummaryResult = await callApi<{
                    success: boolean;
                    scene: { id: string; title: string };
                }>(
                    "/api/studio/scene-summary",
                    {
                        storyId,
                        chapterId: chapterIds[ch],
                        sceneIndex: s,
                    },
                    `Generating scene summary ${s + 1}/${options.scenesPerChapter} for chapter ${ch + 1}`,
                );

                sceneIds.push(sceneSummaryResult.scene.id);
                stats.scenes++;
                console.log(`   - ${sceneSummaryResult.scene.title}`);
            }
        }

        // Phase 7: Generate Scene Content
        console.log("\n🎬 PHASE 7: SCENE CONTENT");
        for (let i = 0; i < sceneIds.length; i++) {
            await callApi<{
                success: boolean;
                scene: { id: string; content: string };
            }>(
                "/api/studio/scene-content",
                {
                    sceneId: sceneIds[i],
                },
                `Generating content for scene ${i + 1}/${sceneIds.length}`,
            );
        }

        // Calculate total time
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;

        // Print summary
        console.log(`\n${"=".repeat(60)}`);
        console.log("✅ STORY GENERATION COMPLETE!\n");
        console.log(`Story ID: ${stats.storyId}`);
        console.log(`Title: ${stats.title}`);
        console.log(`\nStats:`);
        console.log(`  - Parts: ${stats.parts}`);
        console.log(`  - Chapters: ${stats.chapters}`);
        console.log(`  - Scenes: ${stats.scenes}`);
        console.log(`  - Characters: ${stats.characters}`);
        console.log(`  - Settings: ${stats.settings}`);
        console.log(
            `\n  - Generation Time: ${totalTime.toFixed(1)}s (${(totalTime / 60).toFixed(1)} minutes)`,
        );
        console.log(`\n${"=".repeat(60)}`);

        // Save story details
        const logDir = "logs";
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        const logFile = path.join(logDir, "api-story-generation.json");
        fs.writeFileSync(
            logFile,
            JSON.stringify(
                {
                    storyId: stats.storyId,
                    title: stats.title,
                    stats: {
                        parts: stats.parts,
                        chapters: stats.chapters,
                        scenes: stats.scenes,
                        characters: stats.characters,
                        settings: stats.settings,
                        generationTime: totalTime,
                    },
                    config: options,
                    generatedAt: new Date().toISOString(),
                },
                null,
                2,
            ),
        );
        console.log(`\n📄 Story details saved to: ${logFile}`);

        console.log(`\n🌐 View story at:`);
        console.log(`   Novel format: ${BASE_URL}/novels/${stats.storyId}`);
        console.log(`   Comic format: ${BASE_URL}/comics/${stats.storyId}`);
        console.log(`   Edit: ${BASE_URL}/studio/edit/story/${stats.storyId}`);
    } catch (error) {
        console.error("\n❌ Generation failed:", (error as Error).message);
        if ((error as Error).stack) {
            console.error("\nStack trace:");
            console.error((error as Error).stack);
        }
        process.exit(1);
    }
}

// Run generation
generateStory();
