import { relations } from "drizzle-orm/relations";
import { users, apiKeys, stories, places, settings, scenes, sceneEvaluations, characters, ratings, storySubscriptions, chapters, comments, writingSessions, follows, reactions, userAchievements, achievements, userStats, aiInteractions, sessions, parts, userPreferences, accounts } from "./schema";

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	apiKeys: many(apiKeys),
	ratings: many(ratings),
	storySubscriptions: many(storySubscriptions),
	comments: many(comments),
	writingSessions: many(writingSessions),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	reactions: many(reactions),
	userAchievements: many(userAchievements),
	userStats: many(userStats),
	aiInteractions: many(aiInteractions),
	sessions: many(sessions),
	stories: many(stories),
	chapters: many(chapters),
	parts: many(parts),
	userPreferences: many(userPreferences),
	accounts: many(accounts),
}));

export const placesRelations = relations(places, ({one}) => ({
	story: one(stories, {
		fields: [places.storyId],
		references: [stories.id]
	}),
}));

export const storiesRelations = relations(stories, ({one, many}) => ({
	places: many(places),
	settings: many(settings),
	characters: many(characters),
	ratings: many(ratings),
	storySubscriptions: many(storySubscriptions),
	user: one(users, {
		fields: [stories.authorId],
		references: [users.id]
	}),
	chapters: many(chapters),
	parts: many(parts),
}));

export const settingsRelations = relations(settings, ({one}) => ({
	story: one(stories, {
		fields: [settings.storyId],
		references: [stories.id]
	}),
}));

export const sceneEvaluationsRelations = relations(sceneEvaluations, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneEvaluations.sceneId],
		references: [scenes.id]
	}),
}));

export const scenesRelations = relations(scenes, ({one, many}) => ({
	sceneEvaluations: many(sceneEvaluations),
	chapter: one(chapters, {
		fields: [scenes.chapterId],
		references: [chapters.id]
	}),
}));

export const charactersRelations = relations(characters, ({one}) => ({
	story: one(stories, {
		fields: [characters.storyId],
		references: [stories.id]
	}),
}));

export const ratingsRelations = relations(ratings, ({one}) => ({
	user: one(users, {
		fields: [ratings.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [ratings.storyId],
		references: [stories.id]
	}),
}));

export const storySubscriptionsRelations = relations(storySubscriptions, ({one}) => ({
	user: one(users, {
		fields: [storySubscriptions.userId],
		references: [users.id]
	}),
	story: one(stories, {
		fields: [storySubscriptions.storyId],
		references: [stories.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	chapter: one(chapters, {
		fields: [comments.chapterId],
		references: [chapters.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	comments: many(comments),
	scenes: many(scenes),
	writingSessions: many(writingSessions),
	story: one(stories, {
		fields: [chapters.storyId],
		references: [stories.id]
	}),
	part: one(parts, {
		fields: [chapters.partId],
		references: [parts.id]
	}),
	user: one(users, {
		fields: [chapters.authorId],
		references: [users.id]
	}),
}));

export const writingSessionsRelations = relations(writingSessions, ({one, many}) => ({
	user: one(users, {
		fields: [writingSessions.userId],
		references: [users.id]
	}),
	chapter: one(chapters, {
		fields: [writingSessions.chapterId],
		references: [chapters.id]
	}),
	aiInteractions: many(aiInteractions),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const reactionsRelations = relations(reactions, ({one}) => ({
	user: one(users, {
		fields: [reactions.userId],
		references: [users.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({one}) => ({
	user: one(users, {
		fields: [aiInteractions.userId],
		references: [users.id]
	}),
	writingSession: one(writingSessions, {
		fields: [aiInteractions.sessionId],
		references: [writingSessions.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const partsRelations = relations(parts, ({one, many}) => ({
	chapters: many(chapters),
	story: one(stories, {
		fields: [parts.storyId],
		references: [stories.id]
	}),
	user: one(users, {
		fields: [parts.authorId],
		references: [users.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));