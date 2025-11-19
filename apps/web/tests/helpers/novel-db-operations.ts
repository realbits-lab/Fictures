/**
 * Database Operations for Novel Test Data
 *
 * Provides functions to insert and cleanup static novel test data
 * directly in the database using Drizzle ORM.
 *
 * This module is designed to be run in Node.js environment (not browser).
 */

import { Pool } from "@neondatabase/serverless";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "../../src/lib/schemas/database";
import { getAllTestData, TEST_IDS } from "./static-novel-data";

// =============================================================================
// Database Connection
// =============================================================================

/**
 * Create a database connection for test operations
 * Uses DATABASE_URL environment variable
 */
function createTestDbConnection() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error(
            "DATABASE_URL environment variable is required for test database operations",
        );
    }

    const pool = new Pool({ connectionString });
    return drizzle(pool, {
        schema: { stories, characters, settings, parts, chapters, scenes },
    });
}

// =============================================================================
// Insert Operations
// =============================================================================

/**
 * Insert all static novel test data into the database
 *
 * Inserts in the correct order to satisfy foreign key constraints:
 * 1. Story
 * 2. Characters
 * 3. Settings
 * 4. Part
 * 5. Chapters
 * 6. Scenes
 */
export async function insertNovelTestData(): Promise<void> {
    const db = createTestDbConnection();
    const testData = getAllTestData();

    console.log("Inserting novel test data into database...");

    try {
        // 1. Insert story
        await db.insert(stories).values(testData.story).onConflictDoNothing();
        console.log(`✓ Inserted story: ${testData.story.title}`);

        // 2. Insert characters
        for (const character of testData.characters) {
            await db.insert(characters).values(character).onConflictDoNothing();
            console.log(`✓ Inserted character: ${character.name}`);
        }

        // 3. Insert settings
        for (const setting of testData.settings) {
            await db.insert(settings).values(setting).onConflictDoNothing();
            console.log(`✓ Inserted setting: ${setting.name}`);
        }

        // 4. Insert part
        await db.insert(parts).values(testData.part).onConflictDoNothing();
        console.log(`✓ Inserted part: ${testData.part.title}`);

        // 5. Insert chapters
        for (const chapter of testData.chapters) {
            await db.insert(chapters).values(chapter).onConflictDoNothing();
            console.log(`✓ Inserted chapter: ${chapter.title}`);
        }

        // 6. Insert scenes
        for (const scene of testData.scenes) {
            await db.insert(scenes).values(scene).onConflictDoNothing();
            console.log(`✓ Inserted scene: ${scene.title}`);
        }

        console.log("Novel test data insertion completed successfully!");
    } catch (error) {
        console.error("Error inserting novel test data:", error);
        throw error;
    }
}

// =============================================================================
// Cleanup Operations
// =============================================================================

/**
 * Remove all static novel test data from the database
 *
 * Deletes in reverse order to satisfy foreign key constraints:
 * 1. Scenes
 * 2. Chapters
 * 3. Part
 * 4. Characters
 * 5. Settings
 * 6. Story
 */
export async function cleanupNovelTestData(): Promise<void> {
    const db = createTestDbConnection();

    console.log("Cleaning up novel test data from database...");

    try {
        // 1. Delete scenes
        const sceneIds = Object.values(TEST_IDS.scenes);
        const deletedScenes = await db
            .delete(scenes)
            .where(inArray(scenes.id, sceneIds))
            .returning({ id: scenes.id });
        console.log(`✓ Deleted ${deletedScenes.length} scenes`);

        // 2. Delete chapters
        const chapterIds = Object.values(TEST_IDS.chapters);
        const deletedChapters = await db
            .delete(chapters)
            .where(inArray(chapters.id, chapterIds))
            .returning({ id: chapters.id });
        console.log(`✓ Deleted ${deletedChapters.length} chapters`);

        // 3. Delete part
        const deletedParts = await db
            .delete(parts)
            .where(eq(parts.id, TEST_IDS.part))
            .returning({ id: parts.id });
        console.log(`✓ Deleted ${deletedParts.length} parts`);

        // 4. Delete characters
        const characterIds = Object.values(TEST_IDS.characters);
        const deletedCharacters = await db
            .delete(characters)
            .where(inArray(characters.id, characterIds))
            .returning({ id: characters.id });
        console.log(`✓ Deleted ${deletedCharacters.length} characters`);

        // 5. Delete settings
        const settingIds = Object.values(TEST_IDS.settings);
        const deletedSettings = await db
            .delete(settings)
            .where(inArray(settings.id, settingIds))
            .returning({ id: settings.id });
        console.log(`✓ Deleted ${deletedSettings.length} settings`);

        // 6. Delete story
        const deletedStory = await db
            .delete(stories)
            .where(eq(stories.id, TEST_IDS.story))
            .returning({ id: stories.id });
        console.log(`✓ Deleted ${deletedStory.length} stories`);

        console.log("Novel test data cleanup completed successfully!");
    } catch (error) {
        console.error("Error cleaning up novel test data:", error);
        throw error;
    }
}

/**
 * Check if novel test data exists in the database
 */
export async function novelTestDataExists(): Promise<boolean> {
    const db = createTestDbConnection();

    try {
        const result = await db
            .select({ id: stories.id })
            .from(stories)
            .where(eq(stories.id, TEST_IDS.story))
            .limit(1);

        return result.length > 0;
    } catch (error) {
        console.error("Error checking novel test data:", error);
        return false;
    }
}

/**
 * Reset novel test data (cleanup + insert)
 * Useful for ensuring fresh data state before tests
 */
export async function resetNovelTestData(): Promise<void> {
    console.log("Resetting novel test data...");

    // Clean up existing data first
    await cleanupNovelTestData();

    // Insert fresh data
    await insertNovelTestData();

    console.log("Novel test data reset completed!");
}

// =============================================================================
// Verification Operations
// =============================================================================

/**
 * Verify all novel test data is correctly inserted
 * Returns detailed counts for each entity type
 */
export async function verifyNovelTestData(): Promise<{
    story: boolean;
    characters: number;
    settings: number;
    parts: number;
    chapters: number;
    scenes: number;
}> {
    const db = createTestDbConnection();

    try {
        // Check story
        const storyResult = await db
            .select({ id: stories.id })
            .from(stories)
            .where(eq(stories.id, TEST_IDS.story));

        // Check characters
        const characterIds = Object.values(TEST_IDS.characters);
        const characterResult = await db
            .select({ id: characters.id })
            .from(characters)
            .where(inArray(characters.id, characterIds));

        // Check settings
        const settingIds = Object.values(TEST_IDS.settings);
        const settingResult = await db
            .select({ id: settings.id })
            .from(settings)
            .where(inArray(settings.id, settingIds));

        // Check parts
        const partResult = await db
            .select({ id: parts.id })
            .from(parts)
            .where(eq(parts.id, TEST_IDS.part));

        // Check chapters
        const chapterIds = Object.values(TEST_IDS.chapters);
        const chapterResult = await db
            .select({ id: chapters.id })
            .from(chapters)
            .where(inArray(chapters.id, chapterIds));

        // Check scenes
        const sceneIds = Object.values(TEST_IDS.scenes);
        const sceneResult = await db
            .select({ id: scenes.id })
            .from(scenes)
            .where(inArray(scenes.id, sceneIds));

        return {
            story: storyResult.length > 0,
            characters: characterResult.length,
            settings: settingResult.length,
            parts: partResult.length,
            chapters: chapterResult.length,
            scenes: sceneResult.length,
        };
    } catch (error) {
        console.error("Error verifying novel test data:", error);
        throw error;
    }
}
