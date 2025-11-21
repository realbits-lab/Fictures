/**
 * Community API Tests
 *
 * Tests for community posts and interactions
 * Test Cases: TC-API-COMM-001 to TC-API-COMM-023
 */

import { expect, test } from "@playwright/test";
import {
    createTestPost,
    deleteTestPost,
    generateTestId,
} from "../helpers/test-data";

test.describe("Community API", () => {
    test.describe("Create Post", () => {
        test("TC-API-COMM-001: Authenticated user can create post", async ({
            request,
        }) => {
            const post = await createTestPost(request, "writer", {
                title: `Test Post ${generateTestId()}`,
                content: "Test post content",
            });

            expect(post).toHaveProperty("id");
            expect(post).toHaveProperty("title");

            // Cleanup
            await deleteTestPost(request, post.id, "writer");
        });

        test("TC-API-COMM-002: Anonymous user cannot create post (401)", async ({
            request,
        }) => {
            const response = await request.post("/community/api/posts", {
                data: {
                    title: "Test Post",
                    content: "Test content",
                },
            });

            expect(response.status()).toBe(401);
        });
    });

    test.describe("Get Posts", () => {
        test("TC-API-COMM-006: Returns paginated posts", async ({
            request,
        }) => {
            const response = await request.get("/community/api/posts");

            expect(response.ok()).toBeTruthy();
            const posts = await response.json();
            expect(Array.isArray(posts)).toBeTruthy();
        });
    });
});
