#!/usr/bin/env tsx

/**
 * Comic Panel Generation Script
 *
 * Generates comic panels for scenes using the Toonplay system.
 * Supports generating panels for a single scene or all scenes in a story/part/chapter.
 *
 * Usage:
 *   # Generate for a single scene
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --scene <sceneId>
 *
 *   # Generate for all scenes in a story
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --story <storyId>
 *
 *   # Generate for all scenes in a part
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --part <partId>
 *
 *   # Generate for all scenes in a chapter
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --chapter <chapterId>
 *
 * Options:
 *   --scene <id>     Generate panels for a specific scene
 *   --story <id>     Generate panels for all scenes in a story
 *   --part <id>      Generate panels for all scenes in a part
 *   --chapter <id>   Generate panels for all scenes in a chapter
 *   --dry-run        Preview what would be generated without actually creating panels
 *   --force          Regenerate panels even if they already exist
 *   --verbose        Show detailed generation logs
 *
 * Features:
 *   - Validates scene existence and retrieves scene data
 *   - Uses Toonplay 9-step generation pipeline
 *   - Generates 7-12 panels per scene with optimized images
 *   - Automatic quality evaluation and improvement (up to 2 cycles)
 *   - Creates 4 optimized image variants per panel (AVIF + JPEG × 2 sizes)
 *   - Stores panels in database with full metadata
 *
 * Requirements:
 *   - Valid ID from database (story, part, chapter, or scene)
 *   - Writer authentication (uses writer@fictures.xyz from .auth/user.json)
 *   - Environment variables in .env.local
 */

import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";
import {
    chapters,
    parts,
    scenes,
    stories,
} from "../src/lib/schemas/database/index.js";
import { loadProfile } from "../src/lib/utils/auth-loader.js";
import { getEnvDisplayName } from "../src/lib/utils/environment.js";

// Parse command line arguments
const args = process.argv.slice(2);

// Parse ID type arguments
function getArgValue(flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return undefined;
}

const storyId = getArgValue("--story");
const partId = getArgValue("--part");
const chapterId = getArgValue("--chapter");
const sceneId = getArgValue("--scene");
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const isVerbose = args.includes("--verbose");
const isHelp = args.includes("--help") || args.includes("-h");

// Show help
if (isHelp) {
    console.log(`
Comic Panel Generation Script

Generates comic panels for scenes using the Toonplay system.

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts [OPTIONS]

ID Options (one required):
  --scene <id>     Generate panels for a specific scene
  --story <id>     Generate panels for all scenes in a story
  --part <id>      Generate panels for all scenes in a part
  --chapter <id>   Generate panels for all scenes in a chapter

Other Options:
  --dry-run        Preview without generating
  --force          Regenerate even if panels exist
  --verbose        Show detailed logs
  --help, -h       Show this help message

Examples:
  # Generate for single scene
  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --scene scene_abc123

  # Generate for entire story
  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --story story_xyz789

  # Preview generation for a chapter
  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --chapter chapter_def456 --dry-run

  # Force regenerate all panels in a part
  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --part part_ghi012 --force
`);
    process.exit(0);
}

// Validate that at least one ID type is provided
if (!storyId && !partId && !chapterId && !sceneId) {
    console.error(
        "❌ Error: One ID type is required (--story, --part, --chapter, or --scene)",
    );
    console.log("\nUsage:");
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --scene <sceneId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --story <storyId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --part <partId>",
    );
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/generate-comic-panels.ts --chapter <chapterId>",
    );
    console.log("\nOptions:");
    console.log("  --dry-run    Preview without generating");
    console.log("  --force      Regenerate even if panels exist");
    console.log("  --verbose    Show detailed logs");
    console.log("  --help       Show full help message");
    process.exit(1);
}

// Load writer authentication from environment-aware auth
let writer: ReturnType<typeof loadProfile>;
try {
    writer = loadProfile("writer");
    if (!writer?.apiKey) {
        throw new Error("Writer API key not found");
    }
} catch (error) {
    console.error("❌ Error loading authentication:", (error as Error).message);
    console.log(
        "\nRun: dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts",
    );
    process.exit(1);
}

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const API_KEY = writer.apiKey;

// Type definitions
interface SceneData {
    id: string;
    title: string;
    chapterId: string;
    storyId: string;
    content: string | null;
    imageUrl: string | null;
    comicStatus: string | null;
    orderIndex: number;
}

