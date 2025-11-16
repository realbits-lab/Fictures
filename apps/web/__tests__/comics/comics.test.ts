/**
 * Integration Tests for Comics System
 *
 * Tests the complete comic generation system using real API calls.
 * Uses writer@fictures.xyz API key from .auth/user.json (develop env).
 *
 * Test coverage:
 * - Comic panel generation with toonplay conversion via API
 * - API authentication with writer API key
 * - Service layer orchestration (toonplay + panel generation + evaluation)
 * - Vercel Blob upload integration
 * - Image optimization (AVIF variants)
 * - Quality evaluation and improvement loops
 */

import fs from "node:fs";
import path from "node:path";
// Note: undici is a Node.js built-in module (Node 18+)
// Using global fetch instead for compatibility
const undiciFetch = globalThis.fetch;
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    comicPanels,
    parts,
    scenes,
    settings,
    stories,
    users,
} from "@/lib/schemas/database";

// ============================================================================
// Test Configuration
// ============================================================================

const AUTH_FILE_PATH: string = path.resolve(__dirname, "../../.auth/user.json");

const API_BASE_URL: string = "http://localhost:3000";

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

interface ApiComicsRequest {
    sceneId: string;
    targetPanelCount?: number;
}

interface ComicPanel {
    id: string;
    panelNumber: number;
    shotType: string;
    imageUrl: string;
    narrative: string | null;
    dialogue: unknown;
    sfx: unknown;
}

