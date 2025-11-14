import { and, desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
    type NewStudioAgentChat,
    type NewStudioAgentMessage,
    type NewStudioAgentToolExecution,
    type StudioAgentChat,
    type StudioAgentMessage,
    studioAgentChats,
    studioAgentMessages,
    studioAgentToolExecutions,
} from "@/lib/schemas/database";

// ==============================================================================
// STUDIO AGENT CHAT OPERATIONS
// ==============================================================================

/**
 * Create a new studio agent chat session
 */
export async function createStudioAgentChat(
    data: NewStudioAgentChat,
): Promise<StudioAgentChat> {
    const [chat] = await db.insert(studioAgentChats).values(data).returning();
    return chat;
}

/**
 * Get a studio agent chat by ID
 */
export async function getStudioAgentChat(
    chatId: string,
): Promise<StudioAgentChat | null> {
    const [chat] = await db
        .select()
        .from(studioAgentChats)
        .where(eq(studioAgentChats.id, chatId))
        .limit(1);
    return chat || null;
}

/**
 * Get all studio agent chats for a user
 */
export async function getStudioAgentChatsByUser(
    userId: string,
    storyId?: string,
): Promise<StudioAgentChat[]> {
    const whereCondition = storyId
        ? and(
              eq(studioAgentChats.userId, userId),
              eq(studioAgentChats.storyId, storyId),
          )
        : eq(studioAgentChats.userId, userId);

    return db
        .select()
        .from(studioAgentChats)
        .where(whereCondition)
        .orderBy(desc(studioAgentChats.updatedAt));
}

/**
 * Update story generation phase tracking
 */
export async function updateStudioAgentChatPhase(
    chatId: string,
    phase: string,
    completed: boolean = false,
): Promise<void> {
    const chat = await getStudioAgentChat(chatId);
    if (!chat) throw new Error("Chat not found");

    const context = (chat.context as any) || {};
    const completedPhases = completed
        ? [...((context.completedPhases as string[]) || []), phase]
        : (context.completedPhases as string[]) || [];

    // Determine next phase
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
    const currentIndex = phaseOrder.indexOf(phase);
    const nextPhase =
        completed && currentIndex < phaseOrder.length - 1
            ? phaseOrder[currentIndex + 1]
            : phase;

    await db
        .update(studioAgentChats)
        .set({
            context: {
                ...context,
                currentPhase: nextPhase,
                completedPhases: completedPhases,
            } as any,
            updatedAt: new Date(),
        })
        .where(eq(studioAgentChats.id, chatId));
}

/**
 * Get user studio chats with limit
 */
export async function getUserStudioChats(userId: string, limit: number = 50) {
    const chats = await db
        .select()
        .from(studioAgentChats)
        .where(eq(studioAgentChats.userId, userId))
        .orderBy(desc(studioAgentChats.updatedAt))
        .limit(limit);

    return chats;
}

// ==============================================================================
// STUDIO AGENT MESSAGE OPERATIONS
// ==============================================================================

/**
 * Save a new studio agent message
 */
export async function saveStudioAgentMessage(
    data: NewStudioAgentMessage,
): Promise<StudioAgentMessage> {
    const [message] = await db
        .insert(studioAgentMessages)
        .values(data)
        .returning();
    return message;
}

/**
 * Get all messages for a chat
 */
export async function getStudioAgentMessages(
    chatId: string,
): Promise<StudioAgentMessage[]> {
    return db
        .select()
        .from(studioAgentMessages)
        .where(eq(studioAgentMessages.chatId, chatId))
        .orderBy(studioAgentMessages.createdAt);
}

/**
 * Get messages with pagination
 */
export async function getStudioAgentMessagesPaginated(
    chatId: string,
    limit: number = 50,
    cursor?: string,
) {
    const query = db
        .select()
        .from(studioAgentMessages)
        .where(eq(studioAgentMessages.chatId, chatId))
        .orderBy(desc(studioAgentMessages.createdAt))
        .limit(limit);

    const messages = await query;

    return {
        messages: messages.reverse(),
        nextCursor:
            messages.length === limit
                ? messages[0]?.createdAt.toISOString()
                : null,
        hasMore: messages.length === limit,
    };
}

// ==============================================================================
// STUDIO AGENT TOOL EXECUTION OPERATIONS
// ==============================================================================

/**
 * Save a tool execution record
 */
export async function saveToolExecution(
    data: NewStudioAgentToolExecution,
): Promise<void> {
    await db.insert(studioAgentToolExecutions).values(data);
}

/**
 * Update a tool execution with results
 */
export async function updateToolExecution(params: {
    messageId: string;
    toolName: string;
    toolOutput: any;
    status: "completed" | "error";
    error?: string;
}): Promise<void> {
    const executionTimeMs = Date.now();

    await db
        .update(studioAgentToolExecutions)
        .set({
            toolOutput: params.toolOutput,
            status: params.status,
            error: params.error,
            completedAt: new Date(),
            executionTimeMs,
        })
        .where(
            and(
                eq(studioAgentToolExecutions.messageId, params.messageId),
                eq(studioAgentToolExecutions.toolName, params.toolName),
            ),
        );
}

/**
 * Get tool executions for a message
 */
export async function getToolExecutions(messageId: string) {
    return db
        .select()
        .from(studioAgentToolExecutions)
        .where(eq(studioAgentToolExecutions.messageId, messageId))
        .orderBy(studioAgentToolExecutions.createdAt);
}
