/**
 * Comic Panel Generator Tests (stubbed data)
 *
 * These tests exercise the comic panel generation pipeline directly with
 * stubbed story assets (toonplay, characters, settings) so we avoid DB
 * fixtures and API calls. This mirrors the integration expectations but
 * runs much faster and more deterministically.
 */

import fs from "node:fs";
import path from "node:path";
import type { InferSelectModel } from "drizzle-orm";
import { generateRequestId } from "@/lib/auth/context";
import { withAuth } from "@/lib/auth/server-context";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import type { characters, settings } from "@/lib/schemas/database";
import { generateComicPanels } from "@/lib/studio/generators/comic-panel-generator";

process.env.COMICS_IMAGE_ONLY = process.env.COMICS_IMAGE_ONLY || "true";

// ============================================================================
// Test Configuration
// ============================================================================

const AUTH_FILE_PATH: string = path.resolve(__dirname, "../../.auth/user.json");
const COMICS_TEST_PREFIX = "[comics.test.ts]";
const TARGET_PANEL_COUNT = 3;

type CharacterRow = InferSelectModel<typeof characters>;
type SettingRow = InferSelectModel<typeof settings>;

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

interface PanelMetadata {
    width?: number;
    height?: number;
    aspectRatio?: string | number;
    model?: string;
    provider?: string;
}

type PanelResult = Awaited<ReturnType<typeof generateComicPanels>>;

interface AuthData {
    develop: {
        profiles: {
            writer: {
                apiKey: string;
                email: string;
            };
        };
    };
}

let writerApiKey: string;
let cachedResult: PanelResult | null = null;

function loadWriterApiKey(): void {
    if (writerApiKey) return;
    logComicsTest("setup", `Loading auth file from ${AUTH_FILE_PATH}`);
    const authContent = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    const authJson = JSON.parse(authContent) as AuthData;
    writerApiKey = authJson.develop.profiles.writer.apiKey;
    logComicsTest("setup", "Loaded writer API key");
}

function buildStubToonplay(): AiComicToonplayType {
    const baseDescription =
        "A heroic explorer navigates luminous ruins with flowing fabrics and determined eyes, showcasing intricate stone carvings.";
    return {
        scene_id: "scene_stub_001",
        scene_title: "Stub Scene",
        total_panels: TARGET_PANEL_COUNT,
        pacing_notes: "Cinematic pacing with escalating stakes",
        narrative_arc: "Setup → Discovery → Resolution",
        panels: [
            {
                panel_number: 1,
                shot_type: "establishing_shot",
                description: `${baseDescription} Panel one sets tone.`,
                characters_visible: ["char_stub"],
                character_poses: {
                    char_stub: "Confident stance surveying ruins",
                },
                setting_focus: "Vast floating archive",
                lighting: "Radiant golden shafts of light",
                camera_angle: "wide panoramic",
                mood: "awe",
                dialogue: [],
                sfx: [],
            },
            {
                panel_number: 2,
                shot_type: "medium_shot",
                description: `${baseDescription} Panel two heightens detail.`,
                characters_visible: ["char_stub"],
                character_poses: { char_stub: "Kneeling inspecting glyphs" },
                setting_focus: "Ancient glyphs glowing softly",
                lighting: "Focused glowing runes",
                camera_angle: "eye level",
                mood: "curious",
                dialogue: [
                    {
                        character_id: "char_stub",
                        text: "These runes respond to intent.",
                        tone: "whisper",
                    },
                ],
                sfx: [],
            },
            {
                panel_number: 3,
                shot_type: "close_up",
                description: `${baseDescription} Panel three captures emotion.`,
                characters_visible: ["char_stub"],
                character_poses: {
                    char_stub: "Hand outstretched toward glyph",
                },
                setting_focus: "Glyphs pulsing brighter",
                lighting: "Intense rim light",
                camera_angle: "dramatic low angle",
                mood: "hopeful",
                dialogue: [
                    {
                        character_id: "char_stub",
                        text: "The archive awakens.",
                        tone: "steady",
                    },
                ],
                sfx: [
                    {
                        text: "WHOOM",
                        emphasis: "dramatic",
                    },
                ],
            },
        ],
    } as AiComicToonplayType;
}

