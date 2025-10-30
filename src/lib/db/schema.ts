import { pgTable, text, timestamp, integer, boolean, json, uuid, varchar, serial, primaryKey, pgEnum, decimal, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Status enum for stories and chapters
export const statusEnum = pgEnum('status', [
  'writing',     // Content is being written/drafted
  'published'    // Content is published and available
]);

// Content type enum for community posts and replies
export const contentTypeEnum = pgEnum('content_type', [
  'markdown',
  'html',
  'plain'
]);

// Moderation status enum for community posts
export const moderationStatusEnum = pgEnum('moderation_status', [
  'approved',
  'pending',
  'flagged',
  'rejected'
]);

// Event type enum for analytics
export const eventTypeEnum = pgEnum('event_type', [
  'page_view',
  'story_view',
  'chapter_read_start',
  'chapter_read_complete',
  'scene_read',
  'comment_created',
  'comment_liked',
  'story_liked',
  'chapter_liked',
  'post_created',
  'post_viewed',
  'share',
  'bookmark'
]);

// Session type enum for reading sessions
export const sessionTypeEnum = pgEnum('session_type', [
  'continuous',
  'interrupted',
  'partial'
]);

// Insight type enum for story insights
export const insightTypeEnum = pgEnum('insight_type', [
  'quality_improvement',
  'engagement_drop',
  'reader_feedback',
  'pacing_issue',
  'character_development',
  'plot_consistency',
  'trending_up',
  'publishing_opportunity',
  'audience_mismatch'
]);

// Visibility enum for scenes and content
export const visibilityEnum = pgEnum('visibility', [
  'private',
  'unlisted',
  'public'
]);

// Comic status enum for scene comic panels
export const comicStatusEnum = pgEnum('comic_status', [
  'none',      // No comic panels exist
  'draft',     // Comic panels exist but not published
  'published'  // Comic panels are published and visible
]);

// Schedule type enum for publishing schedules
export const scheduleTypeEnum = pgEnum('schedule_type', [
  'daily',
  'weekly',
  'custom',
  'one-time'
]);

// Publication status enum for scheduled publications
export const publicationStatusEnum = pgEnum('publication_status', [
  'pending',
  'published',
  'failed',
  'cancelled'
]);

// Reading format enum for reading history
export const readingFormatEnum = pgEnum('reading_format', [
  'novel',  // Text-based reading
  'comic'   // Visual/panel-based reading
]);

// Shot type enum for comic panels
export const shotTypeEnum = pgEnum('shot_type', [
  'establishing_shot',
  'wide_shot',
  'medium_shot',
  'close_up',
  'extreme_close_up',
  'over_shoulder',
  'dutch_angle'
]);

// SFX emphasis enum for comic sound effects
export const sfxEmphasisEnum = pgEnum('sfx_emphasis', [
  'normal',
  'large',
  'dramatic'
]);

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

// Stories table - Main story/book entities with HNS support
export const stories = pgTable('stories', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  genre: varchar('genre', { length: 100 }),
  status: statusEnum('status').default('writing').notNull(),
  tags: json('tags').$type<string[]>().default([]),
  authorId: text('author_id').references(() => users.id).notNull(),
  targetWordCount: integer('target_word_count').default(50000),
  currentWordCount: integer('current_word_count').default(0),
  viewCount: integer('view_count').default(0),
  rating: integer('rating').default(0), // Average rating * 10 (e.g., 47 = 4.7)
  ratingCount: integer('rating_count').default(0),
  content: text('content').default(''), // Store complete story development YAML data as text
  // Image fields
  imageUrl: text('image_url'), // Original/cover image URL from Vercel Blob
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized image variants (AVIF, WebP, JPEG in multiple sizes)
  // HNS fields
  premise: text('premise'),
  dramaticQuestion: text('dramatic_question'),
  theme: text('theme'),
  hnsData: json('hns_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Parts table - Story parts/sections with HNS support
export const parts = pgTable('parts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  storyId: text('story_id').references(() => stories.id).notNull(),
  authorId: text('author_id').references(() => users.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  targetWordCount: integer('target_word_count').default(0),
  currentWordCount: integer('current_word_count').default(0),
  content: text('content').default(''), // Store part-specific development YAML data as text
  // HNS fields
  structuralRole: varchar('structural_role', { length: 50 }),
  summary: text('summary'),
  keyBeats: json('key_beats').$type<string[]>(),
  hnsData: json('hns_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chapters table - Individual chapters with HNS support
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
  status: statusEnum('status').default('writing').notNull(),
  purpose: text('purpose'), // Chapter purpose from story development
  hook: text('hook'), // Chapter hook from story development
  characterFocus: text('character_focus'), // Main character focus for chapter
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  // HNS fields
  pacingGoal: varchar('pacing_goal', { length: 20 }),
  actionDialogueRatio: varchar('action_dialogue_ratio', { length: 10 }),
  chapterHook: json('chapter_hook').$type<{type: string; description: string; urgency_level: string}>(),
  hnsData: json('hns_data').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scenes table - Chapter breakdown with HNS support and publishing
export const scenes = pgTable('scenes', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').default(''),
  chapterId: text('chapter_id').references(() => chapters.id).notNull(),
  orderIndex: integer('order_index').notNull(),
  wordCount: integer('word_count').default(0),
  goal: text('goal'),
  conflict: text('conflict'),
  outcome: text('outcome'),
  // Image fields
  imageUrl: text('image_url'), // Original scene image URL from Vercel Blob
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized image variants (AVIF, WebP, JPEG in multiple sizes)
  // HNS fields
  povCharacterId: text('pov_character_id'),
  settingId: text('setting_id'),
  narrativeVoice: varchar('narrative_voice', { length: 50 }),
  summary: text('summary'),
  entryHook: text('entry_hook'),
  emotionalShift: json('emotional_shift').$type<{from: string; to: string}>(),
  hnsData: json('hns_data').$type<Record<string, unknown>>(),
  // Character and place references for scene writing
  characterIds: json('character_ids').$type<string[]>().default([]).notNull(),
  placeIds: json('place_ids').$type<string[]>().default([]).notNull(),
  // Publishing fields
  publishedAt: timestamp('published_at'),
  scheduledFor: timestamp('scheduled_for'),
  visibility: visibilityEnum('visibility').default('private').notNull(),
  autoPublish: boolean('auto_publish').default(false),
  publishedBy: text('published_by').references(() => users.id),
  unpublishedAt: timestamp('unpublished_at'),
  unpublishedBy: text('unpublished_by').references(() => users.id),
  // Comic publishing fields
  comicStatus: comicStatusEnum('comic_status').default('none').notNull(),
  comicPublishedAt: timestamp('comic_published_at'),
  comicPublishedBy: text('comic_published_by').references(() => users.id),
  comicUnpublishedAt: timestamp('comic_unpublished_at'),
  comicUnpublishedBy: text('comic_unpublished_by').references(() => users.id),
  comicGeneratedAt: timestamp('comic_generated_at'),
  comicPanelCount: integer('comic_panel_count').default(0),
  comicVersion: integer('comic_version').default(1),
  // View tracking - general and format-specific
  viewCount: integer('view_count').default(0).notNull(),
  uniqueViewCount: integer('unique_view_count').default(0).notNull(),
  novelViewCount: integer('novel_view_count').default(0).notNull(),
  novelUniqueViewCount: integer('novel_unique_view_count').default(0).notNull(),
  comicViewCount: integer('comic_view_count').default(0).notNull(),
  comicUniqueViewCount: integer('comic_unique_view_count').default(0).notNull(),
  lastViewedAt: timestamp('last_viewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comic Panels table - Panel-by-panel storyboard for scenes
export const comicPanels = pgTable('comic_panels', {
  id: text('id').primaryKey(),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }).notNull(),
  panelNumber: integer('panel_number').notNull(),
  shotType: shotTypeEnum('shot_type').notNull(),

  // Image data
  imageUrl: text('image_url').notNull(),
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized variants (AVIF, WebP, JPEG)

  // Content overlays
  narrative: text('narrative'), // Narrative text for panels without characters
  dialogue: json('dialogue').$type<Array<{character_id: string; text: string; tone?: string}>>(),
  sfx: json('sfx').$type<Array<{text: string; emphasis: 'normal' | 'large' | 'dramatic'}>>(),
  description: text('description'), // Visual description for image generation

  // Metadata
  metadata: json('metadata').$type<{
    prompt: string;
    characters_visible: string[];
    camera_angle: string;
    mood: string;
    generated_at: string;
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scene Views table - Tracks individual scene views for analytics
export const sceneViews = pgTable('scene_views', {
  id: text('id').primaryKey().default('gen_random_uuid()::text'),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'), // Anonymous session ID from cookie
  readingFormat: readingFormatEnum('reading_format').default('novel').notNull(), // Format: novel or comic
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Characters table - Story characters with HNS support
export const characters = pgTable('characters', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  isMain: boolean('is_main').default(false),
  content: text('content').default(''), // Store all character data as YAML/JSON
  imageUrl: text('image_url'), // Original character image URL from Vercel Blob
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized image variants (AVIF, WebP, JPEG in multiple sizes)
  // HNS fields
  role: varchar('role', { length: 50 }),
  archetype: varchar('archetype', { length: 100 }),
  summary: text('summary'),
  storyline: text('storyline'),
  personality: json('personality').$type<{traits: string[]; myers_briggs: string; enneagram: string}>(),
  backstory: json('backstory').$type<Record<string, string>>(),
  motivations: json('motivations').$type<{primary: string; secondary: string; fear: string}>(),
  voice: json('voice').$type<Record<string, unknown>>(),
  physicalDescription: json('physical_description').$type<Record<string, unknown>>(),
  visualReferenceId: text('visual_reference_id'),
  hnsData: json('hns_data').$type<Record<string, unknown>>(),
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
  imageUrl: text('image_url'), // Original place image URL from Vercel Blob
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized image variants (AVIF, WebP, JPEG in multiple sizes)
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

// API Keys table - User-generated API keys for external authentication
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull().default('API Key'),
  keyHash: varchar('key_hash', { length: 64 }).notNull().unique(), // SHA-256 hash
  keyPrefix: varchar('key_prefix', { length: 16 }).notNull(), // First 16 chars for UI display
  scopes: json('scopes').$type<string[]>().default([]).notNull(), // Permissions array
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Community posts table - Story-specific community discussions
export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  contentType: contentTypeEnum('content_type').default('markdown').notNull(),
  contentHtml: text('content_html'),
  contentImages: json('content_images').$type<Array<{ url: string; alt?: string; }>>().default([]),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).default('discussion'), // discussion, theory, review, question
  isPinned: boolean('is_pinned').default(false),
  isLocked: boolean('is_locked').default(false),
  isEdited: boolean('is_edited').default(false),
  editCount: integer('edit_count').default(0),
  lastEditedAt: timestamp('last_edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  likes: integer('likes').default(0),
  replies: integer('replies').default(0),
  views: integer('views').default(0),
  moderationStatus: moderationStatusEnum('moderation_status').default('approved'),
  moderationReason: text('moderation_reason'),
  moderatedBy: text('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at'),
  tags: json('tags').$type<string[]>().default([]),
  mentions: json('mentions').$type<Array<{ userId: string; username: string; }>>().default([]),
  lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Community replies table - Threaded replies to posts
export const communityReplies: any = pgTable('community_replies', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  contentType: contentTypeEnum('content_type').default('markdown').notNull(),
  contentHtml: text('content_html'),
  contentImages: json('content_images').$type<Array<{ url: string; alt?: string; }>>().default([]),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }).notNull(),
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  parentReplyId: text('parent_reply_id').references(() => communityReplies.id, { onDelete: 'cascade' }), // For nested replies
  depth: integer('depth').default(0).notNull(),
  isEdited: boolean('is_edited').default(false),
  editCount: integer('edit_count').default(0),
  lastEditedAt: timestamp('last_edited_at'),
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  likes: integer('likes').default(0),
  mentions: json('mentions').$type<Array<{ userId: string; username: string; }>>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


// Post likes table - Track likes on community posts
export const postLikes = pgTable('post_likes', {
  postId: text('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
}));

// Post views table - Track views on community posts
export const postViews = pgTable('post_views', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => communityPosts.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for anonymous views
  sessionId: varchar('session_id', { length: 255 }), // Browser session ID
  ipHash: varchar('ip_hash', { length: 64 }), // Hashed IP address for privacy
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reading history table - Track user's story reading history
export const readingHistory = pgTable('reading_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  readingFormat: readingFormatEnum('reading_format').default('novel').notNull(), // Format: novel or comic
  lastReadAt: timestamp('last_read_at').defaultNow().notNull(),
  readCount: integer('read_count').default(1).notNull(), // Track how many times user viewed this story in this format

  // Format-specific progress tracking
  lastSceneId: text('last_scene_id'), // For novel format: which scene was last read
  lastPanelId: text('last_panel_id'), // For comic format: which panel was last viewed
  lastPageNumber: integer('last_page_number'), // For comic format: which page was last viewed

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint per user, story, and format (allows same story in both formats)
  uniqueUserStoryFormat: unique('user_story_format_unique').on(table.userId, table.storyId, table.readingFormat),
}));

// Define relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stories: many(stories),
  aiInteractions: many(aiInteractions),
  stats: one(userStats),
  preferences: one(userPreferences),
  communityPosts: many(communityPosts),
  communityReplies: many(communityReplies),
  apiKeys: many(apiKeys),
  readingHistory: many(readingHistory),
  research: many(research),
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
  settings: many(settings),
  communityPosts: many(communityPosts),
  readingHistory: many(readingHistory),
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

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [scenes.chapterId],
    references: [chapters.id],
  }),
  comicPanels: many(comicPanels),
}));

export const comicPanelsRelations = relations(comicPanels, ({ one }) => ({
  scene: one(scenes, {
    fields: [comicPanels.sceneId],
    references: [scenes.id],
  }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  story: one(stories, {
    fields: [characters.storyId],
    references: [stories.id],
  }),
}));

// Settings table (renamed from places for HNS alignment)
export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  storyId: text('story_id').references(() => stories.id).notNull(),
  description: text('description'),
  mood: text('mood'),
  sensory: json('sensory').$type<Record<string, string[]>>(),
  visualStyle: text('visual_style'),
  visualReferences: json('visual_references').$type<string[]>(),
  colorPalette: json('color_palette').$type<string[]>(),
  architecturalStyle: text('architectural_style'),
  imageUrl: text('image_url'), // Original setting image URL from Vercel Blob
  imageVariants: json('image_variants').$type<Record<string, unknown>>(), // Optimized image variants (AVIF, WebP, JPEG in multiple sizes)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const placesRelations = relations(places, ({ one }) => ({
  story: one(stories, {
    fields: [places.storyId],
    references: [stories.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  story: one(stories, {
    fields: [settings.storyId],
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
  moderator: one(users, {
    fields: [communityPosts.moderatedBy],
    references: [users.id],
  }),
  replies: many(communityReplies),
  likes: many(postLikes),
  views: many(postViews),
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

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Relations for new community tables
export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postLikes.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postViews.postId],
    references: [communityPosts.id],
  }),
  user: one(users, {
    fields: [postViews.userId],
    references: [users.id],
  }),
}));

// Scene evaluations table - Store AI-powered scene evaluations
export const sceneEvaluations = pgTable('scene_evaluations', {
  id: text('id').primaryKey(),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }).notNull(),

  // Store full evaluation as JSON (complete evaluation object)
  evaluation: json('evaluation').notNull(),

  // Indexed scores for querying (stored as numeric strings for precision)
  overallScore: varchar('overall_score', { length: 10 }).notNull(),
  plotScore: varchar('plot_score', { length: 10 }).notNull(),
  characterScore: varchar('character_score', { length: 10 }).notNull(),
  pacingScore: varchar('pacing_score', { length: 10 }).notNull(),
  proseScore: varchar('prose_score', { length: 10 }).notNull(),
  worldBuildingScore: varchar('world_building_score', { length: 10 }).notNull(),

  // Metadata
  modelVersion: varchar('model_version', { length: 50 }).default('gpt-4o-mini'),
  tokenUsage: integer('token_usage'),
  evaluationTimeMs: integer('evaluation_time_ms'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

export const sceneEvaluationsRelations = relations(sceneEvaluations, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneEvaluations.sceneId],
    references: [scenes.id],
  }),
}));

// Comments table - Scene-level comments for reading page
export const comments: any = pgTable('comments', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  parentCommentId: text('parent_comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  depth: integer('depth').default(0).notNull(),
  likeCount: integer('like_count').default(0).notNull(),
  dislikeCount: integer('dislike_count').default(0).notNull(),
  replyCount: integer('reply_count').default(0).notNull(),
  isEdited: boolean('is_edited').default(false).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Comment likes table
export const commentLikes = pgTable('comment_likes', {
  commentId: text('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.commentId, table.userId] }),
}));

// Story likes table
export const storyLikes = pgTable('story_likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  storyId: text('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.storyId] }),
}));

