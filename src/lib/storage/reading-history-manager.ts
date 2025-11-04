/**
 * Reading History Manager
 * Handles reading history for both authenticated and anonymous users
 * Uses localStorage for anonymous users, API for authenticated users
 * Supports separate tracking for novel and comic formats
 */

import type {
  ReadingFormat,
  HistoryItem,
  StorageData,
  AddToHistoryOptions
} from '@/types/novels-history';

const STORAGE_VERSION = 2; // Bumped from 1 to support format separation
const MAX_ITEMS = 100; // Limit history to prevent localStorage bloat
const LEGACY_STORAGE_KEY = 'fictures:reading-history'; // Old key for migration

/**
 * Get storage key for specific format
 */
function getStorageKey(format: ReadingFormat): string {
  return `fictures:reading-history:${format}`;
}

class ReadingHistoryManager {
  /**
   * Check if localStorage is available
   * Returns false in Safari private mode or when disabled
   */
  private isLocalStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get reading history from localStorage for specific format
   */
  private getLocalHistory(format: ReadingFormat): HistoryItem[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const storageKey = getStorageKey(format);
      const data = localStorage.getItem(storageKey);
      if (!data) {
        // Try migrating from old v1 format (no format separation)
        return this.migrateLegacyHistory(format);
      }

      const parsed: StorageData = JSON.parse(data);

      // Version check and migration
      if (parsed.version !== STORAGE_VERSION) {
        return this.migrateHistory(parsed, format);
      }

      return parsed.items || [];
    } catch (error) {
      console.error(`Error reading ${format} reading history from localStorage:`, error);
      return [];
    }
  }

  /**
   * Save reading history to localStorage for specific format
   */
  private saveLocalHistory(items: HistoryItem[], format: ReadingFormat): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      // Keep only most recent MAX_ITEMS, sorted by timestamp
      const limited = items
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_ITEMS);

      const data: StorageData = {
        version: STORAGE_VERSION,
        items: limited,
      };

      const storageKey = getStorageKey(format);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${format} reading history to localStorage:`, error);

      // If quota exceeded, try clearing old items
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        try {
          // Keep only the most recent 50 items
          const reduced = items
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50);

          const data: StorageData = {
            version: STORAGE_VERSION,
            items: reduced,
          };

          const storageKey = getStorageKey(format);
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (retryError) {
          console.error(`Failed to save even after reducing items:`, retryError);
        }
      }
    }
  }

  /**
   * Add a story to reading history with format-specific tracking
   * Updates timestamp if story already exists in that format
   */
  public addToHistory(
    storyId: string,
    format: ReadingFormat,
    options?: AddToHistoryOptions
  ): void {
    const items = this.getLocalHistory(format);

    // Remove existing entry for this story in this format (will be re-added with new timestamp)
    const filtered = items.filter(item => item.storyId !== storyId);

    // Add new entry at the beginning (most recent)
    filtered.unshift({
      storyId,
      timestamp: Date.now(),
      format,
      sceneId: options?.sceneId,
      panelId: options?.panelId,
      pageNumber: options?.pageNumber,
    });

    this.saveLocalHistory(filtered, format);
  }

  /**
   * Get all story IDs from reading history for specific format
   * Returns a Set for efficient lookup
   */
  public getHistory(format: ReadingFormat): Set<string> {
    const items = this.getLocalHistory(format);
    return new Set(items.map(item => item.storyId));
  }

  /**
   * Get recently viewed stories with metadata for specific format
   * Useful for "Continue Reading" features
   */
  public getRecentlyViewed(format: ReadingFormat, limit: number = 10): HistoryItem[] {
    const items = this.getLocalHistory(format);
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Check if a story is in reading history for specific format
   */
  public hasStory(storyId: string, format: ReadingFormat): boolean {
    const history = this.getHistory(format);
    return history.has(storyId);
  }

  /**
   * Clear reading history for specific format
   * Useful for privacy/logout
   */
  public clearHistory(format: ReadingFormat): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      const storageKey = getStorageKey(format);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing ${format} reading history:`, error);
    }
  }

  /**
   * Clear all reading history (both formats)
   */
  public clearAllHistory(): void {
    this.clearHistory('novel');
    this.clearHistory('comic');

    // Also clear legacy key if it exists
    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (error) {
        console.error('Error clearing legacy reading history:', error);
      }
    }
  }

  /**
   * Sync localStorage history to server when user logs in
   * Returns the merged history from server for specific format
   */
  public async syncWithServer(
    userId: string,
    format: ReadingFormat,
    apiPath: string = '/novels/api/history/sync'
  ): Promise<Set<string> | null> {
    const localItems = this.getLocalHistory(format);

    if (localItems.length === 0) {
      return null;
    }

    try {
      console.log(`Syncing ${localItems.length} ${format} reading history items to server...`);

      const response = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: localItems,
          userId,
          format,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Successfully synced ${format} reading history to server`);

        // Keep localStorage as backup/cache
        // Don't clear it - let API be the source of truth

        // Return merged history from server
        if (data.history) {
          return new Set(data.history.map((h: any) => h.storyId as string));
        }
      } else {
        console.error(`Failed to sync ${format} reading history:`, response.statusText);
      }

      return null;
    } catch (error) {
      console.error(`Error syncing ${format} reading history to server:`, error);
      return null;
    }
  }

  /**
   * Migrate from legacy v1 storage (no format separation)
   * Assumes all legacy data is novel format
   */
  private migrateLegacyHistory(targetFormat: ReadingFormat): HistoryItem[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const legacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!legacyData) {
        return [];
      }

      console.log(`Migrating legacy reading history to ${targetFormat} format...`);

      const parsed = JSON.parse(legacyData);
      let items: HistoryItem[] = [];

      // Handle v0 format (simple array of story IDs)
      if (Array.isArray(parsed)) {
        items = parsed.map((storyId: string) => ({
          storyId,
          timestamp: Date.now(),
          format: targetFormat,
        }));
      }
      // Handle v1 format (with version field)
      else if (parsed.version === 1 && Array.isArray(parsed.items)) {
        items = parsed.items.map((item: any) => ({
          storyId: item.storyId,
          timestamp: item.timestamp || Date.now(),
          format: targetFormat,
          sceneId: item.sceneId,
        }));
      }

      // Only migrate to 'novel' format (legacy data is assumed to be novels)
      if (targetFormat === 'novel' && items.length > 0) {
        this.saveLocalHistory(items, targetFormat);
        console.log(`Migrated ${items.length} items to ${targetFormat} format`);
        return items;
      }

      return [];
    } catch (error) {
      console.error('Error migrating legacy reading history:', error);
      return [];
    }
  }

  /**
   * Migrate from older storage versions
   * Future-proofs the storage structure
   */
  private migrateHistory(oldData: any, targetFormat: ReadingFormat): HistoryItem[] {
    console.log(`Migrating ${targetFormat} reading history from old version...`);

    try {
      // If items exist, ensure they have the format field
      if (oldData.items && Array.isArray(oldData.items)) {
        const migratedItems = oldData.items.map((item: any) => ({
          ...item,
          format: item.format || targetFormat, // Add format if missing
        }));

        // Save migrated data
        this.saveLocalHistory(migratedItems, targetFormat);
        return migratedItems;
      }

      return [];
    } catch (error) {
      console.error(`Error migrating ${targetFormat} reading history:`, error);
      return [];
    }
  }

  /**
   * Get storage statistics for specific format
   * Useful for debugging
   */
  public getStats(format: ReadingFormat): {
    itemCount: number;
    isAvailable: boolean;
    storageUsed?: number;
    format: ReadingFormat;
  } {
    const items = this.getLocalHistory(format);
    const isAvailable = this.isLocalStorageAvailable();

    let storageUsed: number | undefined;
    if (isAvailable) {
      try {
        const storageKey = getStorageKey(format);
        const data = localStorage.getItem(storageKey);
        storageUsed = data ? new Blob([data]).size : 0;
      } catch {
        // Ignore
      }
    }

    return {
      itemCount: items.length,
      isAvailable,
      storageUsed,
      format,
    };
  }

  /**
   * Get combined statistics for all formats
   */
  public getAllStats(): {
    novel: ReturnType<typeof this.getStats>;
    comic: ReturnType<typeof this.getStats>;
    total: number;
  } {
    const novelStats = this.getStats('novel');
    const comicStats = this.getStats('comic');

    return {
      novel: novelStats,
      comic: comicStats,
      total: novelStats.itemCount + comicStats.itemCount,
    };
  }
}

// Export singleton instance
export const readingHistoryManager = new ReadingHistoryManager();
