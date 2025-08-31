# Book Hierarchy Implementation Plan
## 4-Level Organization: Story > Part > Chapter > Scene

### Executive Summary
This document outlines the complete implementation plan for integrating a 4-level book organization hierarchy into the Fictures AI-powered content creation platform. The hierarchy consists of Story (top level), Part, Chapter, and Scene (atomic unit), providing writers with comprehensive organizational control while maintaining AI integration for context-aware content generation.

---

## 1. Database Schema Design

### 1.1 Core Tables

```typescript
// Story Table (Top Level)
export const story = pgTable('Story', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  synopsis: text('synopsis'),
  themes: json('themes').$type<string[]>().notNull().default([]),
  worldSettings: json('worldSettings'), // JSON for world-building details
  characterArcs: json('characterArcs'), // JSON for character development arcs
  plotStructure: json('plotStructure'), // JSON for overall plot structure
  order: integer('order').notNull().default(0),
  wordCount: integer('wordCount').notNull().default(0),
  partCount: integer('partCount').notNull().default(0),
  isActive: boolean('isActive').notNull().default(true),
  metadata: json('metadata'), // Flexible JSON for additional data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Part Table (Second Level)
export const part = pgTable('Part', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  storyId: uuid('storyId')
    .notNull()
    .references(() => story.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  partNumber: integer('partNumber').notNull(),
  thematicFocus: text('thematicFocus'), // Main theme for this part
  timeframe: json('timeframe'), // JSON for timeline details
  location: text('location'), // Primary setting
  wordCount: integer('wordCount').notNull().default(0),
  chapterCount: integer('chapterCount').notNull().default(0),
  order: integer('order').notNull().default(0),
  isComplete: boolean('isComplete').notNull().default(false),
  notes: text('notes'), // Author's notes for this part
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Enhanced Chapter Table (Third Level)
export const chapterEnhanced = pgTable('ChapterEnhanced', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  partId: uuid('partId')
    .notNull()
    .references(() => part.id, { onDelete: 'cascade' }),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id), // Keep for backward compatibility
  chapterNumber: integer('chapterNumber').notNull(),
  globalChapterNumber: integer('globalChapterNumber').notNull(), // Across entire book
  title: text('title').notNull(),
  summary: text('summary'),
  content: json('content').notNull(), // Legacy field
  wordCount: integer('wordCount').notNull().default(0),
  sceneCount: integer('sceneCount').notNull().default(0),
  order: integer('order').notNull().default(0),
  pov: text('pov'), // Point of view character
  timeline: json('timeline'), // When this chapter occurs
  setting: text('setting'), // Primary location
  charactersPresent: json('charactersPresent').$type<string[]>().notNull().default([]),
  isPublished: boolean('isPublished').notNull().default(false),
  publishedAt: timestamp('publishedAt'),
  chatId: uuid('chatId').references(() => chat.id),
  generationPrompt: text('generationPrompt'),
  previousChapterSummary: text('previousChapterSummary'),
  nextChapterHints: text('nextChapterHints'), // AI context for next chapter
  authorNote: text('authorNote'),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Scene Table (Atomic Level)
export const scene = pgTable('Scene', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chapterId: uuid('chapterId')
    .notNull()
    .references(() => chapterEnhanced.id, { onDelete: 'cascade' }),
  sceneNumber: integer('sceneNumber').notNull(),
  title: text('title'),
  content: text('content').notNull(),
  wordCount: integer('wordCount').notNull().default(0),
  order: integer('order').notNull().default(0),
  sceneType: varchar('sceneType', { 
    enum: ['action', 'dialogue', 'exposition', 'transition', 'climax'] 
  }).notNull().default('action'),
  pov: text('pov'), // Point of view for this scene
  location: text('location'),
  timeOfDay: text('timeOfDay'),
  charactersPresent: json('charactersPresent').$type<string[]>().notNull().default([]),
  mood: varchar('mood', { 
    enum: ['tense', 'romantic', 'mysterious', 'comedic', 'dramatic', 'neutral'] 
  }).notNull().default('neutral'),
  purpose: text('purpose'), // What this scene accomplishes
  conflict: text('conflict'), // Main conflict in scene
  resolution: text('resolution'), // How conflict resolves
  hooks: json('hooks'), // Story hooks and foreshadowing
  beats: json('beats'), // Story beats within scene
  isComplete: boolean('isComplete').notNull().default(false),
  generationPrompt: text('generationPrompt'),
  aiContext: json('aiContext'), // AI-specific context data
  notes: text('notes'),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Navigation Helper Table
export const bookHierarchyPath = pgTable('BookHierarchyPath', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id, { onDelete: 'cascade' }),
  storyId: uuid('storyId').references(() => story.id),
  partId: uuid('partId').references(() => part.id),
  chapterId: uuid('chapterId').references(() => chapterEnhanced.id),
  sceneId: uuid('sceneId').references(() => scene.id),
  level: varchar('level', { enum: ['book', 'story', 'part', 'chapter', 'scene'] }).notNull(),
  path: text('path').notNull(), // e.g., "/book/123/story/456/part/789"
  breadcrumb: json('breadcrumb'), // For UI navigation
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Search Index Table
export const contentSearchIndex = pgTable('ContentSearchIndex', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id, { onDelete: 'cascade' }),
  entityType: varchar('entityType', { 
    enum: ['story', 'part', 'chapter', 'scene'] 
  }).notNull(),
  entityId: uuid('entityId').notNull(),
  searchableText: text('searchableText').notNull(),
  title: text('title').notNull(),
  path: text('path').notNull(),
  metadata: json('metadata'),
  tsvector: text('tsvector'), // PostgreSQL full-text search vector
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});
```

