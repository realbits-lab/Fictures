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

// ============================================================================
// Test Configuration
// ============================================================================

const AUTH_FILE_PATH: string = path.resolve(__dirname, "../../.auth/user.json");
const COMICS_TEST_PREFIX = "[comics.test.ts]";
const API_BASE_URL = "http://localhost:3000";
const TARGET_PANEL_COUNT = 3;

const getComicGenerationEndpoint = (sceneId: string): string =>
    `${API_BASE_URL}/api/studio/scenes/${sceneId}/comic/generate`;

function logComicsTest(testCase: string, message: string): void {
    console.log(`${COMICS_TEST_PREFIX}[${testCase}] ${message}`);
}

const preview = (value: string | undefined | null, max = 120): string => {
    if (!value) {
        return "";
    }
    if (value.length <= max) {
        return value;
    }
    return `${value.slice(0, max)}…(+${value.length - max} chars)`;
};

interface ComicPanelMetadata {
    width?: number;
    height?: number;
    aspectRatio?: string | number;
    model?: string;
    provider?: string;
}

interface ComicPanelPayload {
    id: string;
    panelNumber: number;
    shotType: string;
    imageUrl: string;
    imageVariants?: Record<string, unknown> | null;
    description?: string | null;
    narrative?: string | null;
    dialogue?: unknown;
    sfx?: unknown;
    metadata?: ComicPanelMetadata | null;
}

interface ComicGenerationApiResponse {
    success: boolean;
    message?: string;
    scene: {
        id: string;
        title?: string | null;
        comicStatus?: string | null;
        comicPanelCount?: number | null;
    };
    result: {
        toonplay: {
            total_panels: number;
            panels: Array<{
                panel_number: number;
                shot_type: string;
                description: string;
            }>;
        };
        panels: ComicPanelPayload[];
        evaluation: unknown;
        metadata: {
            generationTime: number;
            toonplayTime: number;
            panelGenerationTime: number;
            totalPanels: number;
            model?: string;
            provider?: string;
            aspectRatio?: string;
        };
    };
}

type ComicPanelTestContext = {
    apiResponse: ComicGenerationApiResponse;
    panels: ComicPanelPayload[];
};

let cachedComicGeneration: ComicPanelTestContext | null = null;

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
    logComicsTest("setup", `Loading auth file from ${AUTH_FILE_PATH}`);
    // Load authentication from .auth/user.json
    const authFileContent: string = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    authData = JSON.parse(authFileContent) as AuthData;
    writerApiKey = authData.develop.profiles.writer.apiKey;
    logComicsTest(
        "setup",
        `Loaded writer profile for ${authData.develop.profiles.writer.email}`,
    );

    // Get writer user ID from database
    const writerEmail: string = authData.develop.profiles.writer.email;
    const writerUser = await db.query.users.findFirst({
        where: eq(users.email, writerEmail),
    });

    if (!writerUser) {
        throw new Error(`Writer user not found: ${writerEmail}`);
    }

    writerUserId = writerUser.id;
    logComicsTest("setup", `Resolved writer userId=${writerUserId}`);

    // Generate unique IDs for test data
    testStoryId = `story_test_comics_${Date.now()}`;
    testPartId = `part_test_comics_${Date.now()}`;
    testChapterId = `chapter_test_comics_${Date.now()}`;
    testCharacterId = `char_test_comics_${Date.now()}`;
    testSettingId = `setting_test_comics_${Date.now()}`;
    testSceneId = `scene_test_comics_${Date.now()}`;
    logComicsTest(
        "setup",
        `Generated IDs story=${testStoryId} scene=${testSceneId} character=${testCharacterId}`,
    );

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
    logComicsTest("setup", "Inserted test story");

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
    logComicsTest("setup", "Inserted test character");

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
    logComicsTest("setup", "Inserted test setting");

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
    logComicsTest("setup", "Inserted test part");

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
    logComicsTest("setup", "Inserted test chapter");

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
    logComicsTest("cleanup", "Starting teardown of comic panel fixtures");
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

function getPanelMetadata(panel: ComicPanelPayload): ComicPanelMetadata {
    return (panel.metadata || {}) as ComicPanelMetadata;
}

