/**
 * Integration Tests for Toonplay Generation (API Only)
 *
 * Tests the toonplay generation system using real API calls.
 * Uses writer@fictures.xyz API key from .auth/user.json (develop env).
 *
 * Test coverage:
 * - Toonplay generation from scene narrative via API
 * - Quality evaluation results
 * - Toonplay structure and validation
 * - API response format validation
 * - NO direct service calls (API only)
 */

import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
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

interface ApiToonplayRequest {
    sceneId: string;
    evaluationMode?: "quick" | "standard" | "thorough";
    language?: string;
}

interface ApiToonplayResponse {
    success: boolean;
    result?: {
        toonplay: {
            scene_id: string;
            scene_title: string;
            total_panels: number;
            narrative_arc: string;
            panels: Array<{
                panel_number: number;
                shot_type: string;
                description: string;
                dialogue: Array<{
                    character_id: string;
                    text: string;
                    tone?: string;
                }>;
                narrative?: string;
                sfx: Array<{
                    text: string;
                    emphasis: string;
                }>;
                mood: string;
            }>;
        };
        evaluation: {
            weighted_score: number;
            passes: boolean;
            category1_narrative_fidelity: unknown;
            category2_visual_transformation: unknown;
            category3_webtoon_pacing: unknown;
            category4_script_formatting: unknown;
        };
        metadata: {
            generationTime: number;
            toonplayTime?: number;
            iterations?: number;
        };
    };
    error?: {
        code: string;
        message: string;
        details?: unknown;
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
    testStoryId = `story_test_toonplay_${Date.now()}`;
    testPartId = `part_test_toonplay_${Date.now()}`;
    testChapterId = `chapter_test_toonplay_${Date.now()}`;
    testCharacterId = `char_test_toonplay_${Date.now()}`;
    testSettingId = `setting_test_toonplay_${Date.now()}`;
    testSceneId = `scene_test_toonplay_${Date.now()}`;

    // Create test story with moral framework
    await db
        .insert(stories as any)
        .values({
            id: testStoryId,
            authorId: writerUserId,
            title: "Test Story for Toonplay Generation",
            summary: "A test story for toonplay generation tests",
            genre: "Fantasy",
            tone: "hopeful",
            language: "en",
            targetAudience: "general",
            userPrompt: "A test story for toonplay",
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
            summary: "A test chapter for toonplay",
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

    // Create test scene with detailed content for toonplay conversion
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
 * Generate toonplay via API endpoint
 */
async function generateToonplayViaAPI(
    requestBody: ApiToonplayRequest,
): Promise<ApiToonplayResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 900000); // 15 minute timeout

    try {
        const response = await fetch(`${API_BASE_URL}/api/studio/toonplay`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": writerApiKey,
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            let errorData: any;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { message: errorText || `HTTP ${response.status}` };
            }
            
            console.error(`[TEST] API Error (${response.status}):`, errorData);
            
            return {
                success: false,
                error: {
                    code: "API_ERROR",
                    message: errorData.error?.message || errorData.message || `HTTP ${response.status}`,
                    details: errorData,
                },
            };
        }

        const data = await response.json();
        
        if (!data.success) {
            console.error("[TEST] API returned success=false:", data);
        }
        
        return data as ApiToonplayResponse;
    } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timeout after 15 minutes");
        }
        throw error;
    }
}

// ============================================================================
// Toonplay Generation Tests (API Only)
// ============================================================================

