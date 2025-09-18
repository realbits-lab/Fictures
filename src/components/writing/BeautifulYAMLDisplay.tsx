"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import yaml from "js-yaml";
import { useTheme } from "next-themes";

interface BeautifulYAMLDisplayProps {
  title: string;
  icon: string;
  data: any;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  changedKeys?: string[];
  onDataChange?: (data: any) => void;
}

interface YAMLKeyCardProps {
  keyName: string;
  value: any;
  isDark: boolean;
  columnIndex: number;
  isExpanded: boolean;
  isChanged?: boolean;
  onToggleExpansion: (keyName: string) => void;
}

function YAMLKeyCard({ keyName, value, isDark, columnIndex, isExpanded, isChanged = false, onToggleExpansion }: YAMLKeyCardProps) {

  const renderValue = (val: any): string => {
    if (typeof val === 'object' && val !== null) {
      if (Array.isArray(val)) {
        return `[${val.length} items]`;
      }
      return `{${Object.keys(val).length} properties}`;
    }
    if (typeof val === 'string' && val.length > 50) {
      return `"${val.substring(0, 50)}..."`;
    }
    return String(val);
  };

  const canExpand = typeof value === 'object' && value !== null;

  const getExpandedStyles = () => {
    if (!isExpanded) return {};
    return {
      width: '100%'
    };
  };


  return (
    <div className={`relative border rounded-lg p-3 hover:shadow-md transition-all duration-300 ${
      isChanged
        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-blue-200 dark:shadow-blue-800 shadow-lg'
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    } ${isExpanded ? 'shadow-2xl' : ''}`} style={getExpandedStyles()}>
      <div
        className={`flex items-center justify-between mb-2 ${
          canExpand ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 -m-1 p-1 rounded transition-colors' : 'cursor-pointer'
        }`}
        onClick={() => {
          if (canExpand) {
            onToggleExpansion(keyName);
          } else {
            // If clicking on a non-expandable card, collapse any expanded card
            onToggleExpansion('');
          }
        }}
        title={canExpand ? (isExpanded ? 'Collapse' : 'Expand') : undefined}
      >
        <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {keyName}
        </h5>
        {canExpand && (
          <div className="h-6 w-6 flex items-center justify-center text-gray-500 hover:text-gray-700 text-sm">
            {isExpanded ? '−' : '+'}
          </div>
        )}
      </div>

      {!isExpanded ? (
        <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {renderValue(value)}
        </div>
      ) : (
        <div className="mt-2 text-xs border-t border-gray-200 dark:border-gray-700 pt-2">
          <SyntaxHighlighter
            language="yaml"
            style={isDark ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              padding: '8px',
              fontSize: '11px',
              borderRadius: '4px',
              maxHeight: '300px',
              overflow: 'auto'
            }}
            wrapLongLines={true}
          >
            {yaml.dump(value, { indent: 2 })}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}

export function BeautifulYAMLDisplay({
  title,
  icon,
  data,
  isCollapsed = false,
  onToggleCollapse,
  changedKeys = [],
  onDataChange
}: BeautifulYAMLDisplayProps) {
  const { theme, systemTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  // State to track which card is currently expanded (only one at a time)
  const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handler to toggle card expansion - only one card can be expanded at a time
  const handleCardToggle = (keyName: string) => {
    if (keyName === '') {
      // Empty string means collapse any expanded card
      setExpandedCardKey(null);
    } else {
      setExpandedCardKey(expandedCardKey === keyName ? null : keyName);
    }
  };

  // Click outside to collapse expanded card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (expandedCardKey && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpandedCardKey(null);
      }
    };

    if (expandedCardKey) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedCardKey]);

  const parseYAMLContent = (content: string | object) => {
    try {
      if (typeof content === 'string') {
        return yaml.load(content) as Record<string, any> || {};
      }
      return content || {};
    } catch (error) {
      console.error('Failed to parse YAML content:', error);
      return {};
    }
  };

  const parsedData = parseYAMLContent(data);
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
            <div className="relative" ref={containerRef}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-min">
                {keys.map((key, index) => {
                  const isExpanded = key === expandedCardKey;
                  const isChanged = changedKeys.includes(key);
                  return (
                    <div key={key} className="relative">
                      <YAMLKeyCard
                        keyName={key}
                        value={parsedData[key]}
                        isDark={isDark}
                        columnIndex={index}
                        isExpanded={false}
                        isChanged={isChanged}
                        onToggleExpansion={handleCardToggle}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Expanded card overlay positioned at exact same height as collapsed card */}
              {expandedCardKey && (
                <div
                  className="absolute top-0 left-0 right-0 z-50"
                  style={{
                    top: '0px', // Will be positioned exactly at the collapsed card's position
                    transform: `translateY(${(() => {
                      const cardIndex = keys.indexOf(expandedCardKey);
                      const row = Math.floor(cardIndex / 3);
                      // More precise calculation based on typical card dimensions
                      const cardHeight = 76; // Based on p-3 (12px * 2) + title height + content preview
                      const gap = 12; // gap-3 = 0.75rem = 12px
                      return row * (cardHeight + gap);
                    })()}px)`
                  }}
                >
                  <YAMLKeyCard
                    keyName={expandedCardKey}
                    value={parsedData[expandedCardKey]}
                    isDark={isDark}
                    columnIndex={keys.indexOf(expandedCardKey) % 3}
                    isExpanded={true}
                    isChanged={changedKeys.includes(expandedCardKey)}
                    onToggleExpansion={handleCardToggle}
                  />
                </div>
              )}
            </div>
          )}

          {/* Full YAML View Toggle */}
          {keys.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                View complete YAML
              </summary>
              <div className="mt-2">
                <div className="relative">
                  <SyntaxHighlighter
                    language="yaml"
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
                    {typeof data === 'string' ? data : yaml.dump(parsedData, { indent: 2 })}
                  </SyntaxHighlighter>
                  {changedKeys.length > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {changedKeys.length} changed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}
        </CardContent>
      )}
    </Card>
  );
}