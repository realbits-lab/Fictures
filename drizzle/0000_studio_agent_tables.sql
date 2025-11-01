-- Studio Agent Tables Migration
-- Creates tables for AI-powered story editing assistant

-- Studio Agent Chats - Track agent conversation sessions
CREATE TABLE IF NOT EXISTS "studio_agent_chats" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "story_id" text REFERENCES "stories"("id") ON DELETE CASCADE,
  "agent_type" varchar(50) NOT NULL,
  "title" varchar(255) NOT NULL,
  "context" json,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Studio Agent Messages - Individual messages in chat sessions
CREATE TABLE IF NOT EXISTS "studio_agent_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chat_id" uuid NOT NULL REFERENCES "studio_agent_chats"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL,
  "content" text NOT NULL,
  "parts" json,
  "reasoning" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Studio Agent Tool Executions - Track tool usage and results
CREATE TABLE IF NOT EXISTS "studio_agent_tool_executions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "message_id" uuid NOT NULL REFERENCES "studio_agent_messages"("id") ON DELETE CASCADE,
  "tool_name" varchar(100) NOT NULL,
  "tool_input" json NOT NULL,
  "tool_output" json,
  "status" varchar(20) NOT NULL,
  "error" text,
  "execution_time_ms" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "studio_agent_chats_user_id_idx" ON "studio_agent_chats" ("user_id");
CREATE INDEX IF NOT EXISTS "studio_agent_chats_story_id_idx" ON "studio_agent_chats" ("story_id");
CREATE INDEX IF NOT EXISTS "studio_agent_chats_agent_type_idx" ON "studio_agent_chats" ("agent_type");
CREATE INDEX IF NOT EXISTS "studio_agent_messages_chat_id_idx" ON "studio_agent_messages" ("chat_id");
CREATE INDEX IF NOT EXISTS "studio_agent_messages_created_at_idx" ON "studio_agent_messages" ("created_at");
CREATE INDEX IF NOT EXISTS "studio_agent_tool_executions_message_id_idx" ON "studio_agent_tool_executions" ("message_id");
CREATE INDEX IF NOT EXISTS "studio_agent_tool_executions_tool_name_idx" ON "studio_agent_tool_executions" ("tool_name");