### 1.2 Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_story_book_id ON Story(bookId);
CREATE INDEX idx_part_story_id ON Part(storyId);
CREATE INDEX idx_chapter_part_id ON ChapterEnhanced(partId);
CREATE INDEX idx_scene_chapter_id ON Scene(chapterId);

-- Order indexes for sorting
CREATE INDEX idx_story_order ON Story(bookId, order);
CREATE INDEX idx_part_order ON Part(storyId, order);
CREATE INDEX idx_chapter_order ON ChapterEnhanced(partId, order);
CREATE INDEX idx_scene_order ON Scene(chapterId, order);

-- Search indexes
CREATE INDEX idx_search_book_entity ON ContentSearchIndex(bookId, entityType);
CREATE INDEX idx_search_text ON ContentSearchIndex USING gin(to_tsvector('english', searchableText));

-- Navigation path index
CREATE INDEX idx_hierarchy_path_book ON BookHierarchyPath(bookId, level);

-- Unique constraints
CREATE UNIQUE CONSTRAINT uniq_story_book_order ON Story(bookId, order);
CREATE UNIQUE CONSTRAINT uniq_part_story_number ON Part(storyId, partNumber);
CREATE UNIQUE CONSTRAINT uniq_chapter_part_number ON ChapterEnhanced(partId, chapterNumber);
CREATE UNIQUE CONSTRAINT uniq_scene_chapter_number ON Scene(chapterId, sceneNumber);
```

---

## 2. API Routes Structure

### 2.1 RESTful API Endpoints

```typescript
// Story Management
/api/books/[bookId]/stories
  GET    - List all stories in a book
  POST   - Create new story

/api/books/[bookId]/stories/[storyId]
  GET    - Get story details with parts
  PUT    - Update story
  DELETE - Delete story

// Part Management
/api/books/[bookId]/stories/[storyId]/parts
  GET    - List all parts in a story
  POST   - Create new part

/api/books/[bookId]/parts/[partId]
  GET    - Get part details with chapters
  PUT    - Update part
  DELETE - Delete part

// Chapter Management (Enhanced)
/api/books/[bookId]/parts/[partId]/chapters
  GET    - List all chapters in a part
  POST   - Create new chapter

/api/books/[bookId]/chapters/[chapterId]
  GET    - Get chapter details with scenes
  PUT    - Update chapter
  DELETE - Delete chapter

// Scene Management
/api/books/[bookId]/chapters/[chapterId]/scenes
  GET    - List all scenes in a chapter
  POST   - Create new scene

/api/books/[bookId]/scenes/[sceneId]
  GET    - Get scene details
  PUT    - Update scene
  DELETE - Delete scene

// AI Context Routes
/api/books/[bookId]/ai-context
  POST   - Generate context for AI writing
  
/api/books/[bookId]/scenes/[sceneId]/generate
  POST   - Generate scene content with AI

// Search Routes
/api/books/[bookId]/search
  GET    - Search across all hierarchy levels

