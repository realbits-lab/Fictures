import { relations } from "drizzle-orm/relations";
import { user, userPreferences, session, stories, places, chapters, scenes, parts, writingSessions, aiInteractions, comments, ratings, storySubscriptions, achievements, userAchievements, characters, account } from "./schema";

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(user, {
		fields: [userPreferences.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	userPreferences: many(userPreferences),
	sessions: many(session),
	accounts: many(account),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const placesRelations = relations(places, ({one}) => ({
	story: one(stories, {
		fields: [places.storyId],
		references: [stories.id]
	}),
}));

export const storiesRelations = relations(stories, ({many}) => ({
	places: many(places),
	chapters: many(chapters),
	ratings: many(ratings),
	storySubscriptions: many(storySubscriptions),
	parts: many(parts),
	characters: many(characters),
}));

export const scenesRelations = relations(scenes, ({one}) => ({
	chapter: one(chapters, {
		fields: [scenes.chapterId],
		references: [chapters.id]
	}),
}));

export const chaptersRelations = relations(chapters, ({one, many}) => ({
	scenes: many(scenes),
	story: one(stories, {
		fields: [chapters.storyId],
		references: [stories.id]
	}),
	part: one(parts, {
		fields: [chapters.partId],
		references: [parts.id]
	}),
	writingSessions: many(writingSessions),
	comments: many(comments),
}));

export const partsRelations = relations(parts, ({one, many}) => ({
	chapters: many(chapters),
	story: one(stories, {
		fields: [parts.storyId],
		references: [stories.id]
	}),
}));

export const aiInteractionsRelations = relations(aiInteractions, ({one}) => ({
	writingSession: one(writingSessions, {
		fields: [aiInteractions.sessionId],
		references: [writingSessions.id]
	}),
}));

export const writingSessionsRelations = relations(writingSessions, ({one, many}) => ({
	aiInteractions: many(aiInteractions),
	chapter: one(chapters, {
		fields: [writingSessions.chapterId],
		references: [chapters.id]
	}),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	chapter: one(chapters, {
		fields: [comments.chapterId],
		references: [chapters.id]
	}),
}));

export const ratingsRelations = relations(ratings, ({one}) => ({
	story: one(stories, {
		fields: [ratings.storyId],
		references: [stories.id]
	}),
}));

export const storySubscriptionsRelations = relations(storySubscriptions, ({one}) => ({
	story: one(stories, {
		fields: [storySubscriptions.storyId],
		references: [stories.id]
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const charactersRelations = relations(characters, ({one}) => ({
	story: one(stories, {
		fields: [characters.storyId],
		references: [stories.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));