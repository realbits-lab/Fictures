'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Book, BookOpen, FileText, Layers, Edit, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LevelStats {
  totalWords: number;
  totalChapters?: number;
  totalParts?: number;
  totalScenes?: number;
  progress: number;
}

interface LevelOption {
  level: 'book' | 'story' | 'part' | 'chapter' | 'scene';
  title: string;
  path: string;
  isActive: boolean;
  description?: string;
  isDisabled?: boolean;
}

interface LevelData {
  currentLevel: string;
  currentPath: string;
  availableLevels: LevelOption[];
  stats?: {
    [key: string]: LevelStats;
  };
}

interface LevelSwitcherProps {
  levelData?: LevelData | null;
  compact?: boolean;
  showStats?: boolean;
  showDescriptions?: boolean;
  className?: string;
  currentLevel?: 'book' | 'story' | 'part' | 'chapter' | 'scene';
  bookId?: string;
  storyId?: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  onNavigate?: (path: string) => void;
}

const LevelSwitcher: React.FC<LevelSwitcherProps> = ({
  levelData,
  compact: propCompact = false,
  showStats = false,
  showDescriptions = false,
  className,
  onNavigate
}) => {
  const router = useRouter();
  
  const [isCompact, setIsCompact] = useState(propCompact);
  const [isTablet, setIsTablet] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

  // Handle viewport changes for responsive design
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsCompact(propCompact || width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propCompact]);

  // Get icon for level type
  const getLevelIcon = useCallback((level: string) => {
    switch (level) {
      case 'book':
        return <Book className="w-4 h-4" data-testid="icon-book" />;
      case 'story':
        return <BookOpen className="w-4 h-4" data-testid="icon-story" />;
      case 'part':
        return <FileText className="w-4 h-4" data-testid="icon-part" />;
      case 'chapter':
        return <Layers className="w-4 h-4" data-testid="icon-chapter" />;
      case 'scene':
        return <Edit className="w-4 h-4" data-testid="icon-scene" />;
      default:
        return <Edit className="w-4 h-4" />;
    }
  }, []);

  // Get abbreviated title for tablet view
  const getAbbreviatedTitle = useCallback((level: LevelOption) => {
    if (!isTablet) return level.title;
    
    switch (level.level) {
      case 'book':
        return 'Book';
      case 'story':
        return 'Story';
      case 'part':
        return level.title.replace(/Part (\d+):.*/, 'Part $1');
      case 'chapter':
        return level.title.replace(/Chapter (\d+):.*/, 'Ch. $1');
      case 'scene':
        return level.title.replace(/Scene (\d+):.*/, 'Scene $1');
      default:
        return level.title;
    }
  }, [isTablet]);

  // Format stats for display
  const formatStats = useCallback((stats: LevelStats, level: string) => {
    const items = [`${stats.totalWords.toLocaleString()} words`];
    
    if (stats.totalChapters) items.push(`${stats.totalChapters} chapters`);
    if (stats.totalParts) items.push(`${stats.totalParts} parts`);
    if (stats.totalScenes) items.push(`${stats.totalScenes} scenes`);
    
    items.push(`${stats.progress}% complete`);
    
    return items;
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((path: string, isActive: boolean, isDisabled?: boolean) => {
    if (isActive || isDisabled) return;
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  }, [router, onNavigate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!levelData?.availableLevels || !e.altKey) return;

      const numberKeys = ['1', '2', '3', '4', '5'];
      const keyIndex = numberKeys.indexOf(e.key);
      
      if (keyIndex !== -1 && levelData.availableLevels[keyIndex]) {
        e.preventDefault();
        const level = levelData.availableLevels[keyIndex];
        if (!level.isActive && !level.isDisabled) {
          handleNavigate(level.path, false, level.isDisabled);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelData, handleNavigate]);

  // Handle arrow key navigation
  const handleArrowNavigation = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (!levelData?.availableLevels) return;

    const levels = levelData.availableLevels;
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % levels.length;
    } else if (e.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + levels.length) % levels.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const level = levels[currentIndex];
      if (!level.isActive && !level.isDisabled) {
        handleNavigate(level.path, false, level.isDisabled);
      }
      return;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = document.querySelector(`[data-testid="level-tab-${levels[nextIndex].level}"]`) as HTMLElement;
    nextTab?.focus();
  }, [levelData, handleNavigate]);

  // Render tooltip content
  const renderTooltipContent = useCallback((level: LevelOption) => {
    const stats = levelData?.stats?.[level.level];
    
    return (
      <div data-testid={`stats-tooltip-${level.level}`} className="space-y-2">
        {showDescriptions && level.description && (
          <p className="text-sm">{level.description}</p>
        )}
        {showStats && stats && (
          <div className="space-y-1">
            {formatStats(stats, level.level).map((stat, index) => (
              <p key={index} className="text-xs text-gray-200">{stat}</p>
            ))}
            <Progress 
              value={stats.progress} 
              className="h-1 mt-1"
              data-testid={`progress-bar-${level.level}`}
            />
          </div>
        )}
      </div>
    );
  }, [levelData, showStats, showDescriptions, formatStats]);

  // Render level tab
  const renderLevelTab = useCallback((level: LevelOption, index: number) => {
    const isActive = level.isActive;
    const isDisabled = level.isDisabled;
    
    const tabContent = (
      <Button
        key={level.level}
        variant="ghost"
        size="sm"
        data-testid={`level-tab-${level.level}`}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-200',
          isActive && 'bg-primary-100 border-primary-300 text-primary-800',
          !isActive && !isDisabled && 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
          isDisabled && 'text-gray-400 cursor-not-allowed'
        )}
        disabled={isDisabled}
        onClick={() => handleNavigate(level.path, isActive, isDisabled)}
        onKeyDown={(e) => handleArrowNavigation(e, index)}
        onMouseEnter={() => setHoveredLevel(level.level)}
        onMouseLeave={() => setHoveredLevel(null)}
        tabIndex={0}
      >
        {getLevelIcon(level.level)}
        <span className="truncate">{getAbbreviatedTitle(level)}</span>
      </Button>
    );

    if ((showStats || showDescriptions) && (levelData?.stats?.[level.level] || level.description)) {
      return (
        <TooltipProvider key={level.level}>
          <Tooltip>
            <TooltipTrigger asChild>
              {tabContent}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {renderTooltipContent(level)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return tabContent;
  }, [getLevelIcon, getAbbreviatedTitle, handleNavigate, handleArrowNavigation, showStats, showDescriptions, levelData, renderTooltipContent]);

  // Render compact dropdown
  const renderCompactDropdown = useCallback(() => {
    if (!levelData?.availableLevels) return null;

    const currentLevel = levelData.availableLevels.find(level => level.isActive);
    if (!currentLevel) return null;

    return (
      <div data-testid="level-switcher-compact" className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              data-testid="current-level-dropdown"
              className="flex items-center gap-2"
            >
              {getLevelIcon(currentLevel.level)}
              <span className="truncate max-w-32">{currentLevel.title}</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64" data-testid="level-dropdown-menu">
            {levelData.availableLevels
              .filter(level => !level.isActive && !level.isDisabled)
              .map((level) => (
                <DropdownMenuItem
                  key={level.level}
                  data-testid={`dropdown-option-${level.level}`}
                  onClick={() => handleNavigate(level.path, false, level.isDisabled)}
                  className="flex items-center gap-2"
                >
                  {getLevelIcon(level.level)}
                  <div className="flex-1">
                    <span className="block truncate">{level.title}</span>
                    {level.description && (
                      <span className="text-xs text-gray-500 truncate">{level.description}</span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }, [levelData, getLevelIcon, handleNavigate]);

  // Loading state
  if (!levelData) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div data-testid="level-switcher-loading" className="flex items-center gap-2">
          <Skeleton className="w-8 h-8" />
          <Skeleton className="h-6 w-24" />
          <span className="text-sm text-gray-500">Loading navigation...</span>
        </div>
      </div>
    );
  }

  // Compact mode
  if (isCompact) {
    return (
      <div className={cn('flex items-center', className)}>
        {renderCompactDropdown()}
      </div>
    );
  }

  // Full tab mode
  return (
    <div className={cn('flex items-center', className)}>
      <div 
        data-testid="level-switcher" 
        role="tablist"
        aria-label="Book hierarchy levels"
        className="flex items-center gap-1 p-1 bg-gray-50 rounded-lg"
      >
        {levelData.availableLevels.map((level, index) => renderLevelTab(level, index))}
      </div>
    </div>
  );
};

export default LevelSwitcher;