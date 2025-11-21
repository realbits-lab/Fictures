import { z } from "zod";

/**
 * Input context schema
 */
export const evaluationContextSchema = z
    .object({
        storyGenre: z.string().optional(),
        arcPosition: z.enum(["beginning", "middle", "end"]).optional(),
        chapterNumber: z.number().optional(),
        previousSceneSummary: z.string().optional(),
        characterContext: z.array(z.string()).optional(),
    })
    .optional();

export type EvaluationContext = z.infer<typeof evaluationContextSchema>;

/**
 * Input request schema
 */
export const evaluationRequestSchema = z.object({
    sceneId: z.string(),
    content: z.string().min(1),
    context: evaluationContextSchema,
    evaluationScope: z
        .array(
            z.enum(["plot", "character", "pacing", "prose", "worldbuilding"]),
        )
        .optional(),
    options: z
        .object({
            detailedFeedback: z.boolean().default(true),
            includeExamples: z.boolean().default(true),
        })
        .optional(),
});

export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
