'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Bot, BookOpen, Users, Map, Target, TrendingUp, ChevronDown, ChevronRight, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { AIContextPanelProps, AIContext } from '../types/hierarchy';

interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  description: string;
  currentLocation?: string;
  emotionalState?: string;
  motivation?: string;
  relationship?: string;
}

interface PlotThread {
  id: string;
  title: string;
  type: 'main' | 'subplot' | 'character-arc';
  status: 'active' | 'resolved' | 'dormant';
  description: string;
  progress: number;
}

interface WritingPrompt {
  id: string;
  type: 'character' | 'plot' | 'setting' | 'dialogue' | 'action';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

interface ContextData {
  bookTitle: string;
  storyTitle?: string;
  partTitle?: string;
  chapterTitle?: string;
  characters: Character[];
  plotThreads: PlotThread[];
  writingStyle?: string;
  currentProgress: {
    totalWords: number;
    currentChapter: number;
    totalChapters: number;
    completionPercentage: number;
  };
  recentScenes: Array<{
    id: string;
    title: string;
    summary: string;
    keyEvents: string[];
  }>;
  suggestions: WritingPrompt[];
  mood?: string;
  themes?: string[];
}

const AIContextPanel: React.FC<AIContextPanelProps> = ({
  bookId,
  storyId,
  partId,
  chapterId,
  sceneId,
  className,
  isVisible = true,
  onToggle
}) => {
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['progress', 'characters'])
  );

  // Build context path for API
  const contextPath = useMemo(() => {
    let path = `/api/books/${bookId}/context`;
    const params = new URLSearchParams();
    
    if (storyId) params.append('storyId', storyId);
    if (partId) params.append('partId', partId);
    if (chapterId) params.append('chapterId', chapterId);
    if (sceneId) params.append('sceneId', sceneId);
    
    if (params.toString()) {
      path += `?${params.toString()}`;
    }
    
    return path;
  }, [bookId, storyId, partId, chapterId, sceneId]);

  // Fetch context data
  const fetchContextData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(contextPath);
      if (!response.ok) {
        throw new Error('Failed to load context data');
      }
      
      const data = await response.json();
      setContextData(data.context);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load AI context');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [contextPath]);

  useEffect(() => {
    if (isVisible) {
      fetchContextData();
    }
  }, [fetchContextData, isVisible]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Render character card
  const renderCharacter = useCallback((character: Character) => (
    <Card key={character.id} data-testid={`character-${character.id}`} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-sm">{character.name}</h4>
          <Badge variant={character.role === 'protagonist' ? 'default' : 'secondary'} className="text-xs">
            {character.role}
          </Badge>
        </div>
        <Users className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-xs text-gray-600 mb-2">{character.description}</p>
      {character.emotionalState && (
        <p className="text-xs text-blue-600">Mood: {character.emotionalState}</p>
      )}
      {character.currentLocation && (
        <p className="text-xs text-green-600">Location: {character.currentLocation}</p>
      )}
    </Card>
  ), []);

  // Render plot thread
  const renderPlotThread = useCallback((thread: PlotThread) => (
    <Card key={thread.id} data-testid={`plot-thread-${thread.id}`} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{thread.title}</h4>
          <Badge 
            variant={thread.status === 'active' ? 'default' : thread.status === 'resolved' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {thread.status}
          </Badge>
        </div>
        <Target className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-xs text-gray-600 mb-2">{thread.description}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Progress</span>
          <span>{thread.progress}%</span>
        </div>
        <Progress value={thread.progress} className="h-1" />
      </div>
    </Card>
  ), []);

  // Render writing suggestion
  const renderSuggestion = useCallback((suggestion: WritingPrompt) => (
    <Card key={suggestion.id} data-testid={`suggestion-${suggestion.id}`} className="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{suggestion.title}</h4>
          <Badge 
            variant={suggestion.priority === 'high' ? 'destructive' : suggestion.priority === 'medium' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {suggestion.priority} priority
          </Badge>
        </div>
        <Bot className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-xs text-gray-600">{suggestion.content}</p>
    </Card>
  ), []);

  // Render collapsible section
  const renderSection = useCallback((
    id: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    count?: number
  ) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div key={id} className="border-b">
        <button
          data-testid={`section-${id}`}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection(id)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-sm">{title}</span>
            {count !== undefined && (
              <Badge variant="outline" className="text-xs">
                {count}
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div data-testid={`section-content-${id}`} className="px-3 pb-3">
            {children}
          </div>
        )}
      </div>
    );
  }, [expandedSections, toggleSection]);

  if (!isVisible) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <Card className={cn('w-80 h-full overflow-hidden', className)}>
        <div data-testid="ai-context-loading" className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('w-80 p-4', className)}>
        <div data-testid="ai-context-error" className="text-center">
          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-3">Failed to load AI context</p>
          <Button onClick={() => fetchContextData()} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  // No data state
  if (!contextData) {
    return (
      <Card className={cn('w-80 p-4', className)}>
        <div data-testid="ai-context-empty" className="text-center">
          <Bot className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No context data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('w-80 h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-sm">AI Writing Context</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            data-testid="refresh-context"
            onClick={() => fetchContextData(true)}
            disabled={refreshing}
            className="p-1"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          </Button>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              data-testid="toggle-context-panel"
              onClick={onToggle}
              className="p-1"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="w-full h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="characters" className="text-xs">Characters</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">AI Tips</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto">
            <TabsContent value="overview" className="mt-0 p-0">
              <div data-testid="overview-tab">
                {/* Progress Section */}
                {renderSection(
                  'progress',
                  'Writing Progress',
                  <TrendingUp className="w-4 h-4 text-blue-500" />,
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Book Progress</span>
                        <span>{contextData.currentProgress.completionPercentage}%</span>
                      </div>
                      <Progress value={contextData.currentProgress.completionPercentage} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-primary-600">
                          {contextData.currentProgress.totalWords.toLocaleString()}
                        </div>
                        <div className="text-gray-500">Words</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-primary-600">
                          {contextData.currentProgress.currentChapter} / {contextData.currentProgress.totalChapters}
                        </div>
                        <div className="text-gray-500">Chapters</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plot Threads */}
                {renderSection(
                  'plot-threads',
                  'Active Plot Threads',
                  <Map className="w-4 h-4 text-green-500" />,
                  <div className="space-y-2">
                    {contextData.plotThreads.map(renderPlotThread)}
                  </div>,
                  contextData.plotThreads.length
                )}

                {/* Recent Scenes */}
                {renderSection(
                  'recent-scenes',
                  'Recent Scenes',
                  <BookOpen className="w-4 h-4 text-purple-500" />,
                  <div className="space-y-2">
                    {contextData.recentScenes.map((scene) => (
                      <Card key={scene.id} data-testid={`recent-scene-${scene.id}`} className="p-3">
                        <h4 className="font-medium text-sm mb-1">{scene.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{scene.summary}</p>
                        {scene.keyEvents.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-700">Key Events:</p>
                            <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5">
                              {scene.keyEvents.map((event, index) => (
                                <li key={index}>{event}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>,
                  contextData.recentScenes.length
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="characters" className="mt-0 p-0">
              <div data-testid="characters-tab" className="p-3 space-y-2">
                {contextData.characters.map(renderCharacter)}
              </div>
            </TabsContent>
            
            <TabsContent value="suggestions" className="mt-0 p-0">
              <div data-testid="suggestions-tab" className="p-3 space-y-2">
                {contextData.suggestions.map(renderSuggestion)}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </Card>
  );
};

export default AIContextPanel;