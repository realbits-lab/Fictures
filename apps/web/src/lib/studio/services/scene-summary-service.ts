/**
 * Scene Summary Service (Singular - Extreme Incremental)
 *
 * Service layer for generating ONE next scene summary with full context awareness.
 * This is the extreme incremental approach where each scene summary is generated
 * one at a time, seeing all previous scenes in the chapter.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chapters, scenes, settings, stories } from "@/lib/db/schema";
import { generateSceneSummary } from "../generators/scene-summary-generator";
import type {
    GenerateSceneSummaryParams,
    GenerateSceneSummaryResult,
} from "../generators/types";
import {
    type Chapter,
    insertSceneSchema,
    type Scene,
    type Setting,
    type Story,
} from "../generators/zod-schemas.generated";

export interface GenerateSceneSummaryServiceParams {
    storyId: string;
    chapterId: string;
    userId: string;
}

export interface GenerateSceneSummaryServiceResult {
    scene: Scene;
    metadata: {
        generationTime: number;
        sceneIndex: number;
        globalSceneIndex: number;
        totalScenesInChapter: number;
        totalScenesInStory: number;
    };
}

export class SceneSummaryService {
    /**
     * Generate and save ONE next scene summary with full context
     *
     * Automatically fetches all previous scenes (in the current chapter and entire story)
     * and uses them as context (including full content if available) for generating
     * the next scene summary in sequence.
     */
    async generateAndSave(
        params: GenerateSceneSummaryServiceParams,
    ): Promise<GenerateSceneSummaryServiceResult> {
        const { storyId, chapterId, userId } = params;

        console.log(
            "[scene-summary-service] 📄 Generating next scene summary with full context...",
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

        // 3. Fetch the current chapter
        const chapterResult: Chapter[] = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId))) as Chapter[];

        const chapter: Chapter | undefined = chapterResult[0];

        if (!chapter) {
            throw new Error(`Chapter not found: ${chapterId}`);
        }

        if (chapter.storyId !== storyId) {
            throw new Error("Chapter does not belong to the specified story");
        }

        // 4. Fetch settings for the story
        const storySettings: Setting[] = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, storyId))) as Setting[];

        // 5. Fetch ALL previous scenes for this story (FULL CONTEXT)
        const allPreviousScenes: Scene[] = (await db
            .select()
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(scenes.orderIndex)) as Scene[];

        // 6. Get global scene count across entire story
        const allScenesInStory: Scene[] = (await db
            .select()
            .from(scenes)
            .where(
                eq(
                    scenes.chapterId,
                    db
                        .select({ id: chapters.id })
                        .from(chapters)
                        .where(eq(chapters.storyId, storyId)),
                ),
            )
            .orderBy(scenes.orderIndex)) as Scene[];

        const nextSceneIndexInChapter = allPreviousScenes.length;
        const nextGlobalSceneIndex = allScenesInStory.length;

        console.log(
            `[scene-summary-service] Found ${allScenesInStory.length} total scenes, ${allPreviousScenes.length} in current chapter`,
        );
        console.log(
            `[scene-summary-service] Generating scene ${nextGlobalSceneIndex + 1} (chapter scene ${nextSceneIndexInChapter + 1})...`,
        );

        // 7. Generate next scene summary using singular generator with full context
        const generateParams: GenerateSceneSummaryParams = {
            chapter,
            settings: storySettings,
            previousScenes: allPreviousScenes,
            sceneIndex: nextSceneIndexInChapter,
            globalSceneIndex: nextGlobalSceneIndex,
        };

        const generationResult: GenerateSceneSummaryResult =
            await generateSceneSummary(generateParams);

        // 8. Save scene summary to database
        const now: string = new Date().toISOString();
        const sceneId: string = `scene_${nanoid(16)}`;

        const validatedScene = insertSceneSchema.parse({
            // === IDENTITY ===
            id: sceneId,
            chapterId,
            title:
                generationResult.scene.title ||
                `Scene ${nextGlobalSceneIndex + 1}`,

            // === SCENE SPECIFICATION (Planning Layer) ===
            summary: generationResult.scene.summary || null,

            // === CYCLE PHASE TRACKING ===
            cyclePhase: generationResult.scene.cyclePhase || null,
            emotionalBeat: generationResult.scene.emotionalBeat || null,

            // === PLANNING METADATA (Guides Content Generation) ===
            characterFocus: generationResult.scene.characterFocus || [],
            settingId: generationResult.scene.settingId || null,
            sensoryAnchors: generationResult.scene.sensoryAnchors || [],
            dialogueVsDescription:
                generationResult.scene.dialogueVsDescription || null,
            suggestedLength: generationResult.scene.suggestedLength || null,

            // === GENERATED PROSE (Execution Layer) ===
            content: "",

            // === VISUAL ===
            imageUrl: null,
            imageVariants: null,

            // === PUBLISHING (Novel Format) ===
            visibility: "private",
            publishedAt: null,
            publishedBy: null,
            unpublishedAt: null,
            unpublishedBy: null,
            scheduledFor: null,
            autoPublish: false,

            // === COMIC FORMAT ===
            comicStatus: "none",
            comicPublishedAt: null,
            comicPublishedBy: null,
            comicUnpublishedAt: null,
            comicUnpublishedBy: null,
            comicGeneratedAt: null,
            comicPanelCount: 0,
            comicVersion: 1,

            // === ANALYTICS ===
            viewCount: 0,
            uniqueViewCount: 0,
            novelViewCount: 0,
            novelUniqueViewCount: 0,
            comicViewCount: 0,
            comicUniqueViewCount: 0,
            lastViewedAt: null,

            // === ORDERING ===
            orderIndex: nextGlobalSceneIndex + 1,

            // === METADATA ===
            createdAt: now,
            updatedAt: now,
        });

        const savedSceneArray: Scene[] = (await db
            .insert(scenes)
            .values(validatedScene)
            .returning()) as Scene[];
        const savedScene: Scene = savedSceneArray[0];

        console.log(
            `[scene-summary-service] ✅ Saved scene summary ${nextGlobalSceneIndex + 1}:`,
            {
                id: savedScene.id,
                title: savedScene.title,
                orderIndex: savedScene.orderIndex,
            },
        );

        // 9. Return result
        return {
            scene: savedScene,
            metadata: {
                generationTime: generationResult.metadata.generationTime,
                sceneIndex: nextSceneIndexInChapter,
                globalSceneIndex: nextGlobalSceneIndex,
                totalScenesInChapter: allPreviousScenes.length + 1,
                totalScenesInStory: allScenesInStory.length + 1,
            },
        };
    }
}

export const sceneSummaryService = new SceneSummaryService();
