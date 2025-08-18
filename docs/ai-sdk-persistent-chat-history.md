# AI SDK Chat History with Neon Database Implementation

This guide explains how to implement persistent chat history using Vercel AI SDK v5 with Neon Database for storage, providing true database persistence instead of memory-based caching.

## Problem Statement

By default, the Vercel AI SDK stores chat messages in memory, which means:
- No persistence across browser sessions
- Users cannot revisit previous conversations
- Chat history is lost on page refresh

## Solution: Neon Database Persistent History

Neon Database provides an ideal solution for storing chat histories because:
- True database persistence with ACID compliance
- Serverless PostgreSQL optimized for edge environments
- Native Drizzle ORM integration with type safety
- Built-in connection pooling and auto-scaling
- Cost-effective with pay-per-use pricing
- Better data consistency than memory-based solutions

## Setup and Configuration

### 1. Environment Variables

Add Neon database connection URL to your `.env.local`:

```env
DATABASE_URL=your_neon_database_url
```

### 2. Install Dependencies

```bash
pnpm add @neondatabase/serverless drizzle-orm
pnpm add -D drizzle-kit
```

### 3. Database Schema Setup

Create chat-specific tables using Drizzle ORM:

```typescript
// lib/db/chat-schema.ts
import { pgTable, uuid, text, timestamp, jsonb, varchar, index } from 'drizzle-orm/pg-core';

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('chats_user_id_idx').on(table.userId),
}));

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  parts: jsonb('parts'), // AI SDK message parts
  attachments: jsonb('attachments'), // File attachments
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  chatIdIdx: index('chat_messages_chat_id_idx').on(table.chatId),
  createdAtIdx: index('chat_messages_created_at_idx').on(table.createdAt),
}));

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
```

### 4. Database Client Setup

```typescript
// lib/db/neon-client.ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './chat-schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

## Backend Implementation

### 5. Database Operations Utility

```typescript
// lib/db/chat-operations.ts
import { eq, desc } from 'drizzle-orm';
import { db } from './neon-client';
import { chats, chatMessages, type Chat, type ChatMessage, type NewChat, type NewChatMessage } from './chat-schema';
import { generateId } from 'ai';

export async function createChat(userId: string, title: string): Promise<Chat> {
  const [chat] = await db
    .insert(chats)
    .values({
      id: generateId(),
      userId,
      title,
    })
    .returning();
  
  return chat;
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  
  return chat || null;
}

export async function getChatsByUserId(userId: string): Promise<Chat[]> {
  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, userId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(chatMessages.createdAt);
}

export async function saveChatMessage(message: NewChatMessage): Promise<ChatMessage> {
  const [savedMessage] = await db
    .insert(chatMessages)
    .values({
      ...message,
      id: generateId(),
    })
    .returning();
  
  return savedMessage;
}

export async function saveChatMessages(messages: NewChatMessage[]): Promise<ChatMessage[]> {
  if (messages.length === 0) return [];
  
  return await db
    .insert(chatMessages)
    .values(messages.map(msg => ({
      ...msg,
      id: generateId(),
    })))
    .returning();
}
```

### API Route Structure

Update the existing chat API route to use Neon database:

```typescript
// app/api/chat/route.ts (modified for Neon)
import { createIdGenerator, convertToCoreMessages, streamText } from 'ai';
import { auth } from '@/app/auth';
import { NextRequest } from 'next/server';
import { createChat, getChatById, getChatMessages, saveChatMessages } from '@/lib/db/chat-operations';
import { myProvider } from '@/lib/ai/providers';

const generateId = createIdGenerator();