async function generateComicPanelsViaApi(
    options: { forceRegenerate?: boolean } = {},
): Promise<ComicPanelTestContext> {
    const { forceRegenerate = false } = options;

    if (cachedComicGeneration && !forceRegenerate) {
        logComicsTest(
            "generate-panels",
            "Using cached comic generation result from previous test",
        );
        return cachedComicGeneration;
    }

    const url = getComicGenerationEndpoint(testSceneId);
    logComicsTest(
        "generate-panels",
        `Calling API ${url} (targetPanels=${TARGET_PANEL_COUNT}, regenerate=true)`,
    );

    const requestPayload = {
        targetPanelCount: TARGET_PANEL_COUNT,
        regenerate: true,
    };
    logComicsTest(
        "generate-panels",
        `Request headers: ${JSON.stringify({
            "Content-Type": "application/json",
            "x-api-key": preview(writerApiKey, 8),
        })}`,
    );
    logComicsTest(
        "generate-panels",
        `Request body: ${JSON.stringify(requestPayload)}`,
    );

    const startTime = Date.now();
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": writerApiKey,
        },
        body: JSON.stringify(requestPayload),
    });
    const duration = Date.now() - startTime;
    logComicsTest(
        "generate-panels",
        `API response received status=${response.status} ok=${response.ok} in ${duration}ms`,
    );
    const responseText = await response.text();
    let payload: ComicGenerationApiResponse;

    try {
        payload = JSON.parse(responseText) as ComicGenerationApiResponse;
    } catch (error) {
        throw new Error(
            `Failed to parse comic generation response: ${(error as Error).message}\n${responseText}`,
        );
    }

    if (!response.ok || !payload.success) {
        logComicsTest(
            "generate-panels",
            `API error payload: ${preview(responseText, 400)}`,
        );
        throw new Error(
            `Comic generation API failed (${response.status}): ${responseText}`,
        );
    }

    if (!payload.result?.panels?.length) {
        throw new Error("Comic generation API returned no panels");
    }

    cachedComicGeneration = {
        apiResponse: payload,
        panels: payload.result.panels,
    };

    logComicsTest(
        "generate-panels",
        `Generation complete: panels=${payload.result.panels.length} time=${payload.result.metadata.generationTime}ms model=${payload.result.metadata.model}`,
    );
    logComicsTest(
        "generate-panels",
        `Scene comicStatus=${payload.scene.comicStatus} totalPanels=${payload.result.metadata.totalPanels}`,
    );
    payload.result.panels.forEach((panel) => {
        const meta = getPanelMetadata(panel);
        logComicsTest(
            "generate-panels",
            `Panel ${panel.panelNumber} shot=${panel.shotType} aspect=${meta.aspectRatio} url=${preview(panel.imageUrl, 80)}`,
        );
    });

    return cachedComicGeneration;
}

// ============================================================================
// Comic Panel Image Generation Tests
// ============================================================================

