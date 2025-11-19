/**
 * Global Setup for Playwright Tests with Testcontainers
 *
 * This file is executed once before all tests.
 * It starts the PostgreSQL container, runs migrations, and sets up auth users.
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { type FullConfig } from "@playwright/test";
import {
	runMigrations,
	seedTestData,
	startPostgresContainer,
} from "./testcontainers.setup";

async function globalSetup(config: FullConfig) {
	console.log("\n🚀 Global Setup: Starting test environment...\n");

	// Start PostgreSQL container
	const connectionString = await startPostgresContainer();

	// Set environment variables for the test process
	process.env.DATABASE_URL = connectionString;
	process.env.DATABASE_URL_UNPOOLED = connectionString;

	// Write testcontainers DATABASE_URL to temporary file for config to read
	const dbUrlFile = join(process.cwd(), ".testcontainers-db-url");
	writeFileSync(dbUrlFile, connectionString);
	console.log(`📝 Wrote DATABASE_URL to .testcontainers-db-url`);

	// Run migrations
	await runMigrations(connectionString);

	// Setup authentication users using the existing script
	console.log("🔐 Setting up authentication users...");
	try {
		execSync(
			`pnpm exec tsx scripts/setup-auth-users.ts`,
			{
				cwd: process.cwd(),
				env: {
					...process.env,
					DATABASE_URL: connectionString,
					DATABASE_URL_UNPOOLED: connectionString,
				},
				stdio: "inherit",
			}
		);
		console.log("✅ Authentication users created\n");
	} catch (error) {
		console.error("❌ Failed to setup auth users:", error);
		throw error;
	}

	// Seed additional test data (stories, chapters, scenes)
	await seedTestData(connectionString);

	console.log("\n✅ Global Setup: Test environment ready\n");
	console.log(`📝 DATABASE_URL: ${connectionString}\n`);

	// Return cleanup function
	return async () => {
		// Cleanup will be handled by global-teardown
	};
}

export default globalSetup;
