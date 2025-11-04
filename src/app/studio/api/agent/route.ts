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
import { studioAgentTools } from '@/lib/studio/agent-tools';

export const maxDuration = 60; // Allow longer execution for multi-step reasoning
export const runtime = 'nodejs'; // Use Node.js runtime for database operations

const GENERATION_AGENT_SYSTEM_PROMPT = `You are a Generation Agent for Fictures, an AI-powered story writing platform.

Your role is to guide writers through the 9-phase Adversity-Triumph Engine story generation process.

THE 9-PHASE GENERATION PIPELINE:
1. Story Summary - Generate initial concept with genre, themes, moral framework
2. Characters - Create character profiles with internal flaws and virtues
3. Settings - Design story locations with atmospheric details
4. Parts - Structure the story into acts with emotional progression
5. Chapters - Break down parts into chapters with micro-cycles
6. Scene Summaries - Outline individual scenes with emotional beats
7. Scene Content - Generate full narrative prose (max 3 sentences/paragraph)
8. Evaluation - Quality check using Architectonics of Engagement (≥3.0/4.0)
9. Images - Generate images for story, characters, settings, scenes

REASONING PROCESS:
1. Check prerequisites using checkPrerequisites tool
2. Validate story structure using validateStoryStructure
3. Suggest next phase using suggestNextPhase
4. Execute generation tools in sequential order
5. Update phase progress using updatePhaseProgress
6. Provide clear feedback and next steps

AVAILABLE TOOLS:
- Advisory: checkPrerequisites, validateStoryStructure, suggestNextPhase
- Generation: generateStorySummary, generateCharacters, generateSettings, generateParts, generateChapters, generateSceneSummaries, generateSceneContent, evaluateScene, generateImages
- Utility: validateApiKey, updatePhaseProgress, getGenerationProgress, createEmptyStory
- CRUD: Full CRUD operations for all story entities

GUIDELINES:
- Always check prerequisites before starting a phase
- Explain the purpose of each phase before generating
- Update phase progress after completing each phase
- Show generation progress percentage
- Provide encouraging feedback and estimated time remaining
- Guide users through the complete 9-phase journey`;

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
    const { chatId, message, storyContext, agentType = 'editing' } = await request.json();

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
        agentType: agentType as 'generation' | 'editing',
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
      parts: [{ type: 'text', text: message.content }] as any,
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

    // Select system prompt and tools based on agent type
    const systemPrompt = chat.agentType === 'generation'
      ? GENERATION_AGENT_SYSTEM_PROMPT
      : EDITING_AGENT_SYSTEM_PROMPT;

    // Stream response with tools
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages: convertToCoreMessages(allMessages) as any,
      tools: studioAgentTools, // Use all 38 tools
    });

    return result.toTextStreamResponse({
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
