# Chapter V2 - Technical Specifications

## Component Interfaces

### Core Components

```typescript
// components/chapter/chapter-write-layout.tsx
export interface ChapterWriteLayoutProps {
  storyId: string;
  chapterNumber: number;
}

export interface ChapterWriteLayoutState {
  isGenerating: boolean;
  content: string;
  error: string | null;
  generationHistory: ChapterGeneration[];
  isSaving: boolean;
  lastSaved: Date | null;
}

// components/chapter/chapter-chat-panel.tsx
export interface ChapterChatPanelProps {
  storyId: string;
  chapterNumber: number;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
  previousChapterSummary?: string;
  generationHistory: ChapterGeneration[];
}

export interface ChapterPromptInputProps {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  placeholder?: string;
  maxLength?: number;
}

// components/chapter/chapter-viewer-panel.tsx
export interface ChapterViewerPanelProps {
  content: string;
  isGenerating: boolean;
  onSave: (content: string) => Promise<void>;
  onEdit: (content: string) => void;
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
}

export interface ChapterContentDisplayProps {
  content: string;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export interface ChapterEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onCancel: () => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}
```

## API Specifications

### Chapter Generation API

```typescript
// app/api/chapters/generate/route.ts
export interface GenerateChapterRequest {
  storyId: string;
  chapterNumber: number;
  prompt: string;
  includeContext?: {
    previousChapters?: boolean;  // Include summaries of previous chapters
    characters?: boolean;        // Include character profiles
    plotOutline?: boolean;       // Include overall plot structure
    writingStyle?: boolean;      // Include author's writing style preferences
  };
  maxTokens?: number;            // Maximum tokens for generation (default: 4000)
  temperature?: number;          // AI temperature (default: 0.7)
}

export interface GenerateChapterResponse {
  generationId: string;
  stream: ReadableStream<ChapterChunk>;
}

export interface ChapterChunk {
  type: 'content' | 'status' | 'error';
  content?: string;
  status?: 'generating' | 'completed' | 'failed';
  error?: string;
  metadata?: {
    tokensUsed?: number;
    wordCount?: number;
  };
}

// app/api/chapters/save/route.ts
export interface SaveChapterRequest {
  storyId: string;
  chapterNumber: number;
  content: string;
  generationId?: string;
  autoSave?: boolean;
}

export interface SaveChapterResponse {
  success: boolean;
  chapterId: string;
  savedAt: Date;
  wordCount: number;
}

// app/api/chapters/context/route.ts
export interface GetChapterContextRequest {
  storyId: string;
  chapterNumber: number;
  includeChapters?: number[];  // Specific chapter numbers to include
  maxSummaryLength?: number;
}

export interface ChapterContext {
  story: {
    id: string;
    title: string;
    genre: string;
    description: string;
  };
  previousChapters: {
    chapterNumber: number;
    title: string;
    summary: string;
  }[];
  characters: {
    id: string;
    name: string;
    role: string;
    description: string;
  }[];
  currentChapter?: {
    id: string;
    title: string;
    content: string;
    lastPrompt?: string;
  };
}
```

## Database Schema

```typescript
// lib/db/schema/chapter-v2.ts
export interface ChapterV2 {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  chatId?: string;              // Links to dedicated chat for this chapter
  generationPrompt?: string;     // Last successful generation prompt
  previousChapterSummary?: string;
  wordCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  authorNote?: string;
}

export interface ChapterGeneration {
  id: string;
  chapterId: string;
  prompt: string;
  generatedContent?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  error?: string;
  metadata?: {
    model: string;
    tokensUsed: number;
    temperature: number;
    duration: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface ChapterChat {
  id: string;
  chapterId: string;
  userId: string;
  messages: ChapterMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    generationId?: string;
    wordCount?: number;
  };
  createdAt: Date;
}
```

## State Management

