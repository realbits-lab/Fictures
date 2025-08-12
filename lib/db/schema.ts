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
    kind: varchar('text', { enum: ['text', 'code', 'image', 'sheet'] })
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

export const story = pgTable('Story', {
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

export type Story = InferSelectModel<typeof story>;

export const chapter = pgTable('Chapter', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  storyId: uuid('storyId')
    .notNull()
    .references(() => story.id),
  chapterNumber: integer('chapterNumber').notNull(),
  title: text('title').notNull(),
  content: json('content').notNull(),
  wordCount: integer('wordCount').notNull().default(0),
  isPublished: boolean('isPublished').notNull().default(false),
  publishedAt: timestamp('publishedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  authorNote: text('authorNote'),
});

export type Chapter = InferSelectModel<typeof chapter>;

export const character = pgTable('Character', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  storyId: uuid('storyId')
    .notNull()
    .references(() => story.id),
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
    storyId: uuid('storyId')
      .notNull()
      .references(() => story.id),
    currentChapterNumber: integer('currentChapterNumber').notNull().default(1),
    currentPosition: decimal('currentPosition').notNull().default('0'),
    lastReadAt: timestamp('lastReadAt').notNull().defaultNow(),
    totalTimeRead: integer('totalTimeRead').notNull().default(0),
    isCompleted: boolean('isCompleted').notNull().default(false),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.storyId] }),
    };
  },
);

export type ReadingProgress = InferSelectModel<typeof readingProgress>;

export const storyInteraction = pgTable(
  'StoryInteraction',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    storyId: uuid('storyId')
      .notNull()
      .references(() => story.id),
    interactionType: varchar('interactionType', { enum: ['like', 'bookmark', 'follow'] }).notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.storyId, table.interactionType] }),
    };
  },
);

export type StoryInteraction = InferSelectModel<typeof storyInteraction>;

export const storyTag = pgTable('StoryTag', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#000000'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type StoryTag = InferSelectModel<typeof storyTag>;

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
    offlineReading: boolean('offlineReading').notNull().default(false),
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
  storyIds: json('storyIds').$type<string[]>().notNull().default([]),
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
  storyIds: json('storyIds').$type<string[]>().notNull().default([]),
  storyOrder: json('storyOrder').$type<number[]>().notNull().default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export type ReadingList = InferSelectModel<typeof readingList>;

export const offlineStory = pgTable(
  'OfflineStory',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => user.id),
    storyId: uuid('storyId')
      .notNull()
      .references(() => story.id),
    downloadedChapters: json('downloadedChapters').$type<number[]>().notNull().default([]),
    totalSize: integer('totalSize').notNull().default(0), // in bytes
    downloadedAt: timestamp('downloadedAt').notNull().defaultNow(),
    lastSyncAt: timestamp('lastSyncAt').notNull().defaultNow(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.storyId] }),
    };
  }
);

export type OfflineStory = InferSelectModel<typeof offlineStory>;

export const readingAchievement = pgTable('ReadingAchievement', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id),
  achievementType: varchar('achievementType', { 
    enum: ['first-story', 'ten-stories', 'hundred-stories', 'speed-reader', 'genre-explorer', 'consistency-week', 'consistency-month'] 
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
    storiesCompleted: integer('storiesCompleted').notNull().default(0),
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
  storyId: uuid('storyId')
    .notNull()
    .references(() => story.id),
  chapterNumber: integer('chapterNumber').notNull(),
  position: decimal('position').notNull().default('0'), // scroll position
  note: text('note'),
  isAutomatic: boolean('isAutomatic').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

export type Bookmark = InferSelectModel<typeof bookmark>;
