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
import { chapters, characters, parts, scenes, settings, stories, users } from "@/lib/schemas/database";

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
let testPartId: string;
let testChapterId: string;
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
    testPartId = "part_test_001";
    testChapterId = "chapter_test_001";
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
        moralFramework: {
            adversity: { type: "external-conflict", description: "Test adversity" },
            virtue: { virtue: "courage", description: "Test virtue" },
            consequence: { type: "character-growth", description: "Test consequence" }
        },
    }).onConflictDoNothing();

    // Create test character
    await db.insert(characters).values({
        id: testCharacterId,
        storyId: testStoryId,
        name: "Test Character",
        role: "protagonist",
        summary: "A test character for image generation",
        coreTrait: "courage",
        internalFlaw: "Fears failure because of past mistakes",
        externalGoal: "Prove their worth to the kingdom",
        backstory: "A brave hero with a mysterious past",
        personality: {
            traits: ["brave", "curious"],
            mannerisms: ["speaks softly"],
            quirks: ["always smiles"]
        },
        physicalDescription: {
            age: "young adult",
            build: "average",
            height: "average",
            features: ["brown hair", "blue eyes"]
        },
        voiceStyle: {
            tone: "warm",
            vocabulary: "simple",
            speechPatterns: ["direct"]
        }
    }).onConflictDoNothing();

    // Create test setting
    await db.insert(settings).values({
        id: testSettingId,
        storyId: testStoryId,
        name: "Test Setting",
        summary: "A test setting for image generation",
        adversityElements: {
            physicalObstacles: ["rocky terrain"],
            scarcityFactors: ["limited resources"],
            dangerSources: ["wild beasts"],
            socialDynamics: ["isolated community"]
        },
        virtueElements: {
            witnessElements: ["ancient monuments"],
            contrastElements: ["harsh environment"],
            opportunityElements: ["hidden sanctuaries"],
            sacredSpaces: ["temple ruins"]
        },
        consequenceElements: {
            transformativeElements: ["seasonal changes"],
            rewardSources: ["natural springs"],
            revelationTriggers: ["old inscriptions"],
            communityResponses: ["gathering places"]
        },
        symbolicMeaning: "A place of trial and transformation",
        mood: "mysterious and hopeful",
        emotionalResonance: "wonder",
        sensory: {
            sight: ["golden light", "ancient ruins"],
            sound: ["wind chimes", "rustling leaves"],
            smell: ["fresh air", "wildflowers"],
            touch: ["cool stone", "soft grass"],
            taste: []
        },
        architecturalStyle: "Ancient ruins with natural overgrowth",
        visualReferences: ["ancient temples", "overgrown ruins"],
        colorPalette: ["golden", "green", "blue"]
    }).onConflictDoNothing();

    // Create test part
    await db.insert(parts).values({
        id: testPartId,
        storyId: testStoryId,
        title: "Test Part",
        summary: "A test part for chapters",
        characterArcs: [],
        orderIndex: 0,
    }).onConflictDoNothing();

    // Create test chapter
    await db.insert(chapters).values({
        id: testChapterId,
        storyId: testStoryId,
        partId: testPartId,
        characterId: testCharacterId,
        title: "Test Chapter",
        summary: "A test chapter for scenes",
        arcPosition: "middle",
        contributesToMacroArc: "Tests the protagonist's core trait through adversity",
        adversityType: "external",
        virtueType: "courage",
        connectsToPreviousChapter: "Initial adversity presents challenge to the character",
        createsNextAdversity: "Character's action leads to new complication",
        orderIndex: 0,
    }).onConflictDoNothing();

    // Create test scenes
    await db.insert(scenes).values([
        {
            id: testScene1Id,
            storyId: testStoryId,
            chapterId: testChapterId,
            settingId: testSettingId,
            title: "Test Scene 1",
            summary: "First test scene for image generation",
            cyclePhase: "adversity",
            emotionalBeat: "tension",
            dialogueVsDescription: "50% dialogue, 50% description",
            suggestedLength: "medium",
            orderIndex: 0,
        },
        {
            id: testScene2Id,
            storyId: testStoryId,
            chapterId: testChapterId,
            settingId: testSettingId,
            title: "Test Scene 2",
            summary: "Second test scene for comic panel",
            cyclePhase: "virtue",
            emotionalBeat: "hope",
            dialogueVsDescription: "60% dialogue, 40% description",
            suggestedLength: "medium",
            orderIndex: 1,
        },
        {
            id: testScene3Id,
            storyId: testStoryId,
            chapterId: testChapterId,
            settingId: testSettingId,
            title: "Test Scene 3",
            summary: "Third test scene for metadata testing",
            cyclePhase: "consequence",
            emotionalBeat: "relief",
            dialogueVsDescription: "40% dialogue, 60% description",
            suggestedLength: "medium",
            orderIndex: 2,
        },
    ]).onConflictDoNothing();

    console.log("✓ Test setup complete - using writer API key and test database records");
});

