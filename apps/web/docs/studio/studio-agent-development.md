---
title: Studio Agent Development Guide
---

# Studio Agent Development Guide

## Overview

This document provides complete implementation specifications for the Studio Agent system, including database schema, API routes, tool implementations, and frontend components.

**Related Documents:**
- 📋 **Specification** (`docs/studio/studio-agent-specification.md`): Conceptual design and user journeys
- 📖 **Novel Specification** (`docs/novels/novels-specification.md`): Adversity-Triumph Engine methodology
- 🔧 **Novel Development** (`docs/novels/novels-development.md`): Generation APIs and system prompts

---

## Part I: Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  • Studio Agent Chat UI   • Tool Visualization              │
│  • Generative UI Components  • Progress Tracking            │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Communication Layer                        │
│  • Server-Sent Events (SSE)  • Real-time streaming          │
│  • Tool execution sync       • Progress updates             │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Route Layer                         │
│  • /studio/api/agent/route.ts (main chat endpoint)          │
│  • /studio/api/agent/[chatId]/messages (history)            │
│  • /studio/api/agent/tools (tool execution)                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Agent Tools Layer                        │
│  • CRUD Tools (database operations)                         │
│  • Generation Tools (novels API integration)                │
│  • Advisory Tools (validation, suggestions)                 │
│  • Utility Tools (API key validation, progress tracking)    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer (Neon)                    │
│  • Story entities (stories, parts, chapters, scenes)        │
│  • Agent data (chats, messages, tool executions)            │
│  • User data (users, API keys)                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Backend**:
- Next.js 15 App Router
- Vercel AI SDK (Multi-step reasoning, Tool use)
- Gemini 2.5 Flash & Flash Lite (via AI Gateway)
- Drizzle ORM + Neon PostgreSQL
- Server-Sent Events for streaming

**Frontend**:
- React 19 with Server Components
- AI SDK React hooks (`useChat`)
- Tailwind CSS v4
- Shadcn UI components
- Real-time tool visualization

**AI Integration**:
- Vercel AI Gateway (API key management)
- Google Gemini 2.5 Flash (generation, reasoning)
- Gemini 2.5 Flash Lite (lightweight operations)
- Multi-step reasoning with `stopWhen` strategy

---

## Part II: Database Schema

### 2.1 Agent Chat Tables

Extend the database with agent-specific tables:

```typescript
// lib/db/studio-agent-schema.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar, integer, index } from 'drizzle-orm/pg-core';
import { users, stories } from './schema';

// Main agent chat sessions
export const studioAgentChats = pgTable('studio_agent_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }), // Required - created on "Create New Story"
  agentType: varchar('agent_type', { length: 50 }).notNull().default('generation'), // 'generation' | 'editing'
  title: varchar('title', { length: 255 }).notNull(),

  // Story generation progress tracking
  currentPhase: varchar('current_phase', { length: 50 }), // 'story-summary' | 'characters' | 'settings' | etc.
  completedPhases: jsonb('completed_phases').$type<string[]>().default([]), // ['story-summary', 'characters']
  phaseProgress: jsonb('phase_progress').$type<Record<string, number>>().default({}), // { 'scenes': 0.6 }

  // Context and configuration
  context: jsonb('context'), // Story context, user preferences, etc.

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('studio_agent_chats_user_id_idx').on(table.userId),
  storyIdIdx: index('studio_agent_chats_story_id_idx').on(table.storyId),
  currentPhaseIdx: index('studio_agent_chats_current_phase_idx').on(table.currentPhase),
}));

// Individual messages within chats
export const studioAgentMessages = pgTable('studio_agent_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => studioAgentChats.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user' | 'assistant' | 'system'
  content: text('content').notNull(), // Main text content
  parts: jsonb('parts'), // AI SDK message parts (text, tool-call, tool-result)
  reasoning: text('reasoning'), // Agent's chain of thought (for assistant messages)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index('studio_agent_messages_chat_id_idx').on(table.chatId),
  createdAtIdx: index('studio_agent_messages_created_at_idx').on(table.createdAt),
}));

// Tool execution tracking for transparency
export const studioAgentToolExecutions = pgTable('studio_agent_tool_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => studioAgentMessages.id, { onDelete: 'cascade' }).notNull(),
  toolName: varchar('tool_name', { length: 100 }).notNull(),
  toolInput: jsonb('tool_input').notNull(),
  toolOutput: jsonb('tool_output'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'executing' | 'completed' | 'error'
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

### 2.2 Fictures API Key Integration

The Studio Agent uses the existing `api_keys` table for authentication:

```typescript
// lib/db/schema.ts - EXISTING api_keys table
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull().default('API Key'),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(), // SHA-256 hash
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(), // First 16 chars for UI display
  scopes: json('scopes').$type<string[]>().default([]).notNull(), // Permissions array
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Required Scopes for Studio Agent**:
- `ai:use` - Use AI writing assistance features (REQUIRED)
- `stories:write` - Create and edit stories
- `chapters:write` - Create and edit chapters and scenes

### 2.3 Migration Commands

Generate and run migrations:

```bash
# Generate migration from schema changes
dotenv --file .env.local run pnpm db:generate

# Run migration
dotenv --file .env.local run pnpm db:migrate

# Verify with Drizzle Studio
dotenv --file .env.local run pnpm db:studio
```

---

## Part III: Database Operations Layer

### 3.1 Agent Chat Operations

```typescript
// lib/db/studio-agent-operations.ts
import { db } from './index';
import { studioAgentChats, studioAgentMessages, studioAgentToolExecutions } from './studio-agent-schema';
import { eq, desc, and } from 'drizzle-orm';

// === CHAT OPERATIONS ===

export async function createStudioAgentChat(data: {
  userId: string;
  storyId: string;
  agentType: 'generation' | 'editing';
  title: string;
  context?: Record<string, any>;
}) {
  const [chat] = await db.insert(studioAgentChats).values({
    userId: data.userId,
    storyId: data.storyId,
    agentType: data.agentType,
    title: data.title,
    currentPhase: 'story-summary', // Start at phase 1
    completedPhases: [],
    phaseProgress: {},
    context: data.context || {},
  }).returning();

  return chat;
}

export async function getStudioAgentChat(chatId: string) {
  const [chat] = await db
    .select()
    .from(studioAgentChats)
    .where(eq(studioAgentChats.id, chatId));

  return chat;
}

export async function updateStudioAgentChatPhase(
  chatId: string,
  phase: string,
  completed: boolean = false
) {
  const chat = await getStudioAgentChat(chatId);
  if (!chat) throw new Error('Chat not found');

  const completedPhases = completed
    ? [...(chat.completedPhases || []), phase]
    : chat.completedPhases;

  // Determine next phase
  const phaseOrder = [
    'story-summary', 'characters', 'settings', 'parts',
    'chapters', 'scene-summaries', 'scene-content',
    'evaluation', 'images'
  ];
  const currentIndex = phaseOrder.indexOf(phase);
  const nextPhase = completed && currentIndex < phaseOrder.length - 1
    ? phaseOrder[currentIndex + 1]
    : phase;

  await db.update(studioAgentChats)
    .set({
      currentPhase: nextPhase,
      completedPhases,
      updatedAt: new Date(),
    })
    .where(eq(studioAgentChats.id, chatId));
}

// === MESSAGE OPERATIONS ===

export async function saveStudioAgentMessage(data: {
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  parts?: any[];
  reasoning?: string;
}) {
  const [message] = await db.insert(studioAgentMessages).values({
    chatId: data.chatId,
    role: data.role,
    content: data.content,
    parts: data.parts || null,
    reasoning: data.reasoning || null,
  }).returning();

  return message;
}

export async function getStudioAgentMessages(chatId: string, limit: number = 100) {
  const messages = await db
    .select()
    .from(studioAgentMessages)
    .where(eq(studioAgentMessages.chatId, chatId))
    .orderBy(studioAgentMessages.createdAt)
    .limit(limit);

  return messages;
}

// === TOOL EXECUTION OPERATIONS ===

export async function saveToolExecution(data: {
  messageId: string;
  toolName: string;
  toolInput: Record<string, any>;
  status?: 'pending' | 'executing' | 'completed' | 'error';
}) {
  const [execution] = await db.insert(studioAgentToolExecutions).values({
    messageId: data.messageId,
    toolName: data.toolName,
    toolInput: data.toolInput,
    status: data.status || 'pending',
  }).returning();

  return execution;
}

export async function updateToolExecution(data: {
  executionId: string;
  toolOutput?: any;
  status?: 'executing' | 'completed' | 'error';
  error?: string;
  executionTimeMs?: number;
}) {
  await db.update(studioAgentToolExecutions)
    .set({
      toolOutput: data.toolOutput || null,
      status: data.status,
      error: data.error || null,
      executionTimeMs: data.executionTimeMs,
      completedAt: data.status === 'completed' || data.status === 'error' ? new Date() : null,
    })
    .where(eq(studioAgentToolExecutions.id, data.executionId));
}

// === USER CHAT LIST ===

export async function getUserStudioChats(userId: string, limit: number = 50) {
  const chats = await db
    .select()
    .from(studioAgentChats)
    .where(eq(studioAgentChats.userId, userId))
    .orderBy(desc(studioAgentChats.updatedAt))
    .limit(limit);

  return chats;
}
```

