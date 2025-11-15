import { tool } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { STORY_TONES } from "@/lib/constants/tones";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/database";

// ==============================================================================
// STORY CRUD TOOLS
// ==============================================================================

const getStorySchema = z.object({
    storyId: z.string().describe("The story ID to retrieve"),
});

export const getStory = tool({
    summary: "Get complete story details including all metadata fields",
    parameters: getStorySchema,
    execute: async ({ storyId }: z.infer<typeof getStorySchema>) => {
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        if (!story) {
            return { success: false, error: "Story not found" };
        }

        return {
            success: true,
            story: {
                id: story.id,
                title: story.title,
                genre: story.genre,
                status: story.status,
                summary: story.summary,
                tone: story.tone,
                moralFramework: story.moralFramework,
                imageUrl: story.imageUrl,
                viewCount: story.viewCount,
                rating: story.rating,
                ratingCount: story.ratingCount,
                createdAt: story.createdAt,
                updatedAt: story.updatedAt,
            },
        };
    },
});

const updateStorySchema = z.object({
    storyId: z.string().describe("The story ID to update"),
    updates: z.object({
        title: z.string().optional().describe("Story title"),
        genre: z.string().optional().describe("Story genre"),
        status: z
            .enum(["draft", "published"])
            .optional()
            .describe("Story status"),
        summary: z
            .string()
            .optional()
            .describe("Story summary and thematic premise"),
        tone: z.enum(STORY_TONES).optional().describe("Emotional tone"),
        moralFramework: z
            .string()
            .optional()
            .describe("Moral framework and valued virtues"),
    }),
});

export const updateStory = tool({
    summary:
        "Update story metadata (title, genre, status, summary, tone, moralFramework)",
    parameters: updateStorySchema,
    execute: async ({
        storyId,
        updates,
    }: z.infer<typeof updateStorySchema>) => {
        const [updated] = await db
            .update(stories)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(stories.id, storyId))
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Story not found or update failed",
            };
        }

        return {
            success: true,
            message: "Story updated successfully",
            story: updated,
        };
    },
});

// ==============================================================================
// PART CRUD TOOLS
// ==============================================================================

const getPartSchema = z.object({
    partId: z.string().describe("The part ID to retrieve"),
});

export const getPart = tool({
    summary:
        "Get part details including title, summary, orderIndex, and character arcs",
    parameters: getPartSchema,
    execute: async ({ partId }: z.infer<typeof getPartSchema>) => {
        const [part] = await db
            .select()
            .from(parts)
            .where(eq(parts.id, partId))
            .limit(1);

        if (!part) {
            return { success: false, error: "Part not found" };
        }

        return {
            success: true,
            part: {
                id: part.id,
                title: part.title,
                storyId: part.storyId,
                summary: part.summary,
                orderIndex: part.orderIndex,
                characterArcs: part.characterArcs,
                createdAt: part.createdAt,
                updatedAt: part.updatedAt,
            },
        };
    },
});

const createPartSchema = z.object({
    storyId: z.string().describe("The story ID"),
    authorId: z.string().describe("The author user ID"),
    title: z.string().describe("Part title"),
    summary: z.string().optional().describe("Part summary"),
    orderIndex: z.number().describe("Order index (0, 1, 2 for acts 1, 2, 3)"),
});

export const createPart = tool({
    summary: "Create a new part in a story",
    parameters: createPartSchema,
    execute: async ({
        storyId,
        authorId,
        title,
        summary,
        orderIndex,
    }: z.infer<typeof createPartSchema>) => {
        const [part] = await db
            .insert(parts)
            .values({
                id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storyId,
                authorId,
                title,
                summary: summary || null,
                orderIndex,
            })
            .returning();

        return {
            success: true,
            message: "Part created successfully",
            part: {
                id: part.id,
                title: part.title,
                orderIndex: part.orderIndex,
            },
        };
    },
});

const updatePartSchema = z.object({
    partId: z.string().describe("The part ID to update"),
    updates: z.object({
        title: z.string().optional().describe("Part title"),
        summary: z.string().optional().describe("Part summary"),
        orderIndex: z.number().optional().describe("Order index"),
    }),
});