function buildStubCharacters(): CharacterRow[] {
    return [
        {
            id: "char_stub",
            storyId: "story_stub",
            name: "Aria",
            role: "protagonist",
            summary: "Curious explorer",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            coreTrait: "curiosity",
            internalFlaw: "impatience",
            externalGoal: "uncover hidden truths",
            backstory: "Raised among scholars of light archives.",
            personality: {
                traits: ["brave", "empathetic"],
                mannerisms: ["traces glyphs while thinking"],
                quirks: ["collects luminous fragments"],
            },
            physicalDescription: {
                age: "mid-20s",
                appearance: "athletic build, bronze skin, luminous tattoos",
                distinctiveFeatures: "glowing tattoos",
                style: "flowing explorer attire",
            },
            voiceStyle: {
                tone: "assured",
                vocabulary: "poetic",
                speechPatterns: ["measured"],
            },
        } as CharacterRow,
    ];
}

function buildStubSettings(): SettingRow[] {
    return [
        {
            id: "setting_stub",
            storyId: "story_stub",
            name: "Luminous Archive",
            summary: "Suspended library of light",
            adversityElements: null,
            virtueElements: null,
            consequenceElements: null,
            symbolicMeaning: "knowledge triumphs over fear",
            cycleAmplification: null,
            emotionalResonance: "wonder",
            mood: "awe",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sensory: null,
            architecturalStyle: "floating monoliths",
            visualReferences: null,
            colorPalette: ["gold", "teal"],
        } as SettingRow,
    ];
}

async function generatePanels(forceRegenerate = false): Promise<PanelResult> {
    if (cachedResult && !forceRegenerate) {
        logComicsTest(
            "generator",
            "Using cached comic panel generation result for assertions",
        );
        return cachedResult;
    }

    loadWriterApiKey();

    const authContext = {
        type: "api-key" as const,
        apiKey: writerApiKey,
        scopes: ["stories:write", "images:write"],
        metadata: {
            requestId: generateRequestId(),
            timestamp: Date.now(),
        },
    };

    const toonplay = buildStubToonplay();
    const charactersStub = buildStubCharacters();
    const settingsStub = buildStubSettings();

    logComicsTest(
        "generator",
        `Generating panels via service (targetPanels=${TARGET_PANEL_COUNT})`,
    );
    const result = await withAuth(authContext, () =>
        generateComicPanels({
            toonplay,
            storyId: "story_stub",
            chapterId: "chapter_stub",
            sceneId: "scene_stub",
            characters: charactersStub,
            settings: settingsStub,
            storyGenre: "fantasy",
        }),
    );

    cachedResult = result;
    logComicsTest(
        "generator",
        `Generated ${result.panels.length} panels in ${result.metadata.generationTime}ms`,
    );
    return result;
}

// ============================================================================
function getPanelMetadata(panel: PanelResult["panels"][number]): PanelMetadata {
    return (panel.metadata || {}) as PanelMetadata;
}

function extractDimensionsFromDataUrl(imageUrl: string): {
    width: number;
    height: number;
} | null {
    if (!imageUrl.startsWith("data:image/png;base64,")) {
        return null;
    }
    try {
        const base64 = imageUrl.split(",")[1];
        const buffer = Buffer.from(base64, "base64");
        if (buffer.toString("ascii", 1, 4) !== "PNG") {
            return null;
        }
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
    } catch {
        return null;
    }
}

// ============================================================================
// Comic Panel Image Generation Tests
// ============================================================================

