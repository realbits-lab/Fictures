import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chapters, scenes, stories } from "@/lib/schemas/database";

interface PublishSceneParams {
    sceneId: string;
    publishedBy: string;
    novelStatus?: "draft" | "published";
    scheduledFor?: Date;
    validateContent?: boolean;
}

export async function publishScene(params: PublishSceneParams): Promise<void> {
    const {
        sceneId,
        publishedBy,
        novelStatus = "published",
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
    const _chapter = sceneData.chapters;
    const _story = sceneData.stories;

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
            publishedAt: scheduledFor?.toISOString() || now.toISOString(),
            publishedBy,
            novelStatus,
            scheduledFor: scheduledFor?.toISOString() || null,
            updatedAt: now.toISOString(),
        })
        .where(eq(scenes.id, sceneId));

    // Note: Chapters no longer have status field after schema migration
    // Chapter publish status is now determined by scene publish status
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
            novelStatus: "draft",
            unpublishedAt: now.toISOString(),
            unpublishedBy,
            updatedAt: now.toISOString(),
        })
        .where(eq(scenes.id, sceneId));
}

export async function bulkPublishScenes(
    sceneIds: string[],
    publishedBy: string,
    novelStatus: "draft" | "published" = "published",
): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const sceneId of sceneIds) {
        try {
            await publishScene({ sceneId, publishedBy, novelStatus });
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
    novelStatus?: string;
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
        publishedAt: scene.publishedAt
            ? new Date(scene.publishedAt)
            : undefined,
        novelStatus: scene.novelStatus,
        scheduledFor: scene.scheduledFor
            ? new Date(scene.scheduledFor)
            : undefined,
        canPublish: validation.isValid,
        validationErrors:
            validation.errors.length > 0 ? validation.errors : undefined,
    };
}