### 3.2 Fictures API Key Operations

```typescript
// lib/db/api-key-operations.ts (uses EXISTING queries from lib/db/queries.ts)
import { getUserApiKeys, findApiKeyByHash, updateApiKeyLastUsed } from './queries';
import { hashApiKey, isApiKeyExpired, hasScope } from '@/lib/auth/api-keys';
import type { ApiScope } from '@/lib/auth/api-keys';

/**
 * Get active user API key with 'ai:use' scope for Studio Agent
 */
export async function getUserActiveApiKey(userId: string) {
  const apiKeys = await getUserApiKeys(userId);

  // Find first active key with 'ai:use' scope
  const validKey = apiKeys.find(key =>
    key.isActive &&
    !isApiKeyExpired(key.expiresAt) &&
    hasScope(key.scopes, 'ai:use')
  );

  return validKey || null;
}

/**
 * Validate API key for Studio Agent usage
 * Checks: active status, expiration, required scopes
 */
export async function validateStudioAgentApiKey(userId: string): Promise<{
  valid: boolean;
  apiKeyId?: string;
  scopes?: string[];
  message?: string;
}> {
  const apiKey = await getUserActiveApiKey(userId);

  if (!apiKey) {
    return {
      valid: false,
      message: 'No active API key with ai:use scope found. Please create an API key in Settings.',
    };
  }

  if (isApiKeyExpired(apiKey.expiresAt)) {
    return {
      valid: false,
      message: 'API key has expired. Please create a new API key in Settings.',
    };
  }

  // Check required scopes
  const requiredScopes: ApiScope[] = ['ai:use', 'stories:write'];
  const missingScopes = requiredScopes.filter(scope => !hasScope(apiKey.scopes, scope));

  if (missingScopes.length > 0) {
    return {
      valid: false,
      message: `API key missing required scopes: ${missingScopes.join(', ')}`,
    };
  }

  // Update last used timestamp
  await updateApiKeyLastUsed(apiKey.id);

  return {
    valid: true,
    apiKeyId: apiKey.id,
    scopes: apiKey.scopes,
  };
}

/**
 * Check if user has permission for specific operation
 */
export async function checkUserApiKeyScope(userId: string, requiredScope: ApiScope): Promise<boolean> {
  const apiKey = await getUserActiveApiKey(userId);

  if (!apiKey || isApiKeyExpired(apiKey.expiresAt)) {
    return false;
  }

  return hasScope(apiKey.scopes, requiredScope);
}
```

### 3.3 API Key Security Notes

**Storage**: Fictures API keys use SHA-256 hashing (not encryption) via `lib/auth/api-keys.ts`:
- Full keys are NEVER stored in database
- Only SHA-256 hash (`keyHash`) is stored for validation
- Key prefix stored for UI display (`fic_xxxxx`)
- User provides full key during API calls

**Validation Flow**:
1. User provides API key in header: `Authorization: Bearer fic_xxxxx_...`
2. Hash the provided key: `hashApiKey(providedKey)`
3. Look up hash in database: `findApiKeyByHash(hash)`
4. Check: active status, expiration, required scopes
5. Update `lastUsedAt` timestamp

---

## Part IV: Agent Tools Implementation

### 4.1 CRUD Tools for Database Operations