export async function POST(request: NextRequest) {
  const { id: chatId, message, selectedChatModel } = await request.json();
  
  // Authentication
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get or create chat
  let chat = await getChatById(chatId);
  if (!chat) {
    // Create new chat with title generation
    const title = message.content.slice(0, 50) + '...';
    chat = await createChat(session.user.id, title);
  }

  // Load existing messages
  const existingMessages = await getChatMessages(chatId);
  
  // Convert to AI SDK format
  const uiMessages = existingMessages.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    parts: msg.parts as any,
    attachments: msg.attachments as any,
    createdAt: msg.createdAt,
  }));

  // Add new user message
  const userMessage = {
    id: generateId(),
    role: 'user' as const,
    content: message.content,
    parts: message.parts,
    createdAt: new Date(),
  };

  const allMessages = [...uiMessages, userMessage];

  // Save user message immediately
  await saveChatMessage({
    chatId: chat.id,
    role: 'user',
    content: message.content,
    parts: message.parts,
    attachments: message.attachments || [],
  });

  // Process with AI
  const result = await streamText({
    model: myProvider.languageModel(selectedChatModel),
    messages: convertToCoreMessages(allMessages),
    onFinish: async ({ text, usage }) => {
      // Save assistant message
      await saveChatMessage({
        chatId: chat.id,
        role: 'assistant',
        content: text,
        parts: [{ type: 'text', text }],
        attachments: [],
      });
    },
  });

  return result.toDataStreamResponse();
}
```

### Loading Chat History

Create endpoints to load chat history and user chats:

```typescript
// app/api/chat/[id]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getChatById, getChatMessages } from '@/lib/db/chat-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;
  
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Verify chat ownership
  const chat = await getChatById(chatId);
  if (!chat || chat.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // Get chat messages
  const messages = await getChatMessages(chatId);
  
  // Convert to AI SDK format
  const uiMessages = messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    parts: msg.parts,
    attachments: msg.attachments,
    createdAt: msg.createdAt,
  }));

  return NextResponse.json({ messages: uiMessages });
}
```

```typescript
// app/api/chats/route.ts - List user's chats
import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getChatsByUserId } from '@/lib/db/chat-operations';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const chats = await getChatsByUserId(session.user.id);
  return NextResponse.json({ chats });
}
```

## Frontend Implementation

### Database Migration

Create Drizzle migration for chat tables:

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/chat-schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Run migrations:
```bash
pnpm dlx drizzle-kit generate
pnpm dlx drizzle-kit migrate
```

### Chat Hook with Neon Persistence

```typescript
// hooks/use-persistent-chat.ts
'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';
import { generateId } from 'ai';
import type { ChatMessage } from '@/lib/types';

interface UsePersistentChatProps {
  chatId: string;
  initialMessages?: ChatMessage[];
}

