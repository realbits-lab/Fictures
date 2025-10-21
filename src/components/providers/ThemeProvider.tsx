'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import * as React from 'react';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={[
        'light',
        'dark', 
        'ocean',
        'purple',
        'forest',
        'sunset',
        'rose',
        'midnight'
      ]}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}