describe("Toonplay Generation Integration (API)", () => {
    it("should generate toonplay from scene narrative via API", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
            evaluationMode: "quick",
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - API response structure
        if (!result.success) {
            console.error("[TEST] API call failed:", result.error);
            throw new Error(
                `API call failed: ${result.error?.code || "UNKNOWN"} - ${result.error?.message || "Unknown error"}`,
            );
        }
        expect(result.success).toBe(true);
        expect(result.result).toBeDefined();
        expect(result.result?.toonplay).toBeDefined();

        // Assert - Toonplay basic properties
        const toonplay = result.result!.toonplay;
        expect(toonplay.scene_id).toBe(testSceneId);
        expect(toonplay.scene_title).toBeDefined();
        expect(toonplay.total_panels).toBeGreaterThanOrEqual(8);
        expect(toonplay.total_panels).toBeLessThanOrEqual(12);
        expect(Array.isArray(toonplay.panels)).toBe(true);
        expect(toonplay.panels.length).toBe(toonplay.total_panels);
        expect(toonplay.narrative_arc).toBeDefined();

        // Assert - Panel structure
        const firstPanel = toonplay.panels[0];
        expect(firstPanel.panel_number).toBe(1);
        expect(firstPanel.shot_type).toBeDefined();
        expect(firstPanel.description).toBeDefined();
        expect(firstPanel.description.length).toBeGreaterThan(0);
        expect(Array.isArray(firstPanel.dialogue)).toBe(true);
        expect(Array.isArray(firstPanel.sfx)).toBe(true);
        expect(firstPanel.mood).toBeDefined();
    }, 900000); // 15 minute timeout

    it("should include quality evaluation results in API response", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
            evaluationMode: "standard",
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - API response success
        if (!result.success) {
            console.error("[TEST] API call failed:", result.error);
            throw new Error(
                `API call failed: ${result.error?.code || "UNKNOWN"} - ${result.error?.message || "Unknown error"}`,
            );
        }
        expect(result.success).toBe(true);
        expect(result.result?.evaluation).toBeDefined();

        // Assert - Evaluation completeness
        const evaluation = result.result!.evaluation;
        expect(evaluation.weighted_score).toBeGreaterThan(0);
        expect(evaluation.weighted_score).toBeLessThanOrEqual(5);
        expect(typeof evaluation.passes).toBe("boolean");

        // Assert - Evaluation categories
        expect(evaluation.category1_narrative_fidelity).toBeDefined();
        expect(evaluation.category2_visual_transformation).toBeDefined();
        expect(evaluation.category3_webtoon_pacing).toBeDefined();
        expect(evaluation.category4_script_formatting).toBeDefined();

        // Assert - Quality threshold (should pass or be close)
        expect(evaluation.weighted_score).toBeGreaterThanOrEqual(2.5);
    }, 900000);

    it("should generate toonplay with proper structure via API", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - API response
        if (!result.success) {
            console.error("[TEST] API call failed:", result.error);
            throw new Error(
                `API call failed: ${result.error?.code || "UNKNOWN"} - ${result.error?.message || "Unknown error"}`,
            );
        }
        expect(result.success).toBe(true);
        const toonplay = result.result!.toonplay;

        // Assert - Panel count
        expect(toonplay.total_panels).toBeGreaterThanOrEqual(8);
        expect(toonplay.total_panels).toBeLessThanOrEqual(12);

        // Assert - Panel ordering
        const panelNumbers = toonplay.panels.map((p) => p.panel_number);
        expect(panelNumbers).toEqual(
            [...Array(panelNumbers.length).keys()].map((i) => i + 1),
        );

        // Assert - All panels have required fields
        for (const panel of toonplay.panels) {
            expect(panel.panel_number).toBeGreaterThan(0);
            expect(panel.shot_type).toBeDefined();
            expect(panel.description).toBeDefined();
            expect(panel.description.length).toBeGreaterThan(0);
            expect(Array.isArray(panel.dialogue)).toBe(true);
            expect(Array.isArray(panel.sfx)).toBe(true);
            expect(panel.mood).toBeDefined();
        }
    }, 900000);

    it("should track generation timing metadata in API response", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - Metadata completeness
        expect(result.result?.metadata).toBeDefined();
        const metadata = result.result!.metadata;
        expect(metadata.generationTime).toBeGreaterThan(0);
        if (metadata.toonplayTime !== undefined) {
            expect(metadata.toonplayTime).toBeGreaterThan(0);
        }
        if (metadata.iterations !== undefined) {
            expect(metadata.iterations).toBeGreaterThanOrEqual(1);
        }
    }, 900000);

    it("should generate toonplay with varied shot types via API", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - Shot type distribution
        const shotTypes = result.result!.toonplay.panels.map((p) => p.shot_type);
        const shotTypeCount: Record<string, number> = {};

        for (const shotType of shotTypes) {
            shotTypeCount[shotType] = (shotTypeCount[shotType] || 0) + 1;
        }

        // Should have multiple different shot types
        expect(Object.keys(shotTypeCount).length).toBeGreaterThanOrEqual(3);

        // Should include establishing shot (usually first panel)
        expect(shotTypes).toContain("establishing_shot");
    }, 900000);

    it("should handle different evaluation modes via API", async () => {
        // Arrange - Test quick mode
        const quickRequest: ApiToonplayRequest = {
            sceneId: testSceneId,
            evaluationMode: "quick",
        };

        // Act
        const quickResult = await generateToonplayViaAPI(quickRequest);

        // Assert
        expect(quickResult.success).toBe(true);
        expect(quickResult.result?.evaluation).toBeDefined();
        expect(quickResult.result?.evaluation.weighted_score).toBeGreaterThan(0);
    }, 900000);

    it("should validate dialogue structure in API response", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - Dialogue structure
        for (const panel of result.result!.toonplay.panels) {
            for (const dialogue of panel.dialogue) {
                expect(dialogue.character_id).toBeDefined();
                expect(dialogue.text).toBeDefined();
                expect(dialogue.text.length).toBeGreaterThan(0);
                expect(dialogue.text.length).toBeLessThanOrEqual(150); // Max dialogue length
            }
        }
    }, 900000);

    it("should validate SFX structure in API response", async () => {
        // Arrange
        const requestBody: ApiToonplayRequest = {
            sceneId: testSceneId,
        };

        // Act
        const result = await generateToonplayViaAPI(requestBody);

        // Assert - SFX structure
        for (const panel of result.result!.toonplay.panels) {
            for (const sfx of panel.sfx) {
                expect(sfx.text).toBeDefined();
                expect(sfx.text.length).toBeGreaterThan(0);
                expect(sfx.text.length).toBeLessThanOrEqual(50); // Max SFX length
                expect(["normal", "large", "dramatic"]).toContain(sfx.emphasis);
            }
        }
    }, 900000);
});

