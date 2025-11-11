/**
 * Authentication API Tests
 *
 * Tests for authentication endpoints
 * Test Cases: TC-API-AUTH-001 to TC-API-AUTH-016
 */

import { expect, test } from "@playwright/test";
import { loadAuthData } from "../helpers/auth";

test.describe("Authentication API", () => {
	test.describe("Login Endpoint", () => {
		test("TC-API-AUTH-001: Successful login with email/password returns token", async ({
			request,
		}) => {
			const authData = loadAuthData();
			const writer = authData.profiles.writer;

			const response = await request.post("/api/auth/signin", {
				data: {
					email: writer.email,
					password: writer.password,
				},
			});

			expect(response.ok()).toBeTruthy();
			const body = await response.json();
			expect(body).toHaveProperty("user");
		});

		test("TC-API-AUTH-002: Login with invalid credentials returns 401", async ({
			request,
		}) => {
			const response = await request.post("/api/auth/signin", {
				data: {
					email: "invalid@example.com",
					password: "wrongpassword",
				},
			});

			expect(response.status()).toBe(401);
		});

		test("TC-API-AUTH-003: Login with missing fields returns 400", async ({
			request,
		}) => {
			const response = await request.post("/api/auth/signin", {
				data: {
					email: "test@example.com",
				},
			});

			expect(response.status()).toBe(400);
		});
	});

	test.describe("Session Validation", () => {
		test("TC-API-AUTH-013: Valid session returns user data", async ({
			request,
			page,
		}) => {
			// Login first to get session
			const authData = loadAuthData();
			const writer = authData.profiles.writer;

			await page.goto("/login");
			await page.fill('input[type="email"]', writer.email);
			await page.fill('input[type="password"]', writer.password);
			await page.click('button:has-text("Sign in with Email")');
			await page.waitForLoadState("networkidle");

			const response = await request.get("/api/auth/session");
			expect(response.ok()).toBeTruthy();

			const session = await response.json();
			expect(session).toHaveProperty("user");
		});
	});
});
