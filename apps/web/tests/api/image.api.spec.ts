/**
 * Image API Tests
 *
 * Tests for image upload and management endpoints
 * Test Cases: TC-API-IMAGE-001 to TC-API-IMAGE-012
 */

import { expect, test } from "@playwright/test";
import { getAuthHeaders } from "../helpers/auth";

test.describe("Image API", () => {
	test.describe("Get Image", () => {
		test("TC-API-IMAGE-008: Image not found returns 404", async ({
			request,
		}) => {
			const response = await request.get("/api/images/nonexistent-image-id");

			expect(response.status()).toBe(404);
		});
	});
});
