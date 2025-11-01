---
title: "Studio Agent Chat System"
---

# Studio Agent Chat System

This guide explains how to implement an advanced agentic chat system for the Fictures /studio page, combining multi-step reasoning, tool use visualization, and persistent chat history for AI-assisted story generation and editing.

## Overview

The Studio Agent Chat System enables transparent, interactive AI assistance for story creation and editing workflows. Unlike traditional chat interfaces that hide the AI's reasoning process, this system provides real-time visibility into:

- **Multi-step reasoning**: See the agent break down complex tasks into subtasks
- **Tool execution**: Watch tools being called and see their outputs
- **Chain of thought**: Understand the agent's decision-making process
- **Persistent history**: Resume conversations across sessions with full context

### Use Cases

**Generation Agent** (`/studio/new`)
- Assists in creating new stories, chapters, and scenes
- Visible reasoning: "First I'll analyze the genre conventions, then create characters, then outline the plot structure"
- Tools: `generateChapter`, `generateScene`, `generateCharacter`, `analyzeTheme`

**Editing Agent** (`/studio/edit/[storyId]`)
- Helps refine existing story content
- Visible reasoning: "I'll first evaluate pacing issues, then suggest dialogue improvements"
- Tools: `improveDialogue`, `enhancePacing`, `refineDescription`, `evaluateScene`

## Architecture

### Three-Layer System

```
┌─────────────────────────────────────────────────────────────┐
│                  Interactive Frontend                        │
│  • Tool visualization   • Chain of thought display          │
│  • Generative UI        • Streaming progress                │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Real-Time Communication Layer                   │
│  • Server-Sent Events   • Structured data streaming         │
│  • Tool execution sync  • Progress updates                  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agentic Backend                            │
│  • Multi-step reasoning loop  • Tool orchestration          │
│  • MCP integration           • Persistent history (Neon)    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

Extend the existing Neon database with agent-specific tables:

```typescript
// lib/db/studio-agent-schema.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar, index, boolean } from 'drizzle-orm/pg-core';
import { users } from './schema';

export const studioAgentChats = pgTable('studio_agent_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  storyId: uuid('story_id'), // Optional: link to story being worked on
  agentType: varchar('agent_type', { length: 50 }).notNull(), // 'generation' | 'editing'
  title: varchar('title', { length: 255 }).notNull(),
  context: jsonb('context'), // Story context, preferences, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('studio_agent_chats_user_id_idx').on(table.userId),
  storyIdIdx: index('studio_agent_chats_story_id_idx').on(table.storyId),
  agentTypeIdx: index('studio_agent_chats_agent_type_idx').on(table.agentType),
}));

export const studioAgentMessages = pgTable('studio_agent_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => studioAgentChats.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(),
  parts: jsonb('parts'), // AI SDK message parts (text, tool-call, tool-result)
  reasoning: text('reasoning'), // Agent's chain of thought
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index('studio_agent_messages_chat_id_idx').on(table.chatId),
  createdAtIdx: index('studio_agent_messages_created_at_idx').on(table.createdAt),
}));

export const studioAgentToolExecutions = pgTable('studio_agent_tool_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => studioAgentMessages.id, { onDelete: 'cascade' }).notNull(),
  toolName: varchar('tool_name', { length: 100 }).notNull(),
  toolInput: jsonb('tool_input').notNull(),
  toolOutput: jsonb('tool_output'),
  status: varchar('status', { length: 20 }).notNull(), // 'pending' | 'executing' | 'completed' | 'error'
  error: text('error'),
  executionTimeMs: integer('execution_time_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  messageIdIdx: index('studio_agent_tool_executions_message_id_idx').on(table.messageId),
  toolNameIdx: index('studio_agent_tool_executions_tool_name_idx').on(table.toolName),
}));

