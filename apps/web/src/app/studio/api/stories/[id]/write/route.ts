import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import * as yaml from "js-yaml";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    createInvalidationContext,
    getCacheInvalidationHeaders,
    invalidateEntityCache,
} from "@/lib/cache/unified-invalidation";
import { db } from "@/lib/db";
import { getStoryWithStructure } from "@/lib/db/queries";
import { characters, settings, stories } from "@/lib/db/schema";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        // Get story with full structure (parts, chapters, scenes)
        const storyWithStructure = await getStoryWithStructure(id, true);

        if (!storyWithStructure) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Get characters for this story
        const rawCharacters = await db.query.characters.findMany({
            where: eq(characters.storyId, id),
        });

        // Parse character content data
        const storyCharacters = rawCharacters.map((character) => {
            let parsedContent: Record<string, any> = {};
            if ((character as any).content) {
                try {
                    if (typeof (character as any).content === "string") {
                        // Try to parse as JSON first
                        try {
                            parsedContent = JSON.parse(
                                (character as any).content,
                            );
                        } catch (jsonError) {
                            // If JSON parsing fails, try YAML parsing
                            // First convert \n literal strings to actual newlines
                            const cleanedContent = (
                                character as any
                            ).content.replace(/\\n/g, "\n");
                            parsedContent =
                                (yaml.load(cleanedContent) as Record<
                                    string,
                                    any
                                >) || {};
                        }
                    } else if (typeof (character as any).content === "object") {
                        parsedContent = (character as any).content;
                    }
                } catch (error) {
                    console.error(
                        `Failed to parse character content for ${character.name}:`,
                        error,
                    );
                    // Fallback: try to extract basic info from the raw string
                    if (typeof (character as any).content === "string") {
                        const nameMatch = (character as any).content.match(
                            /name:\s*["']?([^"'\n]+)["']?/,
                        );
                        const roleMatch = (character as any).content.match(
                            /role:\s*["']?([^"'\n]+)["']?/,
                        );
                        const descMatch = (character as any).content.match(
                            /summary:\s*["']?([^"'\n]+)["']?/,
                        );

                        parsedContent = {
                            name: nameMatch ? nameMatch[1] : character.name,
                            role: roleMatch ? roleMatch[1] : null,
                            summary: descMatch ? descMatch[1] : null,
                        };
                    }
                }
            }

            return {
                ...character,
                // Merge parsed content fields with character record
                role: parsedContent.role || null,
                summary: parsedContent.description || null,
                personality: parsedContent.personality || null,
                background: parsedContent.background || null,
                appearance: parsedContent.appearance || null,
                motivations: parsedContent.motivations || null,
                flaws: parsedContent.flaws || null,
                strengths: parsedContent.strengths || null,
                relationships: parsedContent.relationships || null,
                arc: parsedContent.arc || null,
                dialogue_style: parsedContent.dialogue_style || null,
                secrets: parsedContent.secrets || null,
                goals: parsedContent.goals || null,
                conflicts: parsedContent.conflicts || null,
                // Use the imageUrl from the database record, not parsed content
                imageUrl: character.imageUrl || parsedContent.imageUrl || null,
            };
        });

        // Get places for this story
        const storySettings = await db.query.settings.findMany({
            where: eq(settings.storyId, id),
        });

        // Only story owners can edit
        if (storyWithStructure.userId !== session?.user?.id) {
            return NextResponse.json(
                {
                    error: "Access denied - you are not the owner of this story",
                },
                { status: 403 },
            );
        }

        const isOwner = storyWithStructure.userId === session?.user?.id;

        // Calculate all chapters and scenes for writing context
        const allChapters = [
            ...storyWithStructure.parts.flatMap((part) => part.chapters),
            ...storyWithStructure.chapters,
        ];

        const allScenes = allChapters.flatMap(
            (chapter) => chapter.scenes || [],
        );

        // Parse HNS data (Hierarchical Narrative Schema) - the primary story structure data
        let parsedHnsData = null;
        const parsedStoryData = null;

        // Use hnsData as the primary source (it follows the HNS schema)
        if ((storyWithStructure as any).hnsData) {
            try {
                // Handle case where hnsData might already be an object
                if (typeof (storyWithStructure as any).hnsData === "object") {
                    parsedHnsData = (storyWithStructure as any).hnsData;
                } else if (
                    typeof (storyWithStructure as any).hnsData === "string"
                ) {
                    parsedHnsData = JSON.parse(
                        (storyWithStructure as any).hnsData,
                    );
                }
            } catch (error) {
                console.error("Failed to parse story hnsData JSON:", error);
                // Keep parsedHnsData as null if parsing fails
            }
        }

        // storyData field has been removed - using hnsData only

        // Parse HNS data for parts, chapters, and scenes
        // Note: getStoryWithStructure doesn't return hnsData, so we set to null
        const partsWithHnsData = storyWithStructure.parts.map((part) => {
            const partHnsData = null;

            const chaptersWithHnsData = part.chapters.map((chapter) => {
                const chapterHnsData = null;

                const scenesWithHnsData = (chapter.scenes || []).map(
                    (scene) => {
                        const sceneHnsData = null;
                        // scene.hnsData not available in getStoryWithStructure query result
                        return { ...scene, hnsData: sceneHnsData };
                    },
                );

                return {
                    ...chapter,
                    hnsData: chapterHnsData,
                    scenes: scenesWithHnsData,
                };
            });

            return {
                ...part,
                hnsData: partHnsData,
                chapters: chaptersWithHnsData,
            };
        });

        // Handle standalone chapters
        const chaptersWithHnsData = storyWithStructure.chapters.map(
            (chapter) => {
                const chapterHnsData = null;
                // hnsData not available in getStoryWithStructure query result

                const scenesWithHnsData = (chapter.scenes || []).map(
                    (scene) => {
                        const sceneHnsData = null;
                        // hnsData not available in getStoryWithStructure query result
                        return { ...scene, hnsData: sceneHnsData };
                    },
                );

                return {
                    ...chapter,
                    hnsData: chapterHnsData,
                    scenes: scenesWithHnsData,
                };
            },
        );

        // Return story data optimized for writing with additional metadata
        const response = {
            story: {
                ...storyWithStructure,
                hnsData: parsedHnsData, // HNS-formatted data
                parts: partsWithHnsData,
                chapters: chaptersWithHnsData,
            },
            characters: storyCharacters,
            places: storySettings,
            isOwner,
            metadata: {
                fetchedAt: new Date().toISOString(),
                totalChapters: allChapters.length,
                totalScenes: allScenes.length,
                lastModified: new Date().toISOString(),
                writingContext: {
                    draftsCount: allChapters.filter(
                        (ch) => ch.status === "writing",
                    ).length,
                    completedChapters: allChapters.filter(
                        (ch) => ch.status === "published",
                    ).length,
                    averageChapterLength: 0,
                },
            },
        };

        // Generate ETag based on story, chapters, and scenes
        const contentForHash = JSON.stringify({
            storyId: storyWithStructure.id,
            chaptersData: allChapters.map((ch) => ({
                id: ch.id,
                status: ch.status,
            })),
            scenesData: allScenes.map((sc) => ({
                id: sc.id,
                status: sc.status,
            })),
            writingMetrics: response.metadata.writingContext,
        });
        const etag = createHash("md5").update(contentForHash).digest("hex");

        // Check if client has the same version
        const clientETag = request.headers.get("if-none-match");
        if (clientETag === etag) {
            return new NextResponse(null, { status: 304 });
        }

        // Set cache headers optimized for writing (shorter cache for active editing)
        const headers = new Headers({
            "Content-Type": "application/json",
            ETag: etag,
            // Shorter cache for writing mode to ensure fresh data during active editing
            "Cache-Control": "private, max-age=300, stale-while-revalidate=600", // 5min cache, 10min stale
            "X-Writing-Mode": "true",
            "X-Last-Modified": response.metadata.lastModified,
        });

        return new NextResponse(JSON.stringify(response), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Error fetching story for writing:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 },
            );
        }

        const { hnsData } = await request.json();

        if (!hnsData) {
            return NextResponse.json(
                { error: "Story data is required (hnsData)" },
                { status: 400 },
            );
        }

        // First, get the story to check ownership
        const existingStory = await db.query.stories.findFirst({
            where: eq(stories.id, id),
        });

        if (!existingStory) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        // Check if user owns the story
        if (existingStory.authorId !== session?.user?.id) {
            return NextResponse.json(
                {
                    error: "Access denied - you are not the owner of this story",
                },
                { status: 403 },
            );
        }

        console.log(
            "📦 Saving HNS data for database:",
            JSON.stringify(hnsData).substring(0, 200) + "...",
        );

        // Update the story with the new HNS data
        // Note: Drizzle ORM automatically handles JSON serialization
        await db
            .update(stories)
            .set({
                ...(hnsData ? ({ hnsData } as any) : {}),
                updatedAt: new Date().toISOString(),
            })
            .where(eq(stories.id, id));

        // ✅ CACHE INVALIDATION: Invalidate all cache layers
        const invalidationContext = createInvalidationContext({
            entityType: "story",
            entityId: id,
            userId: session.user.id,
        });

        // Invalidate server-side caches (Redis)
        await invalidateEntityCache(invalidationContext);

        // Return with headers for client-side cache invalidation
        return NextResponse.json(
            {
                success: true,
                message: "Story data saved successfully",
                updatedAt: new Date().toISOString(),
            },
            {
                headers: getCacheInvalidationHeaders(invalidationContext),
            },
        );
    } catch (error) {
        console.error("Error saving story data:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
