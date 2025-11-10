/**
 * Global Arc Position and Adversity Type Constants
 *
 * Single source of truth for all arc position types and adversity types across the application.
 * Use these constants for:
 * - AI generation prompts (ensures valid position selection)
 * - UI dropdowns and filters
 * - Database validation
 * - Chapter and character arc display components
 *
 * Based on the Adversity-Triumph Engine's narrative structure framework.
 */

// ============================================================================
// Adversity Type Constants
// ============================================================================

/**
 * Adversity Type Enum
 * Defines the nature of conflict and challenges faced by characters
 * Use ADVERSITY_TYPE.INTERNAL, ADVERSITY_TYPE.EXTERNAL, etc. in code
 */
export const ADVERSITY_TYPE = {
    INTERNAL: "internal",
    EXTERNAL: "external",
    BOTH: "both",
} as const;

/**
 * Array of all valid adversity type values
 * Use for iteration, validation, and database enum definition
 */
export const ADVERSITY_TYPES = Object.values(ADVERSITY_TYPE);

/**
 * Type for adversity types
 */
export type AdversityType =
    (typeof ADVERSITY_TYPE)[keyof typeof ADVERSITY_TYPE];

/**
 * Adversity type metadata for UI components and generation guidance
 * Includes descriptions and narrative guidance
 */
export const ADVERSITY_TYPE_METADATA: Record<
    AdversityType,
    {
        label: string;
        description: string;
        narrativeGuidance: string;
        examples: string[];
    }
> = {
    [ADVERSITY_TYPE.INTERNAL]: {
        label: "Internal",
        description:
            "Psychological or emotional challenges within the character",
        narrativeGuidance:
            "Focus on character's inner struggles, doubts, fears, moral dilemmas, or personal growth challenges",
        examples: [
            "Self-doubt and insecurity",
            "Moral dilemmas and ethical choices",
            "Past trauma or guilt",
            "Internal conflicts between desires and duties",
            "Fear of failure or rejection",
        ],
    },
    [ADVERSITY_TYPE.EXTERNAL]: {
        label: "External",
        description:
            "Physical, social, or environmental obstacles from outside",
        narrativeGuidance:
            "Focus on tangible obstacles, antagonists, social pressures, or environmental challenges that oppose the character",
        examples: [
            "Physical threats or dangers",
            "Antagonistic characters or forces",
            "Social pressure or rejection",
            "Environmental obstacles",
            "Resource scarcity or time constraints",
        ],
    },
    [ADVERSITY_TYPE.BOTH]: {
        label: "Both",
        description: "Combination of internal and external challenges",
        narrativeGuidance:
            "Weave together both internal psychological struggles and external physical/social obstacles for richer conflict",
        examples: [
            "External threat triggering internal fears",
            "Social conflict exacerbating self-doubt",
            "Physical challenge revealing character flaws",
            "Moral choice with tangible consequences",
            "Internal growth required to overcome external obstacle",
        ],
    },
};

/**
 * Get adversity type metadata by name
 */
export function getAdversityTypeMetadata(type: string) {
    return (
        ADVERSITY_TYPE_METADATA[type as AdversityType] || {
            label: "Unknown",
            description: "Character adversity type",
            narrativeGuidance: "Character faces challenges and obstacles",
            examples: ["Various challenges"],
        }
    );
}

/**
 * Validate if a string is a valid adversity type
 */
export function isValidAdversityType(type: string): type is AdversityType {
    return ADVERSITY_TYPES.includes(type as AdversityType);
}

/**
 * Get adversity type label for display
 */
export function getAdversityTypeLabel(type: string): string {
    const metadata = getAdversityTypeMetadata(type);
    return metadata.label;
}

// ============================================================================
// Chapter Arc Position Constants
// ============================================================================

/**
 * Chapter Arc Position Enum
 * Defines where a chapter falls in the macro story arc
 * Use CHAPTER_ARC_POSITION.BEGINNING, CHAPTER_ARC_POSITION.MIDDLE, etc. in code
 */
export const CHAPTER_ARC_POSITION = {
    BEGINNING: "beginning",
    MIDDLE: "middle",
    CLIMAX: "climax",
    RESOLUTION: "resolution",
} as const;

/**
 * Array of all valid chapter arc position values
 * Use for iteration, validation, and database enum definition
 */
export const CHAPTER_ARC_POSITIONS = Object.values(CHAPTER_ARC_POSITION);

/**
 * Type for chapter arc positions
 */
export type ChapterArcPosition =
    (typeof CHAPTER_ARC_POSITION)[keyof typeof CHAPTER_ARC_POSITION];

