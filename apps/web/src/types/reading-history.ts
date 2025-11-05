/**
 * Reading History Types
 * Defines types for novel and comic reading history tracking
 */

export type ReadingFormat = 'novel' | 'comic';

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