```typescript
// lib/studio/agent-crud-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { stories, characters, settings, parts, chapters, scenes } from '@/lib/schemas/database';
import { eq } from 'drizzle-orm';

// === STORY CRUD TOOLS ===

export const updateStoryTool = tool({
  description: 'Update story metadata in database (summary, genre, tone, moral framework)',
  parameters: z.object({
    storyId: z.string().describe('The story ID to update'),
    data: z.object({
      summary: z.string().optional().describe('Story summary'),
      genre: z.string().optional().describe('Story genre'),
      tone: z.string().optional().describe('Emotional tone'),
      moralFramework: z.string().optional().describe('Moral framework description'),
    }),
  }),
  execute: async ({ storyId, data }) => {
    const startTime = Date.now();

    await db.update(stories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(stories.id, storyId));

    return {
      success: true,
      storyId,
      updated: Object.keys(data),
      executionTimeMs: Date.now() - startTime,
    };
  },
});

export const getStoryTool = tool({
  description: 'Retrieve story with all related data (characters, settings, parts, chapters, scenes)',
  parameters: z.object({
    storyId: z.string().describe('The story ID to retrieve'),
  }),
  execute: async ({ storyId }) => {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.id, storyId));

    if (!story) {
      throw new Error(`Story ${storyId} not found`);
    }

    // Get related entities
    const storyCharacters = await db.select().from(characters).where(eq(characters.storyId, storyId));
    const storySettings = await db.select().from(settings).where(eq(settings.storyId, storyId));
    const storyParts = await db.select().from(parts).where(eq(parts.storyId, storyId));

    return {
      success: true,
      story,
      characters: storyCharacters,
      settings: storySettings,
      parts: storyParts,
      stats: {
        characterCount: storyCharacters.length,
        settingCount: storySettings.length,
        partCount: storyParts.length,
      },
    };
  },
});

// === CHARACTER CRUD TOOLS ===

export const createCharacterTool = tool({
  description: 'Create a new character and add to story database',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    data: z.object({
      name: z.string().describe('Character name'),
      isMain: z.boolean().describe('Is this a main character?'),
      summary: z.string().describe('One-sentence character summary'),
      coreTrait: z.enum(['courage', 'compassion', 'integrity', 'sacrifice', 'loyalty', 'wisdom']),
      internalFlaw: z.string().describe('Internal flaw WITH CAUSE (must include "because")'),
      externalGoal: z.string().describe('External goal'),
      personality: z.object({
        traits: z.array(z.string()),
        values: z.array(z.string()),
      }),
      backstory: z.string().describe('2-4 paragraph backstory'),
      physicalDescription: z.object({
        age: z.string(),
        appearance: z.string(),
        distinctiveFeatures: z.string(),
        style: z.string(),
      }),
      voiceStyle: z.object({
        tone: z.string(),
        vocabulary: z.string(),
        quirks: z.array(z.string()),
        emotionalRange: z.string(),
      }),
    }),
  }),
  execute: async ({ storyId, data }) => {
    // Validation: Internal flaw must have cause
    if (!data.internalFlaw.includes('because')) {
      throw new Error('Internal flaw must include CAUSE (use "because")');
    }

    const [character] = await db.insert(characters).values({
      storyId,
      ...data,
    }).returning();

    return {
      success: true,
      characterId: character.id,
      name: character.name,
      validationPassed: true,
    };
  },
});

export const updateCharacterTool = tool({
  description: 'Update existing character in database',
  parameters: z.object({
    characterId: z.string().describe('Character ID to update'),
    data: z.object({
      name: z.string().optional(),
      summary: z.string().optional(),
      backstory: z.string().optional(),
      // ... other fields optional
    }),
  }),
  execute: async ({ characterId, data }) => {
    await db.update(characters)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(characters.id, characterId));

    return {
      success: true,
      characterId,
      updated: Object.keys(data),
    };
  },
});

export const getCharactersTool = tool({
  description: 'Get all characters for a story',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
  }),
  execute: async ({ storyId }) => {
    const storyCharacters = await db
      .select()
      .from(characters)
      .where(eq(characters.storyId, storyId));

    return {
      success: true,
      characters: storyCharacters,
      count: storyCharacters.length,
    };
  },
});

// === SETTING CRUD TOOLS ===

export const createSettingTool = tool({
  description: 'Create a new setting and add to story database',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    data: z.object({
      name: z.string().describe('Setting name'),
      description: z.string().describe('3-5 sentence description'),
      adversityElements: z.object({
        physicalObstacles: z.array(z.string()),
        scarcityFactors: z.array(z.string()),
        dangerSources: z.array(z.string()),
        socialDynamics: z.array(z.string()),
      }),
      symbolicMeaning: z.string().describe('How setting reflects moral framework'),
      cycleAmplification: z.object({
        setup: z.string(),
        confrontation: z.string(),
        virtue: z.string(),
        consequence: z.string(),
        transition: z.string(),
      }),
      mood: z.string().describe('Primary emotional quality'),
      emotionalResonance: z.string().describe('What emotion this amplifies'),
      sensory: z.object({
        sight: z.array(z.string()).min(5),
        sound: z.array(z.string()).min(3),
        smell: z.array(z.string()).min(2),
        touch: z.array(z.string()).min(2),
        taste: z.array(z.string()).optional(),
      }),
    }),
  }),
  execute: async ({ storyId, data }) => {
    // Validation: Sensory arrays must have minimum items
    if (data.sensory.sight.length < 5) {
      throw new Error('Setting must have at least 5 sight details');
    }

    const [setting] = await db.insert(settings).values({
      storyId,
      ...data,
    }).returning();

    return {
      success: true,
      settingId: setting.id,
      name: setting.name,
      validationPassed: true,
    };
  },
});

// === PART CRUD TOOLS ===

export const createPartTool = tool({
  description: 'Create a new part (act) and add to story database',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    data: z.object({
      actNumber: z.number().int().min(1).max(3).describe('Act number (1, 2, or 3)'),
      title: z.string().describe('Part title'),
      summary: z.string().describe('Multi-character MACRO arcs with progression planning'),
      order: z.number().int().min(1),
    }),
  }),
  execute: async ({ storyId, data }) => {
    const [part] = await db.insert(parts).values({
      storyId,
      ...data,
    }).returning();

    return {
      success: true,
      partId: part.id,
      actNumber: part.actNumber,
      title: part.title,
    };
  },
});

// === CHAPTER CRUD TOOLS ===

export const createChapterTool = tool({
  description: 'Create a new chapter and add to part database',
  parameters: z.object({
    partId: z.string().describe('The part ID'),
    storyId: z.string().describe('The story ID'),
    data: z.object({
      title: z.string().describe('Chapter title'),
      summary: z.string().describe('Single adversity-triumph cycle'),
      order: z.number().int().min(1),
    }),
  }),
  execute: async ({ partId, storyId, data }) => {
    const [chapter] = await db.insert(chapters).values({
      partId,
      storyId,
      ...data,
    }).returning();

    return {
      success: true,
      chapterId: chapter.id,
      title: chapter.title,
    };
  },
});

// === SCENE CRUD TOOLS ===

export const createSceneTool = tool({
  description: 'Create a new scene and add to chapter database',
  parameters: z.object({
    chapterId: z.string().describe('The chapter ID'),
    storyId: z.string().describe('The story ID'),
    data: z.object({
      title: z.string().describe('Scene title'),
      summary: z.string().describe('Scene specification'),
      content: z.string().optional().describe('Full prose narrative (optional)'),
      cyclePhase: z.enum(['setup', 'adversity', 'virtue', 'consequence', 'transition']),
      order: z.number().int().min(1),
    }),
  }),
  execute: async ({ chapterId, storyId, data }) => {
    const [scene] = await db.insert(scenes).values({
      chapterId,
      storyId,
      ...data,
    }).returning();

    return {
      success: true,
      sceneId: scene.id,
      title: scene.title,
      cyclePhase: scene.cyclePhase,
    };
  },
});

// Combine all CRUD tools
export const crudTools = {
  updateStory: updateStoryTool,
  getStory: getStoryTool,
  createCharacter: createCharacterTool,
  updateCharacter: updateCharacterTool,
  getCharacters: getCharactersTool,
  createSetting: createSettingTool,
  createPart: createPartTool,
  createChapter: createChapterTool,
  createScene: createSceneTool,
};
```

### 4.2 Generation Tools (Novel API Integration)

```typescript
// lib/studio/agent-generation-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { generateStorySummary } from '@/lib/novels/story-summary-generator';
import { generateCharacters } from '@/lib/novels/character-generator';
import { generateSettings } from '@/lib/novels/setting-generator';
import { generateParts } from '@/lib/novels/part-generator';
import { generateChapters } from '@/lib/novels/chapter-generator';
import { generateSceneSummaries } from '@/lib/novels/scene-summary-generator';
import { generateSceneContent } from '@/lib/novels/scene-content-generator';

export const generateStorySummaryTool = tool({
  description: 'Generate story summary with moral framework and basic character profiles using Adversity-Triumph Engine',
  parameters: z.object({
    userPrompt: z.string().describe('User\'s story idea'),
    storyId: z.string().describe('The story ID'),
    userId: z.string().describe('User ID for API key retrieval'),
    options: z.object({
      preferredGenre: z.string().optional(),
      preferredTone: z.string().optional(),
      characterCount: z.number().int().min(2).max(4).optional(),
    }).optional(),
  }),
  execute: async ({ userPrompt, storyId, userId, options }) => {
    const result = await generateStorySummary({
      userPrompt,
      userId,
      options,
    });

    return {
      success: true,
      storyId,
      summary: result.summary,
      genre: result.genre,
      tone: result.tone,
      moralFramework: result.moralFramework,
      characters: result.characters,
    };
  },
});

export const generateCharactersTool = tool({
  description: 'Generate complete character profiles with personality, backstory, relationships, and voice',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    userId: z.string().describe('User ID for API key retrieval'),
    characters: z.array(z.object({
      name: z.string(),
      coreTrait: z.string(),
      internalFlaw: z.string(),
      externalGoal: z.string(),
    })).describe('Basic character data from story summary'),
    storyContext: z.object({
      summary: z.string(),
      genre: z.string(),
      tone: z.string(),
      moralFramework: z.string(),
    }),
    visualStyle: z.enum(['realistic', 'anime', 'painterly', 'cinematic']).default('realistic'),
  }),
  execute: async ({ storyId, userId, characters, storyContext, visualStyle }) => {
    const result = await generateCharacters({
      storyId,
      userId,
      characters,
      storyContext,
      visualStyle,
    });

    return {
      success: true,
      characters: result.characters,
      count: result.characters.length,
    };
  },
});

export const generateSettingsTool = tool({
  description: 'Generate emotional environments with adversity elements and cycle amplification',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    userId: z.string().describe('User ID for API key retrieval'),
    storyContext: z.object({
      summary: z.string(),
      genre: z.string(),
      tone: z.string(),
      moralFramework: z.string(),
    }),
    characters: z.array(z.object({
      name: z.string(),
      coreTrait: z.string(),
      internalFlaw: z.string(),
    })),
    numberOfSettings: z.number().int().min(2).max(6).default(3),
    visualStyle: z.enum(['realistic', 'anime', 'painterly', 'cinematic']).default('realistic'),
  }),
  execute: async ({ storyId, userId, storyContext, characters, numberOfSettings, visualStyle }) => {
    const result = await generateSettings({
      storyId,
      userId,
      storyContext,
      characters,
      numberOfSettings,
      visualStyle,
    });

    return {
      success: true,
      settings: result.settings,
      count: result.settings.length,
    };
  },
});

// Additional generation tools following same pattern...
export const generationTools = {
  generateStorySummary: generateStorySummaryTool,
  generateCharacters: generateCharactersTool,
  generateSettings: generateSettingsTool,
  // ... add other generation tools
};
```