export const updatePart = tool({
    summary: "Update part details",
    parameters: updatePartSchema,
    execute: async ({ partId, updates }: z.infer<typeof updatePartSchema>) => {
        const [updated] = await db
            .update(parts)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(parts.id, partId))
            .returning();

        if (!updated) {
            return { success: false, error: "Part not found or update failed" };
        }

        return {
            success: true,
            message: "Part updated successfully",
            part: updated,
        };
    },
});

const deletePartSchema = z.object({
    partId: z.string().describe("The part ID to delete"),
});

export const deletePart = tool({
    summary: "Delete a part and all its chapters and scenes (cascade delete)",
    parameters: deletePartSchema,
    execute: async ({ partId }: z.infer<typeof deletePartSchema>) => {
        await db.delete(parts).where(eq(parts.id, partId));

        return {
            success: true,
            message: "Part and all its chapters/scenes deleted successfully",
        };
    },
});

// ==============================================================================
// CHAPTER CRUD TOOLS
// ==============================================================================

const getChapterSchema = z.object({
    chapterId: z.string().describe("The chapter ID to retrieve"),
});

export const getChapter = tool({
    summary: "Get chapter details including all metadata fields",
    parameters: getChapterSchema,
    execute: async ({ chapterId }: z.infer<typeof getChapterSchema>) => {
        const [chapter] = await db
            .select()
            .from(chapters)
            .where(eq(chapters.id, chapterId))
            .limit(1);

        if (!chapter) {
            return { success: false, error: "Chapter not found" };
        }

        return {
            success: true,
            chapter: {
                id: chapter.id,
                title: chapter.title,
                summary: chapter.summary,
                storyId: chapter.storyId,
                partId: chapter.partId,
                orderIndex: chapter.orderIndex,
                characterId: chapter.characterId,
                arcPosition: chapter.arcPosition,
                contributesToMacroArc: chapter.contributesToMacroArc,
                characterArc: chapter.characterArc,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
            },
        };
    },
});

const createChapterSchema = z.object({
    storyId: z.string().describe("The story ID"),
    authorId: z.string().describe("The author user ID"),
    partId: z.string().optional().describe("The part ID (optional)"),
    title: z.string().describe("Chapter title"),
    summary: z.string().optional().describe("Chapter summary"),
    orderIndex: z.number().describe("Order index within part or story"),
});

export const createChapter = tool({
    summary: "Create a new chapter in a story or part",
    parameters: createChapterSchema,
    execute: async ({
        storyId,
        authorId,
        partId,
        title,
        summary,
        orderIndex,
    }: z.infer<typeof createChapterSchema>) => {
        const [chapter] = await db
            .insert(chapters)
            .values({
                id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storyId,
                authorId,
                partId: partId || null,
                title,
                summary: summary || null,
                orderIndex,
                status: "writing",
            })
            .returning();

        return {
            success: true,
            message: "Chapter created successfully",
            chapter: {
                id: chapter.id,
                title: chapter.title,
                orderIndex: chapter.orderIndex,
            },
        };
    },
});

const updateChapterSchema = z.object({
    chapterId: z.string().describe("The chapter ID to update"),
    updates: z.object({
        title: z.string().optional().describe("Chapter title"),
        summary: z.string().optional().describe("Chapter summary"),
        characterId: z
            .string()
            .optional()
            .describe("Character whose arc this advances"),
        arcPosition: z
            .enum(["beginning", "middle", "climax", "resolution"])
            .optional()
            .describe("Arc position"),
        contributesToMacroArc: z
            .string()
            .optional()
            .describe("How this advances the macro arc"),
        orderIndex: z.number().optional().describe("Order index"),
    }),
});

export const updateChapter = tool({
    summary: "Update chapter details and metadata",
    parameters: updateChapterSchema,
    execute: async ({
        chapterId,
        updates,
    }: z.infer<typeof updateChapterSchema>) => {
        const [updated] = await db
            .update(chapters)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(chapters.id, chapterId))
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Chapter not found or update failed",
            };
        }

        return {
            success: true,
            message: "Chapter updated successfully",
            chapter: updated,
        };
    },
});