// Chapter likes table
export const chapterLikes = pgTable('chapter_likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.chapterId] }),
}));

// Scene likes table
export const sceneLikes = pgTable('scene_likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.sceneId] }),
}));

// Comment dislikes table
export const commentDislikes = pgTable('comment_dislikes', {
  commentId: text('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.commentId, table.userId] }),
}));

// Scene dislikes table
export const sceneDislikes = pgTable('scene_dislikes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.sceneId] }),
}));

// Relations for comments
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [comments.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [comments.chapterId],
    references: [chapters.id],
  }),
  scene: one(scenes, {
    fields: [comments.sceneId],
    references: [scenes.id],
  }),
  parentComment: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: 'parentChild',
  }),
  childComments: many(comments, { relationName: 'parentChild' }),
  likes: many(commentLikes),
  dislikes: many(commentDislikes),
}));

// Relations for likes
export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
}));

export const storyLikesRelations = relations(storyLikes, ({ one }) => ({
  story: one(stories, {
    fields: [storyLikes.storyId],
    references: [stories.id],
  }),
  user: one(users, {
    fields: [storyLikes.userId],
    references: [users.id],
  }),
}));

export const chapterLikesRelations = relations(chapterLikes, ({ one }) => ({
  chapter: one(chapters, {
    fields: [chapterLikes.chapterId],
    references: [chapters.id],
  }),
  user: one(users, {
    fields: [chapterLikes.userId],
    references: [users.id],
  }),
}));

