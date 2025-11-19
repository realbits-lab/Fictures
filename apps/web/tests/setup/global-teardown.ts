/**
 * Global Teardown for Playwright Tests with Testcontainers
 *
 * This file is executed once after all tests.
 * It stops the PostgreSQL container and cleans up resources.
 */

import { type FullConfig } from "@playwright/test";
import { stopPostgresContainer } from "./testcontainers.setup";

async function globalTeardown(config: FullConfig) {
	console.log("\n🧹 Global Teardown: Cleaning up test environment...\n");

	// Stop PostgreSQL container
	await stopPostgresContainer();

	console.log("\n✅ Global Teardown: Test environment cleaned up\n");
}

export default globalTeardown;
