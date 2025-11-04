/**
 * Mutation Hook with Automatic Cache Invalidation
 *
 * Wraps mutation operations (create, update, delete) with automatic
 * cache invalidation based on response headers.
 *
 * Usage:
 *   const { mutate, isLoading } = useMutationWithCache({
 *     mutationFn: async (data) => {
 *       const response = await fetch('/studio/api/scenes/123', {
 *         method: 'PATCH',
 *         body: JSON.stringify(data)
 *       });
 *       return { data: await response.json(), headers: response.headers };
 *     },
 *     onSuccess: (result) => {
 *       console.log('Scene updated!', result);
 *     }
 *   });
 */

'use client';

import { useState, useCallback } from 'react';
import { useCacheInvalidation } from './use-cache-invalidation';

/**
 * Mutation function type
 */
export type MutationFn<TData, TVariables> = (
  variables: TVariables
) => Promise<{ data: TData; headers: Headers }>;

/**
 * Mutation options
 */
export interface MutationOptions<TData, TVariables> {
  mutationFn: MutationFn<TData, TVariables>;
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
  additionalSWRKeys?: string[]; // Extra SWR keys to invalidate
}

/**
 * Mutation result
 */
export interface MutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Hook for mutations with automatic cache invalidation
 *
 * Automatically handles:
 * - Cache invalidation from response headers
 * - Additional SWR key invalidation
 * - Loading state
 * - Error handling
 */
export function useMutationWithCache<TData, TVariables>(
  options: MutationOptions<TData, TVariables>
): MutationResult<TData, TVariables> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const { handleCacheInvalidation, invalidateSWRKeys } = useCacheInvalidation();

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setError(null);

      try {
        // Execute mutation
        const result = await options.mutationFn(variables);

        // Invalidate caches based on response headers
        handleCacheInvalidation(result.headers);

        // Invalidate additional SWR keys if specified
        if (options.additionalSWRKeys && options.additionalSWRKeys.length > 0) {
          invalidateSWRKeys(options.additionalSWRKeys);
        }

        // Call success callback
        if (options.onSuccess) {
          await options.onSuccess(result.data);
        }

        setData(result.data);
        return result.data;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);

        // Call error callback
        if (options.onError) {
          await options.onError(error);
        }

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [
      options,
      handleCacheInvalidation,
      invalidateSWRKeys,
    ]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
}

/**
 * Helper function to create a fetch-based mutation function
 *
 * Usage:
 *   const updateScene = createFetchMutation<Scene, SceneUpdate>({
 *     url: (data) => `/studio/api/scenes/${data.id}`,
 *     method: 'PATCH',
 *   });
 */
export function createFetchMutation<TData, TVariables>(config: {
  url: string | ((variables: TVariables) => string);
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: HeadersInit;
}): MutationFn<TData, TVariables> {
  return async (variables: TVariables) => {
    const url = typeof config.url === 'function' ? config.url(variables) : config.url;

    const response = await fetch(url, {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      body: JSON.stringify(variables),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data, headers: response.headers };
  };
}
