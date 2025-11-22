/**
 * Story Service
 *
 * Service layer for story generation and database persistence.
 * Now uses authentication context instead of passing API keys as parameters.
 */

import type { InferSelectModel } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { StoryGenre } from "@/lib/constants/genres";
import type { StoryTone } from "@/lib/constants/tones";
import { db } from "@/lib/db";
import { stories } from "@/lib/schemas/database";

// Database row types (for query results)
type Story = InferSelectModel<typeof stories>;

import type {
    GenerateStoryParams,
    GenerateStoryResult,
} from "@/lib/schemas/generators/types";
import { insertStorySchema } from "@/lib/schemas/zod/generated";
import { generateStory } from "../generators/story-generator";
import {
    selectOrCreateWriter,
    selectOrCreateDesigner,
} from "@/lib/services/ai-creators";

export interface ServiceStoryParams {
    userPrompt: string;
    language?: string;
    preferredGenre?: StoryGenre;
    preferredTone?: StoryTone;
    userId: string;
    promptVersion?: string;
    // apiKey removed - now retrieved from auth context
}

export interface ServiceStoryResult {
    story: Story;
    metadata: {
        generationTime: number;
        model?: string;
    };
}

export class StoryService {
    async generateAndSave(
        params: ServiceStoryParams,
    ): Promise<ServiceStoryResult> {
        const {
            userPrompt,
            language = "English",
            preferredGenre,
            preferredTone,
            userId,
            promptVersion,
        } = params;

        // 1. Generate story using pure generator
        // API key is automatically retrieved from auth context
        const generateParams: GenerateStoryParams = {
            userPrompt,
            language,
            preferredGenre,
            preferredTone,
        };

        const generationResult: GenerateStoryResult =
            await generateStory(generateParams);

        // 2. Select or create AI writer and designer
        const [writer, designer] = await Promise.all([
            selectOrCreateWriter(),
            selectOrCreateDesigner(),
        ]);

        console.log("[story-service] Selected AI creators:", {
            writer: { id: writer.id, name: writer.name, style: writer.writingStyle },
            designer: { id: designer.id, name: designer.name, style: designer.designStyle },
        });

        // 3. Prepare story data for database
        const storyId: string = `story_${nanoid(16)}`;
        const now: string = new Date().toISOString();

        const storyData = insertStorySchema.parse({
            id: storyId,
            authorId: userId,
            title: generationResult.story.title || "Untitled Story",
            summary: generationResult.story.summary || null,
            genre: generationResult.story.genre || null,
            tone: generationResult.story.tone || "hopeful",
            moralFramework: generationResult.story.moralFramework || null,
            writerId: writer.id,
            designerId: designer.id,
            status: "draft",
            viewCount: 0,
            rating: 0,
            ratingCount: 0,
            imageUrl: null,
            imageVariants: null,
            createdAt: now,
            updatedAt: now,
        });

        // 3. Save to database
        const savedStoryArray: Story[] = (await db
            .insert(stories)
            .values(storyData)
            .returning()) as Story[];
        const savedStory: Story = savedStoryArray[0];

        // 4. Return result
        return {
            story: savedStory,
            metadata: {
                generationTime: generationResult.metadata.generationTime,
                model: generationResult.metadata.model,
            },
        };
    }
}

export const storyService = new StoryService();
