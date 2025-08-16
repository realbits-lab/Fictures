'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Book, BookOpen, FileText, Layers, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { QuickJumpProps } from '../types/hierarchy';

interface SearchResult {
  id: string;
  type: 'story' | 'part' | 'chapter' | 'scene';
  title: string;
  subtitle?: string;
  path: string;
  breadcrumb: string[];
  wordCount?: number;
  isComplete?: boolean;
  isPublished?: boolean;
}

interface QuickJumpSearchProps extends QuickJumpProps {
  onNavigate?: (path: string) => void;
}

const QuickJump: React.FC<QuickJumpSearchProps> = ({
  bookId,
  placeholder = 'Search chapters, scenes...',
  className,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Mock navigation function
  const handleNavigate = useCallback((path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      // In real app, would use router.push(path)
      console.log('Navigate to:', path);
    }
    setIsOpen(false);
    setQuery('');
  }, [onNavigate]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/books/${bookId}/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  // Handle search input changes with debouncing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  }, [performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleNavigate(results[selectedIndex].path);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        setResults([]);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, results, selectedIndex, handleNavigate]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      selectedElement?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Get icon for content type
  const getTypeIcon = useCallback((type: string) => {
    switch (type) {
      case 'story':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'part':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'chapter':
        return <Layers className="w-4 h-4 text-orange-500" />;
      case 'scene':
        return <Edit className="w-4 h-4 text-purple-500" />;
      default:
        return <Book className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  // Render search result
  const renderResult = useCallback((result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    
    return (
      <div
        key={result.id}
        data-index={index}
        data-testid={`search-result-${result.type}-${result.id}`}
        className={cn(
          'flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors',
          isSelected ? 'bg-primary-50 border-primary-200' : 'hover:bg-gray-50'
        )}
        onClick={() => handleNavigate(result.path)}
      >
        {getTypeIcon(result.type)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{result.title}</span>
            {result.isPublished && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Published
              </span>
            )}
            {result.isComplete === false && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                Draft
              </span>
            )}
          </div>
          {result.subtitle && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{result.subtitle}</p>
          )}
          <p className="text-xs text-gray-400 truncate">
            {result.breadcrumb.join(' › ')}
            {result.wordCount && ` • ${result.wordCount.toLocaleString()} words`}
          </p>
        </div>
      </div>
    );
  }, [selectedIndex, getTypeIcon, handleNavigate]);

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          data-testid="quick-jump-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            data-testid="clear-search"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && (query || results.length > 0) && (
        <Card
          ref={resultsRef}
          data-testid="search-results"
          className="absolute top-full left-0 right-0 mt-1 z-50 p-2 max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div data-testid="search-loading" className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="w-4 h-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2">
                <Skeleton className="w-4 h-4" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 mb-1" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => renderResult(result, index))}
            </div>
          ) : query && !loading ? (
            <div data-testid="no-results" className="px-3 py-4 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div data-testid="search-help" className="px-3 py-4 text-center text-sm text-gray-500">
              Start typing to search chapters and scenes
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default QuickJump;