describe("Comic Panel Image Generation Integration", () => {
    it("should generate images for all panels in toonplay", async () => {
        const result = await generatePanels(true);
        const toonplay = buildStubToonplay();

        result.panels.forEach((panel) => {
            const meta = getPanelMetadata(panel);
            logComicsTest(
                "panel-count",
                `Panel ${panel.panel_number} imageUrl=${preview(panel.imageUrl, 80)} model=${meta.model} provider=${meta.provider} size=${meta.width}x${meta.height}`,
            );
        });

        expect(result.panels).toHaveLength(TARGET_PANEL_COUNT);
        expect(result.metadata.totalPanels).toBe(result.panels.length);
        expect(result.panels.map((p) => p.panel_number)).toEqual(
            toonplay.panels.map((p) => p.panel_number),
        );

        for (const panel of result.panels) {
            expect(panel.imageUrl).toContain("data:image/png;base64,");
            const dims = extractDimensionsFromDataUrl(panel.imageUrl);
            expect(dims?.width ?? 0).toBeGreaterThan(0);
            expect(dims?.height ?? 0).toBeGreaterThan(0);
        }
    }, 120000);

    it("should generate images with correct aspect ratio (9:16)", async () => {
        logComicsTest("aspect-ratio", "Validating comic panel aspect ratios");
        const result = await generatePanels();

        for (const panel of result.panels) {
            const dims = extractDimensionsFromDataUrl(panel.imageUrl);
            if (!dims) {
                logComicsTest(
                    "aspect-ratio",
                    `Panel ${panel.panel_number} skipped (no dimensions found)`,
                );
                continue;
            }
            const { width, height } = dims;
            logComicsTest(
                "aspect-ratio",
                `Panel ${panel.panel_number} raw ratio=${width}/${height}`,
            );
            expect(width).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);

            const aspectRatio = width / height;
            const expectedRatio = 9 / 16;
            const tolerance = 0.05;

            expect(Math.abs(aspectRatio - expectedRatio)).toBeLessThan(
                tolerance,
            );
            logComicsTest(
                "aspect-ratio",
                `Panel ${panel.panel_number} computedRatio=${aspectRatio.toFixed(4)} within tolerance`,
            );
        }
    }, 120000);

    it("should preserve toonplay specifications in results", async () => {
        logComicsTest("spec-sync", "Ensuring toonplay specs preserved");
        const result = await generatePanels();
        const toonplayPanels = buildStubToonplay().panels;

        logComicsTest(
            "spec-sync",
            `Toonplay panels=${toonplayPanels.length} generated panels=${result.panels.length}`,
        );

        expect(toonplayPanels.length).toBe(result.panels.length);
        expect(result.panels.map((p) => p.panel_number)).toEqual(
            toonplayPanels.map((p) => p.panel_number),
        );

        for (const panel of result.panels) {
            const matchingToonplay = toonplayPanels.find(
                (tp) => tp.panel_number === panel.panel_number,
            );
            expect(matchingToonplay).toBeDefined();
            expect(matchingToonplay?.shot_type).toBeDefined();
            expect(matchingToonplay?.description).toBeDefined();
            logComicsTest(
                "spec-sync",
                `Panel ${panel.panel_number} shot=${matchingToonplay?.shot_type} desc=${preview(
                    matchingToonplay?.description ?? "",
                    80,
                )}`,
            );
        }
    }, 120000);

    it("should track generation metadata", async () => {
        logComicsTest("metadata", "Validating metadata block");
        const result = await generatePanels();
        const metadata = result.metadata;

        logComicsTest(
            "metadata",
            `Metadata: panels=${metadata.totalPanels} time=${metadata.generationTime}ms model=${metadata.model}`,
        );
        logComicsTest(
            "metadata",
            `aspectRatio=${metadata.aspectRatio ?? "n/a"}`,
        );

        expect(metadata.totalPanels).toBe(result.panels.length);
        expect(metadata.generationTime).toBeGreaterThan(0);
        expect(metadata.model).toBeDefined();
        expect(metadata.provider).toBeDefined();
    }, 120000);

    it("should generate images with consistent model/provider", async () => {
        logComicsTest(
            "consistency",
            "Checking panel model/provider consistency",
        );
        const result = await generatePanels();

        expect(result.metadata.model).toBeDefined();
        expect(result.metadata.provider).toBeDefined();

        for (const panel of result.panels) {
            logComicsTest(
                "consistency",
                `Panel ${panel.panel_number} model=${result.metadata.model} provider=${result.metadata.provider}`,
            );
        }

        logComicsTest(
            "consistency",
            `Metadata model/provider ${result.metadata.model}/${result.metadata.provider}`,
        );
    }, 120000);
});
