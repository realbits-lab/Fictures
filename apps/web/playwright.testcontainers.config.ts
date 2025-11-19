/**
 * Playwright Configuration for Testcontainers Tests
 *
 * This configuration uses testcontainers for isolated database testing.
 * Run with: npx playwright test --config=playwright.testcontainers.config.ts
 *
 * DATABASE_URL is passed via process.env from global-setup.ts
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Read DATABASE_URL from temporary file created by global-setup
// This file is created before webServer starts
const dbUrlFile = join(__dirname, ".testcontainers-db-url");
let testcontainersDbUrl = "";
if (existsSync(dbUrlFile)) {
	testcontainersDbUrl = readFileSync(dbUrlFile, "utf-8").trim();
}

export default defineConfig({
	testDir: "./tests",
	fullyParallel: false, // Run sequentially to share database container
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Single worker to share database container
	reporter: "html",
	timeout: 240000,

	// Global setup/teardown for testcontainers
	globalSetup: "./tests/setup/global-setup.ts",
	globalTeardown: "./tests/setup/global-teardown.ts",

	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		headless: true,
	},

	projects: [
		{
			name: "testcontainers",
			use: { ...devices["Desktop Chrome"] },
			testMatch: /novels\.e2e\.spec\.ts/, // Only run novels tests with testcontainers
		},
	],

	// Web server configuration
	// DATABASE_URL is passed via env property from testcontainers
	webServer: {
		command: "pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: false, // Always start fresh for testcontainers
		timeout: 120000,
		env: {
			NODE_ENV: "test",
			DATABASE_URL: testcontainersDbUrl,
			DATABASE_URL_UNPOOLED: testcontainersDbUrl,
		},
	},
});
