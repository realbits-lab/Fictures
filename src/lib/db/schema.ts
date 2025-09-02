import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar, serial, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// NextAuth.js required tables
export const accounts = pgTable('accounts', {
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

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationTokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// Users table - Core user authentication and profile
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Parts table - Story parts/sections (optional organization layer)
export const parts = pgTable('parts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  storyId: text('story_id').references(() => stories.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chapters table - Individual chapters
export const chapters = pgTable('chapters', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default(''),
  summary: text('summary'),
  storyId: text('story_id').references(() => stories.id).notNull(),
  partId: text('part_id').references(() => parts.id),
  orderIndex: integer('order_index').notNull(),
  wordCount: integer('word_count').default(0),
  targetWordCount: integer('target_word_count').default(4000),
  status: varchar('status', { length: 50 }).default('draft'), // draft, in_progress, completed, published
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Characters table - Story characters
export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  personality: text('personality'),
  background: text('background'),
  appearance: text('appearance'),
  role: varchar('role', { length: 100 }), // protagonist, antagonist, supporting, etc.
  storyId: text('story_id').references(() => stories.id).notNull(),
  imageUrl: text('image_url'),
  isMain: boolean('is_main').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Writing sessions table - Track AI-assisted writing sessions
export const writingSessions = pgTable('writing_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  wordsWritten: integer('words_written').default(0),
  aiSuggestionsUsed: integer('ai_suggestions_used').default(0),
  status: varchar('status', { length: 50 }).default('active'), // active, completed, paused
  sessionData: json('session_data').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AI interactions table - Track AI assistant usage
export const aiInteractions = pgTable('ai_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  sessionId: text('session_id').references(() => writingSessions.id),
  type: varchar('type', { length: 100 }).notNull(), // suggestion, analysis, generation, etc.
  prompt: text('prompt').notNull(),
  response: text('response').notNull(),
  applied: boolean('applied').default(false),
  rating: integer('rating'), // 1-5 rating by user
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments table - Reader comments on chapters
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  chapterId: text('chapter_id').references(() => chapters.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  parentId: text('parent_id'), // For replies - self-reference
  likes: integer('likes').default(0),
  isHighlighted: boolean('is_highlighted').default(false), // Author can highlight comments
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Reactions table - User reactions to stories/chapters
export const reactions = pgTable('reactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  targetId: text('target_id').notNull(), // Can reference stories or chapters
  targetType: varchar('target_type', { length: 50 }).notNull(), // story, chapter
  type: varchar('type', { length: 50 }).notNull(), // like, love, wow, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ratings table - User ratings for stories
export const ratings = pgTable('ratings', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  rating: integer('rating').notNull(), // 1-5
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Follows table - User follows/subscriptions
export const follows = pgTable('follows', {
  id: text('id').primaryKey(),
  followerId: text('follower_id').references(() => users.id).notNull(),
  followingId: text('following_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Story subscriptions table - Users subscribed to story updates
export const storySubscriptions = pgTable('story_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User achievements table - Gamification
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }),
  category: varchar('category', { length: 100 }),
  requirement: json('requirement').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAchievements = pgTable('user_achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  achievementId: text('achievement_id').references(() => achievements.id).notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
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

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stories: many(stories),
  writingSessions: many(writingSessions),
  comments: many(comments),
  reactions: many(reactions),
  ratings: many(ratings),
  followers: many(follows, { relationName: 'followers' }),
  following: many(follows, { relationName: 'following' }),
  subscriptions: many(storySubscriptions),
  achievements: many(userAchievements),
  stats: one(userStats),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  author: one(users, {
    fields: [stories.authorId],
    references: [users.id],
  }),
  parts: many(parts),
  chapters: many(chapters),
  characters: many(characters),
  comments: many(comments),
  reactions: many(reactions),
  ratings: many(ratings),
  subscriptions: many(storySubscriptions),
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
  comments: many(comments),
  reactions: many(reactions),
  writingSessions: many(writingSessions),
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

export const writingSessionsRelations = relations(writingSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [writingSessions.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [writingSessions.chapterId],
    references: [chapters.id],
  }),
  aiInteractions: many(aiInteractions),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'commentReplies',
  }),
  replies: many(comments, { relationName: 'commentReplies' }),
}));