// Navigation Routes
/api/books/[bookId]/hierarchy
  GET    - Get full hierarchy tree

/api/books/[bookId]/breadcrumb
  GET    - Get breadcrumb for current position
```

### 2.2 API Route Implementation Example

```typescript
// /api/books/[bookId]/scenes/[sceneId]/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSceneWithContext } from '@/lib/ai/scene-generator';
import { getSceneContext } from '@/lib/db/queries/hierarchy';

export async function POST(
  request: NextRequest,
  { params }: { params: { bookId: string; sceneId: string } }
) {
  const { prompt, includeContext } = await request.json();
  
  // Gather hierarchical context
  const context = await getSceneContext(params.sceneId, {
    includeChapter: true,
    includePart: true,
    includeStory: true,
    includePreviousScenes: 3,
    includeCharacterHistory: true
  });
  
  // Generate content with AI
  const generatedContent = await generateSceneWithContext({
    sceneId: params.sceneId,
    prompt,
    context,
    model: 'chat-model'
  });
  
  return NextResponse.json({ content: generatedContent });
}
```

---

## 3. Page Structure and UI Components

### 3.1 Page Hierarchy

```
/books
  /page.tsx                    - Books listing
  /[bookId]
    /page.tsx                  - Book overview with stories
    /stories
      /[storyId]
        /page.tsx              - Story view with parts
        /parts
          /[partId]
            /page.tsx          - Part view with chapters
            /chapters
              /[chapterId]
                /page.tsx      - Chapter view with scenes
                /scenes
                  /[sceneId]
                    /write/page.tsx    - Scene writing interface
                    /edit/page.tsx     - Scene editing interface
```

### 3.2 Core UI Components

```typescript
// components/books/hierarchy/story-navigator.tsx
interface StoryNavigatorProps {
  bookId: string;
  currentLevel: 'story' | 'part' | 'chapter' | 'scene';
  currentId: string;
  onNavigate: (level: string, id: string) => void;
}

// components/books/hierarchy/hierarchy-breadcrumb.tsx
interface HierarchyBreadcrumbProps {
  path: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem) => void;
}

// components/books/hierarchy/content-tree.tsx
interface ContentTreeProps {
  bookId: string;
  expandedNodes: Set<string>;
  selectedNode: string;
  onNodeSelect: (nodeId: string, level: string) => void;
  onNodeExpand: (nodeId: string) => void;
}

// components/books/writing/scene-editor.tsx
interface SceneEditorProps {
  scene: Scene;
  context: HierarchicalContext;
  onSave: (content: string) => Promise<void>;
  onAIAssist: () => void;
}

// components/books/writing/ai-context-panel.tsx
interface AIContextPanelProps {
  currentLevel: string;
  currentId: string;
  contextSummary: ContextSummary;
  onRefreshContext: () => void;
  onGenerateContent: (prompt: string) => void;
}
```

### 3.3 UI Layout Structure

```tsx
// Main Writing Interface Layout
<div className="flex h-screen">
  {/* Left Sidebar - Navigation Tree */}
  <aside className="w-64 border-r">
    <ContentTree />
  </aside>
  
  {/* Center - Main Editor */}
  <main className="flex-1 flex flex-col">
    <HierarchyBreadcrumb />
    <SceneEditor />
  </main>
  
  {/* Right Sidebar - AI Context */}
  <aside className="w-80 border-l">
    <AIContextPanel />
    <CharacterPresencePanel />
    <SceneMetadataPanel />
  </aside>
</div>
```

---

## 4. AI Integration Strategy

### 4.1 Context Gathering System

```typescript
interface HierarchicalContext {
  scene: {
    current: Scene;
    previous: Scene[];
    next: Scene[];
  };
  chapter: {
    summary: string;
    scenes: SceneSummary[];
    pov: string;
    setting: string;
  };
  part: {
    description: string;
    thematicFocus: string;
    chapterSummaries: string[];
  };
  story: {
    synopsis: string;
    themes: string[];
    worldSettings: any;
    characterArcs: any;
  };
  book: {
    title: string;
    genre: string;
    overallProgress: number;
  };
}

