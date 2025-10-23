import { db } from '@/lib/db';
import { scheduledPublications, publishingSchedules } from '@/lib/db/schema';
import { eq, lte, and, sql } from 'drizzle-orm';
import { publishScene } from './scene-publishing';

export async function processScheduledPublications(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const now = new Date();

  // Get pending publications due now
  const pendingPublications = await db
    .select()
    .from(scheduledPublications)
    .where(
      and(
        eq(scheduledPublications.status, 'pending'),
        lte(scheduledPublications.scheduledFor, now)
      )
    )
    .limit(100);

  let succeeded = 0;
  let failed = 0;

  for (const publication of pendingPublications) {
    try {
      // Publish the scene
      if (publication.sceneId) {
        await publishScene({
          sceneId: publication.sceneId,
          publishedBy: 'system',
          visibility: 'public',
        });
      } else if (publication.chapterId) {
        // Handle chapter publishing
        console.log('Chapter publishing not yet implemented');
      }

      // Mark as published
      await db
        .update(scheduledPublications)
        .set({
          status: 'published',
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(scheduledPublications.id, publication.id));

      // Update schedule stats
      if (publication.scheduleId) {
        await db
          .update(publishingSchedules)
          .set({
            lastPublishedAt: now,
            totalPublished: sql`${publishingSchedules.totalPublished} + 1`,
            updatedAt: now,
          })
          .where(eq(publishingSchedules.id, publication.scheduleId));
      }

      succeeded++;
    } catch (error) {
      console.error(`Failed to publish ${publication.id}:`, error);

      // Mark as failed
      await db
        .update(scheduledPublications)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: sql`${scheduledPublications.retryCount} + 1`,
          updatedAt: now,
        })
        .where(eq(scheduledPublications.id, publication.id));

      failed++;
    }
  }

  return {
    processed: pendingPublications.length,
    succeeded,
    failed,
  };
}

// This should be called by a cron job or background worker
// Example: Run every 5 minutes
export async function publishingCronJob() {
  console.log('[Publishing] Starting automated publishing job...');

  try {
    const result = await processScheduledPublications();

    console.log('[Publishing] Job completed:', result);

    return result;
  } catch (error) {
    console.error('[Publishing] Job failed:', error);
    throw error;
  }
}
