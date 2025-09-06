"use client";

import React from 'react';

interface ProgressIndicatorProps {
  isLoading?: boolean;
  isValidating?: boolean;
  className?: string;
}

export function ProgressIndicator({ 
  isLoading = false, 
  isValidating = false, 
  className = "" 
}: ProgressIndicatorProps) {
  if (!isLoading && !isValidating) {
    return null;
  }

  const isActive = isLoading || isValidating;
  const text = isLoading ? "Loading..." : "Updating...";
  const icon = isLoading ? "📖" : "🔄";

  return (
    <div className={`flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg text-sm text-blue-700 dark:text-blue-300 ${className}`}>
      <span className={isActive ? "animate-pulse" : ""}>{icon}</span>
      <span className="font-medium">{text}</span>
      {isActive && (
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      )}
    </div>
  );
}