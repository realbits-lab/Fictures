/**
 * Test Data Setup for Playwright Tests
 *
 * This setup file prepares test data for E2E tests.
 * Run before test suites that require pre-existing data.
 *
 * Creates:
 * - Test stories (draft and published)
 * - Test community posts
 * - Test analytics data
 */

import { expect, test as setup } from "@playwright/test";
import {
    cleanupTestPosts,
    cleanupTestStories,
    createTestPost,
    createTestStory,
    generateMinimalStoryData,
} from "../helpers/test-data";

setup.describe("Test Data Setup", () => {
    setup("cleanup existing test data", async ({ request }) => {
        console.log("Cleaning up existing test data...");

        try {
            // Clean up test stories
            await cleanupTestStories(request, "manager");
            console.log("✓ Test stories cleaned up");

            // Clean up test posts
            await cleanupTestPosts(request, "manager");
            console.log("✓ Test posts cleaned up");
        } catch (error) {
            console.warn("Cleanup failed (may be first run):", error);
        }

        console.log("Test data cleanup completed");
    });

    setup("create test stories", async ({ request }) => {
        console.log("Creating test stories...");

        // Create 3 draft stories (writer-owned)
        for (let i = 1; i <= 3; i++) {
            const story = await createTestStory(request, "writer", {
                title: `Test Draft Story ${i}`,
                genre: "fantasy",
                status: "draft",
            });
            console.log(`✓ Created draft story: ${story.title} (${story.id})`);
        }

        // Create 5 published stories (various genres)
        const genres = ["fantasy", "sci-fi", "romance", "mystery", "thriller"];
        for (let i = 0; i < 5; i++) {
            const story = await createTestStory(request, "writer", {
                title: `Test Published Story ${i + 1}`,
                genre: genres[i],
                status: "published",
            });
            console.log(
                `✓ Created published story: ${story.title} (${story.id})`,
            );
        }

        console.log("Test stories created successfully");
    });

    setup("create test community posts", async ({ request }) => {
        console.log("Creating test community posts...");

        // Create 10 test posts
        for (let i = 1; i <= 10; i++) {
            const post = await createTestPost(request, "writer", {
                title: `Test Post ${i}`,
                content: `Test post content ${i}. This is a test post for automated testing.`,
            });
            console.log(`✓ Created test post: ${post.title} (${post.id})`);
        }

        console.log("Test community posts created successfully");
    });

    setup("verify test data creation", async ({ request }) => {
        console.log("Verifying test data...");

        // Verify stories exist
        const storiesResponse = await request.get("/studio/api/stories", {
            headers: {
                Authorization: `Bearer ${process.env.WRITER_API_KEY}`,
            },
        });

        expect(storiesResponse.ok()).toBeTruthy();
        const stories = await storiesResponse.json();
        expect(stories.length).toBeGreaterThan(0);
        console.log(`✓ Found ${stories.length} test stories`);

        // Verify published stories are accessible
        const publishedResponse = await request.get("/novels/api/published");
        expect(publishedResponse.ok()).toBeTruthy();
        const publishedStories = await publishedResponse.json();
        expect(publishedStories.length).toBeGreaterThan(0);
        console.log(`✓ Found ${publishedStories.length} published stories`);

        // Verify community posts exist
        const postsResponse = await request.get("/community/api/posts");
        expect(postsResponse.ok()).toBeTruthy();
        const posts = await postsResponse.json();
        expect(posts.length).toBeGreaterThan(0);
        console.log(`✓ Found ${posts.length} community posts`);

        console.log("Test data verification completed successfully");
    });
});