export function usePersistentChat({ chatId, initialMessages = [] }: UsePersistentChatProps) {
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const chat = useChat({
    id: chatId,
    api: '/api/chat',
    initialMessages: historyLoaded ? initialMessages : [],
    body: {
      id: chatId,
    },
    onFinish: async () => {
      // Optionally refresh chat list or update last message time
    },
  });

  // Load chat history on mount
  useEffect(() => {
    if (historyLoaded || !chatId) return;

    async function loadChatHistory() {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/chat/${chatId}/messages`);
        if (response.ok) {
          const { messages } = await response.json();
          chat.setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
        setHistoryLoaded(true);
      }
    }

    loadChatHistory();
  }, [chatId, historyLoaded, chat]);

  return {
    ...chat,
    loadingHistory,
    historyLoaded,
  };
}
```

### Chat Component Implementation

```typescript
// components/chat-with-persistence.tsx
'use client';

import { usePersistentChat } from '@/hooks/use-persistent-chat';
import { Messages } from '@/components/messages';
import { MultimodalInput } from '@/components/multimodal-input';

interface ChatWithPersistenceProps {
  chatId: string;
  initialMessages?: any[];
}

export function ChatWithPersistence({ 
  chatId, 
  initialMessages = [] 
}: ChatWithPersistenceProps) {
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    loadingHistory,
    historyLoaded,
    setMessages,
    append,
    stop
  } = usePersistentChat({ 
    chatId, 
    initialMessages 
  });

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading chat history...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <Messages
          chatId={chatId}
          messages={messages}
          setMessages={setMessages}
          isLoading={isLoading}
          votes={[]} // Add vote integration if needed
          isReadonly={false}
        />
      </div>
      
      <div className="border-t bg-background p-4">
        <MultimodalInput
          input={input}
          setInput={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          stop={stop}
          attachments={[]} // Add attachment handling if needed
          setAttachments={() => {}} // Add attachment handling if needed
          append={append}
        />
      </div>
    </div>
  );
}
```

### Chat List Component

```typescript
// components/chat-list.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export function ChatList() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const { chats } = await response.json();
          setChats(chats);
        }
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadChats();
  }, []);

  if (loading) {
    return <div>Loading chats...</div>;
  }

  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <Link 
          key={chat.id} 
          href={`/chat/${chat.id}`}
          className="block p-3 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="font-medium truncate">{chat.title}</div>
          <div className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
          </div>
        </Link>
      ))}
    </div>
  );
}
```

## Key Implementation Details

### Database Optimization

Key performance optimizations for Neon:

```typescript
// Use indexes for frequent queries
// chat_messages_chat_id_idx - for loading chat messages
// chat_messages_created_at_idx - for ordering messages
// chats_user_id_idx - for loading user's chats

// Batch operations where possible
export async function saveBatchMessages(messages: NewChatMessage[]) {
  return await db.insert(chatMessages).values(messages).returning();
}

// Use pagination for large chat histories
export async function getChatMessagesPaginated(chatId: string, limit = 50, offset = 0) {
  return await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatId, chatId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .offset(offset);
}
```

### Error Handling and Fallbacks

```typescript
// Graceful error handling with fallbacks
export async function getChatMessagesWithFallback(chatId: string) {
  try {
    return await getChatMessages(chatId);
  } catch (error) {
    console.error('Database error loading messages:', error);
    // Return empty array as fallback
    return [];
  }
}

// Connection retry logic
const sql = neon(process.env.DATABASE_URL!, {
  poolQueryViaFetch: true, // Use HTTP for better edge compatibility
});
```

### Message Validation

Implement proper message validation:

```typescript
import { z } from 'zod';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(10000),
  parts: z.array(z.any()).optional(),
  attachments: z.array(z.any()).optional(),
});

export function validateMessage(message: unknown) {
  return messageSchema.safeParse(message);
}
```

### Session Management

Enhanced chat session management:

```typescript
// lib/chat-utils.ts
import { generateId } from 'ai';

export function createChatId(): string {
  return generateId(); // Uses AI SDK's ID generator
}

export function generateChatTitle(firstMessage: string): string {
  const title = firstMessage
    .slice(0, 50)
    .trim()
    .replace(/\s+/g, ' ');
  
  return title + (firstMessage.length > 50 ? '...' : '');
}
```

## Benefits of This Approach

1. **True Persistence**: Database storage ensures data never lost
2. **ACID Compliance**: Transactions guarantee data consistency
3. **Scalability**: Neon auto-scales based on usage
4. **Type Safety**: Full TypeScript integration with Drizzle ORM
5. **Edge Optimized**: Works perfectly with Vercel Edge Functions
6. **Cost Effective**: Pay-per-use pricing with generous free tier
7. **Query Flexibility**: Complex queries for analytics and search
8. **Backup & Recovery**: Built-in database backup capabilities

## Advanced Features

### Message Search and Analytics

```typescript
// Advanced queries for chat analytics
export async function searchMessages(userId: string, query: string) {
  return await db
    .select({
      messageId: chatMessages.id,
      chatId: chatMessages.chatId,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
      chatTitle: chats.title,
    })
    .from(chatMessages)
    .innerJoin(chats, eq(chatMessages.chatId, chats.id))
    .where(
      and(
        eq(chats.userId, userId),
        sql`${chatMessages.content} ILIKE ${`%${query}%`}`
      )
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(20);
}
```

### Chat Statistics

```typescript
// Get user's chat statistics
export async function getChatStats(userId: string) {
  const stats = await db
    .select({
      totalChats: sql<number>`COUNT(DISTINCT ${chats.id})`,
      totalMessages: sql<number>`COUNT(${chatMessages.id})`,
      avgMessagesPerChat: sql<number>`AVG(message_count)`,
    })
    .from(chats)
    .leftJoin(chatMessages, eq(chats.id, chatMessages.chatId))
    .where(eq(chats.userId, userId));
    
  return stats[0];
}
```

### Backup and Export

```typescript
// Export chat data for backup
export async function exportUserChats(userId: string) {
  return await db
    .select()
    .from(chats)
    .leftJoin(chatMessages, eq(chats.id, chatMessages.chatId))
    .where(eq(chats.userId, userId))
    .orderBy(chats.createdAt, chatMessages.createdAt);
}
```

---

## Implementation Plan for Fictures Chat System

### Migration from Current System to Neon Database

**Current Architecture Analysis:**
- PostgreSQL database with Drizzle ORM (existing)
- Complex message schema in `Message_v2` table
- Redis only for stream resumption
- Advanced chat functionality already implemented

### Recommended Approach: Extend Current Database

**Strategy:** Add dedicated chat tables alongside existing message system

**Benefits:**
- Leverages existing Neon/PostgreSQL infrastructure
- No Redis dependency required
- True database persistence with ACID compliance
- Maintains existing functionality
- Better separation of concerns

### Implementation Plan

**Phase 1: Database Schema Extension (30 minutes)**

1. **Add Chat Tables to Existing Schema**
```bash
# Add to existing drizzle.config.ts
pnpm dlx drizzle-kit generate
pnpm dlx drizzle-kit migrate
```

2. **Update Database Operations**
- Extend `lib/db/queries.ts` with chat-specific operations
- Maintain existing message system for other features
- Add chat-specific indexes for performance

**Phase 2: API Route Enhancement (45 minutes)**

3. **Modify Chat API Routes**
- Update `/api/chat/route.ts` to use dedicated chat tables
- Create `/api/chat/[id]/messages/route.ts` for message loading
- Add `/api/chats/route.ts` for chat list management

**Phase 3: Frontend Integration (30 minutes)**

4. **Update Chat Components**
- Create `usePersistentChat` hook
- Update existing chat components to use new persistence
- Add chat list sidebar for navigation

**Phase 4: Testing & Migration (15 minutes)**

5. **Data Migration** (Optional)
- Migrate existing chat data from current system
- Validate data integrity
- Performance testing

### Success Criteria

**Performance Targets:**
- Chat history loads in <200ms
- Supports unlimited message history
- Efficient pagination for large chats

**Functionality Requirements:**
- Full compatibility with existing AI SDK integration
- Maintains all current chat features
- Adds persistent chat history across sessions
- Zero data loss during implementation

### Benefits of Neon Database Approach

1. **True Persistence**: Never lose chat history
2. **Scalability**: Handle millions of messages efficiently  
3. **Cost Effective**: Pay only for actual usage
4. **Edge Optimized**: Perfect for Vercel deployments
5. **Type Safety**: Full TypeScript support with Drizzle
6. **Analytics Ready**: Complex queries for insights
7. **Backup & Recovery**: Enterprise-grade data protection
8. **ACID Compliance**: Guaranteed data consistency

This approach provides robust, scalable persistent chat history using Neon database while maintaining the performance and reliability of your existing Fictures application.

## Performance Optimization Strategies

### Frontend Performance Optimization

#### 1. Virtual Scrolling for Large Message Lists

For chat applications with hundreds or thousands of messages, virtual scrolling is crucial for performance:

```bash
pnpm add @tanstack/react-virtual
# or
pnpm add react-window react-window-infinite-loader
```

**TanStack Virtual Implementation:**

```typescript
// components/virtualized-messages.tsx
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Message } from '@/components/message';
import type { ChatMessage } from '@/lib/types';

interface VirtualizedMessagesProps {
  messages: ChatMessage[];
  chatId: string;
  isLoading: boolean;
  loadMore?: () => void;
  hasMore?: boolean;
}

export function VirtualizedMessages({ 
  messages, 
  chatId, 
  isLoading,
  loadMore,
  hasMore 
}: VirtualizedMessagesProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 10, // Render 10 extra items outside viewport
    getItemKey: (index) => messages[index]?.id || index,
  });

  return (
    <div 
      ref={parentRef}
      className="h-full overflow-auto"
      style={{
        contain: 'strict', // CSS containment for better performance
      }}
    >
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
              <Message
                chatId={chatId}
                message={message}
                isLoading={isLoading && virtualItem.index === messages.length - 1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### 2. Reverse Infinite Scroll for Chat History

Implement reverse scrolling to load older messages at the top:

```typescript
// hooks/use-infinite-chat-messages.ts
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';

interface UseInfiniteChatMessagesProps {
  chatId: string;
  pageSize?: number;
}

export function useInfiniteChatMessages({ 
  chatId, 
  pageSize = 50 
}: UseInfiniteChatMessagesProps) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['chat-messages', chatId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await fetch(
        `/api/chat/${chatId}/messages?offset=${pageParam}&limit=${pageSize}`
      );
      return response.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.messages.length === pageSize 
        ? allPages.length * pageSize 
        : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all pages into single array
  useEffect(() => {
    if (data?.pages) {
      const messages = data.pages.flatMap(page => page.messages).reverse();
      setAllMessages(messages);
    }
  }, [data]);

  const loadOlderMessages = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    messages: allMessages,
    loadOlderMessages,
    hasOlderMessages: hasNextPage,
    isLoadingOlder: isFetchingNextPage,
    isLoading,
  };
}
```

#### 3. Message Memoization and Performance

Optimize message rendering with React.memo and proper key strategies:

```typescript
// components/optimized-message.tsx
'use client';

import React, { memo } from 'react';
import { Message } from '@/components/message';
import type { ChatMessage } from '@/lib/types';

interface OptimizedMessageProps {
  message: ChatMessage;
  chatId: string;
  isLoading?: boolean;
  index: number;
}

export const OptimizedMessage = memo<OptimizedMessageProps>(
  ({ message, chatId, isLoading, index }) => {
    return (
      <Message
        chatId={chatId}
        message={message}
        isLoading={isLoading}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.index === nextProps.index
    );
  }
);

OptimizedMessage.displayName = 'OptimizedMessage';
```

### Backend Performance Optimization

#### 4. Database Query Optimization

**Pagination with Cursor-based Loading:**

```typescript
// lib/db/chat-operations-optimized.ts
import { sql, desc, lt, gte } from 'drizzle-orm';
import { db } from './neon-client';
import { chatMessages } from './chat-schema';

export async function getChatMessagesPaginated(
  chatId: string,
  limit = 50,
  cursor?: string
) {
  const query = db
    .select()
    .from(chatMessages)
    .where(
      cursor
        ? sql`${chatMessages.chatId} = ${chatId} AND ${chatMessages.createdAt} < ${cursor}`
        : sql`${chatMessages.chatId} = ${chatId}`
    )
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);

  const messages = await query;
  
  return {
    messages: messages.reverse(), // Return in chronological order
    nextCursor: messages.length === limit 
      ? messages[0]?.createdAt.toISOString() 
      : null,
    hasMore: messages.length === limit,
  };
}

// Optimized batch insert with transaction
export async function saveChatMessagesBatch(messages: NewChatMessage[]) {
  if (messages.length === 0) return [];
  
  return await db.transaction(async (tx) => {
    const chunks = [];
    const chunkSize = 100; // Process in chunks of 100
    
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      const result = await tx
        .insert(chatMessages)
        .values(chunk.map(msg => ({
          ...msg,
          id: generateId(),
        })))
        .returning();
      chunks.push(...result);
    }
    
    return chunks;
  });
}
```

#### 5. Connection Pooling and Database Optimization

**Enhanced Neon Client with Pooling:**

```typescript
// lib/db/neon-client-optimized.ts
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './chat-schema';

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;
neonConfig.pipelineConnect = false;
neonConfig.useSecureWebSocket = false;

// Connection pool configuration
const sql = neon(process.env.DATABASE_URL!, {
  poolQueryViaFetch: true,
  queryTimeout: 30000, // 30 second timeout
  connectionTimeoutMs: 10000, // 10 second connection timeout
});

export const db = drizzle(sql, { 
  schema,
  logger: process.env.NODE_ENV === 'development',
});

// Connection health check
export async function checkDatabaseHealth() {
  try {
    await sql`SELECT 1`;
    return { healthy: true };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { healthy: false, error };
  }
}
```

#### 6. API Route Performance Optimization

**Optimized Chat API with Streaming and Caching:**

```typescript
// app/api/chat/route-optimized.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { createChat, getChatMessagesPaginated, saveChatMessage } from '@/lib/db/chat-operations';
import { streamText } from 'ai';
import { myProvider } from '@/lib/ai/providers';

// Response headers for performance
const PERFORMANCE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Connection': 'keep-alive',
  'Keep-Alive': 'timeout=30, max=1000',
} as const;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { id: chatId, message, selectedChatModel } = await request.json();
    
    // Early authentication check
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { 
        status: 401,
        headers: PERFORMANCE_HEADERS 
      });
    }

    // Parallel operations for better performance
    const [chat, existingMessages] = await Promise.all([
      getChatById(chatId),
      getChatMessagesPaginated(chatId, 50) // Load recent messages only
    ]);

    // Create chat if doesn't exist
    const activeChat = chat || await createChat(
      session.user.id,
      message.content.slice(0, 50) + '...'
    );

    // Save user message immediately (don't await)
    const saveUserMessage = saveChatMessage({
      chatId: activeChat.id,
      role: 'user',
      content: message.content,
      parts: message.parts,
      attachments: message.attachments || [],
    });

    // Convert messages for AI processing
    const uiMessages = existingMessages.messages.map(msg => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      parts: msg.parts,
      createdAt: msg.createdAt,
    }));

    // Add new user message
    const userMessage = {
      id: generateId(),
      role: 'user' as const,
      content: message.content,
      parts: message.parts,
      createdAt: new Date(),
    };

    const allMessages = [...uiMessages, userMessage];

    // Stream response
    const result = await streamText({
      model: myProvider.languageModel(selectedChatModel),
      messages: convertToCoreMessages(allMessages),
      onFinish: async ({ text }) => {
        // Save assistant message
        await saveChatMessage({
          chatId: activeChat.id,
          role: 'assistant',
          content: text,
          parts: [{ type: 'text', text }],
          attachments: [],
        });
      },
    });

    // Ensure user message is saved
    await saveUserMessage;

    // Add performance timing header
    const responseHeaders = {
      ...PERFORMANCE_HEADERS,
      'X-Response-Time': `${Date.now() - startTime}ms`,
    };

    return result.toDataStreamResponse({
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new NextResponse('Internal Server Error', { 
      status: 500,
      headers: PERFORMANCE_HEADERS 
    });
  }
}
```

### Memory Management Strategies

#### 7. Frontend Memory Optimization

```typescript
// hooks/use-memory-optimized-chat.ts
'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useChat } from 'ai/react';

