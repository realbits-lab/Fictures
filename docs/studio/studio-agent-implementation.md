# Studio Agent Implementation Guide

## Overview

The Studio Agent is an AI-powered editing assistant integrated into the `/studio/edit/story` page. It provides database CRUD operations for managing stories, parts, chapters, scenes, characters, and settings through a beautiful chat interface.

## Architecture

### Components

1. **Database Layer** (`src/lib/db/schema.ts`)
   - `studio_agent_chats` - Chat sessions
   - `studio_agent_messages` - Messages with tool invocations
   - `studio_agent_tool_executions` - Tool execution tracking

2. **Backend API** (`src/app/api/studio/agent/route.ts`)
   - Gemini 2.0 Flash model for multi-step reasoning
   - CRUD tools integration
   - Message persistence
   - Tool execution tracking

3. **CRUD Tools** (`src/lib/studio/agent-crud-tools.ts`)
   - Story: getStory, updateStory
   - Part: getPart, createPart, updatePart, deletePart
   - Chapter: getChapter, createChapter, updateChapter, deleteChapter
   - Scene: getScene, createScene, updateScene, deleteScene
   - Character: getCharacter, createCharacter, updateCharacter, deleteCharacter
   - Setting: getSetting, createSetting, updateSetting, deleteSetting

4. **Frontend Components**
   - Custom hook: `src/hooks/use-studio-agent-chat.ts`
   - Chat UI: `src/components/studio/studio-agent-chat.tsx`
   - Integration: `src/components/writing/UnifiedWritingEditor.tsx`

## Database Schema

```sql
-- Studio Agent Chats
CREATE TABLE studio_agent_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id text REFERENCES stories(id) ON DELETE CASCADE,
  agent_type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  context json,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

-- Studio Agent Messages
CREATE TABLE studio_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES studio_agent_chats(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL,
  content text NOT NULL,
  parts json,
  reasoning text,
  created_at timestamp DEFAULT now() NOT NULL
);

-- Studio Agent Tool Executions
CREATE TABLE studio_agent_tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES studio_agent_messages(id) ON DELETE CASCADE,
  tool_name varchar(100) NOT NULL,
  tool_input json NOT NULL,
  tool_output json,
  status varchar(20) NOT NULL,
  error text,
  execution_time_ms integer,
  created_at timestamp DEFAULT now() NOT NULL,
  completed_at timestamp
);
```

## Usage Examples

### Example Commands

1. **Read Operations**
   ```
   Show me the story details
   Get the chapter with ID chapter_123
   List all characters in this story
   Show me scene scene_456
   ```

2. **Create Operations**
   ```
   Create a new chapter titled "The Journey Begins"
   Add a character named "Alice" as a main character
   Create a new scene in chapter_789 titled "The Confrontation"
   Add a setting called "The Dark Forest"
   ```

3. **Update Operations**
   ```
   Update the story title to "My Epic Adventure"
   Change the chapter summary to "A new beginning"
   Update scene content with "The hero enters the dark cave..."
   Modify character Alice's role to "protagonist"
   ```

4. **Delete Operations**
   ```
   Delete chapter chapter_123
   Remove character char_456
   Delete scene scene_789
   Remove setting setting_999
   ```

## Features

### 1. Tool Visualization
- Real-time display of tool executions
- Input/output transparency
- Success/error states
- Execution time tracking

### 2. Multi-Step Reasoning
- Agent explains its thought process
- Breaks down complex tasks
- Shows chain of reasoning
- Maximum 10 reasoning steps

### 3. Beautiful UI
- Gradient avatar icons (Bot & User)
- Color-coded tool states:
  - Blue: Running
  - Green: Success
  - Red: Error
- Shadcn components throughout
- Responsive design

### 4. Persistent Chat History
- All conversations saved to database
- Resume conversations across sessions
- Tool executions tracked
- Complete audit trail

## Integration

The agent is integrated into `/studio/edit/story/[storyId]` page in the right sidebar:

```tsx
<StudioAgentChat
  storyId={story.id}
  storyContext={{
    storyTitle: story.title,
    currentSelection: currentSelection,
    genre: story.genre,
    status: story.status,
  }}
  className="flex-1"
/>
```

## API Endpoint

**POST** `/studio/api/agent`

Request body:
```json
{
  "chatId": "optional-chat-id",
  "message": {
    "content": "Show me the story details"
  },
  "storyContext": {
    "storyId": "story_123",
    "storyTitle": "My Story",
    "currentSelection": { "level": "story", "storyId": "story_123" }
  }
}
```

Response: Server-Sent Events (SSE) stream with chat ID in headers

## Development

### Running Migrations

```bash
dotenv --file .env.local run psql $POSTGRES_URL -f drizzle/0000_studio_agent_tables.sql
```

### Testing

1. Navigate to `/studio/edit/story/[storyId]`
2. Look for the agent chat in the right sidebar
3. Try example commands
4. Verify tool executions in the UI
5. Check database for persisted data

### Monitoring

- Tool executions are logged to console
- Message persistence tracked
- Execution times recorded
- Error states displayed in UI

## Security

- Authentication required (NextAuth.js)
- User-owned story access only
- Cascade delete on user/story deletion
- SQL injection prevention via Drizzle ORM
- Input validation via Zod schemas

## Performance

- Edge runtime for optimal performance
- 60-second max duration for long operations
- Indexed database tables for fast queries
- Streaming responses for real-time feedback

## Limitations

1. Maximum 10 reasoning steps per request
2. No file upload support (yet)
3. No image generation (yet)
4. Read-only access to read-only fields
5. Cascade deletes require confirmation in UI

## Future Enhancements

1. **Advanced Tools**
   - Scene generation with AI
   - Character profile AI generation
   - Story outline AI assistance
   - Plot hole detection

2. **Collaboration**
   - Multi-user chat sessions
   - Shared editing sessions
   - Comment/review system

3. **Analytics**
   - Tool usage statistics
   - Popular commands
   - Error rate tracking
   - Performance metrics

4. **Voice Input**
   - Speech-to-text integration
   - Voice commands
   - Audio responses

## Troubleshooting

### Agent not responding
1. Check dev server is running
2. Verify authentication is valid
3. Check browser console for errors
4. Verify database migration ran successfully

### Tool execution failures
1. Check database connection
2. Verify entity IDs are correct
3. Review tool input parameters
4. Check error logs in browser console

### Chat history not loading
1. Verify chat ID is valid
2. Check database tables exist
3. Ensure user has permission
4. Review API endpoint logs

## Code Structure

```
src/
├── app/studio/api/agent/
│   └── route.ts                 # Agent API endpoint
├── components/studio/
│   └── studio-agent-chat.tsx    # Chat UI component
├── hooks/
│   └── use-studio-agent-chat.ts # Custom chat hook
├── lib/
│   ├── db/
│   │   ├── schema.ts            # Database schema
│   │   └── studio-agent-operations.ts  # DB operations
│   └── studio/
│       └── agent-crud-tools.ts  # CRUD tools definition
└── test-scripts/
    └── test-studio-agent.mjs    # Test script
```

## Related Documentation

- [Studio Agent Chat System Specification](./studio-agent-chat.md) - Original design doc
- [Database Schema](../../src/lib/db/schema.ts) - Full schema definition
- [CRUD Tools](../../src/lib/studio/agent-crud-tools.ts) - Tool implementations
- [API Route](../../src/app/api/studio/agent/route.ts) - Backend logic

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Test with example commands
4. Verify database state
5. Contact development team
