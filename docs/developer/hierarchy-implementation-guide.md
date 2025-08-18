# 4-Level Hierarchy Implementation Guide

## Architecture Overview

The 4-level book organization hierarchy is implemented using a combination of PostgreSQL relational database design, Drizzle ORM, optimized queries, Redis caching, and React components with performance optimizations.

## Database Schema

### Core Tables

```sql
-- Books (Level 1)
CREATE TABLE "Book" (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES "User"(id),
  word_count INTEGER DEFAULT 0,
  status VARCHAR CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stories (Level 2)
CREATE TABLE "Story" (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  book_id UUID REFERENCES "Book"(id) ON DELETE CASCADE,
  order_in_book INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Parts (Level 3)
CREATE TABLE "Part" (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  story_id UUID REFERENCES "Story"(id) ON DELETE CASCADE,
  order_in_story INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters (Level 4)
CREATE TABLE "ChapterEnhanced" (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  part_id UUID REFERENCES "Part"(id) ON DELETE CASCADE,
  order_in_part INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scenes (Level 5)
CREATE TABLE "Scene" (
  id UUID PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  chapter_id UUID REFERENCES "ChapterEnhanced"(id) ON DELETE CASCADE,
  order_in_chapter INTEGER NOT NULL,
  word_count INTEGER DEFAULT 0,
  scene_type VARCHAR DEFAULT 'action',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Performance Indexes

```sql
-- Foreign key indexes for efficient joins
CREATE INDEX idx_stories_book_id ON "Story"(book_id);
CREATE INDEX idx_parts_story_id ON "Part"(story_id);
CREATE INDEX idx_chapters_part_id ON "ChapterEnhanced"(part_id);
CREATE INDEX idx_scenes_chapter_id ON "Scene"(chapter_id);

-- Composite indexes for order-based queries
CREATE INDEX idx_stories_book_order ON "Story"(book_id, order_in_book);
CREATE INDEX idx_parts_story_order ON "Part"(story_id, order_in_story);
CREATE INDEX idx_chapters_part_order ON "ChapterEnhanced"(part_id, order_in_part);
CREATE INDEX idx_scenes_chapter_order ON "Scene"(chapter_id, order_in_chapter);

-- Full-text search indexes
CREATE INDEX idx_chapters_content_search ON "ChapterEnhanced" USING gin(to_tsvector('english', content));
CREATE INDEX idx_scenes_content_search ON "Scene" USING gin(to_tsvector('english', content));
```

## Drizzle ORM Schema

```typescript
// lib/db/schema.ts
import { pgTable, uuid, text, integer, timestamp, varchar, jsonb } from 'drizzle-orm/pg-core';

