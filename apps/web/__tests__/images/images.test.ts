/**
 * Integration Tests for Images System
 *
 * Tests the complete image generation system using real API calls.
 * Uses writer@fictures.xyz API key from .auth/user.json (develop env).
 *
 * Test coverage:
 * - Image generation with different types and aspect ratios via API
 * - API authentication with writer API key
 * - Service layer orchestration (generation + upload + optimization)
 * - Vercel Blob upload integration
 * - Image optimization (AVIF variants only)
 */

import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { characters, scenes, settings, stories, users } from "@/lib/schemas/database";

// ============================================================================
// Test Configuration
// ============================================================================

const AUTH_FILE_PATH: string = path.resolve(__dirname, "../../.auth/user.json");

const API_BASE_URL: string = "http://localhost:3000";
const API_ENDPOINT: string = "/api/studio/images";

interface AuthData {
    develop: {
        profiles: {
            writer: {
                email: string;
                password: string;
                apiKey: string;
            };
        };
    };
}

interface ApiImagesRequest {
    prompt: string;
    contentId: string;
    imageType: "story" | "character" | "setting" | "scene" | "comic-panel";
}

interface ImageVariant {
    format: string;
    device: string;
    resolution: string;
    width: number;
    height: number;
    url: string;
    size: number;
}

interface OptimizedImageSet {
    imageId: string;
    originalUrl: string;
    variants: ImageVariant[];
    generatedAt: string;
}

interface ApiImagesResponse {
    imageId: string;
    imageUrl: string;
    blobUrl: string;
    width: number;
    height: number;
    size: number;
    aspectRatio: string;
    optimizedSet: OptimizedImageSet;
    isPlaceholder: boolean;
    model: string;
    provider: string;
    metadata: {
        generationTime: number;
        uploadTime: number;
        optimizationTime: number;
        dbUpdateTime: number;
        totalTime: number;
    };
}

let authData: AuthData;
let writerApiKey: string;
let writerUserId: string;
let testStoryId: string;
let testCharacterId: string;
let testSettingId: string;
let testScene1Id: string;
let testScene2Id: string;
let testScene3Id: string;

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
    // 1. Load authentication data
    const authContent: string = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    authData = JSON.parse(authContent) as AuthData;

    // 2. Get writer API key and user ID
    writerApiKey = authData.develop.profiles.writer.apiKey;

    // Get actual writer user ID from database
    const writerEmail = authData.develop.profiles.writer.email;
    const writerUser = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, writerEmail))
        .limit(1);

    if (writerUser.length === 0) {
        throw new Error(`Writer user not found: ${writerEmail}. Run setup-auth-users.ts first.`);
    }

    writerUserId = writerUser[0].id;

    // 3. Verify environment variables
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("BLOB_READ_WRITE_TOKEN not set in environment");
    }

    // 4. Create test database records
    testStoryId = "story_test_001";
    testCharacterId = "char_test_001";
    testSettingId = "setting_test_001";
    testScene1Id = "scene_test_001";
    testScene2Id = "scene_test_002";
    testScene3Id = "scene_test_003";

    // Create test story
    await db.insert(stories).values({
        id: testStoryId,
        authorId: writerUserId,
        title: "Test Story for Image Generation",
        summary: "A test story for image generation tests",
        genre: "Fantasy",
        tone: "hopeful",
        language: "en",
        targetAudience: "general",
        userPrompt: "A test story",
    }).onConflictDoNothing();

    // Create test character
    await db.insert(characters).values({
        id: testCharacterId,
        storyId: testStoryId,
        name: "Test Character",
        role: "protagonist",
        summary: "A test character for image generation",
    }).onConflictDoNothing();

    // Create test setting
    await db.insert(settings).values({
        id: testSettingId,
        storyId: testStoryId,
        name: "Test Setting",
        summary: "A test setting for image generation",
    }).onConflictDoNothing();

    // Create test scenes
    await db.insert(scenes).values([
        {
            id: testScene1Id,
            storyId: testStoryId,
            title: "Test Scene 1",
            summary: "First test scene for image generation",
        },
        {
            id: testScene2Id,
            storyId: testStoryId,
            title: "Test Scene 2",
            summary: "Second test scene for comic panel",
        },
        {
            id: testScene3Id,
            storyId: testStoryId,
            title: "Test Scene 3",
            summary: "Third test scene for metadata testing",
        },
    ]).onConflictDoNothing();

    console.log("✓ Test setup complete - using writer API key and test database records");
});

