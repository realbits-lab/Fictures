#!/usr/bin/env tsx

/**
 * Toonplay Generation Script
 *
 * Generates toonplay (comic panels) for scenes using the Toonplay system.
 * Supports generating at multiple levels: story, part, chapter, or scene.
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --scene <sceneId>
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --chapter <chapterId>
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --part <partId>
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --story <storyId>
 *
 * Options:
 *   --scene <id>       Generate toonplay for a single scene
 *   --chapter <id>     Generate toonplay for all scenes in a chapter
 *   --part <id>        Generate toonplay for all scenes in a part
 *   --story <id>       Generate toonplay for all scenes in a story
 *   --dry-run          Preview what would be generated without actually creating panels
 *   --force            Regenerate panels even if they already exist
 *   --verbose          Show detailed generation logs
 *   --limit <n>        Limit number of scenes to process (default: unlimited)
 *
 * Features:
 *   - Validates existence and retrieves data for story/part/chapter/scene
 *   - Uses Toonplay 9-step generation pipeline
 *   - Generates 7-12 panels per scene with optimized images
 *   - Automatic quality evaluation and improvement (up to 2 cycles)
 *   - Creates 2 optimized AVIF variants per panel
 *   - Stores panels in database with full metadata
 *
 * Requirements:
 *   - Valid ID from respective table (stories, parts, chapters, scenes)
 *   - Writer authentication (uses writer@fictures.xyz from .auth/user.json)
 *   - Environment variables in .env.local
 *   - Dev server running on port 3000
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
const partId = getArgValue("--part");
const chapterId = getArgValue("--chapter");
const sceneId = getArgValue("--scene");
const limitArg = getArgValue("--limit");
const limit = limitArg ? Number.parseInt(limitArg, 10) : undefined;

const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const isVerbose = args.includes("--verbose");

// Validate arguments - at least one ID must be provided
if (!storyId && !partId && !chapterId && !sceneId) {
    console.error("❌ Error: At least one ID must be provided");
    console.log("\nUsage:");
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --scene <sceneId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --chapter <chapterId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --part <partId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-toonplay.ts --story <storyId>",
    );
    console.log("\nOptions:");
    console.log("  --dry-run    Preview without generating");
    console.log("  --force      Regenerate even if panels exist");
    console.log("  --verbose    Show detailed logs");
    console.log("  --limit <n>  Limit number of scenes to process");
    process.exit(1);
}

// Load writer authentication
let writer: ReturnType<typeof loadProfile>;
let writerApiKey: string;
try {
    writer = loadProfile("writer");
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
        "\nRun: dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts",
    );
    process.exit(1);
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

console.log("🎬 Toonplay Generation Script");
console.log("=".repeat(60));
console.log();
console.log(`🌍 Environment: ${getEnvDisplayName()}`);
console.log(`🔑 Using writer API key: ${writerApiKey.slice(0, 20)}...`);
if (storyId) console.log(`📖 Story ID: ${storyId}`);
if (partId) console.log(`📑 Part ID: ${partId}`);
if (chapterId) console.log(`📄 Chapter ID: ${chapterId}`);
if (sceneId) console.log(`🎭 Scene ID: ${sceneId}`);
if (limit) console.log(`🔢 Limit: ${limit} scenes`);
console.log(`Mode: ${isDryRun ? "DRY RUN" : "EXECUTE"}`);
if (isForce) console.log("Force: Enabled (will regenerate existing panels)");
if (isVerbose) console.log("Verbose: Enabled");
console.log();

interface SceneInfo {
    id: string;
    title: string;
    chapterId: string;
    storyId: string;
    comicStatus: string | null;
    content: string | null;
}

/**
 * Get all scenes to process based on the provided ID level
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
        allScenes.push({
            id: scene.id,
            title: scene.title,
            chapterId: scene.chapterId,
            storyId: scene.storyId,
            comicStatus: scene.comicStatus,
            content: scene.content,
        });
    } else if (chapterId) {
        // All scenes in a chapter
        const chapter = await db.query.chapters.findFirst({
            where: eq(chapters.id, chapterId),
        });
        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }

        const chapterScenes = await db.query.scenes.findMany({
            where: eq(scenes.chapterId, chapterId),
            orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
            limit: limit,
        });

        for (const scene of chapterScenes) {
            allScenes.push({
                id: scene.id,
                title: scene.title,
                chapterId: scene.chapterId,
                storyId: scene.storyId,
                comicStatus: scene.comicStatus,
                content: scene.content,
            });
        }

        console.log(`📄 Chapter: "${chapter.title}"`);
        console.log(`   Found ${chapterScenes.length} scene(s)`);
    } else if (partId) {
        // All scenes in all chapters of a part
        const part = await db.query.parts.findFirst({
            where: eq(parts.id, partId),
        });
        if (!part) {
            throw new Error(`Part not found: ${partId}`);
        }

        const partChapters = await db.query.chapters.findMany({
            where: eq(chapters.partId, partId),
            orderBy: (chapters, { asc }) => [asc(chapters.chapterNumber)],
        });

        console.log(`📑 Part: "${part.title}"`);
        console.log(`   Found ${partChapters.length} chapter(s)`);

        let totalScenes = 0;
        for (const chapter of partChapters) {
            const chapterScenes = await db.query.scenes.findMany({
                where: eq(scenes.chapterId, chapter.id),
                orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
            });

            for (const scene of chapterScenes) {
                if (limit && totalScenes >= limit) break;
                allScenes.push({
                    id: scene.id,
                    title: scene.title,
                    chapterId: scene.chapterId,
                    storyId: scene.storyId,
                    comicStatus: scene.comicStatus,
                    content: scene.content,
                });
                totalScenes++;
            }

            if (limit && totalScenes >= limit) break;
        }

        console.log(`   Total scenes: ${allScenes.length}`);
    } else if (storyId) {
        // All scenes in all chapters of all parts of a story
        const story = await db.query.stories.findFirst({
            where: eq(stories.id, storyId),
        });
        if (!story) {
            throw new Error(`Story not found: ${storyId}`);
        }

        const storyParts = await db.query.parts.findMany({
            where: eq(parts.storyId, storyId),
            orderBy: (parts, { asc }) => [asc(parts.partNumber)],
        });

        console.log(`📖 Story: "${story.title}"`);
        console.log(`   Found ${storyParts.length} part(s)`);

        let totalScenes = 0;
        for (const part of storyParts) {
            const partChapters = await db.query.chapters.findMany({
                where: eq(chapters.partId, part.id),
                orderBy: (chapters, { asc }) => [asc(chapters.chapterNumber)],
            });

            for (const chapter of partChapters) {
                const chapterScenes = await db.query.scenes.findMany({
                    where: eq(scenes.chapterId, chapter.id),
                    orderBy: (scenes, { asc }) => [asc(scenes.sceneNumber)],
                });

                for (const scene of chapterScenes) {
                    if (limit && totalScenes >= limit) break;
                    allScenes.push({
                        id: scene.id,
                        title: scene.title,
                        chapterId: scene.chapterId,
                        storyId: scene.storyId,
                        comicStatus: scene.comicStatus,
                        content: scene.content,
                    });
                    totalScenes++;
                }

                if (limit && totalScenes >= limit) break;
            }

            if (limit && totalScenes >= limit) break;
        }

        console.log(`   Total scenes: ${allScenes.length}`);
    }

    return allScenes;
}

/**
 * Generate toonplay for a single scene
 */
