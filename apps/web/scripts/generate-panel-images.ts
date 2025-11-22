#!/usr/bin/env tsx

/**
 * Comic Panel Image Generation Script
 *
 * Generates comic panel images for scenes using the /api/studio/panel-images endpoint.
 * Requires toonplay to be pre-generated via /api/studio/toonplay endpoint.
 *
 * Usage:
 *   pnpm exec dotenv -e .env.local -- pnpm exec tsx scripts/generate-comic-images.ts --story <storyId>
 *   pnpm exec dotenv -e .env.local -- pnpm exec tsx scripts/generate-comic-images.ts --scene <sceneId>
 *
 * Options:
 *   --story <id>       Generate images for all scenes in a story
 *   --scene <id>       Generate images for a single scene
 *   --regenerate       Regenerate existing panels
 *   --verbose          Show detailed logs
 */

import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../src/lib/schemas/database";
import { chapters, parts, scenes, stories } from "../src/lib/schemas/database";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

// Initialize database
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : undefined;
};

const storyId = getArgValue("--story");
const sceneId = getArgValue("--scene");
const isRegenerate = args.includes("--regenerate");
const isVerbose = args.includes("--verbose");

// Validate arguments
if (!storyId && !sceneId) {
    console.error("❌ Error: --story or --scene ID must be provided");
    console.log("\nUsage:");
    console.log(
        "  pnpm exec dotenv -e .env.local -- pnpm exec tsx scripts/generate-comic-images.ts --story <storyId>",
    );
    console.log(
        "  pnpm exec dotenv -e .env.local -- pnpm exec tsx scripts/generate-comic-images.ts --scene <sceneId>",
    );
    console.log("\nOptions:");
    console.log("  --regenerate    Regenerate existing panels");
    console.log("  --verbose       Show detailed logs");
    process.exit(1);
}

// Load writer authentication
let writerApiKey: string;
try {
    const writer = loadProfile("writer");
    writerApiKey = writer.apiKey;
    if (!writerApiKey) {
        throw new Error("Writer API key not found");
    }
} catch (error) {
    console.error(
        "❌ Error loading authentication:",
        error instanceof Error ? error.message : String(error),
    );
    console.log(
        "\nRun: pnpm exec dotenv -e .env.local -- pnpm exec tsx scripts/setup-auth-users.ts",
    );
    process.exit(1);
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log("🎨 Comic Panel Image Generation Script");
console.log("=".repeat(60));
console.log();
console.log(`🌍 Environment: ${getEnvDisplayName()}`);
console.log(`🔑 Using writer API key: ${writerApiKey.slice(0, 20)}...`);
if (storyId) console.log(`📖 Story ID: ${storyId}`);
if (sceneId) console.log(`🎭 Scene ID: ${sceneId}`);
console.log(`Regenerate: ${isRegenerate ? "Yes" : "No"}`);
if (isVerbose) console.log("Verbose: Enabled");
console.log();

interface SceneInfo {
    id: string;
    title: string;
    chapterId: string;
    storyId: string;
    content: string | null;
}

/**
 * Get all scenes to process
 */
async function getScenesToProcess(): Promise<SceneInfo[]> {
    const allScenes: SceneInfo[] = [];

    if (sceneId) {
        // Single scene
        const scene = await db.query.scenes.findFirst({
            where: eq(scenes.id, sceneId),
        });
        if (!scene) {
            throw new Error(`Scene not found: ${sceneId}`);
        }
        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, scene.chapterId),
        });
        if (!chapter) {
            throw new Error(`Chapter not found for scene: ${sceneId}`);
        }

        allScenes.push({
            id: scene.id,
            title: scene.title,
            chapterId: scene.chapterId,
            storyId: chapter.storyId,
            content: scene.content,
        });
    } else if (storyId) {
        // All scenes in story
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });
        if (!story) {
            throw new Error(`Story not found: ${storyId}`);
        }

        const storyParts = await db.query.parts.findMany({
            where: eq(parts.storyId, storyId),
            orderBy: (parts, { asc }) => [asc(parts.orderIndex)],
        });

        console.log(`📖 Story: "${story.title}"`);
        console.log(`   Found ${storyParts.length} part(s)`);

        for (const part of storyParts) {
            const partChapters = await db.query.chapters.findMany({
                where: eq(chapters.partId, part.id),
                orderBy: (chapters, { asc }) => [asc(chapters.orderIndex)],
            });

            for (const chapter of partChapters) {
                const chapterScenes = await db.query.scenes.findMany({
                    where: eq(scenes.chapterId, chapter.id),
                    orderBy: (scenes, { asc }) => [asc(scenes.orderIndex)],
                });

                for (const scene of chapterScenes) {
                    allScenes.push({
                        id: scene.id,
                        title: scene.title,
                        chapterId: scene.chapterId,
                        storyId: storyId,
                        content: scene.content,
                    });
                }
            }
        }

        console.log(`   Total scenes: ${allScenes.length}`);
    }

    return allScenes;
}

