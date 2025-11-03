# Community Feature Specification

This document outlines the specifications for upgrading the Fictures community features from mock data to full production implementation, including unified reply system, image uploads, rich text editor, and responsive mobile design.

## Table of Contents
1. [Current State Analysis](#current-state-analysis)
2. [Database Schema Updates](#database-schema-updates)
3. [Unified Reply System](#unified-reply-system)
4. [Rich Text Editor with Image Upload](#rich-text-editor-with-image-upload)
5. [API Endpoints](#api-endpoints)
6. [Component Updates](#component-updates)
7. [Responsive Mobile Design](#responsive-mobile-design)
8. [Implementation Plan](#implementation-plan)

---

## Current State Analysis

### What Currently Works
- ✅ Community hub page with story discovery grid
- ✅ Database schema for posts and replies with relationships
- ✅ GET `/api/community/stories` endpoint (returns real stories with mock stats)
- ✅ Community UI components (cards, forms, lists)
- ✅ Data fetching hooks with SWR caching
- ✅ Protected actions with authentication
- ✅ Post type system (discussion, theory, review, question, fan-content)
- ✅ Responsive design foundation
- ✅ Dark mode support

### What Needs Implementation
- ❌ Real API endpoints for post/reply CRUD operations
- ❌ Post creation backend (form exists, submits to mock)
- ❌ Reply system connecting reading page and community
- ❌ Rich text editor with markdown and image support
- ❌ Image upload functionality for posts/replies
- ❌ Like persistence (currently client-side only)
- ❌ View count tracking
- ❌ Real community stats (currently mock data)
- ❌ Story-level comments in community (separate from scene comments)

### Mock Data Currently Used
**Location:** `src/app/community/story/[storyId]/page.tsx`

```typescript
// Hardcoded story data
const getStoryData = (storyId: string) => ({
  id: storyId,
  title: 'Digital Nexus: The Code Between Worlds',
  genre: 'Science Fiction/Fantasy',
  author: 'Thomas Jeon',
  totalPosts: 89,
  totalMembers: 1247,
  totalViews: 45892,
  averageRating: 4.7,
});

// Hardcoded posts
const getMockPosts = () => [
  {
    id: '1',
    type: 'theory' as const,
    title: 'Theory about Maya\'s powers',
    content: '...',
    author: { ... },
    likes: 45,
    replies: 12,
    views: 234,
    createdAt: '2024-01-15T10:30:00Z',
    isPinned: true,
  },
  // ... more mock posts
];
```

**Status:** Needs replacement with real API calls

---

## Database Schema Updates

### 1. Update `community_posts` Table

**Add missing fields for rich content and moderation:**

```sql
ALTER TABLE community_posts
ADD COLUMN content_type VARCHAR(20) DEFAULT 'markdown' NOT NULL,
ADD COLUMN content_html TEXT, -- Rendered HTML for performance
ADD COLUMN content_images JSON DEFAULT '[]'::json, -- Array of image URLs
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN edit_count INTEGER DEFAULT 0,
ADD COLUMN last_edited_at TIMESTAMP,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete
ADD COLUMN deleted_at TIMESTAMP,
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'approved',
ADD COLUMN moderation_reason TEXT,
ADD COLUMN moderated_by TEXT REFERENCES users(id),
ADD COLUMN moderated_at TIMESTAMP,
ADD COLUMN tags JSON DEFAULT '[]'::json, -- For categorization
ADD COLUMN mentions JSON DEFAULT '[]'::json; -- User mentions [@username]

CREATE INDEX idx_community_posts_moderation ON community_posts(moderation_status);
CREATE INDEX idx_community_posts_deleted ON community_posts(is_deleted);
CREATE INDEX idx_community_posts_story_type ON community_posts(story_id, type);
```

**Content Types:**
- `markdown` - Default, stored as markdown, rendered to HTML
- `html` - Rich text editor output
- `plain` - Plain text only

**Moderation Statuses:**
- `approved` - Visible to all
- `pending` - Awaiting moderation
- `flagged` - Reported by users
- `rejected` - Hidden by moderators

### 2. Update `community_replies` Table

**Add rich content support:**

```sql
ALTER TABLE community_replies
ADD COLUMN content_type VARCHAR(20) DEFAULT 'markdown' NOT NULL,
ADD COLUMN content_html TEXT,
ADD COLUMN content_images JSON DEFAULT '[]'::json,
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN edit_count INTEGER DEFAULT 0,
ADD COLUMN last_edited_at TIMESTAMP,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE,
ADD COLUMN deleted_at TIMESTAMP,
ADD COLUMN mentions JSON DEFAULT '[]'::json,
ADD COLUMN depth INTEGER DEFAULT 0; -- Reply nesting depth (0-3)

CREATE INDEX idx_community_replies_deleted ON community_replies(is_deleted);
CREATE INDEX idx_community_replies_parent ON community_replies(parent_reply_id);
```

### 3. New Table: `post_images`

**Track images uploaded to posts/replies:**

```sql
CREATE TABLE post_images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL, -- Vercel Blob URL
  blob_key TEXT NOT NULL, -- Blob storage key
  filename TEXT NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  size_bytes INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  reply_id TEXT REFERENCES community_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  )
);

CREATE INDEX idx_post_images_post ON post_images(post_id);
CREATE INDEX idx_post_images_reply ON post_images(reply_id);
CREATE INDEX idx_post_images_uploaded_by ON post_images(uploaded_by);
```

### 4. New Table: `post_likes`

**Replace integer counter with relational likes:**

```sql
CREATE TABLE post_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id TEXT REFERENCES community_posts(id) ON DELETE CASCADE,
  reply_id TEXT REFERENCES community_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CHECK (
    (post_id IS NOT NULL AND reply_id IS NULL) OR
    (post_id IS NULL AND reply_id IS NOT NULL)
  ),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, reply_id)
);

CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_reply ON post_likes(reply_id);
```

### 5. New Table: `post_views`

**Track unique views per post:**

```sql
CREATE TABLE post_views (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE, -- NULL for anonymous
  session_id TEXT, -- For anonymous tracking
  ip_hash TEXT, -- Hashed IP for fraud detection
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id, created_at::date), -- One view per user per day
  UNIQUE(post_id, session_id, created_at::date) -- One view per session per day
);

CREATE INDEX idx_post_views_post ON post_views(post_id);
CREATE INDEX idx_post_views_user ON post_views(user_id);
CREATE INDEX idx_post_views_created ON post_views(created_at);
```

### 6. Update Drizzle Schema

**Location:** `src/lib/db/schema.ts`

```typescript
import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar } from 'drizzle-orm/pg-core';

// Content type enum
export const contentTypeEnum = pgEnum('content_type', ['markdown', 'html', 'plain']);

// Moderation status enum
export const moderationStatusEnum = pgEnum('moderation_status', [
  'approved',
  'pending',
  'flagged',
  'rejected'
]);

// Updated community_posts table
export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentType: contentTypeEnum('content_type').default('markdown').notNull(),
  contentHtml: text('content_html'),
  contentImages: json('content_images').$type<string[]>().default([]),
  storyId: text('story_id').references(() => stories.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).default('discussion'),
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  isEdited: boolean('is_edited').default(false),
  editCount: integer('edit_count').default(0),
  lastEditedAt: timestamp('last_edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  moderationStatus: moderationStatusEnum('moderation_status').default('approved'),
  moderationReason: text('moderation_reason'),
  moderatedBy: text('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at'),
  tags: json('tags').$type<string[]>().default([]),
  mentions: json('mentions').$type<string[]>().default([]),
  likes: integer('likes').default(0),
  replies: integer('replies').default(0),
  views: integer('views').default(0),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Updated community_replies table
export const communityReplies = pgTable('community_replies', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  contentType: contentTypeEnum('content_type').default('markdown').notNull(),
  contentHtml: text('content_html'),
  contentImages: json('content_images').$type<string[]>().default([]),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  parentReplyId: text('parent_reply_id').references(() => communityReplies.id),
  depth: integer('depth').default(0),
  isEdited: boolean('is_edited').default(false),
  editCount: integer('edit_count').default(0),
  lastEditedAt: timestamp('last_edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  mentions: json('mentions').$type<string[]>().default([]),
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// New post_images table
export const postImages = pgTable('post_images', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  blobKey: text('blob_key').notNull(),
  filename: text('filename').notNull(),
  mimeType: varchar('mime_type', { length: 50 }).notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  uploadedBy: text('uploaded_by').references(() => users.id).notNull(),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  replyId: text('reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// New post_likes table
export const postLikes = pgTable('post_likes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  replyId: text('reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// New post_views table
export const postViews = pgTable('post_views', {
  id: text('id').primaryKey(),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## Unified Reply System

### Architecture Overview

The reply system will be **unified across reading and community features** but with different scopes:

#### Reading Page Replies
- **Scope:** Scene-level comments
- **Table:** `comments` (from reading-specification.md)
- **Location:** Displayed under each scene in chapter reader
- **Context:** Specific to story content at scene granularity

#### Community Page Replies
- **Scope 1:** Story-level discussions
- **Scope 2:** Scene-level comments (same as reading page)
- **Table:** `community_posts` + `community_replies`
- **Location:** Community discussion pages
- **Context:** Broader discussions about entire stories

### Data Model Integration

```typescript
// Unified reply interface
interface Reply {
  id: string;
  content: string;
  contentType: 'markdown' | 'html' | 'plain';
  contentHtml?: string;
  contentImages: string[];
  author: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string; // For nested replies
  depth: number; // 0-3 max depth
  likes: number;
  isLiked: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Community post (story-level discussion)
interface CommunityPost {
  id: string;
  title: string;
  content: string;
  contentType: 'markdown' | 'html' | 'plain';
  contentHtml?: string;
  contentImages: string[];
  type: 'discussion' | 'theory' | 'review' | 'question' | 'fan-content';
  story: {
    id: string;
    title: string;
  };
  author: {
    id: string;
    name: string;
    image?: string;
  };
  isPinned: boolean;
  isLocked: boolean;
  likes: number;
  replies: number; // Count
  views: number;
  tags: string[];
  createdAt: string;
  lastActivityAt: string;
}

// Scene comment (reading page)
interface SceneComment {
  id: string;
  content: string;
  scene: {
    id: string;
    title: string;
    chapterId: string;
    storyId: string;
  };
  author: {
    id: string;
    name: string;
    image?: string;
  };
  parentCommentId?: string;
  depth: number;
  likes: number;
  isLiked: boolean;
  createdAt: string;
}
```

### Reply System Features

#### 1. Story-Level Community Discussions
**Purpose:** Broad discussions about the entire story

**Features:**
- Full post with title and type (discussion, theory, review, etc.)
- Rich text editor with images
- Nested replies (max 3 levels)
- Post tagging and categorization
- Pinning important discussions
- Locking discussions (moderator only)
- View tracking per post

**Use Cases:**
- Overall story reviews
- Theories about plot direction
- Character analysis across all chapters
- Fan art and creative content
- Questions about story world/lore

#### 2. Scene-Level Comments (Reading + Community)
**Purpose:** Specific feedback on individual scenes

**Features:**
- Inline comments on scene content
- Accessible from both reading page and community
- Simpler than full posts (no title required)
- Markdown support with images
- Nested replies (max 2 levels for scene comments)
- Jump-to-scene navigation from community

**Use Cases:**
- Feedback on specific scene writing
- Questions about scene events
- Highlighting favorite moments
- Spotting inconsistencies

#### 3. Cross-Linking Between Systems

**Community → Reading:**
```typescript
// Link from community post to specific scene
<Link href={`/browse/story/${storyId}/read?chapter=${chapterId}&scene=${sceneId}#comments`}>
  Jump to scene in reader
</Link>
```

**Reading → Community:**
```typescript
// Link from scene comments to broader discussion
<Link href={`/community/story/${storyId}`}>
  Join the broader discussion in Community
</Link>
```

### Component Sharing Strategy

**Shared Components:**
- `<RichTextEditor>` - Used for posts, replies, and comments
- `<ReplyThread>` - Nested reply display
- `<ReplyForm>` - Reply composition
- `<LikeButton>` - Like/unlike action
- `<UserAvatar>` - User profile image
- `<RelativeTime>` - Time formatting

**Context-Specific Components:**
- `<CommunityPost>` - Full post with title (community only)
- `<SceneComment>` - Inline comment (reading page)
- `<PostTypeSelector>` - Post type picker (community only)

---

## Rich Text Editor with Image Upload

### Editor Selection: Tiptap

**Why Tiptap:**
- Modern, headless editor built on ProseMirror
- React integration with hooks
- Markdown support (input/output)
- Image upload with drag-and-drop
- Mention extension for @username
- Extensible with custom nodes
- Mobile-friendly
- Excellent TypeScript support

**Installation:**
```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-placeholder @tiptap/extension-mention @tiptap/extension-link
```

### Component Implementation

#### RichTextEditor Component
**Location:** `src/components/editor/RichTextEditor.tsx`

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import { useState, useCallback } from 'react';
import { uploadImage } from '@/lib/utils/upload';
import { cn } from '@/lib/utils/cn';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, html: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  allowImages?: boolean;
  allowMentions?: boolean;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  minHeight = 150,
  maxHeight = 600,
  allowImages = true,
  allowMentions = true,
  disabled = false,
  className
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline',
        },
      }),
      ...(allowImages ? [
        Image.configure({
          HTMLAttributes: {
            class: 'rounded-lg max-w-full h-auto',
          },
        }),
      ] : []),
      ...(allowMentions ? [
        Mention.configure({
          HTMLAttributes: {
            class: 'text-blue-500 font-medium',
          },
          suggestion: {
            // TODO: Implement user mention dropdown
          },
        }),
      ] : []),
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'px-4 py-3 min-h-[var(--min-height)] max-h-[var(--max-height)] overflow-y-auto',
          className
        ),
        style: `--min-height: ${minHeight}px; --max-height: ${maxHeight}px;`,
      },
      handleDrop: allowImages ? handleImageDrop : undefined,
      handlePaste: allowImages ? handleImagePaste : undefined,
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || editor.getText();
      const html = editor.getHTML();
      onChange(markdown, html);
    },
    editable: !disabled,
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!allowImages || !editor) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload to Vercel Blob
      const imageUrl = await uploadImage(file, {
        onProgress: (progress) => setUploadProgress(progress),
      });

      // Insert image into editor
      editor.chain().focus().setImage({ src: imageUrl }).run();
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [editor, allowImages]);

  const handleImageDrop = useCallback((view: any, event: DragEvent) => {
    const files = Array.from(event.dataTransfer?.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      event.preventDefault();
      imageFiles.forEach(file => handleImageUpload(file));
      return true;
    }
    return false;
  }, [handleImageUpload]);

  const handleImagePaste = useCallback((view: any, event: ClipboardEvent) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      event.preventDefault();
      imageItems.forEach(item => {
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
      });
      return true;
    }
    return false;
  }, [handleImageUpload]);

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleImageUpload(file);
    };
    input.click();
  }, [handleImageUpload]);

  if (!editor) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
      {/* Toolbar */}
      <div className="border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          disabled={disabled}
          title="Bold"
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          disabled={disabled}
          title="Italic"
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          disabled={disabled}
          title="Strikethrough"
        >
          <StrikeIcon />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          disabled={disabled}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          disabled={disabled}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          disabled={disabled}
          title="Bullet List"
        >
          <BulletListIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          disabled={disabled}
          title="Numbered List"
        >
          <OrderedListIcon />
        </ToolbarButton>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* Quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          disabled={disabled}
          title="Quote"
        >
          <QuoteIcon />
        </ToolbarButton>

        {/* Code */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          disabled={disabled}
          title="Code Block"
        >
          <CodeIcon />
        </ToolbarButton>

        {allowImages && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <ToolbarButton
              onClick={addImage}
              disabled={disabled || isUploading}
              title="Upload Image"
            >
              {isUploading ? (
                <span className="text-xs">{uploadProgress}%</span>
              ) : (
                <ImageIcon />
              )}
            </ToolbarButton>
          </>
        )}
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Character Count */}
      <div className="border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
        <span>
          {editor.storage.characterCount?.characters() || 0} characters
        </span>
        <span>
          {editor.storage.characterCount?.words() || 0} words
        </span>
      </div>
    </div>
  );
}

// Toolbar button component
function ToolbarButton({ onClick, isActive, disabled, title, children }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
        isActive && 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

// Icon components (simplified SVGs)
function BoldIcon() {
  return <span className="font-bold text-sm">B</span>;
}

function ItalicIcon() {
  return <span className="italic text-sm">I</span>;
}

function StrikeIcon() {
  return <span className="line-through text-sm">S</span>;
}

function BulletListIcon() {
  return <span className="text-sm">•</span>;
}

function OrderedListIcon() {
  return <span className="text-sm">1.</span>;
}

function QuoteIcon() {
  return <span className="text-sm">"</span>;
}

function CodeIcon() {
  return <span className="text-sm font-mono">&lt;/&gt;</span>;
}

function ImageIcon() {
  return <span className="text-sm">🖼️</span>;
}
```

### Image Upload Utility

**Location:** `src/lib/utils/upload.ts`

```typescript
import { put } from '@vercel/blob';

interface UploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export async function uploadImage(
  file: File,
  options: UploadOptions = {}
): Promise<string> {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onProgress,
  } = options;

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File too large. Max size: ${maxSizeMB}MB`);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split('.').pop();
  const filename = `community-images/${timestamp}-${randomStr}.${extension}`;

  // Upload to Vercel Blob
  onProgress?.(10);

  const blob = await put(filename, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  onProgress?.(100);

  return blob.url;
}

export async function deleteImage(blobUrl: string): Promise<void> {
  // Extract blob key from URL
  const url = new URL(blobUrl);
  const pathname = url.pathname;

  // Delete from Vercel Blob
  await fetch(`/api/blob/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: blobUrl }),
  });
}
```

### Image Upload API Endpoint

**Location:** `src/app/api/upload/image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { postImages } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const postId = formData.get('postId') as string | null;
    const replyId = formData.get('replyId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = nanoid(10);
    const extension = file.name.split('.').pop();
    const blobKey = `community-images/${timestamp}-${randomStr}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(blobKey, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });

    // Get image dimensions (optional)
    let width: number | undefined;
    let height: number | undefined;

    if (file.type.startsWith('image/')) {
      try {
        const bitmap = await createImageBitmap(await file.arrayBuffer());
        width = bitmap.width;
        height = bitmap.height;
      } catch (error) {
        console.error('Failed to get image dimensions:', error);
      }
    }

    // Save to database
    const imageId = nanoid();
    await db.insert(postImages).values({
      id: imageId,
      url: blob.url,
      blobKey,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      width,
      height,
      uploadedBy: session.user.id,
      postId,
      replyId,
    });

    return NextResponse.json({
      id: imageId,
      url: blob.url,
      width,
      height,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
```

---

## API Endpoints

### 1. Community Stats

#### GET `/api/community/stats`
**Purpose:** Get real-time community statistics

**Response:**
```typescript
{
  totalStories: number;
  totalPosts: number;
  totalMembers: number;
  activeUsers: number; // Active in last 7 days
  totalComments: number;
  totalRatings: number;
}
```

**Implementation:**
```typescript
// src/app/api/community/stats/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stories, communityPosts, communityReplies, users } from '@/lib/db/schema';
import { eq, gte, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [stats] = await db
      .select({
        totalStories: sql<number>`COUNT(DISTINCT ${stories.id})`,
        totalPosts: sql<number>`COUNT(DISTINCT ${communityPosts.id})`,
        totalMembers: sql<number>`COUNT(DISTINCT ${users.id})`,
        activeUsers: sql<number>`COUNT(DISTINCT CASE WHEN ${users.updatedAt} >= ${sevenDaysAgo} THEN ${users.id} END)`,
        totalComments: sql<number>`COUNT(${communityReplies.id})`,
      })
      .from(stories)
      .leftJoin(communityPosts, eq(stories.id, communityPosts.storyId))
      .leftJoin(communityReplies, eq(communityPosts.id, communityReplies.postId))
      .leftJoin(users, eq(stories.authorId, users.id));

    return NextResponse.json({
      ...stats,
      totalRatings: 0, // TODO: Implement ratings
    });
  } catch (error) {
    console.error('Failed to fetch community stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
```

### 2. Story Posts

#### GET `/api/community/story/[storyId]/posts`
**Purpose:** Get all posts for a specific story

**Query Parameters:**
- `sort`: 'recent' | 'popular' | 'discussed' (default: 'recent')
- `type`: 'discussion' | 'theory' | 'review' | 'question' | 'fan-content' (optional)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 50)

**Response:**
```typescript
{
  posts: CommunityPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  stats: {
    totalPosts: number;
    totalMembers: number;
    totalViews: number;
    averageRating: number;
  };
}
```

**Implementation:**
```typescript
// src/app/api/community/story/[storyId]/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { communityPosts, users, postLikes } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { storyId: string } }
) {
  try {
    const { storyId } = params;
    const { searchParams } = new URL(request.url);

    const sort = searchParams.get('sort') || 'recent';
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;

    const session = await auth();
    const userId = session?.user?.id;

    // Build query
    let query = db
      .select({
        post: communityPosts,
        author: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        isLiked: userId
          ? sql<boolean>`EXISTS(SELECT 1 FROM ${postLikes} WHERE ${postLikes.postId} = ${communityPosts.id} AND ${postLikes.userId} = ${userId})`
          : sql<boolean>`false`,
      })
      .from(communityPosts)
      .leftJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.storyId, storyId));

    // Filter by type
    if (type) {
      query = query.where(eq(communityPosts.type, type));
    }

    // Sort
    switch (sort) {
      case 'popular':
        query = query.orderBy(
          desc(sql`${communityPosts.likes} + ${communityPosts.views}`)
        );
        break;
      case 'discussed':
        query = query.orderBy(desc(communityPosts.replies));
        break;
      case 'recent':
      default:
        query = query.orderBy(desc(communityPosts.lastActivityAt));
        break;
    }

    // Pagination
    const results = await query.limit(limit).offset(offset);

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(communityPosts)
      .where(eq(communityPosts.storyId, storyId));

    // Get story stats
    const [stats] = await db
      .select({
        totalPosts: sql<number>`COUNT(DISTINCT ${communityPosts.id})`,
        totalViews: sql<number>`SUM(${communityPosts.views})`,
      })
      .from(communityPosts)
      .where(eq(communityPosts.storyId, storyId));

    return NextResponse.json({
      posts: results.map(r => ({
        ...r.post,
        author: r.author,
        isLiked: r.isLiked,
      })),
      pagination: {
        page,
        limit,
        total: count,
        hasMore: offset + limit < count,
      },
      stats: {
        totalPosts: stats.totalPosts || 0,
        totalMembers: 0, // TODO: Calculate unique users
        totalViews: stats.totalViews || 0,
        averageRating: 0, // TODO: Calculate from ratings
      },
    });
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
```

### 3. Create Post

#### POST `/api/community/posts`
**Purpose:** Create a new community post

**Request Body:**
```typescript
{
  storyId: string;
  title: string;
  content: string;
  contentHtml: string;
  type: 'discussion' | 'theory' | 'review' | 'question' | 'fan-content';
  tags?: string[];
  mentions?: string[];
  images?: string[]; // Image URLs from upload
}
```

**Response:**
```typescript
{
  post: CommunityPost;
}
```

**Implementation:**
```typescript
// src/app/api/community/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      storyId,
      title,
      content,
      contentHtml,
      type = 'discussion',
      tags = [],
      mentions = [],
      images = [],
    } = body;

    // Validation
    if (!storyId || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title too long (max 255 characters)' },
        { status: 400 }
      );
    }

    // Create post
    const postId = nanoid();
    const now = new Date();

    const [post] = await db.insert(communityPosts).values({
      id: postId,
      storyId,
      authorId: session.user.id,
      title,
      content,
      contentType: 'markdown',
      contentHtml,
      contentImages: images,
      type,
      tags,
      mentions,
      isPinned: false,
      isLocked: false,
      likes: 0,
      replies: 0,
      views: 0,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // TODO: Send notifications to mentioned users

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
```

### 4. Create Reply

#### POST `/api/community/posts/[postId]/replies`
**Purpose:** Create a reply to a post

**Request Body:**
```typescript
{
  content: string;
  contentHtml: string;
  parentReplyId?: string; // For nested replies
  mentions?: string[];
  images?: string[];
}
```

**Response:**
```typescript
{
  reply: Reply;
}
```

**Implementation:**
```typescript
// src/app/api/community/posts/[postId]/replies/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { communityReplies, communityPosts } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;
    const body = await request.json();
    const {
      content,
      contentHtml,
      parentReplyId,
      mentions = [],
      images = [],
    } = body;

    // Validation
    if (!content) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      );
    }

    // Check parent reply depth
    let depth = 0;
    if (parentReplyId) {
      const [parentReply] = await db
        .select({ depth: communityReplies.depth })
        .from(communityReplies)
        .where(eq(communityReplies.id, parentReplyId))
        .limit(1);

      if (!parentReply) {
        return NextResponse.json(
          { error: 'Parent reply not found' },
          { status: 404 }
        );
      }

      depth = parentReply.depth + 1;

      if (depth > 3) {
        return NextResponse.json(
          { error: 'Maximum reply depth (3) exceeded' },
          { status: 400 }
        );
      }
    }

    // Create reply
    const replyId = nanoid();
    const now = new Date();

    const [reply] = await db.insert(communityReplies).values({
      id: replyId,
      postId,
      authorId: session.user.id,
      parentReplyId,
      content,
      contentType: 'markdown',
      contentHtml,
      contentImages: images,
      mentions,
      depth,
      likes: 0,
      isEdited: false,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Increment post reply count
    await db
      .update(communityPosts)
      .set({
        replies: sql`${communityPosts.replies} + 1`,
        lastActivityAt: now,
      })
      .where(eq(communityPosts.id, postId));

    // TODO: Send notifications to mentioned users and parent author

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error('Failed to create reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const parentReplyId = searchParams.get('parentReplyId');

    const session = await auth();
    const userId = session?.user?.id;

    // Get replies
    const replies = await db
      .select({
        reply: communityReplies,
        author: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        isLiked: userId
          ? sql<boolean>`EXISTS(SELECT 1 FROM ${postLikes} WHERE ${postLikes.replyId} = ${communityReplies.id} AND ${postLikes.userId} = ${userId})`
          : sql<boolean>`false`,
      })
      .from(communityReplies)
      .leftJoin(users, eq(communityReplies.authorId, users.id))
      .where(
        parentReplyId
          ? eq(communityReplies.parentReplyId, parentReplyId)
          : eq(communityReplies.postId, postId)
      )
      .orderBy(communityReplies.createdAt);

    return NextResponse.json({ replies });
  } catch (error) {
    console.error('Failed to fetch replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch replies' },
      { status: 500 }
    );
  }
}
```

### 5. Like Post/Reply

#### POST `/api/community/posts/[postId]/like`
**Purpose:** Toggle like on post

**Response:**
```typescript
{
  isLiked: boolean;
  likeCount: number;
}
```

**Implementation:**
```typescript
// src/app/api/community/posts/[postId]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { postLikes, communityPosts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId } = params;
    const userId = session.user.id;

    // Check if already liked
    const [existingLike] = await db
      .select()
      .from(postLikes)
      .where(
        and(
          eq(postLikes.postId, postId),
          eq(postLikes.userId, userId)
        )
      )
      .limit(1);

    let isLiked: boolean;

    if (existingLike) {
      // Unlike
      await db
        .delete(postLikes)
        .where(eq(postLikes.id, existingLike.id));

      await db
        .update(communityPosts)
        .set({ likes: sql`${communityPosts.likes} - 1` })
        .where(eq(communityPosts.id, postId));

      isLiked = false;
    } else {
      // Like
      await db.insert(postLikes).values({
        id: nanoid(),
        userId,
        postId,
        createdAt: new Date(),
      });

      await db
        .update(communityPosts)
        .set({ likes: sql`${communityPosts.likes} + 1` })
        .where(eq(communityPosts.id, postId));

      isLiked = true;
    }

    // Get updated like count
    const [post] = await db
      .select({ likes: communityPosts.likes })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    return NextResponse.json({
      isLiked,
      likeCount: post.likes,
    });
  } catch (error) {
    console.error('Failed to toggle like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
```

### 6. Track Post View

#### POST `/api/community/posts/[postId]/view`
**Purpose:** Track unique view of post

**Response:**
```typescript
{
  viewCount: number;
}
```

**Implementation:**
```typescript
// src/app/api/community/posts/[postId]/view/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { postViews, communityPosts } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const session = await auth();
    const userId = session?.user?.id || null;

    // Get session ID from cookies or create new one
    const sessionId = request.cookies.get('sessionId')?.value || nanoid();

    // Hash IP for privacy
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already viewed today
    const [existingView] = await db
      .select()
      .from(postViews)
      .where(
        and(
          eq(postViews.postId, postId),
          userId
            ? eq(postViews.userId, userId)
            : eq(postViews.sessionId, sessionId),
          sql`DATE(${postViews.createdAt}) = DATE(${today})`
        )
      )
      .limit(1);

    if (!existingView) {
      // Record new view
      await db.insert(postViews).values({
        id: nanoid(),
        postId,
        userId,
        sessionId,
        ipHash,
        userAgent: request.headers.get('user-agent') || 'unknown',
        createdAt: new Date(),
      });

      // Increment view count
      await db
        .update(communityPosts)
        .set({ views: sql`${communityPosts.views} + 1` })
        .where(eq(communityPosts.id, postId));
    }

    // Get updated view count
    const [post] = await db
      .select({ views: communityPosts.views })
      .from(communityPosts)
      .where(eq(communityPosts.id, postId))
      .limit(1);

    const response = NextResponse.json({
      viewCount: post.views,
    });

    // Set session cookie if new
    if (!request.cookies.get('sessionId')) {
      response.cookies.set('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Failed to track view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
```

---

## Component Updates

### Update CreatePostForm Component

**Location:** `src/components/community/CreatePostForm.tsx`

**Changes:**
1. Replace mock API call with real POST request
2. Integrate RichTextEditor component
3. Add image upload support
4. Improve error handling with toast notifications
5. Add loading states

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface CreatePostFormProps {
  storyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreatePostForm({ storyId, onSuccess, onCancel }: CreatePostFormProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    contentHtml: '',
    type: 'discussion' as const,
    tags: [] as string[],
    images: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const postTypes = [
    { value: 'discussion', label: 'Discussion', icon: '💬', description: 'General conversation' },
    { value: 'theory', label: 'Theory', icon: '🔮', description: 'Plot predictions and analysis' },
    { value: 'review', label: 'Review', icon: '⭐', description: 'Critique and feedback' },
    { value: 'question', label: 'Question', icon: '❓', description: 'Ask the community' },
    { value: 'fan-content', label: 'Fan Content', icon: '🎨', description: 'Art, writing, etc.' },
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      const { post } = await response.json();

      toast.success('Post created successfully!');

      // Reset form
      setFormData({
        title: '',
        content: '',
        contentHtml: '',
        type: 'discussion',
        tags: [],
        images: [],
      });

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Post Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Post Type
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {postTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, type: type.value })}
              className={cn(
                'p-3 rounded-lg border-2 transition-all text-left',
                formData.type === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              )}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {type.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {type.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={cn(
            'w-full px-4 py-2 rounded-lg border',
            'focus:outline-none focus:ring-2 focus:ring-blue-500',
            errors.title
              ? 'border-red-500'
              : 'border-gray-300 dark:border-gray-600',
            'bg-white dark:bg-gray-800',
            'text-gray-900 dark:text-gray-100'
          )}
          placeholder="Enter a descriptive title..."
          maxLength={255}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title}</p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.title.length}/255 characters
        </p>
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content
        </label>
        <RichTextEditor
          content={formData.content}
          onChange={(content, html) => {
            setFormData({ ...formData, content, contentHtml: html });
          }}
          placeholder="Share your thoughts..."
          minHeight={200}
          maxHeight={600}
          allowImages={true}
          allowMentions={true}
          disabled={isSubmitting}
        />
        {errors.content && (
          <p className="text-sm text-red-500 mt-1">{errors.content}</p>
        )}
      </div>

      {/* Community Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Community Guidelines:</strong> Be respectful, constructive, and avoid spoilers
          in titles. Posts must relate to the story. Spam and harassment will result in removal.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            'Create Post'
          )}
        </button>
      </div>
    </form>
  );
}
```

### Update CommunityPostsList Component

**Location:** `src/components/community/CommunityPostsList.tsx`

**Changes:**
1. Remove mock data
2. Use real data from props
3. Connect like button to API
4. Add reply loading
5. Improve error states

```typescript
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface CommunityPostsListProps {
  posts: CommunityPost[];
  onPostClick?: (postId: string) => void;
}

export function CommunityPostsList({ posts, onPostClick }: CommunityPostsListProps) {
  const { data: session } = useSession();
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  const { executeAction: handleLike } = useProtectedAction(async (postId: string, currentIsLiked: boolean, currentLikes: number) => {
    if (likingPosts.has(postId)) return;

    setLikingPosts(prev => new Set(prev).add(postId));

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to toggle like');
      }

      const { isLiked, likeCount } = await response.json();

      // Update post in place (trigger parent revalidation)
      toast.success(isLiked ? 'Post liked!' : 'Like removed');

      // TODO: Update local state or trigger revalidation
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('Failed to update like');
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  });

  const toggleReplies = (postId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'theory': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'question': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'fan-content': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">No posts yet</p>
        <p className="text-sm">Be the first to start a discussion!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
        >
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Author Avatar */}
              {post.author.image ? (
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  {post.author.name[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {post.author.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            {/* Post Type Badge */}
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              getPostTypeColor(post.type)
            )}>
              {post.type}
            </span>
          </div>

          {/* Post Title */}
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {post.isPinned && <span className="text-yellow-500 mr-2">📌</span>}
            {post.title}
          </h3>

          {/* Post Content Preview */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            <div
              dangerouslySetInnerHTML={{ __html: post.contentHtml || post.content }}
              className="line-clamp-3"
            />
          </div>

          {/* Post Actions */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <button
              onClick={() => handleLike(post.id, post.isLiked, post.likes)}
              disabled={likingPosts.has(post.id)}
              className={cn(
                'flex items-center gap-2 hover:text-red-500 transition-colors',
                post.isLiked && 'text-red-500'
              )}
            >
              <span>{post.isLiked ? '❤️' : '🤍'}</span>
              <span>{post.likes}</span>
            </button>

            <button
              onClick={() => toggleReplies(post.id)}
              className="flex items-center gap-2 hover:text-blue-500 transition-colors"
            >
              <span>💬</span>
              <span>{post.replies} replies</span>
            </button>

            <span className="flex items-center gap-2">
              <span>👁️</span>
              <span>{post.views} views</span>
            </span>
          </div>

          {/* Expanded Replies (TODO: Load from API) */}
          {expandedReplies.has(post.id) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading replies...
              </p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
```

### Update Story Discussion Page

**Location:** `src/app/community/story/[storyId]/page.tsx`

**Changes:**
1. Remove mock data functions
2. Fetch real data from API
3. Use server components for initial data
4. Add error handling

```typescript
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { stories, users, communityPosts } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { CreatePostForm } from '@/components/community/CreatePostForm';
import { CommunityPostsList } from '@/components/community/CommunityPostsList';
import { CommunityStorySidebar } from '@/components/community/CommunityStorySidebar';
import { SignInButton } from '@/components/auth/SignInButton';

interface StoryDiscussionPageProps {
  params: {
    storyId: string;
  };
  searchParams: {
    sort?: string;
    type?: string;
  };
}

export default async function StoryDiscussionPage({
  params,
  searchParams,
}: StoryDiscussionPageProps) {
  const session = await auth();
  const { storyId } = params;
  const sort = searchParams.sort || 'recent';
  const type = searchParams.type;

  // Fetch story
  const [story] = await db
    .select({
      id: stories.id,
      title: stories.title,
      description: stories.description,
      genre: stories.genre,
      viewCount: stories.viewCount,
      rating: stories.rating,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(stories)
    .leftJoin(users, eq(stories.authorId, users.id))
    .where(eq(stories.id, storyId))
    .limit(1);

  if (!story) {
    notFound();
  }

  // Fetch community stats
  const [stats] = await db
    .select({
      totalPosts: sql<number>`COUNT(DISTINCT ${communityPosts.id})`,
      totalViews: sql<number>`SUM(${communityPosts.views})`,
    })
    .from(communityPosts)
    .where(eq(communityPosts.storyId, storyId));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <CommunityStorySidebar />
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-4xl">
            {/* Story Header */}
            <header className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {story.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                by {story.author.name}
              </p>
              {story.description && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {story.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalPosts || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.totalViews || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {story.viewCount || 0}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Story Views</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {story.rating ? (story.rating / 10).toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Rating</div>
                </div>
              </div>
            </header>

            {/* Create Post Section */}
            {session ? (
              <Suspense fallback={<div>Loading form...</div>}>
                <CreatePostForm storyId={storyId} />
              </Suspense>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6 text-center">
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  Sign in to join the discussion and share your thoughts!
                </p>
                <SignInButton />
              </div>
            )}

            {/* Posts List */}
            <Suspense fallback={<div>Loading posts...</div>}>
              <PostsList storyId={storyId} sort={sort} type={type} userId={session?.user?.id} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

// Server component for fetching posts
async function PostsList({
  storyId,
  sort,
  type,
  userId,
}: {
  storyId: string;
  sort: string;
  type?: string;
  userId?: string;
}) {
  // Fetch posts with author and like status
  let query = db
    .select({
      post: communityPosts,
      author: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
      isLiked: userId
        ? sql<boolean>`EXISTS(SELECT 1 FROM post_likes WHERE post_id = ${communityPosts.id} AND user_id = ${userId})`
        : sql<boolean>`false`,
    })
    .from(communityPosts)
    .leftJoin(users, eq(communityPosts.authorId, users.id))
    .where(eq(communityPosts.storyId, storyId));

  // Filter by type
  if (type) {
    query = query.where(eq(communityPosts.type, type));
  }

  // Sort
  switch (sort) {
    case 'popular':
      query = query.orderBy(desc(sql`${communityPosts.likes} + ${communityPosts.views}`));
      break;
    case 'discussed':
      query = query.orderBy(desc(communityPosts.replies));
      break;
    case 'recent':
    default:
      query = query.orderBy(desc(communityPosts.lastActivityAt));
      break;
  }

  const results = await query.limit(20);

  const posts = results.map(r => ({
    ...r.post,
    author: r.author,
    isLiked: r.isLiked,
  }));

  return <CommunityPostsList posts={posts} />;
}
```

---

## Responsive Mobile Design

### Mobile Breakpoints Strategy

```css
/* Tailwind default breakpoints */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### Mobile Layout Adaptations

#### 1. Community Hub Mobile Layout

**Desktop (≥ 1024px):**
- 4-column story grid
- Full stats dashboard (6 cards)
- Sidebar navigation visible

**Tablet (768px - 1023px):**
- 3-column story grid
- Condensed stats (4 cards)
- Collapsible sidebar

**Mobile (< 768px):**
- 1-column story grid
- Minimal stats (2 cards: Posts & Members)
- Bottom navigation bar
- Hamburger menu for filters

#### 2. Story Discussion Mobile Layout

**Desktop:**
```
[Sidebar] [Story Header | Create Post | Posts List]
```

**Mobile:**
```
[Story Header (collapsed)]
[Floating "Create Post" button]
[Posts List (full width)]
[Bottom: Sort/Filter toolbar]
```

#### 3. Post Creation Mobile

**Desktop:**
- Full rich text editor toolbar (all options visible)
- Side-by-side type selector (5 columns)
- Preview toggle

**Mobile:**
- Collapsible toolbar (expand/collapse groups)
- Scrollable type selector (horizontal scroll)
- Simplified formatting options
- Full-screen editor mode option

### Mobile-Specific Components

#### Mobile Bottom Navigation
**Location:** `src/components/community/MobileBottomNav.tsx`

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

export function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/community', label: 'Hub', icon: '🏠' },
    { href: '/community/trending', label: 'Trending', icon: '🔥' },
    { href: '/community/following', label: 'Following', icon: '👥' },
    { href: '/community/notifications', label: 'Alerts', icon: '🔔' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

#### Floating Action Button (Mobile)
**Location:** `src/components/community/FloatingCreateButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { cn } from '@/lib/utils/cn';

export function FloatingCreateButton({ onClick }: { onClick: () => void }) {
  const { executeAction } = useProtectedAction(onClick);

  return (
    <button
      onClick={executeAction}
      className={cn(
        'lg:hidden fixed bottom-20 right-4 z-40',
        'w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg',
        'flex items-center justify-center',
        'hover:bg-blue-700 active:scale-95 transition-all'
      )}
      aria-label="Create post"
    >
      <span className="text-2xl">✏️</span>
    </button>
  );
}
```

### Touch Optimizations

```css
/* Minimum touch target: 44x44px */
.touch-target {
  @apply min-w-[44px] min-h-[44px] p-3;
}

/* Increase tap spacing on mobile */
@media (max-width: 768px) {
  .action-buttons {
    @apply gap-4; /* Increased from gap-2 */
  }

  .post-card {
    @apply p-4; /* Reduced padding for more content */
  }
}
```

### Performance Optimizations for Mobile

```typescript
// Virtual scrolling for long post lists
import { FixedSizeList } from 'react-window';

function MobilePostList({ posts }: { posts: CommunityPost[] }) {
  return (
    <FixedSizeList
      height={window.innerHeight - 180} // Account for header/nav
      itemCount={posts.length}
      itemSize={200}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <PostCard post={posts[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Implementation Plan

### Phase 1: Database & API Foundation (Week 1)
**Tasks:**
1. Run database migrations for new tables and columns
2. Update Drizzle schema with new types
3. Implement community stats API endpoint
4. Implement story posts API endpoint
5. Implement post creation API endpoint
6. Implement reply creation API endpoint
7. Implement like/unlike API endpoint
8. Implement view tracking API endpoint
9. Test all endpoints with Postman/API client

**Deliverables:**
- All database migrations applied
- 8 API endpoints fully functional
- API documentation

### Phase 2: Rich Text Editor & Image Upload (Week 2)
**Tasks:**
1. Install Tiptap and extensions
2. Implement RichTextEditor component
3. Implement image upload utility
4. Create image upload API endpoint
5. Add image deletion API endpoint
6. Integrate editor into CreatePostForm
7. Add image preview and management
8. Test image upload flow end-to-end

**Deliverables:**
- Fully functional rich text editor
- Image upload working in posts/replies
- Image storage in Vercel Blob

### Phase 3: Component Integration (Week 3)
**Tasks:**
1. Update CreatePostForm to use real API
2. Update CommunityPostsList to use real data
3. Update story discussion page to fetch real posts
4. Implement reply threading UI
5. Implement like button with optimistic updates
6. Add view tracking to post pages
7. Implement post editing
8. Implement post deletion (soft delete)
9. Add error handling and loading states
10. Add toast notifications

**Deliverables:**
- All mock data removed
- Full CRUD operations working
- Unified reply system functional

### Phase 4: Mobile Responsive Design (Week 4)
**Tasks:**
1. Implement mobile bottom navigation
2. Create floating action button for post creation
3. Optimize post cards for mobile
4. Implement collapsible editor toolbar
5. Add horizontal scrolling for type selector
6. Optimize images for mobile (responsive sizes)
7. Add touch gesture support
8. Implement virtual scrolling for performance
9. Test on iOS Safari and Android Chrome
10. Fix mobile-specific bugs

**Deliverables:**
- Fully responsive mobile design
- Touch-optimized UI
- Performance optimizations

### Phase 5: Testing & Polish (Week 5)
**Tasks:**
1. Write unit tests for all components
2. Write integration tests for API endpoints
3. Write E2E tests with Playwright
4. Accessibility audit (WCAG 2.1 AA)
5. Performance testing (Lighthouse)
6. Cross-browser testing
7. User acceptance testing
8. Bug fixes and refinements
9. Documentation updates
10. Deployment to production

**Deliverables:**
- Comprehensive test coverage
- All accessibility issues resolved
- Production deployment

---

## Success Metrics

### Engagement Metrics
- **Post Creation Rate:** % of story readers who create posts
- **Reply Rate:** Average replies per post
- **Like Rate:** % of posts that receive likes
- **View-to-Engagement Ratio:** (Likes + Replies) / Views
- **Return Visit Rate:** % of users returning within 7 days

### Performance Metrics
- **Page Load Time (Mobile):** < 3s on 3G
- **Time to Interactive:** < 5s
- **Lighthouse Score:** > 90 (mobile and desktop)
- **Image Load Time:** < 2s per image
- **API Response Time:** < 500ms (p95)

### Quality Metrics
- **Spam Rate:** < 1% of posts
- **Moderation Rate:** < 5% of posts flagged
- **User Satisfaction:** > 4.0/5.0
- **Mobile Bounce Rate:** < 40%
- **Error Rate:** < 0.1% of requests

---

## Future Enhancements

### Advanced Features
- **Real-time Updates:** WebSocket integration for live posts/replies
- **Notifications:** Push notifications for mentions and replies
- **User Reputation:** Karma system based on post quality
- **Content Moderation:** AI-powered spam detection
- **Advanced Search:** Full-text search across posts
- **Bookmarks:** Save favorite posts
- **Collections:** Curated post collections
- **User Profiles:** Dedicated community profile pages
- **Badges & Achievements:** Gamification elements
- **Trending Algorithm:** ML-powered trending posts

### Integration Features
- **Cross-Posting:** Share to social media
- **Email Digests:** Weekly community highlights
- **RSS Feeds:** Subscribe to story discussions
- **Discord Integration:** Bridge with Discord servers
- **Analytics Dashboard:** Author insights on community engagement

---

## References

### Technical Documentation
- [Tiptap Documentation](https://tiptap.dev/docs/editor/getting-started/overview)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)
- [Drizzle ORM Relations](https://orm.drizzle.team/docs/rqb)
- [SWR Documentation](https://swr.vercel.app/)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

### Design Inspiration
- **Reddit:** Threaded discussions and voting
- **Discord:** Channel-based discussions
- **Wattpad:** Story-centric community
- **Medium:** Clean reading and discussion UX
- **Twitter/X:** Real-time engagement patterns
