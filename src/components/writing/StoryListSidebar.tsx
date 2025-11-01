"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

// Simple SVG icon components
const ChevronRight = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const ChevronDown = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const BookOpen = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const FileText = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const Edit3 = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

interface Scene {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "planned";
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  status: string;
  scenes?: Scene[];
}

interface Part {
  id: string;
  title: string;
  orderIndex: number;
  chapters: Chapter[];
}

interface StoryListItem {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts?: Part[];
  chapters?: Chapter[]; // Standalone chapters not in parts
  firstChapterId?: string;
  totalChapters: number;
  totalParts: number;
}

export type EditorLevel = "story" | "part" | "chapter" | "scene";

interface Selection {
  level: EditorLevel;
  storyId: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
}

interface DetailedStory {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts: Array<{
    id: string;
    title: string;
    orderIndex: number;
    chapters: Array<{
      id: string;
      title: string;
      orderIndex: number;
      status: string;
      scenes?: Scene[];
    }>;
  }>;
  chapters: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    scenes?: Scene[];
  }>;
}

interface StoryListSidebarProps {
  stories: StoryListItem[];
  currentStory: DetailedStory;
  currentSelection?: Selection;
  onSelectionChange?: (selection: Selection) => void;
  loadingStoryId?: string | null;
  validatingStoryId?: string | null;
}

