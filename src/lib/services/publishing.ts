import { db } from '@/lib/db';
import { publishingSchedules, scheduledPublications, scenes, chapters } from '@/lib/db/schema';
import { eq, and, gte, lte, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

interface CreateScheduleParams {
  storyId: string;
  chapterId?: string;
  createdBy: string;
  name: string;
  description?: string;
  scheduleType: 'daily' | 'weekly' | 'custom' | 'one-time';
  startDate: Date;
  endDate?: Date;
  publishTime: string;
  intervalDays?: number;
  daysOfWeek?: number[];
  scenesPerPublish?: number;
}

export async function createPublishingSchedule(params: CreateScheduleParams): Promise<string> {
  const {
    storyId,
    chapterId,
    createdBy,
    name,
    description,
    scheduleType,
    startDate,
    endDate,
    publishTime,
    intervalDays,
    daysOfWeek,
    scenesPerPublish = 1,
  } = params;

  // Validation
  if (scheduleType === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
    throw new Error('Weekly schedule requires at least one day of week');
  }

  if (scheduleType === 'custom' && !intervalDays) {
    throw new Error('Custom schedule requires interval days');
  }

  // Get scenes to publish
  const scenesToPublish = await getUnpublishedScenes(storyId, chapterId);

  if (scenesToPublish.length === 0) {
    throw new Error('No unpublished scenes found');
  }

  // Calculate next publish time
  const nextPublishAt = calculateNextPublishTime(startDate, publishTime);

  // Format dates properly for database
  const formattedStartDate = startDate.toISOString().split('T')[0];
  const formattedEndDate = endDate ? endDate.toISOString().split('T')[0] : null;

  // Create schedule
  const scheduleId = nanoid();
  await db.insert(publishingSchedules).values({
    id: scheduleId,
    storyId,
    chapterId,
    createdBy,
    name,
    description,
    scheduleType,
    startDate: formattedStartDate,
    endDate: formattedEndDate,
    publishTime,
    intervalDays,
    daysOfWeek: daysOfWeek || null,
    scenesPerPublish,
    isActive: true,
    isCompleted: false,
    nextPublishAt,
    totalPublished: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  // Generate scheduled publications
  await generateScheduledPublications(scheduleId, params, scenesToPublish);

  return scheduleId;
}

async function getUnpublishedScenes(storyId: string, chapterId?: string): Promise<any[]> {
  let conditions = [
    eq(chapters.storyId, storyId),
    isNull(scenes.publishedAt)
  ];

  if (chapterId) {
    conditions.push(eq(scenes.chapterId, chapterId));
  }

  const results = await db
    .select({
      scene: scenes,
      chapter: chapters
    })
    .from(scenes)
    .leftJoin(chapters, eq(scenes.chapterId, chapters.id))
    .where(and(...conditions))
    .orderBy(scenes.orderIndex);

  return results.map(r => ({
    ...r.scene,
    chapterId: r.scene.chapterId
  }));
}

async function generateScheduledPublications(
  scheduleId: string,
  params: CreateScheduleParams,
  scenes: any[]
): Promise<void> {
  const {
    storyId,
    chapterId,
    scheduleType,
    startDate,
    endDate,
    publishTime,
    intervalDays,
    daysOfWeek,
    scenesPerPublish = 1,
  } = params;

  const publications: any[] = [];
  let currentDate = new Date(startDate);
  let sceneIndex = 0;

  while (sceneIndex < scenes.length) {
    // Calculate publish datetime
    const publishDateTime = new Date(currentDate);
    const [hours, minutes] = publishTime.split(':');
    publishDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if within date range
    if (endDate && publishDateTime > endDate) {
      break;
    }

    // Create publication for scene(s)
    const scenesToPublishNow = scenes.slice(sceneIndex, sceneIndex + scenesPerPublish);

    for (const scene of scenesToPublishNow) {
      publications.push({
        id: nanoid(),
        scheduleId,
        storyId,
        chapterId: scene.chapterId,
        sceneId: scene.id,
        scheduledFor: publishDateTime,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    sceneIndex += scenesPerPublish;

    // Calculate next publish date
    currentDate = calculateNextDate(currentDate, scheduleType, intervalDays, daysOfWeek);
  }

  // Insert all publications
  if (publications.length > 0) {
    await db.insert(scheduledPublications).values(publications);
  }
}

function calculateNextDate(
  currentDate: Date,
  scheduleType: string,
  intervalDays?: number,
  daysOfWeek?: number[]
): Date {
  const nextDate = new Date(currentDate);

  switch (scheduleType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      if (!daysOfWeek || daysOfWeek.length === 0) break;

      // Find next day of week
      const currentDay = nextDate.getDay();
      let daysToAdd = 1;

      // Sort days and find next occurrence
      const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
      const nextDay = sortedDays.find(day => day > currentDay);

      if (nextDay !== undefined) {
        daysToAdd = nextDay - currentDay;
      } else {
        // Wrap to next week
        daysToAdd = 7 - currentDay + sortedDays[0];
      }

      nextDate.setDate(nextDate.getDate() + daysToAdd);
      break;

    case 'custom':
      if (intervalDays) {
        nextDate.setDate(nextDate.getDate() + intervalDays);
      }
      break;

    case 'one-time':
      // No next date for one-time schedules
      break;
  }

  return nextDate;
}

function calculateNextPublishTime(date: Date, time: string): Date {
  const publishDate = new Date(date);
  const [hours, minutes] = time.split(':');
  publishDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return publishDate;
}

export async function updateScheduleStatus(
  scheduleId: string,
  isActive: boolean
): Promise<void> {
  await db
    .update(publishingSchedules)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  // This will cascade delete all scheduled_publications
  await db
    .delete(publishingSchedules)
    .where(eq(publishingSchedules.id, scheduleId));
}

export async function getScheduleProgress(scheduleId: string): Promise<{
  total: number;
  published: number;
  pending: number;
  failed: number;
  percentage: number;
}> {
  const publications = await db
    .select()
    .from(scheduledPublications)
    .where(eq(scheduledPublications.scheduleId, scheduleId));

  const total = publications.length;
  const published = publications.filter(p => p.status === 'published').length;
  const pending = publications.filter(p => p.status === 'pending').length;
  const failed = publications.filter(p => p.status === 'failed').length;
  const percentage = total > 0 ? (published / total) * 100 : 0;

  return { total, published, pending, failed, percentage };
}
