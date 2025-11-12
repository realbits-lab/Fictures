#!/usr/bin/env tsx

/**
 * Remove Story Script
 *
 * DESTRUCTIVE OPERATION: Permanently deletes a single story and all related data:
 * - Database: story, parts, chapters, scenes, characters, settings
 * - Vercel Blob: All files under "stories/{storyId}/" prefix
 *
 * This script uses the writer or manager account's API key to call the removal endpoint.
 *
 * Safety Features:
 * - Requires story ID as argument
 * - Requires --confirm flag to proceed
 * - Requires stories:write or admin:all scope
 * - Shows preview mode without --confirm
 * - Provides detailed deletion report
 *
 * Usage:
 *   # Preview mode (shows what will be deleted)
 *   dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID
 *
 *   # Actual removal (destructive!)
 *   dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID --confirm
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Writer or Manager API key in .auth/user.json
 *   - stories:write or admin:all scope
 */

import fs from "fs";
import path from "path";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

const BASE_URL = "http://localhost:3000";

// Parse command line arguments
const args = process.argv.slice(2);
const storyId = args.find((arg) => !arg.startsWith("--"));
const confirmFlag = args.includes("--confirm");

console.log("🗑️  Remove Story Script");
console.log("=".repeat(60));
console.log();

// Validate story ID
if (!storyId) {
    console.error("❌ Error: Story ID is required");
    console.error();
    console.error("Usage:");
    console.error(
        "  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts STORY_ID [--confirm]",
    );
    console.error();
    console.error("Examples:");
    console.error("  # Preview mode");
    console.error(
        "  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts story_abc123",
    );
    console.error();
    console.error("  # Execute removal");
    console.error(
        "  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts story_abc123 --confirm",
    );
    console.error();
    process.exit(1);
}

// Load writer API key from environment-aware auth
let profile;
let apiKey;
try {
    // Try writer first, fallback to manager
    try {
        profile = loadProfile("writer");
    } catch {
        profile = loadProfile("manager");
    }

    apiKey = profile.apiKey;

    if (!apiKey) {
        throw new Error("API key not found");
    }

    console.log(`🌍 Environment: ${getEnvDisplayName()}`);
    console.log(`🔑 Using API key: ${apiKey.slice(0, 20)}...`);
    console.log(`📖 Story ID: ${storyId}`);
} catch (error) {
    console.error("❌ Error loading authentication:");
    console.error(`   ${error.message}`);
    console.error();
    console.error("💡 Run this command to create authentication:");
    console.error(
        "   dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts",
    );
    process.exit(1);
}

console.log();

// Check for confirmation flag
if (!confirmFlag) {
    console.log("⚠️  PREVIEW MODE - No data will be deleted");
    console.log();
    console.log(
        `This script will permanently delete story "${storyId}" and all related data:`,
    );
    console.log("  📊 Database:");
    console.log("     • Story record");
    console.log("     • All parts, chapters, and scenes");
    console.log("     • All characters and settings");
    console.log();
    console.log("  📦 Vercel Blob:");
    console.log(`     • All files under "stories/${storyId}/" prefix`);
    console.log("     • Story cover image and variants");
    console.log("     • Scene images and all variants");
    console.log("     • Character portraits and variants");
    console.log("     • Setting visuals and variants");
    console.log();
    console.log("⚠️  WARNING: This operation is IRREVERSIBLE!");
    console.log();
    console.log("To proceed with the removal, run:");
    console.log(
        `  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts ${storyId} --confirm`,
    );
    console.log();
    process.exit(0);
}

console.log("⚠️  DESTRUCTIVE MODE - Proceeding with story removal");
console.log();

// Confirmation delay
console.log("🚨 Starting deletion in 5 seconds...");
console.log("   Press Ctrl+C to cancel");
console.log();

await new Promise((resolve) => setTimeout(resolve, 5000));

console.log("🔥 Executing removal...");
console.log();

async function removeStory() {
    try {
        const response = await fetch(`${BASE_URL}/studio/api/remove-story`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                storyId,
                confirm: true,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 401) {
                console.error("❌ Authentication failed");
                console.error("   Ensure API key is valid");
                console.error();
                console.error(
                    "💡 Run: dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts",
                );
                process.exit(1);
            }

            if (response.status === 403) {
                console.error("❌ Insufficient permissions");
                console.error(
                    `   ${result.message || "stories:write or admin:all scope required"}`,
                );
                console.error();
                console.error(
                    "💡 This operation requires a writer or manager account",
                );
                process.exit(1);
            }

            if (response.status === 404) {
                console.error("❌ Story not found");
                console.error(`   Story ID "${storyId}" does not exist`);
                console.error();
                process.exit(1);
            }

            throw new Error(
                result.error ||
                    result.message ||
                    `API Error (${response.status})`,
            );
        }

        // Success - display detailed report
        console.log("✅ REMOVAL COMPLETE\n");
        console.log("=".repeat(60));
        console.log();
        console.log("📊 Deletion Report:");
        console.log();

        const { report } = result;

        console.log("Story Information:");
        console.log(`  • ID:              ${report.story.id}`);
        console.log(`  • Title:           ${report.story.title}`);
        console.log();

        console.log("Database Records Deleted:");
        console.log(
            `  • Parts:           ${report.database.parts.toLocaleString()}`,
        );
        console.log(
            `  • Chapters:        ${report.database.chapters.toLocaleString()}`,
        );
        console.log(
            `  • Scenes:          ${report.database.scenes.toLocaleString()}`,
        );
        console.log(
            `  • Characters:      ${report.database.characters.toLocaleString()}`,
        );
        console.log(
            `  • Settings:        ${report.database.settings.toLocaleString()}`,
        );
        console.log();

        console.log("Blob Files Deleted:");
        console.log(
            `  • Total Files:     ${report.blob.files.toLocaleString()}`,
        );
        console.log(
            `  • Batches:         ${report.blob.batches.toLocaleString()}`,
        );
        console.log();

        console.log("Timestamp:", result.timestamp);
        console.log();
        console.log("=".repeat(60));
        console.log();

        // Save report to logs
        const logDir = "logs";
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(
            logDir,
            `remove-story-${storyId}-${new Date().toISOString().replace(/:/g, "-").split(".")[0]}.json`,
        );
        fs.writeFileSync(logFile, JSON.stringify(result, null, 2));

        console.log(`📄 Report saved to: ${logFile}`);
        console.log();
    } catch (error) {
        console.error("❌ Removal failed:", error.message);
        console.error();

        if (error.stack) {
            console.error("Stack trace:");
            console.error(error.stack);
        }

        process.exit(1);
    }
}

// Execute removal
await removeStory();
