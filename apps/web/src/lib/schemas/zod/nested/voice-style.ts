import { z } from "zod";

/**
 * SSOT for character voice style structure
 * Used in both Drizzle .$type<>() and Zod validation
 */
export const voiceStyleSchema = z.object({
    tone: z
        .string()
        .describe(
            "Overall vocal quality and emotional coloring - examples: warm, sarcastic, formal, gentle, harsh, cheerful",
        ),
    vocabulary: z
        .string()
        .describe(
            "Language complexity and word choice - examples: simple, educated, technical, poetic, street slang, archaic",
        ),
    quirks: z
        .array(z.string())
        .describe(
            "Verbal tics, repeated phrases, or unique speech patterns - examples: 'you know', clears throat often, speaks in questions",
        ),
    emotionalRange: z
        .string()
        .describe(
            "How expressively the character shows emotions through speech - examples: reserved, expressive, volatile, stoic, animated",
        ),
});

/**
 * TypeScript type derived from voiceStyleSchema (SSOT)
 */
export type VoiceStyleType = z.infer<typeof voiceStyleSchema>;
