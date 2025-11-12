#!/usr/bin/env tsx

/**
 * Test Image Generation Script (No Vercel Blob)
 *
 * Tests image generation via web API without uploading to Vercel Blob.
 * Generates images for different aspect ratios and saves locally.
 *
 * Features:
 * - Uses writer@fictures.xyz API key for authentication
 * - Calls test API endpoint that skips Vercel Blob upload
 * - Validates image dimensions and aspect ratios
 * - Saves images to test-output/ directory
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/test-image-generation.ts
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid writer API key in .auth/user.json
 *   - AI_SERVER_API_KEY in .env.local
 *   - IMAGE_GENERATION_PROVIDER=ai-server
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = "test-output";

// Image test configurations
interface ImageTestConfig {
    name: string;
    prompt: string;
    aspectRatio: "1:1" | "16:9" | "9:16" | "2:3" | "7:4";
    expectedWidth?: number;
    expectedHeight?: number;
}

const IMAGE_TESTS: ImageTestConfig[] = [
    {
        name: "story_cover",
        prompt: "A mysterious book cover with magical elements, cinematic widescreen composition, dramatic lighting",
        aspectRatio: "16:9",
    },
    {
        name: "character_portrait",
        prompt: "Portrait of a young warrior with determined expression, square composition, detailed facial features",
        aspectRatio: "1:1",
    },
    {
        name: "setting_visual",
        prompt: "Ancient library with towering bookshelves, mysterious atmosphere, square composition",
        aspectRatio: "1:1",
    },
    {
        name: "scene_illustration",
        prompt: "Epic battle scene in a fantasy castle, cinematic widescreen, dramatic action",
        aspectRatio: "16:9",
    },
];

console.log("🧪 Image Generation Test Script (No Vercel Blob)");
console.log("=".repeat(60));
console.log();

// Load writer API key
let writerApiKey: string;
try {
    const writer = loadProfile("writer");
    writerApiKey = writer.apiKey;

    if (!writerApiKey) {
        throw new Error("Writer API key not found");
    }

    console.log(`🌍 Environment: ${getEnvDisplayName()}`);
    console.log(`🔑 Using writer API key: ${writerApiKey.slice(0, 20)}...`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}/`);
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
 * Calculate aspect ratio from dimensions
 */
function calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
}

/**
 * Generate image via test API
 */
async function generateImage(config: ImageTestConfig): Promise<{
    imageUrl: string;
    width: number;
    height: number;
    provider: string;
    model: string;
}> {
    console.log(`   🎨 Generating ${config.name}...`);
    console.log(`      Prompt: ${config.prompt.substring(0, 80)}...`);
    console.log(`      Aspect Ratio: ${config.aspectRatio}`);

    const response = await fetch(`${BASE_URL}/studio/api/test/generate-image`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${writerApiKey}`,
        },
        body: JSON.stringify({
            prompt: config.prompt,
            aspectRatio: config.aspectRatio,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
    }

    const result = await response.json();
    return result;
}

/**
 * Download and save image
 */
async function downloadAndSaveImage(
    imageUrl: string,
    filename: string,
): Promise<Buffer> {
    // Handle data URLs (base64)
    if (imageUrl.startsWith("data:")) {
        const base64Data = imageUrl.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const filepath = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(filepath, buffer);
        return buffer;
    }

    // Handle HTTP URLs
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filepath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    return buffer;
}

/**
 * Validate image
 */
async function validateImage(
    buffer: Buffer,
    expectedRatio: string,
): Promise<{
    width: number;
    height: number;
    actualRatio: string;
    isValid: boolean;
    message: string;
}> {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.width!;
    const height = metadata.height!;
    const actualRatio = calculateAspectRatio(width, height);

    // AI server generates 1664×928 for 16:9, which is 52:29 ratio (very close to 16:9)
    // Accept 52:29 as valid for 16:9
    const ratioMapping: Record<string, string[]> = {
        "16:9": ["16:9", "52:29"], // 52:29 ≈ 16:9 (AI server actual output)
        "1:1": ["1:1"],
        "9:16": ["9:16"],
        "2:3": ["2:3"],
    };

    const validRatios = ratioMapping[expectedRatio] || [expectedRatio];
    const isValid = validRatios.includes(actualRatio);

    const message = isValid
        ? `✅ Validation PASSED - ${width}×${height} (${actualRatio})`
        : `⚠️  Aspect ratio mismatch - Got ${actualRatio}, expected ${validRatios.join(" or ")}`;

    return { width, height, actualRatio, isValid, message };
}

/**
 * Main execution
 */
async function main() {
    try {
        const totalTests = IMAGE_TESTS.length;
        let passed = 0;
        let failed = 0;

        for (const config of IMAGE_TESTS) {
            console.log(`\n📸 Test: ${config.name}`);
            console.log("─".repeat(60));

            try {
                // Generate image
                const result = await generateImage(config);
                console.log(`      ✅ Generated successfully`);
                console.log(`      Provider: ${result.provider}`);
                console.log(`      Model: ${result.model}`);
                console.log(
                    `      Dimensions: ${result.width}×${result.height}`,
                );

                // Download and save
                const filename = `test_${config.name}_${Date.now()}.png`;
                const buffer = await downloadAndSaveImage(
                    result.imageUrl,
                    filename,
                );
                console.log(`      ✅ Saved: ${filename}`);

                // Validate
                const validation = await validateImage(
                    buffer,
                    config.aspectRatio,
                );
                console.log(`      ${validation.message}`);

                if (validation.isValid) {
                    passed++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error(
                    `      ❌ Error: ${error instanceof Error ? error.message : String(error)}`,
                );
                failed++;
            }
        }

        // Summary
        console.log("\n" + "=".repeat(60));
        console.log("✅ Test Complete!");
        console.log(`   Total tests: ${totalTests}`);
        console.log(`   ✅ Passed: ${passed}`);
        if (failed > 0) {
            console.log(`   ❌ Failed: ${failed}`);
        }
        console.log(`   Saved to: ${OUTPUT_DIR}/`);
        console.log("=".repeat(60));
    } catch (error) {
        console.error(
            "\n❌ Test failed:",
            error instanceof Error ? error.message : String(error),
        );
        if (error instanceof Error && error.stack) {
            console.error("\nStack trace:");
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run test
main();
