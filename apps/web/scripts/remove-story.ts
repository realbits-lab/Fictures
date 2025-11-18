#!/usr/bin/env tsx

/**
 * Remove Story Script
 *
 * DESTRUCTIVE OPERATION: Permanently deletes story data from database and Vercel Blob storage.
 *
 * Safety Features:
 * - Requires --confirm flag to proceed
 * - Shows preview mode without --confirm
 * - Provides detailed deletion report
 *
 * Usage:
 *   # Remove all stories (preview)
 *   dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts
 *
 *   # Remove all stories (execute)
 *   dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts --confirm
 *
 * Prerequisites:
 *   - DATABASE_URL environment variable
 *   - BLOB_READ_WRITE_TOKEN environment variable
 */

import fs from "node:fs";
import path from "node:path";
import { del, list } from "@vercel/blob";
import { db } from "../src/lib/db/index.js";
import {
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
} from "../src/lib/schemas/database/index.js";
import { getEnvDisplayName } from "../src/lib/utils/environment.js";

// Parse command line arguments
const args = process.argv.slice(2);
const confirmFlag = args.includes("--confirm");
const helpFlag = args.includes("--help") || args.includes("-h");

// Show help
if (helpFlag) {
    console.log(`
Remove Story Script

DESTRUCTIVE OPERATION: Permanently deletes all story data from database and Vercel Blob storage.

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts [OPTIONS]

Options:
  --confirm          Execute the deletion (required for actual deletion)
  --help, -h         Show this help message

Examples:
  # Preview deletion
  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts

  # Execute deletion
  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts --confirm
`);
    process.exit(0);
}

console.log("🗑️  Remove Story Script");
console.log("=".repeat(60));
console.log();
console.log(`🌍 Environment: ${getEnvDisplayName()}`);
console.log(`📊 Mode: Database + Vercel Blob deletion`);
console.log();

// Preview mode
if (!confirmFlag) {
    console.log("⚠️  PREVIEW MODE - No data will be deleted");
    console.log();
    console.log(
        "This will permanently delete ALL stories from database and Vercel Blob:",
    );
    console.log("  📊 Database (27 tables):");
    console.log("     • Stories, parts, chapters, scenes");
    console.log("     • Characters, settings");
    console.log("     • Community posts, replies, comments");
    console.log("     • All likes, views, and metrics");
    console.log("     • Studio agent chats");
    console.log("     • Publishing schedules");
    console.log();
    console.log("  🗂️  Vercel Blob (stories/ prefix):");
    console.log("     • Story cover images");
    console.log("     • Scene images");
    console.log("     • Character portraits");
    console.log("     • Setting visuals");
    console.log("     • All optimized variants (AVIF + JPEG)");
    console.log();
    console.log("⚠️  WARNING: This operation is IRREVERSIBLE!");
    console.log();
    console.log("To proceed, add --confirm flag:");
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/remove-story.ts --confirm",
    );
    console.log();
    process.exit(0);
}