async function generateToonplayForScene(
    scene: SceneInfo,
    index: number,
    total: number,
): Promise<{
    success: boolean;
    panelCount: number;
    score: number;
    duration: number;
    error?: string;
}> {
    console.log(
        `\n[${index + 1}/${total}] 🎨 Generating toonplay for: "${scene.title}"`,
    );

    if (!scene.content || scene.content.length < 50) {
        console.log("   ⚠️  Skipping: Scene has insufficient content");
        return {
            success: false,
            panelCount: 0,
            score: 0,
            duration: 0,
            error: "Insufficient content",
        };
    }

    const startTime = Date.now();

    try {
        // Call the Toonplay generation API (Server-Sent Events)
        const response = await fetch(`${API_BASE}/studio/api/novels/toonplay`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${writerApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sceneId: scene.id,
                force: isForce,
            }),
        });

        if (!response.ok) {
            const error = await response
                .json()
                .catch(() => ({ message: "Unknown error" }));
            throw new Error(
                `API error: ${response.status} - ${error.message || error.error}`,
            );
        }

        // Process SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let lastCompleteEvent: {
            totalPanels?: number;
            finalScore?: number;
            improvementIterations?: number;
        } | null = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const data = line.slice(6);

                    if (data === "[DONE]") {
                        continue;
                    }

                    try {
                        const event = JSON.parse(data);

                        // Display progress
                        if (event.type === "progress" && isVerbose) {
                            console.log(
                                `   [${event.step}/${event.totalSteps}] ${event.message}`,
                            );
                        } else if (event.type === "panel" && isVerbose) {
                            console.log(
                                `   ✓ Panel ${event.panelNumber}: ${event.shotType}`,
                            );
                        } else if (event.type === "evaluation") {
                            console.log(
                                `   📊 Quality Score: ${event.score.toFixed(2)}/5.0`,
                            );
                        } else if (event.type === "improvement") {
                            console.log(
                                `   🔄 Improvement cycle ${event.iteration}/2`,
                            );
                        } else if (event.type === "complete") {
                            lastCompleteEvent = event;
                            console.log(
                                `   ✅ Complete: ${event.totalPanels} panels`,
                            );
                        } else if (event.type === "error") {
                            throw new Error(event.message);
                        }
                    } catch (_parseError) {
                        if (isVerbose) {
                            console.log(`   Warning: Could not parse event`);
                        }
                    }
                }
            }
        }

        const duration = (Date.now() - startTime) / 1000;

        return {
            success: true,
            panelCount: lastCompleteEvent?.totalPanels || 0,
            score: lastCompleteEvent?.finalScore || 0,
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
            score: 0,
            duration,
            error: errorMessage,
        };
    }
}

