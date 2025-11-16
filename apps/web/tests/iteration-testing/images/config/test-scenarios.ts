/**
 * Test Scenarios Configuration for Image Iteration Testing
 *
 * These scenarios are designed to test different aspects of image generation:
 * 1. Generation Quality (30%) - Prompt adherence, aspect ratio, resolution
 * 2. Optimization Quality (25%) - Compression efficiency, file sizes
 * 3. Visual Quality (25%) - Visual assessment, artifact detection
 * 4. Performance (20%) - Generation time, success rate
 */

export interface TestScenario {
    id: string;
    name: string;
    prompt: string;
    imageType: "story" | "character" | "setting" | "scene" | "comic-panel";
    focusAreas: string[];
    description: string;
    expectedAspectRatio: string;
    expectedGenre?: string;
    expectedTone?: string;
}

export const TEST_SCENARIOS: TestScenario[] = [
    {
        id: "story-cover",
        name: "Story Cover Image",
        prompt: "A mysterious fantasy forest at twilight, ancient trees with glowing runes, cinematic composition, epic atmosphere",
        imageType: "story",
        focusAreas: [
            "composition",
            "genre-accuracy",
            "atmospheric-quality",
        ],
        description:
            "Baseline test - story cover requiring compelling composition and genre accuracy",
        expectedAspectRatio: "7:4",
        expectedGenre: "fantasy",
        expectedTone: "mysterious",
    },
    {
        id: "character-portrait",
        name: "Character Portrait",
        prompt: "A determined young warrior with scars, wearing worn leather armor, standing in a heroic pose, detailed facial features showing resolve",
        imageType: "character",
        focusAreas: [
            "character-accuracy",
            "expression-clarity",
            "detail-richness",
        ],
        description:
            "Tests character portrait generation with specific visual details",
        expectedAspectRatio: "1:1",
        expectedGenre: "fantasy",
        expectedTone: "heroic",
    },
    {
        id: "setting-landscape",
        name: "Setting Landscape",
        prompt: "An abandoned library with towering bookshelves, dust motes in sunlight, decaying grandeur, moody atmosphere",
        imageType: "setting",
        focusAreas: [
            "atmosphere-building",
            "detail-richness",
            "mood-conveyance",
        ],
        description:
            "Tests setting generation with atmospheric and detail requirements",
        expectedAspectRatio: "7:4",
        expectedGenre: "slice",
        expectedTone: "melancholic",
    },
    {
        id: "scene-action",
        name: "Action Scene",
        prompt: "A dynamic chase scene through a crowded market, character vaulting over obstacles, motion blur, high energy",
        imageType: "scene",
        focusAreas: [
            "dynamic-composition",
            "action-clarity",
            "movement-conveyance",
        ],
        description:
            "Tests action scene generation with dynamic composition requirements",
        expectedAspectRatio: "7:4",
        expectedGenre: "action",
        expectedTone: "intense",
    },
    {
        id: "emotional-moment",
        name: "Emotional Moment",
        prompt: "A quiet moment of revelation, character's face showing mixed emotions of surprise and understanding, soft lighting, intimate composition",
        imageType: "scene",
        focusAreas: [
            "emotional-expression",
            "mood-capture",
            "subtle-nuance",
        ],
        description:
            "Tests emotional scene generation requiring nuanced expression",
        expectedAspectRatio: "7:4",
        expectedGenre: "slice",
        expectedTone: "contemplative",
    },
];

export const getTestScenario = (
    id: string,
): TestScenario | undefined => {
    return TEST_SCENARIOS.find((s) => s.id === id);
};

export const getTestScenariosByFocus = (
    focus: string,
): TestScenario[] => {
    return TEST_SCENARIOS.filter((s) => s.focusAreas.includes(focus));
};

export const DEFAULT_IMAGE_TEST_CONFIG = {
    iterations: 5,
    evaluationMode: "standard" as const,
    promptVersion: "v1.0",
    testScenarios: [
        "story-cover",
        "character-portrait",
        "setting-landscape",
        "scene-action",
        "emotional-moment",
    ],
};

