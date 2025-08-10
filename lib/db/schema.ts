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
