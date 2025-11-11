/**
 * Chapter Service
 *
 * Service layer for chapter generation and database persistence.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chapters, characters, parts, stories } from "@/lib/db/schema";
import { generateChapters } from "../generators/chapters-generator";
import type {
    GenerateChaptersParams,
    GenerateChaptersResult,
} from "../generators/types";
import {
    type Chapter,
    type Character,
    insertChapterSchema,
    type Part,
    type Story,
} from "../generators/zod-schemas.generated";

export interface GenerateChaptersServiceParams {
    storyId: string;
    chaptersPerPart: number;
    userId: string;
}

export interface GenerateChaptersServiceResult {
    chapters: Chapter[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export class ChapterService {
    async generateAndSave(
        params: GenerateChaptersServiceParams,
    ): Promise<GenerateChaptersServiceResult> {
        const { storyId, chaptersPerPart, userId } = params;

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

        // 3. Fetch parts for the story
        const storyParts: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.storyId, storyId))
            .orderBy(parts.orderIndex)) as Part[];

        if (storyParts.length === 0) {
            throw new Error("Story must have parts before generating chapters");
        }

        // 4. Fetch characters for the story
        const storyCharacters: Character[] = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, storyId))) as Character[];

        if (storyCharacters.length === 0) {
            throw new Error(
                "Story must have characters before generating chapters",
            );
        }

        // 5. Generate chapters using pure generator
        const generateParams: GenerateChaptersParams = {
            storyId,
            story,
            parts: storyParts,
            characters: storyCharacters,
            chaptersPerPart,
        };

        const generationResult: GenerateChaptersResult =
            await generateChapters(generateParams);

        // 6. Save chapters to database
        const savedChapters: Chapter[] = [];
        const now: string = new Date().toISOString();

        for (let i = 0; i < generationResult.chapters.length; i++) {
            const chapterData = generationResult.chapters[i];
            const chapterId: string = `chapter_${nanoid(16)}`;

            // 7. Calculate which part this chapter belongs to
            const partIndex: number = Math.floor(i / chaptersPerPart);
            const currentPart: Part = storyParts[partIndex];
            const currentPartId: string | null = currentPart?.id || null;

            // 8. Get focus character (using first character as default)
            const focusCharacterId: string | null =
                storyCharacters.length > 0 ? storyCharacters[0].id : null;

            const validatedChapter = insertChapterSchema.parse({
                id: chapterId,
                storyId,
                partId: currentPartId,
                title: chapterData.title || `Chapter ${i + 1}`,
                summary: chapterData.summary || null,
                characterId: focusCharacterId,
                arcPosition: chapterData.arcPosition || null,
                contributesToMacroArc: chapterData.contributesToMacroArc?.trim()
                    ? chapterData.contributesToMacroArc.trim()
                    : null,
                focusCharacters: chapterData.focusCharacters || [],
                adversityType: chapterData.adversityType || null,
                virtueType: chapterData.virtueType || null,
                seedsPlanted: chapterData.seedsPlanted || [],
                seedsResolved: chapterData.seedsResolved || [],
                connectsToPreviousChapter:
                    chapterData.connectsToPreviousChapter?.trim()
                        ? chapterData.connectsToPreviousChapter.trim()
                        : null,
                createsNextAdversity: chapterData.createsNextAdversity?.trim()
                    ? chapterData.createsNextAdversity.trim()
                    : null,
                status: "writing",
                publishedAt: null,
                scheduledFor: null,
                orderIndex: i + 1,
                createdAt: now,
                updatedAt: now,
            });

            const savedChapterArray: Chapter[] = (await db
                .insert(chapters)
                .values(validatedChapter)
                .returning()) as Chapter[];
            const savedChapter: Chapter = savedChapterArray[0];
            savedChapters.push(savedChapter);
        }

        // 9. Return result
        return {
            chapters: savedChapters,
            metadata: {
                totalGenerated: generationResult.metadata.totalGenerated,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const chapterService = new ChapterService();
