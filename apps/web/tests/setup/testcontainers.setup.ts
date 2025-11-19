/**
 * Testcontainers Setup for Playwright E2E Tests
 *
 * Provides isolated PostgreSQL database for testing using Docker containers.
 * Automatically handles container lifecycle, schema migration, and test data seeding.
 *
 * Test Data:
 * - Uses static novel data from helpers/static-novel-data.ts
 * - Complete story structure: 1 story, 2 characters, 2 settings, 1 part, 2 chapters, 6 scenes
 * - Full Adversity-Triumph narrative cycle with images and variants
 */

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/lib/schemas/database";
import {
	getAllTestData,
	TEST_IDS,
} from "../helpers/static-novel-data";

// Global container instance
let postgresContainer: StartedPostgreSqlContainer | null = null;
let connectionString: string | null = null;

/**
 * Start PostgreSQL container for testing
 */
export async function startPostgresContainer(): Promise<string> {
	if (postgresContainer) {
		return connectionString!;
	}

	console.log("🐳 Starting PostgreSQL container...");

	postgresContainer = await new PostgreSqlContainer("postgres:16-alpine")
		.withDatabase("fictures_test")
		.withUsername("test")
		.withPassword("test")
		.withExposedPorts(5432)
		.start();

	connectionString = postgresContainer.getConnectionUri();
	console.log(`✅ PostgreSQL container started: ${connectionString}`);

	return connectionString;
}

/**
 * Stop PostgreSQL container
 */
export async function stopPostgresContainer(): Promise<void> {
	if (postgresContainer) {
		console.log("🛑 Stopping PostgreSQL container...");
		await postgresContainer.stop();
		postgresContainer = null;
		connectionString = null;
		console.log("✅ PostgreSQL container stopped");
	}
}

/**
 * Get database connection for testing
 */
export function getTestDatabase(dbUrl: string) {
	const client = postgres(dbUrl);
	return drizzle(client, { schema });
}

/**
 * Run database migrations using raw SQL
 *
 * Creates the minimal schema needed for novel testing.
 * This approach is more reliable than drizzle-kit push for testcontainers.
 */