// Context gathering function
async function gatherContextForWriting(
  sceneId: string,
  options: ContextOptions
): Promise<HierarchicalContext> {
  // Implementation details in section 4.2
}
```

### 4.2 AI Context Implementation

```typescript
// lib/ai/context-manager.ts
export class HierarchicalContextManager {
  async buildContextForScene(sceneId: string): Promise<string> {
    const scene = await getScene(sceneId);
    const chapter = await getChapter(scene.chapterId);
    const part = await getPart(chapter.partId);
    const story = await getStory(part.storyId);
    
    // Get previous scenes for continuity
    const previousScenes = await getPreviousScenes(sceneId, 3);
    
    // Get character information
    const characters = await getCharactersInScene(scene.charactersPresent);
    
    // Build context prompt
    return `
      ## Story Context
      Title: ${story.title}
      Themes: ${story.themes.join(', ')}
      
      ## Current Part: ${part.title}
      Focus: ${part.thematicFocus}
      
      ## Current Chapter: ${chapter.title}
      POV: ${chapter.pov}
      Setting: ${chapter.setting}
      
      ## Previous Scenes Summary
      ${previousScenes.map(s => s.summary).join('\n')}
      
      ## Current Scene Setup
      Type: ${scene.sceneType}
      Location: ${scene.location}
      Mood: ${scene.mood}
      Characters Present: ${characters.map(c => c.name).join(', ')}
      Purpose: ${scene.purpose}
      
      ## Writing Instructions
      ${scene.generationPrompt || 'Continue the story naturally'}
    `;
  }
  
  async buildContextForChapter(chapterId: string): Promise<string> {
    // Similar implementation for chapter-level context
  }
}
```

### 4.3 AI Tools Integration

```typescript
// lib/ai/tools/hierarchy-tools.ts
export const hierarchyTools = {
  createScene: tool({
    description: 'Create a new scene with AI assistance',
    parameters: z.object({
      chapterId: z.string(),
      sceneType: z.enum(['action', 'dialogue', 'exposition', 'transition', 'climax']),
      prompt: z.string(),
      includeContext: z.boolean().default(true)
    }),
    execute: async ({ chapterId, sceneType, prompt, includeContext }) => {
      // Implementation
    }
  }),
  
  expandPart: tool({
    description: 'Expand a part into chapters',
    parameters: z.object({
      partId: z.string(),
      numberOfChapters: z.number(),
      chapterOutlines: z.array(z.string())
    }),
    execute: async ({ partId, numberOfChapters, chapterOutlines }) => {
      // Implementation
    }
  }),
  
  generateStoryStructure: tool({
    description: 'Generate complete story structure',
    parameters: z.object({
      bookId: z.string(),
      premise: z.string(),
      numberOfParts: z.number(),
)
    }),
    execute: async (params) => {
      // Implementation
    }
  })
};
```

---

## 5. Navigation System

### 5.1 Navigation Components

```typescript
// components/books/navigation/level-switcher.tsx
export function LevelSwitcher({ 
  currentLevel, 
  onSwitch 
}: {
  currentLevel: HierarchyLevel;
  onSwitch: (level: HierarchyLevel) => void;
}) {
  return (
    <div className="flex space-x-2">
      <button onClick={() => onSwitch('story')}>Story</button>
      <button onClick={() => onSwitch('part')}>Part</button>
      <button onClick={() => onSwitch('chapter')}>Chapter</button>
      <button onClick={() => onSwitch('scene')}>Scene</button>
    </div>
  );
}

