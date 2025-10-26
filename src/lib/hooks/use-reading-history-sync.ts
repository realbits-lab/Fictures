import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { readingHistoryManager } from '@/lib/storage/reading-history-manager';
import type { ReadingFormat } from '@/types/reading-history';

/**
 * Hook to sync localStorage reading history to server when user logs in
 * Syncs both novel and comic formats separately
 * Only syncs once per session to avoid redundant API calls
 */
export function useReadingHistorySync() {
  const { data: session } = useSession();
  const hasSyncedNovel = useRef(false);
  const hasSyncedComic = useRef(false);

  // Sync novel format
  useEffect(() => {
    async function syncNovelHistory() {
      // Only sync if:
      // 1. User is authenticated
      // 2. Haven't synced novels in this session yet
      // 3. There's localStorage data to sync
      if (!session?.user?.id || hasSyncedNovel.current) {
        return;
      }

      const stats = readingHistoryManager.getStats('novel');
      if (stats.itemCount === 0) {
        // No localStorage history to sync
        hasSyncedNovel.current = true;
        return;
      }

      console.log(`User logged in, syncing ${stats.itemCount} novel reading history items...`);

      try {
        const syncedHistory = await readingHistoryManager.syncWithServer(
          session.user.id,
          'novel',
          '/novels/api/history/sync'
        );

        if (syncedHistory) {
          console.log(`Successfully synced novel reading history (${syncedHistory.size} total items)`);
        }

        // Mark as synced to prevent repeated sync calls
        hasSyncedNovel.current = true;
      } catch (error) {
        console.error('Failed to sync novel reading history:', error);
        // Don't mark as synced so it can retry on next mount
      }
    }

    syncNovelHistory();
  }, [session?.user?.id]);

  // Sync comic format
  useEffect(() => {
    async function syncComicHistory() {
      // Only sync if:
      // 1. User is authenticated
      // 2. Haven't synced comics in this session yet
      // 3. There's localStorage data to sync
      if (!session?.user?.id || hasSyncedComic.current) {
        return;
      }

      const stats = readingHistoryManager.getStats('comic');
      if (stats.itemCount === 0) {
        // No localStorage history to sync
        hasSyncedComic.current = true;
        return;
      }

      console.log(`User logged in, syncing ${stats.itemCount} comic reading history items...`);

      try {
        const syncedHistory = await readingHistoryManager.syncWithServer(
          session.user.id,
          'comic',
          '/comics/api/history/sync'
        );

        if (syncedHistory) {
          console.log(`Successfully synced comic reading history (${syncedHistory.size} total items)`);
        }

        // Mark as synced to prevent repeated sync calls
        hasSyncedComic.current = true;
      } catch (error) {
        console.error('Failed to sync comic reading history:', error);
        // Don't mark as synced so it can retry on next mount
      }
    }

    syncComicHistory();
  }, [session?.user?.id]);

  // Reset sync flags when user logs out
  useEffect(() => {
    if (!session?.user?.id) {
      if (hasSyncedNovel.current || hasSyncedComic.current) {
        hasSyncedNovel.current = false;
        hasSyncedComic.current = false;
      }
    }
  }, [session?.user?.id]);
}

/**
 * Hook to sync a specific format's reading history
 * Useful when you only need to sync one format
 */
export function useReadingHistorySyncFormat(format: ReadingFormat) {
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    async function syncHistory() {
      if (!session?.user?.id || hasSynced.current) {
        return;
      }

      const stats = readingHistoryManager.getStats(format);
      if (stats.itemCount === 0) {
        hasSynced.current = true;
        return;
      }

      console.log(`User logged in, syncing ${stats.itemCount} ${format} reading history items...`);

      try {
        const apiPath = format === 'novel'
          ? '/novels/api/history/sync'
          : '/comics/api/history/sync';

        const syncedHistory = await readingHistoryManager.syncWithServer(
          session.user.id,
          format,
          apiPath
        );

        if (syncedHistory) {
          console.log(`Successfully synced ${format} reading history (${syncedHistory.size} total items)`);
        }

        hasSynced.current = true;
      } catch (error) {
        console.error(`Failed to sync ${format} reading history:`, error);
      }
    }

    syncHistory();
  }, [session?.user?.id, format]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!session?.user?.id && hasSynced.current) {
      hasSynced.current = false;
    }
  }, [session?.user?.id]);
}
