/**
 * Optimistic Updates Hook
 *
 * Provides optimistic UI updates for mutations.
 * Updates UI immediately, then syncs with server response.
 *
 * Usage:
 *   const { mutate, isLoading, rollback } = useOptimisticMutation({
 *     mutationFn: async (data) => fetch(...),
 *     optimisticUpdate: (data) => ({ ...currentData, ...data }),
 *     onSuccess: (result) => console.log('Success!'),
 *   });
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { mutate as swrMutate } from 'swr';
import { useCacheInvalidation } from './use-cache-invalidation';

/**
 * Optimistic mutation function type
 */
export type OptimisticMutationFn<TData, TVariables> = (
  variables: TVariables
) => Promise<{ data: TData; headers: Headers }>;

/**
 * Optimistic update function type
 * Takes mutation variables and returns optimistic data
 */
export type OptimisticUpdateFn<TData, TVariables> = (
  variables: TVariables,
  currentData?: TData
) => TData;

/**
 * Optimistic mutation options
 */
export interface OptimisticMutationOptions<TData, TVariables> {
  /**
   * The mutation function to execute
   */
  mutationFn: OptimisticMutationFn<TData, TVariables>;

  /**
   * Function to generate optimistic data
   * This runs immediately when mutate() is called
   */
  optimisticUpdate: OptimisticUpdateFn<TData, TVariables>;

  /**
   * SWR cache key to update optimistically
   */
  cacheKey?: string | ((variables: TVariables) => string);

  /**
   * Success callback
   */
  onSuccess?: (data: TData) => void | Promise<void>;

  /**
   * Error callback
   */
  onError?: (error: Error) => void | Promise<void>;

  /**
   * Rollback callback (called if mutation fails)
   */
  onRollback?: () => void | Promise<void>;

  /**
   * Additional SWR keys to revalidate on success
   */
  revalidateKeys?: string[];

  /**
   * Auto-rollback on error (default: true)
   */
  autoRollback?: boolean;
}

/**
 * Optimistic mutation result
 */
export interface OptimisticMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
  rollback: () => Promise<void>;
}

/**
 * Hook for optimistic mutations
 *
 * Provides instant UI feedback by updating cache optimistically,
 * then syncing with server response.
 */
export function useOptimisticMutation<TData, TVariables>(
  options: OptimisticMutationOptions<TData, TVariables>
): OptimisticMutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const { handleCacheInvalidation, invalidateSWRKeys } = useCacheInvalidation();

  // Store previous data for rollback
  const previousDataRef = useRef<TData | null>(null);
  const cacheKeyRef = useRef<string | null>(null);

  const rollback = useCallback(async () => {
    if (previousDataRef.current && cacheKeyRef.current) {
      await swrMutate(cacheKeyRef.current, previousDataRef.current, {
        revalidate: false,
      });

      if (options.onRollback) {
        await options.onRollback();
      }

      console.log('[Optimistic] Rolled back to previous data');
    }
  }, [options]);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      // Determine cache key
      const cacheKey =
        typeof options.cacheKey === 'function'
          ? options.cacheKey(variables)
          : options.cacheKey;

      cacheKeyRef.current = cacheKey || null;

      try {
        // Step 1: Apply optimistic update to SWR cache
        if (cacheKey) {
          // Get current data from cache
          const currentData = await swrMutate(
            cacheKey,
            undefined,
            { revalidate: false }
          );

          // Store previous data for potential rollback
          previousDataRef.current = currentData || null;

          // Generate optimistic data
          const optimisticData = options.optimisticUpdate(variables, currentData);

          // Update SWR cache immediately
          await swrMutate(cacheKey, optimisticData, { revalidate: false });

          console.log('[Optimistic] Applied optimistic update to:', cacheKey);
        }

        // Step 2: Execute actual mutation
        const result = await options.mutationFn(variables);

        // Step 3: Update cache with server response
        if (cacheKey) {
          await swrMutate(cacheKey, result.data, { revalidate: false });
        }

        // Step 4: Handle cache invalidation from server headers
        handleCacheInvalidation(result.headers);

        // Step 5: Revalidate additional keys
        if (options.revalidateKeys && options.revalidateKeys.length > 0) {
          invalidateSWRKeys(options.revalidateKeys);
        }

        // Step 6: Call success callback
        if (options.onSuccess) {
          await options.onSuccess(result.data);
        }

        setData(result.data);
        previousDataRef.current = null; // Clear rollback data on success
        return result.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);

        // Auto-rollback on error (default: true)
        if (options.autoRollback !== false) {
          await rollback();
        }

        // Call error callback
        if (options.onError) {
          await options.onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [options, handleCacheInvalidation, invalidateSWRKeys, rollback]
  );

  return {
    mutate,
    isLoading,
    error,
    data,
    rollback,
  };
}

/**
 * Helper function to create optimistic update for array append
 *
 * Usage:
 *   optimisticUpdate: createOptimisticAppend((vars) => ({
 *     id: 'temp-id',
 *     content: vars.content,
 *     createdAt: new Date(),
 *   }))
 */
export function createOptimisticAppend<TItem, TVariables>(
  itemGenerator: (variables: TVariables) => TItem
): OptimisticUpdateFn<TItem[], TVariables> {
  return (variables, currentData = []) => {
    const newItem = itemGenerator(variables);
    return [...currentData, newItem];
  };
}

/**
 * Helper function to create optimistic update for object merge
 *
 * Usage:
 *   optimisticUpdate: createOptimisticMerge()
 */
export function createOptimisticMerge<TData extends Record<string, unknown>, TVariables>(): OptimisticUpdateFn<TData, TVariables> {
  return (variables, currentData) => {
    return {
      ...(currentData || {}),
      ...(variables as unknown as TData),
    } as TData;
  };
}

/**
 * Helper function to create optimistic update for counter increment
 *
 * Usage:
 *   optimisticUpdate: createOptimisticIncrement('likeCount', 1)
 */
export function createOptimisticIncrement<TData extends Record<string, unknown>>(
  field: keyof TData,
  amount: number = 1
): OptimisticUpdateFn<TData, unknown> {
  return (_, currentData) => {
    if (!currentData) return currentData as unknown as TData;
    return {
      ...currentData,
      [field]: ((currentData[field] as number) || 0) + amount,
    };
  };
}

/**
 * Helper function to create optimistic update for array item update
 *
 * Usage:
 *   optimisticUpdate: createOptimisticArrayUpdate(
 *     (item) => item.id === vars.id,
 *     (item, vars) => ({ ...item, ...vars })
 *   )
 */
export function createOptimisticArrayUpdate<TItem, TVariables>(
  matcher: (item: TItem, variables: TVariables) => boolean,
  updater: (item: TItem, variables: TVariables) => TItem
): OptimisticUpdateFn<TItem[], TVariables> {
  return (variables, currentData = []) => {
    return currentData.map((item) =>
      matcher(item, variables) ? updater(item, variables) : item
    );
  };
}
