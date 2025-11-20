#!/usr/bin/env tsx

/**
 * Publish All Script
 *
 * Publishes all content for a story:
 * 1. Story status → published
 * 2. All scenes novelStatus → published
 * 3. All scenes comicStatus → published (if comic panels exist)
 *
 * Usage:
 *   dotenv --file .env.local run pnpm exec tsx scripts/publish-all.ts --story-id <id>
 *
 * Options:
 *   --story-id <id>    Story ID to publish (required)
 *   --help, -h         Show this help message
 *
 * Prerequisites:
 *   - Valid story ID in database
 *   - Valid API key in .auth/user.json
 *   - Environment variables: DATABASE_URL
 */

import fs from "node:fs";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/index.js";
import {
    chapters,
    comicPanels,
    scenes,
    stories,
    users,
} from "../src/lib/schemas/database/index.js";

// Parse command line arguments
const args = process.argv.slice(2);
const helpFlag = args.includes("--help") || args.includes("-h");

function getArgValue(flag: string, defaultValue: string): string {
    const index = args.indexOf(flag);
    if (index !== -1 && args[index + 1]) {
        return args[index + 1];
    }
    return defaultValue;
}

// Show help
if (helpFlag) {
    console.log(`
Publish All Script

Publishes all content for a story:
1. Story status → published
2. All scenes novelStatus → published
3. All scenes comicStatus → published (if comic panels exist)

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/publish-all.ts --story-id <id>

Options:
  --story-id <id>    Story ID to publish (required)
  --help, -h         Show this help message

Example:
  dotenv --file .env.local run pnpm exec tsx scripts/publish-all.ts --story-id story_abc123
`);
    process.exit(0);
}

// Get story ID
const storyId = getArgValue("--story-id", "");

if (!storyId) {
    console.error("❌ Error: --story-id is required");
    console.error(
        "Usage: dotenv --file .env.local run pnpm exec tsx scripts/publish-all.ts --story-id <id>",
    );
    process.exit(1);
}

// Load auth data to get user ID
const authPath = ".auth/user.json";
if (!fs.existsSync(authPath)) {
    console.error("❌ Error: .auth/user.json not found");
    process.exit(1);
}

const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));
const writerEmail =
    authData.develop?.profiles?.writer?.email ||
    authData.profiles?.writer?.email;

