import { tool } from "ai";

// Type helper for tool definitions to work around TypeScript overload issues
const createTool = tool as any;
import { z } from "zod";

// ==============================================================================
// GENERATION TOOLS
// Integration with existing Novel Generation API endpoints
// ==============================================================================

const generateStorySummarySchema = z.object({
    storyId: z.string().describe("The story ID to generate summary for"),
    userPrompt: z.string().describe("User story concept, genre, themes"),
});

export const generateStorySummary = createTool({
    summary: "Generate initial story summary from user concept (Phase 1 of 9)",
    parameters: generateStorySummarySchema,
    execute: async ({
        storyId,
        userPrompt,
    }: z.infer<typeof generateStorySummarySchema>) => {
        // Call existing generation API
        const requestBody: {
            storyId: string;
            concept: string;
        } = {
            storyId,
            concept: userPrompt,
        };

        const response = await fetch("/api/studio/story", {
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

const generateCharactersSchema = z.object({
    storyId: z.string().describe("The story ID"),
});

export const generateCharacters = createTool({
    summary: "Generate character profiles with AI portraits (Phase 2 of 9)",
    parameters: generateCharactersSchema,
    execute: async ({ storyId }: z.infer<typeof generateCharactersSchema>) => {
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

const generateSettingsSchema = z.object({
    storyId: z.string().describe("The story ID"),
});

export const generateSettings = createTool({
    summary:
        "Generate story locations/settings with environment images (Phase 3 of 9)",
    parameters: generateSettingsSchema,
    execute: async ({ storyId }: z.infer<typeof generateSettingsSchema>) => {
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

const generatePartsSchema = z.object({
    storyId: z.string().describe("The story ID"),
});

export const generateParts = createTool({
    summary: "Generate story parts/acts structure (Phase 4 of 9)",
    parameters: generatePartsSchema,
    execute: async ({ storyId }: z.infer<typeof generatePartsSchema>) => {
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

const generateChaptersSchema = z.object({
    storyId: z.string().describe("The story ID"),
    partId: z
        .string()
        .optional()
        .describe("Optional: generate chapters for specific part"),
});

export const generateChapters = createTool({
    summary: "Generate chapters with outlines (Phase 5 of 9)",
    parameters: generateChaptersSchema,
    execute: async ({
        storyId,
        partId,
    }: z.infer<typeof generateChaptersSchema>) => {
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

const generateSceneSummariesSchema = z.object({
    storyId: z.string().describe("The story ID"),
    chapterId: z
        .string()
        .optional()
        .describe("Optional: generate scenes for specific chapter"),
});

export const generateSceneSummaries = createTool({
    summary: "Generate scene summaries/outlines (Phase 6 of 9)",
    parameters: generateSceneSummariesSchema,
    execute: async ({
        storyId,
        chapterId,
    }: z.infer<typeof generateSceneSummariesSchema>) => {
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

const generateSceneContentSchema = z.object({
    sceneId: z.string().describe("The scene ID to generate content for"),
});

export const generateSceneContent = createTool({
    summary: "Generate full scene prose content (Phase 7 of 9)",
    parameters: generateSceneContentSchema,
    execute: async ({
        sceneId,
    }: z.infer<typeof generateSceneContentSchema>) => {
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

const improveSceneSchema = z.object({
    sceneId: z.string().describe("The scene ID to improve"),
});

export const improveScene = createTool({
    summary:
        "Improve scene quality using Architectonics of Engagement (Phase 8 of 9)",
    parameters: improveSceneSchema,
    execute: async ({ sceneId }: z.infer<typeof improveSceneSchema>) => {
        const requestBody: {
            sceneId: string;
        } = {
            sceneId,
        };

        const response = await fetch("/api/studio/scene-improvement", {
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

const generateImagesSchema = z.object({
    storyId: z.string().describe("The story ID"),
    imageType: z
        .enum(["story", "character", "setting", "scene"])
        .describe("Type of image to generate"),
    entityId: z
        .string()
        .optional()
        .describe("Optional: specific entity ID for character/setting/scene"),
});

export const generateImages = createTool({
    summary:
        "Generate images for story elements using Gemini 2.5 Flash (Phase 9 of 9)",
    parameters: generateImagesSchema,
    execute: async ({
        storyId,
        imageType,
        entityId,
    }: z.infer<typeof generateImagesSchema>) => {
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