interface PanelData {
    id: string;
    sceneId: string;
    panelNumber: number;
}

interface GenerationResult {
    finalScore?: number;
    improvementIterations?: number;
    totalPanels?: number;
}

/**
 * Fetch all scenes for a story
 */
async function fetchScenesForStory(storyId: string): Promise<SceneData[]> {
    if (isVerbose) {
        console.log(`\n🔍 Fetching all scenes for story: ${storyId}`);
    }

    // Verify story exists
    const storyData = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId));
    if (storyData.length === 0) {
        throw new Error(`Story not found: ${storyId}`);
    }

    // Get all parts for the story
    const partsData = await db
        .select()
        .from(parts)
        .where(eq(parts.storyId, storyId));
    if (partsData.length === 0) {
        throw new Error(`No parts found for story: ${storyId}`);
    }

    // Get all chapters for these parts
    const partIds = partsData.map((p) => p.id);
    const chaptersData = await db
        .select()
        .from(chapters)
        .where(
            partIds.length === 1
                ? eq(chapters.partId, partIds[0])
                : eq(chapters.partId, partIds[0]), // Will need IN clause for multiple
        );

    // For multiple parts, fetch chapters for each
    let allChapters: typeof chaptersData = [];
    for (const partData of partsData) {
        const partChapters = await db
            .select()
            .from(chapters)
            .where(eq(chapters.partId, partData.id));
        allChapters = [...allChapters, ...partChapters];
    }

    if (allChapters.length === 0) {
        throw new Error(`No chapters found for story: ${storyId}`);
    }

    // Get all scenes for these chapters
    let allScenes: SceneData[] = [];
    for (const chapter of allChapters) {
        const chapterScenes = await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapter.id));

        const formattedScenes: SceneData[] = chapterScenes.map((s) => ({
            id: s.id,
            title: s.title,
            chapterId: s.chapterId,
            storyId: storyId,
            content: s.content,
            imageUrl: s.imageUrl,
            comicStatus: s.comicStatus,
            orderIndex: s.orderIndex,
        }));

        allScenes = [...allScenes, ...formattedScenes];
    }

    if (isVerbose) {
        console.log(`✅ Found ${allScenes.length} scenes in story`);
    }

    return allScenes;
}

/**
 * Fetch all scenes for a part
 */
async function fetchScenesForPart(partId: string): Promise<SceneData[]> {
    if (isVerbose) {
        console.log(`\n🔍 Fetching all scenes for part: ${partId}`);
    }

    // Verify part exists and get story ID
    const partData = await db.select().from(parts).where(eq(parts.id, partId));
    if (partData.length === 0) {
        throw new Error(`Part not found: ${partId}`);
    }

    const storyIdFromPart = partData[0].storyId;

    // Get all chapters for this part
    const chaptersData = await db
        .select()
        .from(chapters)
        .where(eq(chapters.partId, partId));

    if (chaptersData.length === 0) {
        throw new Error(`No chapters found for part: ${partId}`);
    }

    // Get all scenes for these chapters
    let allScenes: SceneData[] = [];
    for (const chapter of chaptersData) {
        const chapterScenes = await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapter.id));

        const formattedScenes: SceneData[] = chapterScenes.map((s) => ({
            id: s.id,
            title: s.title,
            chapterId: s.chapterId,
            storyId: storyIdFromPart,
            content: s.content,
            imageUrl: s.imageUrl,
            comicStatus: s.comicStatus,
            orderIndex: s.orderIndex,
        }));

        allScenes = [...allScenes, ...formattedScenes];
    }

    if (isVerbose) {
        console.log(`✅ Found ${allScenes.length} scenes in part`);
    }

    return allScenes;
}

/**
 * Fetch all scenes for a chapter
 */
