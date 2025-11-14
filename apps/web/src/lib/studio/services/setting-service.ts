/**
 * Setting Service
 *
 * Service layer for setting generation and database persistence.
 */

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { type Setting, type Story } from "@/lib/schemas/zod/ai";
import { insertSettingSchema } from "@/lib/schemas/zod/generated";
import { settings, stories } from "@/lib/schemas/database";
import { generateSettings } from "../generators/settings-generator";
import type {
    GeneratorSettingsParams,
    GeneratorSettingsResult,
} from "../generators/types";

export interface ServiceSettingsParams {
    storyId: string;
    settingCount: number;
    userId: string;
    apiKey?: string;
}

export interface ServiceSettingsResult {
    settings: Setting[];
    metadata: {
        totalGenerated: number;
        generationTime: number;
    };
}

export class SettingService {
    async generateAndSave(
        params: ServiceSettingsParams,
    ): Promise<ServiceSettingsResult> {
        const { storyId, settingCount, userId, apiKey } = params;

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

        // 3. Generate settings using pure generator
        const generateParams: GeneratorSettingsParams = {
            story,
            settingCount,
            apiKey,
        };

        const generationResult: GeneratorSettingsResult =
            await generateSettings(generateParams);

        // 4. Save settings to database
        const savedSettings: Setting[] = [];
        const now: string = new Date().toISOString();

        for (const settingData of generationResult.settings) {
            const settingId: string = `setting_${nanoid(16)}`;

            const validatedSetting = insertSettingSchema.parse({
                id: settingId,
                storyId,
                name: settingData.name || "Unnamed Setting",
                summary: settingData.summary || null,
                adversityElements: settingData.adversityElements || null,
                virtueElements: settingData.virtueElements || null,
                consequenceElements: settingData.consequenceElements || null,
                symbolicMeaning: settingData.symbolicMeaning || null,
                cycleAmplification: settingData.cycleAmplification || null,
                mood: settingData.mood || null,
                emotionalResonance: settingData.emotionalResonance || null,
                sensory: settingData.sensory || null,
                architecturalStyle: settingData.architecturalStyle || null,
                imageUrl: null,
                imageVariants: null,
                visualReferences: settingData.visualReferences || null,
                colorPalette: settingData.colorPalette || null,
                createdAt: now,
                updatedAt: now,
            });

            const savedSettingArray: Setting[] = (await db
                .insert(settings)
                .values(validatedSetting)
                .returning()) as Setting[];
            const savedSetting: Setting = savedSettingArray[0];
            savedSettings.push(savedSetting);
        }

        // 5. Return result
        return {
            settings: savedSettings,
            metadata: {
                totalGenerated: generationResult.metadata.totalGenerated,
                generationTime: generationResult.metadata.generationTime,
            },
        };
    }
}

export const settingService = new SettingService();
