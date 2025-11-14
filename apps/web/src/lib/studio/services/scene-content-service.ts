/**
 * Scene Content Service
 *
 * Service layer for scene content generation and database persistence.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/drizzle";
import { generateSceneContent } from "../generators/scene-content-generator";
import type {
    GeneratorSceneContentParams,
    GeneratorSceneContentResult,
} from "../generators/types";
import type {
    Chapter,
    Character,
    Part,
    Scene,
    Setting,
    Story,
} from "../generators/zod-schemas";

export interface ServiceSceneContentParams {
    sceneId: string;
    language?: string;
    userId: string;
    apiKey?: string;
}

export interface ServiceSceneContentResult {
    scene: Scene;
    metadata: {
        wordCount: number;
        generationTime: number;
    };
}

export class SceneContentService {
    async generateAndSave(
        params: ServiceSceneContentParams,
    ): Promise<ServiceSceneContentResult> {
        const { sceneId, language = "English", userId, apiKey } = params;

        // 1. Fetch scene
        const sceneResult = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, sceneId));

        const scene = sceneResult[0] as Scene | undefined;

        if (!scene) {
            throw new Error(`Scene not found: ${sceneId}`);
        }

        // 2. Get chapter to access storyId
        const chapterResult = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, scene.chapterId));

        const chapter = chapterResult[0] as Chapter | undefined;

        if (!chapter) {
            throw new Error(`Chapter not found: ${scene.chapterId}`);
        }

        // 3. Get story to verify ownership
        const storyResult: Story[] = (await db
            .select()
            .from(stories)
            .where(eq(stories.id, chapter.storyId))) as Story[];

        const story: Story | undefined = storyResult[0];

        if (!story) {
            throw new Error(`Story not found: ${chapter.storyId}`);
        }

        // 4. Verify ownership
        if (story.authorId !== userId) {
            throw new Error(
                "Access denied: You do not have permission to modify this story",
            );
        }

        // 5. Fetch part
        const partResult = await db
            .select()
            .from(parts)
            .where(eq(parts.id, chapter.partId));

        const part = partResult[0] as Part | undefined;

        if (!part) {
            throw new Error(`Part not found: ${chapter.partId}`);
        }

        // 6. Fetch all characters for the story
        const storyCharacters = (await db
            .select()
            .from(characters)
            .where(eq(characters.storyId, story.id))) as Character[];

        // 7. Fetch all settings for the story
        const storySettings = (await db
            .select()
            .from(settings)
            .where(eq(settings.storyId, story.id))) as Setting[];

        // 8. Generate scene content using pure generator
        const generateParams: GeneratorSceneContentParams = {
            story,
            part,
            chapter,
            scene,
            characters: storyCharacters,
            settings: storySettings,
            language,
            apiKey,
        };

        const generationResult: GeneratorSceneContentResult =
            await generateSceneContent(generateParams);

        // 9. Update scene with generated content
        const now: string = new Date().toISOString();

        const updatedSceneArray: Scene[] = (await db
            .update(scenes)
            .set({
                content: generationResult.content,
                updatedAt: now,
            })
            .where(eq(scenes.id, sceneId))
            .returning()) as Scene[];

        const updatedScene: Scene = updatedSceneArray[0];

        // 10. Return result
        return {
            scene: updatedScene,
            metadata: {
                wordCount: generationResult.wordCount,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const sceneContentService = new SceneContentService();