// components/books/navigation/quick-jump.tsx
export function QuickJump({ bookId }: { bookId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  
  // Search implementation
  const handleSearch = async () => {
    const searchResults = await searchHierarchy(bookId, searchQuery);
    setResults(searchResults);
  };
  
  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Jump to any story, part, chapter, or scene..."
      />
      <SearchResults results={results} />
    </div>
  );
}
```

### 5.2 Keyboard Navigation

```typescript
// hooks/use-hierarchy-navigation.ts
export function useHierarchyNavigation(bookId: string) {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for quick jump
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        openQuickJump();
      }
      
      // Alt + arrows for hierarchy navigation
      if (e.altKey) {
        switch(e.key) {
          case 'ArrowUp': navigateUp(); break;
          case 'ArrowDown': navigateDown(); break;
          case 'ArrowLeft': navigatePrevious(); break;
          case 'ArrowRight': navigateNext(); break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [bookId]);
}
```

---

## 6. Search Implementation

### 6.1 Search Query Builder

```typescript
// lib/db/queries/search.ts
export async function searchBookHierarchy(
  bookId: string,
  query: string,
  options: SearchOptions = {}
) {
  const { 
    levels = ['story', 'part', 'chapter', 'scene'],
    limit = 20,
    offset = 0 
  } = options;
  
  return await db
    .select({
      id: contentSearchIndex.entityId,
      type: contentSearchIndex.entityType,
      title: contentSearchIndex.title,
      path: contentSearchIndex.path,
      snippet: sql`
        ts_headline(
          'english',
          ${contentSearchIndex.searchableText},
          plainto_tsquery('english', ${query}),
          'MaxWords=50, MinWords=25'
        )
      `,
      rank: sql`
        ts_rank(
          to_tsvector('english', ${contentSearchIndex.searchableText}),
          plainto_tsquery('english', ${query})
        )
      `
    })
    .from(contentSearchIndex)
    .where(
      and(
        eq(contentSearchIndex.bookId, bookId),
        inArray(contentSearchIndex.entityType, levels),
        sql`
          to_tsvector('english', ${contentSearchIndex.searchableText}) 
          @@ plainto_tsquery('english', ${query})
        `
      )
    )
    .orderBy(desc(sql`rank`))
    .limit(limit)
    .offset(offset);
}
```

### 6.2 Search Indexing

```typescript
// lib/db/indexing/search-indexer.ts
export class HierarchySearchIndexer {
  async indexScene(scene: Scene) {
    const chapter = await getChapter(scene.chapterId);
    const searchableText = `
      ${scene.title || ''}
      ${scene.content}
      ${scene.location || ''}
      ${scene.notes || ''}
    `;
    
    await db.insert(contentSearchIndex).values({
      bookId: chapter.bookId,
      entityType: 'scene',
      entityId: scene.id,
      searchableText,
      title: scene.title || `Scene ${scene.sceneNumber}`,
      path: `/books/${chapter.bookId}/scenes/${scene.id}`,
      tsvector: sql`to_tsvector('english', ${searchableText})`,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: [contentSearchIndex.entityId],
      set: {
        searchableText,
        tsvector: sql`to_tsvector('english', ${searchableText})`,
        updatedAt: new Date()
      }
    });
  }
  
  // Similar methods for chapter, part, story
}
```

---

## 7. Data Flow Architecture

### 7.1 State Management

```typescript
// stores/hierarchy-store.ts
interface HierarchyStore {
  // Current position
  currentBookId: string;
  currentStoryId: string | null;
  currentPartId: string | null;
  currentChapterId: string | null;
  currentSceneId: string | null;
  
  // Cached data
  hierarchyTree: HierarchyNode;
  breadcrumb: BreadcrumbItem[];
  
  // Actions
  navigateTo: (level: string, id: string) => void;
  loadHierarchy: (bookId: string) => Promise<void>;
  createEntity: (level: string, parentId: string, data: any) => Promise<void>;
  updateEntity: (level: string, id: string, data: any) => Promise<void>;
  deleteEntity: (level: string, id: string) => Promise<void>;
  
  // AI actions
  generateWithContext: (level: string, id: string, prompt: string) => Promise<void>;
  gatherContext: (level: string, id: string) => Promise<HierarchicalContext>;
}
```

### 7.2 Real-time Updates

```typescript
// lib/realtime/hierarchy-sync.ts
export class HierarchyRealtimeSync {
  private pusher: Pusher;
  private channel: Channel;
  
  constructor(bookId: string) {
    this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
    });
    
    this.channel = this.pusher.subscribe(`book-${bookId}`);
  }
  
  onEntityCreated(callback: (data: any) => void) {
    this.channel.bind('entity-created', callback);
  }
  
  onEntityUpdated(callback: (data: any) => void) {
    this.channel.bind('entity-updated', callback);
  }
  
  onEntityDeleted(callback: (data: any) => void) {
    this.channel.bind('entity-deleted', callback);
  }
}
```

---

## 8. Integration Points

### 8.1 Chat System Integration

```typescript
// Enhanced chat creation for hierarchy levels
export async function createHierarchyChat(
  level: 'story' | 'part' | 'chapter' | 'scene',
  entityId: string,
  userId: string
) {
  const entity = await getEntity(level, entityId);
  const hierarchy = await getHierarchyPath(level, entityId);
  
  return await db.insert(chat).values({
    title: `${hierarchy.breadcrumb} - ${entity.title}`,
    userId,
    chatType: 'book', // Using existing book type
    visibility: 'private',
    metadata: {
      hierarchyLevel: level,
      entityId,
      bookId: hierarchy.bookId,
      path: hierarchy.path
    },
    createdAt: new Date()
  }).returning();
}
```

### 8.2 Document System Integration

```typescript
// Link documents to hierarchy entities
export async function linkDocumentToEntity(
  documentId: string,
  level: string,
  entityId: string
) {
  await db.insert(documentEntityLink).values({
    documentId,
    entityLevel: level,
    entityId,
    createdAt: new Date()
  });
}
```

---

## 9. Migration Strategy

### 9.1 Database Migration

```sql
-- Migration: Add hierarchy tables
BEGIN;

