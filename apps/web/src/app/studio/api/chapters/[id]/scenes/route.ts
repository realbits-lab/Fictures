import { createHash } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	getChapterById,
	getChapterScenes,
	getStoryById,
} from "@/lib/db/cached-queries";
import { getChapterScenesForReading } from "@/lib/db/reading-queries";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const apiStartTime = performance.now();
	const requestId = Math.random().toString(36).substring(7);

	try {
		const { id: chapterId } = await params;
		console.log(
			`[${requestId}] 🚀 API Request START for chapter: ${chapterId}`,
		);

		// 1. Authentication
		const authStartTime = performance.now();
		const session = await auth();
		const authDuration = performance.now() - authStartTime;
		console.log(
			`[${requestId}] 🔐 Auth completed: ${authDuration.toFixed(2)}ms`,
		);

		// 2. Get chapter using cached query
		const chapterQueryStartTime = performance.now();
		const chapter: any = await getChapterById(chapterId, session?.user?.id);
		const chapterQueryDuration = performance.now() - chapterQueryStartTime;
		console.log(
			`[${requestId}] 📖 Chapter query completed: ${chapterQueryDuration.toFixed(2)}ms (${chapter ? "cached" : "not found"})`,
		);

		if (!chapter) {
			console.log(`[${requestId}] ❌ Chapter not found`);
			return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
		}

		// 3. Get story using cached query
		const storyQueryStartTime = performance.now();
		const story: any = await getStoryById(chapter.storyId, session?.user?.id);
		const storyQueryDuration = performance.now() - storyQueryStartTime;
		console.log(
			`[${requestId}] 📚 Story query completed: ${storyQueryDuration.toFixed(2)}ms (${story ? "cached" : "not found"})`,
		);

		if (!story) {
			console.log(`[${requestId}] ❌ Story not found`);
			return NextResponse.json({ error: "Story not found" }, { status: 404 });
		}

		const isOwner = story.authorId === session?.user?.id;
		const isPublishedStory = story.status === "published";

		// Check permissions - allow access if:
		// 1. User is the owner, OR
		// 2. The story is published (regardless of chapter status)
		if (!isOwner && !isPublishedStory) {
			console.log(`[${requestId}] 🚫 Permission denied`);
			return NextResponse.json(
				{ error: "Chapter not available" },
				{ status: 403 },
			);
		}

		// 4. Get scenes using optimized query for reading mode (skips studio fields, keeps imageVariants)
		const scenesQueryStartTime = performance.now();
		// ⚡ Strategy 3: Use optimized reading query for published content
		const useOptimized = isPublishedStory && !isOwner;
		console.log(
			`[${requestId}] 🔍 Scenes query decision: isPublishedStory=${isPublishedStory}, isOwner=${isOwner}, useOptimized=${useOptimized}`,
		);

		let scenesWithImages: any;
		try {
			scenesWithImages = useOptimized
				? await getChapterScenesForReading(chapterId)
				: await getChapterScenes(
						chapterId,
						session?.user?.id,
						isPublishedStory,
					);
		} catch (error) {
			console.error(`[${requestId}] ❌ Scenes query error:`, error);
			throw error;
		}

		const scenesQueryDuration = performance.now() - scenesQueryStartTime;
		console.log(
			`[${requestId}] 🎬 Scenes query completed: ${scenesQueryDuration.toFixed(2)}ms (${scenesWithImages?.length ?? 0} scenes) - ${useOptimized ? "OPTIMIZED" : "FULL"}`,
		);

		// No additional processing needed - scene images already extracted in cached function

		const response = {
			scenes: scenesWithImages,
			metadata: {
				fetchedAt: new Date().toISOString(),
				chapterId,
				totalScenes: scenesWithImages.length,
			},
		};

		// 5. Generate ETag based on scene content and modification times
		const etagStartTime = performance.now();
		const contentForHash = JSON.stringify({
			scenes: scenesWithImages.map((scene: any) => ({
				id: scene.id,
				content: scene.content,
				updatedAt: scene.updatedAt,
			})),
			chapterId,
			totalScenes: scenesWithImages.length,
		});
		const etag = createHash("md5").update(contentForHash).digest("hex");
		const etagDuration = performance.now() - etagStartTime;
		console.log(
			`[${requestId}] 🏷️  ETag generation: ${etagDuration.toFixed(2)}ms`,
		);

		// Check if client has the same version
		const clientETag = request.headers.get("if-none-match");
		if (clientETag === etag) {
			const totalDuration = performance.now() - apiStartTime;
			console.log(
				`[${requestId}] ✅ 304 Not Modified - Total: ${totalDuration.toFixed(2)}ms`,
			);
			console.log(
				`[${requestId}] 📊 Breakdown: Auth=${authDuration.toFixed(0)}ms, Chapter=${chapterQueryDuration.toFixed(0)}ms, Story=${storyQueryDuration.toFixed(0)}ms, Scenes=${scenesQueryDuration.toFixed(0)}ms, ETag=${etagDuration.toFixed(0)}ms`,
			);
			return new NextResponse(null, { status: 304 });
		}

		// Set cache headers with ETag
		const headers = new Headers({
			"Content-Type": "application/json",
			ETag: etag,
			// Cache for 5 minutes for published content, no cache for drafts
			"Cache-Control":
				isPublishedStory && !isOwner
					? "public, max-age=300, stale-while-revalidate=600"
					: "no-cache, no-store, must-revalidate",
		});

		const totalDuration = performance.now() - apiStartTime;
		console.log(
			`[${requestId}] ✅ 200 OK - Total: ${totalDuration.toFixed(2)}ms`,
		);
		console.log(
			`[${requestId}] 📊 Breakdown: Auth=${authDuration.toFixed(0)}ms, Chapter=${chapterQueryDuration.toFixed(0)}ms, Story=${storyQueryDuration.toFixed(0)}ms, Scenes=${scenesQueryDuration.toFixed(0)}ms, ETag=${etagDuration.toFixed(0)}ms`,
		);

		return new NextResponse(JSON.stringify(response), {
			status: 200,
			headers,
		});
	} catch (error) {
		const totalDuration = performance.now() - apiStartTime;
		console.error(
			`[${requestId}] ❌ Error after ${totalDuration.toFixed(2)}ms:`,
			error,
		);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
