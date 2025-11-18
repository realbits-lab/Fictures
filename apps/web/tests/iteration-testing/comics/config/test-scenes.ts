/**
 * Test Scenes Configuration for Comics Iteration Testing
 *
 * These scenes are designed to test different aspects of comic panel generation:
 * 1. Panel Quality (30%) - Visual clarity, composition, character accuracy
 * 2. Narrative Coherence (25%) - Story flow, panel sequence logic
 * 3. Technical Quality (25%) - Format compliance, optimization
 * 4. Performance (20%) - Generation time, success rate
 */

import * as fs from "node:fs";
import * as path from "node:path";

// Load scene IDs from config file
const configPath = path.join(__dirname, "test-scene-ids.json");
let SCENE_ID_MAP: Record<string, string> = {};

if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
    SCENE_ID_MAP = configData.sceneIds || {};
}

export interface TestScene {
    id: string;
    name: string;
    sceneContent: string;
    toonplay: {
        sceneId: string;
        sceneTitle: string;
        totalPanels: number;
        panels: Array<{
            panelNumber: number;
            shotType: string;
            description: string;
            charactersVisible: string[];
            dialogue: Array<{ characterId: string; text: string }>;
        }>;
    };
    focusAreas: string[];
    description: string;
    expectedPanelCount: { min: number; max: number };
    expectedCharacters: number;
    challengeAreas: string[];
}

export const TEST_SCENES: TestScene[] = [
    {
        id: "action-sequence",
        name: "Action Sequence",
        sceneContent: `Marcus burst through the market crowd, vaulting over obstacles. The guards' shouts grew louder behind him.`,
        toonplay: {
            sceneId: SCENE_ID_MAP["action-sequence"] || "test-action",
            sceneTitle: "The Chase",
            totalPanels: 10,
            panels: [
                {
                    panelNumber: 1,
                    shotType: "wide_shot",
                    description: "Marcus running through crowded market, guards in pursuit",
                    charactersVisible: ["marcus"],
                    dialogue: [],
                },
                {
                    panelNumber: 2,
                    shotType: "medium_shot",
                    description: "Marcus vaulting over fruit cart, dynamic motion",
                    charactersVisible: ["marcus"],
                    dialogue: [],
                },
            ],
        },
        focusAreas: ["dynamic-composition", "action-clarity", "movement"],
        description:
            "Tests action sequence panel generation with dynamic composition",
        expectedPanelCount: { min: 8, max: 12 },
        expectedCharacters: 2,
        challengeAreas: [
            "Show action clearly across panels",
            "Maintain visual flow",
            "Capture dynamic movement",
        ],
    },
    {
        id: "dialogue-heavy",
        name: "Dialogue Scene",
        sceneContent: `"I can't do this anymore," Elena said. David looked up from his coffee. "What are you talking about?"`,
        toonplay: {
            sceneId: SCENE_ID_MAP["dialogue-heavy"] || "test-dialogue",
            sceneTitle: "The Confession",
            totalPanels: 9,
            panels: [
                {
                    panelNumber: 1,
                    shotType: "medium_shot",
                    description: "Elena and David at coffee shop table, tense atmosphere",
                    charactersVisible: ["elena", "david"],
                    dialogue: [
                        { characterId: "elena", text: "I can't do this anymore." },
                    ],
                },
            ],
        },
        focusAreas: [
            "character-expressions",
            "dialogue-layout",
            "emotional-beats",
        ],
        description:
            "Tests dialogue-heavy scene with character expressions",
        expectedPanelCount: { min: 8, max: 11 },
        expectedCharacters: 2,
        challengeAreas: [
            "Balance dialogue with visuals",
            "Show character expressions",
            "Maintain emotional progression",
        ],
    },
    {
        id: "emotional-beat",
        name: "Emotional Beat",
        sceneContent: `Sarah stood at the window, the letter in her hand trembling. After fifteen years, her mother had finally written back.`,
        toonplay: {
            sceneId: SCENE_ID_MAP["emotional-beat"] || "test-emotional",
            sceneTitle: "The Revelation",
            totalPanels: 8,
            panels: [
                {
                    panelNumber: 1,
                    shotType: "close_up",
                    description: "Sarah's hands holding letter, slight tremor visible",
                    charactersVisible: ["sarah"],
                    dialogue: [],
                },
            ],
        },
        focusAreas: [
            "expression-accuracy",
            "mood-capture",
            "emotional-nuance",
        ],
        description:
            "Tests emotional moment requiring nuanced expression",
        expectedPanelCount: { min: 7, max: 10 },
        expectedCharacters: 1,
        challengeAreas: [
            "Capture emotional nuance",
            "Show internal emotion externally",
            "Convey mood through visuals",
        ],
    },
    {
        id: "establishing-shot",
        name: "Establishing Shot",
        sceneContent: `The library had been forgotten for decades. Dust motes danced in shafts of sunlight. Books lay scattered across marble floors.`,
        toonplay: {
            sceneId: SCENE_ID_MAP["establishing-shot"] || "test-establishing",
            sceneTitle: "The Abandoned Library",
            totalPanels: 8,
            panels: [
                {
                    panelNumber: 1,
                    shotType: "establishing_shot",
                    description: "Vast abandoned library, dust motes in sunlight, decaying grandeur",
                    charactersVisible: [],
                    dialogue: [],
                },
            ],
        },
        focusAreas: [
            "setting-detail",
            "atmosphere-building",
            "visual-richness",
        ],
        description:
            "Tests establishing shot with setting detail requirements",
        expectedPanelCount: { min: 7, max: 10 },
        expectedCharacters: 0,
        challengeAreas: [
            "Convey setting effectively",
            "Build atmosphere visually",
            "Show detail richness",
        ],
    },
    {
        id: "climactic-moment",
        name: "Climactic Moment",
        sceneContent: `The courtroom was silent. Judge Harrison adjusted his glasses. "Thomas Wright, you've been found guilty. However..."`,
        toonplay: {
            sceneId: SCENE_ID_MAP["climactic-moment"] || "test-climactic",
            sceneTitle: "The Verdict",
            totalPanels: 10,
            panels: [
                {
                    panelNumber: 1,
                    shotType: "wide_shot",
                    description: "Courtroom, judge at bench, tense atmosphere",
                    charactersVisible: ["judge", "thomas"],
                    dialogue: [],
                },
            ],
        },
        focusAreas: [
            "composition-impact",
            "visual-drama",
            "moment-emphasis",
        ],
        description:
            "Tests climactic moment requiring visual impact",
        expectedPanelCount: { min: 9, max: 12 },
        expectedCharacters: 3,
        challengeAreas: [
            "Create visual impact",
            "Emphasize dramatic moment",
            "Build tension visually",
        ],
    },
];

export const getTestScene = (id: string): TestScene | undefined => {
    return TEST_SCENES.find((s) => s.id === id);
};

export const getTestScenesByFocus = (focus: string): TestScene[] => {
    return TEST_SCENES.filter((s) => s.focusAreas.includes(focus));
};

export const DEFAULT_COMIC_TEST_CONFIG = {
    iterations: 5,
    evaluationMode: "standard" as const,
    promptVersion: "v1.0",
    testScenes: [
        "action-sequence",
        "dialogue-heavy",
        "emotional-beat",
        "establishing-shot",
        "climactic-moment",
    ],
};

