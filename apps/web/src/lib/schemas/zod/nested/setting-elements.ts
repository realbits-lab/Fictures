import { z } from "zod";

/**
 * Nested schema for setting adversity elements (SSOT)
 */
export const adversityElementsSchema = z.object({
    physicalObstacles: z
        .array(z.string())
        .describe(
            "Environmental challenges: harsh desert heat, crumbling infrastructure",
        ),
    scarcityFactors: z
        .array(z.string())
        .describe(
            "Limited resources that force choices: water shortage, food scarcity",
        ),
    dangerSources: z
        .array(z.string())
        .describe(
            "Threats from environment: unstable buildings, hostile wildlife",
        ),
    socialDynamics: z
        .array(z.string())
        .describe(
            "Community factors: distrust between neighbors, gang territories",
        ),
});

/**
 * TypeScript type derived from adversityElementsSchema (SSOT)
 */
export type AdversityElementsType = z.infer<typeof adversityElementsSchema>;

/**
 * Nested schema for setting virtue elements (SSOT)
 * Elements that amplify virtuous actions and moral elevation
 */
export const virtueElementsSchema = z.object({
    witnessElements: z
        .array(z.string())
        .describe(
            "Who/what witnesses moral acts (2-5 items): children watching, community gathering, hidden observers",
        ),
    contrastElements: z
        .array(z.string())
        .describe(
            "Elements making virtue powerful by contrast (2-5 items): barren wasteland vs. act of nurture, wealth disparity",
        ),
    opportunityElements: z
        .array(z.string())
        .describe(
            "Features enabling moral choices (2-5 items): shared resources, public spaces, moment of crisis",
        ),
    sacredSpaces: z
        .array(z.string())
        .describe(
            "Locations with moral/emotional significance (1-3 items): memorial site, family altar, meeting place",
        ),
});

/**
 * TypeScript type derived from virtueElementsSchema (SSOT)
 */
export type VirtueElementsType = z.infer<typeof virtueElementsSchema>;

/**
 * Nested schema for setting consequence elements (SSOT)
 * Elements that manifest earned rewards and karmic payoffs
 */
export const consequenceElementsSchema = z.object({
    transformativeElements: z
        .array(z.string())
        .describe(
            "Features showing change/impact (2-5 items): blooming garden, repaired structure, gathered crowd",
        ),
    rewardSources: z
        .array(z.string())
        .describe(
            "Sources of karmic payoff (2-5 items): hidden benefactor, unexpected ally, natural phenomenon",
        ),
    revelationTriggers: z
        .array(z.string())
        .describe(
            "Elements revealing hidden connections (2-5 items): discovered letter, overheard conversation, symbolic object",
        ),
    communityResponses: z
        .array(z.string())
        .describe(
            "How setting inhabitants respond (2-5 items): gratitude shown, reputation spreads, assistance offered",
        ),
});

/**
 * TypeScript type derived from consequenceElementsSchema (SSOT)
 */
export type ConsequenceElementsType = z.infer<typeof consequenceElementsSchema>;

/**
 * Nested schema for setting sensory details (SSOT)
 */
export const sensorySchema = z.object({
    sight: z
        .array(z.string())
        .describe(
            "Visual details (5-10 items): cracked asphalt, faded paint, rust-stained walls",
        ),
    sound: z
        .array(z.string())
        .describe(
            "Auditory elements (3-7 items): wind rattling leaves, distant sirens, children's laughter",
        ),
    smell: z
        .array(z.string())
        .describe(
            "Olfactory details (2-5 items): damp earth, cooking spices, gasoline",
        ),
    touch: z
        .array(z.string())
        .describe(
            "Tactile sensations (2-5 items): rough concrete, cool breeze, gritty dust",
        ),
    taste: z
        .array(z.string())
        .optional()
        .describe(
            "Flavor elements (0-2 items, optional): metallic tang, bitter smoke",
        ),
});

/**
 * TypeScript type derived from sensorySchema (SSOT)
 */
export type SensoryType = z.infer<typeof sensorySchema>;
