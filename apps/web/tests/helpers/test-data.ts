/**
 * Test Data Helper for Playwright Tests
 *
 * Provides utilities for creating, managing, and cleaning up test data.
 * Works with the database and Vercel Blob storage.
 */

import { type APIRequestContext, expect } from "@playwright/test";
import { getAuthHeaders } from "./auth";

export interface TestStory {
    id: string;
    title: string;
    genre: string;
    status: "draft" | "published";
    userId: string;
    createdAt: string;
}

export interface TestChapter {
    id: string;
    storyId: string;
    title: string;
    chapterNumber: number;
    status: "draft" | "published";
}

export interface TestScene {
    id: string;
    chapterId: string;
    sceneNumber: number;
    content: string;
    imageUrl?: string;
    status: "draft" | "published";
}

export interface TestPost {
    id: string;
    title: string;
    content: string;
    userId: string;
    storyId?: string;
    createdAt: string;
}

/**
 * Generate a unique test identifier
 */
export function generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Create a test story via API
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role for authentication
 * @param data - Partial story data (optional)
 * @returns Created story object
 */
export async function createTestStory(
    request: APIRequestContext,
    role: "manager" | "writer" = "writer",
    data?: Partial<TestStory>,
): Promise<TestStory> {
    const response = await request.post("/studio/api/stories", {
        headers: getAuthHeaders(role),
        data: {
            title: data?.title || `Test Story ${generateTestId()}`,
            genre: data?.genre || "fantasy",
            status: data?.status || "draft",
            summary: "Test story summary",
            ...data,
        },
    });

    expect(response.ok()).toBeTruthy();
    const story = await response.json();
    return story;
}

/**
 * Delete a test story via API
 *
 * @param request - Playwright APIRequestContext
 * @param storyId - Story ID to delete
 * @param role - User role for authentication
 */
export async function deleteTestStory(
    request: APIRequestContext,
    storyId: string,
    role: "manager" | "writer" = "writer",
): Promise<void> {
    const response = await request.delete(`/studio/api/stories/${storyId}`, {
        headers: getAuthHeaders(role),
    });

    expect(response.ok()).toBeTruthy();
}

/**
 * Create a test chapter via API
 *
 * @param request - Playwright APIRequestContext
 * @param storyId - Story ID
 * @param role - User role for authentication
 * @param data - Partial chapter data (optional)
 * @returns Created chapter object
 */
export async function createTestChapter(
    request: APIRequestContext,
    storyId: string,
    role: "manager" | "writer" = "writer",
    data?: Partial<TestChapter>,
): Promise<TestChapter> {
    const response = await request.post("/studio/api/chapters", {
        headers: getAuthHeaders(role),
        data: {
            storyId,
            title: data?.title || `Test Chapter ${generateTestId()}`,
            chapterNumber: data?.chapterNumber || 1,
            status: data?.status || "draft",
            ...data,
        },
    });

    expect(response.ok()).toBeTruthy();
    const chapter = await response.json();
    return chapter;
}

/**
 * Create a test scene via API
 *
 * @param request - Playwright APIRequestContext
 * @param chapterId - Chapter ID
 * @param role - User role for authentication
 * @param data - Partial scene data (optional)
 * @returns Created scene object
 */
export async function createTestScene(
    request: APIRequestContext,
    chapterId: string,
    role: "manager" | "writer" = "writer",
    data?: Partial<TestScene>,
): Promise<TestScene> {
    const response = await request.post("/studio/api/scenes", {
        headers: getAuthHeaders(role),
        data: {
            chapterId,
            sceneNumber: data?.sceneNumber || 1,
            content: data?.content || "Test scene content",
            status: data?.status || "draft",
            ...data,
        },
    });

    expect(response.ok()).toBeTruthy();
    const scene = await response.json();
    return scene;
}

/**
 * Create a test community post via API
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role for authentication
 * @param data - Partial post data (optional)
 * @returns Created post object
 */
export async function createTestPost(
    request: APIRequestContext,
    role: "manager" | "writer" | "reader" = "writer",
    data?: Partial<TestPost>,
): Promise<TestPost> {
    const response = await request.post("/community/api/posts", {
        headers: getAuthHeaders(role),
        data: {
            title: data?.title || `Test Post ${generateTestId()}`,
            content: data?.content || "Test post content",
            storyId: data?.storyId,
            ...data,
        },
    });

    expect(response.ok()).toBeTruthy();
    const post = await response.json();
    return post;
}