export const book = pgTable('Book', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  userId: uuid('user_id').notNull().references(() => user.id),
  wordCount: integer('word_count').default(0),
  status: varchar('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const story = pgTable('Story', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  bookId: uuid('book_id').notNull().references(() => book.id, { onDelete: 'cascade' }),
  orderInBook: integer('order_in_book').notNull(),
  wordCount: integer('word_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ... similar for part, chapterEnhanced, scene
```

## API Routes

### Hierarchy API Structure

```
/api/books/[bookId]/
├── route.ts                    # Book CRUD operations
├── hierarchy/route.ts          # Full hierarchy data
├── breadcrumb/route.ts         # Breadcrumb navigation
├── search/route.ts             # Search within book
├── stories/
│   ├── route.ts               # Stories CRUD
│   └── [storyId]/
│       ├── route.ts           # Story details
│       └── parts/route.ts     # Parts for story
├── parts/[partId]/
│   ├── route.ts               # Part CRUD
│   └── chapters/route.ts      # Chapters for part
├── chapters/[chapterId]/
│   ├── route.ts               # Chapter CRUD
│   └── scenes/route.ts        # Scenes for chapter
└── scenes/[sceneId]/
    ├── route.ts               # Scene CRUD
    └── generate/route.ts      # AI scene generation
```

### Example API Implementation

```typescript
// app/api/books/[bookId]/hierarchy/route.ts
import { NextRequest } from 'next/server';
import { getOptimizedHierarchy } from '@/lib/db/queries/hierarchy-performance';
import { hierarchyCache } from '@/lib/cache/redis-hierarchy-cache';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookId } = params;

    // Try cache first
    const cached = await hierarchyCache.getHierarchy(bookId);
    if (cached) {
      return Response.json(cached, {
        headers: {
          'Cache-Control': 'private, max-age=300',
          'X-Cache': 'HIT'
        }
      });
    }

    // Fetch from database with optimized query
    const hierarchy = await getOptimizedHierarchy(bookId);
    
    if (!hierarchy) {
      return Response.json({ error: 'Book not found' }, { status: 404 });
    }

    // Cache the result
    await hierarchyCache.setHierarchy(bookId, hierarchy);

    return Response.json(hierarchy, {
      headers: {
        'Cache-Control': 'private, max-age=300',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Hierarchy API error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Optimized Database Queries

### Single Query Hierarchy Fetch

```typescript
// lib/db/queries/hierarchy-performance.ts
export async function getOptimizedHierarchy(bookId: string) {
  const result = await db
    .select({
      // Book data
      bookId: book.id,
      bookTitle: book.title,
      bookWordCount: book.wordCount,
      
      // Story data  
      storyId: story.id,
      storyTitle: story.title,
      storyOrder: story.orderInBook,
      storyWordCount: story.wordCount,
      
      // Part data
      partId: part.id,
      partTitle: part.title,
      partOrder: part.orderInStory,
      partWordCount: part.wordCount,
      
      // Chapter data
      chapterId: chapterEnhanced.id,
      chapterTitle: chapterEnhanced.title,
      chapterOrder: chapterEnhanced.orderInPart,
      chapterWordCount: chapterEnhanced.wordCount,
      
      // Scene data
      sceneId: scene.id,
      sceneTitle: scene.title,
      sceneOrder: scene.orderInChapter,
      sceneWordCount: scene.wordCount
    })
    .from(book)
    .leftJoin(story, eq(story.bookId, book.id))
    .leftJoin(part, eq(part.storyId, story.id))
    .leftJoin(chapterEnhanced, eq(chapterEnhanced.partId, part.id))
    .leftJoin(scene, eq(scene.chapterId, chapterEnhanced.id))
    .where(eq(book.id, bookId))
    .orderBy(
      story.orderInBook,
      part.orderInStory,
      chapterEnhanced.orderInPart,
      scene.orderInChapter
    );

  // Transform flat result into hierarchical structure
  return transformToHierarchy(result);
}
```

### Word Count Aggregation

```typescript
export async function getOptimizedWordCount(bookId: string) {
  const result = await db
    .select({
      totalWords: sql<number>`
        COALESCE(${book.wordCount}, 0) +
        COALESCE(SUM(${story.wordCount}), 0) +
        COALESCE(SUM(${part.wordCount}), 0) +
        COALESCE(SUM(${chapterEnhanced.wordCount}), 0) +
        COALESCE(SUM(${scene.wordCount}), 0)
      `.as('totalWords')
    })
    .from(book)
    .leftJoin(story, eq(story.bookId, book.id))
    .leftJoin(part, eq(part.storyId, story.id))
    .leftJoin(chapterEnhanced, eq(chapterEnhanced.partId, part.id))
    .leftJoin(scene, eq(scene.chapterId, chapterEnhanced.id))
    .where(eq(book.id, bookId))
    .groupBy(book.id);

  return result[0]?.totalWords || 0;
}
```

## Redis Caching Strategy

### Cache Keys and TTL

```typescript
// lib/cache/redis-hierarchy-cache.ts
const CACHE_KEYS = {
  hierarchy: (bookId: string) => `hierarchy:${bookId}`,
  breadcrumb: (sceneId: string) => `breadcrumb:${sceneId}`,
  wordCount: (bookId: string) => `word-count:${bookId}`,
  search: (bookId: string, query: string) => `search:${bookId}:${hash(query)}`
};

const CACHE_TTL = {
  hierarchy: 3600, // 1 hour
  breadcrumb: 1800, // 30 minutes
  wordCount: 900,   // 15 minutes
  search: 600       // 10 minutes
};
```

### Cache-Aside Pattern

```typescript
export async function getCachedHierarchy(bookId: string) {
  return await hierarchyCache.getOrSet(
    CACHE_KEYS.hierarchy(bookId),
    () => getOptimizedHierarchy(bookId),
    CACHE_TTL.hierarchy
  );
}
```

### Cache Invalidation

```typescript
export async function invalidateHierarchyCache(bookId: string) {
  const keysToDelete = [
    CACHE_KEYS.hierarchy(bookId),
    CACHE_KEYS.wordCount(bookId),
    // Also invalidate search results
    ...await redis.keys(`search:${bookId}:*`)
  ];
  
  await redis.del(...keysToDelete);
}
```

## React Components

### Lazy Loading with Code Splitting

```typescript
// components/performance/lazy-hierarchy-tree.tsx
import dynamic from 'next/dynamic';

const ContentTreeCore = dynamic(
  () => import('@/components/books/hierarchy/content-tree'),
  {
    loading: () => <HierarchyTreeSkeleton />,
    ssr: false
  }
);

export const LazyContentTree = memo(function LazyContentTree(props) {
  return (
    <Suspense fallback={<HierarchyTreeSkeleton />}>
      <ContentTreeCore {...props} />
    </Suspense>
  );
});
```

### Virtual Scrolling for Large Lists

```typescript
export function VirtualScrollList({ items, itemHeight, containerHeight, renderItem }) {
  const visibleCount = Math.ceil(containerHeight / itemHeight) + 2;
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, items.length);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={e => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        {visibleItems.map((item, index) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: (startIndex + index) * itemHeight,
              width: '100%',
              height: itemHeight
            }}
          >
            {renderItem(item, startIndex + index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Error Boundaries

```typescript
// components/error/error-boundary.tsx
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    this.logErrorToMonitoringService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

## AI Integration

### Context-Aware Generation

```typescript
// lib/ai/context/hierarchy-context-manager.ts
export class HierarchyContextManager {
  async buildSceneContext(sceneId: string) {
    const breadcrumb = await getOptimizedBreadcrumb(sceneId);
    
    const context = {
      book: breadcrumb.bookTitle,
      story: breadcrumb.storyTitle,
      part: breadcrumb.partTitle,
      chapter: breadcrumb.chapterTitle,
      scene: breadcrumb.sceneTitle,
      previousScenes: await this.getPreviousScenes(sceneId),
      characters: await this.getActiveCharacters(sceneId),
      plotThreads: await this.getActivePlotThreads(sceneId)
    };

    return context;
  }
}
```

### Tools Integration

```typescript
// lib/ai/tools/hierarchy-tools.ts
export const hierarchyTools = [
  {
    name: 'create_scene',
    description: 'Create a new scene in the current chapter',
    parameters: {
      title: 'string',
      content: 'string',
      sceneType: 'action | dialogue | exposition | transition',
      characters: 'string[]',
      location: 'string'
    }
  },
  {
    name: 'update_scene',
    description: 'Update an existing scene',
    parameters: {
      sceneId: 'string',
      content: 'string',
      metadata: 'object'
    }
  }
];
```

## Performance Monitoring

### Query Performance Tracking

```typescript
// lib/db/queries/performance-monitoring.ts
export async function getQueryPerformanceStats() {
  return await db.execute(sql`
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      max_time
    FROM pg_stat_statements
    WHERE query LIKE '%hierarchy%'
    ORDER BY total_time DESC
    LIMIT 10
  `);
}
```

### Component Performance Monitoring

```typescript
// hooks/use-performance-monitor.ts
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  
  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current!;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  });
}
```

## Testing Strategy

### Database Tests

```typescript
// __tests__/db/hierarchy-queries.test.ts
describe('Hierarchy Queries', () => {
  it('should execute hierarchy query within performance threshold', async () => {
    const startTime = performance.now();
    const result = await getOptimizedHierarchy(testBookId);
    const queryTime = performance.now() - startTime;
    
    expect(queryTime).toBeLessThan(100); // Should execute in under 100ms
    expect(result).toBeDefined();
  });
});
```

### Component Tests

```typescript
// __tests__/components/hierarchy-tree.test.tsx
describe('HierarchyTree', () => {
  it('should render loading state initially', () => {
    render(<LazyContentTree bookId="test" />);
    expect(screen.getByTestId('hierarchy-tree-skeleton')).toBeInTheDocument();
  });
  
  it('should handle large datasets with virtual scrolling', async () => {
    const largeDataset = generateLargeHierarchy(10000);
    render(<VirtualScrollList items={largeDataset} />);
    
    // Should only render visible items
    const renderedItems = screen.getAllByTestId(/hierarchy-item/);
    expect(renderedItems.length).toBeLessThanOrEqual(50);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/hierarchy-navigation.test.ts
test('should navigate hierarchy efficiently', async ({ page }) => {
  await page.goto('/books/test-book');
  
  // Measure navigation performance
  const startTime = Date.now();
  await page.click('[data-testid="story-1"]');
  await page.click('[data-testid="part-1"]');
  await page.click('[data-testid="chapter-1"]');
  const navigationTime = Date.now() - startTime;
  
  expect(navigationTime).toBeLessThan(2000); // Should navigate in under 2s
});
```

## Deployment Considerations

### Environment Variables

```bash
# .env.production
POSTGRES_URL=postgresql://...
REDIS_URL=redis://...
XAI_API_KEY=...
NEXT_PUBLIC_APP_URL=https://...
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "POSTGRES_URL": "@postgres-url",
    "REDIS_URL": "@redis-url"
  }
}
```

## Security Considerations

### Input Validation

```typescript
// lib/validation/hierarchy-schemas.ts
import { z } from 'zod';

export const createSceneSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().max(50000),
  sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition']),
  metadata: z.object({}).optional()
});
```

### Authorization

```typescript
// lib/auth/hierarchy-permissions.ts
export async function canUserAccessBook(userId: string, bookId: string) {
  const book = await db
    .select({ userId: book.userId })
    .from(book)
    .where(eq(book.id, bookId))
    .limit(1);
    
  return book[0]?.userId === userId;
}
```

## Best Practices

### Performance
1. Use the optimized queries for hierarchy data
2. Implement proper caching with Redis
3. Use lazy loading for large components
4. Monitor query performance regularly
5. Use virtual scrolling for large lists

### Code Organization
1. Keep database logic in query files
2. Use proper TypeScript typing
3. Implement proper error boundaries
4. Write comprehensive tests
5. Document complex logic

### User Experience
1. Provide loading states for all async operations
2. Implement optimistic UI updates
3. Use proper error messages
4. Ensure responsive design
5. Add keyboard shortcuts for power users

---

This implementation provides a robust, scalable foundation for the 4-level hierarchy system with excellent performance characteristics and user experience.