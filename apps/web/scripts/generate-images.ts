#!/usr/bin/env tsx

/**
 * Image Generation Script
 *
 * Generates images for story, characters, settings, and scenes using the current story in the database.
 * Images are saved locally to test-output directory (not uploaded to Vercel Blob).
 *
 * Features:
 * - Fetches story data from database
 * - Generates images via API with writer authentication
 * - Downloads and saves images locally
 * - Validates image dimensions and aspect ratios against documentation specs
 * - Supports all image types: story, character, setting, scene
 * - Reports validation results (pass/fail) for each image
 *
 * Validation Checks:
 * - Story cover: 16:9 aspect ratio, 1792×1024 pixels
 * - Character portrait: 1:1 aspect ratio, 1024×1024 pixels
 * - Setting visual: 1:1 aspect ratio, 1024×1024 pixels
 * - Scene image: 16:9 aspect ratio, 1792×1024 pixels
 * - Validation specs from: apps/web/docs/image/image-generation.md
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-images.ts [options]
 *
 * Options:
 *   --story-id <id>    Generate images for specific story (default: first story found)
 *   --type <type>      Generate only specific type: story, character, setting, scene (default: all)
 *   --limit <n>        Limit number of items per type (default: unlimited)
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid writer API key in .auth/user.json
 *   - At least one story in the database
 */

import fs from "node:fs";
import path from "node:path";
import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import sharp from "sharp";
import * as schema from "../src/lib/schemas/database";
import {
    chapters,
    characters,
    scenes,
    settings,
    stories,
} from "../src/lib/schemas/database";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

// Initialize database with schema
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = "test-output";

/**
 * Image specifications from docs/image/ documentation
 * Reference: apps/web/docs/image/image-generation.md
 */
interface ImageSpec {
    aspectRatio: string;
    width: number;
    height: number;
    alternativeSpecs?: ImageSpec[]; // For types with multiple valid specs
}

const IMAGE_SPECIFICATIONS: Record<string, ImageSpec> = {
    story: {
        aspectRatio: "16:9",
        width: 1792,
        height: 1024,
    },
    character: {
        aspectRatio: "1:1",
        width: 1024,
        height: 1024,
    },
    setting: {
        aspectRatio: "1:1",
        width: 1024,
        height: 1024,
    },
    scene: {
        aspectRatio: "16:9",
        width: 1792,
        height: 1024,
    },
    "comic-panel": {
        aspectRatio: "9:16",
        width: 1024,
        height: 1792,
        alternativeSpecs: [
            {
                aspectRatio: "2:3",
                width: 1024,
                height: 1536,
            },
        ],
    },
};

// Parse command line arguments
const args = process.argv.slice(2);
const getArgValue = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : undefined;
};

const storyIdArg = getArgValue("--story-id");
const typeArg = getArgValue("--type") as
    | "story"
    | "character"
    | "setting"
    | "scene"
    | undefined;
const limitArg = getArgValue("--limit");
const limit = limitArg ? parseInt(limitArg, 10) : undefined;

console.log("🎨 Image Generation Script");
console.log("=".repeat(60));
console.log();