export const sceneLikesRelations = relations(sceneLikes, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneLikes.sceneId],
    references: [scenes.id],
  }),
  user: one(users, {
    fields: [sceneLikes.userId],
    references: [users.id],
  }),
}));

export const commentDislikesRelations = relations(commentDislikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentDislikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentDislikes.userId],
    references: [users.id],
  }),
}));

export const sceneDislikesRelations = relations(sceneDislikes, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneDislikes.sceneId],
    references: [scenes.id],
  }),
  user: one(users, {
    fields: [sceneDislikes.userId],
    references: [users.id],
  }),
}));

// Analytics events table - Track all user interactions
export const analyticsEvents = pgTable('analytics_events', {
  id: text('id').primaryKey(),
  eventType: eventTypeEnum('event_type').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id').notNull(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  postId: text('post_id').references(() => communityPosts.id, { onDelete: 'cascade' }),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reading sessions table - Track reading sessions
export const readingSessions = pgTable('reading_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').notNull(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  durationSeconds: integer('duration_seconds'),
  chaptersRead: integer('chapters_read').default(0),
  scenesRead: integer('scenes_read').default(0),
  charactersRead: integer('characters_read').default(0),
  sessionType: sessionTypeEnum('session_type').default('continuous'),
  deviceType: varchar('device_type', { length: 20 }),
  completedStory: boolean('completed_story').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Story insights table - AI-generated insights
export const storyInsights = pgTable('story_insights', {
  id: text('id').primaryKey(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  insightType: insightTypeEnum('insight_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: varchar('severity', { length: 20 }).default('info'),
  actionItems: json('action_items').$type<string[]>().default([]),
  metrics: json('metrics').$type<Record<string, unknown>>().default({}),
  aiModel: varchar('ai_model', { length: 50 }),
  confidenceScore: varchar('confidence_score', { length: 10 }),
  isRead: boolean('is_read').default(false),
  isDismissed: boolean('is_dismissed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});


// Relations for analytics tables
export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [analyticsEvents.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [analyticsEvents.chapterId],
    references: [chapters.id],
  }),
  scene: one(scenes, {
    fields: [analyticsEvents.sceneId],
    references: [scenes.id],
  }),
  post: one(communityPosts, {
    fields: [analyticsEvents.postId],
    references: [communityPosts.id],
  }),
}));

export const readingSessionsRelations = relations(readingSessions, ({ one }) => ({
  user: one(users, {
    fields: [readingSessions.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [readingSessions.storyId],
    references: [stories.id],
  }),
}));

export const storyInsightsRelations = relations(storyInsights, ({ one }) => ({
  story: one(stories, {
    fields: [storyInsights.storyId],
    references: [stories.id],
  }),
}));

// Publishing schedules table - Automated publishing schedules
export const publishingSchedules = pgTable('publishing_schedules', {
  id: text('id').primaryKey(),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  createdBy: text('created_by').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scheduleType: scheduleTypeEnum('schedule_type').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  publishTime: text('publish_time').default('09:00:00').notNull(),
  intervalDays: integer('interval_days'),
  daysOfWeek: json('days_of_week').$type<number[]>(),
  scenesPerPublish: integer('scenes_per_publish').default(1),
  isActive: boolean('is_active').default(true),
  isCompleted: boolean('is_completed').default(false),
  lastPublishedAt: timestamp('last_published_at'),
  nextPublishAt: timestamp('next_publish_at'),
  totalPublished: integer('total_published').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scheduled publications table - Queue of publications
export const scheduledPublications = pgTable('scheduled_publications', {
  id: text('id').primaryKey(),
  scheduleId: text('schedule_id').references(() => publishingSchedules.id, { onDelete: 'cascade' }),
  storyId: text('story_id').references(() => stories.id, { onDelete: 'cascade' }).notNull(),
  chapterId: text('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }),
  sceneId: text('scene_id').references(() => scenes.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for').notNull(),
  publishedAt: timestamp('published_at'),
  status: publicationStatusEnum('status').default('pending').notNull(),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for publishing tables
export const publishingSchedulesRelations = relations(publishingSchedules, ({ one, many }) => ({
  story: one(stories, {
    fields: [publishingSchedules.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [publishingSchedules.chapterId],
    references: [chapters.id],
  }),
  creator: one(users, {
    fields: [publishingSchedules.createdBy],
    references: [users.id],
  }),
  publications: many(scheduledPublications),
}));

export const scheduledPublicationsRelations = relations(scheduledPublications, ({ one }) => ({
  schedule: one(publishingSchedules, {
    fields: [scheduledPublications.scheduleId],
    references: [publishingSchedules.id],
  }),
  story: one(stories, {
    fields: [scheduledPublications.storyId],
    references: [stories.id],
  }),
  chapter: one(chapters, {
    fields: [scheduledPublications.chapterId],
    references: [chapters.id],
  }),
  scene: one(scenes, {
    fields: [scheduledPublications.sceneId],
    references: [scenes.id],
  }),
}));

// Research table - Store research notes and documentation
export const research = pgTable('research', {
  id: text('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(), // Markdown content
  authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tags: json('tags').$type<string[]>().default([]),
  viewCount: integer('view_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations for research table
export const researchRelations = relations(research, ({ one }) => ({
  author: one(users, {
    fields: [research.authorId],
    references: [users.id],
  }),
}));

