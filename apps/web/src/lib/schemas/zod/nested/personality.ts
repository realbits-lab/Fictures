import { z } from "zod";

/**
 * SSOT for character personality structure
 * Used in both Drizzle .$type<>() and Zod validation
 */
export const personalitySchema = z.object({
    traits: z
        .array(z.string())
        .describe(
            "Behavioral characteristics that shape how the character acts - examples: impulsive, optimistic, stubborn, cautious, charismatic",
        ),
    values: z
        .array(z.string())
        .describe(
            "Core beliefs and principles the character cares about - examples: family, honor, freedom, justice, loyalty",
        ),
});

/**
 * TypeScript type derived from personalitySchema (SSOT)
 */
export type PersonalityType = z.infer<typeof personalitySchema>;