// Load writer API key
let writer: ReturnType<typeof loadProfile>;
let writerApiKey: string;
try {
    writer = loadProfile("writer");
    writerApiKey = writer.apiKey;

    if (!writerApiKey) {
        throw new Error("Writer API key not found");
    }

    console.log(`🌍 Environment: ${getEnvDisplayName()}`);
    console.log(`🔑 Using writer API key: ${writerApiKey.slice(0, 20)}...`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}/`);
    if (storyIdArg) console.log(`📖 Story ID: ${storyIdArg}`);
    if (typeArg) console.log(`🎯 Type filter: ${typeArg}`);
    if (limit) console.log(`🔢 Limit: ${limit} per type`);
    console.log();
} catch (error) {
    console.error("❌ Error loading authentication:");
    console.error(
        `   ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error();
    console.error("💡 Run this command to create authentication:");
    console.error(
        "   dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts",
    );
    process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Validation result interface
 */
interface ValidationResult {
    isValid: boolean;
    dimensions: { width: number; height: number };
    actualRatio: string;
    expectedSpec: ImageSpec;
    errors: string[];
}

/**
 * Calculate aspect ratio from dimensions
 */
function calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

/**
 * Validate image dimensions and aspect ratio against documentation specs
 */
async function validateImage(
    buffer: Buffer,
    imageType: "story" | "character" | "setting" | "scene" | "comic-panel",
): Promise<ValidationResult> {
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || !metadata.height) {
        throw new Error("Unable to read image dimensions");
    }
    const width = metadata.width;
    const height = metadata.height;
    const actualRatio = calculateAspectRatio(width, height);

    const spec = IMAGE_SPECIFICATIONS[imageType];
    if (!spec) {
        return {
            isValid: false,
            dimensions: { width, height },
            actualRatio,
            expectedSpec: { aspectRatio: "unknown", width: 0, height: 0 },
            errors: [`Unknown image type: ${imageType}`],
        };
    }

    const errors: string[] = [];

    // Check primary spec
    let matchesSpec = width === spec.width && height === spec.height;

    // Check alternative specs if primary doesn't match
    if (!matchesSpec && spec.alternativeSpecs) {
        matchesSpec = spec.alternativeSpecs.some(
            (altSpec) => width === altSpec.width && height === altSpec.height,
        );
    }

    if (!matchesSpec) {
        errors.push(
            `Dimensions mismatch: got ${width}×${height}, expected ${spec.width}×${spec.height}`,
        );
        if (spec.alternativeSpecs) {
            const alternatives = spec.alternativeSpecs
                .map((s) => `${s.width}×${s.height}`)
                .join(" or ");
            errors[errors.length - 1] += ` (or ${alternatives})`;
        }
    }

    // Check aspect ratio
    const expectedRatios = [spec.aspectRatio];
    if (spec.alternativeSpecs) {
        expectedRatios.push(...spec.alternativeSpecs.map((s) => s.aspectRatio));
    }

    if (!expectedRatios.includes(actualRatio)) {
        errors.push(
            `Aspect ratio mismatch: got ${actualRatio}, expected ${expectedRatios.join(" or ")}`,
        );
    }

    return {
        isValid: errors.length === 0,
        dimensions: { width, height },
        actualRatio,
        expectedSpec: spec,
        errors,
    };
}

/**
 * Download image from URL and save to file
 */
async function downloadImage(url: string, filepath: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
    return buffer;
}

/**
 * Generate image via API
 */