-- Create new tables (as defined in section 1.1)
CREATE TABLE Story ...;
CREATE TABLE Part ...;
CREATE TABLE ChapterEnhanced ...;
CREATE TABLE Scene ...;
CREATE TABLE BookHierarchyPath ...;
CREATE TABLE ContentSearchIndex ...;

-- Migrate existing chapters to new structure
INSERT INTO ChapterEnhanced (
  id, bookId, chapterNumber, globalChapterNumber, 
  title, content, wordCount, isPublished, publishedAt,
  chatId, generationPrompt, previousChapterSummary,
  authorNote, createdAt, updatedAt
)
SELECT 
  id, bookId, chapterNumber, chapterNumber,
  title, content, wordCount, isPublished, publishedAt,
  chatId, generationPrompt, previousChapterSummary,
  authorNote, createdAt, updatedAt
FROM Chapter;

-- Create default story and part for existing books
INSERT INTO Story (bookId, title, order)
SELECT id, title, 0 FROM Book;

INSERT INTO Part (storyId, title, partNumber, order)
SELECT s.id, 'Part 1', 1, 0 
FROM Story s;

-- Update chapters with part references
UPDATE ChapterEnhanced ce
SET partId = (
  SELECT p.id FROM Part p
  JOIN Story s ON p.storyId = s.id
  WHERE s.bookId = ce.bookId
  LIMIT 1
);