/**
 * Delete a test post via API
 *
 * @param request - Playwright APIRequestContext
 * @param postId - Post ID to delete
 * @param role - User role for authentication
 */
export async function deleteTestPost(
    request: APIRequestContext,
    postId: string,
    role: "manager" | "writer" = "writer",
): Promise<void> {
    const response = await request.delete(`/community/api/posts/${postId}`, {
        headers: getAuthHeaders(role),
    });

    expect(response.ok()).toBeTruthy();
}

/**
 * Get published stories for testing
 *
 * @param request - Playwright APIRequestContext
 * @returns Array of published stories
 */
export async function getPublishedStories(
    request: APIRequestContext,
): Promise<TestStory[]> {
    const response = await request.get("/novels/api/published");

    expect(response.ok()).toBeTruthy();
    const stories = await response.json();
    return stories;
}

/**
 * Get user's stories via API
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role for authentication
 * @returns Array of user's stories
 */
export async function getUserStories(
    request: APIRequestContext,
    role: "manager" | "writer" = "writer",
): Promise<TestStory[]> {
    const response = await request.get("/studio/api/stories", {
        headers: getAuthHeaders(role),
    });

    expect(response.ok()).toBeTruthy();
    const stories = await response.json();
    return stories;
}

/**
 * Wait for story generation to complete
 *
 * @param request - Playwright APIRequestContext
 * @param storyId - Story ID
 * @param role - User role for authentication
 * @param maxWaitMs - Maximum wait time in milliseconds
 */
export async function waitForStoryGeneration(
    request: APIRequestContext,
    storyId: string,
    role: "manager" | "writer" = "writer",
    maxWaitMs: number = 600000, // 10 minutes
): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitMs) {
        const response = await request.get(`/studio/api/stories/${storyId}`, {
            headers: getAuthHeaders(role),
        });

        if (response.ok()) {
            const story = await response.json();

            if (story.status === "completed" || story.status === "published") {
                return;
            }
        }

        // Wait 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error(`Story generation timeout after ${maxWaitMs}ms`);
}

/**
 * Clean up test stories created during test run
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role for authentication
 */
export async function cleanupTestStories(
    request: APIRequestContext,
    role: "manager" | "writer" = "manager",
): Promise<void> {
    const stories = await getUserStories(request, role);

    // Delete only test stories (title starts with "Test Story")
    for (const story of stories) {
        if (story.title.startsWith("Test Story")) {
            await deleteTestStory(request, story.id, role);
        }
    }
}

/**
 * Clean up test posts created during test run
 *
 * @param request - Playwright APIRequestContext
 * @param role - User role for authentication
 */
export async function cleanupTestPosts(
    request: APIRequestContext,
    role: "manager" | "writer" = "manager",
): Promise<void> {
    const response = await request.get("/community/api/posts", {
        headers: getAuthHeaders(role),
    });

    if (response.ok()) {
        const posts = await response.json();

        // Delete only test posts (title starts with "Test Post")
        for (const post of posts) {
            if (post.title.startsWith("Test Post")) {
                await deleteTestPost(request, post.id, role);
            }
        }
    }
}

/**
 * Generate minimal test story data (for quick testing)
 *
 * @returns Minimal story data object
 */
export function generateMinimalStoryData() {
    return {
        title: `Test Story ${generateTestId()}`,
        genre: "fantasy",
        summary: "A test story for automated testing",
        targetAudience: "young_adult",
        toneStyle: "adventurous",
        parts: 1,
        chaptersPerPart: 1,
        scenesPerChapter: 3,
    };
}

/**
 * Generate full test story data (for comprehensive testing)
 *
 * @returns Full story data object
 */
export function generateFullStoryData() {
    return {
        title: `Test Epic ${generateTestId()}`,
        genre: "fantasy",
        summary: "A comprehensive test story with multiple parts and chapters",
        targetAudience: "adult",
        toneStyle: "dramatic",
        parts: 2,
        chaptersPerPart: 2,
        scenesPerChapter: 4,
    };
}