const deleteChapterSchema = z.object({
    chapterId: z.string().describe("The chapter ID to delete"),
});

export const deleteChapter = tool({
    summary: "Delete a chapter and all its scenes (cascade delete)",
    parameters: deleteChapterSchema,
    execute: async ({ chapterId }: z.infer<typeof deleteChapterSchema>) => {
        await db.delete(chapters).where(eq(chapters.id, chapterId));

        return {
            success: true,
            message: "Chapter and all its scenes deleted successfully",
        };
    },
});

// ==============================================================================
// SCENE CRUD TOOLS
// ==============================================================================

const getSceneSchema = z.object({
    sceneId: z.string().describe("The scene ID to retrieve"),
});

export const getScene = tool({
    summary: "Get scene details including content and all metadata",
    parameters: getSceneSchema,
    execute: async ({ sceneId }: z.infer<typeof getSceneSchema>) => {
        const [scene] = await db
            .select()
            .from(scenes)
            .where(eq(scenes.id, sceneId))
            .limit(1);

        if (!scene) {
            return { success: false, error: "Scene not found" };
        }

        return {
            success: true,
            scene: {
                id: scene.id,
                title: scene.title,
                content: scene.content,
                chapterId: scene.chapterId,
                orderIndex: scene.orderIndex,
                imageUrl: scene.imageUrl,
                summary: scene.summary,
                cyclePhase: scene.cyclePhase,
                emotionalBeat: scene.emotionalBeat,
                characterFocus: scene.characterFocus,
                settingId: scene.settingId,
                sensoryAnchors: scene.sensoryAnchors,
                dialogueVsDescription: scene.dialogueVsDescription,
                suggestedLength: scene.suggestedLength,
                novelStatus: scene.novelStatus,
                comicStatus: scene.comicStatus,
                createdAt: scene.createdAt,
                updatedAt: scene.updatedAt,
            },
        };
    },
});

const createSceneSchema = z.object({
    chapterId: z.string().describe("The chapter ID"),
    title: z.string().describe("Scene title"),
    content: z.string().optional().describe("Scene content"),
    summary: z.string().optional().describe("Scene summary"),
    orderIndex: z.number().describe("Order index within chapter"),
});

export const createScene = tool({
    summary: "Create a new scene in a chapter",
    parameters: createSceneSchema,
    execute: async ({
        chapterId,
        title,
        content,
        summary,
        orderIndex,
    }: z.infer<typeof createSceneSchema>) => {
        const [scene] = await db
            .insert(scenes)
            .values({
                id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chapterId,
                title,
                content: content || "",
                summary: summary || "",
                orderIndex,
                cyclePhase: "setup",
                emotionalBeat: "hope",
                settingId: "",
                dialogueVsDescription: "50% dialogue, 50% description",
                suggestedLength: "medium",
            })
            .returning();

        return {
            success: true,
            message: "Scene created successfully",
            scene: {
                id: scene.id,
                title: scene.title,
                orderIndex: scene.orderIndex,
            },
        };
    },
});

const updateSceneSchema = z.object({
    sceneId: z.string().describe("The scene ID to update"),
    updates: z.object({
        title: z.string().optional().describe("Scene title"),
        content: z.string().optional().describe("Scene content"),
        summary: z.string().optional().describe("Scene summary"),
        orderIndex: z.number().optional().describe("Order index"),
        cyclePhase: z
            .enum(["setup", "adversity", "virtue", "consequence", "transition"])
            .optional(),
        emotionalBeat: z
            .enum([
                "fear",
                "hope",
                "tension",
                "relief",
                "elevation",
                "catharsis",
                "despair",
                "joy",
            ])
            .optional(),
    }),
});

export const updateScene = tool({
    summary: "Update scene content and metadata",
    parameters: updateSceneSchema,
    execute: async ({
        sceneId,
        updates,
    }: z.infer<typeof updateSceneSchema>) => {
        const [updated] = await db
            .update(scenes)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(scenes.id, sceneId))
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Scene not found or update failed",
            };
        }

        return {
            success: true,
            message: "Scene updated successfully",
            scene: updated,
        };
    },
});

const deleteSceneSchema = z.object({
    sceneId: z.string().describe("The scene ID to delete"),
});

