import type { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  name: varchar('name', { length: 100 }),
  image: text('image'),
});

export type User = InferSelectModel<typeof user>;

export const permittedUser = pgTable('PermittedUser', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type PermittedUser = InferSelectModel<typeof permittedUser>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  visibility: varchar('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  chatType: varchar('chatType', { enum: ['general', 'chapter', 'book'] })
    .notNull()
    .default('general'),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

export const message = pgTable('Message_v2', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id),
  role: varchar('role').notNull(),
  parts: json('parts').notNull(),
  attachments: json('attachments').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  'Vote_v2',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet', 'book', 'story'] })
      .notNull()
      .default('text'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  'Stream',
  {
    id: uuid('id').notNull().defaultRandom(),
    chatId: uuid('chatId').notNull(),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

export const book = pgTable('Book', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  genre: varchar('genre', { length: 50 }),
  status: varchar('status', { enum: ['draft', 'ongoing', 'completed', 'hiatus'] })
    .notNull()
    .default('draft'),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id),
  isPublished: boolean('isPublished').notNull().default(false),
  publishedAt: timestamp('publishedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  wordCount: integer('wordCount').notNull().default(0),
  chapterCount: integer('chapterCount').notNull().default(0),
  readCount: integer('readCount').notNull().default(0),
  likeCount: integer('likeCount').notNull().default(0),
  coverImageUrl: text('coverImageUrl'),
  tags: json('tags').$type<string[]>().notNull().default([]),
  mature: boolean('mature').notNull().default(false),
});

export type Book = InferSelectModel<typeof book>;

// Book Hierarchy Tables - 4-level organization: Story > Part > Chapter > Scene

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

export type Story = InferSelectModel<typeof story>;

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

export type Part = InferSelectModel<typeof part>;

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

export type ChapterEnhanced = InferSelectModel<typeof chapterEnhanced>;

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

export type Scene = InferSelectModel<typeof scene>;

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

export type BookHierarchyPath = InferSelectModel<typeof bookHierarchyPath>;

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

export type ContentSearchIndex = InferSelectModel<typeof contentSearchIndex>;

export const chapter = pgTable('Chapter', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id),
  chapterNumber: integer('chapterNumber').notNull(),
  title: text('title').notNull(),
  content: json('content').notNull(),
  wordCount: integer('wordCount').notNull().default(0),
  isPublished: boolean('isPublished').notNull().default(false),
  publishedAt: timestamp('publishedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  authorNote: text('authorNote'),
  chatId: uuid('chatId').references(() => chat.id),
  generationPrompt: text('generationPrompt'),
  previousChapterSummary: text('previousChapterSummary'),
});

export type Chapter = InferSelectModel<typeof chapter>;

export const chapterGeneration = pgTable('ChapterGeneration', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chapterId: uuid('chapterId')
    .notNull()
    .references(() => chapter.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  generatedContent: text('generatedContent'),
  status: varchar('status', { enum: ['pending', 'generating', 'completed', 'failed'] })
    .notNull()
    .default('pending'),
  error: text('error'),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  completedAt: timestamp('completedAt'),
});

export type ChapterGeneration = InferSelectModel<typeof chapterGeneration>;

export const character = pgTable('Character', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id),
  name: text('name').notNull(),
  description: text('description'),
  personalityTraits: json('personalityTraits'),
  appearance: text('appearance'),
  role: varchar('role', { enum: ['protagonist', 'antagonist', 'supporting', 'minor'] })
    .notNull()
    .default('supporting'),
  imageUrl: text('imageUrl'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Character = InferSelectModel<typeof character>;

export const readingProgress = pgTable(
  'ReadingProgress',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    bookId: uuid('bookId')
      .notNull()
      .references(() => book.id),
    currentChapterId: uuid('currentChapterId')
      .references(() => chapter.id),
    currentPosition: decimal('currentPosition').notNull().default('0'),
    lastReadAt: timestamp('lastReadAt').notNull().defaultNow(),
    totalTimeRead: integer('totalTimeRead').notNull().default(0),
    isCompleted: boolean('isCompleted').notNull().default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.bookId] }),
    };
  },
);

