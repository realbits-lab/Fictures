"use client";

/**
 * Client component that ensures the React polyfills are loaded
 * before any Fumadocs components are rendered.
 */

import '@/lib/react-polyfills';
import { type ReactNode } from 'react';

export function DocsPolyfillProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