export const deleteScene = tool({
    summary: "Delete a scene",
    parameters: deleteSceneSchema,
    execute: async ({ sceneId }: z.infer<typeof deleteSceneSchema>) => {
        await db.delete(scenes).where(eq(scenes.id, sceneId));

        return {
            success: true,
            message: "Scene deleted successfully",
        };
    },
});

// ==============================================================================
// CHARACTER CRUD TOOLS
// ==============================================================================

const getCharacterSchema = z.object({
    characterId: z.string().describe("The character ID to retrieve"),
});

export const getCharacter = tool({
    summary:
        "Get character details including all personality and arc information",
    parameters: getCharacterSchema,
    execute: async ({ characterId }: z.infer<typeof getCharacterSchema>) => {
        const [character] = await db
            .select()
            .from(characters)
            .where(eq(characters.id, characterId))
            .limit(1);

        if (!character) {
            return { success: false, error: "Character not found" };
        }

        return {
            success: true,
            character: {
                id: character.id,
                name: character.name,
                storyId: character.storyId,
                isMain: character.isMain,
                role: character.role,
                summary: character.summary,
                coreTrait: character.coreTrait,
                internalFlaw: character.internalFlaw,
                externalGoal: character.externalGoal,
                personality: character.personality,
                backstory: character.backstory,
                physicalDescription: character.physicalDescription,
                voiceStyle: character.voiceStyle,
                imageUrl: character.imageUrl,
                createdAt: character.createdAt,
                updatedAt: character.updatedAt,
            },
        };
    },
});

const createCharacterSchema = z.object({
    storyId: z.string().describe("The story ID"),
    name: z.string().describe("Character name"),
    isMain: z.boolean().optional().describe("Is this a main character?"),
    role: z.string().optional().describe("Character role"),
    summary: z.string().optional().describe("Character summary"),
});

export const createCharacter = tool({
    summary: "Create a new character in a story",
    parameters: createCharacterSchema,
    execute: async ({
        storyId,
        name,
        isMain,
        role,
        summary,
    }: z.infer<typeof createCharacterSchema>) => {
        const [character] = await db
            .insert(characters)
            .values({
                id: `character_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storyId,
                name,
                isMain: isMain || false,
                role: role || null,
                summary: summary || null,
            })
            .returning();

        return {
            success: true,
            message: "Character created successfully",
            character: {
                id: character.id,
                name: character.name,
                isMain: character.isMain,
            },
        };
    },
});

const updateCharacterSchema = z.object({
    characterId: z.string().describe("The character ID to update"),
    updates: z.object({
        name: z.string().optional().describe("Character name"),
        isMain: z.boolean().optional().describe("Is main character"),
        role: z
            .enum([
                "protagonist",
                "deuteragonist",
                "tritagonist",
                "antagonist",
                "supporting",
            ])
            .optional()
            .describe("Character role"),
        summary: z.string().optional().describe("Character summary"),
        coreTrait: z.string().optional().describe("Core moral virtue"),
        internalFlaw: z.string().optional().describe("Internal flaw"),
        externalGoal: z.string().optional().describe("External goal"),
        backstory: z.string().optional().describe("Character backstory"),
    }),
});

export const updateCharacter = tool({
    summary: "Update character details and personality",
    parameters: updateCharacterSchema,
    execute: async ({
        characterId,
        updates,
    }: z.infer<typeof updateCharacterSchema>) => {
        const [updated] = await db
            .update(characters)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(characters.id, characterId))
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Character not found or update failed",
            };
        }

        return {
            success: true,
            message: "Character updated successfully",
            character: updated,
        };
    },
});

const deleteCharacterSchema = z.object({
    characterId: z.string().describe("The character ID to delete"),
});

export const deleteCharacter = tool({
    summary: "Delete a character",
    parameters: deleteCharacterSchema,
    execute: async ({ characterId }: z.infer<typeof deleteCharacterSchema>) => {
        await db.delete(characters).where(eq(characters.id, characterId));

        return {
            success: true,
            message: "Character deleted successfully",
        };
    },
});

// ==============================================================================
// SETTING CRUD TOOLS
// ==============================================================================

const getSettingSchema = z.object({
    settingId: z.string().describe("The setting ID to retrieve"),
});

export const getSetting = tool({
    summary:
        "Get setting details including mood, sensory details, and visual style",
    parameters: getSettingSchema,
    execute: async ({ settingId }: z.infer<typeof getSettingSchema>) => {
        const [setting] = await db
            .select()
            .from(settings)
            .where(eq(settings.id, settingId))
            .limit(1);

        if (!setting) {
            return { success: false, error: "Setting not found" };
        }

        return {
            success: true,
            setting: {
                id: setting.id,
                name: setting.name,
                storyId: setting.storyId,
                summary: setting.summary,
                adversityElements: setting.adversityElements,
                virtueElements: setting.virtueElements,
                consequenceElements: setting.consequenceElements,
                symbolicMeaning: setting.symbolicMeaning,
                imageUrl: setting.imageUrl,
                createdAt: setting.createdAt,
                updatedAt: setting.updatedAt,
            },
        };
    },
});

const createSettingSchema = z.object({
    storyId: z.string().describe("The story ID"),
    name: z.string().describe("Setting name"),
    summary: z.string().describe("Setting description"),
    symbolicMeaning: z.string().describe("Symbolic meaning"),
});

export const createSetting = tool({
    summary: "Create a new setting in a story",
    parameters: createSettingSchema,
    execute: async ({
        storyId,
        name,
        summary,
        symbolicMeaning,
    }: z.infer<typeof createSettingSchema>) => {
        const [setting] = await db
            .insert(settings)
            .values({
                id: `setting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storyId,
                name,
                summary,
                symbolicMeaning,
                adversityElements: {
                    physicalObstacles: [],
                    scarcityFactors: [],
                    dangerSources: [],
                    socialDynamics: [],
                },
                virtueElements: {
                    witnessElements: [],
                    contrastElements: [],
                    opportunityElements: [],
                    sacredSpaces: [],
                },
                consequenceElements: {
                    transformativeElements: [],
                    rewardSources: [],
                    revelationTriggers: [],
                    communityResponses: [],
                },
            })
            .returning();

        return {
            success: true,
            message: "Setting created successfully",
            setting: {
                id: setting.id,
                name: setting.name,
            },
        };
    },
});