### 4.3 Advisory Tools

```typescript
// lib/studio/agent-advisory-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/lib/db';
import { stories, characters, settings, parts, chapters, scenes } from '@/lib/schemas/database';
import { eq } from 'drizzle-orm';

export const checkPrerequisitesTool = tool({
  description: 'Check if prerequisites are met for a specific generation phase',
  parameters: z.object({
    storyId: z.string().describe('The story ID'),
    targetPhase: z.enum([
      'story-summary', 'characters', 'settings', 'parts',
      'chapters', 'scene-summaries', 'scene-content',
      'evaluation', 'images'
    ]),
  }),
  execute: async ({ storyId, targetPhase }) => {
    const [story] = await db.select().from(stories).where(eq(stories.id, storyId));
    if (!story) throw new Error('Story not found');

    const prerequisites = {
      'story-summary': [],
      'characters': ['story-summary'],
      'settings': ['story-summary'],
      'parts': ['story-summary', 'characters'],
      'chapters': ['story-summary', 'characters', 'parts'],
      'scene-summaries': ['story-summary', 'characters', 'settings', 'parts', 'chapters'],
      'scene-content': ['story-summary', 'characters', 'settings', 'parts', 'chapters', 'scene-summaries'],
      'evaluation': ['scene-content'],
      'images': ['characters', 'settings', 'scene-content'],
    };

    const required = prerequisites[targetPhase] || [];
    const missing = [];

    for (const prereq of required) {
      let exists = false;

      switch (prereq) {
        case 'story-summary':
          exists = !!story.summary;
          break;
        case 'characters':
          const chars = await db.select().from(characters).where(eq(characters.storyId, storyId));
          exists = chars.length >= 2;
          break;
        case 'settings':
          const sets = await db.select().from(settings).where(eq(settings.storyId, storyId));
          exists = sets.length >= 2;
          break;
        case 'parts':
          const pts = await db.select().from(parts).where(eq(parts.storyId, storyId));
          exists = pts.length >= 3; // 3-act structure
          break;
        case 'chapters':
          const chaps = await db.select().from(chapters).where(eq(chapters.storyId, storyId));
          exists = chaps.length > 0;
          break;
        case 'scene-summaries':
          const scns = await db.select().from(scenes).where(eq(scenes.storyId, storyId));
          exists = scns.length > 0 && scns.every(s => s.summary);
          break;
        case 'scene-content':
          const scnsContent = await db.select().from(scenes).where(eq(scenes.storyId, storyId));
          exists = scnsContent.length > 0 && scnsContent.every(s => s.content);
          break;
      }

      if (!exists) missing.push(prereq);
    }

    return {
      targetPhase,
      canProceed: missing.length === 0,
      missing,
      message: missing.length > 0
        ? `Cannot proceed with ${targetPhase}. Missing: ${missing.join(', ')}`
        : `Ready to proceed with ${targetPhase}`,
    };
  },
});

export const validateContentQualityTool = tool({
  description: 'Validate content quality using LLM evaluation based on Adversity-Triumph principles',
  parameters: z.object({
    contentType: z.enum(['character', 'setting', 'chapter', 'scene']),
    content: z.record(z.any()).describe('Content to validate'),
    userId: z.string().describe('User ID for API key retrieval'),
  }),
  execute: async ({ contentType, content, userId }) => {
    // Get user's API key
    const apiKey = await getUserActiveApiKey(userId);
    if (!apiKey) {
      throw new Error('No active API key found for content validation');
    }

    // Prepare validation prompt based on content type
    const validationPrompts = {
      character: `Evaluate this character profile using Adversity-Triumph Engine principles:

Character Data:
${JSON.stringify(content, null, 2)}

Check for:
1. Internal flaw must have CAUSE (format: "fears/believes/wounded by X because Y")
2. Core trait must be one of: courage, compassion, integrity, sacrifice, loyalty, wisdom
3. Backstory should explain the internal flaw's origin
4. External goal should conflict with internal need

Return JSON:
{
  "valid": boolean,
  "issues": string[], // Critical problems
  "warnings": string[], // Suggestions for improvement
  "qualityScore": number (0-1),
  "recommendations": string[]
}`,

      setting: `Evaluate this setting using Adversity-Triumph Engine principles:

Setting Data:
${JSON.stringify(content, null, 2)}

Check for:
1. At least 5 sight sensory details
2. At least 3 sound sensory details
3. Adversity elements (obstacles, scarcity, danger, social dynamics)
4. Symbolic meaning aligned with moral framework
5. Cycle amplification for each phase

Return JSON with same format as character validation.`,

      scene: `Evaluate this scene using Adversity-Triumph Engine principles:

Scene Data:
${JSON.stringify(content, null, 2)}

Check for:
1. Intrinsic motivation (NO transactional language: "hoping to get", "in return", "so that", "expecting")
2. Causal linking (consequences must relate to past actions)
3. Proper cycle phase execution
4. Emotional resonance and sensory grounding
5. Show-don't-tell for emotions

Return JSON with same format.`,

      chapter: `Evaluate this chapter using Adversity-Triumph Engine principles:

Chapter Data:
${JSON.stringify(content, null, 2)}

Check for:
1. Complete adversity-triumph cycle
2. Causal chain integrity
3. Character arc progression
4. Seed planting for future payoffs

Return JSON with same format.`,
    };

    // Call LLM for evaluation
    const { generateText } = await import('ai');
    const { google } = await import('@ai-sdk/google');

    const result = await generateText({
      model: google('gemini-2.0-flash-exp'),
      prompt: validationPrompts[contentType],
    });

    // Parse JSON response
    try {
      const evaluation = JSON.parse(result.text);
      return evaluation;
    } catch (error) {
      // Fallback: return raw text if JSON parsing fails
      return {
        valid: true,
        issues: [],
        warnings: [],
        qualityScore: 0.7,
        recommendations: [result.text],
      };
    }
  },
});

export const advisoryTools = {
  checkPrerequisites: checkPrerequisitesTool,
  validateContentQuality: validateContentQualityTool,
};
```

### 4.4 Utility Tools

