import { streamText, convertToCoreMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import {
  createStudioAgentChat,
  getStudioAgentChat,
  getStudioAgentMessages,
  saveStudioAgentMessage,
  saveToolExecution,
  updateToolExecution,
} from '@/lib/db/studio-agent-operations';
import { studioAgentCrudTools } from '@/lib/studio/agent-crud-tools';

export const maxDuration = 60; // Allow longer execution for multi-step reasoning
export const runtime = 'nodejs'; // Use Node.js runtime for database operations

const EDITING_AGENT_SYSTEM_PROMPT = `You are an Editing Agent for Fictures, an AI-powered story writing platform.

Your role is to help writers manage and edit their story content through database operations.

REASONING PROCESS:
1. Understand the user's request for story management or editing
2. Determine which database operations are needed
3. Use available CRUD tools to read, create, update, or delete story elements
4. Provide clear feedback on the operations performed
5. Explain your reasoning at each step

AVAILABLE TOOLS:

**Story Tools:**
- getStory: Get complete story details
- updateStory: Update story metadata (title, genre, status, summary, tone, moralFramework)

**Part Tools:**
- getPart: Get part details
- createPart: Create a new part in a story
- updatePart: Update part metadata
- deletePart: Delete a part (cascade delete chapters and scenes)

**Chapter Tools:**
- getChapter: Get chapter details
- createChapter: Create a new chapter in a story or part
- updateChapter: Update chapter metadata
- deleteChapter: Delete a chapter (cascade delete scenes)

**Scene Tools:**
- getScene: Get scene details including content
- createScene: Create a new scene in a chapter
- updateScene: Update scene content and metadata
- deleteScene: Delete a scene

**Character Tools:**
- getCharacter: Get character details
- createCharacter: Create a new character in a story
- updateCharacter: Update character details and personality
- deleteCharacter: Delete a character

**Setting Tools:**
- getSetting: Get setting details
- createSetting: Create a new setting in a story
- updateSetting: Update setting details
- deleteSetting: Delete a setting

GUIDELINES:
- Always explain your reasoning before using tools
- Show your chain of thought to make the process transparent
- When reading data, display the relevant fields clearly
- When updating data, confirm what was changed
- When creating data, provide the new entity's ID and key details
- When deleting data, warn about cascade effects
- Respect the user's creative vision while offering suggestions
- Be precise and accurate with IDs and data`;

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, storyContext } = await request.json();

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id as string;

    // Get or create agent chat
    let chat = chatId ? await getStudioAgentChat(chatId) : null;
    if (!chat) {
      chat = await createStudioAgentChat({
        userId,
        storyId: storyContext?.storyId || null,
        agentType: 'editing',
        title: message.content.slice(0, 50) + '...',
        context: storyContext,
      });
    }

    // Load existing messages
    const existingMessages = await getStudioAgentMessages(chat.id);

    // Convert to AI SDK format
    const uiMessages = existingMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      parts: msg.parts as any,
      createdAt: msg.createdAt,
    }));

    // Add new user message
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user' as const,
      content: message.content,
      createdAt: new Date(),
    };

    const allMessages = [...uiMessages, userMessage];

    // Save user message
    const savedUserMessage = await saveStudioAgentMessage({
      chatId: chat.id,
      role: 'user',
      content: message.content,
      parts: [{ type: 'text', text: message.content }] as any,
    });

    // Stream response with multi-step reasoning
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: EDITING_AGENT_SYSTEM_PROMPT,
      messages: convertToCoreMessages(allMessages),
      tools: studioAgentCrudTools,
      maxSteps: 10, // Allow up to 10 reasoning steps

      // Log tool usage for transparency
      onToolCall: async ({ toolCall }) => {
        console.log(`[Agent] Tool called: ${toolCall.toolName}`);
        console.log(`[Agent] Tool args:`, toolCall.args);

        // Save tool execution record
        await saveToolExecution({
          messageId: savedUserMessage.id,
          toolName: toolCall.toolName,
          toolInput: toolCall.args as any,
          status: 'executing',
        });
      },

      onFinish: async ({ text, toolCalls, toolResults, finishReason, usage }) => {
        console.log(`[Agent] Finished. Reason: ${finishReason}`);
        console.log(`[Agent] Usage:`, usage);

        // Save assistant message with all parts
        const parts = [];

        // Add text parts
        if (text) {
          parts.push({ type: 'text', text });
        }

        // Add tool call parts
        toolCalls?.forEach((tc) => {
          parts.push({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          });
        });

        // Add tool result parts
        toolResults?.forEach((tr) => {
          parts.push({
            type: 'tool-result',
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result,
          });

          // Update tool execution record
          updateToolExecution({
            messageId: savedUserMessage.id,
            toolName: tr.toolName,
            toolOutput: tr.result,
            status: 'completed',
          });
        });

        await saveStudioAgentMessage({
          chatId: chat!.id,
          role: 'assistant',
          content: text,
          parts: parts as any,
          reasoning: text, // Store the agent's reasoning
        });
      },
    });

    return result.toDataStreamResponse({
      headers: {
        'X-Chat-Id': chat.id,
      },
    });
  } catch (error) {
    console.error('Studio Agent API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
