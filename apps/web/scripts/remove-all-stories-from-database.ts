/**
 * Remove All Stories from Database Script
 *
 * This script removes all stories and related data from the database.
 *
 * WARNING: This is a DESTRUCTIVE operation that will permanently delete:
 * - All stories
 * - All parts, chapters, and scenes
 * - All characters and settings
 * - All community posts and comments
 * - All analysis and metrics data
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/remove-all-stories-from-database.ts
 *
 * Safety:
 * - Requires confirmation before deletion
 * - Shows count of items to be deleted
 * - Provides detailed deletion report
 */

import { db } from "../src/lib/db";
import {
    analysisEvents,
    chapterLikes,
    chapters,
    characters,
    comicPanels,
    commentDislikes,
    commentLikes,
    comments,
    communityPosts,
    communityReplies,
    dailyStoryMetrics,
    parts,
    postLikes,
    postViews,
    publishingSchedules,
    readingHistory,
    readingSessions,
    sceneDislikes,
    sceneEvaluations,
    sceneLikes,
    scenes,
    sceneViews,
    scheduledPublications,
    settings,
    stories,
    storyInsights,
    storyLikes,
    studioAgentChats,
} from "../src/lib/db/schema";

interface DeletionStats {
    stories: number;
    parts: number;
    chapters: number;
    scenes: number;
    characters: number;
    settings: number;
    communityPosts: number;
    communityReplies: number;
    comments: number;
    storyLikes: number;
    chapterLikes: number;
    sceneLikes: number;
    sceneDislikes: number;
    analysisEvents: number;
    readingSessions: number;
    readingHistory: number;
    storyInsights: number;
    dailyStoryMetrics: number;
    publishingSchedules: number;
    scheduledPublications: number;
    sceneViews: number;
    sceneEvaluations: number;
    comicPanels: number;
    studioAgentChats: number;
    postViews: number;
    postLikes: number;
    commentLikes: number;
    commentDislikes: number;
}

/**
 * Count all items to be deleted
 */
async function countItems(): Promise<DeletionStats> {
    console.log("📊 Counting items to be deleted...\n");

    const [
        storiesCount,
        partsCount,
        chaptersCount,
        scenesCount,
        charactersCount,
        settingsCount,
        communityPostsCount,
        communityRepliesCount,
        commentsCount,
        storyLikesCount,
        chapterLikesCount,
        sceneLikesCount,
        sceneDislikesCount,
        analysisEventsCount,
        readingSessionsCount,
        readingHistoryCount,
        storyInsightsCount,
        dailyStoryMetricsCount,
        publishingSchedulesCount,
        scheduledPublicationsCount,
        sceneViewsCount,
        sceneEvaluationsCount,
        comicPanelsCount,
        studioAgentChatsCount,
        postViewsCount,
        postLikesCount,
        commentLikesCount,
        commentDislikesCount,
    ] = await Promise.all([
        db.select().from(stories),
        db.select().from(parts),
        db.select().from(chapters),
        db.select().from(scenes),
        db.select().from(characters),
        db.select().from(settings),
        db.select().from(communityPosts),
        db.select().from(communityReplies),
        db.select().from(comments),
        db.select().from(storyLikes),
        db.select().from(chapterLikes),
        db.select().from(sceneLikes),
        db.select().from(sceneDislikes),
        db.select().from(analysisEvents),
        db.select().from(readingSessions),
        db.select().from(readingHistory),
        db.select().from(storyInsights),
        db.select().from(dailyStoryMetrics),
        db.select().from(publishingSchedules),
        db.select().from(scheduledPublications),
        db.select().from(sceneViews),
        db.select().from(sceneEvaluations),
        db.select().from(comicPanels),
        db.select().from(studioAgentChats),
        db.select().from(postViews),
        db.select().from(postLikes),
        db.select().from(commentLikes),
        db.select().from(commentDislikes),
    ]);

    return {
        stories: storiesCount.length,
        parts: partsCount.length,
        chapters: chaptersCount.length,
        scenes: scenesCount.length,
        characters: charactersCount.length,
        settings: settingsCount.length,
        communityPosts: communityPostsCount.length,
        communityReplies: communityRepliesCount.length,
        comments: commentsCount.length,
        storyLikes: storyLikesCount.length,
        chapterLikes: chapterLikesCount.length,
        sceneLikes: sceneLikesCount.length,
        sceneDislikes: sceneDislikesCount.length,
        analysisEvents: analysisEventsCount.length,
        readingSessions: readingSessionsCount.length,
        readingHistory: readingHistoryCount.length,
        storyInsights: storyInsightsCount.length,
        dailyStoryMetrics: dailyStoryMetricsCount.length,
        publishingSchedules: publishingSchedulesCount.length,
        scheduledPublications: scheduledPublicationsCount.length,
        sceneViews: sceneViewsCount.length,
        sceneEvaluations: sceneEvaluationsCount.length,
        comicPanels: comicPanelsCount.length,
        studioAgentChats: studioAgentChatsCount.length,
        postViews: postViewsCount.length,
        postLikes: postLikesCount.length,
        commentLikes: commentLikesCount.length,
        commentDislikes: commentDislikesCount.length,
    };
}

/**
 * Display deletion statistics
 */
