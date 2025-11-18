"use client";

import { useReadingHistorySync } from "@/hooks/use-reading-history-sync";

/**
 * Component to handle automatic syncing of localStorage reading history
 * to server when user logs in
 *
 * This component should be mounted in the root layout to ensure
 * it's always active and can detect login events
 */
export function ReadingHistorySync() {
    useReadingHistorySync();
    return null;
}
