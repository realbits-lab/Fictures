# Fictures Implementation Patterns Guide
## For Implementing New Features (e.g., Research)

This document consolidates the existing implementation patterns for novels/comics features to help you replicate them for new features like research.

---

## 1. DATABASE SCHEMA PATTERNS

### File Location
`/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/schema.ts`

### Core Pattern Structure

Every content type follows this pattern:

```typescript
// Define enums first (if needed)
export const visibilityEnum = pgEnum('visibility', [
  'private',
  'unlisted',
  'public'
]);

// Define main table
export const <contentType> = pgTable('<table_name>', {
  // Core fields
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Relationship fields
  authorId: text('author_id').references(() => users.id).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  
  // Content & Status
  content: text('content').default(''),
  status: statusEnum('status').default('writing').notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  
  // Image support (follows novel/comic pattern)
  imageUrl: text('image_url'),
  imageVariants: json('image_variants').$type<Record<string, unknown>>(),
  
  // Engagement tracking
  viewCount: integer('view_count').default(0).notNull(),
  rating: integer('rating').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const <contentType>Relations = relations(<contentType>, ({ one, many }) => ({
  author: one(users, {
    fields: [<contentType>.authorId],
    references: [users.id],
  }),
  // Many-to-one relationships as needed
}));
```

### Key Pattern Components

**For Novel/Comic-like content:**
- Primary key: `text('id').primaryKey()` with `nanoid()` generation
- Status enum: `'writing' | 'published'`
- Visibility enum: `'private' | 'unlisted' | 'public'`
- Image support: Always include `imageUrl` and `imageVariants` for AI-generated images
- View tracking: `viewCount` (integer)
- Rating system: `rating` (integer, multiply by 10: e.g., 47 = 4.7 stars)
- Engagement: optional `likeCount`, `commentCount`

**For Cascade Operations:**
```typescript
userId: text('user_id').references(() => users.id, { onDelete: 'cascade' })
```

### Example: Research Content Schema

```typescript
export const researchContent = pgTable('research_content', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  content: text('content').default(''), // Markdown content
  authorId: text('author_id').references(() => users.id).notNull(),
  status: statusEnum('status').default('writing').notNull(),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  
  // Image support for research
  imageUrl: text('image_url'),
  imageVariants: json('image_variants').$type<Record<string, unknown>>(),
  
  // Research-specific fields
  category: varchar('category', { length: 100 }),
  tags: json('tags').$type<string[]>().default([]),
  sourceReferences: json('source_references').$type<Array<{ title: string; url?: string; }>>(),
  
  // Engagement
  viewCount: integer('view_count').default(0).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const researchContentRelations = relations(researchContent, ({ one }) => ({
  author: one(users, {
    fields: [researchContent.authorId],
    references: [users.id],
  }),
}));
```

---

## 2. API ROUTE PATTERNS

### File Location
`/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/`

### Standard CRUD Route Structure

