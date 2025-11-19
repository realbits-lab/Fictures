/**
 * Playwright Configuration for Testcontainers Tests
 *
 * This configuration uses testcontainers for isolated database testing.
 * Run with: npx playwright test --config=playwright.testcontainers.config.ts
 */

import { defineConfig, devices } from "@playwright/test";

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

	// Start web server before tests
	webServer: {
		command: "dotenv -e .env.local -- pnpm dev",
		url: "http://localhost:3000",
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
		env: {
			// Database URL will be set by global-setup
			NODE_ENV: "test",
		},
	},
});
