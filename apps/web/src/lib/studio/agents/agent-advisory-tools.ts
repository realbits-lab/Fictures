import { tool } from "ai";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
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
// ADVISORY TOOLS
// Prerequisites checking and validation
// ==============================================================================

export const checkPrerequisites = tool({
    summary: "Check if prerequisites are met for a specific generation phase",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        targetPhase: z
            .enum([
                "story-summary",
                "characters",
                "settings",
                "parts",
                "chapters",
                "scene-summaries",
                "scene-content",
                "evaluation",
                "images",
            ])
            .describe("The phase to check prerequisites for"),
    }),
    execute: async ({
        storyId,
        targetPhase,
    }: {
        storyId: string;
        targetPhase: string;
    }) => {
        // Get story data
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        if (!story) {
            return {
                success: false,
                error: "Story not found",
                prerequisitesMet: false,
            };
        }

        let prerequisitesMet = true;
        const missingPrerequisites: string[] = [];
        const suggestions: string[] = [];

        // Check prerequisites based on target phase
        switch (targetPhase) {
            case "story-summary":
                // Always allowed - this is the first phase
                prerequisitesMet = true;
                suggestions.push(
                    "Provide a story concept with genre, themes, and tone",
                );
                break;

            case "characters":
                // Requires story summary
                if (!story.summary) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("Story summary is required");
                    suggestions.push("Generate story summary first");
                }
                break;

            case "settings":
                // Requires story summary
                if (!story.summary) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("Story summary is required");
                    suggestions.push("Generate story summary first");
                }
                break;

            case "parts": {
                // Requires story summary, characters, settings
                if (!story.summary) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("Story summary is required");
                }

                const [characterCount] = await db
                    .select({ count: count() })
                    .from(characters)
                    .where(eq(characters.storyId, storyId));

                if (characterCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push(
                        "At least one character is required",
                    );
                    suggestions.push("Generate characters first");
                }

                const [settingCount] = await db
                    .select({ count: count() })
                    .from(settings)
                    .where(eq(settings.storyId, storyId));

                if (settingCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push(
                        "At least one setting is required",
                    );
                    suggestions.push("Generate settings first");
                }
                break;
            }

            case "chapters": {
                // Requires parts
                const [partCount] = await db
                    .select({ count: count() })
                    .from(parts)
                    .where(eq(parts.storyId, storyId));

                if (partCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("At least one part is required");
                    suggestions.push("Generate parts first");
                }
                break;
            }

            case "scene-summaries": {
                // Requires chapters
                const [chapterCount] = await db
                    .select({ count: count() })
                    .from(chapters)
                    .where(eq(chapters.storyId, storyId));

                if (chapterCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push(
                        "At least one chapter is required",
                    );
                    suggestions.push("Generate chapters first");
                }
                break;
            }

            case "scene-content": {
                // Requires scene summaries
                const [sceneCount] = await db
                    .select({ count: count() })
                    .from(scenes)
                    .where(eq(scenes.chapterId, storyId)); // Note: Need to join with chapters

                if (sceneCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push(
                        "At least one scene summary is required",
                    );
                    suggestions.push("Generate scene summaries first");
                }
                break;
            }

            case "evaluation": {
                // Requires scene content
                const [contentSceneCount] = await db
                    .select({ count: count() })
                    .from(scenes)
                    .where(eq(scenes.chapterId, storyId));

                if (contentSceneCount.count === 0) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("Scene content is required");
                    suggestions.push("Generate scene content first");
                }
                break;
            }

            case "images":
                // Can be done at any time after story summary
                if (!story.summary) {
                    prerequisitesMet = false;
                    missingPrerequisites.push("Story summary is required");
                    suggestions.push("Generate story summary first");
                }
                break;
        }

        return {
            success: true,
            prerequisitesMet,
            missingPrerequisites,
            suggestions,
            currentPhase: targetPhase,
            message: prerequisitesMet
                ? `Ready to proceed with ${targetPhase} generation`
                : `Missing prerequisites: ${missingPrerequisites.join(", ")}`,
        };
    },
});

