/**
 * Reset All Story Data API
 *
 * Completely removes all story data from both database and Vercel Blob storage.
 * This is a destructive operation that:
 * 1. Deletes all database records (stories, parts, chapters, scenes, characters, settings, images)
 * 2. Deletes all blob files under the "stories/" prefix
 *
 * Security:
 * - Requires admin:all scope (manager account only)
 * - Requires explicit --confirm flag in request
 * - Returns detailed report of deletion counts
 */

import { del, list } from "@vercel/blob";
import { sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { authenticateRequest, hasRequiredScope } from "@/lib/auth/dual-auth";
import { db } from "@/lib/db";
import {
	aiInteractions,
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
	console.log("\n🗑️ [RESET ALL] Starting complete story data reset...\n");

	try {
		// 1. Authentication check
		const authResult = await authenticateRequest(request);
		if (!authResult) {
			console.log("❌ [RESET ALL] Authentication failed");
			return new Response("Authentication required", { status: 401 });
		}

		// 2. Admin scope check (only manager accounts)
		if (!hasRequiredScope(authResult, "admin:all")) {
			console.log(
				`❌ [RESET ALL] Insufficient permissions for user: ${authResult.user.email}`,
			);
			return Response.json(
				{
					error: "Insufficient permissions",
					required: "admin:all scope",
					message: "Only manager accounts can reset all story data",
				},
				{ status: 403 },
			);
		}

		console.log(
			`✅ [RESET ALL] Authenticated as: ${authResult.user.email} (${authResult.type})`,
		);

		// 3. Confirmation check
		const body = await request.json();
		const { confirm } = body;

		if (!confirm) {
			console.log("⚠️  [RESET ALL] Missing confirmation flag");
			return Response.json(
				{
					error: "Confirmation required",
					message: 'Must send { "confirm": true } to proceed with reset',
					warning:
						"This will permanently delete ALL story data from database and blob storage",
				},
				{ status: 400 },
			);
		}

		console.log(
			"⚠️  [RESET ALL] Confirmation received - proceeding with DESTRUCTIVE reset\n",
		);

		// Track deletion counts
		const deletionReport = {
			database: {
				aiInteractions: 0,
				sceneViews: 0,
				comicPanels: 0,
				scenes: 0,
				chapters: 0,
				parts: 0,
				characters: 0,
				settings: 0,
				stories: 0,
			},
			blob: {
				files: 0,
				batches: 0,
			},
		};

		// 4. Delete all database records (cascading order)
		console.log("📊 [RESET ALL] Deleting database records...");

		// Get counts before deletion
		const interactionsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(aiInteractions);
		const sceneViewsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(sceneViews);
		const comicPanelsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(comicPanels);
		const scenesCount = await db
			.select({ count: sql`count(*)::int` })
			.from(scenes);
		const chaptersCount = await db
			.select({ count: sql`count(*)::int` })
			.from(chapters);
		const partsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(parts);
		const charactersCount = await db
			.select({ count: sql`count(*)::int` })
			.from(characters);
		const settingsCount = await db
			.select({ count: sql`count(*)::int` })
			.from(settings);
		const storiesCount = await db
			.select({ count: sql`count(*)::int` })
			.from(stories);

		// Delete AI interactions first (no foreign key dependencies)
		await db.delete(aiInteractions);
		deletionReport.database.aiInteractions =
			Number(interactionsCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.aiInteractions} AI interactions`,
		);

		// Delete scene views (depends on scenes)
		await db.delete(sceneViews);
		deletionReport.database.sceneViews = Number(sceneViewsCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.sceneViews} scene views`,
		);

		// Delete comic panels (depends on scenes)
		await db.delete(comicPanels);
		deletionReport.database.comicPanels =
			Number(comicPanelsCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.comicPanels} comic panels`,
		);

		// Delete scenes (depends on chapters)
		await db.delete(scenes);
		deletionReport.database.scenes = Number(scenesCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.scenes} scenes`);

		// Delete chapters (depends on parts)
		await db.delete(chapters);
		deletionReport.database.chapters = Number(chaptersCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.chapters} chapters`);

		// Delete parts (depends on stories)
		await db.delete(parts);
		deletionReport.database.parts = Number(partsCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.parts} parts`);

		// Delete characters (depends on stories)
		await db.delete(characters);
		deletionReport.database.characters = Number(charactersCount[0]?.count) || 0;
		console.log(
			`   ✓ Deleted ${deletionReport.database.characters} characters`,
		);

		// Delete settings (depends on stories)
		await db.delete(settings);
		deletionReport.database.settings = Number(settingsCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.settings} settings`);

		// Delete stories (parent table)
		await db.delete(stories);
		deletionReport.database.stories = Number(storiesCount[0]?.count) || 0;
		console.log(`   ✓ Deleted ${deletionReport.database.stories} stories`);

		console.log("\n✅ [RESET ALL] Database cleanup complete\n");

		// 5. Delete all Vercel Blob files under "stories/" prefix
		console.log("📦 [RESET ALL] Deleting Vercel Blob files...");

		let blobCursor: string | undefined;
		let totalBlobFiles = 0;
		let batchCount = 0;

		do {
			// List files with pagination (use environment prefix)
			const envPrefix = getEnvironmentPrefix();
			const listResult = await list({
				prefix: `${envPrefix}stories/`,
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
			`\n✅ [RESET ALL] Blob cleanup complete: ${totalBlobFiles} files in ${batchCount} batches\n`,
		);

		// 6. Return success report
		console.log("✅ [RESET ALL] COMPLETE - All story data has been reset\n");
		console.log("📊 Deletion Report:", JSON.stringify(deletionReport, null, 2));

		return Response.json({
			success: true,
			message: "All story data has been permanently deleted",
			report: deletionReport,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("\n❌ [RESET ALL] Error during reset:", error);
		return Response.json(
			{
				success: false,
				error: "Reset operation failed",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