async function generateImage(params: {
    storyId: string;
    imageType: "story" | "character" | "setting" | "scene";
    targetData: unknown;
    chapterId?: string;
    sceneId?: string;
}): Promise<string> {
    console.log(`   🎨 Generating ${params.imageType} image...`);

    const response = await fetch(`${BASE_URL}/studio/api/images`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${writerApiKey}`,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
    }

    const result = await response.json();
    return result.originalUrl || result.blobUrl;
}

/**
 * Main execution
 */
async function main() {
    try {
        // Fetch story from database
        console.log("📖 Fetching story data from database...");

        let story: Awaited<ReturnType<typeof db.query.stories.findFirst>>;
        if (storyIdArg) {
            story = await db.query.stories.findFirst({
                where: eq(stories.id, storyIdArg),
            });
            if (!story) {
                throw new Error(`Story not found: ${storyIdArg}`);
            }
        } else {
            story = await db.query.stories.findFirst();
            if (!story) {
                throw new Error(
                    "No stories found in database. Create a story first.",
                );
            }
        }

        console.log(`   ✅ Found story: "${story.title}" (${story.id})`);
        console.log();

        let totalImages = 0;
        let validImages = 0;
        let invalidImages = 0;

        // Generate story cover image
        if (!typeArg || typeArg === "story") {
            console.log("📸 Generating story cover image...");
            try {
                const imageUrl = await generateImage({
                    storyId: story.id,
                    imageType: "story",
                    targetData: {
                        title: story.title,
                        genre: story.genre,
                        summary: story.summary,
                        tone: story.tone,
                    },
                });

                const filename = `story_${story.id}_cover.png`;
                const filepath = path.join(OUTPUT_DIR, filename);
                const buffer = await downloadImage(imageUrl, filepath);
                console.log(`   ✅ Saved: ${filename}`);

                // Validate image
                const validation = await validateImage(buffer, "story");
                if (validation.isValid) {
                    console.log(`   ✅ Validation PASSED`);
                    console.log(
                        `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height}`,
                    );
                    console.log(
                        `      Aspect Ratio: ${validation.actualRatio}`,
                    );
                    validImages++;
                } else {
                    console.log(`   ❌ Validation FAILED`);
                    console.log(
                        `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height} (expected ${validation.expectedSpec.width}×${validation.expectedSpec.height})`,
                    );
                    console.log(
                        `      Aspect Ratio: ${validation.actualRatio} (expected ${validation.expectedSpec.aspectRatio})`,
                    );
                    for (const error of validation.errors) {
                        console.log(`      • ${error}`);
                    }
                    invalidImages++;
                }

                totalImages++;
            } catch (error) {
                console.error(
                    `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                );
            }
            console.log();
        }

        // Generate character images
        if (!typeArg || typeArg === "character") {
            console.log("👤 Fetching characters...");
            const storyCharacters = await db.query.characters.findMany({
                where: eq(characters.storyId, story.id),
                limit: limit,
            });

            console.log(`   Found ${storyCharacters.length} character(s)`);
            console.log();

            for (const char of storyCharacters) {
                console.log(`   Generating image for character: ${char.name}`);
                try {
                    const imageUrl = await generateImage({
                        storyId: story.id,
                        imageType: "character",
                        targetData: {
                            name: char.name,
                            physicalDescription: char.physicalDescription || {
                                appearance: char.summary || "",
                                distinctiveFeatures: "",
                                style: "",
                            },
                            personality: char.personality || { traits: [] },
                            visualStyle: char.visualStyle,
                        },
                    });

                    const filename = `character_${char.id}_${char.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
                    const filepath = path.join(OUTPUT_DIR, filename);
                    const buffer = await downloadImage(imageUrl, filepath);
                    console.log(`   ✅ Saved: ${filename}`);

                    // Validate image
                    const validation = await validateImage(buffer, "character");
                    if (validation.isValid) {
                        console.log(`   ✅ Validation PASSED`);
                        console.log(
                            `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height}`,
                        );
                        console.log(
                            `      Aspect Ratio: ${validation.actualRatio}`,
                        );
                        validImages++;
                    } else {
                        console.log(`   ❌ Validation FAILED`);
                        console.log(
                            `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height} (expected ${validation.expectedSpec.width}×${validation.expectedSpec.height})`,
                        );
                        console.log(
                            `      Aspect Ratio: ${validation.actualRatio} (expected ${validation.expectedSpec.aspectRatio})`,
                        );
                        for (const error of validation.errors) {
                            console.log(`      • ${error}`);
                        }
                        invalidImages++;
                    }

                    totalImages++;
                } catch (error) {
                    console.error(
                        `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
                console.log();
            }
        }

        // Generate setting images
        if (!typeArg || typeArg === "setting") {
            console.log("🏞️  Fetching settings...");
            const storySettings = await db.query.settings.findMany({
                where: eq(settings.storyId, story.id),
                limit: limit,
            });

            console.log(`   Found ${storySettings.length} setting(s)`);
            console.log();

            for (const setting of storySettings) {
                console.log(`   Generating image for setting: ${setting.name}`);
                try {
                    const imageUrl = await generateImage({
                        storyId: story.id,
                        imageType: "setting",
                        targetData: {
                            name: setting.name,
                            description: setting.description,
                            mood: setting.mood,
                            sensory: setting.sensory || {
                                sight: [],
                                sound: [],
                            },
                            visualStyle: setting.visualStyle,
                            architecturalStyle: setting.architecturalStyle,
                            colorPalette: setting.colorPalette || [],
                        },
                    });

                    const filename = `setting_${setting.id}_${setting.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`;
                    const filepath = path.join(OUTPUT_DIR, filename);
                    const buffer = await downloadImage(imageUrl, filepath);
                    console.log(`   ✅ Saved: ${filename}`);

                    // Validate image
                    const validation = await validateImage(buffer, "setting");
                    if (validation.isValid) {
                        console.log(`   ✅ Validation PASSED`);
                        console.log(
                            `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height}`,
                        );
                        console.log(
                            `      Aspect Ratio: ${validation.actualRatio}`,
                        );
                        validImages++;
                    } else {
                        console.log(`   ❌ Validation FAILED`);
                        console.log(
                            `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height} (expected ${validation.expectedSpec.width}×${validation.expectedSpec.height})`,
                        );
                        console.log(
                            `      Aspect Ratio: ${validation.actualRatio} (expected ${validation.expectedSpec.aspectRatio})`,
                        );
                        for (const error of validation.errors) {
                            console.log(`      • ${error}`);
                        }
                        invalidImages++;
                    }

                    totalImages++;
                } catch (error) {
                    console.error(
                        `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                    );
                }
                console.log();
            }
        }

        // Generate scene images
        if (!typeArg || typeArg === "scene") {
            console.log("🎬 Fetching scenes...");

            // Get chapters first
            const storyChapters = await db.query.chapters.findMany({
                where: eq(chapters.storyId, story.id),
            });

            console.log(`   Found ${storyChapters.length} chapter(s)`);

            for (const chapter of storyChapters) {
                const chapterScenes = await db.query.scenes.findMany({
                    where: eq(scenes.chapterId, chapter.id),
                    limit: limit,
                });

                console.log(
                    `   Chapter "${chapter.title}": ${chapterScenes.length} scene(s)`,
                );
                console.log();

                for (const scene of chapterScenes) {
                    console.log(
                        `   Generating image for scene: ${scene.title}`,
                    );
                    try {
                        const imageUrl = await generateImage({
                            storyId: story.id,
                            imageType: "scene",
                            chapterId: chapter.id,
                            sceneId: scene.id,
                            targetData: {
                                title: scene.title,
                                summary: scene.summary,
                                content: scene.content,
                                emotionalBeat: scene.emotionalBeat,
                                sensoryAnchors: scene.sensoryAnchors || [],
                            },
                        });

                        const filename = `scene_${scene.id}_${scene.title
                            .replace(/[^a-z0-9]/gi, "_")
                            .toLowerCase()
                            .substring(0, 30)}.png`;
                        const filepath = path.join(OUTPUT_DIR, filename);
                        const buffer = await downloadImage(imageUrl, filepath);
                        console.log(`   ✅ Saved: ${filename}`);

                        // Validate image
                        const validation = await validateImage(buffer, "scene");
                        if (validation.isValid) {
                            console.log(`   ✅ Validation PASSED`);
                            console.log(
                                `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height}`,
                            );
                            console.log(
                                `      Aspect Ratio: ${validation.actualRatio}`,
                            );
                            validImages++;
                        } else {
                            console.log(`   ❌ Validation FAILED`);
                            console.log(
                                `      Dimensions: ${validation.dimensions.width}×${validation.dimensions.height} (expected ${validation.expectedSpec.width}×${validation.expectedSpec.height})`,
                            );
                            console.log(
                                `      Aspect Ratio: ${validation.actualRatio} (expected ${validation.expectedSpec.aspectRatio})`,
                            );
                            for (const error of validation.errors) {
                                console.log(`      • ${error}`);
                            }
                            invalidImages++;
                        }

                        totalImages++;
                    } catch (error) {
                        console.error(
                            `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                        );
                    }
                    console.log();
                }
            }
        }

        // Summary
        console.log("=".repeat(60));
        console.log(`✅ Generation complete!`);
        console.log(`   Total images generated: ${totalImages}`);
        console.log(`   Images validated: ${validImages + invalidImages}`);
        console.log(`   ✅ Validation passed: ${validImages}`);
        if (invalidImages > 0) {
            console.log(`   ❌ Validation failed: ${invalidImages}`);
        }
        console.log(`   Saved to: ${OUTPUT_DIR}/`);
        console.log("=".repeat(60));

        if (invalidImages > 0) {
            console.log();
            console.log("⚠️  WARNING: Some images failed validation.");
            console.log("   Check the documentation at apps/web/docs/image/");
            console.log("   Image specifications may have changed.");
        }
    } catch (error) {
        console.error(
            "\n❌ Script failed:",
            error instanceof Error ? error.message : String(error),
        );
        if (error instanceof Error && error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run script
main();