export const validateStoryStructure = tool({
    summary: "Validate story structure integrity and completeness",
    parameters: z.object({
        storyId: z.string().describe("The story ID to validate"),
    }),
    execute: async ({ storyId }) => {
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        if (!story) {
            return {
                success: false,
                error: "Story not found",
            };
        }

        // Count all entities
        const [characterCount] = await db
            .select({ count: count() })
            .from(characters)
            .where(eq(characters.storyId, storyId));

        const [settingCount] = await db
            .select({ count: count() })
            .from(settings)
            .where(eq(settings.storyId, storyId));

        const [partCount] = await db
            .select({ count: count() })
            .from(parts)
            .where(eq(parts.storyId, storyId));

        const [chapterCount] = await db
            .select({ count: count() })
            .from(chapters)
            .where(eq(chapters.storyId, storyId));

        // Count scenes by joining with chapters
        const chaptersList = await db
            .select({ id: chapters.id })
            .from(chapters)
            .where(eq(chapters.storyId, storyId));

        let totalSceneCount = 0;
        for (const chapter of chaptersList) {
            const [sceneCount] = await db
                .select({ count: count() })
                .from(scenes)
                .where(eq(scenes.chapterId, chapter.id));
            totalSceneCount += sceneCount.count;
        }

        const issues: string[] = [];
        const warnings: string[] = [];

        // Validate structure
        if (!story.summary) {
            issues.push("Story is missing summary");
        }

        if (characterCount.count === 0) {
            warnings.push("No characters defined");
        }

        if (settingCount.count === 0) {
            warnings.push("No settings defined");
        }

        if (partCount.count === 0) {
            warnings.push("No parts defined");
        }

        if (chapterCount.count === 0) {
            warnings.push("No chapters defined");
        }

        if (totalSceneCount === 0) {
            warnings.push("No scenes defined");
        }

        const isValid = issues.length === 0;

        return {
            success: true,
            isValid,
            issues,
            warnings,
            structure: {
                hasStorySummary: !!story.summary,
                characterCount: characterCount.count,
                settingCount: settingCount.count,
                partCount: partCount.count,
                chapterCount: chapterCount.count,
                sceneCount: totalSceneCount,
            },
            message: isValid
                ? "Story structure is valid"
                : `Story structure has ${issues.length} issue(s)`,
        };
    },
});

export const suggestNextPhase = tool({
    summary: "Suggest the next logical phase based on current story state",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
    }),
    execute: async ({ storyId }) => {
        const [story] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, storyId))
            .limit(1);

        if (!story) {
            return {
                success: false,
                error: "Story not found",
            };
        }

        // Check completion status of each phase
        const hasStorySummary = !!story.summary;

        const [characterCount] = await db
            .select({ count: count() })
            .from(characters)
            .where(eq(characters.storyId, storyId));
        const hasCharacters = characterCount.count > 0;

        const [settingCount] = await db
            .select({ count: count() })
            .from(settings)
            .where(eq(settings.storyId, storyId));
        const hasSettings = settingCount.count > 0;

        const [partCount] = await db
            .select({ count: count() })
            .from(parts)
            .where(eq(parts.storyId, storyId));
        const hasParts = partCount.count > 0;

        const [chapterCount] = await db
            .select({ count: count() })
            .from(chapters)
            .where(eq(chapters.storyId, storyId));
        const hasChapters = chapterCount.count > 0;

        const chaptersList = await db
            .select({ id: chapters.id })
            .from(chapters)
            .where(eq(chapters.storyId, storyId));

        let totalSceneCount = 0;
        for (const chapter of chaptersList) {
            const [sceneCount] = await db
                .select({ count: count() })
                .from(scenes)
                .where(eq(scenes.chapterId, chapter.id));
            totalSceneCount += sceneCount.count;
        }
        const hasScenes = totalSceneCount > 0;

        // Determine next phase
        let nextPhase: string;
        let reason: string;

        if (!hasStorySummary) {
            nextPhase = "story-summary";
            reason = "Story needs a summary to begin generation";
        } else if (!hasCharacters) {
            nextPhase = "characters";
            reason =
                "Story summary is ready - generate character profiles next";
        } else if (!hasSettings) {
            nextPhase = "settings";
            reason = "Characters created - generate story settings next";
        } else if (!hasParts) {
            nextPhase = "parts";
            reason =
                "Foundation is ready - generate story parts structure next";
        } else if (!hasChapters) {
            nextPhase = "chapters";
            reason = "Parts created - generate chapter outlines next";
        } else if (!hasScenes) {
            nextPhase = "scene-summaries";
            reason = "Chapters created - generate scene summaries next";
        } else {
            nextPhase = "scene-content";
            reason =
                "Scene summaries created - generate full scene content next";
        }

        return {
            success: true,
            nextPhase,
            reason,
            completedPhases: {
                "story-summary": hasStorySummary,
                characters: hasCharacters,
                settings: hasSettings,
                parts: hasParts,
                chapters: hasChapters,
                "scene-summaries": hasScenes,
                "scene-content": hasScenes, // Simplified check
            },
        };
    },
});

// ==============================================================================
// COMBINED ADVISORY TOOLS EXPORT
// ==============================================================================

export const studioAgentAdvisoryTools = {
    checkPrerequisites,
    validateStoryStructure,
    suggestNextPhase,
};
