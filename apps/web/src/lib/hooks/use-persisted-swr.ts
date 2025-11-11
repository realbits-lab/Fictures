/**
 * Persisted SWR Hook
 * SWR wrapper with localStorage persistence
 */

import { useEffect } from "react";
import useSWR, { type SWRConfiguration } from "swr";

export function usePersistedSWR<T>(
	key: string | null,
	fetcher: ((key: string) => Promise<T>) | null,
	config?: SWRConfiguration,
) {
	const { data, error, mutate } = useSWR<T>(key, fetcher, config);

	useEffect(() => {
		if (data && key && typeof window !== "undefined") {
			try {
				localStorage.setItem(`swr:${key}`, JSON.stringify(data));
			} catch (error) {
				console.error("Failed to persist SWR data:", error);
			}
		}
	}, [data, key]);

	return { data, error, mutate, isLoading: !data && !error };
}
