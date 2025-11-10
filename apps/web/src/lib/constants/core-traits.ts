/**
 * Global Core Trait Constants
 *
 * Single source of truth for all character core traits across the application.
 * Use these constants for:
 * - AI character generation (ensures valid trait selection)
 * - UI dropdowns and filters
 * - Database validation
 * - Character display components
 *
 * Based on the Adversity-Triumph Engine's virtue framework.
 */

/**
 * Character Core Trait Enum
 * Use CORE_TRAIT.COURAGE, CORE_TRAIT.COMPASSION, etc. in code
 */
export const CORE_TRAIT = {
    COURAGE: "courage",
    COMPASSION: "compassion",
    INTEGRITY: "integrity",
    LOYALTY: "loyalty",
    WISDOM: "wisdom",
    SACRIFICE: "sacrifice",
} as const;

/**
 * Array of all valid core trait values
 * Use for iteration, validation, and database enum definition
 */
export const CORE_TRAITS = Object.values(CORE_TRAIT);

/**
 * Type for character core traits
 */
export type CoreTrait = (typeof CORE_TRAIT)[keyof typeof CORE_TRAIT];

/**
 * Core trait metadata for UI components and generation guidance
 * Includes descriptions and narrative guidance
 */
export const CORE_TRAIT_METADATA: Record<
    CoreTrait,
    {
        label: string;
        description: string;
        narrativeGuidance: string;
        exampleManifestations: string[];
    }
> = {
    [CORE_TRAIT.COURAGE]: {
        label: "Courage",
        description:
            "The ability to face fear, danger, or adversity despite personal risk",
        narrativeGuidance:
            "Character confronts external threats or internal fears, taking action when others hesitate",
        exampleManifestations: [
            "Standing up to authority",
            "Facing physical danger",
            "Speaking truth to power",
            "Overcoming personal fears",
            "Protecting others at personal risk",
        ],
    },
    [CORE_TRAIT.COMPASSION]: {
        label: "Compassion",
        description:
            "Deep empathy and desire to alleviate the suffering of others",
        narrativeGuidance:
            "Character prioritizes others' wellbeing, often at personal cost, showing genuine care and understanding",
        exampleManifestations: [
            "Helping strangers without expectation",
            "Showing mercy to enemies",
            "Sacrificing comfort for others",
            "Understanding diverse perspectives",
            "Healing emotional wounds",
        ],
    },
    [CORE_TRAIT.INTEGRITY]: {
        label: "Integrity",
        description:
            "Unwavering adherence to moral principles and personal values",
        narrativeGuidance:
            "Character maintains ethical standards even when facing pressure, temptation, or consequences",
        exampleManifestations: [
            "Refusing to compromise principles",
            "Taking responsibility for mistakes",
            "Keeping promises despite cost",
            "Rejecting corruption",
            "Speaking truth even when painful",
        ],
    },
    [CORE_TRAIT.LOYALTY]: {
        label: "Loyalty",
        description:
            "Steadfast devotion and support for people, causes, or ideals",
        narrativeGuidance:
            "Character remains committed through adversity, defending and supporting what they hold dear",
        exampleManifestations: [
            "Standing by friends in crisis",
            "Defending reputation of others",
            "Keeping faith during hardship",
            "Protecting group interests",
            "Maintaining commitments over time",
        ],
    },
    [CORE_TRAIT.WISDOM]: {
        label: "Wisdom",
        description:
            "Sound judgment, insight, and understanding gained through experience",
        narrativeGuidance:
            "Character provides guidance, sees deeper truths, and makes decisions considering long-term consequences",
        exampleManifestations: [
            "Offering sage advice",
            "Seeing through deception",
            "Understanding human nature",
            "Making strategic decisions",
            "Learning from past mistakes",
        ],
    },
    [CORE_TRAIT.SACRIFICE]: {
        label: "Sacrifice",
        description:
            "Willingness to give up something valued for a greater good",
        narrativeGuidance:
            "Character surrenders personal desires, comfort, or safety for the benefit of others or a cause",
        exampleManifestations: [
            "Giving up personal dreams",
            "Risking life for others",
            "Foregoing happiness for duty",
            "Accepting loss for greater good",
            "Bearing burdens for the community",
        ],
    },
};

/**
 * Get core trait metadata by name
 */
export function getCoreTraitMetadata(trait: string) {
    return (
        CORE_TRAIT_METADATA[trait as CoreTrait] || {
            label: "Unknown",
            description: "Character virtue",
            narrativeGuidance: "Character demonstrates moral strength",
            exampleManifestations: ["Acting with virtue"],
        }
    );
}

/**
 * Validate if a string is a valid core trait
 */
export function isValidCoreTrait(trait: string): trait is CoreTrait {
    return CORE_TRAITS.includes(trait as CoreTrait);
}

/**
 * Get core trait label for display
 */
export function getCoreTraitLabel(trait: string): string {
    const metadata = getCoreTraitMetadata(trait);
    return metadata.label;
}