// Execution mode
async function executeDeletion() {
    console.log("⚠️  DESTRUCTIVE MODE - Proceeding with deletion");
    console.log();

    // Confirmation delay
    console.log("🚨 Starting deletion in 5 seconds...");
    console.log("   Press Ctrl+C to cancel");
    console.log();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("🔥 Executing deletion...");
    console.log();

    // Database deletion function
    async function deleteAllFromDatabase() {
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

        // Count items before deletion
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

        const beforeStats: DeletionStats = {
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

        if (beforeStats.stories === 0) {
            console.log(
                "ℹ️  No stories found in database. Nothing to delete.\n",
            );
            process.exit(0);
        }

        // Delete in reverse dependency order
        console.log("🗑️  Deleting all stories and related data...\n");

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

        console.log("Deleting analysis and metrics...");
        await db.delete(readingSessions);
        await db.delete(readingHistory);
        await db.delete(storyInsights);
        await db.delete(dailyStoryMetrics);

        console.log("Deleting publishing data...");
        await db.delete(scheduledPublications);
        await db.delete(publishingSchedules);

        console.log("Deleting scene data...");
        await db.delete(sceneEvaluations);
        await db.delete(comicPanels);

        console.log("Deleting community data...");
        await db.delete(communityReplies);
        await db.delete(communityPosts);
        await db.delete(comments);

        console.log("Deleting studio agent chats...");
        await db.delete(studioAgentChats);

        console.log("Deleting story structure...");
        await db.delete(scenes);
        await db.delete(chapters);
        await db.delete(parts);

        console.log("Deleting story metadata...");
        await db.delete(characters);
        await db.delete(settings);

        console.log("Deleting stories...");
        await db.delete(stories);

        console.log();
        console.log("✅ DATABASE DELETION COMPLETE\n");

        return beforeStats;
    }

    // Vercel Blob deletion function
    async function deleteAllFromBlob(): Promise<{
        totalFiles: number;
        batches: number;
    }> {
        console.log("🗂️  Deleting Vercel Blob files...\n");

        let totalDeleted = 0;
        let batches = 0;
        let cursor: string | undefined;

        // Delete all files under "stories/" prefix (both main/ and develop/ environments)
        const prefixes = ["main/stories/", "develop/stories/"];

        for (const prefix of prefixes) {
            console.log(`Scanning prefix: ${prefix}`);
            cursor = undefined;

            do {
                const listResult: Awaited<ReturnType<typeof list>> =
                    await list({
                        prefix,
                        cursor,
                        limit: 100,
                    });

                if (listResult.blobs.length > 0) {
                    const urls = listResult.blobs.map(
                        (blob: { url: string }) => blob.url,
                    );
                    await del(urls);
                    totalDeleted += urls.length;
                    batches++;
                    console.log(
                        `  Deleted batch ${batches}: ${urls.length} files`,
                    );
                }

                cursor = listResult.cursor;
            } while (cursor);
        }

        console.log();
        console.log(`✅ BLOB DELETION COMPLETE\n`);
        console.log(`   Total files deleted: ${totalDeleted}`);
        console.log(`   Total batches: ${batches}`);
        console.log();

        return { totalFiles: totalDeleted, batches };
    }

    // Execute deletions
    const dbStats = await deleteAllFromDatabase();
    const blobStats = await deleteAllFromBlob();

    // Final report
    console.log("=".repeat(60));
    console.log();
    console.log("📊 Final Deletion Report:");
    console.log();
    console.log("Database Records Deleted:");
    console.log(`  Stories:              ${dbStats.stories}`);
    console.log(`  Parts:                ${dbStats.parts}`);
    console.log(`  Chapters:             ${dbStats.chapters}`);
    console.log(`  Scenes:               ${dbStats.scenes}`);
    console.log(`  Characters:           ${dbStats.characters}`);
    console.log(`  Settings:             ${dbStats.settings}`);
    console.log(`  Community Posts:      ${dbStats.communityPosts}`);
    console.log(`  Comic Panels:         ${dbStats.comicPanels}`);
    console.log(`  Studio Agent Chats:   ${dbStats.studioAgentChats}`);
    console.log();

    const totalDb = Object.values(dbStats).reduce(
        (sum, count) => sum + count,
        0,
    );
    console.log(`  Total DB items:       ${totalDb}`);
    console.log();
    console.log("Blob Files Deleted:");
    console.log(`  Total files:          ${blobStats.totalFiles}`);
    console.log(`  Batches:              ${blobStats.batches}`);
    console.log();
    console.log("=".repeat(60));
    console.log();

    // Save report
    const logDir = "logs";
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(
        logDir,
        `remove-story-${new Date().toISOString().replace(/:/g, "-").split(".")[0]}.json`,
    );
    fs.writeFileSync(
        logFile,
        JSON.stringify(
            {
                mode: "database-and-blob",
                database: dbStats,
                blob: blobStats,
                timestamp: new Date().toISOString(),
            },
            null,
            2,
        ),
    );
    console.log(`📄 Report saved to: ${logFile}`);
    console.log();
}

// Run the deletion
executeDeletion().catch((error) => {
    console.error("❌ Error during deletion:", error);
    process.exit(1);
});
