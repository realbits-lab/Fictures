import { z } from "zod";

/**
 * SSOT for character physical description structure
 * Used in both Drizzle .$type<>() and Zod validation
 */
export const physicalDescriptionSchema = z.object({
    age: z
        .string()
        .describe(
            "Character's age description - examples: early 20s, mid-30s, elderly, young adult, teenage",
        ),
    appearance: z
        .string()
        .describe(
            "Overall physical appearance and first impression - includes build, height, general look",
        ),
    distinctiveFeatures: z
        .string()
        .describe(
            "Memorable physical traits that make the character recognizable - examples: scar on left cheek, piercing green eyes, silver streak in hair",
        ),
    style: z
        .string()
        .describe(
            "How the character dresses and presents themselves - clothing choices, grooming, accessories",
        ),
});

/**
 * TypeScript type derived from physicalDescriptionSchema (SSOT)
 */
export type PhysicalDescriptionType = z.infer<typeof physicalDescriptionSchema>;
