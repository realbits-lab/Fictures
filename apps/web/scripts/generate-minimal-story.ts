#!/usr/bin/env tsx

/**
 * Minimal Story Generation Script
 *
 * Generates the smallest possible complete novel using the Adversity-Triumph Engine
 * for fastest generation time (~5-10 minutes).
 *
 * Configuration:
 * - 1 part (shortest story structure)
 * - 1 chapter per part
 * - 3 scenes per chapter (minimum for adversity-triumph cycle)
 * - 2 characters (minimum for story dynamics)
 * - 2 settings (minimum for location variety)
 *
 * Features:
 * - Direct API authentication with writer API key (no browser needed)
 * - Real-time progress via Server-Sent Events (SSE)
 * - Automatic image generation (1344×768, 7:4 aspect ratio)
 * - 4 optimized variants per image (AVIF + JPEG × mobile 1x/2x)
 * - Scene quality evaluation with automated improvement
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-minimal-story.ts
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid writer API key in .auth/user.json
 *   - Environment variables: GOOGLE_GENERATIVE_AI_API_KEY, BLOB_READ_WRITE_TOKEN
 */

import fs from "node:fs";
import path from "node:path";
import { NOVEL_GENERATION_CONSTRAINTS } from "../src/lib/novels/constants";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

const BASE_URL = "http://localhost:3000";

// Load writer API key from environment-aware auth
const writer = loadProfile("writer");
const writerApiKey = writer.apiKey;
const currentEnv = getEnvDisplayName();

console.log("🚀 Starting story generation with API key authentication...\n");
console.log(`🌍 Environment: ${currentEnv}`);
console.log(`🔑 Using API key: ${writerApiKey.slice(0, 20)}...`);
console.log(`\n${"=".repeat(60)}\n`);

// Simple story prompt for minimal generation
const userPrompt = `
A simple story about a young artist who overcomes their fear of showing their work to others.
Genre: Slice of life
Tone: Hopeful and uplifting
`.trim();

console.log("📝 Story Prompt:");
console.log(userPrompt);
console.log(`\n${"=".repeat(60)}\n`);

async function generateStory() {
    try {
        const startTime = Date.now();

        // Call the novel generation API with API key
        const response = await fetch(`${BASE_URL}/studio/api/novels`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${writerApiKey}`, // API key in Authorization header
            },
            body: JSON.stringify({
                userPrompt,
                preferredGenre: "Slice",
                preferredTone: "hopeful",
                characterCount: NOVEL_GENERATION_CONSTRAINTS.CHARACTER.DEFAULT, // Minimum for story dynamics
                settingCount: NOVEL_GENERATION_CONSTRAINTS.SETTING.DEFAULT, // Minimum for location variety
                partsCount: NOVEL_GENERATION_CONSTRAINTS.PARTS.DEFAULT, // Single part = shortest story
                chaptersPerPart:
                    NOVEL_GENERATION_CONSTRAINTS.CHAPTERS_PER_PART.DEFAULT, // Single chapter per part
                scenesPerChapter:
                    NOVEL_GENERATION_CONSTRAINTS.SCENES_PER_CHAPTER.DEFAULT, // Minimum for adversity-triumph cycle
                language: "English",
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error (${response.status}): ${error}`);
        }

        // Read SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let storyId = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = JSON.parse(line.slice(6));
                    const { phase, message, data: eventData } = data;

                    // Log progress
                    if (phase.endsWith("_start")) {
                        const phaseName = phase
                            .replace("_start", "")
                            .replace(/_/g, " ")
                            .toUpperCase();
                        console.log(`\n🎬 ${phaseName}`);
                        console.log(`   ${message}`);
                    } else if (phase.endsWith("_progress")) {
                        if (eventData?.currentItem && eventData?.totalItems) {
                            console.log(
                                `   [${eventData.currentItem}/${eventData.totalItems}] ${message}`,
                            );
                        } else {
                            console.log(`   → ${message}`);
                        }
                    } else if (phase.endsWith("_complete")) {
                        const phaseName = phase
                            .replace("_complete", "")
                            .replace(/_/g, " ")
                            .toUpperCase();
                        console.log(`   ✅ ${phaseName} COMPLETE`);
                    } else if (phase === "complete") {
                        // Final completion event
                        storyId = eventData.storyId;
                        const endTime = Date.now();
                        const totalTime = (endTime - startTime) / 1000;

                        console.log(`\n${"=".repeat(60)}`);
                        console.log("✅ STORY GENERATION COMPLETE!\n");
                        console.log(`Story ID: ${storyId}`);
                        console.log(
                            `Title: ${eventData.story?.title || "(untitled)"}`,
                        );
                        console.log(`\nStats:`);
                        console.log(`  - Parts: ${eventData.partsCount}`);
                        console.log(`  - Chapters: ${eventData.chaptersCount}`);
                        console.log(`  - Scenes: ${eventData.scenesCount}`);
                        console.log(
                            `  - Characters: ${eventData.charactersCount}`,
                        );
                        console.log(`  - Settings: ${eventData.settingsCount}`);
                        console.log(
                            `\n  - Generation Time: ${totalTime.toFixed(1)}s (${(totalTime / 60).toFixed(1)} minutes)`,
                        );
                        console.log(`\n${"=".repeat(60)}`);

                        // Save story details
                        const logDir = "logs";
                        if (!fs.existsSync(logDir)) {
                            fs.mkdirSync(logDir, { recursive: true });
                        }
                        const logFile = path.join(
                            logDir,
                            "api-story-generation.json",
                        );
                        fs.writeFileSync(
                            logFile,
                            JSON.stringify(
                                {
                                    storyId,
                                    title: eventData.story?.title,
                                    stats: {
                                        parts: eventData.partsCount,
                                        chapters: eventData.chaptersCount,
                                        scenes: eventData.scenesCount,
                                        characters: eventData.charactersCount,
                                        settings: eventData.settingsCount,
                                        generationTime: totalTime,
                                    },
                                    generatedAt: new Date().toISOString(),
                                },
                                null,
                                2,
                            ),
                        );
                        console.log(`\n📄 Story details saved to: ${logFile}`);

                        console.log(`\n🌐 View story at:`);
                        console.log(
                            `   Novel format: ${BASE_URL}/novels/${storyId}`,
                        );
                        console.log(
                            `   Comic format: ${BASE_URL}/comics/${storyId}`,
                        );
                        console.log(
                            `   Edit: ${BASE_URL}/studio/edit/story/${storyId}`,
                        );
                    } else if (phase === "error") {
                        console.error(`\n❌ ERROR: ${message}`);
                        if (data.error) {
                            console.error(`   Details: ${data.error}`);
                        }
                    }
                }
            }
        }

        if (!storyId) {
            throw new Error(
                "Story generation completed but no story ID received",
            );
        }
    } catch (error) {
        console.error("\n❌ Generation failed:", error.message);
        if (error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run generation
generateStory();
