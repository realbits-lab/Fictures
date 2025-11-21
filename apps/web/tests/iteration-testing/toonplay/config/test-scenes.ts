/**
 * Test Scenes Configuration for Toonplay Iteration Testing
 *
 * These scenes are designed to test different aspects of toonplay quality:
 * 1. Narrative Fidelity (20%) - Story essence preserved
 * 2. Visual Transformation (30%) - Show don't tell
 * 3. Webtoon Pacing (30%) - Thumb-scroll optimized
 * 4. Script Formatting (20%) - Production-ready
 */

export interface TestScene {
    id: string;
    name: string;
    sceneContent: string;
    focusAreas: string[];
    description: string;
    expectedPanelCount: { min: number; max: number };
    expectedCharacters: number;
    challengeAreas: string[];
}

export const TEST_SCENES: TestScene[] = [
    {
        id: "emotional-moment",
        name: "The Revelation",
        sceneContent: `Sarah stood at the window, watching the rain blur the city lights. The letter in her hand trembled. After fifteen years, her mother had finally written back.

"I forgive you," it said. Just three words, but they carried the weight of a lifetime of regret.

Sarah's knees weakened. She sank to the floor, clutching the paper to her chest. Tears mixed with laughter as years of burden lifted. She had spent so long believing she was unforgivable.

Outside, the storm began to clear.`,
        focusAreas: [
            "internal-emotion-externalization",
            "visual-storytelling",
            "pacing-rhythm",
        ],
        description:
            "Baseline test - emotional internal moment requiring visual externalization",
        expectedPanelCount: { min: 8, max: 10 },
        expectedCharacters: 1,
        challengeAreas: [
            "Show internal emotion through body language and expressions",
            "Minimize narration while preserving emotional depth",
            "Create compelling visual progression",
        ],
    },
    {
        id: "action-sequence",
        name: "The Chase",
        sceneContent: `Marcus burst through the market crowd, knocking over fruit stands. Behind him, the guards' shouts grew louder. He vaulted over a cart, rolled under an awning, and scrambled up a stack of crates.

The rooftop. Almost there.

His foot slipped. For a heart-stopping moment, he hung suspended three stories above the street. His fingers found purchase on a window ledge. With a grunt, he pulled himself up and sprinted across the tiles.

The guards reached the base of the building, but Marcus was already gone, disappearing into the maze of rooftops.`,
        focusAreas: ["action-clarity", "shot-variety", "movement-flow"],
        description:
            "Tests action sequence translation and dynamic shot composition",
        expectedPanelCount: { min: 10, max: 12 },
        expectedCharacters: 2,
        challengeAreas: [
            "Maintain clear action flow across panels",
            "Use appropriate shot types for movement",
            "Balance speed and clarity",
        ],
    },
    {
        id: "dialogue-heavy",
        name: "The Confession",
        sceneContent: `"I can't do this anymore," Elena said, her voice barely above a whisper.

David looked up from his coffee. "What are you talking about?"

"Us. This." She gestured between them. "We both know it's not working."

"That's not fair. I've been trying—"

"Have you?" Elena's eyes met his. "When was the last time you asked how I was doing? Really asked?"

David opened his mouth, then closed it. The silence stretched between them, heavy with unspoken truths.

Finally, Elena stood. "I'm sorry. I really am." She walked to the door, paused with her hand on the handle, then left without looking back.

David stared at his untouched coffee, now cold.`,
        focusAreas: [
            "dialogue-distribution",
            "character-expressions",
            "emotional-beats",
        ],
        description:
            "Tests dialogue pacing and emotional expression through visuals",
        expectedPanelCount: { min: 9, max: 11 },
        expectedCharacters: 2,
        challengeAreas: [
            "Balance dialogue with visual storytelling",
            "Show emotional progression through expressions",
            "Maintain 70% dialogue target while adding visual depth",
        ],
    },
    {
        id: "setting-atmosphere",
        name: "The Abandoned Library",
        sceneContent: `The library had been forgotten for decades. Dust motes danced in shafts of sunlight piercing through broken windows. Books lay scattered across marble floors, their pages yellowed and brittle.

Maya picked her way through the debris, her footsteps echoing in the vast silence. The smell of old paper and decay hung heavy in the air. Row upon row of empty shelves stretched into shadow.

In the center of the main hall, she found it—a single reading desk, perfectly preserved, as if waiting for someone to return. On it lay an open journal, the ink still somehow fresh. The last entry was dated yesterday.

Maya's breath caught. She wasn't alone here after all.`,
        focusAreas: [
            "setting-establishment",
            "atmosphere-building",
            "shot-progression",
        ],
        description:
            "Tests establishing shots and atmospheric visual storytelling",
        expectedPanelCount: { min: 8, max: 10 },
        expectedCharacters: 1,
        challengeAreas: [
            "Use establishing and wide shots effectively",
            "Build atmosphere through visual details",
            "Progress from wide to close-up naturally",
        ],
    },
    {
        id: "mixed-elements",
        name: "The Decision",
        sceneContent: `The courtroom was silent. Judge Harrison adjusted his glasses and looked down at the defendant.

"Thomas Wright, you've been found guilty of embezzlement. However..." He paused, scanning the packed gallery. "The victims have submitted an unusual request."

Thomas's hands trembled. He'd prepared for prison, for the end of everything. But the judge's tone suggested something different.

"They're asking for restitution instead of incarceration. They want you to work off your debt." Harrison leaned forward. "You'll have five years of supervised service. Miss a single payment, and you'll serve the full sentence."

Thomas looked at Sarah in the front row—the woman whose company he'd nearly destroyed. She nodded once, firmly.

"I won't let you down," Thomas whispered. "Not again."

The gavel fell.`,
        focusAreas: ["scene-variety", "tension-building", "emotional-payoff"],
        description:
            "Comprehensive test - combines dialogue, emotion, atmosphere, and multiple characters",
        expectedPanelCount: { min: 10, max: 12 },
        expectedCharacters: 3,
        challengeAreas: [
            "Balance multiple elements (dialogue, emotion, setting)",
            "Maintain proper content proportions (70% dialogue)",
            "Build and release tension effectively",
        ],
    },
];

export const getTestScene = (id: string): TestScene | undefined => {
    return TEST_SCENES.find((s) => s.id === id);
};

export const getTestScenesByFocus = (focus: string): TestScene[] => {
    return TEST_SCENES.filter((s) => s.focusAreas.includes(focus));
};

export const DEFAULT_TOONPLAY_TEST_CONFIG = {
    iterations: 5,
    evaluationMode: "standard" as const,
    promptVersion: "v1.0",
    testScenes: [
        "emotional-moment",
        "action-sequence",
        "dialogue-heavy",
        "setting-atmosphere",
        "mixed-elements",
    ],
};