export type StudioAgentChat = typeof studioAgentChats.$inferSelect;
export type NewStudioAgentChat = typeof studioAgentChats.$inferInsert;
export type StudioAgentMessage = typeof studioAgentMessages.$inferSelect;
export type NewStudioAgentMessage = typeof studioAgentMessages.$inferInsert;
export type StudioAgentToolExecution = typeof studioAgentToolExecutions.$inferSelect;
export type NewStudioAgentToolExecution = typeof studioAgentToolExecutions.$inferInsert;
```

Run migrations:
```bash
dotenv --file .env.local run pnpm db:generate
dotenv --file .env.local run pnpm db:migrate
```

## Backend Implementation

### 1. Studio Agent Tools Definition

Define creative writing tools for generation and editing agents:

```typescript
// lib/studio/agent-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { generateChapterContent } from '@/lib/novels/chapter-generator';
import { generateSceneContent } from '@/lib/novels/scene-generator';
import { evaluateScene } from '@/lib/services/scene-evaluation-loop';

// Generation Tools
export const generationTools = {
  generateChapter: tool({
    description: 'Generate a complete chapter with scenes based on story context and chapter outline',
    parameters: z.object({
      storyId: z.string().describe('The story ID'),
      chapterNumber: z.number().describe('Chapter number in the story'),
      chapterTitle: z.string().describe('Title of the chapter'),
      chapterSummary: z.string().describe('Summary of what happens in the chapter'),
      previousContext: z.string().optional().describe('Context from previous chapters'),
    }),
    execute: async ({ storyId, chapterNumber, chapterTitle, chapterSummary, previousContext }) => {
      const startTime = Date.now();
      const result = await generateChapterContent({
        storyId,
        chapterNumber,
        title: chapterTitle,
        summary: chapterSummary,
        context: previousContext,
      });

      return {
        success: true,
        chapterId: result.id,
        sceneCount: result.scenes.length,
        wordCount: result.wordCount,
        executionTimeMs: Date.now() - startTime,
      };
    },
  }),

  generateScene: tool({
    description: 'Generate a detailed scene with narrative content',
    parameters: z.object({
      chapterId: z.string().describe('The chapter ID'),
      sceneNumber: z.number().describe('Scene number in the chapter'),
      sceneSummary: z.string().describe('Summary of what happens in the scene'),
      characters: z.array(z.string()).describe('Characters present in the scene'),
      setting: z.string().describe('Where the scene takes place'),
    }),
    execute: async ({ chapterId, sceneNumber, sceneSummary, characters, setting }) => {
      const startTime = Date.now();
      const result = await generateSceneContent({
        chapterId,
        sceneNumber,
        summary: sceneSummary,
        characters,
        setting,
      });

      return {
        success: true,
        sceneId: result.id,
        content: result.content,
        wordCount: result.wordCount,
        executionTimeMs: Date.now() - startTime,
      };
    },
  }),

  generateCharacter: tool({
    description: 'Create a detailed character profile with personality, backstory, and arc',
    parameters: z.object({
      storyId: z.string().describe('The story ID'),
      characterName: z.string().describe('Character name'),
      characterRole: z.string().describe('Role in the story (protagonist, antagonist, supporting)'),
      characterTraits: z.array(z.string()).describe('Key personality traits'),
    }),
    execute: async ({ storyId, characterName, characterRole, characterTraits }) => {
      // Implementation using Gemini 2.5 Flash
      return {
        success: true,
        characterId: 'char_123',
        name: characterName,
        role: characterRole,
        profile: {
          traits: characterTraits,
          backstory: '...',
          arc: '...',
        },
      };
    },
  }),
};

