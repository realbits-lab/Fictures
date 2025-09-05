"use client";

import React from 'react';
import { useTheme, Theme } from '@/lib/contexts/ThemeContext';
import { cn } from '@/lib/utils/cn';

interface ThemeSelectorProps {
  className?: string;
}

function ThemePreview({ theme, isSelected, onClick }: {
  theme: Theme;
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
  const { currentTheme, setTheme, themes } = useTheme();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <ThemePreview
            key={theme.id}
            theme={theme}
            isSelected={currentTheme.id === theme.id}
            onClick={() => setTheme(theme.id)}
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
              Current Theme: {currentTheme.name}
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