```typescript
// hooks/use-chapter-generation.ts
export interface UseChapterGenerationOptions {
  storyId: string;
  chapterNumber: number;
  onSuccess?: (content: string) => void;
  onError?: (error: Error) => void;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseChapterGenerationReturn {
  // State
  isGenerating: boolean;
  content: string;
  error: string | null;
  generationHistory: ChapterGeneration[];
  
  // Actions
  generate: (prompt: string) => Promise<void>;
  regenerate: (generationId: string) => Promise<void>;
  cancel: () => void;
  clear: () => void;
  
  // Utilities
  getContext: () => Promise<ChapterContext>;
  saveContent: (content: string) => Promise<void>;
}

// hooks/use-chapter-editor.ts
export interface UseChapterEditorOptions {
  initialContent: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
  onSave?: (content: string) => Promise<void>;
}

export interface UseChapterEditorReturn {
  // State
  content: string;
  isEditing: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  wordCount: number;
  
  // Actions
  setContent: (content: string) => void;
  startEditing: () => void;
  stopEditing: () => void;
  save: () => Promise<void>;
  revert: () => void;
  
  // Export
  exportMarkdown: () => string;
  exportHTML: () => string;
  exportDocx: () => Promise<Blob>;
}
```

## Streaming Implementation

```typescript
// lib/streaming/chapter-stream.ts
export class ChapterStreamHandler {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();
  
  constructor(
    private generationId: string,
    private onChunk?: (chunk: ChapterChunk) => void
  ) {}
  
  createStream(): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        this.controller = controller;
        this.sendStatus('generating');
      },
      
      cancel: () => {
        this.sendStatus('cancelled');
      }
    });
  }
  
  sendContent(content: string): void {
    const chunk: ChapterChunk = {
      type: 'content',
      content,
      metadata: {
        wordCount: content.split(/\s+/).length
      }
    };
    
    this.send(chunk);
    this.onChunk?.(chunk);
  }
  
  sendError(error: string): void {
    const chunk: ChapterChunk = {
      type: 'error',
      error
    };
    
    this.send(chunk);
    this.controller?.close();
  }
  
  sendStatus(status: ChapterChunk['status']): void {
    const chunk: ChapterChunk = {
      type: 'status',
      status
    };
    
    this.send(chunk);
    
    if (status === 'completed' || status === 'failed') {
      this.controller?.close();
    }
  }
  
  private send(chunk: ChapterChunk): void {
    const data = JSON.stringify(chunk) + '\n';
    this.controller?.enqueue(this.encoder.encode(data));
  }
}
```

## Migration Scripts

```sql
-- migrations/001_chapter_v2_schema.sql
BEGIN;

-- Add chapter-chat relationship
ALTER TABLE "Chapter" 
ADD COLUMN IF NOT EXISTS "chatId" UUID REFERENCES "Chat"("id"),
ADD COLUMN IF NOT EXISTS "generationPrompt" TEXT,
ADD COLUMN IF NOT EXISTS "previousChapterSummary" TEXT;

-- Create chapter generation history
CREATE TABLE IF NOT EXISTS "ChapterGeneration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapterId" UUID REFERENCES "Chapter"("id") ON DELETE CASCADE NOT NULL,
  "prompt" TEXT NOT NULL,
  "generatedContent" TEXT,
  "status" VARCHAR(20) DEFAULT 'pending' CHECK ("status" IN ('pending', 'generating', 'completed', 'failed')),
  "error" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
  "completedAt" TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_chapter_chatid" ON "Chapter"("chatId");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_chapterid" ON "ChapterGeneration"("chapterId");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_status" ON "ChapterGeneration"("status");
CREATE INDEX IF NOT EXISTS "idx_chapter_generation_created" ON "ChapterGeneration"("createdAt" DESC);

-- Add chat type for better organization
ALTER TABLE "Chat" 
ADD COLUMN IF NOT EXISTS "chatType" VARCHAR(20) DEFAULT 'general' CHECK ("chatType" IN ('general', 'chapter', 'story'));

-- Update existing chats linked to chapters
UPDATE "Chat" 
SET "chatType" = 'chapter' 
WHERE "id" IN (SELECT DISTINCT "chatId" FROM "Chapter" WHERE "chatId" IS NOT NULL);

COMMIT;

-- rollback/001_chapter_v2_rollback.sql
BEGIN;

-- Remove indexes
DROP INDEX IF EXISTS "idx_chapter_chatid";
DROP INDEX IF EXISTS "idx_chapter_generation_chapterid";
DROP INDEX IF EXISTS "idx_chapter_generation_status";
DROP INDEX IF EXISTS "idx_chapter_generation_created";

-- Drop new table
DROP TABLE IF EXISTS "ChapterGeneration";

-- Remove columns from Chapter
ALTER TABLE "Chapter" 
DROP COLUMN IF EXISTS "chatId",
DROP COLUMN IF EXISTS "generationPrompt",
DROP COLUMN IF EXISTS "previousChapterSummary";

-- Remove chat type
ALTER TABLE "Chat" 
DROP COLUMN IF EXISTS "chatType";

COMMIT;
```

