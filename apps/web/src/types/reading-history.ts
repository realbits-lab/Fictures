/**
 * Reading History Types
 *
 * Layer: Shared (Cross-cutting Concerns)
 * Used by: Novel/comic readers, user profile, reading analytics
 * Related:
 * - API types: src/app/studio/api/types.ts
 * - Service types: src/lib/studio/generators/types.ts
 * - Global types: src/types/index.ts
 *
 * ## Purpose
 * Defines types for tracking user reading progress across novel and comic formats.
 * These are cross-cutting concerns used in both reader interfaces and analytics.
 *
 * ## Type Categories
 * - Reading Format: Novel vs comic reading modes
 * - History Item: Individual reading session records
 * - Storage Data: Client-side localStorage format
 * - Database Record: Server-side database format
 *
 * ## Usage Context
 * - Novels: Track scene progress in long-form text reading
 * - Comics: Track panel/page progress in visual format
 * - Analytics: Reading time, frequency, completion tracking
 * - Recommendations: Personalized story suggestions based on history
 */

export type ReadingFormat = "novel" | "comic";

export interface HistoryItem {
    storyId: string;
    timestamp: number;
    format: ReadingFormat;

    // Format-specific progress
    sceneId?: string; // For novels - which scene was last read
    panelId?: string; // For comics - which panel was last viewed
    pageNumber?: number; // For comics - which page was last viewed
}

export interface StorageData {
    version: number;
    items: HistoryItem[];
}

export interface ReadingHistoryRecord {
    id: string;
    userId: string;
    storyId: string;
    readingFormat: ReadingFormat;
    lastReadAt: Date;
    readCount: number;

    // Format-specific progress
    lastSceneId?: string | null;
    lastPanelId?: string | null;
    lastPageNumber?: number | null;

    createdAt: Date;
}

export interface AddToHistoryOptions {
    sceneId?: string;
    panelId?: string;
    pageNumber?: number;
}