// Editing Tools
export const editingTools = {
  evaluateScene: tool({
    description: 'Evaluate a scene using the Architectonics of Engagement framework (Plot, Character, Pacing, Prose, World-Building)',
    parameters: z.object({
      sceneId: z.string().describe('The scene ID to evaluate'),
      sceneContent: z.string().describe('The scene narrative content'),
    }),
    execute: async ({ sceneId, sceneContent }) => {
      const evaluation = await evaluateScene(sceneId, sceneContent);

      return {
        sceneId,
        overallScore: evaluation.overallScore,
        categoryScores: evaluation.categoryScores,
        feedback: evaluation.feedback,
        suggestions: evaluation.improvements,
        passed: evaluation.passed,
      };
    },
  }),

  improveDialogue: tool({
    description: 'Improve dialogue to make it more natural, character-specific, and engaging',
    parameters: z.object({
      originalDialogue: z.string().describe('The dialogue to improve'),
      characterVoice: z.string().describe('Character voice guidelines'),
      context: z.string().describe('Scene context for the dialogue'),
    }),
    execute: async ({ originalDialogue, characterVoice, context }) => {
      // Implementation using Gemini 2.5 Flash
      return {
        originalDialogue,
        improvedDialogue: '...',
        improvements: ['More natural flow', 'Stronger character voice'],
        reasoning: 'The revised dialogue better reflects the character\'s background and emotional state',
      };
    },
  }),

  enhancePacing: tool({
    description: 'Analyze and improve scene pacing (tension, rhythm, momentum)',
    parameters: z.object({
      sceneContent: z.string().describe('The scene content to analyze'),
      desiredPace: z.enum(['fast', 'moderate', 'slow']).describe('Target pacing style'),
    }),
    execute: async ({ sceneContent, desiredPace }) => {
      // Implementation using Gemini 2.5 Flash
      return {
        currentPace: 'moderate',
        targetPace: desiredPace,
        analysis: {
          tensionPoints: ['Opening conflict', 'Mid-scene revelation'],
          rhythmIssues: ['Too many long sentences in action sequence'],
          momentumScore: 3.5,
        },
        suggestions: [
          'Shorten sentences during action sequences',
          'Add a micro-beat of reflection after the revelation',
        ],
      };
    },
  }),

  refineDescription: tool({
    description: 'Enhance descriptive passages with sensory details and precise language',
    parameters: z.object({
      originalDescription: z.string().describe('The description to refine'),
      focus: z.enum(['setting', 'character', 'action']).describe('What is being described'),
      sensoryEmphasis: z.array(z.enum(['sight', 'sound', 'smell', 'touch', 'taste'])).describe('Senses to emphasize'),
    }),
    execute: async ({ originalDescription, focus, sensoryEmphasis }) => {
      // Implementation using Gemini 2.5 Flash
      return {
        originalDescription,
        refinedDescription: '...',
        improvements: [
          'Added olfactory details',
          'More precise visual imagery',
          'Tactile sensations integrated',
        ],
        sensesEngaged: sensoryEmphasis,
      };
    },
  }),
};

