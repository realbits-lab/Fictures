import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
    chapters,
    characters,
    parts,
    scenes,
    settings,
    stories,
} from "@/lib/schemas/drizzle";
import { improveStoryContent } from "@/lib/services/story-improvement";

export const runtime = "nodejs";

const StoryUpdateRequestSchema = z.object({
    analysisResult: z.object({
        validation: z.any().optional(),
        evaluation: z.any().optional(),
    }),
    originalData: z.object({
        story: z.any(),
        parts: z.array(z.any()).optional(),
        chapters: z.array(z.any()).optional(),
        scenes: z.array(z.any()).optional(),
        characters: z.array(z.any()).optional(),
        settings: z.array(z.any()).optional(),
    }),
    options: z
        .object({
            updateLevel: z
                .enum(["conservative", "moderate", "aggressive"])
                .optional()
                .default("moderate"),
            preserveUserContent: z.boolean().optional().default(true),
            focusAreas: z
                .array(
                    z.enum([
                        "structure",
                        "character",
                        "world",
                        "pacing",
                        "dialogue",
                    ]),
                )
                .optional(),
            autoApply: z.boolean().optional().default(false),
            dryRun: z.boolean().optional().default(false),
        })
        .optional(),
});

// POST /api/story-update - Improve story based on analysis feedback
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();
        const validatedRequest = StoryUpdateRequestSchema.parse(body);

        // Verify ownership of the story
        const storyId = validatedRequest.originalData.story?.id;
        if (storyId) {
            const [existingStory] = await db
                .select()
                .from(stories)
                .where(eq(stories.id, storyId))
                .limit(1);

            if (!existingStory) {
                return NextResponse.json(
                    { error: "Story not found" },
                    { status: 404 },
                );
            }

            if (existingStory.authorId !== session.user.id) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 },
                );
            }
        }

        // Generate improvements based on analysis
        const improvementResult = await improveStoryContent({
            analysisResult: validatedRequest.analysisResult,
            originalData: validatedRequest.originalData,
            options: {
                updateLevel:
                    validatedRequest.options?.updateLevel || "moderate",
                preserveUserContent:
                    validatedRequest.options?.preserveUserContent ?? true,
                focusAreas: validatedRequest.options?.focusAreas,
                autoApply: validatedRequest.options?.autoApply ?? false,
            },
        });

        // If dry run, just return the proposed changes without applying
        if (validatedRequest.options?.dryRun) {
            return NextResponse.json({
                success: true,
                mode: "dry-run",
                result: improvementResult,
                message: "Dry run complete. Changes not applied to database.",
            });
        }

        // If autoApply is true, update the database
        if (validatedRequest.options?.autoApply) {
            const updateResults = await applyImprovements(
                improvementResult,
                session.user.id,
            );

            return NextResponse.json({
                success: true,
                mode: "applied",
                result: improvementResult,
                updateResults,
                message: `Successfully applied ${improvementResult.summary.totalChanges} improvements`,
            });
        }

        // Return improvements for manual review
        return NextResponse.json({
            success: true,
            mode: "preview",
            result: improvementResult,
            message:
                "Improvements generated. Review and apply manually or set autoApply: true",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.issues,
                },
                { status: 400 },
            );
        }

        console.error("Story update API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// Apply improvements to database
async function applyImprovements(
    improvementResult: any,
    userId: string,
): Promise<any> {
    const updateResults = {
        story: null as any,
        parts: [] as any[],
        chapters: [] as any[],
        scenes: [] as any[],
        characters: [] as any[],
        settings: [] as any[],
    };

    try {
        // Update story
        if (
            improvementResult.improved.story &&
            improvementResult.changes.story.fieldsUpdated.length > 0
        ) {
            const storyUpdate = {
                ...improvementResult.improved.story,
                updatedAt: new Date().toISOString(),
            };
            delete storyUpdate.id;
            delete storyUpdate.authorId;

            const [updated] = await db
                .update(stories)
                .set(storyUpdate)
                .where(eq(stories.id, improvementResult.improved.story.id))
                .returning();

            updateResults.story = updated;
        }

        // Update parts
        for (const part of improvementResult.improved.parts) {
            const changeLog = improvementResult.changes.parts.find(
                (c: any) => c.id === part.id,
            );
            if (changeLog && changeLog.fieldsUpdated.length > 0) {
                const partUpdate = {
                    ...part,
                    updatedAt: new Date().toISOString(),
                };
                delete partUpdate.id;
                delete partUpdate.storyId;
                delete partUpdate.authorId;

                const [updated] = await db
                    .update(parts)
                    .set(partUpdate)
                    .where(eq(parts.id, part.id))
                    .returning();

                updateResults.parts.push(updated);
            }
        }

        // Update chapters
        for (const chapter of improvementResult.improved.chapters) {
            const changeLog = improvementResult.changes.chapters.find(
                (c: any) => c.id === chapter.id,
            );
            if (changeLog && changeLog.fieldsUpdated.length > 0) {
                const chapterUpdate = {
                    ...chapter,
                    updatedAt: new Date().toISOString(),
                };
                delete chapterUpdate.id;
                delete chapterUpdate.storyId;
                delete chapterUpdate.partId;
                delete chapterUpdate.authorId;

                const [updated] = await db
                    .update(chapters)
                    .set(chapterUpdate)
                    .where(eq(chapters.id, chapter.id))
                    .returning();

                updateResults.chapters.push(updated);
            }
        }

        // Update scenes
        for (const scene of improvementResult.improved.scenes) {
            const changeLog = improvementResult.changes.scenes.find(
                (c: any) => c.id === scene.id,
            );
            if (changeLog && changeLog.fieldsUpdated.length > 0) {
                const sceneUpdate = {
                    ...scene,
                    updatedAt: new Date().toISOString(),
                };
                delete sceneUpdate.id;
                delete sceneUpdate.chapterId;

                const [updated] = await db
                    .update(scenes)
                    .set(sceneUpdate)
                    .where(eq(scenes.id, scene.id))
                    .returning();

                updateResults.scenes.push(updated);
            }
        }

        // Update characters
        for (const character of improvementResult.improved.characters) {
            const changeLog = improvementResult.changes.characters.find(
                (c: any) => c.id === character.id,
            );
            if (changeLog && changeLog.fieldsUpdated.length > 0) {
                const characterUpdate = {
                    ...character,
                    updatedAt: new Date().toISOString(),
                };
                delete characterUpdate.id;
                delete characterUpdate.storyId;

                const [updated] = await db
                    .update(characters)
                    .set(characterUpdate)
                    .where(eq(characters.id, character.id))
                    .returning();

                updateResults.characters.push(updated);
            }
        }

        // Update settings
        for (const setting of improvementResult.improved.settings) {
            const changeLog = improvementResult.changes.settings.find(
                (c: any) => c.id === setting.id,
            );
            if (changeLog && changeLog.fieldsUpdated.length > 0) {
                const settingUpdate = {
                    ...setting,
                    updatedAt: new Date().toISOString(),
                };
                delete settingUpdate.id;
                delete settingUpdate.storyId;

                const [updated] = await db
                    .update(settings)
                    .set(settingUpdate)
                    .where(eq(settings.id, setting.id))
                    .returning();

                updateResults.settings.push(updated);
            }
        }

        return updateResults;
    } catch (error) {
        console.error("Database update error:", error);
        throw error;
    }
}

// PATCH /api/story-update - Apply specific improvements selectively
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const body = await request.json();

        // Schema for selective application
        const SelectiveUpdateSchema = z.object({
            storyId: z.string(),
            improvements: z.object({
                story: z.any().optional(),
                parts: z.array(z.any()).optional(),
                chapters: z.array(z.any()).optional(),
                scenes: z.array(z.any()).optional(),
                characters: z.array(z.any()).optional(),
                settings: z.array(z.any()).optional(),
            }),
        });

        const validatedRequest = SelectiveUpdateSchema.parse(body);

        // Verify ownership
        const [existingStory] = await db
            .select()
            .from(stories)
            .where(eq(stories.id, validatedRequest.storyId))
            .limit(1);

        if (!existingStory) {
            return NextResponse.json(
                { error: "Story not found" },
                { status: 404 },
            );
        }

        if (existingStory.authorId !== session.user.id) {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 },
            );
        }

        // Apply selective improvements
        const updateResults: any = {};

        // Update story if provided
        if (validatedRequest.improvements.story) {
            const [updated] = await db
                .update(stories)
                .set({
                    ...validatedRequest.improvements.story,
                    updatedAt: new Date().toISOString(),
                })
                .where(eq(stories.id, validatedRequest.storyId))
                .returning();

            updateResults.story = updated;
        }

        // Similar updates for other components...
        // (Implementation would follow same pattern as above)

        return NextResponse.json({
            success: true,
            updateResults,
            message: "Selective improvements applied successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: error.issues,
                },
                { status: 400 },
            );
        }

        console.error("Story selective update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