COMMIT;
```

### 9.2 Code Migration

```typescript
// lib/migration/hierarchy-migration.ts
export async function migrateToHierarchy() {
  const books = await db.select().from(book);
  
  for (const b of books) {
    // Create default story
    const [story] = await db.insert(storyTable).values({
      bookId: b.id,
      title: b.title,
      synopsis: b.description,
      order: 0
    }).returning();
    
    // Create default part
    const [part] = await db.insert(partTable).values({
      storyId: story.id,
      title: 'Part 1',
      partNumber: 1,
      order: 0
    }).returning();
    
    // Update chapters
    await db.update(chapterEnhanced)
      .set({ partId: part.id })
      .where(eq(chapterEnhanced.bookId, b.id));
    
    // Create scenes from chapter content
    const chapters = await db.select()
      .from(chapterEnhanced)
      .where(eq(chapterEnhanced.bookId, b.id));
    
    for (const chapter of chapters) {
      if (chapter.content && typeof chapter.content === 'string') {
        await db.insert(scene).values({
          chapterId: chapter.id,
          sceneNumber: 1,
          content: chapter.content,
          wordCount: chapter.wordCount,
          order: 0,
          sceneType: 'action'
        });
      }
    }
  }
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

```typescript
// tests/hierarchy/crud.test.ts
describe('Hierarchy CRUD Operations', () => {
  test('Create story with parts and chapters', async () => {
    const story = await createStory(bookId, { title: 'Test Story' });
    expect(story).toBeDefined();
    
    const part = await createPart(story.id, { title: 'Part 1' });
    expect(part.storyId).toBe(story.id);
    
    const chapter = await createChapter(part.id, { title: 'Chapter 1' });
    expect(chapter.partId).toBe(part.id);
  });
  
  test('Delete cascade works correctly', async () => {
    const story = await createStory(bookId, { title: 'Test Story' });
    const part = await createPart(story.id, { title: 'Part 1' });
    
    await deleteStory(story.id);
    
    const parts = await getPartsByStoryId(story.id);
    expect(parts).toHaveLength(0);
  });
});
```

### 10.2 E2E Tests

```typescript
// tests/e2e/hierarchy-navigation.test.ts
test('Navigate through hierarchy levels', async ({ page }) => {
  await page.goto('/books/test-book-id');
  
  // Click on story
  await page.click('[data-story-id="story-1"]');
  await expect(page).toHaveURL(/.*\/stories\/story-1/);
  
  // Click on part
  await page.click('[data-part-id="part-1"]');
  await expect(page).toHaveURL(/.*\/parts\/part-1/);
  
  // Navigate using breadcrumb
  await page.click('[data-breadcrumb="story"]');
  await expect(page).toHaveURL(/.*\/stories\/story-1/);
});
```

### 10.3 AI Integration Tests

```typescript
// tests/ai/context-generation.test.ts
describe('AI Context Generation', () => {
  test('Generate scene with full context', async () => {
    const context = await gatherContextForWriting(sceneId, {
      includeStory: true,
      includePart: true,
      includeChapter: true,
      includePreviousScenes: 3
    });
    
    expect(context.story).toBeDefined();
    expect(context.part).toBeDefined();
    expect(context.chapter).toBeDefined();
    expect(context.scene.previous).toHaveLength(3);
  });
});
```

---

## 11. Implementation Steps

### Phase 1: Database and Core Models (Week 1)
1. Create migration files for new tables
2. Implement Drizzle schema definitions
3. Create indexes and constraints
4. Test database structure
5. Implement basic CRUD queries

### Phase 2: API Routes (Week 1-2)
1. Implement story management routes
2. Implement part management routes
3. Implement enhanced chapter routes
4. Implement scene management routes
5. Add search and navigation routes
6. Test all API endpoints

### Phase 3: UI Components (Week 2-3)
1. Create hierarchy tree component
2. Build breadcrumb navigation
3. Implement scene editor
4. Create AI context panel
5. Build quick navigation system
6. Add keyboard shortcuts

### Phase 4: AI Integration (Week 3-4)
1. Implement context gathering system
2. Create AI tools for hierarchy
3. Build scene generation with context
4. Add context-aware suggestions
5. Test AI integration

### Phase 5: Migration and Testing (Week 4)
1. Create migration scripts
2. Migrate existing data
3. Run comprehensive tests
4. Fix bugs and optimize
5. Deploy to staging

### Phase 6: Polish and Documentation (Week 5)
1. Optimize performance
2. Add missing features
3. Write user documentation
4. Create video tutorials
5. Production deployment

---

## 12. Performance Considerations

### 12.1 Query Optimization
- Use database views for complex hierarchy queries
- Implement query result caching with Redis
- Batch database operations where possible
- Use connection pooling for database connections

### 12.2 Frontend Optimization
- Lazy load hierarchy tree nodes
- Virtual scrolling for long lists
- Debounce search queries
- Cache hierarchy data in browser storage
- Use optimistic UI updates

### 12.3 AI Optimization
- Cache AI-generated contexts
- Batch AI requests when possible
- Use streaming for long content generation
- Implement request queuing for AI operations

---

## 13. Security Considerations

### 13.1 Access Control
- Verify user ownership at every level
- Implement role-based permissions for co-authors
- Add rate limiting to API routes
- Validate all input data

### 13.2 Data Protection
- Encrypt sensitive content at rest
- Use secure sessions for authentication
- Implement audit logging for all changes
- Regular security audits

---

## 14. Monitoring and Analytics

### 14.1 Metrics to Track
- Average scene/chapter/part word counts
- AI generation success rates
- User navigation patterns
- Search query performance
- Content creation velocity

### 14.2 Error Tracking
- Implement Sentry for error monitoring
- Log all API errors with context
- Track AI generation failures
- Monitor database query performance

---

## Conclusion

This implementation plan provides a comprehensive roadmap for integrating the 4-level book organization hierarchy into Fictures. The plan ensures:

1. **Complete CRUD operations** at all hierarchy levels
2. **Proper database relationships** with cascading deletes and foreign keys
3. **AI integration** that considers context from all levels
4. **Intuitive navigation** between hierarchy levels
5. **Powerful search** across all content
6. **Single-phase implementation** with clear weekly milestones

The architecture is designed to be scalable, maintainable, and provides a solid foundation for future enhancements while integrating seamlessly with the existing Fictures platform.