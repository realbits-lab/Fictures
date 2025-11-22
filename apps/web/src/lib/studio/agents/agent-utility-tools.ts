import { tool } from "ai";

// Type helper for tool definitions to work around TypeScript overload issues
const createTool = tool as any;

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
    getStudioAgentChat,
    updateStudioAgentChatPhase,
} from "@/lib/db/studio-agent-operations";
import { apiKeys } from "@/lib/schemas/database";

// ==============================================================================
// UTILITY TOOLS
// API key validation and progress tracking
// ==============================================================================

const validateApiKeySchema = z.object({
    userId: z.string().describe("The user ID"),
    requiredScopes: z
        .array(z.string())
        .optional()
        .describe('Required scopes (e.g., ["ai:use", "stories:write"])'),
});

export const validateApiKey = createTool({
    summary: "Validate user API key for Studio Agent operations",
    parameters: validateApiKeySchema,
    execute: async ({
        userId,
        requiredScopes = [],
    }: z.infer<typeof validateApiKeySchema>) => {
        // Get user's API keys
        const userKeys = await db
            .select()
            .from(apiKeys)
            .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)));

        if (userKeys.length === 0) {
            return {
                success: false,
                hasValidKey: false,
                error: "No active API key found",
                message:
                    "Please create an API key in Settings with required scopes: " +
                    requiredScopes.join(", "),
            };
        }

        // Check if any key has required scopes
        let hasValidKey = false;
        let validKey = null;

        for (const key of userKeys) {
            const keyScopes = key.scopes as string[];
            const hasAllScopes = requiredScopes.every((scope) =>
                keyScopes.includes(scope),
            );

            if (hasAllScopes) {
                hasValidKey = true;
                validKey = key;
                break;
            }
        }

        if (!hasValidKey) {
            return {
                success: false,
                hasValidKey: false,
                error: "API key missing required scopes",
                message: `Your API key needs these scopes: ${requiredScopes.join(", ")}. Please update your key in Settings.`,
                availableScopes: userKeys[0]?.scopes,
                requiredScopes,
            };
        }

        return {
            success: true,
            hasValidKey: true,
            message: "API key is valid",
            keyName: validKey?.name,
            scopes: validKey?.scopes,
        };
    },
});

const updatePhaseProgressSchema = z.object({
    chatId: z.string().describe("The chat session ID"),
    phase: z
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
        .describe("The current phase"),
    completed: z.boolean().describe("Whether the phase is completed"),
    progressPercent: z
        .number()
        .optional()
        .describe("Progress percentage (0-100) within the phase"),
});

export const updatePhaseProgress = createTool({
    summary: "Update story generation phase progress in chat session",
    parameters: updatePhaseProgressSchema,
    execute: async ({
        chatId,
        phase,
        completed,
        progressPercent,
    }: z.infer<typeof updatePhaseProgressSchema>) => {
        try {
            // Update chat phase
            await updateStudioAgentChatPhase(chatId, phase, completed);

            // Get updated chat to return current state
            const chat = await getStudioAgentChat(chatId);

            if (!chat) {
                return {
                    success: false,
                    error: "Chat session not found",
                };
            }

            const phaseOrder = [
                "story-summary",
                "characters",
                "settings",
                "parts",
                "chapters",
                "scene-summaries",
                "scene-content",
                "evaluation",
                "images",
            ];

            const completedPhases =
                ((chat.context as any)?.completedPhases as string[]) || [];
            const currentPhaseIndex = phaseOrder.indexOf(
                (chat.context as any)?.currentPhase || "story-summary",
            );
            const totalPhases = phaseOrder.length;
            const overallProgress = Math.floor(
                (completedPhases.length / totalPhases) * 100,
            );

            return {
                success: true,
                message: completed
                    ? `Phase ${phase} completed`
                    : `Phase ${phase} in progress`,
                currentPhase:
                    (chat.context as any)?.currentPhase || "story-summary",
                completedPhases: completedPhases,
                overallProgress,
                nextPhase:
                    currentPhaseIndex < totalPhases - 1
                        ? phaseOrder[currentPhaseIndex + 1]
                        : null,
            };
        } catch (error) {
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Failed to update phase progress",
            };
        }
    },
});

const getGenerationProgressSchema = z.object({
    chatId: z.string().describe("The chat session ID"),
});

export const getGenerationProgress = createTool({
    summary: "Get current story generation progress and phase status",
    parameters: getGenerationProgressSchema,
    execute: async ({
        chatId,
    }: z.infer<typeof getGenerationProgressSchema>) => {
        const chat = await getStudioAgentChat(chatId);

        if (!chat) {
            return {
                success: false,
                error: "Chat session not found",
            };
        }

        const phaseOrder = [
            "story-summary",
            "characters",
            "settings",
            "parts",
            "chapters",
            "scene-summaries",
            "scene-content",
            "evaluation",
            "images",
        ];

        const completedPhases =
            ((chat.context as any)?.completedPhases as string[]) || [];
        const currentPhase =
            (chat.context as any)?.currentPhase || "story-summary";
        const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
        const totalPhases = phaseOrder.length;
        const overallProgress = Math.floor(
            (completedPhases.length / totalPhases) * 100,
        );

        // Estimate remaining time (rough estimate: 5-15 minutes per phase)
        const remainingPhases = totalPhases - completedPhases.length;
        const estimatedMinutesMin = remainingPhases * 5;
        const estimatedMinutesMax = remainingPhases * 15;

        return {
            success: true,
            currentPhase,
            completedPhases,
            overallProgress,
            phaseProgress: {
                current: currentPhaseIndex + 1,
                total: totalPhases,
                remaining: remainingPhases,
            },
            estimatedTimeRemaining: {
                min: estimatedMinutesMin,
                max: estimatedMinutesMax,
                message: `${estimatedMinutesMin}-${estimatedMinutesMax} minutes`,
            },
            phaseStatus: phaseOrder.map((phase) => ({
                phase,
                status: completedPhases.includes(phase)
                    ? "completed"
                    : phase === currentPhase
                      ? "in-progress"
                      : "pending",
            })),
        };
    },
});

// ==============================================================================
// COMBINED UTILITY TOOLS EXPORT
// ==============================================================================

export const studioAgentUtilityTools = {
    validateApiKey,
    updatePhaseProgress,
    getGenerationProgress,
};
