import fs from "node:fs";
import path from "node:path";
import type { InferSelectModel } from "drizzle-orm";
import { generateRequestId } from "@/lib/auth/context";
import { withAuth } from "@/lib/auth/server-context";
import type { AiComicToonplayType } from "@/lib/schemas/ai/ai-toonplay";
import type { characters, settings } from "@/lib/schemas/database";
import { generateComicPanels } from "@/lib/studio/generators/comic-panel-generator";

jest.setTimeout(180_000);

type CharacterRow = InferSelectModel<typeof characters>;
type SettingRow = InferSelectModel<typeof settings>;

function loadWriterApiKey(): string {
    const authPath = path.resolve(process.cwd(), ".auth/user.json");
    const raw = fs.readFileSync(authPath, "utf-8");
    const json = JSON.parse(raw) as {
        develop: { profiles: { writer: { apiKey: string } } };
    };
    return json.develop.profiles.writer.apiKey;
}

function buildStubToonplay(): AiComicToonplayType {
    const longText = (
        "A heroic explorer navigates luminous ruins with flowing fabrics " +
        "and determined eyes, showcasing intricate stone carvings. "
    ).repeat(4);

    return {
        scene_id: "scene_test_single_panel",
        scene_title: "Single Panel Proof",
        total_panels: 1,
        pacing_notes: "Single verification panel.",
        narrative_arc: "Setup → Discovery → Moment",
        panels: [
            {
                panel_number: 1,
                shot_type: "close_up",
                description: longText.slice(0, 260),
                characters_visible: ["char_single"],
                character_poses: [
                    {
                        character_id: "char_single",
                        pose: "Heroic stance with confident gaze",
                    },
                ],
                setting_focus:
                    "Ancient floating library with shimmering glyphs",
                lighting: "Golden rim light with deep blue ambient glow",
                camera_angle: "eye level dramatic framing",
                mood: "hopeful",
                dialogue: [
                    {
                        character_id: "char_single",
                        text: "We are ready to bring this moment to life.",
                        tone: "steady",
                    },
                ],
                sfx: [
                    {
                        text: "whoosh",
                        emphasis: "normal",
                    },
                ],
            },
        ],
    } as AiComicToonplayType;
}

function buildStubCharacter(): CharacterRow {
    return {
        id: "char_single",
        storyId: "story_single",
        name: "Aria",
        role: "protagonist",
        isMain: true,
        summary: "Heroic explorer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        coreTrait: "courage" as const,
        internalFlaw: "doubt",
        externalGoal: "discover the relic",
        backstory: "Raised among scholars of lost worlds.",
        personality: {
            traits: ["brave", "curious"],
            mannerisms: ["steady gaze"],
            quirks: ["collects ancient keys"],
        },
        physicalDescription: {
            age: "mid-20s",
            appearance: "athletic build",
            distinctiveFeatures: "glowing tattoos, bronze skin",
            style: "flowing explorer attire",
        },
        voiceStyle: {
            tone: "assured",
            vocabulary: "poetic",
            speechPatterns: ["measured"],
        },
        imageUrl: null,
        imageVariants: null,
    } as unknown as CharacterRow;
}

function buildStubSetting(): SettingRow {
    return {
        id: "setting_single",
        storyId: "story_single",
        name: "Luminous Archive",
        summary: "Suspended library of light",
        adversityElements: {
            physicalObstacles: ["ancient traps"],
            scarcityFactors: ["limited light sources"],
            dangerSources: ["collapsing structures"],
            socialDynamics: ["isolated scholars"],
        },
        virtueElements: {
            witnessElements: ["ancient spirits"],
            contrastElements: ["darkness vs light"],
            opportunityElements: ["hidden passages"],
            sacredSpaces: ["central archive"],
        },
        consequenceElements: {
            transformativeElements: ["knowledge awakening"],
            rewardSources: ["ancient wisdom"],
            revelationTriggers: ["deciphered glyphs"],
            communityResponses: ["grateful spirits"],
        },
        symbolicMeaning: "knowledge triumphs over fear",
        emotionalResonance: "wonder",
        mood: "awe",
        sensory: {
            sight: ["golden light", "floating books"],
            sound: ["whispered echoes"],
            smell: ["ancient parchment"],
            touch: ["smooth stone"],
            taste: [],
        },
        architecturalStyle: "floating monoliths",
        visualReferences: ["Studio Ghibli", "ancient libraries"],
        colorPalette: ["gold", "teal"],
        imageUrl: null,
        imageVariants: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as unknown as SettingRow;
}

describe("Comic Panel Generator (single panel image)", () => {
    it("generates a single panel image via AI server", async () => {
        const apiKey = loadWriterApiKey();
        const toonplay = buildStubToonplay();
        const charactersStub = [buildStubCharacter()];
        const settingsStub = [buildStubSetting()];

        const authContext = {
            type: "api-key" as const,
            apiKey,
            scopes: ["stories:write", "images:write"],
            metadata: {
                requestId: generateRequestId(),
                timestamp: Date.now(),
            },
        };

        const result = await withAuth(authContext, () =>
            generateComicPanels({
                toonplay,
                storyId: "story_single",
                chapterId: "chapter_single",
                sceneId: "scene_single",
                characters: charactersStub,
                settings: settingsStub,
                storyGenre: "fantasy",
            }),
        );

        expect(result.panels).toHaveLength(1);
        const panel = result.panels[0];
        expect(panel.panel_number).toBe(1);
        // Images are now uploaded to Vercel Blob, expect HTTPS URL
        expect(panel.imageUrl).toMatch(/^https:\/\/.+\.blob\.vercel-storage\.com\/.+\.png$/);
        expect(panel.width).toBeGreaterThan(0);
        expect(panel.height).toBeGreaterThan(0);
        expect(result.metadata.totalPanels).toBe(1);
    });
});
