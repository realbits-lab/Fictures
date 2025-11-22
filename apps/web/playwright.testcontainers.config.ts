/**
 * Playwright Configuration for Testcontainers Tests
 *
 * This configuration uses testcontainers for isolated database testing.
 * Run with: npx playwright test --config=playwright.testcontainers.config.ts
 *
 * DATABASE_URL is read from .testcontainers-db-url file at webServer start time.
 * The file is created by global-setup.ts which runs before webServer starts.
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

    // Web server configuration
    // Uses shell script to read DATABASE_URL from file at runtime (after global-setup creates it)
    webServer: {
        command:
            "rm -rf .next && bash -c 'export DATABASE_URL=$(cat .testcontainers-db-url) && export DATABASE_URL_UNPOOLED=$DATABASE_URL && echo \"[WEBSERVER] DATABASE_URL: $DATABASE_URL\" && pnpm dotenv -e .env.local -- pnpm dev'",
        url: "http://localhost:3000",
        reuseExistingServer: false, // Always start fresh for testcontainers
        timeout: 120000,
        env: {
            NODE_ENV: "test",
        },
    },
});
