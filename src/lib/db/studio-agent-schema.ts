import { pgTable, uuid, text, timestamp, jsonb, varchar, index, integer } from 'drizzle-orm/pg-core';
import { users, stories } from './schema';

// Studio Agent Chats - Track agent conversation sessions
export const studioAgentChats = pgTable('studio_agent_chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }), // Required - created on "Create New Story"
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

// Studio Agent Messages - Individual messages in chat sessions
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

// Studio Agent Tool Executions - Track tool usage and results
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

// TypeScript types for type safety
export type StudioAgentChat = typeof studioAgentChats.$inferSelect;
export type NewStudioAgentChat = typeof studioAgentChats.$inferInsert;
export type StudioAgentMessage = typeof studioAgentMessages.$inferSelect;
export type NewStudioAgentMessage = typeof studioAgentMessages.$inferInsert;
export type StudioAgentToolExecution = typeof studioAgentToolExecutions.$inferSelect;
export type NewStudioAgentToolExecution = typeof studioAgentToolExecutions.$inferInsert;
