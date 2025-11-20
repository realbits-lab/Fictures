#!/usr/bin/env tsx

/**
 * Generate Full Pipeline Script
 *
 * Runs the complete story generation pipeline in sequence:
 * 1. generate-story.ts - Create story structure and content
 * 2. generate-images.ts - Generate images for story, characters, settings, scenes
 * 3. generate-toonplay.ts - Generate toonplay panel specifications
 * 4. generate-comic-panels.ts - Generate comic panel images
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts [options]
 *
 * Options:
 *   --prompt <text>           User prompt for story generation
 *   --characters <n>          Number of characters (default: 2)
 *   --settings <n>            Number of settings (default: 2)
 *   --parts <n>               Number of parts (default: 1)
 *   --chapters-per-part <n>   Chapters per part (default: 2)
 *   --scenes-per-chapter <n>  Scenes per chapter (default: 3)
 *   --language <lang>         Story language (default: English)
 *   --skip-images             Skip image generation step
 *   --skip-toonplay           Skip toonplay generation step
 *   --skip-comic-panels       Skip comic panel generation step
 *   --skip-publish            Skip publishing step
 *   --help, -h                Show this help message
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid API key in .auth/user.json
 *   - Environment variables: DATABASE_URL, BLOB_READ_WRITE_TOKEN, GOOGLE_GENERATIVE_AI_API_KEY
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { getEnvDisplayName } from "../src/lib/utils/environment.js";

// Parse command line arguments
const args = process.argv.slice(2);
const helpFlag = args.includes("--help") || args.includes("-h");

function getArgValue(flag: string, defaultValue: string): string {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return defaultValue;
}

function hasFlag(flag: string): boolean {
    return args.includes(flag);
}

// Show help
if (helpFlag) {
    console.log(`
Generate Full Pipeline Script

Runs the complete story generation pipeline in sequence:
1. generate-story.ts - Create story structure and content
2. generate-images.ts - Generate images for story, characters, settings, scenes
3. generate-toonplay.ts - Generate toonplay panel specifications
4. generate-comic-panels.ts - Generate comic panel images

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts [OPTIONS]

Options:
  --prompt <text>           User prompt for story generation
  --characters <n>          Number of characters (default: 2)
  --settings <n>            Number of settings (default: 2)
  --parts <n>               Number of parts (default: 1)
  --chapters-per-part <n>   Chapters per part (default: 2)
  --scenes-per-chapter <n>  Scenes per chapter (default: 3)
  --language <lang>         Story language (default: English)
  --skip-images             Skip image generation step
  --skip-toonplay           Skip toonplay generation step
  --skip-comic-panels       Skip comic panel generation step
  --skip-publish            Skip publishing step
  --help, -h                Show this help message

Examples:
  # Default pipeline (minimal story)
  dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts

  # Custom story with more content
  dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts \\
    --prompt "A detective solving mysteries" \\
    --characters 3 \\
    --parts 2

  # Skip comic panel generation
  dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts --skip-comic-panels

  # Skip publishing (keep as draft)
  dotenv --file .env.local run pnpm exec tsx scripts/generate-full-pipeline.ts --skip-publish
`);
    process.exit(0);
}

// Configuration
const config = {
    prompt: getArgValue("--prompt", ""),
    characters: getArgValue("--characters", "2"),
    settings: getArgValue("--settings", "2"),
    parts: getArgValue("--parts", "1"),
    chaptersPerPart: getArgValue("--chapters-per-part", "2"),
    scenesPerChapter: getArgValue("--scenes-per-chapter", "3"),
    language: getArgValue("--language", "English"),
    skipImages: hasFlag("--skip-images"),
    skipToonplay: hasFlag("--skip-toonplay"),
    skipComicPanels: hasFlag("--skip-comic-panels"),
    skipPublish: hasFlag("--skip-publish"),
};

console.log("🚀 Full Pipeline Generation Script");
console.log("=".repeat(60));
console.log();
console.log(`🌍 Environment: ${getEnvDisplayName()}`);
console.log();
console.log("📋 Configuration:");
console.log(`   Characters: ${config.characters}`);
console.log(`   Settings: ${config.settings}`);
console.log(`   Parts: ${config.parts}`);
console.log(`   Chapters per Part: ${config.chaptersPerPart}`);
console.log(`   Scenes per Chapter: ${config.scenesPerChapter}`);
console.log(`   Language: ${config.language}`);
if (config.prompt) {
    console.log(`   Prompt: ${config.prompt.substring(0, 50)}...`);
}
console.log();
console.log("📊 Pipeline Steps:");
console.log(`   1. Story Generation: ✅`);
console.log(
    `   2. Image Generation: ${config.skipImages ? "⏭️ Skipped" : "✅"}`,
);
console.log(
    `   3. Toonplay Generation: ${config.skipToonplay ? "⏭️ Skipped" : "✅"}`,
);
console.log(
    `   4. Comic Panel Generation: ${config.skipComicPanels ? "⏭️ Skipped" : "✅"}`,
);
console.log(
    `   5. Publish All Content: ${config.skipPublish ? "⏭️ Skipped" : "✅"}`,
);
console.log();

// Run a script and capture output
function runScript(
    scriptPath: string,
    scriptArgs: string[],
    stepName: string,
): Promise<{ success: boolean; output: string; storyId?: string }> {
    return new Promise((resolve) => {
        console.log(`\n${"=".repeat(60)}`);
        console.log(`🔄 Step: ${stepName}`);
        console.log(`${"=".repeat(60)}\n`);

        const startTime = Date.now();
        let output = "";

        const child = spawn(
            "pnpm",
            ["exec", "tsx", scriptPath, ...scriptArgs],
            {
                stdio: ["inherit", "pipe", "pipe"],
                env: process.env,
            },
        );

        child.stdout?.on("data", (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });

        child.stderr?.on("data", (data) => {
            const text = data.toString();
            output += text;
            process.stderr.write(text);
        });

        child.on("close", (code) => {
            const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            console.log(`\n⏱️  ${stepName} completed in ${duration} minutes`);

            // Try to extract story ID from output
            let storyId: string | undefined;
            const storyIdMatch = output.match(/story_[A-Za-z0-9-]+/);
            if (storyIdMatch) {
                storyId = storyIdMatch[0];
            }

            resolve({
                success: code === 0,
                output,
                storyId,
            });
        });

        child.on("error", (error) => {
            console.error(`\n❌ Error running ${stepName}:`, error.message);
            resolve({
                success: false,
                output: error.message,
            });
        });
    });
}

// Main pipeline execution
async function runPipeline() {
    const startTime = Date.now();
    const results: { step: string; success: boolean; duration: number }[] = [];
    let storyId: string | undefined;

    // Step 1: Generate Story
    const storyArgs: string[] = [];
    if (config.prompt) storyArgs.push("--prompt", config.prompt);
    storyArgs.push("--characters", config.characters);
    storyArgs.push("--settings", config.settings);
    storyArgs.push("--parts", config.parts);
    storyArgs.push("--chapters-per-part", config.chaptersPerPart);
    storyArgs.push("--scenes-per-chapter", config.scenesPerChapter);
    storyArgs.push("--language", config.language);

    const storyStart = Date.now();
    const storyResult = await runScript(
        "scripts/generate-story.ts",
        storyArgs,
        "Story Generation",
    );
    results.push({
        step: "Story Generation",
        success: storyResult.success,
        duration: (Date.now() - storyStart) / 1000 / 60,
    });

    if (!storyResult.success) {
        console.error("\n❌ Story generation failed. Aborting pipeline.");
        process.exit(1);
    }

    storyId = storyResult.storyId;
    if (!storyId) {
        console.error("\n❌ Could not extract story ID. Aborting pipeline.");
        process.exit(1);
    }

    console.log(`\n✅ Story created: ${storyId}`);

    // Step 2: Generate Images
    if (!config.skipImages) {
        const imageStart = Date.now();
        const imageResult = await runScript(
            "scripts/generate-images.ts",
            ["--story-id", storyId],
            "Image Generation",
        );
        results.push({
            step: "Image Generation",
            success: imageResult.success,
            duration: (Date.now() - imageStart) / 1000 / 60,
        });

        if (!imageResult.success) {
            console.error(
                "\n⚠️ Image generation failed. Continuing with pipeline...",
            );
        }
    } else {
        console.log("\n⏭️  Skipping Image Generation");
    }

    // Step 3: Generate Toonplay
    if (!config.skipToonplay) {
        const toonplayStart = Date.now();
        const toonplayResult = await runScript(
            "scripts/generate-toonplay.ts",
            ["--story", storyId],
            "Toonplay Generation",
        );
        results.push({
            step: "Toonplay Generation",
            success: toonplayResult.success,
            duration: (Date.now() - toonplayStart) / 1000 / 60,
        });

        if (!toonplayResult.success) {
            console.error(
                "\n⚠️ Toonplay generation failed. Continuing with pipeline...",
            );
        }
    } else {
        console.log("\n⏭️  Skipping Toonplay Generation");
    }

    // Step 4: Generate Comic Panels
    if (!config.skipComicPanels) {
        const comicStart = Date.now();
        const comicResult = await runScript(
            "scripts/generate-comic-panels.ts",
            ["--story", storyId],
            "Comic Panel Generation",
        );
        results.push({
            step: "Comic Panel Generation",
            success: comicResult.success,
            duration: (Date.now() - comicStart) / 1000 / 60,
        });

        if (!comicResult.success) {
            console.error("\n⚠️ Comic panel generation failed.");
        }
    } else {
        console.log("\n⏭️  Skipping Comic Panel Generation");
    }

    // Step 5: Publish All Content
    if (!config.skipPublish) {
        const publishStart = Date.now();
        const publishResult = await runScript(
            "scripts/publish-all.ts",
            ["--story-id", storyId],
            "Publish All Content",
        );
        results.push({
            step: "Publish All Content",
            success: publishResult.success,
            duration: (Date.now() - publishStart) / 1000 / 60,
        });

        if (!publishResult.success) {
            console.error("\n⚠️ Publishing failed.");
        }
    } else {
        console.log("\n⏭️  Skipping Publish All Content");
    }

    // Final Summary
    const totalDuration = (Date.now() - startTime) / 1000 / 60;

    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 PIPELINE COMPLETE");
    console.log(`${"=".repeat(60)}\n`);

    console.log("Results:");
    for (const result of results) {
        const status = result.success ? "✅" : "❌";
        console.log(
            `  ${status} ${result.step}: ${result.duration.toFixed(1)} min`,
        );
    }

    console.log();
    console.log(`⏱️  Total time: ${totalDuration.toFixed(1)} minutes`);
    console.log();
    console.log(`📖 Story ID: ${storyId}`);
    console.log();
    console.log("🔗 View your story:");
    console.log(`   Novel: http://localhost:3000/novels/${storyId}`);
    console.log(`   Comic: http://localhost:3000/comics/${storyId}`);
    console.log(`   Edit:  http://localhost:3000/studio/edit/story/${storyId}`);
    console.log();

    // Save report
    const logDir = "logs";
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(
        logDir,
        `full-pipeline-${new Date().toISOString().replace(/:/g, "-").split(".")[0]}.json`,
    );
    fs.writeFileSync(
        logFile,
        JSON.stringify(
            {
                storyId,
                config,
                results,
                totalDuration,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        ),
    );
    console.log(`📄 Report saved to: ${logFile}`);
    console.log();

    // Exit with appropriate code
    const allSuccess = results.every((r) => r.success);
    process.exit(allSuccess ? 0 : 1);
}

// Run the pipeline
runPipeline().catch((error) => {
    console.error("❌ Pipeline error:", error);
    process.exit(1);
});