export async function runMigrations(dbUrl: string): Promise<void> {
	console.log("📦 Running database migrations...");

	const client = postgres(dbUrl);

	try {
		// Create enums
		await client`
			DO $$ BEGIN
				CREATE TYPE genre AS ENUM ('fantasy', 'sci-fi', 'romance', 'thriller', 'mystery', 'horror', 'literary', 'historical', 'adventure', 'comedy');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		await client`
			DO $$ BEGIN
				CREATE TYPE tone AS ENUM ('hopeful', 'dark', 'bittersweet', 'satirical');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		await client`
			DO $$ BEGIN
				CREATE TYPE status AS ENUM ('draft', 'published', 'archived');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		await client`
			DO $$ BEGIN
				CREATE TYPE chapter_status AS ENUM ('draft', 'editing', 'published');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		await client`
			DO $$ BEGIN
				CREATE TYPE scene_status AS ENUM ('draft', 'editing', 'published', 'unpublished', 'scheduled');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		await client`
			DO $$ BEGIN
				CREATE TYPE character_role AS ENUM ('protagonist', 'antagonist', 'mentor', 'sidekick', 'love-interest', 'supporting');
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`;

		// Create users table
		await client`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY NOT NULL,
				email VARCHAR(255) NOT NULL UNIQUE,
				password TEXT,
				name VARCHAR(255),
				image TEXT,
				username VARCHAR(255),
				bio TEXT,
				email_verified TIMESTAMP,
				role VARCHAR(50) DEFAULT 'reader' NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create api_keys table
		await client`
			CREATE TABLE IF NOT EXISTS api_keys (
				id TEXT PRIMARY KEY NOT NULL,
				user_id TEXT NOT NULL REFERENCES users(id),
				name VARCHAR(255) NOT NULL,
				key_prefix VARCHAR(16) NOT NULL,
				key_hash TEXT NOT NULL,
				scopes JSONB NOT NULL,
				last_used_at TIMESTAMP,
				expires_at TIMESTAMP,
				is_active BOOLEAN DEFAULT true NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create stories table
		await client`
			CREATE TABLE IF NOT EXISTS stories (
				id TEXT PRIMARY KEY NOT NULL,
				author_id TEXT NOT NULL REFERENCES users(id),
				title VARCHAR(255) NOT NULL,
				summary TEXT NOT NULL,
				genre genre NOT NULL,
				tone tone NOT NULL,
				moral_framework TEXT NOT NULL,
				status status DEFAULT 'draft' NOT NULL,
				view_count INTEGER DEFAULT 0 NOT NULL,
				rating INTEGER DEFAULT 0 NOT NULL,
				rating_count INTEGER DEFAULT 0 NOT NULL,
				image_url TEXT,
				image_variants JSONB,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create characters table
		await client`
			CREATE TABLE IF NOT EXISTS characters (
				id TEXT PRIMARY KEY NOT NULL,
				story_id TEXT NOT NULL REFERENCES stories(id),
				name VARCHAR(255) NOT NULL,
				role character_role NOT NULL,
				description TEXT NOT NULL,
				internal_flaw TEXT,
				arc_trajectory TEXT,
				image_url TEXT,
				image_variants JSONB,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create settings table
		await client`
			CREATE TABLE IF NOT EXISTS settings (
				id TEXT PRIMARY KEY NOT NULL,
				story_id TEXT NOT NULL REFERENCES stories(id),
				name VARCHAR(255) NOT NULL,
				description TEXT NOT NULL,
				atmosphere TEXT,
				image_url TEXT,
				image_variants JSONB,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create parts table
		await client`
			CREATE TABLE IF NOT EXISTS parts (
				id TEXT PRIMARY KEY NOT NULL,
				story_id TEXT NOT NULL REFERENCES stories(id),
				title VARCHAR(255) NOT NULL,
				part_number INTEGER NOT NULL,
				summary TEXT,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create chapters table
		await client`
			CREATE TABLE IF NOT EXISTS chapters (
				id TEXT PRIMARY KEY NOT NULL,
				story_id TEXT NOT NULL REFERENCES stories(id),
				part_id TEXT REFERENCES parts(id),
				title VARCHAR(255) NOT NULL,
				chapter_number INTEGER NOT NULL,
				summary TEXT,
				status chapter_status DEFAULT 'draft' NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		// Create scenes table
		await client`
			CREATE TABLE IF NOT EXISTS scenes (
				id TEXT PRIMARY KEY NOT NULL,
				chapter_id TEXT NOT NULL REFERENCES chapters(id),
				scene_number INTEGER NOT NULL,
				title VARCHAR(255),
				summary TEXT,
				content TEXT,
				image_url TEXT,
				image_variants JSONB,
				status scene_status DEFAULT 'draft' NOT NULL,
				published_at TIMESTAMP,
				view_count INTEGER DEFAULT 0 NOT NULL,
				created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
				updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
			);
		`;

		console.log("✅ Database migrations completed");
	} catch (error) {
		console.error("❌ Failed to run migrations:", error);
		throw error;
	} finally {
		await client.end();
	}
}

/**
 * Seed test data using static novel data
 *
 * Creates a complete story structure:
 * - 1 Story with full Adversity-Triumph metadata
 * - 2 Characters (protagonist, antagonist) with detailed profiles
 * - 2 Settings (castle, forest) with sensory details
 * - 1 Part
 * - 2 Chapters with character arcs
 * - 6 Scenes (3 per chapter) with full content and images
 */
export async function seedTestData(dbUrl: string): Promise<void> {
	console.log("🌱 Seeding test data using static novel data...");

	const client = postgres(dbUrl);
	const testData = getAllTestData();

	try {
		// Get writer user ID from database (created by setup-auth-users.ts)
		const writerUsers = await client`
			SELECT id FROM users WHERE email = 'writer@fictures.xyz' LIMIT 1
		`;

		if (writerUsers.length === 0) {
			throw new Error("Writer user not found in database. Ensure setup-auth-users.ts ran successfully.");
		}

		const writerUserId = writerUsers[0].id as string;
		console.log(`  ✓ Found writer user: ${writerUserId}`);

		// 1. Insert story
		const story = testData.story;
		await client`
			INSERT INTO stories (
				id, author_id, title, summary, genre, tone, moral_framework, status,
				image_url, image_variants, view_count, rating, rating_count,
				created_at, updated_at
			)
			VALUES (
				${story.id},
				${writerUserId},
				${story.title},
				${story.summary},
				${story.genre},
				${story.tone},
				${story.moralFramework},
				${story.status},
				${story.imageUrl},
				${JSON.stringify(story.imageVariants)},
				${story.viewCount},
				${story.rating},
				${story.ratingCount},
				${story.createdAt},
				${story.updatedAt}
			)
			ON CONFLICT (id) DO NOTHING
		`;
		console.log(`  ✓ Story: ${story.title}`);

		// 2. Insert characters
		for (const character of testData.characters) {
			await client`
				INSERT INTO characters (
					id, story_id, name, role, description, internal_flaw, arc_trajectory,
					image_url, image_variants, created_at, updated_at
				)
				VALUES (
					${character.id},
					${character.storyId},
					${character.name},
					${character.role},
					${character.summary},
					${character.internalFlaw},
					${character.externalGoal},
					${character.imageUrl},
					${JSON.stringify(character.imageVariants)},
					${character.createdAt},
					${character.updatedAt}
				)
				ON CONFLICT (id) DO NOTHING
			`;
			console.log(`  ✓ Character: ${character.name}`);
		}

		// 3. Insert settings
		for (const setting of testData.settings) {
			await client`
				INSERT INTO settings (
					id, story_id, name, description, atmosphere,
					image_url, image_variants, created_at, updated_at
				)
				VALUES (
					${setting.id},
					${setting.storyId},
					${setting.name},
					${setting.summary},
					${setting.mood},
					${setting.imageUrl},
					${JSON.stringify(setting.imageVariants)},
					${setting.createdAt},
					${setting.updatedAt}
				)
				ON CONFLICT (id) DO NOTHING
			`;
			console.log(`  ✓ Setting: ${setting.name}`);
		}

		// 4. Insert part
		const part = testData.part;
		await client`
			INSERT INTO parts (
				id, story_id, title, part_number, summary, created_at, updated_at
			)
			VALUES (
				${part.id},
				${part.storyId},
				${part.title},
				${part.orderIndex + 1},
				${part.summary},
				${part.createdAt},
				${part.updatedAt}
			)
			ON CONFLICT (id) DO NOTHING
		`;
		console.log(`  ✓ Part: ${part.title}`);

		// 5. Insert chapters
		for (const chapter of testData.chapters) {
			await client`
				INSERT INTO chapters (
					id, story_id, part_id, title, chapter_number, summary, status,
					created_at, updated_at
				)
				VALUES (
					${chapter.id},
					${chapter.storyId},
					${chapter.partId},
					${chapter.title},
					${chapter.orderIndex + 1},
					${chapter.summary},
					'published',
					${chapter.createdAt},
					${chapter.updatedAt}
				)
				ON CONFLICT (id) DO NOTHING
			`;
			console.log(`  ✓ Chapter: ${chapter.title}`);
		}

		// 6. Insert scenes
		for (const scene of testData.scenes) {
			await client`
				INSERT INTO scenes (
					id, chapter_id, scene_number, title, summary, content,
					image_url, image_variants, status, published_at,
					view_count, created_at, updated_at
				)
				VALUES (
					${scene.id},
					${scene.chapterId},
					${scene.orderIndex + 1},
					${scene.title},
					${scene.summary},
					${scene.content},
					${scene.imageUrl},
					${JSON.stringify(scene.imageVariants)},
					${scene.novelStatus},
					${scene.publishedAt},
					${scene.viewCount},
					${scene.createdAt},
					${scene.updatedAt}
				)
				ON CONFLICT (id) DO NOTHING
			`;
			console.log(`  ✓ Scene: ${scene.title}`);
		}

		console.log("✅ Test data seeded successfully");
		console.log(`   Story ID: ${TEST_IDS.story}`);
		console.log(`   Characters: ${testData.characters.length}`);
		console.log(`   Settings: ${testData.settings.length}`);
		console.log(`   Chapters: ${testData.chapters.length}`);
		console.log(`   Scenes: ${testData.scenes.length}`);
	} catch (error) {
		console.error("❌ Error seeding test data:", error);
		throw error;
	} finally {
		await client.end();
	}
}

/**
 * Get container connection string
 */
export function getConnectionString(): string | null {
	return connectionString;
}

/**
 * Clean up test data using TEST_IDS from static-novel-data
 */
export async function cleanupTestData(dbUrl: string): Promise<void> {
	console.log("🧹 Cleaning up test data...");

	const client = postgres(dbUrl);

	try {
		// Delete in reverse order to respect foreign key constraints
		// 1. Delete scenes
		const sceneIds = Object.values(TEST_IDS.scenes);
		await client`DELETE FROM scenes WHERE id = ANY(${sceneIds})`;
		console.log(`  ✓ Deleted ${sceneIds.length} scenes`);

		// 2. Delete chapters
		const chapterIds = Object.values(TEST_IDS.chapters);
		await client`DELETE FROM chapters WHERE id = ANY(${chapterIds})`;
		console.log(`  ✓ Deleted ${chapterIds.length} chapters`);

		// 3. Delete part
		await client`DELETE FROM parts WHERE id = ${TEST_IDS.part}`;
		console.log("  ✓ Deleted 1 part");

		// 4. Delete characters
		const characterIds = Object.values(TEST_IDS.characters);
		await client`DELETE FROM characters WHERE id = ANY(${characterIds})`;
		console.log(`  ✓ Deleted ${characterIds.length} characters`);

		// 5. Delete settings
		const settingIds = Object.values(TEST_IDS.settings);
		await client`DELETE FROM settings WHERE id = ANY(${settingIds})`;
		console.log(`  ✓ Deleted ${settingIds.length} settings`);

		// 6. Delete story
		await client`DELETE FROM stories WHERE id = ${TEST_IDS.story}`;
		console.log("  ✓ Deleted 1 story");

		console.log("✅ Test data cleaned up");
	} catch (error) {
		console.error("❌ Error cleaning up test data:", error);
		throw error;
	} finally {
		await client.end();
	}
}
