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
    private static STORAGE_KEY = "reading_history";

    static getHistory(format?: string): ReadingHistoryEntry[] {
        if (typeof window === "undefined") return [];

        try {
            const key = format
                ? `${ReadingHistoryManager.STORAGE_KEY}_${format}`
                : ReadingHistoryManager.STORAGE_KEY;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error("Failed to load reading history:", error);
            return [];
        }
    }

    static addToHistory(storyId: string, format?: string): void {
        if (typeof window === "undefined") return;

        try {
            const history = ReadingHistoryManager.getHistory(format);
            const existingIndex = history.findIndex(
                (h) => h.storyId === storyId,
            );

            const entry: ReadingHistoryEntry = {
                storyId,
                progress: 0,
                lastReadAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
                history[existingIndex] = entry;
            } else {
                history.push(entry);
            }

            const key = format
                ? `${ReadingHistoryManager.STORAGE_KEY}_${format}`
                : ReadingHistoryManager.STORAGE_KEY;
            localStorage.setItem(key, JSON.stringify(history));
        } catch (error) {
            console.error("Failed to add to reading history:", error);
        }
    }

    static saveEntry(entry: ReadingHistoryEntry): void {
        if (typeof window === "undefined") return;

        try {
            const history = ReadingHistoryManager.getHistory();
            const existingIndex = history.findIndex(
                (h) => h.storyId === entry.storyId,
            );

            if (existingIndex >= 0) {
                history[existingIndex] = entry;
            } else {
                history.push(entry);
            }

            localStorage.setItem(
                ReadingHistoryManager.STORAGE_KEY,
                JSON.stringify(history),
            );
        } catch (error) {
            console.error("Failed to save reading history:", error);
        }
    }

    static getEntry(storyId: string): ReadingHistoryEntry | null {
        const history = ReadingHistoryManager.getHistory();
        return history.find((h) => h.storyId === storyId) || null;
    }

    static clearHistory(): void {
        if (typeof window === "undefined") return;

        try {
            localStorage.removeItem(ReadingHistoryManager.STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear reading history:", error);
        }
    }
}
