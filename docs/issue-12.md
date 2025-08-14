# Issue #12: Minimum Implementation Plan - Book and Chapter Management System

## Overview

Transform Fictures from a complex chat/artifact system into a simple book and chapter writing platform. This document outlines the minimum viable implementation focusing on essential user workflows and clean architecture.

## Core User Flow

### Starting Point: Book Selection Hub

**Entry Route**: `/books`

The user journey begins at the Book Selection Hub, which serves as the central navigation point for all writing activities.

#### Book Selection Hub Features:
- Display all user's books as cards/list
- "Create New Book" prominent action button
- Each book shows:
  - Title and cover
  - Chapter count
  - Last modified date
  - "Continue Writing" button

### User Journey Flow

```
1. /books (Book Selection Hub)
   ↓
2. Select existing book OR Create new book
   ↓
3. /books/[bookId] (Book Overview)
   ↓
4. Select chapter to write/edit
   ↓
5. /books/[bookId]/chapters/[chapterNumber]/write (Chapter Writing)
```

## Database Schema Changes

### Rename Document to Book

The current `Document` table should be renamed to `Book` to better represent its purpose:

```sql
-- Create Book table (replacing Document)
CREATE TABLE "Book" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "genre" VARCHAR(100),
  "coverImageUrl" TEXT,
  "status" VARCHAR(50) DEFAULT 'draft', -- draft, ongoing, completed
  "visibility" VARCHAR(20) DEFAULT 'private', -- private, public
  "totalChapters" INTEGER DEFAULT 0,
  "totalWords" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Update Chapter table to reference Book
ALTER TABLE "Chapter" 
  ADD COLUMN "bookId" UUID REFERENCES "Book"("id") ON DELETE CASCADE,
  ADD COLUMN "chatId" UUID REFERENCES "Chat"("id"),
  ADD COLUMN "generationPrompt" TEXT,
  ADD COLUMN "previousChapterSummary" TEXT;

-- Create indexes for performance
CREATE INDEX "idx_book_userId" ON "Book"("userId");
CREATE INDEX "idx_chapter_bookId" ON "Chapter"("bookId", "chapterNumber");
CREATE INDEX "idx_chapter_chatId" ON "Chapter"("chatId");

-- Create ChapterGeneration history table
CREATE TABLE "ChapterGeneration" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "chapterId" UUID REFERENCES "Chapter"("id") ON DELETE CASCADE,
  "prompt" TEXT NOT NULL,
  "generatedContent" TEXT,
  "status" VARCHAR(20) DEFAULT 'pending',
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## Page Architecture

### 1. Book Selection Hub (`/books`)

**Purpose**: Central navigation for all books

**Components**:
```typescript
// /app/books/page.tsx
export default function BooksPage() {
  // Fetch user's books
  // Display book grid/list
  // Handle navigation to book overview
}

// /components/book/book-card.tsx
interface BookCardProps {
  book: {
    id: string;
    title: string;
    coverImageUrl?: string;
    totalChapters: number;
    totalWords: number;
    updatedAt: Date;
  };
}

// /components/book/create-book-dialog.tsx
interface CreateBookDialogProps {
  onBookCreated: (bookId: string) => void;
}
```

### 2. Book Overview (`/books/[bookId]`)

**Purpose**: Manage chapters for a specific book

**Features**:
- Display book metadata
- List all chapters with status
- Quick actions:
  - Continue writing next chapter
  - Edit existing chapter
  - Create new chapter
  - Edit book details

**Components**:
```typescript
// /app/books/[bookId]/page.tsx
export default function BookOverviewPage({ params }: { params: { bookId: string } }) {
  // Display book details
  // List chapters
  // Handle chapter navigation
}

// /components/book/chapter-list.tsx
interface ChapterListProps {
  bookId: string;
  chapters: Chapter[];
}
```

### 3. Chapter Writing (`/books/[bookId]/chapters/[chapterNumber]/write`)

**Purpose**: Write and edit chapters

**Already Implemented Components**:
- `chapter-write-layout.tsx` - Dual panel layout
- `chapter-chat-panel.tsx` - Prompt input
- `chapter-viewer-panel.tsx` - Content viewer/editor
- `chapter-prompt-input.tsx` - Input component

**Route Implementation**:
```typescript
// /app/books/[bookId]/chapters/[chapterNumber]/write/page.tsx
export default function ChapterWritePage({ 
  params 
}: { 
  params: { bookId: string; chapterNumber: string } 
}) {
  return (
    <ChapterWriteLayout 
      bookId={params.bookId}
      chapterNumber={parseInt(params.chapterNumber)}
    />
  );
}
```

## API Endpoints

### Book Management

```typescript
// GET /api/books
// List all user's books
interface GetBooksResponse {
  books: Book[];
}

// POST /api/books
// Create new book
interface CreateBookRequest {
  title: string;
  description?: string;
  genre?: string;
  coverImageUrl?: string;
}

// GET /api/books/[bookId]
// Get book details with chapters
interface GetBookResponse {
  book: Book;
  chapters: Chapter[];
}

// PUT /api/books/[bookId]
// Update book metadata
interface UpdateBookRequest {
  title?: string;
  description?: string;
  genre?: string;
  coverImageUrl?: string;
  status?: string;
}