async function publishAll(): Promise<void> {
    console.log(`\n📢 Publishing all content for story: ${storyId}\n`);
    console.log("=".repeat(60));

    const now = new Date();

    // 1. Verify story exists
    const [story] = await db
        .select()
        .from(stories)
        .where(eq(stories.id, storyId))
        .limit(1);

    if (!story) {
        console.error(`❌ Error: Story not found: ${storyId}`);
        process.exit(1);
    }

    console.log(`\n📖 Story: ${story.title}`);
    console.log(`   Current Status: ${story.status}`);

    // 2. Get user ID for publishedBy
    const [writer] = await db
        .select()
        .from(users)
        .where(eq(users.email, writerEmail))
        .limit(1);

    if (!writer) {
        console.error(`❌ Error: Writer user not found: ${writerEmail}`);
        process.exit(1);
    }

    const publishedBy = writer.id;
    console.log(`\n👤 Publishing as: ${writerEmail}`);

    // 3. Get all chapters for this story
    const storyChapters = await db
        .select()
        .from(chapters)
        .where(eq(chapters.storyId, storyId))
        .orderBy(chapters.orderIndex);

    if (storyChapters.length === 0) {
        console.error(`❌ Error: No chapters found for story: ${storyId}`);
        process.exit(1);
    }

    // 4. Get all scenes
    const chapterIds = storyChapters.map((ch) => ch.id);
    const allScenes: {
        id: string;
        title: string;
        novelStatus: string | null;
        comicStatus: string | null;
    }[] = [];

    for (const chapterId of chapterIds) {
        const chapterScenes = await db
            .select({
                id: scenes.id,
                title: scenes.title,
                novelStatus: scenes.novelStatus,
                comicStatus: scenes.comicStatus,
            })
            .from(scenes)
            .where(eq(scenes.chapterId, chapterId))
            .orderBy(scenes.orderIndex);

        allScenes.push(...chapterScenes);
    }

    console.log(`\n📚 Found ${storyChapters.length} chapter(s)`);
    console.log(`📄 Found ${allScenes.length} scene(s)`);

    // 5. Count comic panels
    let totalPanels = 0;
    const scenesWithPanels: string[] = [];

    for (const scene of allScenes) {
        const panels = await db
            .select()
            .from(comicPanels)
            .where(eq(comicPanels.sceneId, scene.id));

        if (panels.length > 0) {
            totalPanels += panels.length;
            scenesWithPanels.push(scene.id);
        }
    }

    console.log(
        `🎨 Found ${totalPanels} comic panel(s) in ${scenesWithPanels.length} scene(s)`,
    );

    // 6. Publish story
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔄 Step 1: Publishing Story");
    console.log("=".repeat(60));

    await db
        .update(stories)
        .set({
            status: "published",
            updatedAt: now.toISOString(),
        })
        .where(eq(stories.id, storyId));

    console.log(`✅ Story status updated to 'published'`);

    // 7. Publish all scenes (novel format)
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔄 Step 2: Publishing Scenes (Novel Format)");
    console.log("=".repeat(60));

    let novelPublished = 0;
    let novelFailed = 0;

    for (const scene of allScenes) {
        try {
            await db
                .update(scenes)
                .set({
                    novelStatus: "published",
                    publishedAt: now.toISOString(),
                    publishedBy,
                    updatedAt: now.toISOString(),
                })
                .where(eq(scenes.id, scene.id));

            novelPublished++;
        } catch (_error) {
            console.error(`   ❌ Failed to publish scene: ${scene.title}`);
            novelFailed++;
        }
    }

    console.log(`✅ Published ${novelPublished} scene(s) as novels`);
    if (novelFailed > 0) {
        console.log(`❌ Failed to publish ${novelFailed} scene(s)`);
    }

    // 8. Publish all comics (comic format)
    console.log(`\n${"=".repeat(60)}`);
    console.log("🔄 Step 3: Publishing Comics");
    console.log("=".repeat(60));

    let comicPublished = 0;
    let comicSkipped = 0;
    let comicFailed = 0;

    for (const scene of allScenes) {
        // Check if this scene has comic panels
        const panels = await db
            .select()
            .from(comicPanels)
            .where(eq(comicPanels.sceneId, scene.id));

        if (panels.length === 0) {
            comicSkipped++;
            continue;
        }

        try {
            await db
                .update(scenes)
                .set({
                    comicStatus: "published",
                    comicPublishedAt: now.toISOString(),
                    comicPublishedBy: publishedBy,
                    comicPanelCount: panels.length,
                    updatedAt: now.toISOString(),
                })
                .where(eq(scenes.id, scene.id));

            comicPublished++;
        } catch (_error) {
            console.error(`   ❌ Failed to publish comic: ${scene.title}`);
            comicFailed++;
        }
    }

    console.log(`✅ Published ${comicPublished} comic(s)`);
    if (comicSkipped > 0) {
        console.log(`⏭️  Skipped ${comicSkipped} scene(s) without comic panels`);
    }
    if (comicFailed > 0) {
        console.log(`❌ Failed to publish ${comicFailed} comic(s)`);
    }

    // 9. Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log("📊 PUBLISHING COMPLETE");
    console.log(`${"=".repeat(60)}\n`);

    console.log("Summary:");
    console.log(`  📖 Story: published`);
    console.log(
        `  📄 Novels: ${novelPublished} published, ${novelFailed} failed`,
    );
    console.log(
        `  🎨 Comics: ${comicPublished} published, ${comicSkipped} skipped, ${comicFailed} failed`,
    );
    console.log();

    console.log("🔗 View your published content:");
    console.log(`   Novel: http://localhost:3000/novels/${storyId}`);
    console.log(`   Comic: http://localhost:3000/comics/${storyId}`);
    console.log();

    // Exit with appropriate code
    const hasFailures = novelFailed > 0 || comicFailed > 0;
    process.exit(hasFailures ? 1 : 0);
}

// Run the script
publishAll().catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
});
