"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

interface Scene {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "planned";
  wordCount: number;
  goal: string;
  conflict: string;
  outcome: string;
}

interface Chapter {
  id: string;
  title: string;
  orderIndex: number;
  status: string;
  wordCount: number;
  targetWordCount: number;
  scenes?: Scene[];
}

interface Part {
  id: string;
  title: string;
  orderIndex: number;
  chapters: Chapter[];
}

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts: Part[];
  chapters: Chapter[]; // Chapters not in parts
}

interface StoryTreeArchitectureProps {
  story: Story;
  currentChapterId?: string;
  currentSceneId?: string;
}

export function StoryTreeArchitecture({ story, currentChapterId, currentSceneId }: StoryTreeArchitectureProps) {
  const pathname = usePathname();
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const getChapterStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "published": return "🚀";
      case "in_progress": return "✏️";
      case "draft": return "📝";
      default: return "📝";
    }
  };

  const getSceneStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "in_progress": return "⏳";
      case "planned": return "📝";
      default: return "📝";
    }
  };

  const getProgressPercentage = (wordCount: number, targetWordCount: number) => {
    if (targetWordCount === 0) return 0;
    return Math.round((wordCount / targetWordCount) * 100);
  };

  const isCurrentChapter = (chapterId: string) => {
    return pathname === `/write/${chapterId}` || currentChapterId === chapterId;
  };

  const isCurrentScene = (sceneId: string) => {
    return currentSceneId === sceneId;
  };

  const togglePart = (partId: string) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partId)) {
        newSet.delete(partId);
      } else {
        newSet.add(partId);
      }
      return newSet;
    });
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>🏗️</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{story.title}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Badge variant="secondary" size="sm">{story.genre}</Badge>
              <Badge variant={story.status === 'publishing' ? 'success' : 'default'} size="sm">
                {story.status}
              </Badge>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Story Level */}
          <div className="border-l-2 border-blue-500 pl-3">
            <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              📖 Story Architecture
            </div>
            
            {/* Parts with Chapters and Scenes */}
            {story.parts.map((part) => (
              <div key={part.id} className="border-l-2 border-green-400 pl-3 mb-3">
                <div className="mb-2">
                  <button
                    onClick={() => togglePart(part.id)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-3 h-3 text-gray-400 transition-transform ${
                          expandedParts.has(part.id) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        📚 Part {part.orderIndex}: {part.title}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {part.chapters.length}
                      </Badge>
                    </div>
                  </button>
                </div>

                {expandedParts.has(part.id) && (
                  <div className="space-y-2">
                    {part.chapters.map((chapter) => (
                      <div key={chapter.id} className="border-l-2 border-orange-400 pl-3">
                        <div className="flex items-center justify-between mb-1">
                          <button
                            onClick={() => toggleChapter(chapter.id)}
                            className="flex items-center gap-2 flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                          >
                            <svg
                              className={`w-3 h-3 text-gray-400 transition-transform ${
                                expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>{getChapterStatusIcon(chapter.status)}</span>
                            <span className="text-sm text-orange-600 dark:text-orange-400 truncate">
                              Ch {chapter.orderIndex}: {chapter.title}
                            </span>
                          </button>
                          <Link
                            href={`/write/${chapter.id}`}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                              isCurrentChapter(chapter.id)
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium'
                                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {getProgressPercentage(chapter.wordCount, chapter.targetWordCount)}%
                          </Link>
                        </div>

                        {expandedChapters.has(chapter.id) && chapter.scenes && (
                          <div className="space-y-1 mt-2">
                            {chapter.scenes.map((scene, sceneIndex) => (
                              <div key={scene.id} className="border-l-2 border-purple-400 pl-3">
                                <div className={`flex items-center gap-2 p-1 rounded text-xs ${
                                  isCurrentScene(scene.id)
                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}>
                                  <span>{getSceneStatusIcon(scene.status)}</span>
                                  <span className="text-purple-600 dark:text-purple-400 truncate">
                                    Scene {sceneIndex + 1}: {scene.title}
                                  </span>
                                  <span className="text-gray-500">({scene.wordCount}w)</span>
                                </div>
                              </div>
                            ))}
                            <button className="border-l-2 border-purple-300 pl-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                              ➕ Add Scene
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    <button className="border-l-2 border-orange-300 pl-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      ➕ Add Chapter
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Standalone Chapters (not in parts) */}
            {story.chapters.length > 0 && (
              <div className="border-l-2 border-orange-400 pl-3">
                <div className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                  📄 Standalone Chapters
                </div>
                {story.chapters.map((chapter) => (
                  <div key={chapter.id} className="mb-2">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="flex items-center gap-2 flex-1 text-left hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
                      >
                        <svg
                          className={`w-3 h-3 text-gray-400 transition-transform ${
                            expandedChapters.has(chapter.id) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span>{getChapterStatusIcon(chapter.status)}</span>
                        <span className="text-sm truncate">{chapter.title}</span>
                      </button>
                      <Link
                        href={`/write/${chapter.id}`}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          isCurrentChapter(chapter.id)
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 font-medium'
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {getProgressPercentage(chapter.wordCount, chapter.targetWordCount)}%
                      </Link>
                    </div>

                    {expandedChapters.has(chapter.id) && chapter.scenes && (
                      <div className="space-y-1 mt-2 ml-4">
                        {chapter.scenes.map((scene, sceneIndex) => (
                          <div key={scene.id} className="border-l-2 border-purple-400 pl-3">
                            <div className={`flex items-center gap-2 p-1 rounded text-xs ${
                              isCurrentScene(scene.id)
                                ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              <span>{getSceneStatusIcon(scene.status)}</span>
                              <span className="text-purple-600 dark:text-purple-400 truncate">
                                Scene {sceneIndex + 1}: {scene.title}
                              </span>
                              <span className="text-gray-500">({scene.wordCount}w)</span>
                            </div>
                          </div>
                        ))}
                        <button className="border-l-2 border-purple-300 pl-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                          ➕ Add Scene
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-3">
              ➕ Add Part
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}