/**
 * Display dry run preview
 */
function displayDryRunPreview(scenesToProcess: SceneInfo[]) {
    console.log("\n🔍 DRY RUN - Preview of what would be generated:\n");

    console.log("Scenes to process:");
    for (let i = 0; i < scenesToProcess.length; i++) {
        const scene = scenesToProcess[i];
        const status = scene.comicStatus || "none";
        const hasContent = scene.content && scene.content.length >= 50;
        console.log(
            `  ${i + 1}. "${scene.title}" (comic: ${status}, content: ${hasContent ? "✓" : "✗"})`,
        );
    }

    const withContent = scenesToProcess.filter(
        (s) => s.content && s.content.length >= 50,
    );
    const withExisting = scenesToProcess.filter(
        (s) => s.comicStatus === "completed",
    );

    console.log(`\nSummary:`);
    console.log(`  Total scenes: ${scenesToProcess.length}`);
    console.log(`  With content: ${withContent.length}`);
    console.log(`  Already completed: ${withExisting.length}`);

    if (withExisting.length > 0 && !isForce) {
        console.log(
            `\n⚠️  ${withExisting.length} scene(s) already have toonplay.`,
        );
        console.log("   Use --force to regenerate them.");
    }

    console.log("\nGeneration Pipeline (per scene):");
    console.log("  1. Analyze scene content and structure");
    console.log("  2. Generate panel summaries (7-12 panels)");
    console.log("  3. Create panel content (dialogue, SFX, narrative)");
    console.log("  4. Generate panel images (9:16 ratio for webtoons)");
    console.log("  5. Optimize images (2 AVIF variants)");
    console.log("  6. Evaluate quality (5-category rubric)");
    console.log("  7. Improve if needed (up to 2 cycles)");
    console.log("  8. Store panels in database");
    console.log("  9. Update scene comic status");

    console.log("\nExpected Output per scene:");
    console.log("  - 7-12 comic panels with images");
    console.log("  - 2 optimized AVIF variants per image");
    console.log("  - Quality score: 3.0+/5.0");
    console.log("  - Generation time: 5-15 minutes");

    const estimatedTime = withContent.length * 10; // ~10 minutes per scene
    console.log(`\nEstimated total time: ${estimatedTime} minutes`);

    console.log("\n💡 Remove --dry-run flag to execute generation");
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

        // 2. Dry run preview
        if (isDryRun) {
            displayDryRunPreview(scenesToProcess);
            process.exit(0);
        }

        // 3. Filter scenes
        const scenesWithContent = scenesToProcess.filter(
            (s) => s.content && s.content.length >= 50,
        );

        if (scenesWithContent.length === 0) {
            console.log("\n⚠️  No scenes with sufficient content found");
            process.exit(0);
        }

        // 4. Generate toonplay for each scene
        const results: Array<{
            sceneId: string;
            title: string;
            success: boolean;
            panelCount: number;
            score: number;
            duration: number;
            error?: string;
        }> = [];

        const totalStartTime = Date.now();

        for (let i = 0; i < scenesWithContent.length; i++) {
            const scene = scenesWithContent[i];

            // Skip if already completed and not forcing
            if (scene.comicStatus === "completed" && !isForce) {
                console.log(
                    `\n[${i + 1}/${scenesWithContent.length}] ⏭️  Skipping "${scene.title}" (already completed)`,
                );
                results.push({
                    sceneId: scene.id,
                    title: scene.title,
                    success: true,
                    panelCount: 0,
                    score: 0,
                    duration: 0,
                    error: "Skipped (already completed)",
                });
                continue;
            }

            const result = await generateToonplayForScene(
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

        // 5. Summary
        console.log("\n" + "=".repeat(60));
        console.log("📊 Generation Summary");
        console.log("=".repeat(60));

        const successful = results.filter(
            (r) => r.success && !r.error?.includes("Skipped"),
        );
        const skipped = results.filter((r) => r.error?.includes("Skipped"));
        const failed = results.filter((r) => !r.success);

        console.log(`\nResults:`);
        console.log(`  ✅ Successful: ${successful.length}`);
        console.log(`  ⏭️  Skipped: ${skipped.length}`);
        console.log(`  ❌ Failed: ${failed.length}`);

        if (successful.length > 0) {
            const totalPanels = successful.reduce(
                (sum, r) => sum + r.panelCount,
                0,
            );
            const avgScore =
                successful.reduce((sum, r) => sum + r.score, 0) /
                successful.length;

            console.log(`\nGenerated:`);
            console.log(`  Total panels: ${totalPanels}`);
            console.log(`  Average quality: ${avgScore.toFixed(2)}/5.0`);
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