/**
 * Generate comic panel images for a single scene
 */
async function generateImagesForScene(
    scene: SceneInfo,
    index: number,
    total: number,
): Promise<{
    success: boolean;
    panelCount: number;
    duration: number;
    error?: string;
}> {
    console.log(
        `\n[${index + 1}/${total}] 🎨 Generating images for: "${scene.title}"`,
    );

    if (!scene.content || scene.content.length < 50) {
        console.log("   ⚠️  Skipping: Scene has insufficient content");
        return {
            success: false,
            panelCount: 0,
            duration: 0,
            error: "Insufficient content",
        };
    }

    const startTime = Date.now();

    try {
        // Call the /api/studio/panel-images endpoint (SSE)
        const response = await fetch(`${API_BASE}/api/studio/panel-images`, {
            method: "POST",
            headers: {
                "x-api-key": writerApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sceneId: scene.id,
                regenerate: isRegenerate,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage =
                    errorJson.error || errorJson.message || errorText;
            } catch {
                // Keep as text
            }
            throw new Error(`API error: ${response.status} - ${errorMessage}`);
        }

        // Process SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let panelCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);

                    try {
                        const event = JSON.parse(data);

                        if (event.type === "start") {
                            if (isVerbose)
                                console.log(`   📝 ${event.message}`);
                        } else if (event.type === "progress") {
                            console.log(
                                `   [${event.current}/${event.total}] ${event.status}`,
                            );
                        } else if (event.type === "complete") {
                            panelCount = event.result?.panels?.length || 0;
                            console.log(
                                `   ✅ Complete: ${panelCount} panels with images`,
                            );
                        } else if (event.type === "error") {
                            throw new Error(event.error);
                        }
                    } catch (parseError) {
                        if (isVerbose && parseError instanceof SyntaxError) {
                            console.log(`   Warning: Could not parse event`);
                        } else if (!(parseError instanceof SyntaxError)) {
                            throw parseError;
                        }
                    }
                }
            }
        }

        const duration = (Date.now() - startTime) / 1000;

        return {
            success: true,
            panelCount,
            duration,
        };
    } catch (error) {
        const duration = (Date.now() - startTime) / 1000;
        const errorMessage =
            error instanceof Error ? error.message : String(error);
        console.log(`   ❌ Error: ${errorMessage}`);
        return {
            success: false,
            panelCount: 0,
            duration,
            error: errorMessage,
        };
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        // 1. Get all scenes to process
        const scenesToProcess = await getScenesToProcess();

        if (scenesToProcess.length === 0) {
            console.log("\n⚠️  No scenes found to process");
            process.exit(0);
        }

        // 2. Filter scenes with content
        const scenesWithContent = scenesToProcess.filter(
            (s) => s.content && s.content.length >= 50,
        );

        if (scenesWithContent.length === 0) {
            console.log("\n⚠️  No scenes with sufficient content found");
            process.exit(0);
        }

        // 3. Generate images for each scene
        const results: Array<{
            sceneId: string;
            title: string;
            success: boolean;
            panelCount: number;
            duration: number;
            error?: string;
        }> = [];

        const totalStartTime = Date.now();

        for (let i = 0; i < scenesWithContent.length; i++) {
            const scene = scenesWithContent[i];
            const result = await generateImagesForScene(
                scene,
                i,
                scenesWithContent.length,
            );

            results.push({
                sceneId: scene.id,
                title: scene.title,
                ...result,
            });
        }

        const totalDuration = (Date.now() - totalStartTime) / 1000;

        // 4. Summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 Generation Summary");
        console.log("=".repeat(60));

        const successful = results.filter((r) => r.success);
        const failed = results.filter((r) => !r.success);

        console.log(`\nResults:`);
        console.log(`  ✅ Successful: ${successful.length}`);
        console.log(`  ❌ Failed: ${failed.length}`);

        if (successful.length > 0) {
            const totalPanels = successful.reduce(
                (sum, r) => sum + r.panelCount,
                0,
            );
            console.log(`\nGenerated:`);
            console.log(`  Total panels: ${totalPanels}`);
        }

        console.log(`\nTime:`);
        console.log(
            `  Total duration: ${(totalDuration / 60).toFixed(1)} minutes`,
        );

        if (failed.length > 0) {
            console.log(`\nFailed scenes:`);
            for (const result of failed) {
                console.log(`  - "${result.title}": ${result.error}`);
            }
        }

        console.log("\n" + "=".repeat(60));

        // Get story ID for view link
        const viewStoryId = scenesWithContent[0]?.storyId;
        if (viewStoryId) {
            console.log(
                `\n✨ View comics at: ${API_BASE}/comics/${viewStoryId}`,
            );
        }
    } catch (error) {
        console.error(
            "\n❌ Script failed:",
            error instanceof Error ? error.message : String(error),
        );
        if (error instanceof Error && error.stack && isVerbose) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Execute
main();