// GET /api/books/[bookId]/chapters
// List chapters for a book
interface GetChaptersResponse {
  chapters: Chapter[];
}
```

### Chapter Generation (Already Implemented)

```typescript
// POST /api/chapters/generate
// Generate chapter content

// POST /api/chapters/save
// Save chapter content

// GET /api/chapters/context
// Get chapter context for generation
```

## Implementation Tasks

### Essential Components to Build

1. **Book Selection Hub**
   - `BookCard` component
   - `BookGrid` component
   - `CreateBookDialog` component
   - Books listing page

2. **Book Management**
   - `BookOverview` page
   - `ChapterList` component
   - `BookMetadata` editor
   - Chapter status indicators

3. **Navigation Components**
   - Breadcrumb navigation
   - Book switcher dropdown
   - Chapter navigation (prev/next)

### Database Operations

```typescript
// lib/db/queries/books.ts
export async function getUserBooks(userId: string) {
  return await db
    .select()
    .from(books)
    .where(eq(books.userId, userId))
    .orderBy(desc(books.updatedAt));
}

export async function createBook(data: {
  userId: string;
  title: string;
  description?: string;
}) {
  const [book] = await db
    .insert(books)
    .values(data)
    .returning();
  
  // Create first chapter automatically
  await db.insert(chapters).values({
    bookId: book.id,
    chapterNumber: 1,
    title: 'Chapter 1',
    content: '',
    wordCount: 0
  });
  
  return book;
}

export async function getBookWithChapters(bookId: string) {
  const book = await db
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);
    
  const chapters = await db
    .select()
    .from(chapters)
    .where(eq(chapters.bookId, bookId))
    .orderBy(asc(chapters.chapterNumber));
    
  return { book: book[0], chapters };
}
```

## User Workflow Examples

### Scenario 1: New User Creating First Book

1. User logs in → Redirected to `/books`
2. Sees empty state with "Create Your First Book" button
3. Clicks button → Opens creation dialog
4. Enters book title and description
5. System creates book and Chapter 1
6. Redirected to `/books/[bookId]/chapters/1/write`
7. User enters prompt and generates first chapter

### Scenario 2: Returning User Continuing Story

1. User logs in → Goes to `/books`
2. Sees their books with "Continue Writing" buttons
3. Clicks on book → Goes to `/books/[bookId]`
4. Sees chapter list with "Chapter 5 (in progress)"
5. Clicks "Continue Chapter 5"
6. Redirected to `/books/[bookId]/chapters/5/write`
7. Previous content loads, user continues writing

### Scenario 3: User Managing Multiple Books

1. User at `/books` sees all their books
2. Can quickly switch between books
3. Each book shows progress (5/10 chapters complete)
4. Can archive completed books
5. Can duplicate books as templates

## Navigation Structure

```
/books
├── /new (Create book modal/page)
├── /[bookId]
│   ├── /edit (Edit book metadata)
│   └── /chapters
│       ├── /new (Create chapter)
│       └── /[chapterNumber]
│           └── /write (Writing interface)
```

## Success Criteria

### Functional Requirements
- [ ] User can create and manage multiple books
- [ ] User can navigate between books easily
- [ ] User can write chapters within each book
- [ ] Clear visual hierarchy: Books → Chapters → Content
- [ ] Auto-save and manual save work properly

### Performance Metrics
- Page load: < 1.5 seconds
- Book creation: < 1 second
- Chapter generation start: < 1 second
- Navigation between pages: < 500ms

### User Experience Goals
- Clear starting point (Book Selection Hub)
- Intuitive navigation between books and chapters
- No confusion about where content is saved
- Easy to resume writing where left off

## Technical Considerations

### State Management
- Book selection persists across navigation
- Chapter content auto-saves every 30 seconds
- Unsaved changes warning when navigating away

### Caching Strategy
- Cache book list for quick navigation
- Cache recent chapters for fast loading
- Invalidate cache on updates

### Error Handling
- Handle book not found (404)
- Handle unauthorized access (403)
- Graceful handling of failed saves
- Retry logic for generation failures

## Migration Path

### From Current System
1. Rename `Document` table to `Book`
2. Update all references from `document` to `book`
3. Update Chapter table with `bookId` foreign key
4. Create new routes under `/books`
5. Remove artifact/canvas components
6. Simplify chat API to chapter generation only

### Data Migration Script
```sql
-- Rename Document to Book
ALTER TABLE "Document" RENAME TO "Book";

-- Update foreign key references
ALTER TABLE "Chapter" 
  RENAME COLUMN "documentId" TO "bookId";

-- Clean up unused columns
ALTER TABLE "Book" 
  DROP COLUMN IF EXISTS "contentType",
  DROP COLUMN IF EXISTS "artifactData";
```

## Conclusion

This minimum implementation focuses on three core pages:

1. **Book Selection Hub** (`/books`) - Starting point for all users
2. **Book Overview** (`/books/[bookId]`) - Chapter management
3. **Chapter Writing** (`/books/[bookId]/chapters/[chapterNumber]/write`) - Content creation

By implementing these three pages with clean navigation flow, users will have a clear mental model: 
- Books contain chapters
- Select a book to see its chapters  
- Select a chapter to write content

This approach eliminates confusion from the previous chat/artifact system and provides a familiar, book-like organizational structure that writers naturally understand.