```typescript
// lib/studio/agent-utility-tools.ts
import { tool } from 'ai';
import { z } from 'zod';
import { validateStudioAgentApiKey, checkUserApiKeyScope } from '@/lib/db/api-key-operations';
import type { ApiScope } from '@/lib/auth/api-keys';

export const validateUserApiKeyTool = tool({
  description: 'Validate user\'s Fictures API key for Studio Agent usage (checks ai:use and stories:write scopes)',
  parameters: z.object({
    userId: z.string().describe('User ID'),
  }),
  execute: async ({ userId }) => {
    const validation = await validateStudioAgentApiKey(userId);

    if (!validation.valid) {
      return {
        hasApiKey: false,
        isValid: false,
        message: validation.message || 'API key validation failed',
        scopes: [],
      };
    }

    return {
      hasApiKey: true,
      isValid: true,
      message: 'API key validated successfully. Ready for story generation.',
      scopes: validation.scopes,
      apiKeyId: validation.apiKeyId,
      // Note: Never return the actual API key
    };
  },
});

export const checkApiKeyScopeTool = tool({
  description: 'Check if user has specific API key scope for an operation',
  parameters: z.object({
    userId: z.string().describe('User ID'),
    requiredScope: z.enum([
      'ai:use',
      'stories:read',
      'stories:write',
      'stories:delete',
      'chapters:write',
      'analysis:read',
    ] as const).describe('Required scope to check'),
  }),
  execute: async ({ userId, requiredScope }) => {
    const hasPermission = await checkUserApiKeyScope(userId, requiredScope as ApiScope);

    return {
      hasPermission,
      scope: requiredScope,
      message: hasPermission
        ? `User has ${requiredScope} permission`
        : `User lacks ${requiredScope} permission. Please update API key scopes in Settings.`,
    };
  },
});

export const getStoryProgressTool = tool({
  description: 'Get current story generation progress and completed phases',
  parameters: z.object({
    chatId: z.string().describe('Agent chat ID'),
  }),
  execute: async ({ chatId }) => {
    const { getStudioAgentChat } = await import('@/lib/db/studio-agent-operations');
    const chat = await getStudioAgentChat(chatId);

    if (!chat) throw new Error('Chat not found');

    const phaseOrder = [
      'story-summary', 'characters', 'settings', 'parts',
      'chapters', 'scene-summaries', 'scene-content',
      'evaluation', 'images'
    ];

    const currentIndex = phaseOrder.indexOf(chat.currentPhase || 'story-summary');
    const totalPhases = phaseOrder.length;
    const completedCount = (chat.completedPhases || []).length;
    const progressPercentage = (completedCount / totalPhases) * 100;

    return {
      currentPhase: chat.currentPhase,
      completedPhases: chat.completedPhases || [],
      phaseProgress: chat.phaseProgress || {},
      progressPercentage: Math.round(progressPercentage),
      nextPhase: currentIndex < totalPhases - 1 ? phaseOrder[currentIndex + 1] : null,
      remainingPhases: phaseOrder.slice(currentIndex + 1),
    };
  },
});

export const utilityTools = {
  validateUserApiKey: validateUserApiKeyTool,
  checkApiKeyScope: checkApiKeyScopeTool,
  getStoryProgress: getStoryProgressTool,
};
```

### 4.5 Combined Tool Export

```typescript
// lib/studio/agent-tools.ts
import { crudTools } from './agent-crud-tools';
import { generationTools } from './agent-generation-tools';
import { advisoryTools } from './agent-advisory-tools';
import { utilityTools } from './agent-utility-tools';

export const studioAgentTools = {
  ...crudTools,
  ...generationTools,
  ...advisoryTools,
  ...utilityTools,
};

export type StudioAgentToolName = keyof typeof studioAgentTools;
```

---

## Part V: API Routes Implementation

### 5.1 Main Agent Chat Endpoint

```typescript
// app/studio/api/agent/route.ts
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
import { validateStudioAgentApiKey } from '@/lib/db/api-key-operations';
import { studioAgentTools } from '@/lib/studio/agent-tools';
import { generateId } from 'ai';

export const maxDuration = 60;
export const runtime = 'nodejs';

const AGENT_SYSTEM_PROMPT = `You are the Studio Agent for Fictures, an AI-powered story writing platform.

Your role is to guide writers through creating emotionally resonant stories using the Adversity-Triumph Engine methodology.

## CORE RESPONSIBILITIES

1. **Progressive Generation**: Guide writers through 9 phases sequentially
   - Phase 1: Story Summary (moral framework, basic characters)
   - Phase 2: Characters (detailed profiles)
   - Phase 3: Settings (emotional environments)
   - Phase 4: Parts (3-act MACRO arcs)
   - Phase 5: Chapters (micro-cycles)
   - Phase 6: Scene Summaries (specifications)
   - Phase 7: Scene Content (full prose)
   - Phase 8: Scene Evaluation (quality assessment)
   - Phase 9: Images (visual assets)

2. **Intelligent Advisory**: Provide methodology-specific guidance
   - Check prerequisites before each phase
   - Warn about missing or weak elements
   - Suggest improvements based on Adversity-Triumph principles
   - Explain methodology concepts as needed

3. **Transparent Operations**: Show all tool usage
   - Explain what each tool does before using it
   - Display database operations for user confirmation
   - Show generation results immediately
   - Provide links to view/edit content

4. **Database Management**: Use CRUD tools for all data operations
   - createCharacter, updateCharacter, getCharacters
   - createSetting, updateSetting, getSettings
   - createPart, updatePart, getParts
   - createChapter, updateChapter, getChapters
   - createScene, updateScene, getScenes

## METHODOLOGY PRINCIPLES

**Adversity-Triumph Cycle (4 phases)**:
1. ADVERSITY: Internal flaw + External obstacle
2. VIRTUOUS ACTION: Intrinsically motivated (NOT transactional)
3. UNINTENDED CONSEQUENCE: Causally linked earned luck
4. NEW ADVERSITY: Resolution creates next problem

**Critical Requirements**:
- Internal flaws MUST have CAUSE (format: "fears/believes/wounded by X because Y")
- Virtuous actions must be intrinsically motivated (no "hoping to get", "in return", "so that")
- Consequences must be causally linked to past actions (no deus ex machina)
- Every resolution must create next adversity (cyclical engine)

## TOOL USAGE GUIDELINES

**Before Using Tools**:
1. Check prerequisites using checkPrerequisites tool
2. Validate content quality using validateContentQuality tool (LLM-based evaluation)
3. Confirm API key availability using validateUserApiKey tool (checks Fictures API key scopes)

**Generation Flow**:
1. Use generation tool (e.g., generateCharacters)
2. Use CRUD tool to save results (e.g., createCharacter)
3. Update story progress
4. Show user what was created
5. Suggest next logical phase

**Advisory Triggers**:
- Missing prerequisites → Guide to complete them first
- Quality issues detected → Explain problem, offer regeneration
- Transactional language → Educate on intrinsic motivation
- Weak seed planting → Suggest additional seeds

## COMMUNICATION STYLE

- Be warm and encouraging (writers are creative partners)
- Explain reasoning before taking actions
- Use examples from Adversity-Triumph methodology
- Ask clarifying questions when user intent is unclear
- Celebrate completed phases ("✅ Phase Complete!")
- Provide time estimates for each phase

## EXAMPLE INTERACTION FLOW

User: "I want to create a post-war story about healing"

Agent:
"Great story concept! Let me guide you through creating this.

First, I'll check if you have a Fictures API key with proper permissions...
[Uses validateUserApiKey tool]

Perfect! Your API key has 'ai:use' and 'stories:write' scopes. You're all set.

Let's start with Phase 1: Story Summary. This will:
- Define your moral framework (what virtues matter in a post-war world?)
- Create 2-4 basic character profiles
- Establish genre and emotional tone

Tell me more about:
1. What moral question are you exploring? (e.g., Can compassion replace revenge?)
2. Who are your main characters? (refugees? soldiers? civilians?)
3. What tone do you want? (hopeful? bittersweet? dark?)"

