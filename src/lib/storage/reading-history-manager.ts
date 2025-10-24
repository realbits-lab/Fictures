/**
 * Reading History Manager
 * Handles reading history for both authenticated and anonymous users
 * Uses localStorage for anonymous users, API for authenticated users
 */

const STORAGE_KEY = 'fictures:reading-history';
const STORAGE_VERSION = 1;
const MAX_ITEMS = 100; // Limit history to prevent localStorage bloat

interface HistoryItem {
  storyId: string;
  timestamp: number;
  sceneId?: string;
}

interface StorageData {
  version: number;
  items: HistoryItem[];
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
   * Get reading history from localStorage
   */
  private getLocalHistory(): HistoryItem[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }

    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        return [];
      }

      const parsed: StorageData = JSON.parse(data);

      // Version check and migration
      if (parsed.version !== STORAGE_VERSION) {
        return this.migrateHistory(parsed);
      }

      return parsed.items || [];
    } catch (error) {
      console.error('Error reading reading history from localStorage:', error);
      return [];
    }
  }

  /**
   * Save reading history to localStorage
   */
  private saveLocalHistory(items: HistoryItem[]): void {
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving reading history to localStorage:', error);

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

          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (retryError) {
          console.error('Failed to save even after reducing items:', retryError);
        }
      }
    }
  }

  /**
   * Add a story to reading history
   * Updates timestamp if story already exists
   */
  public addToHistory(storyId: string, sceneId?: string): void {
    const items = this.getLocalHistory();

    // Remove existing entry for this story (will be re-added with new timestamp)
    const filtered = items.filter(item => item.storyId !== storyId);

    // Add new entry at the beginning (most recent)
    filtered.unshift({
      storyId,
      timestamp: Date.now(),
      sceneId,
    });

    this.saveLocalHistory(filtered);
  }

  /**
   * Get all story IDs from reading history
   * Returns a Set for efficient lookup
   */
  public getHistory(): Set<string> {
    const items = this.getLocalHistory();
    return new Set(items.map(item => item.storyId));
  }

  /**
   * Get recently viewed stories with metadata
   * Useful for "Continue Reading" features
   */
  public getRecentlyViewed(limit: number = 10): HistoryItem[] {
    const items = this.getLocalHistory();
    return items
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Check if a story is in reading history
   */
  public hasStory(storyId: string): boolean {
    const history = this.getHistory();
    return history.has(storyId);
  }

  /**
   * Clear all reading history
   * Useful for privacy/logout
   */
  public clearHistory(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing reading history:', error);
    }
  }

  /**
   * Sync localStorage history to server when user logs in
   * Returns the merged history from server
   */
  public async syncWithServer(userId: string): Promise<Set<string> | null> {
    const localItems = this.getLocalHistory();

    if (localItems.length === 0) {
      return null;
    }

    try {
      console.log(`Syncing ${localItems.length} reading history items to server...`);

      const response = await fetch('/reading/api/history/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: localItems,
          userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Successfully synced reading history to server');

        // Keep localStorage as backup/cache
        // Don't clear it - let API be the source of truth

        // Return merged history from server
        if (data.history) {
          return new Set(data.history.map((h: any) => h.storyId as string));
        }
      } else {
        console.error('Failed to sync reading history:', response.statusText);
      }

      return null;
    } catch (error) {
      console.error('Error syncing reading history to server:', error);
      return null;
    }
  }

  /**
   * Migrate from older storage versions
   * Future-proofs the storage structure
   */
  private migrateHistory(oldData: any): HistoryItem[] {
    console.log('Migrating reading history from old version...');

    // Handle migration from v0 (simple array of IDs)
    if (Array.isArray(oldData)) {
      return oldData.map((storyId: string) => ({
        storyId,
        timestamp: Date.now(),
      }));
    }

    // Unknown format, return empty
    return [];
  }

  /**
   * Get storage statistics
   * Useful for debugging
   */
  public getStats(): { itemCount: number; isAvailable: boolean; storageUsed?: number } {
    const items = this.getLocalHistory();
    const isAvailable = this.isLocalStorageAvailable();

    let storageUsed: number | undefined;
    if (isAvailable) {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        storageUsed = data ? new Blob([data]).size : 0;
      } catch {
        // Ignore
      }
    }

    return {
      itemCount: items.length,
      isAvailable,
      storageUsed,
    };
  }
}

// Export singleton instance
export const readingHistoryManager = new ReadingHistoryManager();
