/**
 * Reading History Manager
 * Manages reading progress in localStorage
 */

export interface ReadingHistoryEntry {
  storyId: string;
  chapterId?: string;
  sceneId?: string;
  progress: number;
  lastReadAt: string;
}

export class ReadingHistoryManager {
  private static STORAGE_KEY = 'reading_history';

  static getHistory(): ReadingHistoryEntry[] {
    if (typeof window === 'undefined') return [];

    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load reading history:', error);
      return [];
    }
  }

  static saveEntry(entry: ReadingHistoryEntry): void {
    if (typeof window === 'undefined') return;

    try {
      const history = this.getHistory();
      const existingIndex = history.findIndex(h => h.storyId === entry.storyId);

      if (existingIndex >= 0) {
        history[existingIndex] = entry;
      } else {
        history.push(entry);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save reading history:', error);
    }
  }

  static getEntry(storyId: string): ReadingHistoryEntry | null {
    const history = this.getHistory();
    return history.find(h => h.storyId === storyId) || null;
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear reading history:', error);
    }
  }
}
