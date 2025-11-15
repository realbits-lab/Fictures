/**
 * Part Service (Singular - Extreme Incremental)
 *
 * Service layer for generating ONE next part with full context awareness.
 * This is the extreme incremental approach where each part is generated
 * one at a time, seeing all previous parts.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { characters, parts, settings, stories } from "@/lib/schemas/database";
import type { Character, Part, Setting, Story } from "@/lib/schemas/zod/ai";
import { insertPartSchema } from "@/lib/schemas/zod/generated";
import { generatePart } from "../generators/part-generator";
import type {
    GeneratorPartParams,
    GeneratorPartResult,
} from "../generators/types";

export interface ServicePartParams {
    storyId: string;
    userId: string;
    /** Optional prompt version for A/B testing (e.g., "v1.1") */
    promptVersion?: string;
}

export interface ServicePartResult {
    part: Part;
    metadata: {
        generationTime: number;
        partIndex: number;
        totalParts: number;
    };
}

export class PartService {
    /**
     * Generate and save ONE next part with full context
     *
     * Automatically fetches all previous parts and uses them as context
     * for generating the next part in sequence.
     */
    async generateAndSave(
        params: ServicePartParams,
    ): Promise<ServicePartResult> {
        const { storyId, userId, promptVersion } = params;

        console.log(
            "[part-service] 🎬 Generating next part with full context...",
        );

        // 1. Fetch and verify story
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))) as Story[];

        const story: Story | undefined = storyResult[0];

        if (!story) {
            throw new Error(`Story not found: ${storyId}`);
        }

        // 2. Verify ownership
        if (story.authorId !== userId) {
            throw new Error(
                "Access denied: You do not have permission to modify this story",
            );
        }

        // 3. Fetch characters for the story
        const storyCharacters: Character[] = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, storyId))) as Character[];

        if (storyCharacters.length === 0) {
            throw new Error(
                "Story must have characters before generating parts",
            );
        }

        // 4. Fetch settings for the story
        const storySettings: Setting[] = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, storyId))) as Setting[];

        if (storySettings.length === 0) {
            throw new Error("Story must have settings before generating parts");
        }

        // 5. Fetch ALL previous parts for this story (FULL CONTEXT)
        const previousParts: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId))
            .orderBy(parts.orderIndex)) as Part[];

        const nextPartIndex = previousParts.length;

        console.log(
            `[part-service] Found ${previousParts.length} previous parts`,
        );
        console.log(`[part-service] Generating part ${nextPartIndex + 1}...`);

        // 6. Generate next part using singular generator with full context
        const generateParams: GeneratorPartParams = {
            story,
            characters: storyCharacters,
            settings: storySettings,
            previousParts,
            partIndex: nextPartIndex,
            promptVersion, // Pass version for A/B testing
        };

        const generationResult: GeneratorPartResult =
            await generatePart(generateParams);

        // 7. Save part to database
        const now: string = new Date().toISOString();
        const partId: string = `part_${nanoid(16)}`;

        // 7.5. Validate required fields from AI generation
        if (
            !generationResult.part.characterArcs ||
            generationResult.part.characterArcs.length === 0
        ) {
            throw new Error(
                "Part generation failed: characterArcs is required and must not be empty",
            );
        }

        if (
            !generationResult.part.settingIds ||
            generationResult.part.settingIds.length === 0
        ) {
            throw new Error(
                "Part generation failed: settingIds is required and must not be empty",
            );
        }

        const validatedPart = insertPartSchema.parse({
            id: partId,
            storyId,
            title: generationResult.part.title || `Part ${nextPartIndex + 1}`,
            summary: generationResult.part.summary || "",
            characterArcs: generationResult.part.characterArcs,
            settingIds: generationResult.part.settingIds,
            orderIndex: nextPartIndex + 1,
            createdAt: now,
            updatedAt: now,
        });

        const savedPartArray: Part[] = (await db
            .insert(parts)
            .values(validatedPart)
            .returning()) as Part[];
        const savedPart: Part = savedPartArray[0];

        console.log(`[part-service] ✅ Saved part ${nextPartIndex + 1}:`, {
            id: savedPart.id,
            title: savedPart.title,
            orderIndex: savedPart.orderIndex,
            characterArcs: savedPart.characterArcs,
            settingIds: savedPart.settingIds,
        });

        // 8. Return result
        return {
            part: savedPart,
            metadata: {
                generationTime: generationResult.metadata.generationTime,
                partIndex: nextPartIndex,
                totalParts: previousParts.length + 1,
            },
        };
    }
}

export const partService = new PartService();
