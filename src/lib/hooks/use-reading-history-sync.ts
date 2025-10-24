import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { readingHistoryManager } from '@/lib/storage/reading-history-manager';

/**
 * Hook to sync localStorage reading history to server when user logs in
 * Only syncs once per session to avoid redundant API calls
 */
export function useReadingHistorySync() {
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  useEffect(() => {
    async function syncHistory() {
      // Only sync if:
      // 1. User is authenticated
      // 2. Haven't synced in this session yet
      // 3. There's localStorage data to sync
      if (!session?.user?.id || hasSynced.current) {
        return;
      }

      const stats = readingHistoryManager.getStats();
      if (stats.itemCount === 0) {
        // No localStorage history to sync
        hasSynced.current = true;
        return;
      }

      console.log(`User logged in, syncing ${stats.itemCount} reading history items...`);

      try {
        const syncedHistory = await readingHistoryManager.syncWithServer(session.user.id);

        if (syncedHistory) {
          console.log(`Successfully synced reading history (${syncedHistory.size} total items)`);
        }

        // Mark as synced to prevent repeated sync calls
        hasSynced.current = true;
      } catch (error) {
        console.error('Failed to sync reading history:', error);
        // Don't mark as synced so it can retry on next mount
      }
    }

    syncHistory();
  }, [session?.user?.id]);

  // Reset sync flag when user logs out
  useEffect(() => {
    if (!session?.user?.id && hasSynced.current) {
      hasSynced.current = false;
    }
  }, [session?.user?.id]);
}