interface ApiComicsResponse {
    success: boolean;
    message: string;
    scene: {
        id: string;
        title: string;
        comicStatus: string | null;
        comicPanelCount: number | null;
        comicGeneratedAt: string | null;
        comicVersion: number | null;
    };
    result: {
        toonplay: unknown;
        panels: ComicPanel[];
        evaluation: unknown;
        metadata: {
            generationTime: number;
            toonplayTime: number;
            panelGenerationTime: number;
            savedToDatabase: boolean;
        };
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
let testSceneId: string;

// ============================================================================
// Test Setup
// ============================================================================

beforeAll(async () => {
    // Load authentication from .auth/user.json
    const authFileContent: string = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    authData = JSON.parse(authFileContent) as AuthData;
    writerApiKey = authData.develop.profiles.writer.apiKey;

    // Get writer user ID from database
    const writerEmail: string = authData.develop.profiles.writer.email;
    const writerUser = await db.query.users.findFirst({
        where: eq(users.email, writerEmail),
    });

    if (!writerUser) {
        throw new Error(`Writer user not found: ${writerEmail}`);
    }

    writerUserId = writerUser.id;

    // Generate unique IDs for test data
    testStoryId = `story_test_comics_${Date.now()}`;
    testPartId = `part_test_comics_${Date.now()}`;
    testChapterId = `chapter_test_comics_${Date.now()}`;
    testCharacterId = `char_test_comics_${Date.now()}`;
    testSettingId = `setting_test_comics_${Date.now()}`;
    testSceneId = `scene_test_comics_${Date.now()}`;

    // Create test story with moral framework
    await db
        .insert(stories as any)
        .values({
            id: testStoryId,
            authorId: writerUserId,
            title: "Test Story for Comic Generation",
            summary: "A test story for comic panel generation tests",
            genre: "Fantasy",
            tone: "hopeful",
            language: "en",
            targetAudience: "general",
            userPrompt: "A test story for comics",
            moralFramework: {
                adversity: {
                    type: "external-conflict",
                    description: "Test adversity",
                },
                virtue: { virtue: "courage", description: "Test virtue" },
                consequence: {
                    type: "character-growth",
                    description: "Test consequence",
                },
            },
        })
        .onConflictDoNothing();

    // Create test character with all required fields
    await db
        .insert(characters as any)
        .values({
            id: testCharacterId,
            storyId: testStoryId,
            name: "Hero",
            role: "protagonist",
            summary: "A brave hero",
            coreTrait: "courage",
            internalFlaw: "Fears failure",
            externalGoal: "Save the kingdom",
            backstory: "A hero's journey",
            personality: {
                traits: ["brave", "determined"],
                mannerisms: ["confident walk"],
                quirks: ["whistles when nervous"],
            },
            physicalDescription: {
                age: "young adult",
                build: "athletic",
                height: "tall",
                features: ["dark hair", "green eyes"],
            },
            voiceStyle: {
                tone: "confident",
                vocabulary: "simple",
                speechPatterns: ["direct"],
            },
        })
        .onConflictDoNothing();

    // Create test setting
    await db
        .insert(settings)
        .values({
            id: testSettingId,
            storyId: testStoryId,
            name: "Ancient Temple",
            summary: "A mysterious ancient temple",
            adversityElements: {
                physicalObstacles: ["crumbling walls"],
                scarcityFactors: ["limited light"],
                dangerSources: ["unstable structure"],
                socialDynamics: ["abandoned location"],
            },
            virtueElements: {
                witnessElements: ["sacred symbols"],
                contrastElements: ["light vs shadow"],
                opportunityElements: ["hidden passages"],
                sacredSpaces: ["altar room"],
            },
            consequenceElements: {
                transformativeElements: ["awakening power"],
                rewardSources: ["ancient wisdom"],
                revelationTriggers: ["mysterious inscription"],
                communityResponses: ["legends come true"],
            },
            symbolicMeaning: "A place of transformation",
            mood: "mysterious",
            emotionalResonance: "wonder",
            sensory: {
                sight: ["dim light", "ancient carvings"],
                sound: ["echoing footsteps"],
                smell: ["musty air"],
                touch: ["cold stone"],
                taste: [],
            },
            architecturalStyle: "Ancient ruins",
            visualReferences: ["temple architecture"],
            colorPalette: ["stone gray", "golden light"],
        })
        .onConflictDoNothing();

    // Create test part
    await db
        .insert(parts as any)
        .values({
            id: testPartId,
            storyId: testStoryId,
            title: "Test Part",
            summary: "A test part",
            characterArcs: [],
            orderIndex: 0,
        })
        .onConflictDoNothing();

    // Create test chapter
    await db
        .insert(chapters as any)
        .values({
            id: testChapterId,
            storyId: testStoryId,
            partId: testPartId,
            characterId: testCharacterId,
            title: "Test Chapter",
            summary: "A test chapter for comic panels",
            arcPosition: "middle",
            contributesToMacroArc:
                "Tests the protagonist's courage through trials",
            adversityType: "external",
            virtueType: "courage",
            connectsToPreviousChapter: "Hero enters the temple",
            createsNextAdversity: "Discovery leads to new challenge",
            orderIndex: 0,
        })
        .onConflictDoNothing();

    // Create test scene with detailed content for comic conversion
    await db
        .insert(scenes as any)
        .values({
            id: testSceneId,
            storyId: testStoryId,
            chapterId: testChapterId,
            settingId: testSettingId,
            title: "The Discovery",
            summary:
                "Hero discovers ancient inscription and faces a pivotal choice",
            content: `The Hero stood in the center of the ancient temple, torch held high. Shadows danced across crumbling stone walls.

"This place... it's older than I thought," the Hero whispered, voice echoing in the vast chamber.

The temple responded with only silence and the distant drip of water.

The Hero moved forward, footsteps careful on the uneven floor. Each step revealed more intricate carvings on the walls - symbols of power, warnings, and promises.

At the chamber's far end, golden light filtered through a crack in the ceiling, illuminating an altar. On it, an ancient inscription glowed with ethereal energy.

"The prophecy," the Hero breathed, approaching with reverence and trepidation.

The inscription pulsed brighter as the Hero drew near, as if recognizing a kindred spirit. Ancient wisdom called out across the centuries.

The Hero reached out, fingers trembling just above the glowing surface. This was the moment - the choice that would change everything.

"For my kingdom," the Hero declared, palm pressing against the warm stone.

Light exploded outward, engulfing everything in brilliant radiance. The temple awakened.`,
            cyclePhase: "virtue",
            emotionalBeat: "hope",
            dialogueVsDescription: "30% dialogue, 70% description",
            suggestedLength: "medium",
            orderIndex: 0,
        })
        .onConflictDoNothing();

    console.log(
        "✓ Test setup complete - using writer API key and test database records",
    );
});

// ============================================================================
// Test Cleanup
// ============================================================================

afterAll(async () => {
    // Clean up test data in reverse order of dependencies
    await db.delete(comicPanels).where(eq(comicPanels.sceneId, testSceneId));
    await db.delete(scenes).where(eq(scenes.id, testSceneId));
    await db.delete(chapters).where(eq(chapters.id, testChapterId));
    await db.delete(parts).where(eq(parts.id, testPartId));
    await db.delete(settings).where(eq(settings.id, testSettingId));
    await db.delete(characters).where(eq(characters.id, testCharacterId));
    await db.delete(stories).where(eq(stories.id, testStoryId));

    console.log("✓ Test cleanup complete - removed test database records");
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate comic panels via API endpoint
 */
async function generateComicPanels(
    requestBody: ApiComicsRequest,
): Promise<ApiComicsResponse> {
    const apiEndpoint = `/api/studio/scenes/${requestBody.sceneId}/comic/generate`;

    // Note: Using global fetch (Node.js 18+) without custom agent
    // For longer timeouts, consider using AbortController with signal
    const response: Response = await undiciFetch(`${API_BASE_URL}${apiEndpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": writerApiKey,
        },
        body: JSON.stringify({
            targetPanelCount: requestBody.targetPanelCount,
            regenerate: false,
        }),
    });

    if (!response.ok) {
        const errorText: string = await response.text();
        throw new Error(
            `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
        );
    }

    const result: ApiComicsResponse =
        (await response.json()) as ApiComicsResponse;
    return result;
}

// ============================================================================
// Comic Generation Tests
// ============================================================================

describe("Comics System Integration", () => {
    it("should generate comic panels with toonplay conversion", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
            targetPanelCount: 6,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Basic properties
        expect(result.success).toBe(true);
        expect(result.scene.id).toBe(testSceneId);
        expect(result.scene.comicPanelCount).toBeGreaterThanOrEqual(6);
        expect(result.result.panels).toBeDefined();
        expect(Array.isArray(result.result.panels)).toBe(true);
        expect(result.result.panels.length).toBeGreaterThanOrEqual(6);

        // Assert - Panel structure
        const firstPanel = result.result.panels[0];
        expect(firstPanel.id).toBeDefined();
        expect(firstPanel.panelNumber).toBe(1);
        expect(firstPanel.shotType).toBeDefined();
        expect(firstPanel.imageUrl).toContain("blob.vercel-storage.com");

        // Assert - Shot types variety
        const shotTypes = result.result.panels.map((p) => p.shotType);
        const uniqueShotTypes = new Set(shotTypes);
        expect(uniqueShotTypes.size).toBeGreaterThanOrEqual(3); // At least 3 different shot types
    }, 600000); // 10 minute timeout

    it("should include quality evaluation results", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Evaluation completeness
        expect((result.result.evaluation as any)).toBeDefined();
        expect((result.result.evaluation as any).weighted_score).toBeGreaterThan(0);
        expect((result.result.evaluation as any).weighted_score).toBeLessThanOrEqual(5);
        expect(typeof (result.result.evaluation as any).passes).toBe("boolean");

        // Assert - Evaluation categories
        expect(
            (result.result.evaluation as any).category1_narrative_fidelity,
        ).toBeDefined();
        expect(
            (result.result.evaluation as any).category2_visual_transformation,
        ).toBeDefined();
        expect((result.result.evaluation as any).category3_webtoon_pacing).toBeDefined();
        expect(
            (result.result.evaluation as any).category4_script_formatting,
        ).toBeDefined();

        // Assert - Quality threshold (should pass or be close)
        expect((result.result.evaluation as any).weighted_score).toBeGreaterThanOrEqual(
            2.5,
        );
    }, 600000);

    it("should generate panels with proper toonplay structure", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
            targetPanelCount: 8,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Panel count
        expect(result.scene.comicPanelCount).toBeGreaterThanOrEqual(7);
        expect(result.scene.comicPanelCount).toBeLessThanOrEqual(12);

        // Assert - Panel ordering
        const panelNumbers = result.result.panels.map((p) => p.panelNumber);
        expect(panelNumbers).toEqual(
            [...Array(panelNumbers.length).keys()].map((i) => i + 1),
        );

        // Assert - All panels have required fields
        for (const panel of result.result.panels) {
            expect(panel.id).toBeDefined();
            expect(panel.panelNumber).toBeGreaterThan(0);
            expect(panel.shotType).toBeDefined();
            expect(panel.imageUrl).toContain("blob.vercel-storage.com");
            expect(panel.dialogue).toBeDefined();
            expect(panel.sfx).toBeDefined();
        }
    }, 600000);

    it("should save panels to database", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Database save confirmation
        expect(result.result.metadata.savedToDatabase).toBe(true);

        // Verify panels exist in database
        const dbPanels = await db.query.comicPanels.findMany({
            where: eq(comicPanels.sceneId, testSceneId),
        });

        expect(dbPanels.length).toBe(result.scene.comicPanelCount);
        expect(dbPanels[0].sceneId).toBe(testSceneId);
        expect(dbPanels[0].imageUrl).toBeDefined();
    }, 600000);