/**
 * Character Arc Position Enum
 * Defines the priority/focus level of a character arc within a part
 * Use CHARACTER_ARC_POSITION.PRIMARY, CHARACTER_ARC_POSITION.SECONDARY in code
 */
export const CHARACTER_ARC_POSITION = {
    PRIMARY: "primary",
    SECONDARY: "secondary",
} as const;

/**
 * Array of all valid character arc position values
 * Use for iteration, validation, and database enum definition
 */
export const CHARACTER_ARC_POSITIONS = Object.values(CHARACTER_ARC_POSITION);

/**
 * Type for character arc positions
 */
export type CharacterArcPosition =
    (typeof CHARACTER_ARC_POSITION)[keyof typeof CHARACTER_ARC_POSITION];

/**
 * Chapter arc position metadata for UI components and generation guidance
 * Includes descriptions and narrative guidance
 */
export const CHAPTER_ARC_POSITION_METADATA: Record<
    ChapterArcPosition,
    {
        label: string;
        description: string;
        narrativeGuidance: string;
    }
> = {
    [CHAPTER_ARC_POSITION.BEGINNING]: {
        label: "Beginning",
        description: "Initial setup and introduction phase of the story arc",
        narrativeGuidance:
            "Establishes characters, setting, and initial conflict. Introduces the adversity that will drive the narrative.",
    },
    [CHAPTER_ARC_POSITION.MIDDLE]: {
        label: "Middle",
        description: "Development and escalation phase of the story arc",
        narrativeGuidance:
            "Deepens conflict, develops character relationships, and escalates tension. Characters face increasing challenges.",
    },
    [CHAPTER_ARC_POSITION.CLIMAX]: {
        label: "Climax",
        description:
            "Peak moment of the story arc - highest tension and conflict",
        narrativeGuidance:
            "The macro moment where characters demonstrate core virtues to overcome major adversity. Emotional and narrative peak.",
    },
    [CHAPTER_ARC_POSITION.RESOLUTION]: {
        label: "Resolution",
        description: "Conclusion and consequence phase of the story arc",
        narrativeGuidance:
            "Shows the aftermath and consequences of the climax. Reveals new adversity that transitions to the next arc.",
    },
};

/**
 * Character arc position metadata for UI components and generation guidance
 * Includes descriptions and narrative guidance
 */
export const CHARACTER_ARC_POSITION_METADATA: Record<
    CharacterArcPosition,
    {
        label: string;
        description: string;
        narrativeGuidance: string;
    }
> = {
    [CHARACTER_ARC_POSITION.PRIMARY]: {
        label: "Primary",
        description: "Main character arc - receives primary narrative focus",
        narrativeGuidance:
            "This character's development is the central focus of the part. Most scenes and chapters revolve around their journey.",
    },
    [CHARACTER_ARC_POSITION.SECONDARY]: {
        label: "Secondary",
        description: "Supporting character arc - provides depth and contrast",
        narrativeGuidance:
            "This character's arc supports and complements the primary arc. They provide contrast, assistance, or alternative perspectives.",
    },
};

/**
 * Get chapter arc position metadata by name
 */
export function getChapterArcPositionMetadata(position: string) {
    return (
        CHAPTER_ARC_POSITION_METADATA[position as ChapterArcPosition] || {
            label: "Unknown",
            description: "Chapter position in story arc",
            narrativeGuidance: "Chapter contributes to overall narrative flow",
        }
    );
}

/**
 * Get character arc position metadata by name
 */
export function getCharacterArcPositionMetadata(position: string) {
    return (
        CHARACTER_ARC_POSITION_METADATA[position as CharacterArcPosition] || {
            label: "Unknown",
            description: "Character arc priority level",
            narrativeGuidance: "Character contributes to narrative development",
        }
    );
}

/**
 * Validate if a string is a valid chapter arc position
 */
export function isValidChapterArcPosition(
    position: string,
): position is ChapterArcPosition {
    return CHAPTER_ARC_POSITIONS.includes(position as ChapterArcPosition);
}

/**
 * Validate if a string is a valid character arc position
 */
export function isValidCharacterArcPosition(
    position: string,
): position is CharacterArcPosition {
    return CHARACTER_ARC_POSITIONS.includes(position as CharacterArcPosition);
}

/**
 * Get chapter arc position label for display
 */
export function getChapterArcPositionLabel(position: string): string {
    const metadata = getChapterArcPositionMetadata(position);
    return metadata.label;
}

/**
 * Get character arc position label for display
 */
export function getCharacterArcPositionLabel(position: string): string {
    const metadata = getCharacterArcPositionMetadata(position);
    return metadata.label;
}
