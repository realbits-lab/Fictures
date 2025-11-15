/**
 * Chapter Service (Singular - Extreme Incremental)
 *
 * Service layer for generating ONE next chapter with full context awareness.
 * This is the extreme incremental approach where each chapter is generated
 * one at a time, seeing all previous chapters.
 */

import { eq, type InferSelectModel } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    settings,
    stories,
} from "@/lib/schemas/database";

// Database row types (for query results)
type Story = InferSelectModel<typeof stories>;
type Part = InferSelectModel<typeof parts>;
type Chapter = InferSelectModel<typeof chapters>;
type Character = InferSelectModel<typeof characters>;
type Setting = InferSelectModel<typeof settings>;

import { insertChapterSchema } from "@/lib/schemas/zod/generated";
import { generateChapter } from "../generators/chapter-generator";
import type {
    GenerateChapterParams,
    GenerateChapterResult,
} from "@/lib/schemas/generators/types";

export interface ServiceChapterParams {
    storyId: string;
    partId: string;
    userId: string;
}

export interface ServiceChapterResult {
    chapter: Chapter;
    metadata: {
        generationTime: number;
        chapterIndex: number; // Global index (position in entire story)
        totalChapters: number; // Total chapters in story
    };
}

export class ChapterService {
    /**
     * Generate and save ONE next chapter with full context
     *
     * Automatically fetches all previous chapters (in the current part and entire story)
     * and uses them as context for generating the next chapter in sequence.
     */
    async generateAndSave(
        params: ServiceChapterParams,
    ): Promise<ServiceChapterResult> {
        const { storyId, partId, userId } = params;

        console.log(
            "[chapter-service] 📖 Generating next chapter with full context...",
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

        // 3. Fetch the current part
        const partResult: Part[] = (await db
            .select()
            .from(parts)
            .where(eq(parts.id, partId))) as Part[];

        const part: Part | undefined = partResult[0];

        if (!part) {
            throw new Error(`Part not found: ${partId}`);
        }

        if (part.storyId !== storyId) {
            throw new Error("Part does not belong to the specified story");
        }

        console.log(
            `[chapter-service] ========== RETRIEVED PART DEBUG ==========`,
        );
        console.log(`[chapter-service] Part ID: ${part.id}`);
        console.log(`[chapter-service] Part title: ${part.title}`);
        console.log(`[chapter-service] Part object keys:`, Object.keys(part));
        console.log(
            `[chapter-service] Part.characterArcs type: ${typeof part.characterArcs}`,
        );
        console.log(
            `[chapter-service] Part.characterArcs value:`,
            JSON.stringify(part.characterArcs, null, 2),
        );
        console.log(
            `[chapter-service] Part.settingIds type: ${typeof part.settingIds}`,
        );
        console.log(
            `[chapter-service] Part.settingIds value:`,
            JSON.stringify(part.settingIds, null, 2),
        );
        console.log(
            `[chapter-service] Raw part object:`,
            JSON.stringify(part, null, 2),
        );
        console.log(
            `[chapter-service] ============================================`,
        );

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

        // 4.5. Fetch settings for the story (optional but recommended)
        const storySettings: Setting[] = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, storyId))) as Setting[];

        console.log(
            `[chapter-service] Found ${storySettings.length} settings for story`,
        );

        // 5. Fetch ALL previous chapters for this story (FULL CONTEXT)
        const allPreviousChapters: Chapter[] = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, storyId))
            .orderBy(chapters.orderIndex)) as Chapter[];

        const nextChapterIndex = allPreviousChapters.length;

        console.log(
            `[chapter-service] Found ${allPreviousChapters.length} total chapters`,
        );
        console.log(
            `[chapter-service] Generating chapter ${nextChapterIndex + 1}...`,
        );

        // 6. Generate next chapter using singular generator with full context
        const generateParams: GenerateChapterParams = {
            story,
            part,
            characters: storyCharacters,
            settings: storySettings.length > 0 ? storySettings : undefined,
            previousChapters: allPreviousChapters,
            chapterIndex: nextChapterIndex,
        };

        const generationResult: GenerateChapterResult =
            await generateChapter(generateParams);

        // 8. Save chapter to database
        const now: string = new Date().toISOString();
        const chapterId: string = `chapter_${nanoid(16)}`;

        // 9. Get focus character (using first character as default, throw if none)
        if (storyCharacters.length === 0) {
            throw new Error("Cannot generate chapter: no characters found");
        }
        const focusCharacterId: string = storyCharacters[0].id;

        const validatedChapter = insertChapterSchema.parse({
            id: chapterId,
            storyId,
            partId,
            title:
                generationResult.chapter.title ||
                `Chapter ${nextChapterIndex + 1}`,
            summary: generationResult.chapter.summary || "Chapter summary",
            characterId: focusCharacterId,
            arcPosition: generationResult.chapter.arcPosition || "beginning",
            contributesToMacroArc:
                generationResult.chapter.contributesToMacroArc?.trim() ||
                "Advances the story arc",
            characterArc: generationResult.chapter.characterArc || {
                characterId: focusCharacterId,
                microAdversity: {
                    internal: "Confronts personal doubts",
                    external: "Faces immediate challenge",
                },
                microVirtue: "Shows courage in adversity",
                microConsequence: "Earns small victory",
                microNewAdversity: "Creates next complication",
            },
            settingIds: storySettings.map((s) => s.id),
            focusCharacters: generationResult.chapter.focusCharacters || [],
            adversityType: generationResult.chapter.adversityType || "internal",
            virtueType: generationResult.chapter.virtueType || "courage",
            seedsPlanted: generationResult.chapter.seedsPlanted || [],
            seedsResolved: generationResult.chapter.seedsResolved || [],
            connectsToPreviousChapter:
                generationResult.chapter.connectsToPreviousChapter?.trim() ||
                (nextChapterIndex === 0
                    ? "First chapter"
                    : "Continues from previous chapter"),
            createsNextAdversity:
                generationResult.chapter.createsNextAdversity?.trim() ||
                "Sets up next challenge",
            status: "writing",
            publishedAt: now,
            scheduledFor: now,
            orderIndex: nextChapterIndex + 1,
            createdAt: now,
            updatedAt: now,
        });

        const savedChapterArray: Chapter[] = (await db
            .insert(chapters)
            .values(validatedChapter)
            .returning()) as Chapter[];
        const savedChapter: Chapter = savedChapterArray[0];

        console.log(
            `[chapter-service] ✅ Saved chapter ${nextChapterIndex + 1}:`,
            {
                id: savedChapter.id,
                title: savedChapter.title,
                orderIndex: savedChapter.orderIndex,
            },
        );

        // 7. Return result
        return {
            chapter: savedChapter,
            metadata: {
                generationTime: generationResult.metadata.generationTime,
                chapterIndex: nextChapterIndex,
                totalChapters: allPreviousChapters.length + 1,
            },
        };
    }
}

export const chapterService = new ChapterService();