    it("should track generation timing metadata", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Timing metadata
        expect(result.result.metadata).toBeDefined();
        expect(result.result.metadata.generationTime).toBeGreaterThan(0);
        expect(result.result.metadata.toonplayTime).toBeGreaterThan(0);
        expect(result.result.metadata.panelGenerationTime).toBeGreaterThan(0);

        // Assert - Timing relationships
        expect(result.result.metadata.generationTime).toBeGreaterThanOrEqual(
            result.result.metadata.toonplayTime,
        );
        expect(result.result.metadata.generationTime).toBeGreaterThanOrEqual(
            result.result.metadata.panelGenerationTime,
        );
    }, 600000);

    it("should generate panels with varied shot types", async () => {
        // Arrange
        const requestBody: ApiComicsRequest = {
            sceneId: testSceneId,
            targetPanelCount: 10,
        };

        // Act
        const result: ApiComicsResponse =
            await generateComicPanels(requestBody);

        // Assert - Shot type distribution
        const shotTypes = result.result.panels.map((p) => p.shotType);
        const shotTypeCount: Record<string, number> = {};

        for (const shotType of shotTypes) {
            shotTypeCount[shotType] = (shotTypeCount[shotType] || 0) + 1;
        }

        // Should have multiple different shot types
        expect(Object.keys(shotTypeCount).length).toBeGreaterThanOrEqual(4);

        // Should include establishing shot (usually first panel)
        expect(shotTypes).toContain("establishing_shot");

        // Should have variety (no single shot type dominates too much)
        const maxCount = Math.max(...Object.values(shotTypeCount));
        const totalPanels = shotTypes.length;
        expect(maxCount / totalPanels).toBeLessThan(0.7); // No shot type > 70%
    }, 600000);
});
