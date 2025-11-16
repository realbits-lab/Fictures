/**
 * Integration Tests for Comic Panel Image Generation
 *
 * Tests the comic panel image generation system using real API calls.
 * Uses writer@fictures.xyz API key from .auth/user.json (develop env).
 *
 * Test coverage:
 * - Image generation from toonplay specifications
 * - Panel image generation pipeline
 * - Image URL and metadata validation
 * - NO toonplay generation (that's tested in __tests__/toonplay/)
 */

import fs from "node:fs";
import path from "node:path";
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
import { generateComicPanels } from "@/lib/studio/generators/comic-panel-generator";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import { withAuth } from "@/lib/auth/server-context";
import type { AuthContext } from "@/lib/auth/context";

// ============================================================================
// Test Configuration
// ============================================================================

const AUTH_FILE_PATH: string = path.resolve(__dirname, "../../.auth/user.json");
const COMICS_TEST_PREFIX = "[comics.test.ts]";

function logComicsTest(testCase: string, message: string): void {
    console.log(`${COMICS_TEST_PREFIX}[${testCase}] ${message}`);
}

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
            title: "Test Story for Comic Image Generation",
            summary: "A test story for comic panel image generation tests",
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
                appearance: "heroic",
                distinctiveFeatures: ["scar on left cheek"],
                style: "adventurer's gear",
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

    // Create test scene
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
            content: `The Hero stood in the center of the ancient temple, torch held high.`,
            cyclePhase: "virtue",
            emotionalBeat: "hope",
            dialogueVsDescription: "30% dialogue, 70% description",
            suggestedLength: "medium",
            orderIndex: 0,
        })
        .onConflictDoNothing();

    logComicsTest(
        "setup",
        "Finished creating test story/character/scene records for comic panels",
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

    logComicsTest("cleanup", "Removed comic panel test fixtures from database");
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a mock toonplay for testing image generation
 */
function createMockToonplay(): AiComicToonplayType {
    return {
        scene_id: testSceneId,
        scene_title: "The Discovery",
        total_panels: 3,
        narrative_arc: "Hero discovers ancient power and makes a pivotal choice",
        panels: [
            {
                panel_number: 1,
                shot_type: "establishing_shot",
                description:
                    "Wide shot of an ancient temple interior. Stone pillars rise to a vaulted ceiling. Dim torchlight casts long shadows across weathered carvings. The Hero stands center frame, torch held high, silhouetted against the ancient architecture.",
                characters_visible: [testCharacterId],
                character_poses: {
                    [testCharacterId]: "Standing confidently, torch raised",
                },
                setting_focus: "Ancient temple architecture with intricate carvings",
                lighting: "Dim torchlight creating dramatic shadows",
                camera_angle: "Eye level, slightly low angle for grandeur",
                narrative: undefined,
                dialogue: [
                    {
                        character_id: testCharacterId,
                        text: "This place... it's older than I thought.",
                    },
                ],
                sfx: [],
                mood: "mysterious",
            },
            {
                panel_number: 2,
                shot_type: "medium_shot",
                description:
                    "Medium shot of the Hero approaching an altar. Golden light filters through a crack in the ceiling, illuminating an ancient inscription. The Hero's hand reaches toward the glowing surface, fingers trembling slightly.",
                characters_visible: [testCharacterId],
                character_poses: {
                    [testCharacterId]: "Reaching forward with reverence",
                },
                setting_focus: "Altar with glowing inscription",
                lighting: "Golden ethereal light from above",
                camera_angle: "Eye level, following the Hero's perspective",
                narrative: undefined,
                dialogue: [
                    {
                        character_id: testCharacterId,
                        text: "The prophecy...",
                    },
                ],
                sfx: [],
                mood: "reverent",
            },
            {
                panel_number: 3,
                shot_type: "close_up",
                description:
                    "Close-up of the Hero's hand pressing against the warm stone. Light explodes outward from the point of contact, engulfing everything in brilliant radiance. The temple awakens with magical energy.",
                characters_visible: [testCharacterId],
                character_poses: {
                    [testCharacterId]: "Hand pressed against stone, body tensed",
                },
                setting_focus: "Explosion of light and magical energy",
                lighting: "Brilliant white radiance",
                camera_angle: "Extreme close-up on hand and light",
                narrative: undefined,
                dialogue: [
                    {
                        character_id: testCharacterId,
                        text: "For my kingdom!",
                    },
                ],
                sfx: [
                    {
                        text: "SHIMMER",
                        emphasis: "dramatic",
                    },
                ],
                mood: "triumphant",
            },
        ],
    };
}

/**
 * Generate comic panel images from toonplay
 */
async function generatePanelImages(
    toonplay: AiComicToonplayType,
): Promise<Awaited<ReturnType<typeof generateComicPanels>>> {
    // Fetch scene data
    const scene = await db.query.scenes.findFirst({
        where: eq(scenes.id, toonplay.scene_id),
        with: {
            chapter: {
                with: {
                    story: true,
                },
            },
        },
    });

    if (!scene || !scene.chapter) {
        throw new Error(`Scene not found: ${toonplay.scene_id}`);
    }

    // Fetch characters and settings
    const storyCharacters = await db.query.characters.findMany({
        where: eq(characters.storyId, scene.chapter.story.id),
    });

    const storySettings = await db.query.settings.findMany({
        where: eq(settings.storyId, scene.chapter.story.id),
    });

    // Create authentication context for the service call
    const authContext: AuthContext = {
        type: "api-key",
        userId: writerUserId,
        email: authData.develop.profiles.writer.email,
        apiKey: writerApiKey,
        scopes: ["stories:write", "images:write"],
        metadata: {
            requestId: `test_${Date.now()}`,
            timestamp: Date.now(),
        },
    };

    // Generate panel images within auth context
    logComicsTest(
        "generate-panels",
        `Invoking generateComicPanels for scene=${scene.id} toonplayPanels=${toonplay.total_panels}`,
    );

    return await withAuth(authContext, async () => {
        const result = await generateComicPanels({
            toonplay,
            storyId: scene.chapter.story.id,
            chapterId: scene.chapter.id,
            sceneId: scene.id,
            characters: storyCharacters as any,
            settings: storySettings as any,
            storyGenre: scene.chapter.story.genre || "drama",
        });

        logComicsTest(
            "generate-panels",
            `Generation complete in ${result.metadata.generationTime}ms with model=${result.metadata.model}`,
        );

        return result;
    });
}

// ============================================================================
// Comic Panel Image Generation Tests
// ============================================================================

describe("Comic Panel Image Generation Integration", () => {
    it("should generate images for all panels in toonplay", async () => {
        logComicsTest("panel-count", "Generating comic panels for toonplay spec");
        // Arrange
        const toonplay = createMockToonplay();

        // Act
        const result = await generatePanelImages(toonplay);

        result.panels.forEach((panel) =>
            logComicsTest(
                "panel-count",
                `Panel ${panel.panel_number} imageUrl=${panel.imageUrl}`,
            ),
        );

        // Assert - Basic properties
        expect(result.panels).toBeDefined();
        expect(Array.isArray(result.panels)).toBe(true);
        expect(result.panels.length).toBe(toonplay.total_panels);

        // Assert - Each panel has an image
        for (const panel of result.panels) {
            expect(panel.imageUrl).toBeDefined();
            expect(panel.imageUrl).toMatch(/^https?:\/\//); // Valid URL
            expect(panel.width).toBeGreaterThan(0);
            expect(panel.height).toBeGreaterThan(0);
            expect(panel.model).toBeDefined();
            expect(panel.provider).toBeDefined();
        }
    }, 600000); // 10 minute timeout

    it("should generate images with correct aspect ratio (9:16)", async () => {
        logComicsTest("aspect-ratio", "Validating comic panel aspect ratios");
        // Arrange
        const toonplay = createMockToonplay();

        // Act
        const result = await generatePanelImages(toonplay);

        // Assert - Aspect ratio should be approximately 9:16 (0.5625)
        for (const panel of result.panels) {
            const aspectRatio = panel.width / panel.height;
            const expectedRatio = 9 / 16; // 0.5625
            const tolerance = 0.1; // Allow 10% tolerance

            expect(Math.abs(aspectRatio - expectedRatio)).toBeLessThan(
                tolerance,
            );
        }
    }, 600000);

    it("should preserve toonplay specifications in results", async () => {
        logComicsTest("spec-sync", "Ensuring toonplay specs preserved");
        // Arrange
        const toonplay = createMockToonplay();

        // Act
        const result = await generatePanelImages(toonplay);

        // Assert - Panel numbers match
        const panelNumbers = result.panels.map((p) => p.panel_number);
        expect(panelNumbers).toEqual([1, 2, 3]);

        // Assert - Each panel has toonplay spec
        for (const panel of result.panels) {
            expect(panel.toonplaySpec).toBeDefined();
            expect(panel.toonplaySpec.panel_number).toBe(panel.panel_number);
            expect(panel.toonplaySpec.shot_type).toBeDefined();
            expect(panel.toonplaySpec.description).toBeDefined();
        }
    }, 600000);

    it("should track generation metadata", async () => {
        logComicsTest("metadata", "Validating metadata block");
        // Arrange
        const toonplay = createMockToonplay();

        // Act
        const result = await generatePanelImages(toonplay);

        logComicsTest(
            "metadata",
            `Metadata: panels=${result.metadata.totalPanels} time=${result.metadata.generationTime}ms model=${result.metadata.model}`,
        );

        // Assert - Metadata completeness
        expect(result.metadata).toBeDefined();
        expect(result.metadata.totalPanels).toBe(toonplay.total_panels);
        expect(result.metadata.generationTime).toBeGreaterThan(0);
        expect(result.metadata.model).toBeDefined();
        expect(result.metadata.provider).toBeDefined();
    }, 600000);

    it("should generate images with consistent model/provider", async () => {
        logComicsTest("consistency", "Checking panel model/provider consistency");
        // Arrange
        const toonplay = createMockToonplay();

        // Act
        const result = await generatePanelImages(toonplay);

        // Assert - All panels use the same model/provider
        const firstModel = result.panels[0]?.model;
        const firstProvider = result.panels[0]?.provider;

        for (const panel of result.panels) {
            logComicsTest(
                "consistency",
                `Panel ${panel.panel_number} model=${panel.model} provider=${panel.provider}`,
            );
            expect(panel.model).toBe(firstModel);
            expect(panel.provider).toBe(firstProvider);
        }

        // Metadata should match
        expect(result.metadata.model).toBe(firstModel);
        expect(result.metadata.provider).toBe(firstProvider);
    }, 600000);
});