function displayStats(stats: DeletionStats): void {
    console.log("Items to be deleted:");
    console.log("━".repeat(50));
    console.log(`Stories:                ${stats.stories}`);
    console.log(`Parts:                  ${stats.parts}`);
    console.log(`Chapters:               ${stats.chapters}`);
    console.log(`Scenes:                 ${stats.scenes}`);
    console.log(`Characters:             ${stats.characters}`);
    console.log(`Settings:               ${stats.settings}`);
    console.log(`Community Posts:        ${stats.communityPosts}`);
    console.log(`Community Replies:      ${stats.communityReplies}`);
    console.log(`Comments:               ${stats.comments}`);
    console.log(`Story Likes:            ${stats.storyLikes}`);
    console.log(`Chapter Likes:          ${stats.chapterLikes}`);
    console.log(`Scene Likes:            ${stats.sceneLikes}`);
    console.log(`Scene Dislikes:         ${stats.sceneDislikes}`);
    console.log(`Analysis Events:        ${stats.analysisEvents}`);
    console.log(`Reading Sessions:       ${stats.readingSessions}`);
    console.log(`Reading History:        ${stats.readingHistory}`);
    console.log(`Story Insights:         ${stats.storyInsights}`);
    console.log(`Daily Story Metrics:    ${stats.dailyStoryMetrics}`);
    console.log(`Publishing Schedules:   ${stats.publishingSchedules}`);
    console.log(`Scheduled Publications: ${stats.scheduledPublications}`);
    console.log(`Scene Views:            ${stats.sceneViews}`);
    console.log(`Scene Evaluations:      ${stats.sceneEvaluations}`);
    console.log(`Comic Panels:           ${stats.comicPanels}`);
    console.log(`Studio Agent Chats:     ${stats.studioAgentChats}`);
    console.log(`Post Views:             ${stats.postViews}`);
    console.log(`Post Likes:             ${stats.postLikes}`);
    console.log(`Comment Likes:          ${stats.commentLikes}`);
    console.log(`Comment Dislikes:       ${stats.commentDislikes}`);
    console.log("━".repeat(50));

    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    console.log(`Total items:            ${total}\n`);
}

/**
 * Prompt user for confirmation
 */
async function confirmDeletion(): Promise<boolean> {
    return new Promise((resolve) => {
        const readline = require("node:readline");
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(
            '⚠️  This will permanently delete ALL stories and related data. Type "DELETE ALL" to confirm: ',
            (answer: string) => {
                rl.close();
                resolve(answer === "DELETE ALL");
            },
        );
    });
}

/**
 * Delete all stories and related data
 */
async function deleteAllStories(): Promise<DeletionStats> {
    console.log("\n🗑️  Deleting all stories and related data...\n");

    // Delete in reverse dependency order to respect foreign key constraints

    // 1. Delete dependent data first (junction tables and analysis)
    console.log("Deleting likes and views...");
    await db.delete(commentDislikes);
    await db.delete(commentLikes);
    await db.delete(postLikes);
    await db.delete(postViews);
    await db.delete(sceneDislikes);
    await db.delete(sceneLikes);
    await db.delete(chapterLikes);
    await db.delete(storyLikes);
    await db.delete(sceneViews);

    // 2. Delete analysis and metrics
    console.log("Deleting analysis and metrics...");
    await db.delete(analysisEvents);
    await db.delete(readingSessions);
    await db.delete(readingHistory);
    await db.delete(storyInsights);
    await db.delete(dailyStoryMetrics);

    // 3. Delete publishing related data
    console.log("Deleting publishing data...");
    await db.delete(scheduledPublications);
    await db.delete(publishingSchedules);

    // 4. Delete scene related data
    console.log("Deleting scene data...");
    await db.delete(sceneEvaluations);
    await db.delete(comicPanels);

    // 5. Delete community data
    console.log("Deleting community data...");
    await db.delete(communityReplies);
    await db.delete(communityPosts);
    await db.delete(comments);

    // 6. Delete studio agent chats
    console.log("Deleting studio agent chats...");
    await db.delete(studioAgentChats);

    // 7. Delete story structure (scenes, chapters, parts)
    console.log("Deleting story structure...");
    await db.delete(scenes);
    await db.delete(chapters);
    await db.delete(parts);

    // 8. Delete story metadata
    console.log("Deleting story metadata...");
    await db.delete(characters);
    await db.delete(settings);

    // 9. Finally, delete stories
    console.log("Deleting stories...");
    await db.delete(stories);

    console.log("✅ All stories and related data deleted successfully\n");

    return await countItems();
}

/**
 * Main execution
 */
async function main(): Promise<void> {
    console.log("\n🗑️  Remove All Stories from Database Script\n");
    console.log("━".repeat(50));
    console.log("⚠️  WARNING: DESTRUCTIVE OPERATION");
    console.log("━".repeat(50));
    console.log(
        "This script will permanently delete ALL stories and related data.\n",
    );

    try {
        // Count items before deletion
        const beforeStats = await countItems();

        if (beforeStats.stories === 0) {
            console.log(
                "ℹ️  No stories found in database. Nothing to delete.\n",
            );
            process.exit(0);
        }

        displayStats(beforeStats);

        // Ask for confirmation
        const confirmed = await confirmDeletion();

        if (!confirmed) {
            console.log("\n❌ Deletion cancelled by user.\n");
            process.exit(0);
        }

        // Perform deletion
        const afterStats = await deleteAllStories();

        // Verify deletion
        console.log("📊 Verification after deletion:");
        displayStats(afterStats);

        if (afterStats.stories === 0) {
            console.log("✅ All stories successfully removed from database.\n");
        } else {
            console.log(
                "⚠️  Warning: Some stories may still remain. Please check manually.\n",
            );
        }
    } catch (error) {
        console.error("\n❌ Error during deletion:", error);
        process.exit(1);
    }
}

// Run the script
main();