async function fetchScenesForChapter(chapterId: string): Promise<SceneData[]> {
    if (isVerbose) {
        console.log(`\n🔍 Fetching all scenes for chapter: ${chapterId}`);
    }

    // Verify chapter exists and get story ID
    const chapterData = await db
        .select()
        .from(chapters)
        .where(eq(chapters.id, chapterId));
    if (chapterData.length === 0) {
        throw new Error(`Chapter not found: ${chapterId}`);
    }

    // Get part to find story ID
    const partData = await db
        .select()
        .from(parts)
        .where(eq(parts.id, chapterData[0].partId));
    const storyIdFromChapter = partData[0]?.storyId || "";

    // Get all scenes for this chapter
    const scenesData = await db
        .select()
        .from(scenes)
        .where(eq(scenes.chapterId, chapterId));

    if (scenesData.length === 0) {
        throw new Error(`No scenes found for chapter: ${chapterId}`);
    }

    const formattedScenes: SceneData[] = scenesData.map((s) => ({
        id: s.id,
        title: s.title,
        chapterId: s.chapterId,
        storyId: storyIdFromChapter,
        content: s.content,
        imageUrl: s.imageUrl,
        comicStatus: s.comicStatus,
        orderIndex: s.orderIndex,
    }));

    if (isVerbose) {
        console.log(`✅ Found ${formattedScenes.length} scenes in chapter`);
    }

    return formattedScenes;
}

/**
 * Fetch scene data from the database
 */
async function fetchScene(sceneId: string): Promise<SceneData> {
    if (isVerbose) {
        console.log(`\n🔍 Fetching scene data for: ${sceneId}`);
    }

    try {
        const response = await fetch(
            `${API_BASE}/api/studio/scenes/${sceneId}`,
            {
                headers: {
                    "x-api-key": API_KEY,
                    "Content-Type": "application/json",
                },
            },
        );

        if (!response.ok) {
            const error = (await response
                .json()
                .catch(() => ({ message: "Unknown error" }))) as { message: string };
            throw new Error(`API error: ${response.status} - ${error.message}`);
        }

        const scene = (await response.json()) as SceneData;

        if (isVerbose) {
            console.log("✅ Scene data retrieved:");
            console.log(`   Title: ${scene.title}`);
            console.log(`   Chapter: ${scene.chapterId}`);
            console.log(`   Content: ${scene.content?.substring(0, 100)}...`);
            console.log(`   Image: ${scene.imageUrl ? "Yes" : "No"}`);
            console.log(`   Comic Status: ${scene.comicStatus || "none"}`);
        }

        return scene;
    } catch (error) {
        throw new Error(`Failed to fetch scene: ${(error as Error).message}`);
    }
}

/**
 * Check if panels already exist for this scene
 */
async function checkExistingPanels(sceneId: string): Promise<PanelData[]> {
    if (isVerbose) {
        console.log(`\n🔍 Checking for existing panels...`);
    }

    try {
        const response = await fetch(
            `${API_BASE}/api/studio/scenes/${sceneId}/panels`,
            {
                headers: {
                    "x-api-key": API_KEY,
                    "Content-Type": "application/json",
                },
            },
        );

        if (!response.ok) {
            if (response.status === 404) {
                if (isVerbose) {
                    console.log("   No existing panels found");
                }
                return [];
            }
            throw new Error(`API error: ${response.status}`);
        }

        const panels = (await response.json()) as PanelData[];

        if (isVerbose && panels.length > 0) {
            console.log(`   Found ${panels.length} existing panels`);
        }

        return panels;
    } catch (error) {
        if (isVerbose) {
            console.log(
                `   Error checking panels: ${(error as Error).message}`,
            );
        }
        return [];
    }
}

/**
 * Generate comic panels using Toonplay system
 */