Remember: You are a guide, not a black box. Explain, advise, and empower the writer.`;

export async function POST(request: NextRequest) {
  try {
    const { chatId, message, storyId } = await request.json();

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Validate Fictures API key
    const apiKeyValidation = await validateStudioAgentApiKey(session.user.id);
    if (!apiKeyValidation.valid) {
      return new Response(
        JSON.stringify({
          error: 'API key required',
          message: apiKeyValidation.message || 'Please create a Fictures API key with ai:use and stories:write scopes in Settings.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create agent chat
    let chat = chatId ? await getStudioAgentChat(chatId) : null;
    if (!chat && storyId) {
      chat = await createStudioAgentChat({
        userId: session.user.id,
        storyId,
        agentType: 'generation',
        title: message.content.slice(0, 50) + '...',
        context: { storyId },
      });
    }

    if (!chat) {
      return new Response('Chat not found and no storyId provided', { status: 400 });
    }

    // Load existing messages
    const existingMessages = await getStudioAgentMessages(chat.id);

    // Convert to AI SDK format
    const uiMessages = existingMessages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      parts: msg.parts as any,
    }));

    // Add new user message
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: message.content,
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
    // Note: Uses system GOOGLE_GENERATIVE_AI_API_KEY from environment (Gemini API calls)
    // User's Fictures API key is for authorization/scopes only
    const result = streamText({
      model: google('gemini-2.0-flash-exp'),
      system: AGENT_SYSTEM_PROMPT,
      messages: convertToCoreMessages(allMessages),
      tools: studioAgentTools,
      maxSteps: 10,

      async onStepFinish({ toolCalls, toolResults, text, finishReason }) {
        // Track tool executions
        if (toolCalls) {
          for (const toolCall of toolCalls) {
            await saveToolExecution({
              messageId: savedUserMessage.id,
              toolName: toolCall.toolName,
              toolInput: toolCall.args,
              status: 'executing',
            });
          }
        }

        if (toolResults) {
          for (const toolResult of toolResults) {
            // Find matching execution record and update
            await updateToolExecution({
              executionId: toolResult.toolCallId, // Assuming this maps to execution ID
              toolOutput: toolResult.result,
              status: 'completed',
            });
          }
        }
      },

      async onFinish({ text, toolCalls, toolResults }) {
        // Save assistant message with all parts
        const parts = [];

        if (text) {
          parts.push({ type: 'text', text });
        }

        toolCalls?.forEach(tc => {
          parts.push({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          });
        });

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
          reasoning: text,
        });
      },
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Studio Agent API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### 5.2 Chat History Endpoint

```typescript
// app/studio/api/agent/[chatId]/messages/route.ts
import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getStudioAgentMessages } from '@/lib/db/studio-agent-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get messages
    const messages = await getStudioAgentMessages(chatId);

    // Convert to UI format
    const uiMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: msg.parts,
      createdAt: msg.createdAt,
    }));

    return Response.json({ messages: uiMessages });

  } catch (error) {
    console.error('Get messages error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 5.3 Studio Page with Empty Story Creation

```typescript
// app/studio/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { stories } from '@/lib/schemas/database';
import { StudioHeader } from '@/components/studio/studio-header';
import { CreateNewStoryButton } from '@/components/studio/create-new-story-button';

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8">
      <StudioHeader />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Stories</h2>

        {/* Create New Story Button */}
        <CreateNewStoryButton userId={session.user.id} />

        {/* Existing stories list */}
        {/* ... */}
      </div>
    </div>
  );
}
```

### 5.4 Create New Story Button Component

```typescript
// components/studio/create-new-story-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

export function CreateNewStoryButton() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  async function handleCreateNewStory() {
    setIsCreating(true);

    try {
      // Navigate directly to agent chat page
      // The agent will handle story creation when generation begins
      router.push('/studio/agent/new');

    } catch (error) {
      console.error('Create story error:', error);
      alert('Failed to create new story. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Button
      onClick={handleCreateNewStory}
      disabled={isCreating}
      size="lg"
      className="w-full sm:w-auto"
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-5 w-5" />
          Create New Story
        </>
      )}
    </Button>
  );
}
```

### 5.5 Story Creation Flow

The story creation flow has been simplified to use the existing story generation APIs:

1. User clicks "Create New Story" button
2. User is navigated to `/studio/agent/new`
3. Agent chat interface loads
4. User interacts with agent to define story requirements
5. Agent creates story record using one of these endpoints:
   - `/studio/api/novels` - Complete novel generation with Adversity-Triumph Engine (recommended)
   - `/studio/api/story` - Story generation and save via story service

This approach eliminates the need for a separate create-empty API and integrates story creation directly into the generation workflow using the existing `/studio/api/story` and `/studio/api/novels` endpoints.

---

## Part VI: Frontend Components

### 6.1 Studio Agent Chat Page

```typescript
// app/studio/agent/[chatId]/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStudioAgentChat } from '@/lib/db/studio-agent-operations';
import { StudioAgentChat } from '@/components/studio/studio-agent-chat';

export default async function StudioAgentChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const { chatId } = await params;
  const chat = await getStudioAgentChat(chatId);

  if (!chat || chat.userId !== session.user.id) {
    return <div>Chat not found</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <StudioAgentChat
        chatId={chatId}
        storyId={chat.storyId!}
        agentType={chat.agentType as 'generation' | 'editing'}
      />
    </div>
  );
}
```

### 6.2 Studio Agent Chat Component

```typescript
// components/studio/studio-agent-chat.tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { AgentMessage } from './agent-message';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles } from 'lucide-react';

interface StudioAgentChatProps {
  chatId: string;
  storyId: string;
  agentType: 'generation' | 'editing';
}

export function StudioAgentChat({ chatId, storyId, agentType }: StudioAgentChatProps) {
  const [loadingHistory, setLoadingHistory] = useState(true);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: '/studio/api/agent',
    body: {
      chatId,
      storyId,
    },
  });

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const response = await fetch(`/studio/api/agent/${chatId}/messages`);
        if (response.ok) {
          const { messages: historyMessages } = await response.json();
          setMessages(historyMessages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, [chatId, setMessages]);

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
      <div className="border-b p-4 bg-background">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h1 className="text-lg font-semibold">Studio Agent</h1>
          <span className="text-sm text-muted-foreground">
            · Powered by Adversity-Triumph Engine
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 mx-auto text-purple-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Welcome to Story Creation!</h2>
              <p className="text-muted-foreground mb-4">
                I'll guide you through creating an emotionally resonant story using the
                Adversity-Triumph Engine methodology.
              </p>
              <p className="text-sm text-muted-foreground">
                Tell me about your story idea to get started...
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
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Tell me about your story idea, or ask me to continue with the next phase..."
              className="flex-1 resize-none min-h-[80px]"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="lg">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
}
```

### 6.3 Agent Message Component with Tool Visualization

```typescript
// components/studio/agent-message.tsx
'use client';

import { type Message } from 'ai';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Wrench, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ToolExecution {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  state: 'loading' | 'success' | 'error';
}

function ToolExecutionCard({ tool }: { tool: ToolExecution }) {
  const icons = {
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
    success: <CheckCircle className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-red-500" />,
  };

  return (
    <Card className="my-2 bg-muted/50">
      <CardHeader className="flex flex-row items-center gap-2 py-3">
        {icons[tool.state]}
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono text-sm font-semibold">{tool.toolName}</span>
      </CardHeader>
      {(tool.args || tool.result) && (
        <CardContent className="py-3">
          <div className="space-y-2">
            {tool.args && Object.keys(tool.args).length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Input:</div>
                <pre className="rounded bg-background p-2 text-xs overflow-x-auto border">
                  {JSON.stringify(tool.args, null, 2)}
                </pre>
              </div>
            )}
            {tool.result && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Output:</div>
                <pre className="rounded bg-background p-2 text-xs overflow-x-auto border">
                  {JSON.stringify(tool.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function AgentMessage({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  // Parse message parts for assistant messages
  const textParts: string[] = [];
  const toolExecutions: ToolExecution[] = [];

  if (!isUser && message.toolInvocations) {
    message.toolInvocations.forEach((invocation: any) => {
      const toolExecution: ToolExecution = {
        toolCallId: invocation.toolCallId,
        toolName: invocation.toolName,
        args: invocation.args,
        state: invocation.state === 'result' ? 'success' : 'loading',
      };

      if (invocation.state === 'result') {
        toolExecution.result = invocation.result;
      }

      toolExecutions.push(toolExecution);
    });
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block rounded-lg p-4 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              {/* Assistant's reasoning/text */}
              {message.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              )}

              {/* Tool executions */}
              {toolExecutions.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Tools Used:
                  </div>
                  {toolExecutions.map(tool => (
                    <ToolExecutionCard key={tool.toolCallId} tool={tool} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Part VII: Testing

### 7.1 E2E Test Suite

```typescript
// tests/studio-agent.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Studio Agent - Complete Story Generation Flow', () => {
  test.use({ storageState: '.auth/user.json' });

  test('Create new story and complete Phase 1: Story Summary', async ({ page }) => {
    // Navigate to studio
    await page.goto('http://localhost:3000/studio');

    // Click "Create New Story"
    await page.click('text=Create New Story');

    // Should redirect to agent chat
    await expect(page).toHaveURL(/\/studio\/agent\//);

    // Agent should greet user
    await expect(page.locator('text=Welcome to Story Creation')).toBeVisible();

    // User provides story idea
    await page.fill('textarea', 'A refugee woman starts a garden in a destroyed city');
    await page.click('button[type="submit"]');

    // Agent should start reasoning
    await expect(page.locator('text=analyze your story idea')).toBeVisible({ timeout: 10000 });

    // Agent should ask for confirmation before generation
    await expect(page.locator('text=Should I generate the story summary')).toBeVisible({
      timeout: 30000,
    });

    // User confirms
    await page.fill('textarea', 'Yes, generate the story summary');
    await page.click('button[type="submit"]');

    // Tool execution should be visible
    await expect(page.locator('text=generateStorySummary')).toBeVisible({ timeout: 10000 });

    // Wait for completion
    await expect(page.locator('text=Story Summary Complete')).toBeVisible({ timeout: 60000 });

    // Should show characters created
    await expect(page.locator('text=Yuna')).toBeVisible();
    await expect(page.locator('text=Jin')).toBeVisible();
  });

  test('Check prerequisites before generating chapters', async ({ page, context }) => {
    // Create story and chat (setup)
    // ... setup code

    // Try to generate chapters without completing characters
    await page.fill('textarea', 'Generate chapters for the story');
    await page.click('button[type="submit"]');

    // Agent should warn about missing prerequisites
    await expect(page.locator('text=Cannot proceed with chapters')).toBeVisible();
    await expect(page.locator('text=Missing: characters')).toBeVisible();

    // Agent should suggest completing prerequisites
    await expect(page.locator('text=complete characters first')).toBeVisible();
  });
});
```

---

## Part VIII: Usage Examples & Common Commands

### 8.1 Read Operations

**Story Information**:
```
Show me the story details
Get the current story summary
What's the story genre and tone?
Display the moral framework
```

**Chapter & Scene Access**:
```
Get the chapter with ID chapter_123
Show me scene scene_456
List all scenes in chapter_789
What's in the current chapter?
```

**Character & Setting Queries**:
```
List all characters in this story
Show me character Alice's profile
Get all settings for this story
Display setting "The Dark Forest"
```

### 8.2 Create Operations

**Adding Story Elements**:
```
Create a new part for Act II titled "Confrontation"
Add a chapter titled "The Journey Begins"
Create a scene in chapter_789 titled "The Discovery"
```

**Character & Setting Creation**:
```
Add a character named "Alice" as the protagonist
Create a new setting called "The Abandoned Castle"
Add a supporting character named "Marcus"
```

### 8.3 Update Operations

**Modifying Content**:
```
Update the story title to "The Last Garden"
Change the chapter summary to "Yuna discovers hope"
Update scene content with the virtue scene prose
Modify character Alice's internal flaw to include cause
```

**Refinement Requests**:
```
Improve the moral framework to be more specific
Add more sensory details to the setting
Strengthen the character's backstory
```

### 8.4 Delete Operations

**Removing Elements**:
```
Delete chapter chapter_123
Remove character char_456
Delete scene scene_789
Remove setting setting_999
```

**With Confirmation**:
```
Agent: "⚠️ Deleting chapter_123 will also delete 5 scenes (1,247 words).
Type 'DELETE chapter_123' to confirm."

User: "DELETE chapter_123"
```

---

## Part IX: Troubleshooting Guide

### 9.1 Agent Not Responding

**Symptoms**: No response after sending message, loading spinner indefinitely

**Solutions**:
1. **Check Dev Server**:
   ```bash
   # Verify dev server is running
   dotenv --file .env.local run pnpm dev

   # Check logs
   tail -f logs/dev-server.log
   ```

2. **Verify Authentication**:
   - Check if session is valid
   - Re-login if needed
   - Verify user has access to story

3. **Browser Console**:
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for network errors in Network tab

4. **Database Migration**:
   ```bash
   # Verify agent tables exist
   dotenv --file .env.local run pnpm db:studio

   # Re-run migrations if needed
   dotenv --file .env.local run pnpm db:migrate
   ```

### 9.2 Tool Execution Failures

**Symptoms**: Tool shows error state, red icon, error message

**Common Causes & Fixes**:

1. **Invalid Entity IDs**:
   ```
   Error: "Chapter ID 'invalid' doesn't exist"

   Fix: Use getStory tool to see valid IDs
   ```

2. **Missing Prerequisites**:
   ```
   Error: "Cannot create scene - chapter doesn't exist"

   Fix: Create chapter first, then create scene
   ```

3. **Database Connection Issues**:
   ```bash
   # Test database connection
   dotenv --file .env.local run psql $DATABASE_URL -c "SELECT 1"

   # Check connection string
   echo $DATABASE_URL
   ```

4. **Validation Errors**:
   ```
   Error: "Internal flaw must include CAUSE (use 'because')"

   Fix: Agent will suggest regeneration with correct format
   ```

### 9.3 Chat History Not Loading

**Symptoms**: Chat appears empty on page load, "Loading conversation..." stuck

**Solutions**:

1. **Verify Chat ID**:
   ```typescript
   // Check URL parameter
   /studio/agent/{chatId} <- chatId must be valid UUID
   ```

2. **Database Query**:
   ```sql
   -- Check if chat exists
   SELECT * FROM studio_agent_chats WHERE id = '{chatId}';

   -- Check messages
   SELECT * FROM studio_agent_messages WHERE chat_id = '{chatId}';
   ```

3. **Permission Check**:
   ```sql
   -- Verify user owns the chat
   SELECT * FROM studio_agent_chats
   WHERE id = '{chatId}' AND user_id = '{userId}';
   ```

4. **API Endpoint**:
   ```bash
   # Test messages endpoint
   curl http://localhost:3000/studio/api/agent/{chatId}/messages \
     -H "Cookie: {session-cookie}"
   ```

### 9.4 API Key Issues

**Symptoms**: "API key required" error, generation fails

**Solutions**:

1. **Add API Key**:
   - Go to `/settings`
   - Navigate to "AI Configuration"
   - Add Vercel AI Gateway API key
   - Agent will validate automatically

2. **Verify Key Encryption**:
   ```bash
   # Check ENCRYPTION_KEY exists
   echo $ENCRYPTION_KEY

   # Should be 32+ character random string
   ```

3. **Validate Key**:
   ```typescript
   // Test API key manually
   const isValid = await validateUserApiKey(userId);
   console.log('API key valid:', isValid);
   ```

### 9.5 Performance Issues

**Symptoms**: Slow responses, timeouts, UI lag

**Optimizations**:

1. **Database Indexes**:
   ```sql
   -- Verify indexes exist
   \d studio_agent_chats
   \d studio_agent_messages
   \d studio_agent_tool_executions
   ```

2. **Message Pagination**:
   ```typescript
   // Limit message history load
   const messages = await getStudioAgentMessages(chatId, 50); // Limit 50
   ```

3. **Streaming Optimization**:
   ```typescript
   // Check for backpressure
   // Monitor browser DevTools > Network > SSE connection
   ```

4. **Virtual Scrolling** (for long chats):
   - Implemented in `VirtualizedAgentMessages` component
   - Automatically activates for 100+ messages

---

## Part X: Environment Variables

```bash
# .env.local

# Database
DATABASE_URL="postgresql://..."

# Authentication
AUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# AI Integration (for Gemini API calls)
GOOGLE_GENERATIVE_AI_API_KEY="..." # Google AI API key

# Vercel Blob
BLOB_READ_WRITE_TOKEN="..."

# Redis (optional)
REDIS_URL="..."
```

**Note on API Keys**:
- **System AI Keys** (`GOOGLE_GENERATIVE_AI_API_KEY`): Used for actual Gemini API calls in generation
- **User Fictures API Keys** (stored in `api_keys` table): Used for authorization and scope checking (who can use what features)
- Studio Agent validates user has `ai:use` scope before allowing story generation
- Actual AI calls use system environment variables, not user API keys

---

## Part XI: Code Structure Reference

```
src/
├── app/studio/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── route.ts                    # Main agent chat endpoint
│   │   │   └── [chatId]/
│   │   │       └── messages/
│   │   │           └── route.ts            # Chat history endpoint
│   │   ├── stories/
│   │   │   └── route.ts                    # Story creation via novel generation
│   │   └── novels/
│   │       └── route.ts                    # Novel generation endpoint (creates story)
│   ├── agent/
│   │   ├── new/
│   │   │   └── page.tsx                    # New story agent chat page
│   │   └── [chatId]/
│   │       └── page.tsx                    # Existing chat page
│   ├── page.tsx                            # Studio home (with "Create New Story" button)
│   └── edit/
│       └── [storyId]/
│           └── page.tsx                    # Story editing page
│
├── components/studio/
│   ├── studio-agent-chat.tsx               # Main chat UI component
│   ├── agent-message.tsx                   # Message renderer with tool visualization
│   ├── generative-story-content.tsx        # Generative UI for story content
│   ├── virtualized-agent-messages.tsx      # Virtual scrolling for performance
│   ├── create-new-story-button.tsx         # "Create New Story" button
│   └── studio-header.tsx                   # Studio page header
│
├── hooks/
│   └── use-studio-agent-chat.ts            # Custom hook for agent chat state
│
├── lib/
│   ├── db/
│   │   ├── schema.ts                       # Database schema (users, stories, etc.)
│   │   ├── studio-agent-schema.ts          # Agent-specific tables
│   │   ├── studio-agent-operations.ts      # Agent chat database operations
│   │   └── user-api-key-operations.ts      # API key management
│   ├── studio/
│   │   ├── agent-tools.ts                  # Combined tool export
│   │   ├── agent-crud-tools.ts             # Database CRUD tools
│   │   ├── agent-generation-tools.ts       # Novel generation integration
│   │   ├── agent-advisory-tools.ts         # Validation and advisory
│   │   └── agent-utility-tools.ts          # API key, progress tracking
│   ├── crypto.ts                           # Encryption utilities
│   └── novels/
│       ├── story-summary-generator.ts      # Phase 1 generation
│       ├── character-generator.ts          # Phase 2 generation
│       ├── setting-generator.ts            # Phase 3 generation
│       └── ...                             # Other generation modules
│
└── tests/
    └── studio-agent.spec.ts                # E2E tests
```

---

## Part XII: Security Considerations

### 12.1 Authentication & Authorization

**User Access Control**:
```typescript
// Verify user owns the story
const story = await getStoryById(storyId);
if (story.userId !== session.user.id) {
  return new Response('Unauthorized', { status: 403 });
}
```

**Chat Ownership**:
```typescript
// Verify user owns the chat
const chat = await getStudioAgentChat(chatId);
if (chat.userId !== session.user.id) {
  return new Response('Unauthorized', { status: 403 });
}
```

### 12.2 Data Protection

**Fictures API Key Security**:
- SHA-256 hashing (one-way, irreversible)
- Full keys NEVER stored in database
- Only hash and prefix stored
- Scope-based permission system
- Expiration date support
- Never exposed to client (except during initial creation)

**SQL Injection Prevention**:
- All queries use Drizzle ORM
- Parameterized queries only
- No raw SQL with user input

**Input Validation**:
- Zod schemas for all tool parameters
- Type checking at runtime
- Sanitization before database operations

### 12.3 Cascade Delete Protection

**Confirmation Required**:
```typescript
// Agent warns before destructive operations
if (tool === 'deletePart' || tool === 'deleteChapter') {
  // Show cascade warning
  // Require explicit confirmation
  // Log deletion for audit
}
```

---

## Part XIII: Performance Optimization

### 13.1 Database Query Optimization

**Indexed Columns**:
- `studio_agent_chats.user_id`
- `studio_agent_chats.story_id`
- `studio_agent_chats.current_phase`
- `studio_agent_messages.chat_id`
- `studio_agent_messages.created_at`
- `studio_agent_tool_executions.message_id`
- `studio_agent_tool_executions.tool_name`

**Query Patterns**:
```typescript
// Efficient: Single query with joins
const chat = await db.query.studioAgentChats.findFirst({
  where: eq(studioAgentChats.id, chatId),
  with: {
    messages: {
      limit: 50,
      orderBy: desc(studioAgentMessages.createdAt),
    },
  },
});

// Avoid: N+1 queries
// Don't fetch messages in loop
```

### 13.2 Streaming Optimization

**Backpressure Handling**:
```typescript
// lib/studio/streaming-utils.ts
export function createBackpressureHandler(maxBufferSize = 100) {
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
  };
}
```

### 13.3 Frontend Optimization

**Virtual Scrolling**:
- Activates for 100+ messages
- Reduces DOM nodes by 90%+
- Improves scroll performance

**Lazy Loading**:
- Load chat history on demand
- Paginate old messages
- Cursor-based pagination

**Debouncing**:
- Input debounce: 300ms
- Prevents excessive API calls
- Improves UX

---

## Part XIV: Monitoring & Logging

### 14.1 Tool Execution Tracking

**Database Audit Trail**:
```sql
-- View recent tool executions
SELECT
  te.tool_name,
  te.status,
  te.execution_time_ms,
  te.created_at,
  m.role,
  m.content