export type ReadingProgress = InferSelectModel<typeof readingProgress>;

export const bookInteraction = pgTable(
  'BookInteraction',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    bookId: uuid('bookId')
      .notNull()
      .references(() => book.id),
    interactionType: varchar('interactionType', { enum: ['like', 'bookmark', 'follow'] }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.bookId, table.interactionType] }),
    };
  },
);

export type BookInteraction = InferSelectModel<typeof bookInteraction>;

export const bookTag = pgTable('BookTag', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#000000'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type BookTag = InferSelectModel<typeof bookTag>;

// Phase 2: Reading Experience Enhancement Tables

export const userPreferences = pgTable(
  'UserPreferences',
  {
    userId: uuid('userId')
      .primaryKey()
      .notNull()
      .references(() => user.id),
    readingTheme: varchar('readingTheme', { enum: ['light', 'dark', 'sepia', 'high-contrast', 'night-mode'] })
      .notNull()
      .default('light'),
    fontFamily: varchar('fontFamily', { enum: ['serif', 'sans-serif', 'monospace', 'dyslexic'] })
      .notNull()
      .default('serif'),
    fontSize: integer('fontSize').notNull().default(16),
    lineHeight: decimal('lineHeight').notNull().default('1.5'),
    letterSpacing: decimal('letterSpacing').notNull().default('0'),
    wordSpacing: decimal('wordSpacing').notNull().default('0'),
    contentWidth: integer('contentWidth').notNull().default(800),
    marginSize: integer('marginSize').notNull().default(40),
    paragraphSpacing: decimal('paragraphSpacing').notNull().default('1.2'),
    layoutStyle: varchar('layoutStyle', { enum: ['single-column', 'two-column', 'book-style'] })
      .notNull()
      .default('single-column'),
    highContrast: boolean('highContrast').notNull().default(false),
    colorContrast: decimal('colorContrast').notNull().default('1.0'),
    dyslexiaFriendly: boolean('dyslexiaFriendly').notNull().default(false),
    highlightSyllables: boolean('highlightSyllables').notNull().default(false),
    readingRuler: boolean('readingRuler').notNull().default(false),
    reduceMotion: boolean('reduceMotion').notNull().default(false),
    screenReaderMode: boolean('screenReaderMode').notNull().default(false),
    autoBookmarking: boolean('autoBookmarking').notNull().default(true),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export type UserPreferences = InferSelectModel<typeof userPreferences>;

export const readingCollection = pgTable('ReadingCollection', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  privacy: varchar('privacy', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
  bookIds: json('bookIds').$type<string[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ReadingCollection = InferSelectModel<typeof readingCollection>;

export const readingList = pgTable('ReadingList', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  bookIds: json('bookIds').$type<string[]>().notNull().default([]),
  bookOrder: json('bookOrder').$type<number[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ReadingList = InferSelectModel<typeof readingList>;

export const offlineBook = pgTable(
  'OfflineBook',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    bookId: uuid('bookId')
      .notNull()
      .references(() => book.id),
    downloadedChapters: json('downloadedChapters').$type<number[]>().notNull().default([]),
    totalSize: integer('totalSize').notNull().default(0), // in bytes
    downloadedAt: timestamp('downloadedAt').notNull().defaultNow(),
    lastSyncAt: timestamp('lastSyncAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.bookId] }),
    };
  }
);

export type OfflineBook = InferSelectModel<typeof offlineBook>;

export const readingAchievement = pgTable('ReadingAchievement', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  achievementType: varchar('achievementType', { 
    enum: ['first-book', 'ten-books', 'hundred-books', 'speed-reader', 'genre-explorer', 'consistency-week', 'consistency-month'] 
  }).notNull(),
  progress: integer('progress').notNull().default(0),
  target: integer('target').notNull().default(1),
  isUnlocked: boolean('isUnlocked').notNull().default(false),
  unlockedAt: timestamp('unlockedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ReadingAchievement = InferSelectModel<typeof readingAchievement>;

export const readingStatistics = pgTable(
  'ReadingStatistics', 
  {
    userId: uuid('userId')
      .primaryKey()
      .notNull()
      .references(() => user.id),
    totalReadingTimeMinutes: integer('totalReadingTimeMinutes').notNull().default(0),
    dailyReadingTimeMinutes: integer('dailyReadingTimeMinutes').notNull().default(0),
    weeklyReadingTimeMinutes: integer('weeklyReadingTimeMinutes').notNull().default(0),
    currentStreak: integer('currentStreak').notNull().default(0),
    longestStreak: integer('longestStreak').notNull().default(0),
    booksCompleted: integer('booksCompleted').notNull().default(0),
    chaptersRead: integer('chaptersRead').notNull().default(0),
    wordsRead: integer('wordsRead').notNull().default(0),
    averageWordsPerMinute: integer('averageWordsPerMinute').notNull().default(200),
    favoriteGenres: json('favoriteGenres').$type<string[]>().notNull().default([]),
    lastReadingDate: timestamp('lastReadingDate'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export type ReadingStatistics = InferSelectModel<typeof readingStatistics>;

export const bookmark = pgTable('Bookmark', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id),
  chapterId: uuid('chapterId')
    .notNull()
    .references(() => chapter.id),
  position: decimal('position').notNull().default('0'), // scroll position
  note: text('note'),
  isAutomatic: boolean('isAutomatic').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Bookmark = InferSelectModel<typeof bookmark>;

// Phase 3: Community and Engagement Tables

// Forum System Tables
export const forumCategory = pgTable('ForumCategory', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  parentId: uuid('parentId'),
  order: integer('order').notNull().default(0),
  isVisible: boolean('isVisible').notNull().default(true),
  moderatorIds: json('moderatorIds').$type<string[]>().notNull().default([]),
  postCount: integer('postCount').notNull().default(0),
  threadCount: integer('threadCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ForumCategory = InferSelectModel<typeof forumCategory>;

export const forumThread = pgTable('ForumThread', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  categoryId: uuid('categoryId')
    .notNull()
    .references(() => forumCategory.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id),
  isLocked: boolean('isLocked').notNull().default(false),
  isPinned: boolean('isPinned').notNull().default(false),
  isSticky: boolean('isSticky').notNull().default(false),
  tags: json('tags').$type<string[]>().notNull().default([]),
  viewCount: integer('viewCount').notNull().default(0),
  postCount: integer('postCount').notNull().default(0),
  lastPostAt: timestamp('lastPostAt'),
  lastPostAuthorId: uuid('lastPostAuthorId').references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ForumThread = InferSelectModel<typeof forumThread>;

export const forumPost = pgTable('ForumPost', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  threadId: uuid('threadId')
    .notNull()
    .references(() => forumThread.id),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id),
  content: text('content').notNull(),
  isEdited: boolean('isEdited').notNull().default(false),
  editedAt: timestamp('editedAt'),
  isDeleted: boolean('isDeleted').notNull().default(false),
  parentPostId: uuid('parentPostId'),
  likeCount: integer('likeCount').notNull().default(0),
  reportCount: integer('reportCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ForumPost = InferSelectModel<typeof forumPost>;

export const forumModeration = pgTable('ForumModeration', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  targetType: varchar('targetType', { enum: ['thread', 'post', 'user'] }).notNull(),
  targetId: uuid('targetId').notNull(),
  moderatorId: uuid('moderatorId')
    .notNull()
    .references(() => user.id),
  action: varchar('action', { enum: ['warn', 'mute', 'ban', 'delete', 'lock'] }).notNull(),
  reason: text('reason').notNull(),
  duration: integer('duration'), // in minutes, null for permanent
  expiresAt: timestamp('expiresAt'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ForumModeration = InferSelectModel<typeof forumModeration>;

// Group System Tables
export const group = pgTable('Group', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  ownerId: uuid('ownerId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', { enum: ['public', 'private', 'invite-only'] }).notNull(),
  category: varchar('category', { enum: ['writing', 'reading', 'genre', 'other'] }).notNull(),
  tags: json('tags').$type<string[]>().notNull().default([]),
  memberLimit: integer('memberLimit'),
  memberCount: integer('memberCount').notNull().default(0),
  avatarUrl: text('avatarUrl'),
  bannerUrl: text('bannerUrl'),
  rules: text('rules'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Group = InferSelectModel<typeof group>;

export const groupMember = pgTable(
  'GroupMember',
  {
    groupId: uuid('groupId')
      .notNull()
      .references(() => group.id),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    role: varchar('role', { enum: ['owner', 'moderator', 'member'] }).notNull(),
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
    invitedBy: uuid('invitedBy').references(() => user.id),
    isActive: boolean('isActive').notNull().default(true),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.groupId, table.userId] }),
    };
  },
);

export type GroupMember = InferSelectModel<typeof groupMember>;

export const groupActivity = pgTable('GroupActivity', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  groupId: uuid('groupId')
    .notNull()
    .references(() => group.id),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  activityType: varchar('activityType', { enum: ['post', 'join', 'leave', 'book_share', 'event'] }).notNull(),
  content: text('content').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type GroupActivity = InferSelectModel<typeof groupActivity>;

export const groupInvitation = pgTable('GroupInvitation', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  groupId: uuid('groupId')
    .notNull()
    .references(() => group.id),
  inviterId: uuid('inviterId')
    .notNull()
    .references(() => user.id),
  inviteeId: uuid('inviteeId')
    .notNull()
    .references(() => user.id),
  message: text('message'),
  status: varchar('status', { enum: ['pending', 'accepted', 'declined', 'expired'] }).notNull().default('pending'),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  respondedAt: timestamp('respondedAt'),
});

export type GroupInvitation = InferSelectModel<typeof groupInvitation>;

// Contest System Tables
export const contest = pgTable('Contest', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  slug: text('slug').notNull().unique(),
  organizerId: uuid('organizerId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', { enum: ['writing', 'poetry', 'worldbuilding', 'art'] }).notNull(),
  status: varchar('status', { enum: ['draft', 'open', 'voting', 'judging', 'completed', 'cancelled'] }).notNull().default('draft'),
  rules: text('rules').notNull(),
  prizes: json('prizes'), // JSON for prize structure
  judgingCriteria: json('judgingCriteria'),
  maxSubmissions: integer('maxSubmissions'),
  submissionStart: timestamp('submissionStart').notNull(),
  submissionEnd: timestamp('submissionEnd').notNull(),
  votingStart: timestamp('votingStart'),
  votingEnd: timestamp('votingEnd'),
  judgeIds: json('judgeIds').$type<string[]>().notNull().default([]),
  submissionCount: integer('submissionCount').notNull().default(0),
  participantCount: integer('participantCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Contest = InferSelectModel<typeof contest>;

export const contestSubmission = pgTable('ContestSubmission', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  contestId: uuid('contestId')
    .notNull()
    .references(() => contest.id),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  bookId: uuid('bookId').references(() => book.id),
  wordCount: integer('wordCount').notNull().default(0),
  isAnonymous: boolean('isAnonymous').notNull().default(false),
  publicVoteCount: integer('publicVoteCount').notNull().default(0),
  judgeScore: decimal('judgeScore'),
  rank: integer('rank'),
  isDisqualified: boolean('isDisqualified').notNull().default(false),
  disqualificationReason: text('disqualificationReason'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ContestSubmission = InferSelectModel<typeof contestSubmission>;

export const contestVote = pgTable(
  'ContestVote',
  {
    contestId: uuid('contestId')
      .notNull()
      .references(() => contest.id),
    submissionId: uuid('submissionId')
      .notNull()
      .references(() => contestSubmission.id),
    voterId: uuid('voterId')
      .notNull()
      .references(() => user.id),
    score: integer('score').notNull(), // 1-10 scale
    isJudgeVote: boolean('isJudgeVote').notNull().default(false),
    feedback: text('feedback'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.contestId, table.submissionId, table.voterId] }),
    };
  },
);

export type ContestVote = InferSelectModel<typeof contestVote>;

// Gamification System Tables
export const achievement = pgTable('Achievement', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  type: varchar('type', { enum: ['reading', 'writing', 'community', 'platform'] }).notNull(),
  category: text('category').notNull(),
  iconUrl: text('iconUrl'),
  badgeUrl: text('badgeUrl'),
  rarity: varchar('rarity', { enum: ['common', 'rare', 'epic', 'legendary'] }).notNull(),
  points: integer('points').notNull().default(0), // XP points awarded
  criteria: json('criteria'), // JSON for achievement conditions
  isSecret: boolean('isSecret').notNull().default(false),
  unlockCount: integer('unlockCount').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Achievement = InferSelectModel<typeof achievement>;

export const userAchievement = pgTable(
  'UserAchievement',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    achievementId: uuid('achievementId')
      .notNull()
      .references(() => achievement.id),
    progress: integer('progress').notNull().default(0),
    maxProgress: integer('maxProgress').notNull().default(1),
    isUnlocked: boolean('isUnlocked').notNull().default(false),
    unlockedAt: timestamp('unlockedAt'),
    isDisplayed: boolean('isDisplayed').notNull().default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.achievementId] }),
    };
  },
);

export type UserAchievement = InferSelectModel<typeof userAchievement>;

export const userLevel = pgTable(
  'UserLevel',
  {
    userId: uuid('userId')
      .primaryKey()
      .notNull()
      .references(() => user.id),
    level: integer('level').notNull().default(1),
    experience: integer('experience').notNull().default(0),
    nextLevelExp: integer('nextLevelExp').notNull().default(100),
    totalExp: integer('totalExp').notNull().default(0),
    title: text('title').notNull().default('Newcomer'),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  }
);

export type UserLevel = InferSelectModel<typeof userLevel>;

export const leaderboard = pgTable('Leaderboard', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  type: varchar('type', { enum: ['weekly', 'monthly', 'yearly', 'all-time'] }).notNull(),
  category: varchar('category', { enum: ['reading', 'writing', 'community'] }).notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  score: integer('score').notNull(),
  rank: integer('rank').notNull(),
  period: timestamp('period').notNull(), // timestamp for period start
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type Leaderboard = InferSelectModel<typeof leaderboard>;

// Collaboration Tools Tables
export const betaReader = pgTable('BetaReader', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  specialties: json('specialties').$type<string[]>().notNull().default([]),
  experience: varchar('experience', { enum: ['beginner', 'intermediate', 'advanced', 'professional'] }).notNull(),
  rate: decimal('rate'), // cost per word/chapter (nullable for free)
  availability: varchar('availability', { enum: ['available', 'busy', 'unavailable'] }).notNull().default('available'),
  portfolio: json('portfolio').$type<string[]>().notNull().default([]),
  guidelines: text('guidelines'),
  rating: decimal('rating').default('0'),
  reviewCount: integer('reviewCount').notNull().default(0),
  turnaroundTime: integer('turnaroundTime').notNull().default(7), // days
  isVerified: boolean('isVerified').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type BetaReader = InferSelectModel<typeof betaReader>;

export const betaReaderRequest = pgTable('BetaReaderRequest', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  authorId: uuid('authorId')
    .notNull()
    .references(() => user.id),
  betaReaderId: uuid('betaReaderId')
    .notNull()
    .references(() => betaReader.id),
  bookId: uuid('bookId')
    .notNull()
    .references(() => book.id),
  chapterIds: json('chapterIds').$type<string[]>().notNull().default([]),
  requestType: varchar('requestType', { enum: ['general', 'line-edit', 'developmental', 'proofreading'] }).notNull(),
  deadline: timestamp('deadline').notNull(),
  budget: decimal('budget'),
  requirements: text('requirements'),
  status: varchar('status', { enum: ['pending', 'accepted', 'in-progress', 'completed', 'cancelled'] }).notNull().default('pending'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type BetaReaderRequest = InferSelectModel<typeof betaReaderRequest>;

export const coAuthor = pgTable(
  'CoAuthor',
  {
    bookId: uuid('bookId')
      .notNull()
      .references(() => book.id),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    role: varchar('role', { enum: ['co-author', 'contributor', 'editor'] }).notNull(),
    permissions: json('permissions'), // JSON for detailed permissions
    invitedBy: uuid('invitedBy')
      .notNull()
      .references(() => user.id),
    status: varchar('status', { enum: ['pending', 'active', 'inactive'] }).notNull().default('pending'),
    contributionShare: integer('contributionShare').notNull().default(0), // percentage of credit
    joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.bookId, table.userId] }),
    };
  },
);

export type CoAuthor = InferSelectModel<typeof coAuthor>;

export const workshop = pgTable('Workshop', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructorId: uuid('instructorId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', { enum: ['live', 'self-paced', 'group'] }).notNull(),
  category: varchar('category', { enum: ['writing', 'editing', 'publishing', 'marketing'] }).notNull(),
  maxParticipants: integer('maxParticipants'),
  currentParticipants: integer('currentParticipants').notNull().default(0),
  price: decimal('price').notNull().default('0'), // 0 for free workshops
  duration: integer('duration').notNull(), // in minutes
  scheduledAt: timestamp('scheduledAt'),
  status: varchar('status', { enum: ['scheduled', 'live', 'completed', 'cancelled'] }).notNull().default('scheduled'),
  materials: json('materials'), // JSON for resources
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Workshop = InferSelectModel<typeof workshop>;

export const workshopParticipant = pgTable(
  'WorkshopParticipant',
  {
    workshopId: uuid('workshopId')
      .notNull()
      .references(() => workshop.id),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    enrolledAt: timestamp('enrolledAt').notNull().defaultNow(),
    completedAt: timestamp('completedAt'),
    progress: integer('progress').notNull().default(0), // percentage completed
    rating: integer('rating'), // participant rating of workshop
    feedback: text('feedback'),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.workshopId, table.userId] }),
    };
  },
);

export type WorkshopParticipant = InferSelectModel<typeof workshopParticipant>;

// Extended Community Features Tables
export const userFollowing = pgTable(
  'UserFollowing',
  {
    followerId: uuid('followerId')
      .notNull()
      .references(() => user.id),
    followingId: uuid('followingId')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.followerId, table.followingId] }),
    };
  },
);

export type UserFollowing = InferSelectModel<typeof userFollowing>;

export const notification = pgTable('Notification', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  type: varchar('type', { enum: ['follow', 'comment', 'like', 'contest', 'group', 'achievement'] }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  actionUrl: text('actionUrl'),
  isRead: boolean('isRead').notNull().default(false),
  metadata: json('metadata'), // JSON for additional data
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Notification = InferSelectModel<typeof notification>;

export const reportContent = pgTable('ReportContent', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  reporterId: uuid('reporterId')
    .notNull()
    .references(() => user.id),
  contentType: varchar('contentType', { enum: ['book', 'comment', 'forum_post', 'user', 'group'] }).notNull(),
  contentId: uuid('contentId').notNull(),
  reason: varchar('reason', { enum: ['spam', 'harassment', 'inappropriate', 'copyright'] }).notNull(),
  description: text('description'),
  status: varchar('status', { enum: ['pending', 'reviewing', 'resolved', 'dismissed'] }).notNull().default('pending'),
  reviewedBy: uuid('reviewedBy').references(() => user.id),
  reviewedAt: timestamp('reviewedAt'),
  resolution: text('resolution'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type ReportContent = InferSelectModel<typeof reportContent>;
