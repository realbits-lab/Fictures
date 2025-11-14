/**
 * Character Service
 *
 * Service layer for character generation and database persistence.
 * Now uses authentication context instead of passing API keys as parameters.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { characters, stories } from "@/lib/schemas/database";
import type { Character, Story } from "@/lib/schemas/zod/ai";
import { insertCharacterSchema } from "@/lib/schemas/zod/generated";
import { generateCharacters } from "../generators/characters-generator";
import type {
    GeneratorCharactersParams,
    GeneratorCharactersResult,
} from "../generators/types";

export interface ServiceCharactersParams {
    storyId: string;
    characterCount: number;
    language?: string;
    userId: string;
    // apiKey removed - now retrieved from auth context
}

export interface ServiceCharactersResult {
    characters: Character[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export class CharacterService {
    async generateAndSave(
        params: ServiceCharactersParams,
    ): Promise<ServiceCharactersResult> {
        const {
            storyId,
            characterCount,
            language = "English",
            userId,
        } = params;

        // 1. Fetch and verify story
        const storyResult = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId));

        const story: Story | undefined = storyResult[0] as Story | undefined;

        if (!story) {
            throw new Error(`Story not found: ${storyId}`);
        }

        // 2. Verify ownership
        if (story.authorId !== userId) {
            throw new Error(
                "Access denied: You do not have permission to modify this story",
            );
        }

        // 3. Generate characters using pure generator
        // API key is automatically retrieved from auth context
        const generateParams: GeneratorCharactersParams = {
            story,
            characterCount,
            language,
        };

        const generationResult: GeneratorCharactersResult =
            await generateCharacters(generateParams);

        // 4. Save characters to database
        const savedCharacters: Character[] = [];
        const now: string = new Date().toISOString();

        for (const characterData of generationResult.characters) {
            const characterId: string = `char_${nanoid(16)}`;

            const validatedCharacter = insertCharacterSchema.parse({
                id: characterId,
                storyId,
                name: characterData.name || "Unnamed Character",
                role: characterData.role || "supporting",
                isMain: characterData.isMain ?? false,
                summary: characterData.summary ?? null,
                coreTrait: characterData.coreTrait ?? null,
                internalFlaw: characterData.internalFlaw ?? null,
                externalGoal: characterData.externalGoal ?? null,
                personality: characterData.personality ?? null,
                backstory: characterData.backstory ?? null,
                physicalDescription: characterData.physicalDescription ?? null,
                voiceStyle: characterData.voiceStyle ?? null,
                imageUrl: null,
                imageVariants: null,
                createdAt: now,
                updatedAt: now,
            });

            const savedCharacterArray: Character[] = (await db
                .insert(characters)
                .values(validatedCharacter)
                .returning()) as Character[];
            const savedCharacter: Character = savedCharacterArray[0];
            savedCharacters.push(savedCharacter);
        }

        // 5. Return result
        return {
            characters: savedCharacters,
            metadata: {
                totalGenerated: generationResult.metadata.totalGenerated,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const characterService = new CharacterService();