FROM studio_agent_tool_executions te
JOIN studio_agent_messages m ON te.message_id = m.id
ORDER BY te.created_at DESC
LIMIT 100;
```

**Performance Monitoring**:
```typescript
// Track tool execution time
const startTime = Date.now();
const result = await tool.execute(params);
const executionTime = Date.now() - startTime;

await saveToolExecution({
  messageId,
  toolName: tool.name,
  executionTimeMs: executionTime,
});
```

### 14.2 Error Logging

**Agent Errors**:
```typescript
// Log errors with context
console.error('Studio Agent error:', {
  chatId,
  userId,
  error: error.message,
  stack: error.stack,
  toolName: currentTool?.name,
});
```

**User-Facing Errors**:
- Display friendly error messages
- Provide actionable recovery steps
- Log technical details server-side

---

## Conclusion

This comprehensive development guide provides everything needed to implement the Studio Agent system, from database schema to production deployment.

**Key Implementation Steps**:
1. **Database**: Run migrations for agent tables and user API key extension
2. **Backend**: Implement API routes and agent tools
3. **Frontend**: Build agent chat UI with tool visualization
4. **Testing**: Write E2E tests for generation workflow
5. **Deployment**: Configure environment variables and deploy

**Estimated Development Time**: 6-8 weeks
- Week 1-2: Database schema and CRUD tools
- Week 3-4: Generation tools and API routes
- Week 5-6: Frontend components and UX
- Week 7-8: Testing, refinement, and deployment

**Production Readiness Checklist**:
- ✅ Database migrations run successfully
- ✅ All agent tools implemented and tested
- ✅ API key encryption configured
- ✅ E2E tests passing
- ✅ Performance optimizations applied
- ✅ Error handling comprehensive
- ✅ Security measures validated
- ✅ Monitoring and logging in place

**Next Steps**: Begin with database migration and CRUD tool implementation, then progressively add generation capabilities.

**Support Resources**:
- 📋 Specification: `docs/studio/studio-agent-specification.md`
- 📖 Novel Methodology: `docs/novels/novels-specification.md`
- 🔧 Novel APIs: `docs/novels/novels-development.md`