// Cleanup test data after all tests
afterAll(async () => {
    // Delete test scenes
    await db.delete(scenes).where(eq(scenes.storyId, testStoryId));

    // Delete test character
    await db.delete(characters).where(eq(characters.id, testCharacterId));

    // Delete test setting
    await db.delete(settings).where(eq(settings.id, testSettingId));

    // Delete test story
    await db.delete(stories).where(eq(stories.id, testStoryId));

    console.log("✓ Test cleanup complete - removed test database records");
});

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Call the images API endpoint with fetch
 */
async function generateImage(
    requestBody: ApiImagesRequest,
): Promise<ApiImagesResponse> {
    const url: string = `${API_BASE_URL}${API_ENDPOINT}`;

    const response: Response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": writerApiKey,
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText: string = await response.text();
        throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
    }

    const result: ApiImagesResponse =
        (await response.json()) as ApiImagesResponse;
    return result;
}

// ============================================================================
// Image Generation Tests
// ============================================================================

describe("Images System Integration", () => {
    it("should generate story cover image with 16:9 aspect ratio", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A mysterious ancient library filled with glowing books",
            contentId: "story_test_001",
            imageType: "story",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Basic properties
        expect(result.imageId).toBeDefined();
        expect(result.imageUrl).toContain("blob.vercel-storage.com");
        expect(result.blobUrl).toBe(result.imageUrl);
        expect(result.aspectRatio).toBe("16:9");
        expect(result.isPlaceholder).toBe(false);

        // Assert - Dimensions (16:9 = 1664x928 or 1344x768)
        expect(result.width).toBeGreaterThan(1000);
        expect(result.height).toBeGreaterThan(500);
        const aspectRatioValue: number = result.width / result.height;
        expect(aspectRatioValue).toBeGreaterThan(1.7);
        expect(aspectRatioValue).toBeLessThan(1.8);

        // Assert - Image size
        expect(result.size).toBeGreaterThan(0);

        // Assert - AI provider metadata
        expect(result.model).toBeDefined();
        expect(result.provider).toBeDefined();

        // Assert - Timing metadata
        expect(result.metadata.generationTime).toBeGreaterThan(0);
        expect(result.metadata.uploadTime).toBeGreaterThan(0);
        expect(result.metadata.optimizationTime).toBeGreaterThan(0);
        expect(result.metadata.totalTime).toBeGreaterThan(0);

        // Assert - Optimized variants
        expect(result.optimizedSet).toBeDefined();
        expect(result.optimizedSet.imageId).toBeDefined();
        expect(result.optimizedSet.originalUrl).toBe(result.imageUrl);
        expect(result.optimizedSet.variants).toBeInstanceOf(Array);
        expect(result.optimizedSet.variants.length).toBeGreaterThan(0);

        // Assert - Variant structure (AVIF format only)
        const avifVariants: ImageVariant[] =
            result.optimizedSet.variants.filter(
                (v: ImageVariant) => v.format === "avif",
            );
        expect(avifVariants.length).toBeGreaterThan(0);

        // Assert - Multiple resolutions (1x, 2x)
        const has1x: boolean = result.optimizedSet.variants.some(
            (v: ImageVariant) => v.resolution === "1x",
        );
        const has2x: boolean = result.optimizedSet.variants.some(
            (v: ImageVariant) => v.resolution === "2x",
        );
        expect(has1x).toBe(true);
        expect(has2x).toBe(true);
    }, 60000); // 60s timeout for image generation

    it("should generate character portrait with 1:1 aspect ratio", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A wise elderly wizard with a long white beard and piercing blue eyes",
            contentId: "char_test_001",
            imageType: "character",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Aspect ratio
        expect(result.aspectRatio).toBe("1:1");

        // Assert - Dimensions (1:1 = 1024x1024)
        expect(result.width).toBeGreaterThan(900);
        expect(result.height).toBeGreaterThan(900);
        const aspectRatioValue: number = result.width / result.height;
        expect(aspectRatioValue).toBeGreaterThan(0.95);
        expect(aspectRatioValue).toBeLessThan(1.05);

        // Assert - All other standard checks
        expect(result.imageUrl).toContain("blob.vercel-storage.com");
        expect(result.optimizedSet.variants.length).toBeGreaterThan(0);
        expect(result.metadata.totalTime).toBeGreaterThan(0);
    }, 60000);

    it("should generate setting image with 1:1 aspect ratio", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A bustling medieval marketplace with colorful tents and merchants",
            contentId: "setting_test_001",
            imageType: "setting",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Aspect ratio
        expect(result.aspectRatio).toBe("1:1");

        // Assert - Square dimensions
        const aspectRatioValue: number = result.width / result.height;
        expect(aspectRatioValue).toBeGreaterThan(0.95);
        expect(aspectRatioValue).toBeLessThan(1.05);
    }, 60000);

    it("should generate scene image with 16:9 aspect ratio", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A dramatic sunset over a vast desert with ancient ruins",
            contentId: "scene_test_001",
            imageType: "scene",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Aspect ratio
        expect(result.aspectRatio).toBe("16:9");

        // Assert - Widescreen dimensions
        const aspectRatioValue: number = result.width / result.height;
        expect(aspectRatioValue).toBeGreaterThan(1.7);
        expect(aspectRatioValue).toBeLessThan(1.8);
    }, 60000);

    it("should generate comic panel with 9:16 aspect ratio", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A superhero leaping between skyscrapers in a dynamic action pose",
            contentId: "scene_test_002",
            imageType: "comic-panel",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Aspect ratio
        expect(result.aspectRatio).toBe("9:16");

        // Assert - Portrait dimensions (taller than wide)
        const aspectRatioValue: number = result.width / result.height;
        expect(aspectRatioValue).toBeGreaterThan(0.55);
        expect(aspectRatioValue).toBeLessThan(0.58);
        expect(result.height).toBeGreaterThan(result.width);
    }, 60000);

    it("should include comprehensive metadata in results", async () => {
        // Arrange
        const requestBody: ApiImagesRequest = {
            prompt: "A serene Japanese garden with cherry blossoms and a koi pond",
            contentId: "scene_test_003",
            imageType: "scene",
        };

        // Act
        const result: ApiImagesResponse = await generateImage(requestBody);

        // Assert - Metadata completeness
        expect(result.metadata).toMatchObject({
            generationTime: expect.any(Number),
            uploadTime: expect.any(Number),
            optimizationTime: expect.any(Number),
            totalTime: expect.any(Number),
        });

        // Assert - Timing relationships
        expect(result.metadata.totalTime).toBeGreaterThanOrEqual(
            result.metadata.generationTime,
        );
        expect(result.metadata.totalTime).toBeGreaterThanOrEqual(
            result.metadata.uploadTime,
        );
        expect(result.metadata.totalTime).toBeGreaterThanOrEqual(
            result.metadata.optimizationTime,
        );

        // Assert - Optimized set structure
        expect(result.optimizedSet).toMatchObject({
            imageId: expect.any(String),
            originalUrl: expect.any(String),
            variants: expect.any(Array),
            generatedAt: expect.any(String),
        });

        // Assert - Variant properties
        for (const variant of result.optimizedSet.variants) {
            expect(variant).toMatchObject({
                format: expect.stringMatching(/^(avif)$/),
                device: expect.stringMatching(/^mobile$/),
                resolution: expect.stringMatching(/^(1x|2x)$/),
                width: expect.any(Number),
                height: expect.any(Number),
                url: expect.stringContaining("blob.vercel-storage.com"),
                size: expect.any(Number),
            });

            // Assert - Variant dimensions are positive
            expect(variant.width).toBeGreaterThan(0);
            expect(variant.height).toBeGreaterThan(0);
            expect(variant.size).toBeGreaterThan(0);
        }
    }, 60000);
});
