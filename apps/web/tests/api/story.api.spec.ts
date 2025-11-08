/**
 * Story API Tests
 *
 * Tests for story CRUD operations
 * Test Cases: TC-API-STORY-001 to TC-API-STORY-035
 */

import { expect, test } from "@playwright/test";
import { getAuthHeaders } from "../helpers/auth";
import {
	createTestStory,
	deleteTestStory,
	generateTestId,
} from "../helpers/test-data";

test.describe("Story API", () => {
	test.describe("Create Story", () => {
		test("TC-API-STORY-001: Authenticated writer can create story", async ({
			request,
		}) => {
			const story = await createTestStory(request, "writer", {
				title: `Test Story ${generateTestId()}`,
				genre: "fantasy",
				status: "draft",
			});

			expect(story).toHaveProperty("id");
			expect(story).toHaveProperty("title");
			expect(story.status).toBe("draft");

			// Cleanup
			await deleteTestStory(request, story.id, "writer");
		});

		test("TC-API-STORY-002: Anonymous user cannot create story (401)", async ({
			request,
		}) => {
			const response = await request.post("/studio/api/stories", {
				data: {
					title: "Test Story",
					genre: "fantasy",
				},
			});

			expect(response.status()).toBe(401);
		});

		test("TC-API-STORY-004: Missing required fields returns 400", async ({
			request,
		}) => {
			const response = await request.post("/studio/api/stories", {
				headers: getAuthHeaders("writer"),
				data: {
					// Missing required fields
				},
			});

			expect(response.status()).toBe(400);
		});
	});

	test.describe("Get Story", () => {
		test("TC-API-STORY-011: Non-existent story returns 404", async ({
			request,
		}) => {
			const response = await request.get("/studio/api/stories/nonexistent-id", {
				headers: getAuthHeaders("writer"),
			});

			expect(response.status()).toBe(404);
		});
	});

	test.describe("List Stories", () => {
		test("TC-API-STORY-029: Returns paginated list of stories", async ({
			request,
		}) => {
			const response = await request.get("/studio/api/stories", {
				headers: getAuthHeaders("writer"),
			});

			expect(response.ok()).toBeTruthy();
			const stories = await response.json();
			expect(Array.isArray(stories)).toBeTruthy();
		});
	});
});
