/**
 * Authentication Helper for Playwright Tests
 *
 * Provides reusable authentication functions for testing with different user roles.
 * Uses email/password authentication via the /login page.
 *
 * User Roles:
 * - manager@fictures.xyz: Manager role (admin:all scope) - Full access
 * - writer@fictures.xyz: Writer role (stories:write scope) - Story creation/editing
 * - reader@fictures.xyz: Reader role (stories:read scope) - Read-only access
 */

import fs from "node:fs";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export interface AuthProfile {
    email: string;
    password: string;
    role: string;
    userId: string;
    apiKey?: string;
}

export interface AuthData {
    profiles: {
        manager: AuthProfile;
        writer: AuthProfile;
        reader: AuthProfile;
    };
}

/**
 * Load authentication data from .auth/user.json
 */
export function loadAuthData(): AuthData {
    const authPath = path.resolve(process.cwd(), ".auth/user.json");

    if (!fs.existsSync(authPath)) {
        throw new Error(
            "Authentication file not found. Run: dotenv --file .env.local run node scripts/setup-auth-users.mjs",
        );
    }

    const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));

    // Validate required profiles
    const requiredRoles = ["manager", "writer", "reader"];
    for (const role of requiredRoles) {
        if (!authData.profiles[role]) {
            throw new Error(`Missing ${role} profile in .auth/user.json`);
        }
    }

    return authData as AuthData;
}

/**
 * Login to the application with a specific user role
 *
 * @param page - Playwright Page object
 * @param role - User role: 'manager', 'writer', or 'reader'
 * @returns AuthProfile of the logged-in user
 */
export async function loginAs(
    page: Page,
    role: "manager" | "writer" | "reader",
): Promise<AuthProfile> {
    const authData = loadAuthData();
    const profile = authData.profiles[role];

    // Navigate to login page
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill email field
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(profile.email);

    // Fill password field
    const passwordInput = page.locator(
        'input[type="password"], input[name="password"]',
    );
    await expect(passwordInput).toBeVisible({ timeout: 5000 });
    await passwordInput.fill(profile.password);

    // Click sign in button
    const signInButton = page.locator('button:has-text("Sign in with Email")');
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    await signInButton.click();

    // Wait for login to complete
    await page.waitForLoadState("networkidle");

    // Wait for redirect after successful login
    await page.waitForTimeout(2000);

    // Verify login successful (should not be on /login anymore)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain("/login");

    return profile;
}

/**
 * Login with email and password directly
 *
 * @param page - Playwright Page object
 * @param email - User email
 * @param password - User password
 */
export async function login(
    page: Page,
    email: string,
    password: string,
): Promise<void> {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"], input[name="email"]', email);
    await page.fill('input[type="password"], input[name="password"]', password);
    await page.click('button:has-text("Sign in with Email")');

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
}

/**
 * Logout from the application
 *
 * @param page - Playwright Page object
 */
export async function logout(page: Page): Promise<void> {
    // Click user menu or logout button (adjust selector based on UI)
    const logoutButton = page.locator(
        'button:has-text("Logout"), button:has-text("Sign out")',
    );

    if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForLoadState("networkidle");
    }
}

/**
 * Check if user is authenticated
 *
 * @param page - Playwright Page object
 * @returns true if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    // Try to access a protected route and check if redirected
    const _response = await page.goto("/studio");
    const url = page.url();

    // If redirected to login, user is not authenticated
    return !url.includes("/login") && !url.includes("/auth/signin");
}

/**
 * Get API key for a specific role
 *
 * @param role - User role: 'manager', 'writer', or 'reader'
 * @returns API key string
 */
export function getApiKey(role: "manager" | "writer" | "reader"): string {
    const authData = loadAuthData();
    const profile = authData.profiles[role];

    if (!profile.apiKey) {
        throw new Error(`No API key found for ${role} profile`);
    }

    return profile.apiKey;
}

/**
 * Create authorization header for API requests
 *
 * @param role - User role: 'manager', 'writer', or 'reader'
 * @returns Authorization header object
 */
export function getAuthHeaders(
    role: "manager" | "writer" | "reader",
): Record<string, string> {
    const apiKey = getApiKey(role);
    return {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
    };
}

/**
 * Wait for session to be established
 *
 * @param page - Playwright Page object
 */
export async function waitForSession(page: Page): Promise<void> {
    await page.waitForTimeout(1000);

    // Optionally verify session by checking for user data
    const response = await page.request.get("/api/auth/session");
    expect(response.ok()).toBeTruthy();
}

/**
 * Clear all authentication state
 *
 * @param page - Playwright Page object
 */
export async function clearAuth(page: Page): Promise<void> {
    await page.context().clearCookies();
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
}
