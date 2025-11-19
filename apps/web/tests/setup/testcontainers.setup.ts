/**
 * Testcontainers Setup for Playwright E2E Tests
 *
 * Provides isolated PostgreSQL database for testing using Docker containers.
 * Automatically handles container lifecycle, schema migration, and test data seeding.
 */

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/lib/schemas/database";

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
 * Run database migrations
 */
export async function runMigrations(dbUrl: string): Promise<void> {
	console.log("📦 Running database migrations...");

	const client = postgres(dbUrl);
	const db = drizzle(client, { schema });

	// Create tables using Drizzle schema
	// Note: In production, use drizzle-kit migrate
	// For testing, we create tables directly from schema

	await client`
		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			name TEXT,
			email TEXT UNIQUE NOT NULL,
			username TEXT,
			password TEXT,
			email_verified TIMESTAMP,
			image TEXT,
			role TEXT DEFAULT 'reader',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS api_keys (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			key_hash TEXT NOT NULL,
			key_prefix TEXT NOT NULL,
			name TEXT,
			scopes TEXT[] DEFAULT '{}',
			is_active BOOLEAN DEFAULT true,
			last_used_at TIMESTAMP,
			expires_at TIMESTAMP,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS stories (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			summary TEXT,
			genre TEXT,
			target_audience TEXT,
			tone_style TEXT,
			moral_premise TEXT,
			status TEXT DEFAULT 'draft',
			image_url TEXT,
			image_variants JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			published_at TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS parts (
			id TEXT PRIMARY KEY,
			story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			part_number INTEGER NOT NULL,
			summary TEXT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS chapters (
			id TEXT PRIMARY KEY,
			story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
			part_id TEXT REFERENCES parts(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			chapter_number INTEGER NOT NULL,
			summary TEXT,
			status TEXT DEFAULT 'draft',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS scenes (
			id TEXT PRIMARY KEY,
			chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
			scene_number INTEGER NOT NULL,
			title TEXT,
			summary TEXT,
			content TEXT,
			image_url TEXT,
			image_variants JSONB,
			status TEXT DEFAULT 'draft',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			published_at TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS characters (
			id TEXT PRIMARY KEY,
			story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			role TEXT,
			description TEXT,
			internal_flaw TEXT,
			arc_trajectory TEXT,
			image_url TEXT,
			image_variants JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client`
		CREATE TABLE IF NOT EXISTS settings (
			id TEXT PRIMARY KEY,
			story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			description TEXT,
			atmosphere TEXT,
			image_url TEXT,
			image_variants JSONB,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`;

	await client.end();
	console.log("✅ Database migrations completed");
}

/**
 * Seed test data
 */
export async function seedTestData(dbUrl: string): Promise<void> {
	console.log("🌱 Seeding test data...");

	const client = postgres(dbUrl);

	// Get the writer user created by setup-auth-users.ts
	const [writerUser] = await client`
		SELECT id FROM users WHERE email = 'writer@fictures.xyz' LIMIT 1
	`;

	if (!writerUser) {
		throw new Error("Writer user not found. Make sure setup-auth-users.ts ran successfully.");
	}

	const userId = writerUser.id;

	// Create test stories
	const stories = [
		{
			id: "test-story-001",
			title: "The Dragon's Quest",
			summary: "A brave knight embarks on a journey to save the kingdom.",
			genre: "fantasy",
			status: "published",
		},
		{
			id: "test-story-002",
			title: "Space Odyssey",
			summary: "An astronaut discovers a new world.",
			genre: "sci-fi",
			status: "published",
		},
		{
			id: "test-story-003",
			title: "Love in Paris",
			summary: "Two souls meet in the city of love.",
			genre: "romance",
			status: "published",
		},
	];

	for (const story of stories) {
		await client`
			INSERT INTO stories (id, user_id, title, summary, genre, status, published_at)
			VALUES (
				${story.id},
				${userId},
				${story.title},
				${story.summary},
				${story.genre},
				${story.status},
				CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO NOTHING
		`;

		// Create chapter for each story
		const chapterId = `chapter-${story.id}`;
		await client`
			INSERT INTO chapters (id, story_id, title, chapter_number, status)
			VALUES (
				${chapterId},
				${story.id},
				'Chapter 1: The Beginning',
				1,
				'published'
			)
			ON CONFLICT (id) DO NOTHING
		`;

		// Create scenes for each chapter
		for (let i = 1; i <= 3; i++) {
			const sceneId = `scene-${story.id}-${i}`;
			await client`
				INSERT INTO scenes (id, chapter_id, scene_number, title, content, status, published_at)
				VALUES (
					${sceneId},
					${chapterId},
					${i},
					${"Scene " + i},
					${"This is the content for scene " + i + ". It contains multiple paragraphs of text to simulate real story content.\n\nThe protagonist faces a new challenge in this scene. They must overcome obstacles and grow as a character.\n\nThe scene ends with a moment of tension that propels the story forward."},
					'published',
					CURRENT_TIMESTAMP
				)
				ON CONFLICT (id) DO NOTHING
			`;
		}
	}

	await client.end();
	console.log("✅ Test data seeded successfully");
}

/**
 * Get container connection string
 */
export function getConnectionString(): string | null {
	return connectionString;
}

/**
 * Clean up test data
 */
export async function cleanupTestData(dbUrl: string): Promise<void> {
	console.log("🧹 Cleaning up test data...");

	const client = postgres(dbUrl);

	await client`DELETE FROM scenes WHERE id LIKE 'test-%' OR id LIKE 'scene-test-%'`;
	await client`DELETE FROM chapters WHERE id LIKE 'test-%' OR id LIKE 'chapter-test-%'`;
	await client`DELETE FROM characters WHERE id LIKE 'test-%'`;
	await client`DELETE FROM settings WHERE id LIKE 'test-%'`;
	await client`DELETE FROM parts WHERE id LIKE 'test-%'`;
	await client`DELETE FROM stories WHERE id LIKE 'test-%'`;
	await client`DELETE FROM api_keys WHERE id LIKE 'test-%'`;
	await client`DELETE FROM users WHERE id LIKE 'test-%'`;

	await client.end();
	console.log("✅ Test data cleaned up");
}