const MAX_MESSAGES_IN_MEMORY = 200; // Keep only recent messages in memory
const MESSAGE_CLEANUP_THRESHOLD = 300;

export function useMemoryOptimizedChat(chatId: string) {
  const [messageHistory, setMessageHistory] = useState<ChatMessage[]>([]);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  const chat = useChat({
    id: chatId,
    api: '/api/chat',
    onFinish: useCallback(() => {
      // Cleanup old messages after delay
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      
      cleanupTimeoutRef.current = setTimeout(() => {
        setMessageHistory(current => {
          if (current.length > MESSAGE_CLEANUP_THRESHOLD) {
            // Keep only recent messages
            return current.slice(-MAX_MESSAGES_IN_MEMORY);
          }
          return current;
        });
      }, 5000); // Cleanup after 5 seconds of inactivity
    }, []),
  });

  // Memoized message processing
  const processedMessages = useMemo(() => {
    return chat.messages.map(msg => ({
      ...msg,
      // Add any processing here
      timestamp: new Date(msg.createdAt || Date.now()),
    }));
  }, [chat.messages]);

  return {
    ...chat,
    messages: processedMessages,
    messageHistory,
  };
}
```

#### 8. Database Connection Optimization

```typescript
// lib/db/connection-pool.ts
import { Pool } from 'pg';

