/**
 * Part Service
 *
 * Service layer for part generation and database persistence.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { characters, parts, stories } from "@/lib/db/schema";
import { generateParts } from "../generators/parts-generator";
import type {
    GeneratePartsParams,
    GeneratePartsResult,
} from "../generators/types";
import {
    type Character,
    insertPartSchema,
    type Part,
    type Story,
} from "../generators/zod-schemas.generated";

export interface GeneratePartsServiceParams {
    storyId: string;
    partsCount: number;
    userId: string;
}

export interface GeneratePartsServiceResult {
    parts: Part[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export class PartService {
    async generateAndSave(
        params: GeneratePartsServiceParams,
    ): Promise<GeneratePartsServiceResult> {
        const { storyId, partsCount, userId } = params;

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

        // 4. Generate parts using pure generator
        const generateParams: GeneratePartsParams = {
            story,
            characters: storyCharacters,
            partsCount,
        };

        const generationResult: GeneratePartsResult =
            await generateParts(generateParams);

        // 5. Save parts to database
        const savedParts: Part[] = [];
        const now: string = new Date().toISOString();

        for (let i = 0; i < generationResult.parts.length; i++) {
            const partData = generationResult.parts[i];
            const partId: string = `part_${nanoid(16)}`;

            const validatedPart = insertPartSchema.parse({
                id: partId,
                storyId,
                title: partData.title || `Part ${i + 1}`,
                summary: partData.summary || null,
                characterArcs: partData.characterArcs || null,
                orderIndex: i + 1,
                createdAt: now,
                updatedAt: now,
            });

            const savedPartArray: Part[] = (await db
                .insert(parts)
                .values(validatedPart)
                .returning()) as Part[];
            const savedPart: Part = savedPartArray[0];
            savedParts.push(savedPart);
        }

        // 6. Return result
        return {
            parts: savedParts,
            metadata: {
                totalGenerated: generationResult.metadata.totalGenerated,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const partService = new PartService();
