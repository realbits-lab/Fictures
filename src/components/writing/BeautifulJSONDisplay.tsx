"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";

interface BeautifulJSONDisplayProps {
  title: string;
  icon: string;
  data: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  changedKeys?: string[];
  onDataChange?: (data: any) => void;
}


export function BeautifulJSONDisplay({
  title,
  icon,
  data,
  isCollapsed = false,
  onToggleCollapse,
  changedKeys = [],
  onDataChange
}: BeautifulJSONDisplayProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to light theme during SSR to prevent hydration mismatch
  const isDark = mounted ? (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) : false;

  const parseJSONContent = (content: string | object) => {
    try {
      if (typeof content === 'string') {
        return JSON.parse(content) as Record<string, any> || {};
      }
      return content || {};
    } catch (error) {
      console.error('Failed to parse JSON content:', error);
      return {};
    }
  };

  const parsedData = parseJSONContent(data);
  const keys = Object.keys(parsedData);

  if (keys.length === 0 && !data) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle
            className="flex items-center gap-2 text-base cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <span>{icon}</span>
            {title}
            <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              ({keys.length} {keys.length === 1 ? 'property' : 'properties'})
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? '▶' : '▼'}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">📄</div>
              <p>No data available</p>
            </div>
          ) : (
            <>
              {/* Full JSON View */}
              <details open className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                  View complete JSON
                </summary>
                <div className="mt-2">
                  <div className="relative">
                    {mounted ? (
                      <SyntaxHighlighter
                        language="json"
                        style={isDark ? oneDark : oneLight}
                        customStyle={{
                          margin: 0,
                          padding: '12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          maxHeight: '400px',
                          overflow: 'auto'
                        }}
                        wrapLongLines={true}
                      >
                        {typeof data === 'string' ? data : JSON.stringify(parsedData, null, 2)}
                      </SyntaxHighlighter>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-800 border rounded-md p-2 text-xs font-mono text-gray-600 dark:text-gray-400">
                        Loading...
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}