import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar, serial, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// NextAuth.js required tables
export const accounts = pgTable('account', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// Users table - Core user authentication and profile
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  username: varchar('username', { length: 50 }).unique(),
  password: varchar('password', { length: 255 }),
  bio: text('bio'),
  role: varchar('role', { length: 20 }).default('reader').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// User preferences table - Store user settings and preferences
export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  theme: varchar('theme', { length: 20 }).default('system'),
  language: varchar('language', { length: 10 }).default('en'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  emailNotifications: boolean('emailNotifications').default(true),
  pushNotifications: boolean('pushNotifications').default(false),
  marketingEmails: boolean('marketingEmails').default(false),
  profileVisibility: varchar('profileVisibility', { length: 20 }).default('public'),
  showEmail: boolean('showEmail').default(false),
  showStats: boolean('showStats').default(true),
  createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// Stories table - Main story/book entities
export const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  genre: varchar('genre', { length: 100 }),
  status: varchar('status', { length: 50 }).default('draft'), // draft, active, completed, hiatus
  coverImage: text('cover_image'),
  tags: json('tags').$type<string[]>().default([]),
  isPublic: boolean('is_public').default(false),
  authorId: text('author_id').references(() => users.id).notNull(),
  targetWordCount: integer('target_word_count').default(50000),
  currentWordCount: integer('current_word_count').default(0),
  viewCount: integer('view_count').default(0),
  rating: integer('rating').default(0), // Average rating * 10 (e.g., 47 = 4.7)
  ratingCount: integer('rating_count').default(0),
  content: text('content').default(''), // Store complete story development YAML data as text
  // Bi-directional relationship fields
  partIds: json('part_ids').$type<string[]>().default([]).notNull(),
  chapterIds: json('chapter_ids').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Parts table - Story parts/sections (optional organization layer)
export const parts = pgTable('parts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  storyId: text('story_id').references(() => stories.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  targetWordCount: integer('target_word_count').default(0),
  currentWordCount: integer('current_word_count').default(0),
  status: varchar('status', { length: 50 }).default('planned'), // planned, in_progress, completed
  content: text('content').default(''), // Store part-specific development YAML data as text
  // Bi-directional relationship fields
  chapterIds: json('chapter_ids').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chapters table - Individual chapters (content stored in scenes)
export const chapters = pgTable('chapters', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  summary: text('summary'),
  storyId: text('story_id').references(() => stories.id).notNull(),
  partId: text('part_id').references(() => parts.id),
  authorId: text('author_id').references(() => users.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  wordCount: integer('word_count').default(0),
  targetWordCount: integer('target_word_count').default(4000),
  status: varchar('status', { length: 50 }).default('draft'), // draft, in_progress, completed, published
  purpose: text('purpose'), // Chapter purpose from story development
  hook: text('hook'), // Chapter hook from story development
  characterFocus: text('character_focus'), // Main character focus for chapter
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  // Bi-directional relationship fields
  sceneIds: json('scene_ids').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scenes table - Chapter breakdown into scenes (for detailed planning)
export const scenes = pgTable('scenes', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default(''),
  chapterId: text('chapter_id').references(() => chapters.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  wordCount: integer('word_count').default(0),
  status: varchar('status', { length: 50 }).default('planned'), // planned, in_progress, completed
  goal: text('goal'),
  conflict: text('conflict'),
  outcome: text('outcome'),
  // Character and place references for scene writing
  characterIds: json('character_ids').$type<string[]>().default([]).notNull(),
  placeIds: json('place_ids').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Characters table - Story characters
export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  isMain: boolean('is_main').default(false),
  content: text('content').default(''), // Store all character data as YAML/JSON
  imageUrl: text('image_url'), // Store generated character image URL from Vercel Blob
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Places table - Story locations/settings
export const places = pgTable('places', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  isMain: boolean('is_main').default(false), // is this a main location?
  content: text('content').default(''), // Store all place data as YAML/JSON
  imageUrl: text('image_url'), // Store generated place image URL from Vercel Blob
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// AI interactions table - Track AI assistant usage (simplified, no sessions)
export const aiInteractions = pgTable('ai_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // suggestion, analysis, generation, etc.
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  applied: boolean('applied').default(false),
  rating: integer('rating'), // 1-5 rating by user
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User stats table - Track various user statistics
export const userStats = pgTable('user_stats', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  totalWordsWritten: integer('total_words_written').default(0),
  storiesPublished: integer('stories_published').default(0),
  chaptersPublished: integer('chapters_published').default(0),
  commentsReceived: integer('comments_received').default(0),
  totalViews: integer('total_views').default(0),
  averageRating: integer('average_rating').default(0), // * 10
  writingStreak: integer('writing_streak').default(0),
  bestStreak: integer('best_streak').default(0),
  level: integer('level').default(1),
  experience: integer('experience').default(0),
  lastWritingDate: timestamp('last_writing_date'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Community posts table - Story-specific community discussions
export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 50 }).default('discussion'), // discussion, theory, review, question
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  likes: integer('likes').default(0),
  replies: integer('replies').default(0),
  views: integer('views').default(0),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Community replies table - Threaded replies to posts
export const communityReplies = pgTable('community_replies', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  postId: text('post_id').references(() => communityPosts.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  parentReplyId: text('parent_reply_id'), // For nested replies
  likes: integer('likes').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stories: many(stories),
  aiInteractions: many(aiInteractions),
  stats: one(userStats),
  preferences: one(userPreferences),
  communityPosts: many(communityPosts),
  communityReplies: many(communityReplies),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(users, {
    fields: [stories.authorId],
    references: [users.id],
  }),
  parts: many(parts),
  chapters: many(chapters),
  characters: many(characters),
  places: many(places),
  communityPosts: many(communityPosts),
}));

export const partsRelations = relations(parts, ({ one, many }) => ({
  story: one(stories, {
    fields: [parts.storyId],
    references: [stories.id],
  }),
  chapters: many(chapters),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  story: one(stories, {
    fields: [chapters.storyId],
    references: [stories.id],
  }),
  part: one(parts, {
    fields: [chapters.partId],
    references: [parts.id],
  }),
  scenes: many(scenes),
}));

export const scenesRelations = relations(scenes, ({ one }) => ({
  chapter: one(chapters, {
    fields: [scenes.chapterId],
    references: [chapters.id],
  }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  story: one(stories, {
    fields: [characters.storyId],
    references: [stories.id],
  }),
}));

export const placesRelations = relations(places, ({ one }) => ({
  story: one(stories, {
    fields: [places.storyId],
    references: [stories.id],
  }),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({ one }) => ({
  user: one(users, {
    fields: [aiInteractions.userId],
    references: [users.id],
  }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  story: one(stories, {
    fields: [communityPosts.storyId],
    references: [stories.id],
  }),
  author: one(users, {
    fields: [communityPosts.authorId],
    references: [users.id],
  }),
  replies: many(communityReplies),
}));

export const communityRepliesRelations = relations(communityReplies, ({ one, many }) => ({
  post: one(communityPosts, {
    fields: [communityReplies.postId],
    references: [communityPosts.id],
  }),
  author: one(users, {
    fields: [communityReplies.authorId],
    references: [users.id],
  }),
  parentReply: one(communityReplies, {
    fields: [communityReplies.parentReplyId],
    references: [communityReplies.id],
    relationName: 'parentChild',
  }),
  childReplies: many(communityReplies, { relationName: 'parentChild' }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