// Combine all tools
export const studioAgentTools = {
  ...generationTools,
  ...editingTools,
};
```

### 2. Agentic API Route with Multi-Step Reasoning

```typescript
// app/studio/api/agent/route.ts
import { streamText, stepCountIs, convertToCoreMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { auth } from '@/app/auth';
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
export const runtime = 'edge'; // Edge runtime for optimal performance

const AGENT_SYSTEM_PROMPTS = {
  generation: `You are a Generation Agent for Fictures, an AI-powered story writing platform.

Your role is to help writers create compelling stories using the Adversity-Triumph Engine methodology.

REASONING PROCESS:
1. Understand the user's creative intent
2. Break down the task into logical subtasks
3. Use available tools to generate content
4. Synthesize results into a coherent response
5. Explain your reasoning at each step

AVAILABLE TOOLS:
- generateChapter: Create complete chapters with scenes
- generateScene: Write detailed scene content
- generateCharacter: Develop character profiles

GUIDELINES:
- Always explain your reasoning before using tools
- Show your chain of thought to make the creative process transparent
- Ask for clarification if the request is ambiguous
- Respect the user's creative vision while offering suggestions`,

  editing: `You are an Editing Agent for Fictures, an AI-powered story writing platform.

Your role is to help writers refine and improve their story content.

REASONING PROCESS:
1. Analyze the current content
2. Identify areas for improvement
3. Use evaluation tools to assess quality
4. Apply editing tools to enhance the content
5. Explain your editorial decisions

AVAILABLE TOOLS:
- evaluateScene: Assess scene quality using professional criteria
- improveDialogue: Enhance dialogue naturalness and character voice
- enhancePacing: Optimize narrative rhythm and tension
- refineDescription: Improve sensory details and precision

GUIDELINES:
- Always evaluate before editing
- Explain why you're making specific improvements
- Preserve the author's unique voice
- Provide actionable feedback with examples`,
};

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, agentType = 'generation', storyContext } = await request.json();

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get or create agent chat
    let chat = chatId ? await getStudioAgentChat(chatId) : null;
    if (!chat) {
      chat = await createStudioAgentChat({
        userId: session.user.id,
        agentType,
        title: message.content.slice(0, 50) + '...',
        context: storyContext,
      });
    }

    // Load existing messages
    const existingMessages = await getStudioAgentMessages(chat.id);

    // Convert to AI SDK format
    const uiMessages = existingMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      parts: msg.parts as any,
      createdAt: msg.createdAt,
    }));

    // Add new user message
    const userMessage = {
      id: generateId(),
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
      parts: [{ type: 'text', text: message.content }],
    });

    // Stream response with multi-step reasoning
    const result = await streamText({
      model: google('gemini-2.0-flash-exp'),
      system: AGENT_SYSTEM_PROMPTS[agentType as keyof typeof AGENT_SYSTEM_PROMPTS],
      messages: convertToCoreMessages(allMessages),
      tools: studioAgentTools,
      stopWhen: stepCountIs(10), // Allow up to 10 reasoning steps

      // Log tool usage for transparency
      onToolCall: async ({ toolCall }) => {
        // Save tool execution record
        await saveToolExecution({
          messageId: savedUserMessage.id,
          toolName: toolCall.toolName,
          toolInput: toolCall.args,
          status: 'executing',
        });
      },

      onToolResult: async ({ toolCall, result }) => {
        // Update tool execution record
        await updateToolExecution({
          messageId: savedUserMessage.id,
          toolName: toolCall.toolName,
          toolOutput: result,
          status: 'completed',
        });
      },

      onFinish: async ({ text, toolCalls, toolResults }) => {
        // Save assistant message with all parts
        const parts = [];

        // Add text parts
        if (text) {
          parts.push({ type: 'text', text });
        }

        // Add tool call parts
        toolCalls?.forEach(tc => {
          parts.push({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          });
        });

        // Add tool result parts
        toolResults?.forEach(tr => {
          parts.push({
            type: 'tool-result',
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result,
          });
        });

        await saveStudioAgentMessage({
          chatId: chat.id,
          role: 'assistant',
          content: text,
          parts,
          reasoning: text, // Store the agent's reasoning
        });
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Studio Agent API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 3. MCP Integration for Dynamic Tools

Enable Model Context Protocol for extensible tool discovery:

```typescript
// lib/studio/mcp-integration.ts
import { experimental_createMCPClient } from 'ai';

// Connect to local MCP servers
export async function initializeMCPServers() {
  const clients = [];

  // GitHub MCP server for version control tools
  const githubClient = await experimental_createMCPClient({
    name: 'github',
    transport: {
      type: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      },
    },
  });
  clients.push(githubClient);

  // Custom Fictures MCP server for story-specific tools
  const ficturesClient = await experimental_createMCPClient({
    name: 'fictures',
    transport: {
      type: 'stdio',
      command: 'node',
      args: ['./lib/studio/mcp-server.js'],
    },
  });
  clients.push(ficturesClient);

  return clients;
}

// Discover and merge MCP tools with built-in tools
export async function getMCPTools() {
  const mcpClients = await initializeMCPServers();
  const allTools = {};

  for (const client of mcpClients) {
    const tools = await client.listTools();
    Object.assign(allTools, tools);
  }

  return allTools;
}
```

## Frontend Implementation

### 1. Agent Chat Hook with Tool Visualization

```typescript
// hooks/use-studio-agent-chat.ts
'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import { generateId } from 'ai';

interface UseStudioAgentChatProps {
  chatId?: string;
  agentType: 'generation' | 'editing';
  storyContext?: Record<string, any>;
}

export function useStudioAgentChat({
  chatId,
  agentType,
  storyContext,
}: UseStudioAgentChatProps) {
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const chat = useChat({
    id: chatId || generateId(),
    api: '/studio/api/agent',
    body: {
      agentType,
      storyContext,
    },
    onFinish: () => {
      setActiveTools([]); // Clear active tools when response completes
    },
  });

  // Load chat history on mount
  useEffect(() => {
    if (!chatId || historyLoaded) return;

    async function loadChatHistory() {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/studio/api/agent/${chatId}/messages`);
        if (response.ok) {
          const { messages } = await response.json();
          chat.setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load agent chat history:', error);
      } finally {
        setLoadingHistory(false);
        setHistoryLoaded(true);
      }
    }

    loadChatHistory();
  }, [chatId, historyLoaded]);

  // Track active tools from message parts
  useEffect(() => {
    const activeTool = chat.messages
      .flatMap(m => m.parts || [])
      .filter(p => p.type === 'tool-call' && !p.result)
      .map(p => p.toolName);

    setActiveTools(activeTool);
  }, [chat.messages]);

  return {
    ...chat,
    loadingHistory,
    historyLoaded,
    activeTools,
    agentType,
  };
}
```

### 2. Agent Message Renderer with Tool Visualization

```typescript
// components/studio/agent-message.tsx
'use client';

