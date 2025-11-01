/**
 * Polyfill for React.useEffectEvent
 *
 * useEffectEvent is an experimental React hook that was proposed but never made it to stable.
 * fumadocs-ui v16 uses it, but it's not available in React 18.
 *
 * This polyfill provides a basic implementation using useCallback with useRef.
 */

import * as React from 'react';
import { useCallback, useRef, useLayoutEffect } from 'react';

declare module 'react' {
  function useEffectEvent<T extends (...args: any[]) => any>(callback: T): T;
}

console.log('[POLYFILL] Checking for useEffectEvent...');
console.log('[POLYFILL] React version:', React.version);
console.log('[POLYFILL] Has useEffectEvent:', typeof (React as any).useEffectEvent);

// Only polyfill if useEffectEvent doesn't exist
if (typeof (React as any).useEffectEvent === 'undefined') {
  console.log('[POLYFILL] Adding useEffectEvent polyfill');

  // @ts-ignore - We're adding a missing method
  React.useEffectEvent = function useEffectEvent<T extends (...args: any[]) => any>(
    callback: T
  ): T {
    const ref = useRef<T>(callback);

    // Update the ref on every render so it always has the latest callback
    useLayoutEffect(() => {
      ref.current = callback;
    });

    // Return a stable callback that always calls the latest version
    return useCallback(((...args: any[]) => {
      const fn = ref.current;
      return fn(...args);
    }) as T, []);
  };

  console.log('[POLYFILL] ✅ useEffectEvent polyfill installed successfully');
  console.log('[POLYFILL] Verify:', typeof (React as any).useEffectEvent);
} else {
  console.log('[POLYFILL] ℹ️ useEffectEvent already exists, skipping polyfill');
}

export {};
