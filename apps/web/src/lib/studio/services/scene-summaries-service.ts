/**
 * Scene Summaries Service
 *
 * Service layer for scene summaries generation and database persistence.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chapters, scenes, settings, stories } from "@/lib/db/schema";
import { generateSceneSummaries } from "../generators/scene-summaries-generator";
import type {
    GenerateSceneSummariesParams,
    GenerateSceneSummariesResult,
} from "../generators/types";
import {
    type Chapter,
    insertSceneSchema,
    type Scene,
    type Setting,
    type Story,
} from "../generators/zod-schemas.generated";

export interface GenerateSceneSummariesServiceParams {
    storyId: string;
    scenesPerChapter: number;
    userId: string;
}

export interface GenerateSceneSummariesServiceResult {
    scenes: Scene[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export class SceneSummariesService {
    async generateAndSave(
        params: GenerateSceneSummariesServiceParams,
    ): Promise<GenerateSceneSummariesServiceResult> {
        const { storyId, scenesPerChapter, userId } = params;

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

        // 3. Fetch chapters for the story
        const storyChapters: Chapter[] = (await db
            .select()
            .from(chapters)
            .where(eq(chapters.storyId, storyId))
            .orderBy(chapters.orderIndex)) as Chapter[];

        if (storyChapters.length === 0) {
            throw new Error(
                "Story must have chapters before generating scenes",
            );
        }

        // 4. Fetch settings for the story
        const storySettings: Setting[] = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, storyId))) as Setting[];

        // 5. Generate scene summaries using pure generator
        const generateParams: GenerateSceneSummariesParams = {
            chapters: storyChapters,
            settings: storySettings,
            scenesPerChapter,
        };

        const generationResult: GenerateSceneSummariesResult =
            await generateSceneSummaries(generateParams);

        // 6. Save scene summaries to database
        const savedScenes: Scene[] = [];
        const now: string = new Date().toISOString();

        for (let i = 0; i < generationResult.scenes.length; i++) {
            const sceneData = generationResult.scenes[i];
            const sceneId: string = `scene_${nanoid(16)}`;

            // 7. Calculate which chapter this scene belongs to
            const chapterIndex: number = Math.floor(i / scenesPerChapter);
            const currentChapter: Chapter = storyChapters[chapterIndex];
            const currentChapterId: string = currentChapter.id;

            const validatedScene = insertSceneSchema.parse({
                // === IDENTITY ===
                id: sceneId,
                chapterId: currentChapterId,
                title: sceneData.title || `Scene ${i + 1}`,

                // === SCENE SPECIFICATION (Planning Layer) ===
                summary: sceneData.summary || null,

                // === CYCLE PHASE TRACKING ===
                cyclePhase: sceneData.cyclePhase || null,
                emotionalBeat: sceneData.emotionalBeat || null,

                // === PLANNING METADATA (Guides Content Generation) ===
                characterFocus: sceneData.characterFocus || [],
                settingId: sceneData.settingId || null,
                sensoryAnchors: sceneData.sensoryAnchors || [],
                dialogueVsDescription: sceneData.dialogueVsDescription || null,
                suggestedLength: sceneData.suggestedLength || null,

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
                orderIndex: i + 1,

                // === METADATA ===
                createdAt: now,
                updatedAt: now,
            });

            const savedSceneArray: Scene[] = (await db
                .insert(scenes)
                .values(validatedScene)
                .returning()) as Scene[];
            const savedScene: Scene = savedSceneArray[0];
            savedScenes.push(savedScene);
        }

        // 8. Return result
        return {
            scenes: savedScenes,
            metadata: {
                totalGenerated: generationResult.metadata.totalGenerated,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const sceneSummariesService = new SceneSummariesService();