## Environment Variables

```bash
# .env.local additions for Chapter V2
FEATURE_CHAPTER_WRITING_V2=true
CHAPTER_V2_ROLLOUT_PERCENTAGE=0
CHAPTER_MAX_TOKENS=4000
CHAPTER_DEFAULT_TEMPERATURE=0.7
CHAPTER_AUTO_SAVE_DELAY=30000
CHAPTER_CONTEXT_CACHE_TTL=300
```

## Error Handling

```typescript
// lib/errors/chapter-errors.ts
export class ChapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ChapterError';
  }
}

export class ChapterGenerationError extends ChapterError {
  constructor(message: string, details?: any) {
    super(message, 'GENERATION_ERROR', 500, details);
  }
}

export class ChapterSaveError extends ChapterError {
  constructor(message: string, details?: any) {
    super(message, 'SAVE_ERROR', 500, details);
  }
}

export class ChapterNotFoundError extends ChapterError {
  constructor(chapterNumber: number, storyId: string) {
    super(
      `Chapter ${chapterNumber} not found for story ${storyId}`,
      'NOT_FOUND',
      404
    );
  }
}

export class ChapterPermissionError extends ChapterError {
  constructor(action: string) {
    super(
      `Permission denied for action: ${action}`,
      'PERMISSION_DENIED',
      403
    );
  }
}
```

## Testing Specifications

```typescript
// tests/chapter-v2/unit/generation.test.ts
describe('ChapterGeneration', () => {
  describe('generate()', () => {
    it('should stream chapter content based on prompt');
    it('should include context when requested');
    it('should handle generation errors gracefully');
    it('should cancel generation on abort');
    it('should track token usage');
  });
  
  describe('save()', () => {
    it('should save generated content');
    it('should update word count');
    it('should handle concurrent saves');
    it('should validate content before saving');
  });
});

// tests/chapter-v2/integration/workflow.test.ts
describe('ChapterWritingWorkflow', () => {
  it('should create new chapter from prompt');
  it('should load existing chapter for editing');
  it('should maintain generation history');
  it('should handle network interruptions');
  it('should sync between multiple tabs');
});

// tests/chapter-v2/e2e/chapter-writing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chapter Writing E2E', () => {
  test('complete chapter creation flow', async ({ page }) => {
    // Navigate to chapter writing
    await page.goto('/stories/test-story/chapters/1/write');
    
    // Enter prompt
    await page.fill('[data-testid="chapter-prompt"]', 'Write an exciting opening...');
    
    // Generate chapter
    await page.click('[data-testid="generate-button"]');
    
    // Wait for generation
    await expect(page.locator('[data-testid="chapter-content"]')).toContainText('Chapter 1');
    
    // Save chapter
    await page.click('[data-testid="save-button"]');
    
    // Verify save
    await expect(page.locator('[data-testid="save-status"]')).toContainText('Saved');
  });
});
```

## Performance Metrics

```typescript
// lib/monitoring/chapter-metrics.ts
export interface ChapterMetrics {
  // Generation metrics
  generationStartTime: number;
  firstTokenTime: number;
  completionTime: number;
  tokensGenerated: number;
  tokensPerSecond: number;
  
  // UI metrics
  inputLatency: number;
  renderTime: number;
  saveTime: number;
  
  // Resource metrics
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
}

export class ChapterMetricsCollector {
  collect(metrics: Partial<ChapterMetrics>): void {
    // Send to analytics
    // Log to monitoring service
    // Update performance dashboard
  }
}
```