async function generatePanels(
    sceneId: string,
    scene: SceneData,
): Promise<GenerationResult | null> {
    console.log(`\n🎨 Generating comic panels for scene: ${scene.title}`);
    console.log("   Using Toonplay 9-step pipeline with quality evaluation\n");

    const startTime = Date.now();

    try {
        // Call the Toonplay generation API (Server-Sent Events)
        const response = await fetch(`${API_BASE}/api/studio/toonplay`, {
            method: "POST",
            headers: {
                "x-api-key": API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sceneId: sceneId,
            }),
        });

        if (!response.ok) {
            const error = (await response
                .json()
                .catch(() => ({ message: "Unknown error" }))) as { message: string };
            throw new Error(`API error: ${response.status} - ${error.message}`);
        }

        // Process SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let buffer = "";
        let lastEvent: GenerationResult | null = null;

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
                        lastEvent = event;

                        // Display progress
                        if (event.type === "progress") {
                            console.log(
                                `   [${event.step}/${event.totalSteps}] ${event.message}`,
                            );
                        } else if (event.type === "panel") {
                            console.log(
                                `   ✓ Panel ${event.panelNumber}: ${event.shotType} - ${event.content?.substring(0, 50)}...`,
                            );
                        } else if (event.type === "evaluation") {
                            console.log(
                                `   📊 Quality Score: ${event.score.toFixed(2)}/5.0`,
                            );
                            if (event.score < 3.0) {
                                console.log(
                                    `   ⚠️  Below threshold, starting improvement cycle...`,
                                );
                            }
                        } else if (event.type === "improvement") {
                            console.log(
                                `   🔄 Improvement cycle ${event.iteration}/2 completed`,
                            );
                        } else if (event.type === "complete") {
                            console.log(`\n✅ Generation complete!`);
                            console.log(
                                `   Total panels: ${event.totalPanels}`,
                            );
                            console.log(
                                `   Final quality score: ${event.finalScore.toFixed(2)}/5.0`,
                            );
                            console.log(
                                `   Improvement iterations: ${event.improvementIterations}`,
                            );
                        } else if (event.type === "error") {
                            throw new Error(event.message);
                        }
                    } catch (_parseError) {
                        if (isVerbose) {
                            console.log(
                                `   Warning: Could not parse event: ${data}`,
                            );
                        }
                    }
                }
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n⏱️  Generation time: ${duration}s`);

        return lastEvent;
    } catch (error) {
        throw new Error(`Panel generation failed: ${(error as Error).message}`);
    }
}

/**
 * Display dry run preview for multiple scenes
 */
function displayDryRunPreview(
    allScenes: SceneData[],
    existingPanelsMap: Map<string, PanelData[]>,
): void {
    console.log("\n🔍 DRY RUN - Preview of what would be generated:\n");

    const totalScenes = allScenes.length;
    let scenesWithPanels = 0;
    let totalExistingPanels = 0;

    for (const [, panels] of existingPanelsMap) {
        if (panels.length > 0) {
            scenesWithPanels++;
            totalExistingPanels += panels.length;
        }
    }

    console.log("Generation Summary:");
    console.log(`  Total scenes to process: ${totalScenes}`);
    console.log(`  Scenes with existing panels: ${scenesWithPanels}`);
    console.log(`  Total existing panels: ${totalExistingPanels}`);

    if (scenesWithPanels > 0 && !isForce) {
        console.log(
            `\n⚠️  Warning: ${scenesWithPanels} scenes already have panels`,
        );
        console.log("   Use --force to regenerate them");
    }

    console.log("\nScenes to generate:");
    for (const scene of allScenes) {
        const existing = existingPanelsMap.get(scene.id) || [];
        const status =
            existing.length > 0
                ? isForce
                    ? "⚠️ Will regenerate"
                    : "⏭️ Skip (has panels)"
                : "✅ Will generate";
        console.log(`  ${status} - ${scene.title} (${scene.id})`);
    }

    console.log("\nGeneration Pipeline (per scene):");
    console.log("  1. Analyze scene content and structure");
    console.log("  2. Generate panel summaries (7-12 panels)");
    console.log("  3. Create panel content (dialogue, SFX, narrative)");
    console.log("  4. Generate panel images (1344×768px, 7:4 ratio)");
    console.log("  5. Optimize images (4 variants: AVIF + JPEG × 2 sizes)");
    console.log("  6. Evaluate quality (5-category rubric)");
    console.log("  7. Improve if needed (up to 2 cycles)");
    console.log("  8. Store panels in database");
    console.log("  9. Update scene comic status");

    console.log("\nExpected Output (per scene):");
    console.log("  - 7-12 comic panels with images");
    console.log("  - 4 optimized variants per image");
    console.log("  - Quality score: 3.0+/5.0");
    console.log("  - Generation time: 5-15 minutes");

    const scenesToGenerate = isForce
        ? totalScenes
        : totalScenes - scenesWithPanels;
    const estimatedTime = scenesToGenerate * 10; // ~10 minutes per scene
    console.log(
        `\nEstimated total time: ${estimatedTime}-${estimatedTime * 1.5} minutes`,
    );

    console.log("\n💡 Remove --dry-run flag to execute generation");
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    console.log("🎬 Comic Panel Generation Script");
    console.log("================================\n");
    console.log(`🌍 Environment: ${getEnvDisplayName()}`);

    // Display what we're generating for
    if (storyId) {
        console.log(`Target: Story ${storyId}`);
    } else if (partId) {
        console.log(`Target: Part ${partId}`);
    } else if (chapterId) {
        console.log(`Target: Chapter ${chapterId}`);
    } else if (sceneId) {
        console.log(`Target: Scene ${sceneId}`);
    }

    console.log(`Mode: ${isDryRun ? "DRY RUN" : "EXECUTE"}`);
    if (isForce)
        console.log("Force: Enabled (will regenerate existing panels)");
    if (isVerbose) console.log("Verbose: Enabled");

    try {
        // 1. Fetch scenes based on ID type
        let allScenes: SceneData[] = [];

        if (storyId) {
            allScenes = await fetchScenesForStory(storyId);
        } else if (partId) {
            allScenes = await fetchScenesForPart(partId);
        } else if (chapterId) {
            allScenes = await fetchScenesForChapter(chapterId);
        } else if (sceneId) {
            const scene = await fetchScene(sceneId);
            allScenes = [scene];
        }

        if (allScenes.length === 0) {
            throw new Error("No scenes found to process");
        }

        console.log(`\n📋 Found ${allScenes.length} scene(s) to process`);

        // 2. Check existing panels for all scenes
        const existingPanelsMap = new Map<string, PanelData[]>();
        for (const scene of allScenes) {
            const panels = await checkExistingPanels(scene.id);
            existingPanelsMap.set(scene.id, panels);
        }

        // 3. Dry run preview
        if (isDryRun) {
            displayDryRunPreview(allScenes, existingPanelsMap);
            process.exit(0);
        }

        // 4. Generate panels for each scene
        const results: {
            scene: SceneData;
            result: GenerationResult | null;
            skipped: boolean;
        }[] = [];
        const startTime = Date.now();

        for (let i = 0; i < allScenes.length; i++) {
            const scene = allScenes[i];
            const existingPanels = existingPanelsMap.get(scene.id) || [];

            console.log(`\n${"=".repeat(60)}`);
            console.log(
                `Processing scene ${i + 1}/${allScenes.length}: ${scene.title}`,
            );
            console.log(`${"=".repeat(60)}`);

            // Check if should skip
            if (existingPanels.length > 0 && !isForce) {
                console.log(
                    `⏭️  Skipping - ${existingPanels.length} panels already exist`,
                );
                console.log("   Use --force to regenerate");
                results.push({ scene, result: null, skipped: true });
                continue;
            }

            if (existingPanels.length > 0 && isForce) {
                console.log(
                    `⚠️  Force mode: Regenerating ${existingPanels.length} existing panels`,
                );
            }

            // Generate panels
            const result = await generatePanels(scene.id, scene);
            results.push({ scene, result, skipped: false });
        }

        // 5. Final summary
        const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        const generated = results.filter((r) => !r.skipped).length;
        const skipped = results.filter((r) => r.skipped).length;

        console.log(`\n${"=".repeat(60)}`);
        console.log("📊 GENERATION COMPLETE");
        console.log(`${"=".repeat(60)}\n`);

        console.log("Summary:");
        console.log(`  Total scenes: ${allScenes.length}`);
        console.log(`  Generated: ${generated}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`  Total time: ${totalDuration} minutes`);

        if (generated > 0) {
            console.log("\nGenerated scenes:");
            for (const { scene, result, skipped: wasSkipped } of results) {
                if (!wasSkipped && result) {
                    console.log(
                        `  ✅ ${scene.title}: ${result.totalPanels || "?"} panels, score ${result.finalScore?.toFixed(2) || "N/A"}/5.0`,
                    );
                }
            }
        }

        if (skipped > 0) {
            console.log("\nSkipped scenes (already have panels):");
            for (const { scene, skipped: wasSkipped } of results) {
                if (wasSkipped) {
                    const panels = existingPanelsMap.get(scene.id) || [];
                    console.log(
                        `  ⏭️ ${scene.title}: ${panels.length} existing panels`,
                    );
                }
            }
        }

        // Get story ID for view URL
        const viewStoryId = storyId || allScenes[0]?.storyId;
        if (viewStoryId) {
            console.log(
                `\n✨ View comic at: ${API_BASE}/comics/${viewStoryId}`,
            );
        }
    } catch (error) {
        console.error("\n❌ Error:", (error as Error).message);
        if (isVerbose) {
            console.error("\nStack trace:", (error as Error).stack);
        }
        process.exit(1);
    }
}

// Execute
main();
