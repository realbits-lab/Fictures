"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils/cn';

interface ThemeSelectorProps {
  className?: string;
}

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  preview: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
  };
}

const themeOptions: ThemeOption[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and bright interface',
    preview: {
      background: 'rgb(255, 255, 255)',
      foreground: 'rgb(39, 39, 42)',
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(244, 244, 245)'
    }
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes in low light',
    preview: {
      background: 'rgb(9, 9, 11)',
      foreground: 'rgb(244, 244, 245)',
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(39, 39, 42)'
    }
  },
  {
    id: 'ocean',
    name: 'Blue Ocean',
    description: 'Calm and focused blue theme',
    preview: {
      background: 'rgb(248, 250, 252)',
      foreground: 'rgb(30, 58, 138)',
      primary: 'rgb(59, 130, 246)',
      secondary: 'rgb(219, 234, 254)'
    }
  },
  {
    id: 'purple',
    name: 'Purple Dream',
    description: 'Creative and inspiring purple',
    preview: {
      background: 'rgb(250, 245, 255)',
      foreground: 'rgb(88, 28, 135)',
      primary: 'rgb(147, 51, 234)',
      secondary: 'rgb(233, 213, 255)'
    }
  },
  {
    id: 'forest',
    name: 'Forest Green',
    description: 'Natural and refreshing green',
    preview: {
      background: 'rgb(247, 254, 231)',
      foreground: 'rgb(21, 128, 61)',
      primary: 'rgb(34, 197, 94)',
      secondary: 'rgb(220, 252, 231)'
    }
  },
  {
    id: 'sunset',
    name: 'Warm Sunset',
    description: 'Warm and energizing orange',
    preview: {
      background: 'rgb(255, 247, 237)',
      foreground: 'rgb(154, 52, 18)',
      primary: 'rgb(234, 88, 12)',
      secondary: 'rgb(254, 215, 170)'
    }
  },
  {
    id: 'rose',
    name: 'Rose Garden',
    description: 'Elegant and romantic pink',
    preview: {
      background: 'rgb(255, 241, 242)',
      foreground: 'rgb(159, 18, 57)',
      primary: 'rgb(244, 63, 94)',
      secondary: 'rgb(254, 205, 211)'
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep and mysterious dark blue',
    preview: {
      background: 'rgb(15, 23, 42)',
      foreground: 'rgb(241, 245, 249)',
      primary: 'rgb(168, 85, 247)',
      secondary: 'rgb(30, 41, 59)'
    }
  }
];

function ThemePreview({ theme, isSelected, onClick }: {
  theme: ThemeOption;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "relative cursor-pointer group transition-all duration-200",
        "border-2 rounded-xl p-1",
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
      onClick={onClick}
    >
      {/* Theme Preview Card */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Color Preview */}
        <div
          className="h-20 w-full flex rounded-t-lg"
          style={{ backgroundColor: theme.preview.background }}
        >
          {/* Header simulation */}
          <div className="flex-1 p-2 space-y-1">
            <div
              className="h-2 w-16 rounded"
              style={{ backgroundColor: theme.preview.primary }}
            />
            <div
              className="h-1 w-12 rounded"
              style={{ backgroundColor: theme.preview.secondary }}
            />
          </div>
          {/* Content simulation */}
          <div className="flex-1 p-2 space-y-1">
            <div
              className="h-1 w-full rounded"
              style={{ backgroundColor: theme.preview.foreground, opacity: 0.8 }}
            />
            <div
              className="h-1 w-8 rounded"
              style={{ backgroundColor: theme.preview.foreground, opacity: 0.6 }}
            />
            <div
              className="h-1 w-10 rounded"
              style={{ backgroundColor: theme.preview.foreground, opacity: 0.4 }}
            />
          </div>
        </div>
        
        {/* Theme Info */}
        <div 
          className="p-3 border-t"
          style={{ 
            backgroundColor: theme.preview.background,
            borderColor: theme.preview.secondary,
            color: theme.preview.foreground
          }}
        >
          <div className="text-sm font-medium">{theme.name}</div>
          <div className="text-xs opacity-60 mt-1 leading-tight">
            {theme.description}
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* Hover effect */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-200 rounded-lg" />
      </div>
    </div>
  );
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentTheme = themeOptions.find(t => t.id === resolvedTheme) || themeOptions[0];

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Theme
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a theme to personalize your writing experience. Changes are applied instantly.
        </p>
      </div>

      {/* System Theme Option */}
      <div className="mb-4">
        <div 
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
            theme === 'system'
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
          )}
          onClick={() => setTheme('system')}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-green-500">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              System
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Use your device's theme setting
            </div>
          </div>
          {theme === 'system' && (
            <div className="w-5 h-5 text-blue-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themeOptions.map((themeOption) => (
          <ThemePreview
            key={themeOption.id}
            theme={themeOption}
            isSelected={theme === themeOption.id}
            onClick={() => setTheme(themeOption.id)}
          />
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-1">
            <div 
              className="w-4 h-4 rounded-full border border-white dark:border-gray-800"
              style={{ backgroundColor: currentTheme.preview.primary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-white dark:border-gray-800"
              style={{ backgroundColor: currentTheme.preview.secondary }}
            />
            <div 
              className="w-4 h-4 rounded-full border border-white dark:border-gray-800"
              style={{ backgroundColor: currentTheme.preview.background }}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Current Theme: {theme === 'system' ? `System (${currentTheme.name})` : currentTheme.name}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {currentTheme.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}