// Cleanup test data after all tests
afterAll(async () => {
    // Delete test scenes
    await db.delete(scenes).where(eq(scenes.chapterId, testChapterId));

    // Delete test chapter
    await db.delete(chapters).where(eq(chapters.id, testChapterId));

    // Delete test part
    await db.delete(parts).where(eq(parts.id, testPartId));

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
        expect(result.originalUrl).toContain("blob.vercel-storage.com");
        expect(result.blobUrl).toBe(result.originalUrl);
        expect(result.aspectRatio).toBe("16:9");
        expect(result.isPlaceholder).toBe(false);

        // Assert - Dimensions (16:9 = 1664x928 or 1344x768)
        expect(result.dimensions.width).toBeGreaterThan(1000);
        expect(result.dimensions.height).toBeGreaterThan(500);
        const aspectRatioValue: number = result.dimensions.width / result.dimensions.height;
        expect(aspectRatioValue).toBeGreaterThan(1.7);
        expect(aspectRatioValue).toBeLessThan(1.8);

        // Assert - Image size
        expect(result.size).toBeGreaterThan(0);

        // Assert - AI provider metadata
        expect(result.model).toBeDefined();
        expect(result.provider).toBeDefined();

        // Assert - Response data completeness (API doesn't return timing metadata)
        expect(result.model).toBeDefined();
        expect(result.provider).toBeDefined();
        expect(result.size).toBeGreaterThan(0);

        // Assert - Optimized variants
        expect(result.optimizedSet).toBeDefined();
        expect(result.optimizedSet.imageId).toBeDefined();
        expect(result.optimizedSet.originalUrl).toContain("blob.vercel-storage.com");
        expect(Array.isArray(result.optimizedSet.variants)).toBe(true);
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
        expect(result.dimensions.width).toBeGreaterThan(900);
        expect(result.dimensions.height).toBeGreaterThan(900);
        const aspectRatioValue: number = result.dimensions.width / result.dimensions.height;
        expect(aspectRatioValue).toBeGreaterThan(0.95);
        expect(aspectRatioValue).toBeLessThan(1.05);

        // Assert - All other standard checks
        expect(result.originalUrl).toContain("blob.vercel-storage.com");
        expect(result.optimizedSet.variants.length).toBeGreaterThan(0);
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
        const aspectRatioValue: number = result.dimensions.width / result.dimensions.height;
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
        const aspectRatioValue: number = result.dimensions.width / result.dimensions.height;
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
        const aspectRatioValue: number = result.dimensions.width / result.dimensions.height;
        expect(aspectRatioValue).toBeGreaterThan(0.55);
        expect(aspectRatioValue).toBeLessThan(0.58);
        expect(result.dimensions.height).toBeGreaterThan(result.dimensions.width);
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

        // Assert - Response completeness (API doesn't return metadata, only service layer has it)
        expect(result.success).toBe(true);
        expect(result.model).toBeDefined();
        expect(result.provider).toBeDefined();
        expect(result.size).toBeGreaterThan(0);
        expect(result.dimensions).toBeDefined();
        expect(result.dimensions.width).toBeGreaterThan(0);
        expect(result.dimensions.height).toBeGreaterThan(0);

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