export function StoryListSidebar({ 
  stories, 
  currentStory,
  currentSelection,
  onSelectionChange,
  loadingStoryId,
  validatingStoryId
}: StoryListSidebarProps) {
  const [expandedStories, setExpandedStories] = useState<Set<string>>(
    currentSelection ? new Set([currentSelection.storyId]) : new Set()
  );
  

  // Listen for story loaded event to auto-expand
  React.useEffect(() => {
    const handleStoryLoaded = (event: CustomEvent) => {
      const { storyId } = event.detail;
      setExpandedStories(prev => new Set(prev).add(storyId));
    };

    window.addEventListener('storyLoaded', handleStoryLoaded as EventListener);
    return () => {
      window.removeEventListener('storyLoaded', handleStoryLoaded as EventListener);
    };
  }, []);
  const [expandedParts, setExpandedParts] = useState<Set<string>>(
    currentSelection?.partId ? new Set([currentSelection.partId]) : new Set()
  );
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    currentSelection?.chapterId ? new Set([currentSelection.chapterId]) : new Set()
  );

  const toggleStoryExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const togglePartExpansion = (partId: string) => {
    const newExpanded = new Set(expandedParts);
    if (newExpanded.has(partId)) {
      newExpanded.delete(partId);
    } else {
      newExpanded.add(partId);
    }
    setExpandedParts(newExpanded);
  };

  const toggleChapterExpansion = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleStorySelect = (storyId: string) => {
    onSelectionChange?.({
      level: "story",
      storyId
    });
  };

  const handlePartSelect = (storyId: string, partId: string) => {
    onSelectionChange?.({
      level: "part",
      storyId,
      partId
    });
  };

  const handleChapterSelect = (storyId: string, partId: string | undefined, chapterId: string) => {
    onSelectionChange?.({
      level: "chapter",
      storyId,
      partId,
      chapterId
    });
  };

  const handleSceneSelect = (storyId: string, partId: string | undefined, chapterId: string, sceneId: string) => {
    onSelectionChange?.({
      level: "scene",
      storyId,
      partId,
      chapterId,
      sceneId
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return '🚀';
      case 'completed':
        return '✅';
      case 'in_progress':
        return '⏳';
      case 'planned':
        return '📋';
      default:
        return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen size={16} />
          All Stories
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {stories.map((story) => {
            const isStoryExpanded = expandedStories.has(story.id);
            const isCurrentStory = currentSelection?.storyId === story.id;

            return (
              <div key={story.id} className={`border rounded-lg p-2 transition-all duration-200 ${
                loadingStoryId === story.id
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 shadow-md skeleton-shimmer'
                  : isCurrentStory 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md' 
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}>
                {/* Story Header */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleStoryExpansion(story.id)}
                  >
                    {isStoryExpanded ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </Button>
                  
                  <Button
                    variant={isCurrentStory ? "primary" : "ghost"}
                    size="sm"
                    className="flex-1 justify-start h-8 text-xs"
                    onClick={() => handleStorySelect(story.id)}
                    disabled={loadingStoryId === story.id}
                  >
                    {loadingStoryId === story.id ? (
                      <>
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                        <span className="truncate">Loading...</span>
                      </>
                    ) : (
                      <>
                        <BookOpen size={12} className="mr-1" />
                        <span className="truncate">{story.title}</span>
                        {validatingStoryId === story.id && (
                          <div className="w-2 h-2 border border-gray-400 border-t-blue-400 rounded-full animate-spin ml-auto opacity-60" 
                               title="Updating story data in background" />
                        )}
                      </>
                    )}
                  </Button>
                </div>

                {/* Story Details */}
                <div className="ml-8 mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <Badge variant="info" className={`text-xs ${getStatusColor(story.status)}`}>
                    {getStatusIcon(story.status)} {story.status}
                  </Badge>
                  <span>{story.genre}</span>
                  <span>•</span>
                  <span>{story.totalParts}P/{story.totalChapters}C</span>
                </div>

                {/* Expanded Story Content */}
                {isStoryExpanded && (
                  <div className="ml-6 mt-2 space-y-1">
                    {/* Parts - Use detailed data for current story, basic data for others */}
                    {(() => {
                      const isCurrentStoryExpanded = story.id === currentStory.id;
                      const partsToRender = isCurrentStoryExpanded ? currentStory.parts : (story.parts || []);
                      
                      return partsToRender.length > 0 ? partsToRender.map((part) => {
                        const isPartExpanded = expandedParts.has(part.id);
                        const isCurrentPart = currentSelection?.partId === part.id;

                        return (
                          <div key={part.id} className="border-l-2 border-gray-200 pl-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => togglePartExpansion(part.id)}
                              >
                                {isPartExpanded ? (
                                  <ChevronDown size={10} />
                                ) : (
                                  <ChevronRight size={10} />
                                )}
                              </Button>
                              
                              <Button
                                variant={isCurrentPart ? "secondary" : "ghost"}
                                size="sm"
                                className="flex-1 justify-start h-7 text-xs"
                                onClick={() => handlePartSelect(story.id, part.id)}
                              >
                                <FileText size={10} className="mr-1" />
                                <span className="truncate">Part {part.orderIndex}: {part.title}</span>
                              </Button>
                            </div>

                            {/* Part Chapters */}
                            {isPartExpanded && part.chapters && (
                              <div className="ml-6 mt-1 space-y-1">
                                {part.chapters.map((chapter) => {
                                  const isChapterExpanded = expandedChapters.has(chapter.id);
                                  const isCurrentChapter = currentSelection?.chapterId === chapter.id;

                                  return (
                                    <div key={chapter.id} className="border-l-2 border-gray-100 pl-2">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => toggleChapterExpansion(chapter.id)}
                                          disabled={!chapter.scenes || chapter.scenes.length === 0}
                                        >
                                          {chapter.scenes && chapter.scenes.length > 0 ? (
                                            isChapterExpanded ? (
                                              <ChevronDown size={8} />
                                            ) : (
                                              <ChevronRight size={8} />
                                            )
                                          ) : (
                                            <div className="w-2 h-2" />
                                          )}
                                        </Button>
                                        
                                        <Button
                                          variant={isCurrentChapter ? "secondary" : "ghost"}
                                          size="sm"
                                          className="flex-1 justify-start h-6 text-xs"
                                          onClick={() => handleChapterSelect(story.id, part.id, chapter.id)}
                                        >
                                          <Edit3 size={8} className="mr-1" />
                                          <span className="truncate">Ch {chapter.orderIndex}: {chapter.title}</span>
                                          <span className="ml-auto text-xs text-gray-400">
                                            {getStatusIcon(chapter.status)}
                                          </span>
                                        </Button>
                                      </div>

                                      {/* Chapter Scenes */}
                                      {isChapterExpanded && chapter.scenes && (
                                        <div className="ml-6 mt-1 space-y-1">
                                          {chapter.scenes.map((scene) => {
                                            const isCurrentScene = currentSelection?.sceneId === scene.id;
                                            
                                            return (
                                              <Button
                                                key={scene.id}
                                                variant={isCurrentScene ? "secondary" : "ghost"}
                                                size="sm"
                                                className="w-full justify-start h-6 text-xs pl-4"
                                                onClick={() => handleSceneSelect(story.id, part.id, chapter.id, scene.id)}
                                              >
                                                <div className="w-2 h-2 rounded-full bg-current mr-2" />
                                                <span className="truncate">{scene.title}</span>
                                                <span className="ml-auto text-xs text-gray-400">
                                                </span>
                                              </Button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }) : null;
                    })()}

                    {/* Standalone Chapters */}
                    {(() => {
                      const isCurrentStoryExpanded = story.id === currentStory.id;
                      const chaptersToRender = isCurrentStoryExpanded ? currentStory.chapters : (story.chapters || []);
                      
                      return chaptersToRender && chaptersToRender.length > 0 ? (
                        <div className="border-l-2 border-gray-200 pl-2">
                          <div className="text-xs text-gray-500 mb-1">Standalone Chapters</div>
                          {chaptersToRender.map((chapter) => {
                          const isChapterExpanded = expandedChapters.has(chapter.id);
                          const isCurrentChapter = currentSelection?.chapterId === chapter.id;

                          return (
                            <div key={chapter.id} className="border-l-2 border-gray-100 pl-2">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleChapterExpansion(chapter.id)}
                                  disabled={!chapter.scenes || chapter.scenes.length === 0}
                                >
                                  {chapter.scenes && chapter.scenes.length > 0 ? (
                                    isChapterExpanded ? (
                                      <ChevronDown size={8} />
                                    ) : (
                                      <ChevronRight size={8} />
                                    )
                                  ) : (
                                    <div className="w-2 h-2" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant={isCurrentChapter ? "secondary" : "ghost"}
                                  size="sm"
                                  className="flex-1 justify-start h-6 text-xs"
                                  onClick={() => handleChapterSelect(story.id, undefined, chapter.id)}
                                >
                                  <Edit3 size={8} className="mr-1" />
                                  <span className="truncate">Ch {chapter.orderIndex}: {chapter.title}</span>
                                  <span className="ml-auto text-xs text-gray-400">
                                    {getStatusIcon(chapter.status)}
                                  </span>
                                </Button>
                              </div>

                              {/* Chapter Scenes */}
                              {isChapterExpanded && chapter.scenes && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {chapter.scenes.map((scene) => {
                                    const isCurrentScene = currentSelection?.sceneId === scene.id;
                                    
                                    return (
                                      <Button
                                        key={scene.id}
                                        variant={isCurrentScene ? "secondary" : "ghost"}
                                        size="sm"
                                        className="w-full justify-start h-6 text-xs pl-4"
                                        onClick={() => handleSceneSelect(story.id, undefined, chapter.id, scene.id)}
                                      >
                                        <div className="w-2 h-2 rounded-full bg-current mr-2" />
                                        <span className="truncate">{scene.title}</span>
                                        <span className="ml-auto text-xs text-gray-400">
                                        </span>
                                      </Button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                          })}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}