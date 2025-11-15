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
import { beforeAll, describe, expect, it } from "@jest/globals";

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

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(() => {
    // 1. Load authentication data
    const authContent: string = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    authData = JSON.parse(authContent) as AuthData;

    // 2. Get writer API key
    writerApiKey = authData.develop.profiles.writer.apiKey;

    // 3. Verify environment variables
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error("BLOB_READ_WRITE_TOKEN not set in environment");
    }

    console.log("✓ Test setup complete - using writer API key");
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
            Authorization: `Bearer ${writerApiKey}`,
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
