/**
 * Authentication Setup for Playwright Tests
 *
 * This setup file creates authenticated browser states for different user roles.
 * Run before all tests to establish authentication state.
 *
 * Creates storage state files:
 * - .auth/manager.json - Manager role (admin:all)
 * - .auth/writer.json - Writer role (stories:write)
 * - .auth/reader.json - Reader role (stories:read)
 */

import { expect, test as setup } from "@playwright/test";
import { loadAuthData, loginAs } from "../helpers/auth";

setup.describe("Authentication Setup", () => {
    setup("authenticate as manager", async ({ page, context }) => {
        console.log("Setting up manager authentication...");

        const profile = await loginAs(page, "manager");

        // Verify manager is authenticated
        const currentUrl = page.url();
        expect(currentUrl).not.toContain("/login");

        // Navigate to a protected route to verify access
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Verify no redirect to login (manager has access)
        expect(page.url()).toContain("/studio");
        console.log(`Manager ${profile.email} authenticated successfully`);

        // Save authenticated state
        await context.storageState({ path: ".auth/manager.json" });
        console.log("Manager authentication state saved to .auth/manager.json");
    });

    setup("authenticate as writer", async ({ page, context }) => {
        console.log("Setting up writer authentication...");

        const profile = await loginAs(page, "writer");

        // Verify writer is authenticated
        const currentUrl = page.url();
        expect(currentUrl).not.toContain("/login");

        // Navigate to a protected route to verify access
        await page.goto("/studio");
        await page.waitForLoadState("networkidle");

        // Verify no redirect to login (writer has access)
        expect(page.url()).toContain("/studio");
        console.log(`Writer ${profile.email} authenticated successfully`);

        // Save authenticated state
        await context.storageState({ path: ".auth/writer.json" });
        console.log("Writer authentication state saved to .auth/writer.json");
    });

    setup("authenticate as reader", async ({ page, context }) => {
        console.log("Setting up reader authentication...");

        const profile = await loginAs(page, "reader");

        // Verify reader is authenticated
        const currentUrl = page.url();
        expect(currentUrl).not.toContain("/login");

        // Navigate to a public route (reader can access novels)
        await page.goto("/novels");
        await page.waitForLoadState("networkidle");

        // Verify reader can access novels
        expect(page.url()).toContain("/novels");
        console.log(`Reader ${profile.email} authenticated successfully`);

        // Save authenticated state
        await context.storageState({ path: ".auth/reader.json" });
        console.log("Reader authentication state saved to .auth/reader.json");
    });

    setup("verify authentication profiles", async () => {
        console.log("Verifying authentication profiles...");

        const authData = loadAuthData();

        // Verify manager profile
        expect(authData.profiles.manager).toBeDefined();
        expect(authData.profiles.manager.email).toBe("manager@fictures.xyz");
        expect(authData.profiles.manager.role).toBe("manager");
        console.log("✓ Manager profile verified");

        // Verify writer profile
        expect(authData.profiles.writer).toBeDefined();
        expect(authData.profiles.writer.email).toBe("writer@fictures.xyz");
        expect(authData.profiles.writer.role).toBe("writer");
        console.log("✓ Writer profile verified");

        // Verify reader profile
        expect(authData.profiles.reader).toBeDefined();
        expect(authData.profiles.reader.email).toBe("reader@fictures.xyz");
        expect(authData.profiles.reader.role).toBe("reader");
        console.log("✓ Reader profile verified");

        console.log("All authentication profiles verified successfully");
    });
});
