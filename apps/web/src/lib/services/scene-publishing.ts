import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/schemas/database";

interface PublishSceneParams {
    sceneId: string;
    publishedBy: string;
    visibility?: "private" | "unlisted" | "public";
    scheduledFor?: Date;
    validateContent?: boolean;
}

export async function publishScene(params: PublishSceneParams): Promise<void> {
    const {
        sceneId,
        publishedBy,
        visibility = "public",
        scheduledFor,
        validateContent = true,
    } = params;

    // Get scene with chapter and story
    const [sceneData] = await db
        .select()
        .from(scenes)
        .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
        .leftJoin(stories, eq(chapters.storyId, stories.id))
        .where(eq(scenes.id, sceneId))
        .limit(1);

    if (!sceneData) {
        throw new Error("Scene not found");
    }

    const scene = sceneData.scenes;
    const chapter = sceneData.chapters;
    const story = sceneData.stories;

    // Validate content if required
    if (validateContent) {
        const validation = await validateSceneForPublishing(scene);
        if (!validation.isValid) {
            throw new Error(
                `Scene validation failed: ${validation.errors.join(", ")}`,
            );
        }
    }

    const now = new Date();

    // Update scene
    await db
        .update(scenes)
        .set({
            publishedAt: scheduledFor || now,
            publishedBy,
            visibility,
            scheduledFor: scheduledFor || null,
            updatedAt: now,
        })
        .where(eq(scenes.id, sceneId));

    // Update chapter status if all scenes published
    const chapterScenes = await db
        .select()
        .from(scenes)
        .where(eq(scenes.chapterId, scene.chapterId));

    const allPublished = chapterScenes.every((s) => s.publishedAt !== null);

    if (allPublished && chapter) {
        await db
            .update(chapters)
            .set({
                status: "published",
                publishedAt: now,
                updatedAt: now,
            })
            .where(eq(chapters.id, scene.chapterId));
    }
}

export async function unpublishScene(
    sceneId: string,
    unpublishedBy: string,
): Promise<void> {
    const now = new Date();

    await db
        .update(scenes)
        .set({
            publishedAt: null,
            visibility: "private",
            unpublishedAt: now,
            unpublishedBy,
            updatedAt: now,
        })
        .where(eq(scenes.id, sceneId));
}

export async function bulkPublishScenes(
    sceneIds: string[],
    publishedBy: string,
    visibility: "private" | "unlisted" | "public" = "public",
): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const sceneId of sceneIds) {
        try {
            await publishScene({ sceneId, publishedBy, visibility });
            success.push(sceneId);
        } catch (error) {
            console.error(`Failed to publish scene ${sceneId}:`, error);
            failed.push(sceneId);
        }
    }

    return { success, failed };
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

async function validateSceneForPublishing(
    scene: any,
): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if scene has content
    if (!scene.content || scene.content.trim().length === 0) {
        errors.push("Scene has no content");
    }

    // Check if title exists
    if (!scene.title || scene.title.trim().length === 0) {
        errors.push("Scene has no title");
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

export async function getScenePublishStatus(sceneId: string): Promise<{
    isPublished: boolean;
    publishedAt?: Date;
    visibility?: string;
    scheduledFor?: Date;
    canPublish: boolean;
    validationErrors?: string[];
}> {
    const [scene] = await db
        .select()
        .from(scenes)
        .where(eq(scenes.id, sceneId))
        .limit(1);

    if (!scene) {
        throw new Error("Scene not found");
    }

    const validation = await validateSceneForPublishing(scene);

    return {
        isPublished: !!scene.publishedAt,
        publishedAt: scene.publishedAt || undefined,
        visibility: scene.visibility,
        scheduledFor: scene.scheduledFor || undefined,
        canPublish: validation.isValid,
        validationErrors:
            validation.errors.length > 0 ? validation.errors : undefined,
    };
}
