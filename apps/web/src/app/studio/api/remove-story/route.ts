/**
 * Remove Story API
 *
 * Removes a single story and all related data from both database and Vercel Blob storage.
 * This is a destructive operation that:
 * 1. Deletes story and all related database records (parts, chapters, scenes, characters, settings)
 * 2. Deletes all blob files under the "stories/{storyId}/" prefix
 *
 * Security:
 * - Requires stories:write or admin:all scope
 * - If stories:write: Verifies user owns the story (authorId matches)
 * - If admin:all: Can delete any story
 * - Requires explicit --confirm flag in request
 * - Returns detailed report of deletion counts
 */

import { del, list } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import {
	chapters,
	characters,
	comicPanels,
	parts,
	scenes,
	sceneViews,
	settings,
	stories,
} from "@/lib/db/schema";
import { getEnvironmentPrefix } from "@/lib/utils/blob-path";

export const maxDuration = 60; // Allow up to 60 seconds for complete cleanup

export async function POST(request: NextRequest) {
	console.log("\n🗑️ [REMOVE STORY] Starting story removal...\n");

	try {
		// 1. Authentication check
		const authResult = await authenticateRequest(request);
		if (!authResult) {
			console.log("❌ [REMOVE STORY] Authentication failed");
			return new Response("Authentication required", { status: 401 });
		}

		// 2. Permission check (stories:write or admin:all)
		const hasWriteScope = hasRequiredScope(authResult, "stories:write");
		const hasAdminScope = hasRequiredScope(authResult, "admin:all");

		if (!hasWriteScope && !hasAdminScope) {
			console.log(
				`❌ [REMOVE STORY] Insufficient permissions for user: ${authResult.user.email}`,
			);
			return Response.json(
				{
					error: "Insufficient permissions",
					required: "stories:write or admin:all scope",
					message: "You need writer or manager permissions to remove stories",
				},
				{ status: 403 },
			);
		}

		console.log(
			`✅ [REMOVE STORY] Authenticated as: ${authResult.user.email} (${authResult.type})`,
		);

		// 3. Parse request body
		const body = await request.json();
		const { storyId, confirm } = body;

		if (!storyId) {
			console.log("❌ [REMOVE STORY] Missing story ID");
			return Response.json(
				{
					error: "Story ID required",
					message: "Must provide storyId in request body",
				},
				{ status: 400 },
			);
		}

		// 4. Confirmation check
		if (!confirm) {
			console.log("⚠️  [REMOVE STORY] Missing confirmation flag");
			return Response.json(
				{
					error: "Confirmation required",
					message: 'Must send { "confirm": true } to proceed with removal',
					warning: `This will permanently delete story "${storyId}" and all related data`,
				},
				{ status: 400 },
			);
		}

		console.log(`📖 [REMOVE STORY] Story ID: ${storyId}`);
		console.log(
			"⚠️  [REMOVE STORY] Confirmation received - proceeding with DESTRUCTIVE removal\n",
		);

		// 5. Fetch story to verify existence and ownership
		const story = await db.query.stories.findFirst({
			where: eq(stories.id, storyId),
			columns: {
				id: true,
				title: true,
				authorId: true,
			},
		});

		if (!story) {
			console.log(`❌ [REMOVE STORY] Story not found: ${storyId}`);
			return Response.json(
				{
					error: "Story not found",
					message: `Story with ID "${storyId}" does not exist`,
				},
				{ status: 404 },
			);
		}

		console.log(
			`📖 [REMOVE STORY] Found story: "${story.title}" (ID: ${story.id})`,
		);

		// 6. Ownership check (only if not admin)
		if (!hasAdminScope) {
			if (story.authorId !== authResult.user.id) {
				console.log(`❌ [REMOVE STORY] Ownership check failed`);
				console.log(`   Story author: ${story.authorId}`);
				console.log(`   Current user: ${authResult.user.id}`);
				return Response.json(
					{
						error: "Forbidden",
						message: "You can only remove your own stories",
						details: "Story does not belong to you",
					},
					{ status: 403 },
				);
			}
			console.log("✅ [REMOVE STORY] Ownership verified");
		} else {
			console.log("✅ [REMOVE STORY] Admin access - ownership check bypassed");
		}

		// Track deletion counts
		const deletionReport = {
			story: {
				id: story.id,
				title: story.title,
			},
			database: {
				sceneViews: 0,
				comicPanels: 0,
				scenes: 0,
				chapters: 0,
				parts: 0,
				characters: 0,
				settings: 0,
			},
			blob: {
				files: 0,
				batches: 0,
			},
		};

		// 7. Delete all database records (cascading order)
		console.log("📊 [REMOVE STORY] Deleting database records...");

		// Get counts before deletion
		const sceneViewsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(sceneViews)
			.where(
				sql`${sceneViews.sceneId} IN (SELECT id FROM ${scenes} WHERE ${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId}))`,
			);

		const comicPanelsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(comicPanels)
			.where(
				sql`${comicPanels.sceneId} IN (SELECT id FROM ${scenes} WHERE ${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId}))`,
			);

		const scenesCount = await db
			.select({ count: sql`count(*)::int` })
			.from(scenes)
			.where(
				sql`${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId})`,
			);

		const chaptersCount = await db
			.select({ count: sql`count(*)::int` })
			.from(chapters)
			.where(eq(chapters.storyId, storyId));

		const partsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(parts)
			.where(eq(parts.storyId, storyId));

		const charactersCount = await db
			.select({ count: sql`count(*)::int` })
			.from(characters)
			.where(eq(characters.storyId, storyId));

		const settingsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(settings)
			.where(eq(settings.storyId, storyId));

		// Delete scene views (depends on scenes)
		await db
			.delete(sceneViews)
			.where(
				sql`${sceneViews.sceneId} IN (SELECT id FROM ${scenes} WHERE ${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId}))`,
			);
		deletionReport.database.sceneViews = Number(sceneViewsCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.sceneViews} scene views`,
		);

		// Delete comic panels (depends on scenes)
		await db
			.delete(comicPanels)
			.where(
				sql`${comicPanels.sceneId} IN (SELECT id FROM ${scenes} WHERE ${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId}))`,
			);
		deletionReport.database.comicPanels =
			Number(comicPanelsCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.comicPanels} comic panels`,
		);

		// Delete scenes (depends on chapters)
		await db
			.delete(scenes)
			.where(
				sql`${scenes.chapterId} IN (SELECT id FROM ${chapters} WHERE ${chapters.storyId} = ${storyId})`,
			);
		deletionReport.database.scenes = Number(scenesCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.scenes} scenes`);

		// Delete chapters (depends on story)
		await db.delete(chapters).where(eq(chapters.storyId, storyId));
		deletionReport.database.chapters = Number(chaptersCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.chapters} chapters`);

		// Delete parts (depends on story)
		await db.delete(parts).where(eq(parts.storyId, storyId));
		deletionReport.database.parts = Number(partsCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.parts} parts`);

		// Delete characters (depends on story)
		await db.delete(characters).where(eq(characters.storyId, storyId));
		deletionReport.database.characters = Number(charactersCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.characters} characters`,
		);

		// Delete settings (depends on story)
		await db.delete(settings).where(eq(settings.storyId, storyId));
		deletionReport.database.settings = Number(settingsCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.settings} settings`);

		// Delete story (parent table)
		await db.delete(stories).where(eq(stories.id, storyId));
		console.log(`   ✓ Deleted story: ${story.title}`);

		console.log("\n✅ [REMOVE STORY] Database cleanup complete\n");

		// 8. Delete all Vercel Blob files under "stories/{storyId}/" prefix
		console.log("📦 [REMOVE STORY] Deleting Vercel Blob files...");

		let blobCursor: string | undefined;
		let totalBlobFiles = 0;
		let batchCount = 0;

		do {
			// List files with pagination (use environment prefix)
			const envPrefix = getEnvironmentPrefix();
			const listResult = await list({
				prefix: `${envPrefix}stories/${storyId}/`,
				cursor: blobCursor,
				limit: 100, // Process 100 files per batch
			});

			const urls = listResult.blobs.map((blob) => blob.url);

			if (urls.length > 0) {
				batchCount++;
				console.log(`   Batch ${batchCount}: Deleting ${urls.length} files...`);

				// Delete batch of files
				await del(urls);
				totalBlobFiles += urls.length;
			}

			blobCursor = listResult.cursor;
		} while (blobCursor);

		deletionReport.blob.files = totalBlobFiles;
		deletionReport.blob.batches = batchCount;

		console.log(
			`\n✅ [REMOVE STORY] Blob cleanup complete: ${totalBlobFiles} files in ${batchCount} batches\n`,
		);

		// 9. Return success report
		console.log("✅ [REMOVE STORY] COMPLETE - Story has been removed\n");
		console.log("📊 Deletion Report:", JSON.stringify(deletionReport, null, 2));

		return Response.json({
			success: true,
			message: `Story "${story.title}" has been permanently deleted`,
			report: deletionReport,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("\n❌ [REMOVE STORY] Error during removal:", error);
		return Response.json(
			{
				success: false,
				error: "Removal operation failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