import { type UIMessage } from 'ai';
import { Message, MessageContent } from '@/components/ui/message';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, Wrench } from 'lucide-react';

interface ToolCallDisplay {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  state: 'loading' | 'success' | 'error';
}

function ToolExecutionCard({ tool }: { tool: ToolCallDisplay }) {
  const icons = {
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <Card className="my-2">
      <CardHeader className="flex flex-row items-center gap-2 py-2">
        {icons[tool.state]}
        <Wrench className="h-4 w-4" />
        <span className="font-mono text-sm">{tool.toolName}</span>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground">Input:</div>
            <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
              {JSON.stringify(tool.args, null, 2)}
            </pre>
          </div>
          {tool.result && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Output:</div>
              <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                {JSON.stringify(tool.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function AgentMessage({ message }: { message: UIMessage }) {
  if (message.role === 'user') {
    return (
      <Message from="user">
        <MessageContent>{message.content}</MessageContent>
      </Message>
    );
  }

  // Parse message parts for assistant messages
  const textParts: string[] = [];
  const toolCalls: ToolCallDisplay[] = [];

  message.parts?.forEach((part, index) => {
    if (part.type === 'text') {
      textParts.push(part.text);
    } else if (part.type === 'tool-call') {
      toolCalls.push({
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        args: part.args,
        state: 'loading',
      });
    } else if (part.type === 'tool-result') {
      // Find matching tool call and update with result
      const toolCall = toolCalls.find(tc => tc.toolCallId === part.toolCallId);
      if (toolCall) {
        toolCall.result = part.result;
        toolCall.state = part.result.error ? 'error' : 'success';
      }
    }
  });

  return (
    <Message from="assistant">
      <MessageContent>
        {/* Chain of thought / reasoning */}
        {textParts.map((text, i) => (
          <div key={i} className="prose prose-sm mb-4">
            {text}
          </div>
        ))}

        {/* Tool executions */}
        {toolCalls.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools Used:
            </div>
            {toolCalls.map(tool => (
              <ToolExecutionCard key={tool.toolCallId} tool={tool} />
            ))}
          </div>
        )}
      </MessageContent>
    </Message>
  );
}
```

### 3. Studio Agent Chat Interface

```typescript
// app/studio/components/agent-chat.tsx
'use client';

import { useStudioAgentChat } from '@/hooks/use-studio-agent-chat';
import { AgentMessage } from '@/components/studio/agent-message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

interface StudioAgentChatProps {
  chatId?: string;
  agentType: 'generation' | 'editing';
  storyId?: string;
  storyContext?: Record<string, any>;
}

export function StudioAgentChat({
  chatId,
  agentType,
  storyId,
  storyContext,
}: StudioAgentChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    loadingHistory,
    activeTools,
  } = useStudioAgentChat({
    chatId,
    agentType,
    storyContext,
  });

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading conversation...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {agentType === 'generation' ? '🎬 Generation Agent' : '✏️ Editing Agent'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {agentType === 'generation'
                ? 'AI assistant for creating stories, chapters, and scenes'
                : 'AI assistant for refining and improving your content'
              }
            </p>
          </div>
          {activeTools.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">
                Running: {activeTools.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-lg font-medium mb-2">
                {agentType === 'generation'
                  ? '✨ Start Creating'
                  : '📝 Start Editing'
                }
              </p>
              <p className="text-sm">
                {agentType === 'generation'
                  ? 'Ask me to generate chapters, scenes, or characters for your story'
                  : 'Ask me to evaluate or improve your story content'
                }
              </p>
            </div>
          ) : (
            messages.map(message => (
              <AgentMessage key={message.id} message={message} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
              agentType === 'generation'
                ? 'E.g., "Generate a mystery chapter where the detective discovers a crucial clue"'
                : 'E.g., "Evaluate the pacing of scene 3 and suggest improvements"'
            }
            className="flex-1 resize-none"
            rows={3}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

### 4. Generative UI for Story Content

Render rich story content components based on tool outputs:

```typescript
// components/studio/generative-story-content.tsx
'use client';

interface ChapterResultProps {
  data: {
    chapterId: string;
    sceneCount: number;
    wordCount: number;
  };
}

export function ChapterGenerationResult({ data }: ChapterResultProps) {
  return (
    <Card className="my-2 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Chapter Generated Successfully
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{data.sceneCount}</div>
            <div className="text-xs text-muted-foreground">Scenes</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.wordCount.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Words</div>
          </div>
          <div>
            <Button asChild size="sm">
              <Link href={`/studio/edit/${data.chapterId}`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Chapter
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SceneEvaluationResultProps {
  data: {
    sceneId: string;
    overallScore: number;
    categoryScores: {
      plot: number;
      character: number;
      pacing: number;
      prose: number;
      worldBuilding: number;
    };
    feedback: string[];
    suggestions: string[];
    passed: boolean;
  };
}

export function SceneEvaluationResult({ data }: SceneEvaluationResultProps) {
  return (
    <Card className="my-2">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Scene Evaluation
          </span>
          <Badge variant={data.passed ? 'success' : 'warning'}>
            {data.overallScore.toFixed(1)} / 4.0
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Category Scores */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(data.categoryScores).map(([category, score]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-sm capitalize">{category}:</span>
                <Badge variant={score >= 3.0 ? 'success' : 'secondary'}>
                  {score.toFixed(1)}
                </Badge>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {data.feedback.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Strengths:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {data.feedback.map((item, i) => (
                  <li key={i} className="text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-2">Improvement Areas:</div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {data.suggestions.map((item, i) => (
                  <li key={i} className="text-muted-foreground">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

Update `AgentMessage` component to render Generative UI:

```typescript
// In components/studio/agent-message.tsx
import { ChapterGenerationResult, SceneEvaluationResult } from './generative-story-content';

// Inside the component, after tool executions:
{toolCalls.map(tool => {
  // Render Generative UI for specific tools
  if (tool.state === 'success' && tool.result) {
    if (tool.toolName === 'generateChapter') {
      return <ChapterGenerationResult key={tool.toolCallId} data={tool.result} />;
    }
    if (tool.toolName === 'evaluateScene') {
      return <SceneEvaluationResult key={tool.toolCallId} data={tool.result} />;
    }
  }

  // Fallback to generic tool card
  return <ToolExecutionCard key={tool.toolCallId} tool={tool} />;
})}
```

## Integration with Studio Pages

### 1. Generation Page (`/studio/new`)

```typescript
// app/studio/new/page.tsx
import { StudioAgentChat } from '@/app/studio/components/agent-chat';

export default function StudioNewPage() {
  return (
    <div className="container mx-auto h-screen">
      <StudioAgentChat
        agentType="generation"
        storyContext={{
          mode: 'new-story',
          preferences: {
            genre: 'mystery',
            targetLength: 'novel',
          },
        }}
      />
    </div>
  );
}
```

### 2. Editing Page (`/studio/edit/[storyId]`)

```typescript
// app/studio/edit/[storyId]/page.tsx
import { StudioAgentChat } from '@/app/studio/components/agent-chat';
import { getStoryById } from '@/lib/db/queries';

export default async function StudioEditPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const story = await getStoryById(storyId);

  return (
    <div className="container mx-auto h-screen">
      <StudioAgentChat
        agentType="editing"
        storyId={storyId}
        storyContext={{
          mode: 'edit-story',
          story: {
            id: story.id,
            title: story.title,
            genre: story.genre,
            currentChapterCount: story.chapters?.length || 0,
          },
        }}
      />
    </div>
  );
}
```

## Performance Optimization

### 1. Streaming Backpressure Handling

```typescript
// lib/studio/streaming-utils.ts
export function createBackpressureHandler(maxBufferSize: number = 100) {
  let buffer: any[] = [];
  let paused = false;

  return {
    add: (chunk: any) => {
      buffer.push(chunk);
      if (buffer.length > maxBufferSize && !paused) {
        paused = true;
        return { shouldPause: true };
      }
      return { shouldPause: false };
    },

    flush: () => {
      const flushed = buffer;
      buffer = [];
      paused = false;
      return flushed;
    },

    size: () => buffer.length,
  };
}
```

### 2. Cursor-Based Pagination for Long Conversations

```typescript
// lib/db/studio-agent-operations.ts
export async function getStudioAgentMessagesPaginated(
  chatId: string,
  limit: number = 50,
  cursor?: string
) {
  const query = db
    .select()
    .from(studioAgentMessages)
    .where(
      cursor
        ? sql`${studioAgentMessages.chatId} = ${chatId} AND ${studioAgentMessages.createdAt} < ${cursor}`
        : sql`${studioAgentMessages.chatId} = ${chatId}`
    )
    .orderBy(desc(studioAgentMessages.createdAt))
    .limit(limit);

  const messages = await query;

  return {
    messages: messages.reverse(),
    nextCursor: messages.length === limit
      ? messages[0]?.createdAt.toISOString()
      : null,
    hasMore: messages.length === limit,
  };
}
```

### 3. Virtual Scrolling for Long Message Lists

```typescript
// components/studio/virtualized-agent-messages.tsx
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { AgentMessage } from './agent-message';
import type { UIMessage } from 'ai';

export function VirtualizedAgentMessages({
  messages
}: {
  messages: UIMessage[]
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated message height
    overscan: 5,
    getItemKey: (index) => messages[index]?.id || index,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <AgentMessage message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Testing

### E2E Tests for Agent Chat

```typescript
// tests/studio-agent-chat.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Studio Agent Chat', () => {
  test.use({ storageState: '.auth/user.json' });

  test('Generation Agent creates chapter with visible reasoning', async ({ page }) => {
    await page.goto('http://localhost:3000/studio/new');

    // Submit generation request
    await page.fill('textarea', 'Generate a mystery chapter where detective finds a clue');
    await page.click('button[type="submit"]');

    // Verify agent reasoning is visible
    await expect(page.locator('text=I\'ll help you create a mystery chapter')).toBeVisible();

    // Verify tool execution is shown
    await expect(page.locator('[data-tool-name="generateChapter"]')).toBeVisible();

    // Verify tool input is displayed
    await expect(page.locator('text=Input:')).toBeVisible();

    // Wait for tool completion
    await expect(page.locator('[data-tool-status="success"]')).toBeVisible({ timeout: 30000 });

    // Verify Generative UI shows chapter result
    await expect(page.locator('text=Chapter Generated Successfully')).toBeVisible();
    await expect(page.locator('text=Scenes')).toBeVisible();
    await expect(page.locator('text=Words')).toBeVisible();
  });

  test('Editing Agent evaluates scene with transparency', async ({ page }) => {
    await page.goto('http://localhost:3000/studio/edit/test-story-id');

    // Submit evaluation request
    await page.fill('textarea', 'Evaluate the pacing of the opening scene');
    await page.click('button[type="submit"]');

    // Verify reasoning steps
    await expect(page.locator('text=I\'ll analyze the scene pacing')).toBeVisible();

    // Verify evaluateScene tool is called
    await expect(page.locator('[data-tool-name="evaluateScene"]')).toBeVisible();

    // Verify evaluation results
    await expect(page.locator('text=Scene Evaluation')).toBeVisible();
    await expect(page.locator('text=Overall Score')).toBeVisible();
    await expect(page.locator('text=Pacing')).toBeVisible();
  });

  test('Chat history persists across sessions', async ({ page }) => {
    // First session: create chat
    await page.goto('http://localhost:3000/studio/new');
    await page.fill('textarea', 'Create a sci-fi character');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Character Generated')).toBeVisible({ timeout: 30000 });

    // Get chat ID from URL
    const url = page.url();
    const chatId = url.split('/').pop();

    // Second session: reload page
    await page.reload();
    await expect(page.locator('text=Create a sci-fi character')).toBeVisible();
    await expect(page.locator('text=Character Generated')).toBeVisible();
  });
});
```

## Benefits

1. **Transparency**: Users see exactly what the agent is thinking and doing
2. **Trust**: Tool execution is visible, not a black box
3. **Control**: Users can guide the agent's reasoning process
4. **Persistence**: Full conversation history saved in database
5. **Extensibility**: MCP enables dynamic tool discovery
6. **Performance**: Optimized streaming, pagination, and virtual scrolling
7. **Generative UI**: Rich, context-aware content display
8. **Multi-step Reasoning**: Complex tasks broken down into clear steps

## Summary

The Studio Agent Chat System provides a production-ready implementation of advanced agentic features for the Fictures /studio page. By combining Vercel AI SDK's multi-step reasoning, transparent tool execution, Generative UI capabilities, and Neon database persistence, it creates an interactive, trustworthy AI assistant for story creation and editing workflows.

**Key Implementation Files:**
- Database: `lib/db/studio-agent-schema.ts`, `lib/db/studio-agent-operations.ts`
- Backend: `app/studio/api/agent/route.ts`, `lib/studio/agent-tools.ts`
- Frontend: `hooks/use-studio-agent-chat.ts`, `components/studio/agent-message.tsx`
- Pages: `app/studio/new/page.tsx`, `app/studio/edit/[storyId]/page.tsx`

**Next Steps:**
1. Generate and run database migrations
2. Implement agent tools (generation and editing)
3. Build frontend components with tool visualization
4. Add MCP server integration for extensibility
5. Write E2E tests for agent workflows
6. Deploy and monitor agent performance