const updateSettingSchema = z.object({
    settingId: z.string().describe("The setting ID to update"),
    updates: z.object({
        name: z.string().optional().describe("Setting name"),
        summary: z.string().optional().describe("Setting description"),
        symbolicMeaning: z.string().optional().describe("Symbolic meaning"),
    }),
});

export const updateSetting = tool({
    summary: "Update setting details",
    parameters: updateSettingSchema,
    execute: async ({
        settingId,
        updates,
    }: z.infer<typeof updateSettingSchema>) => {
        const [updated] = await db
            .update(settings)
            .set({
                ...updates,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(settings.id, settingId))
            .returning();

        if (!updated) {
            return {
                success: false,
                error: "Setting not found or update failed",
            };
        }

        return {
            success: true,
            message: "Setting updated successfully",
            setting: updated,
        };
    },
});

const deleteSettingSchema = z.object({
    settingId: z.string().describe("The setting ID to delete"),
});

export const deleteSetting = tool({
    summary: "Delete a setting",
    parameters: deleteSettingSchema,
    execute: async ({ settingId }: z.infer<typeof deleteSettingSchema>) => {
        await db.delete(settings).where(eq(settings.id, settingId));

        return {
            success: true,
            message: "Setting deleted successfully",
        };
    },
});

// ==============================================================================
// COMBINED TOOLS EXPORT
// ==============================================================================

export const studioAgentCrudTools = {
    // Story tools
    getStory,
    updateStory,

    // Part tools
    getPart,
    createPart,
    updatePart,
    deletePart,

    // Chapter tools
    getChapter,
    createChapter,
    updateChapter,
    deleteChapter,

    // Scene tools
    getScene,
    createScene,
    updateScene,
    deleteScene,

    // Character tools
    getCharacter,
    createCharacter,
    updateCharacter,
    deleteCharacter,

    // Setting tools
    getSetting,
    createSetting,
    updateSetting,
    deleteSetting,
};