describe("Comic Panel Image Generation Integration", () => {
    it("should generate images for all panels in toonplay", async () => {
        logComicsTest("panel-count", "Generating comic panels via API");

        const { apiResponse, panels } = await generateComicPanelsViaApi({
            forceRegenerate: true,
        });

        panels.forEach((panel) => {
            const meta = getPanelMetadata(panel);
            logComicsTest(
                "panel-count",
                `Panel ${panel.panelNumber} imageUrl=${preview(panel.imageUrl, 80)} model=${meta.model} provider=${meta.provider} size=${meta.width}x${meta.height}`,
            );
        });

        expect(Array.isArray(panels)).toBe(true);
        expect(panels.length).toBe(TARGET_PANEL_COUNT);
        expect(apiResponse.scene.comicPanelCount).toBe(panels.length);

        for (const panel of panels) {
            const meta = getPanelMetadata(panel);
            expect(panel.imageUrl).toMatch(/^https?:\/\//);
            expect(meta.width ?? 0).toBeGreaterThan(0);
            expect(meta.height ?? 0).toBeGreaterThan(0);
            expect(meta.model).toBeDefined();
            expect(meta.provider).toBeDefined();
        }
    }, 600000); // 10 minute timeout

    it("should generate images with correct aspect ratio (9:16)", async () => {
        logComicsTest("aspect-ratio", "Validating comic panel aspect ratios");
        const { panels } = await generateComicPanelsViaApi();

        for (const panel of panels) {
            const meta = getPanelMetadata(panel);
            const width = meta.width ?? 0;
            const height = meta.height ?? 0;
            logComicsTest(
                "aspect-ratio",
                `Panel ${panel.panelNumber} raw ratio=${width}/${height} metaRatio=${meta.aspectRatio}`,
            );
            expect(width).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);

            const aspectRatio = width / height;
            const expectedRatio = 9 / 16;
            const tolerance = 0.05;

            expect(Math.abs(aspectRatio - expectedRatio)).toBeLessThan(tolerance);
            logComicsTest(
                "aspect-ratio",
                `Panel ${panel.panelNumber} computedRatio=${aspectRatio.toFixed(4)} within tolerance`,
            );
        }
    }, 600000);

    it("should preserve toonplay specifications in results", async () => {
        logComicsTest("spec-sync", "Ensuring toonplay specs preserved");
        const { apiResponse, panels } = await generateComicPanelsViaApi();
        const toonplayPanels = apiResponse.result.toonplay.panels;
        logComicsTest(
            "spec-sync",
            `Toonplay panels=${toonplayPanels.length} generated panels=${panels.length}`,
        );

        expect(toonplayPanels.length).toBe(panels.length);
        expect(panels.map((p) => p.panelNumber)).toEqual(
            toonplayPanels.map((p) => p.panel_number),
        );

        for (const panel of panels) {
            const matchingToonplay = toonplayPanels.find(
                (tp) => tp.panel_number === panel.panelNumber,
            );
            expect(matchingToonplay).toBeDefined();
            expect(matchingToonplay?.shot_type).toBeDefined();
            expect(matchingToonplay?.description).toBeDefined();
            logComicsTest(
                "spec-sync",
                `Panel ${panel.panelNumber} shot=${matchingToonplay?.shot_type} desc=${preview(
                    matchingToonplay?.description ?? "",
                    80,
                )}`,
            );
        }
    }, 600000);

    it("should track generation metadata", async () => {
        logComicsTest("metadata", "Validating metadata block");
        const { apiResponse, panels } = await generateComicPanelsViaApi();
        const metadata = apiResponse.result.metadata;

        logComicsTest(
            "metadata",
            `Metadata: panels=${metadata.totalPanels} time=${metadata.generationTime}ms model=${metadata.model}`,
        );
        logComicsTest(
            "metadata",
            `panelGenerationTime=${metadata.panelGenerationTime}ms toonplayTime=${metadata.toonplayTime}ms aspectRatio=${metadata.aspectRatio}`,
        );

        expect(metadata.totalPanels).toBe(panels.length);
        expect(metadata.generationTime).toBeGreaterThan(0);
        expect(metadata.panelGenerationTime).toBeGreaterThan(0);
        expect(metadata.model).toBeDefined();
        expect(metadata.provider).toBeDefined();
    }, 600000);

    it("should generate images with consistent model/provider", async () => {
        logComicsTest("consistency", "Checking panel model/provider consistency");
        const { apiResponse, panels } = await generateComicPanelsViaApi();
        const firstMeta = getPanelMetadata(panels[0]);

        for (const panel of panels) {
            const meta = getPanelMetadata(panel);
            logComicsTest(
                "consistency",
                `Panel ${panel.panelNumber} model=${meta.model} provider=${meta.provider}`,
            );
            expect(meta.model).toBe(firstMeta.model);
            expect(meta.provider).toBe(firstMeta.provider);
        }

        expect(apiResponse.result.metadata.model).toBe(firstMeta.model);
        expect(apiResponse.result.metadata.provider).toBe(firstMeta.provider);
        logComicsTest(
            "consistency",
            `Metadata model/provider ${apiResponse.result.metadata.model}/${apiResponse.result.metadata.provider}`,
        );
    }, 600000);
});