#### GET - Fetch Published Content (List)
**Path:** `/api/stories/published`  
**Pattern:** Server-side with Redis cache + ETag validation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPublishedContent } from '@/lib/db/cached-queries';
import { getPerformanceLogger } from '@/lib/cache/performance-logger';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const perfLogger = getPerformanceLogger();
  const operationId = `get-published-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'GET /api/content/published', { apiRoute: true });

    const dbQueryStart = Date.now();
    const content = await getPublishedContent();
    const dbQueryDuration = Date.now() - dbQueryStart;

    const response = {
      content: content,
      count: content.length,
      metadata: {
        fetchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }
    };

    // Generate ETag for cache validation
    const contentForHash = JSON.stringify({
      contentData: content.map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        viewCount: item.viewCount,
      })),
      totalCount: content.length,
      lastUpdated: response.metadata.lastUpdated
    });
    const etag = createHash('md5').update(contentForHash).digest('hex');

    // Check if client has the same version
    const clientETag = request.headers.get('if-none-match');
    if (clientETag === etag) {
      perfLogger.end(operationId, { cached: true, etag304: true });
      return new NextResponse(null, { status: 304 });
    }

    const totalDuration = perfLogger.end(operationId, {
      contentCount: content.length
    });

    const headers = new Headers({
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      'X-Last-Modified': response.metadata.lastUpdated,
      'X-Server-Timing': `total;dur=${totalDuration},db;dur=${dbQueryDuration}`,
      'X-Server-Cache': 'ENABLED'
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error fetching content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### GET - Fetch Single Item
**Path:** `/api/stories/[id]`

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestStart = Date.now();
  const perfLogger = getPerformanceLogger();
  const operationId = `get-item-${Date.now()}`;

  try {
    perfLogger.start(operationId, 'GET /api/content/[id]', { apiRoute: true });

    const { id } = await params;
    const session = await auth();

    // Use cached query function
    const item = await getItemById(id, session?.user?.id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const totalDuration = perfLogger.end(operationId);

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Server-Timing': `total;dur=${totalDuration}`,
      'X-Cache-Status': 'HIT'
    });

    return new NextResponse(
      JSON.stringify({ item }),
      { status: 200, headers }
    );
  } catch (error) {
    perfLogger.end(operationId, { error: true });
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### POST - Create New Content

```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    
    // Validate input
    const validated = createContentSchema.parse(data);
    
    // Create in database
    const newItem = await createContent(session.user.id, validated);
    
    // Invalidate cache for list views
    await invalidateCache([
      'content:list:public',
      `content:list:user:${session.user.id}`
    ]);

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### PUT - Update Content

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    
    // Verify ownership
    const item = await getItemById(id, session.user.id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (item.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update content
    const updated = await updateContent(id, data);
    
    // Invalidate relevant caches
    await invalidateCache([
      `content:${id}:*`,
      `content:list:user:${session.user.id}`,
      'content:list:public'
    ]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

#### DELETE - Remove Content

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    
    // Verify ownership
    const item = await getItemById(id);
    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (item.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from database (cascading)
    await db.delete(content).where(eq(content.id, id));
    
    // Delete images from Vercel Blob if present
    if (item.imageUrl) {
      await del(item.imageUrl);
    }
    
    // Clear all related caches
    await invalidateCache([
      `content:${id}:*`,
      `content:list:user:${item.authorId}`,
      'content:list:public'
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 3. CACHING IMPLEMENTATION PATTERNS

### File Locations
- Server-side: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/cache/redis-cache.ts`
- Database cached queries: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/cached-queries.ts`
- Client-side: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/hooks/use-page-cache.ts`

### 3a. Server-Side Redis Caching

**Key Principles:**
- Published content uses shared cache (one entry for all users)
- Private content uses user-specific cache (separate entries per user)
- TTL for published content: 3600s (1 hour)
- TTL for private content: 180s (3 minutes)

**Pattern:**

```typescript
// src/lib/db/cached-queries.ts

const CACHE_TTL = {
  PUBLISHED_CONTENT: 3600,   // 1 hour
  PRIVATE_CONTENT: 180,      // 3 minutes
  LIST: 600,                 // 10 minutes
};

export async function getPublishedContent(userId?: string) {
  return measureAsync(
    'getPublishedContent',
    async () => {
      // Try public cache first (shared by all users)
      const publicCacheKey = `content:public`;
      const cachedPublic = await getCache().get(publicCacheKey);

      if (cachedPublic) {
        console.log(`[Cache] HIT public content`);
        return cachedPublic;
      }

      // Cache miss - fetch from database
      const content = await queries.getPublishedContent();

      if (!content || content.length === 0) return [];

      // Set public cache (shared)
      await getCache().set(publicCacheKey, content, CACHE_TTL.PUBLISHED_CONTENT);
      console.log(`[Cache] SET public content (shared by all users)`);

      return content;
    },
    { userId, cached: true }
  ).then(r => r.result);
}

export async function getPrivateContent(userId: string) {
  return measureAsync(
    'getPrivateContent',
    async () => {
      // User-specific cache
      const userCacheKey = `content:user:${userId}`;
      const cachedUser = await getCache().get(userCacheKey);

      if (cachedUser) {
        console.log(`[Cache] HIT user-specific content: ${userId}`);
        return cachedUser;
      }

      // Cache miss
      const content = await queries.getPrivateContent(userId);

      if (!content) return null;

      // Set user-specific cache
      await getCache().set(userCacheKey, content, CACHE_TTL.PRIVATE_CONTENT);
      console.log(`[Cache] SET private content (user: ${userId})`);

      return content;
    },
    { userId, cached: true }
  ).then(r => r.result);
}
```

### 3b. Cache Invalidation

```typescript
import { invalidateCache } from '@/lib/cache/redis-cache';

// Invalidate specific keys
await invalidateCache(`content:${id}`);

// Invalidate patterns
await invalidateCache([
  `content:${id}:*`,
  `content:list:user:${userId}`,
  'content:list:public'
]);

// Invalidate user-specific caches when content status changes
if (item.status === 'published') {
  // Public cache updated
  await invalidateCache('content:list:public');
} else {
  // Private user cache
  await invalidateCache(`content:list:user:${userId}`);
}
```

### 3c. Client-Side SWR + localStorage Caching

**Pattern:**

```typescript
// src/lib/hooks/use-page-cache.ts

import { usePersistedSWR, CACHE_CONFIGS } from './use-persisted-swr';

const fetcher = async (url: string) => {
  const fetchStart = performance.now();
  console.log(`[fetcher] Starting fetch: ${url}`);

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`[fetcher] Data parsed in ${Math.round(performance.now() - fetchStart)}ms`);
    return data;
  } catch (error) {
    console.error(`[fetcher] Fetch failed:`, error);
    throw error;
  }
};

// Define your research hook
export function useResearchContent() {
  return usePersistedSWR(
    '/research/api/published',
    fetcher,
    CACHE_CONFIGS.reading,  // Reuse reading config for similar behavior
    {
      revalidateOnFocus: false,        // Don't revalidate on tab focus
      revalidateOnReconnect: true,     // Revalidate when reconnected
      refreshInterval: 30 * 60 * 1000, // Refresh every 30 minutes
      dedupingInterval: 30 * 60 * 1000, // Keep in memory for 30 mins
      keepPreviousData: true,          // Keep previous data during navigation
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onSuccess: (data) => {
        console.log('✅ Research content loaded:', data?.count || 0, 'items');
      },
      onError: (error) => {
        console.error('❌ Fetch failed:', error);
      }
    }
  );
}
```

**Cache Configs Structure:**

```typescript
// CACHE_CONFIGS.reading used for browse pages
{
  ttl: 3600000,      // 1 hour in milliseconds
  version: 1,
  compress: true
}
```

---

## 4. FRONTEND LAYOUT & COMPONENT PATTERNS

### File Locations
- Browse component: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/browse/`
- Comic browser: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/comic/`
- Reading component: `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/novels/`

### 4a. Browse/List Page Pattern

**Page Structure:**

```typescript
// app/research/page.tsx
import { MainLayout } from "@/components/layout";
import { ResearchBrowse } from "@/components/research/research-browse";

export default function ResearchPage() {
  return (
    <MainLayout>
      <ResearchBrowse />
    </MainLayout>
  );
}
```

**Client Component:**

```typescript
// components/research/ResearchBrowse.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from 'next-auth/react';
import { SkeletonLoader } from "@/components/ui";
import { useResearchContent } from "@/lib/hooks/use-page-cache";
import { ResearchGrid } from "./ResearchGrid";

function ResearchCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-[270px]">
      {/* Skeleton content */}
    </div>
  );
}

export function ResearchBrowse() {
  const { data: session } = useSession();
  const { data, isLoading, error } = useResearchContent();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ResearchCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Failed to load research content</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Research</h1>
      <ResearchGrid items={data?.content || []} />
    </div>
  );
}
```

**Grid Component:**

```typescript
// components/research/ResearchGrid.tsx
import Link from "next/link";
import { Badge } from "@/components/ui";

export function ResearchGrid({ items }: { items: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/research/${item.id}`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {item.description}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{item.viewCount} views</span>
            <Badge>{item.category}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

### 4b. Detail/Reader Page Pattern

**Page Structure:**

```typescript
// app/research/[id]/page.tsx
import { MainLayout } from '@/components/layout';
import { ResearchReader } from '@/components/research/research-reader';
import { getResearchWithStructure } from '@/lib/db/cached-queries';
import { notFound } from 'next/navigation';

interface ResearchPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResearchPage({ params }: ResearchPageProps) {
  const pageLoadStart = Date.now();
  console.log('🚀 [SSR] ResearchPage loading started');

  const { id } = await params;
  console.log(`📚 [SSR] Loading research content: ${id}`);

  // Fetch from cache
  const ssrFetchStart = Date.now();
  const research = await getResearchWithStructure(id);

  if (!research) {
    console.log(`❌ [SSR] Research not found: ${id}`);
    notFound();
  }

  const pageLoadDuration = Date.now() - pageLoadStart;
  console.log(`🏁 [SSR] ResearchPage rendering complete in ${pageLoadDuration}ms`);

  return (
    <MainLayout>
      <ResearchReader researchId={id} initialData={research} />
    </MainLayout>
  );
}
```

**Client Reader Component:**

```typescript
// components/research/research-reader.tsx
"use client";

import React, { useState } from "react";
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';

export function ResearchReader({ 
  researchId, 
  initialData 
}: { 
  researchId: string; 
  initialData: any; 
}) {
  const { data: session } = useSession();
  const [research] = useState(initialData);

  if (!research) return null;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{research.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {research.description}
        </p>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>By {research.authorName}</span>
          <span>{research.viewCount} views</span>
          <span>{new Date(research.createdAt).toLocaleDateString()}</span>
        </div>
      </header>

      <article className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{research.content}</ReactMarkdown>
      </article>

      {/* Comments section if needed */}
    </div>
  );
}
```

---

## 5. ROLE-BASED ACCESS CONTROL PATTERNS

### File Location
`/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/auth/permissions.ts`

### Core Permission Functions

```typescript
import { Session } from 'next-auth';

export type UserRole = 'admin' | 'writer' | 'manager' | 'reader' | 'moderator';

export function hasRole(session: Session | null, role: UserRole): boolean {
  return session?.user?.role === role;
}

export function hasAnyRole(session: Session | null, roles: UserRole[]): boolean {
  return roles.includes(session?.user?.role as UserRole);
}

export function canWrite(session: Session | null): boolean {
  return hasAnyRole(session, ['admin', 'writer', 'manager']);
}

export function canModerate(session: Session | null): boolean {
  return hasAnyRole(session, ['admin', 'moderator']);
}
```

### Page-Level Protection Pattern

```typescript
// app/research/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hasAnyRole } from '@/lib/auth/permissions';

export default async function ResearchPage() {
  const session = await auth();

  // Require authentication for private research
  if (!session) {
    redirect('/login');
  }

  // Optionally require specific role (e.g., for creating research)
  if (!hasAnyRole(session, ['writer', 'manager'])) {
    redirect('/');
  }

  return (
    // Page content
  );
}
```

### API Route Protection Pattern

```typescript
// app/api/research/create/route.ts
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!hasAnyRole(session, ['writer', 'manager'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Proceed with creation
  try {
    const data = await request.json();
    // ... create logic
  } catch (error) {
    // ... error handling
  }
}
```

---

## 6. MARKDOWN RENDERING PATTERNS

### Client-Side Markdown Rendering

The project uses `react-markdown` for rendering markdown content on reading pages.

```typescript
// components/research/research-reader.tsx
import ReactMarkdown from 'react-markdown';

export function ResearchReader({ research }) {
  return (
    <article className="prose dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-4xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
          a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" {...props} />,
        }}
      >
        {research.content}
      </ReactMarkdown>
    </article>
  );
}
```

### Content Storage

Store markdown content directly in the database:

```typescript
// Schema
export const researchContent = pgTable('research_content', {
  // ...
  content: text('content').default(''), // Markdown as plain text
  contentHtml: text('content_html'), // Optional: pre-rendered HTML for performance
  // ...
});
```

---

## 7. REUSABLE UTILITY PATTERNS

### Image Generation & Storage

```typescript
import { put } from '@vercel/blob';

export async function uploadImage(file: Blob, path: string) {
  const blob = await put(path, file, { access: 'public' });
  return blob.url;
}

// For AI-generated images
import { generateStoryImage } from '@/lib/services/image-generation';

const result = await generateStoryImage({
  prompt: 'Research illustration about...',
  storyId: researchId,
  imageType: 'research',
  style: 'vivid',
  quality: 'standard'
});

// result.url - Original image
// result.optimizedSet - 18 variants for responsive loading
```

### Performance Logging

```typescript
import { getPerformanceLogger } from '@/lib/cache/performance-logger';
import { measureAsync } from '@/lib/cache/performance-logger';

// In API routes
const perfLogger = getPerformanceLogger();
const operationId = `operation-${Date.now()}`;

perfLogger.start(operationId, 'GET /api/research/[id]', { apiRoute: true });

// ... do work ...

const totalDuration = perfLogger.end(operationId, {
  researchCount: results.length
});
```

---

## 8. COMPLETE IMPLEMENTATION EXAMPLE: Research Feature

### Directory Structure

```
src/
├── app/
│   ├── research/
│   │   ├── page.tsx                    # Browse page (public)
│   │   ├── [id]/
│   │   │   └── page.tsx                # Detail/reader page
│   │   └── api/
│   │       ├── published/
│   │       │   └── route.ts            # GET public research
│   │       ├── [id]/
│   │       │   └── route.ts            # GET/PUT/DELETE single research
│   │       └── create/
│   │           └── route.ts            # POST create research
│   ├── studio/                         # Writer/manager creating research
│   │   ├── research/
│   │   │   ├── page.tsx
│   │   │   └── api/
│   │   │       └── research/
│   │   │           └── route.ts        # CREATE/UPDATE research
├── components/
│   └── research/
│       ├── research-browse.tsx         # Browse/list component
│       ├── research-grid.tsx           # Grid display
│       ├── research-reader.tsx         # Detail/reader view
│       ├── research-editor.tsx         # Editor (for writers)
│       └── research-card.tsx           # Individual card
├── lib/
│   ├── db/
│   │   ├── schema.ts                   # Add researchContent table
│   │   ├── queries.ts                  # Raw DB queries
│   │   └── cached-queries.ts           # Cached versions + patterns
│   ├── cache/
│   │   └── redis-cache.ts              # Already implemented
│   ├── hooks/
│   │   └── use-page-cache.ts           # Add useResearchContent hook
│   └── auth/
│       └── permissions.ts              # Already has needed functions
```

### Step-by-Step Implementation

1. **Add schema** to `src/lib/db/schema.ts`
2. **Add DB queries** to `src/lib/db/queries.ts`
3. **Add cached queries** to `src/lib/db/cached-queries.ts`
4. **Add API routes** under `src/app/api/research/`
5. **Add client hook** to `src/lib/hooks/use-page-cache.ts`
6. **Add components** under `src/components/research/`
7. **Add pages** under `src/app/research/`

---

## 9. KEY REFERENCE FILES

| Purpose | File Path |
|---------|-----------|
| Database Schema | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/schema.ts` |
| Raw Queries | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/queries.ts` |
| Cached Queries | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/db/cached-queries.ts` |
| Redis Cache | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/cache/redis-cache.ts` |
| Published API | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/api/stories/published/route.ts` |
| Browse Component | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/components/browse/BrowseClient.tsx` |
| Novel Reader | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/novels/[id]/page.tsx` |
| Comic Reader | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/app/comics/[id]/page.tsx` |
| Permissions | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/auth/permissions.ts` |
| Client Hooks | `/Users/thomasjeon/GitHub/@dev.realbits/Fictures/src/lib/hooks/use-page-cache.ts` |

---

## 10. CACHING STRATEGY SUMMARY

### 3-Layer Caching Architecture

**Layer 1: Server-side Redis Cache**
- Published content: Shared cache, 1 hour TTL
- Private content: User-specific, 3 minutes TTL
- List queries: 10 minutes TTL

**Layer 2: Client-side SWR Cache (Memory)**
- In-memory deduplication: 30 minutes
- Auto-revalidation: 30 minutes for published content
- No focus-based revalidation for static content

**Layer 3: Browser localStorage**
- Persists across sessions
- Gzip compression enabled
- Automatic expiration via version management

### Cache Invalidation Strategy

```typescript
// When content changes:
await invalidateCache([
  `content:${id}:*`,                    // All variants of this content
  `content:list:user:${userId}`,        // User's private list
  'content:list:public'                 // Shared public list
]);
```

---

## QUICK START CHECKLIST

- [ ] Add schema tables and relations to `schema.ts`
- [ ] Implement raw queries in `queries.ts`
- [ ] Wrap with caching in `cached-queries.ts`
- [ ] Create API routes: `GET /api/research/published`, `GET/POST/PUT/DELETE /api/research/[id]`
- [ ] Add client hook `useResearchContent()` to `use-page-cache.ts`
- [ ] Create Browse page and component
- [ ] Create Detail page and reader component
- [ ] Add role-based protection where needed
- [ ] Test caching with performance monitoring
- [ ] Set up cache invalidation on mutations

