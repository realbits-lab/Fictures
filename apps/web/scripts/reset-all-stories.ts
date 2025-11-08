#!/usr/bin/env tsx

/**
 * Reset All Story Data Script
 *
 * DESTRUCTIVE OPERATION: Permanently deletes ALL story data from:
 * - Database: stories, parts, chapters, scenes, characters, settings, AI interactions
 * - Vercel Blob: All files under "stories/" prefix
 *
 * This script uses the manager account's API key to call the reset endpoint.
 *
 * Safety Features:
 * - Requires --confirm flag to proceed
 * - Requires admin:all scope (manager account only)
 * - Shows preview mode without --confirm
 * - Provides detailed deletion report
 *
 * Usage:
 *   # Preview mode (shows what will be deleted)
 *   dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts
 *
 *   # Actual reset (destructive!)
 *   dotenv --file .env.local run pnpm exec tsx scripts/reset-all-stories.ts --confirm
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Manager API key in .auth/user.json
 *   - admin:all scope on manager account
 */

import fs from "fs";
import path from "path";
import { loadProfile } from "../src/lib/utils/auth-loader";
import { getEnvDisplayName } from "../src/lib/utils/environment";

const BASE_URL = "http://localhost:3000";

// Parse command line arguments
const args = process.argv.slice(2);
const confirmFlag = args.includes("--confirm");

console.log("🗑️  Reset All Story Data Script");
console.log("=".repeat(60));
console.log();

// Load manager API key from environment-aware auth
let manager;
let managerApiKey;
try {
	manager = loadProfile("manager");
	managerApiKey = manager.apiKey;

	if (!managerApiKey) {
		throw new Error("Manager API key not found");
	}

	console.log(`🌍 Environment: ${getEnvDisplayName()}`);
	console.log(`🔑 Using manager API key: ${managerApiKey.slice(0, 20)}...`);
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
	console.log("This script will permanently delete:");
	console.log("  📊 Database:");
	console.log("     • All stories and related data");
	console.log("     • Parts, chapters, scenes");
	console.log("     • Characters and settings");
	console.log("     • AI interactions");
	console.log();
	console.log("  📦 Vercel Blob:");
	console.log('     • All files under "stories/" prefix');
	console.log("     • Story cover images");
	console.log("     • Scene images and all variants");
	console.log("     • Character portraits");
	console.log("     • Setting visuals");
	console.log();
	console.log("⚠️  WARNING: This operation is IRREVERSIBLE!");
	console.log();
	console.log("To proceed with the reset, run:");
	console.log(
		"  dotenv --file .env.local run node scripts/reset-all-stories.mjs --confirm",
	);
	console.log();
	process.exit(0);
}

console.log("⚠️  DESTRUCTIVE MODE - Proceeding with data reset");
console.log();

// Confirmation delay
console.log("🚨 Starting deletion in 5 seconds...");
console.log("   Press Ctrl+C to cancel");
console.log();

await new Promise((resolve) => setTimeout(resolve, 5000));

console.log("🔥 Executing reset...");
console.log();

async function resetAllStories() {
	try {
		const response = await fetch(`${BASE_URL}/studio/api/reset-all`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${managerApiKey}`,
			},
			body: JSON.stringify({
				confirm: true,
			}),
		});

		const result = await response.json();

		if (!response.ok) {
			if (response.status === 401) {
				console.error("❌ Authentication failed");
				console.error("   Ensure manager API key is valid");
				console.error();
				console.error(
					"💡 Run: dotenv --file .env.local run node scripts/setup-auth-users.mjs",
				);
				process.exit(1);
			}

			if (response.status === 403) {
				console.error("❌ Insufficient permissions");
				console.error(`   ${result.message || "admin:all scope required"}`);
				console.error();
				console.error(
					"💡 This operation requires a manager account with admin:all scope",
				);
				process.exit(1);
			}

			throw new Error(
				result.error || result.message || `API Error (${response.status})`,
			);
		}

		// Success - display detailed report
		console.log("✅ RESET COMPLETE\n");
		console.log("=".repeat(60));
		console.log();
		console.log("📊 Deletion Report:");
		console.log();

		const { report } = result;

		console.log("Database Records Deleted:");
		console.log(
			`  • Stories:         ${report.database.stories.toLocaleString()}`,
		);
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
		console.log(
			`  • AI Interactions: ${report.database.aiInteractions.toLocaleString()}`,
		);
		console.log();

		console.log("Blob Files Deleted:");
		console.log(`  • Total Files:     ${report.blob.files.toLocaleString()}`);
		console.log(`  • Batches:         ${report.blob.batches.toLocaleString()}`);
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
			`reset-all-${new Date().toISOString().replace(/:/g, "-").split(".")[0]}.json`,
		);
		fs.writeFileSync(logFile, JSON.stringify(result, null, 2));

		console.log(`📄 Report saved to: ${logFile}`);
		console.log();
	} catch (error) {
		console.error("❌ Reset failed:", error.message);
		console.error();

		if (error.stack) {
			console.error("Stack trace:");
			console.error(error.stack);
		}

		process.exit(1);
	}
}

// Execute reset
await resetAllStories();