const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Connection timeout
  maxUses: 7500, // Close connection after this many queries
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await connectionPool.end();
  process.exit(0);
});

export { connectionPool };
```

### Network Traffic Optimization

#### 9. Message Compression and Streaming

```typescript
// lib/stream-optimization.ts
export function compressMessage(content: string): string {
  // Simple compression for repeated patterns
  return content
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

export function optimizeMessageParts(parts: any[]): any[] {
  return parts.map(part => {
    if (part.type === 'text') {
      return {
        ...part,
        text: compressMessage(part.text),
      };
    }
    return part;
  });
}
```

#### 10. Response Caching Strategy

```typescript
// app/api/chat/[id]/messages/route-cached.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { getChatMessagesPaginated } from '@/lib/db/chat-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;
  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { messages, nextCursor, hasMore } = await getChatMessagesPaginated(
      chatId,
      limit,
      url.searchParams.get('cursor') || undefined
    );

    // Cache headers for message history
    const cacheHeaders = {
      'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      'ETag': `"messages-${chatId}-${offset}-${messages.length}"`,
      'X-Total-Messages': messages.length.toString(),
    };

    return NextResponse.json({
      messages,
      pagination: {
        nextCursor,
        hasMore,
        offset,
        limit,
      },
    }, {
      headers: cacheHeaders,
    });

  } catch (error) {
    console.error('Error loading messages:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### Performance Monitoring

#### 11. Performance Metrics Collection

```typescript
// lib/performance-monitoring.ts
interface PerformanceMetrics {
  chatId: string;
  messageCount: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

export function collectPerformanceMetrics(chatId: string): PerformanceMetrics {
  const performance = window.performance;
  const memoryInfo = (performance as any).memory;

  return {
    chatId,
    messageCount: document.querySelectorAll('[data-message-id]').length,
    loadTime: performance.now(),
    renderTime: performance.getEntriesByType('measure')
      .filter(entry => entry.name.includes('chat-render'))?.[0]?.duration || 0,
    memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize : 0,
  };
}
```

This comprehensive performance optimization approach addresses the key bottlenecks in chat applications: frontend rendering performance through virtual scrolling, backend database optimization through efficient queries and connection pooling, memory management through smart cleanup strategies, and network optimization through caching and compression. These strategies ensure smooth performance even with thousands of messages.