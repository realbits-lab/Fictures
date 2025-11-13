import { tool } from "ai";
import { z } from "zod";

// ==============================================================================
// GENERATION TOOLS
// Integration with existing Novel Generation API endpoints
// ==============================================================================

export const generateStorySummary = tool({
    summary: "Generate initial story summary from user concept (Phase 1 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID to generate summary for"),
        userPrompt: z.string().describe("User story concept, genre, themes"),
    }),
    execute: async ({ storyId, userPrompt }) => {
        // Call existing generation API
        const requestBody: {
            storyId: string;
            concept: string;
        } = {
            storyId,
            concept: userPrompt,
        };

        const response = await fetch("/api/studio/stories/story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Story summary generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: "Story summary generated successfully",
            summary: data.summary,
            genre: data.genre,
            tone: data.tone,
            moralFramework: data.moralFramework,
        };
    },
});

export const generateCharacters = tool({
    summary: "Generate character profiles with AI portraits (Phase 2 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
    }),
    execute: async ({ storyId }) => {
        const requestBody: {
            storyId: string;
        } = {
            storyId,
        };

        const response = await fetch("/api/studio/characters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Character generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Generated ${data.characters?.length || 0} characters`,
            characters: data.characters,
        };
    },
});

export const generateSettings = tool({
    summary:
        "Generate story locations/settings with environment images (Phase 3 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
    }),
    execute: async ({ storyId }) => {
        const requestBody: {
            storyId: string;
        } = {
            storyId,
        };

        const response = await fetch("/api/studio/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Settings generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Generated ${data.settings?.length || 0} settings`,
            settings: data.settings,
        };
    },
});

export const generateParts = tool({
    summary: "Generate story parts/acts structure (Phase 4 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
    }),
    execute: async ({ storyId }) => {
        const requestBody: {
            storyId: string;
        } = {
            storyId,
        };

        const response = await fetch("/api/studio/parts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Parts generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Generated ${data.parts?.length || 0} parts`,
            parts: data.parts,
        };
    },
});

export const generateChapters = tool({
    summary: "Generate chapters with outlines (Phase 5 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        partId: z
            .string()
            .optional()
            .describe("Optional: generate chapters for specific part"),
    }),
    execute: async ({ storyId, partId }) => {
        const requestBody: {
            storyId: string;
            partId?: string;
        } = {
            storyId,
            partId,
        };

        const response = await fetch("/api/studio/chapters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Chapters generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Generated ${data.chapters?.length || 0} chapters`,
            chapters: data.chapters,
        };
    },
});

export const generateSceneSummaries = tool({
    summary: "Generate scene summaries/outlines (Phase 6 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        chapterId: z
            .string()
            .optional()
            .describe("Optional: generate scenes for specific chapter"),
    }),
    execute: async ({ storyId, chapterId }) => {
        const requestBody: {
            storyId: string;
            chapterId?: string;
        } = {
            storyId,
            chapterId,
        };

        const response = await fetch("/api/studio/scene-summaries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Scene summaries generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Generated ${data.scenes?.length || 0} scene summaries`,
            scenes: data.scenes,
        };
    },
});

export const generateSceneContent = tool({
    summary: "Generate full scene prose content (Phase 7 of 9)",
    parameters: z.object({
        sceneId: z.string().describe("The scene ID to generate content for"),
    }),
    execute: async ({ sceneId }) => {
        const requestBody: {
            sceneId: string;
        } = {
            sceneId,
        };

        const response = await fetch("/api/studio/scene-content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Scene content generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: "Scene content generated successfully",
            content: data.content,
            wordCount: data.wordCount,
        };
    },
});

export const improveScene = tool({
    summary:
        "Improve scene quality using Architectonics of Engagement (Phase 8 of 9)",
    parameters: z.object({
        sceneId: z.string().describe("The scene ID to improve"),
    }),
    execute: async ({ sceneId }) => {
        const requestBody: {
            sceneId: string;
        } = {
            sceneId,
        };

        const response = await fetch("/api/studio/stories/scene-improvement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Scene improvement failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: `Scene improved - Score: ${data.score}/4.0`,
            score: data.score,
            categories: data.categories,
            feedback: data.feedback,
            passesThreshold: data.score >= 3.0,
        };
    },
});

export const generateImages = tool({
    summary:
        "Generate images for story elements using Gemini 2.5 Flash (Phase 9 of 9)",
    parameters: z.object({
        storyId: z.string().describe("The story ID"),
        imageType: z
            .enum(["story", "character", "setting", "scene"])
            .describe("Type of image to generate"),
        entityId: z
            .string()
            .optional()
            .describe(
                "Optional: specific entity ID for character/setting/scene",
            ),
    }),
    execute: async ({ storyId, imageType, entityId }) => {
        const requestBody: {
            storyId: string;
            imageType: "story" | "character" | "setting" | "scene";
            entityId?: string;
        } = {
            storyId,
            imageType,
            entityId,
        };

        const response = await fetch("/api/studio/images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            return {
                success: false,
                error: "Image generation failed",
            };
        }

        const data = await response.json();

        return {
            success: true,
            message: "Images generated successfully",
            images: data.images,
            optimizedVariants: data.optimizedVariants,
        };
    },
});

// ==============================================================================
// COMBINED GENERATION TOOLS EXPORT
// ==============================================================================

export const studioAgentGenerationTools = {
    generateStorySummary,
    generateCharacters,
    generateSettings,
    generateParts,
    generateChapters,
    generateSceneSummaries,
    generateSceneContent,
    improveScene,
    generateImages,
};
