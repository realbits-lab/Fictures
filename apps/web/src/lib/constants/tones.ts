/**
 * Global Tone Constants
 *
 * Single source of truth for all story tones across the application.
 * Use these constants for:
 * - AI story generation (ensures valid tone selection)
 * - UI dropdowns and filters
 * - Database validation
 * - Tone display components
 *
 * Defines the emotional atmosphere and narrative approach of stories.
 */

export const STORY_TONES = [
    "hopeful",
    "dark",
    "bittersweet",
    "satirical",
] as const;

export type StoryTone = (typeof STORY_TONES)[number];

/**
 * Tone metadata for UI components and generation guidance
 * Includes descriptions, emotional characteristics, and narrative guidance
 */
export const TONE_METADATA: Record<
    StoryTone,
    {
        label: string;
        description: string;
        emotionalCharacteristics: string;
        narrativeGuidance: string;
        exampleMoods: string[];
    }
> = {
    hopeful: {
        label: "Hopeful",
        description:
            "Optimistic and uplifting narratives that emphasize positive outcomes and character growth",
        emotionalCharacteristics:
            "Warmth, inspiration, light overcoming darkness, faith in humanity",
        narrativeGuidance:
            "Focus on resilience, redemption arcs, meaningful connections, and earned victories",
        exampleMoods: [
            "inspiring",
            "uplifting",
            "warm",
            "encouraging",
            "triumphant",
        ],
    },
    dark: {
        label: "Dark",
        description:
            "Grim and somber narratives exploring moral complexity, tragedy, and harsh realities",
        emotionalCharacteristics:
            "Tension, dread, moral ambiguity, harsh consequences, psychological depth",
        narrativeGuidance:
            "Emphasize difficult choices, moral compromise, tragic outcomes, and psychological realism",
        exampleMoods: [
            "grim",
            "foreboding",
            "tense",
            "tragic",
            "morally complex",
        ],
    },
    bittersweet: {
        label: "Bittersweet",
        description:
            "Emotionally nuanced narratives balancing joy and sorrow, victory and loss",
        emotionalCharacteristics:
            "Melancholy beauty, poignant reflection, mixed emotions, nostalgic resonance",
        narrativeGuidance:
            "Balance triumph with sacrifice, happiness with loss, growth with letting go",
        exampleMoods: [
            "poignant",
            "melancholic",
            "reflective",
            "nostalgic",
            "emotionally complex",
        ],
    },
    satirical: {
        label: "Satirical",
        description:
            "Witty and critical narratives using humor and irony to expose flaws and absurdities",
        emotionalCharacteristics:
            "Sharp wit, irony, social commentary, absurd humor, critical observation",
        narrativeGuidance:
            "Use irony and exaggeration to critique society, institutions, or human nature",
        exampleMoods: [
            "witty",
            "ironic",
            "absurd",
            "clever",
            "darkly humorous",
        ],
    },
};

/**
 * Get tone metadata by name
 */
export function getToneMetadata(tone: string) {
    return (
        TONE_METADATA[tone as StoryTone] || {
            label: "Unknown",
            description: "Story tone",
            emotionalCharacteristics: "Varied emotional range",
            narrativeGuidance: "Follow story's natural emotional flow",
            exampleMoods: ["varied"],
        }
    );
}

/**
 * Validate if a string is a valid tone
 */
export function isValidTone(tone: string): tone is StoryTone {
    return STORY_TONES.includes(tone as StoryTone);
}

/**
 * Get tone label for display
 */
export function getToneLabel(tone: string): string {
    const metadata = getToneMetadata(tone);
    return metadata.label;
}
