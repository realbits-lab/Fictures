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

export const getStory = tool({
    summary: "Get complete story details including all metadata fields",
    parameters: z.object({
        storyId: z.string().describe("The story ID to retrieve"),
    }),
    execute: async ({ storyId }) => {
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

export const updateStory = tool({
    summary:
        "Update story metadata (title, genre, status, summary, tone, moralFramework)",
    parameters: z.object({
        storyId: z.string().describe("The story ID to update"),
        updates: z.object({
            title: z.string().optional().describe("Story title"),
            genre: z.string().optional().describe("Story genre"),
            status: z
                .enum(["writing", "published"])
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
    }),
    execute: async ({ storyId, updates }) => {
        const [updated] = await db
            .update(stories)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const getPart = tool({
    summary:
        "Get part details including title, summary, orderIndex, and character arcs",
    parameters: z.object({
        partId: z.string().describe("The part ID to retrieve"),
    }),
    execute: async ({ partId }) => {
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

export const createPart = tool({
    summary: "Create a new part in a story",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        authorId: z.string().describe("The author user ID"),
        title: z.string().describe("Part title"),
        summary: z.string().optional().describe("Part summary"),
        orderIndex: z
            .number()
            .describe("Order index (0, 1, 2 for acts 1, 2, 3)"),
    }),
    execute: async ({ storyId, authorId, title, summary, orderIndex }) => {
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

export const updatePart = tool({
    summary: "Update part details",
    parameters: z.object({
        partId: z.string().describe("The part ID to update"),
        updates: z.object({
            title: z.string().optional().describe("Part title"),
            summary: z.string().optional().describe("Part summary"),
            orderIndex: z.number().optional().describe("Order index"),
        }),
    }),
    execute: async ({ partId, updates }) => {
        const [updated] = await db
            .update(parts)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const deletePart = tool({
    summary: "Delete a part and all its chapters and scenes (cascade delete)",
    parameters: z.object({
        partId: z.string().describe("The part ID to delete"),
    }),
    execute: async ({ partId }) => {
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

export const getChapter = tool({
    summary: "Get chapter details including all metadata fields",
    parameters: z.object({
        chapterId: z.string().describe("The chapter ID to retrieve"),
    }),
    execute: async ({ chapterId }) => {
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
                status: chapter.status,
                purpose: chapter.purpose,
                hook: chapter.hook,
                arcPosition: chapter.arcPosition,
                adversityType: chapter.adversityType,
                virtueType: chapter.virtueType,
                createdAt: chapter.createdAt,
                updatedAt: chapter.updatedAt,
            },
        };
    },
});

export const createChapter = tool({
    summary: "Create a new chapter in a story or part",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        authorId: z.string().describe("The author user ID"),
        partId: z.string().optional().describe("The part ID (optional)"),
        title: z.string().describe("Chapter title"),
        summary: z.string().optional().describe("Chapter summary"),
        orderIndex: z.number().describe("Order index within part or story"),
    }),
    execute: async ({
        storyId,
        authorId,
        partId,
        title,
        summary,
        orderIndex,
    }) => {
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

export const updateChapter = tool({
    summary: "Update chapter details and metadata",
    parameters: z.object({
        chapterId: z.string().describe("The chapter ID to update"),
        updates: z.object({
            title: z.string().optional().describe("Chapter title"),
            summary: z.string().optional().describe("Chapter summary"),
            status: z
                .enum(["writing", "published"])
                .optional()
                .describe("Chapter status"),
            purpose: z.string().optional().describe("Chapter purpose"),
            hook: z.string().optional().describe("Chapter hook"),
            characterFocus: z
                .string()
                .optional()
                .describe("Main character focus"),
            orderIndex: z.number().optional().describe("Order index"),
        }),
    }),
    execute: async ({ chapterId, updates }) => {
        const [updated] = await db
            .update(chapters)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const deleteChapter = tool({
    summary: "Delete a chapter and all its scenes (cascade delete)",
    parameters: z.object({
        chapterId: z.string().describe("The chapter ID to delete"),
    }),
    execute: async ({ chapterId }) => {
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

export const getScene = tool({
    summary: "Get scene details including content and all metadata",
    parameters: z.object({
        sceneId: z.string().describe("The scene ID to retrieve"),
    }),
    execute: async ({ sceneId }) => {
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
                sensoryAnchors: scene.sensoryAnchors,
                dialogueVsDescription: scene.dialogueVsDescription,
                suggestedLength: scene.suggestedLength,
                visibility: scene.visibility,
                viewCount: scene.viewCount,
                createdAt: scene.createdAt,
                updatedAt: scene.updatedAt,
            },
        };
    },
});

export const createScene = tool({
    summary: "Create a new scene in a chapter",
    parameters: z.object({
        chapterId: z.string().describe("The chapter ID"),
        title: z.string().describe("Scene title"),
        content: z.string().optional().describe("Scene content"),
        summary: z.string().optional().describe("Scene summary"),
        orderIndex: z.number().describe("Order index within chapter"),
    }),
    execute: async ({ chapterId, title, content, summary, orderIndex }) => {
        const [scene] = await db
            .insert(scenes)
            .values({
                id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                chapterId,
                title,
                content: content || "",
                summary: summary || null,
                orderIndex,
                visibility: "private",
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

export const updateScene = tool({
    summary: "Update scene content and metadata",
    parameters: z.object({
        sceneId: z.string().describe("The scene ID to update"),
        updates: z.object({
            title: z.string().optional().describe("Scene title"),
            content: z.string().optional().describe("Scene content"),
            summary: z.string().optional().describe("Scene summary"),
            orderIndex: z.number().optional().describe("Order index"),
            cyclePhase: z
                .enum([
                    "setup",
                    "adversity",
                    "virtue",
                    "consequence",
                    "transition",
                ])
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
    }),
    execute: async ({ sceneId, updates }) => {
        const [updated] = await db
            .update(scenes)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const deleteScene = tool({
    summary: "Delete a scene",
    parameters: z.object({
        sceneId: z.string().describe("The scene ID to delete"),
    }),
    execute: async ({ sceneId }) => {
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

export const getCharacter = tool({
    summary:
        "Get character details including all personality and arc information",
    parameters: z.object({
        characterId: z.string().describe("The character ID to retrieve"),
    }),
    execute: async ({ characterId }) => {
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
                archetype: character.archetype,
                summary: character.summary,
                storyline: character.storyline,
                coreTrait: character.coreTrait,
                internalFlaw: character.internalFlaw,
                externalGoal: character.externalGoal,
                personality: character.personality,
                backstory: character.backstory,
                motivations: character.motivations,
                imageUrl: character.imageUrl,
                createdAt: character.createdAt,
                updatedAt: character.updatedAt,
            },
        };
    },
});

export const createCharacter = tool({
    summary: "Create a new character in a story",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        name: z.string().describe("Character name"),
        isMain: z.boolean().optional().describe("Is this a main character?"),
        role: z.string().optional().describe("Character role"),
        summary: z.string().optional().describe("Character summary"),
    }),
    execute: async ({ storyId, name, isMain, role, summary }) => {
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

export const updateCharacter = tool({
    summary: "Update character details and personality",
    parameters: z.object({
        characterId: z.string().describe("The character ID to update"),
        updates: z.object({
            name: z.string().optional().describe("Character name"),
            isMain: z.boolean().optional().describe("Is main character"),
            role: z.string().optional().describe("Character role"),
            archetype: z.string().optional().describe("Character archetype"),
            summary: z.string().optional().describe("Character summary"),
            storyline: z.string().optional().describe("Character storyline"),
            coreTrait: z.string().optional().describe("Core moral virtue"),
            internalFlaw: z.string().optional().describe("Internal flaw"),
            externalGoal: z.string().optional().describe("External goal"),
        }),
    }),
    execute: async ({ characterId, updates }) => {
        const [updated] = await db
            .update(characters)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const deleteCharacter = tool({
    summary: "Delete a character",
    parameters: z.object({
        characterId: z.string().describe("The character ID to delete"),
    }),
    execute: async ({ characterId }) => {
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

export const getSetting = tool({
    summary:
        "Get setting details including mood, sensory details, and visual style",
    parameters: z.object({
        settingId: z.string().describe("The setting ID to retrieve"),
    }),
    execute: async ({ settingId }) => {
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
                summary: setting.description,
                mood: setting.mood,
                sensory: setting.sensory,
                architecturalStyle: setting.architecturalStyle,
                symbolicMeaning: setting.symbolicMeaning,
                emotionalResonance: setting.emotionalResonance,
                imageUrl: setting.imageUrl,
                createdAt: setting.createdAt,
                updatedAt: setting.updatedAt,
            },
        };
    },
});

export const createSetting = tool({
    summary: "Create a new setting in a story",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        name: z.string().describe("Setting name"),
        summary: z.string().optional().describe("Setting description"),
        mood: z.string().optional().describe("Setting mood"),
    }),
    execute: async ({ storyId, name, description, mood }) => {
        const [setting] = await db
            .insert(settings)
            .values({
                id: `setting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                storyId,
                name,
                summary: description || null,
                mood: mood || null,
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

export const updateSetting = tool({
    summary: "Update setting details",
    parameters: z.object({
        settingId: z.string().describe("The setting ID to update"),
        updates: z.object({
            name: z.string().optional().describe("Setting name"),
            summary: z.string().optional().describe("Setting description"),
            mood: z.string().optional().describe("Setting mood"),
            architecturalStyle: z
                .string()
                .optional()
                .describe("Architectural style"),
            symbolicMeaning: z.string().optional().describe("Symbolic meaning"),
            emotionalResonance: z
                .string()
                .optional()
                .describe("Emotional resonance"),
        }),
    }),
    execute: async ({ settingId, updates }) => {
        const [updated] = await db
            .update(settings)
            .set({
                ...updates,
                updatedAt: new Date(),
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

export const deleteSetting = tool({
    summary: "Delete a setting",
    parameters: z.object({
        settingId: z.string().describe("The setting ID to delete"),
    }),
    execute: async ({ settingId }) => {
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
