"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { TreeView, TreeDataItem } from "@/components/ui/tree-view";
import {
  BookOpen,
  FileText,
  Edit3,
  Camera,
  Users,
  MapPin,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

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

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts: Part[];
  chapters: Chapter[];
}

interface Selection {
  level: "story" | "part" | "chapter" | "scene" | "characters" | "settings";
  storyId: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
}

interface StoryStructureSidebarProps {
  story: Story;
  currentSelection?: Selection;
  onSelectionChange?: (selection: Selection) => void;
  validatingStoryId?: string | null;
  onSidebarCollapse?: (collapsed: boolean) => void;
}

export function StoryStructureSidebar({
  story,
  currentSelection,
  onSelectionChange,
  validatingStoryId,
  onSidebarCollapse
}: StoryStructureSidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandAll, setExpandAll] = useState(true);

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    onSidebarCollapse?.(newCollapsed);
  };

  // Convert story structure to TreeDataItem format
  const treeData = useMemo<TreeDataItem[]>(() => {
    const items: TreeDataItem[] = [];

    // Debug log to check story structure
    console.log('📊 StoryStructureSidebar - Story structure:', {
      id: story.id,
      title: story.title,
      partsLength: story.parts?.length || 0,
      chaptersLength: story.chapters?.length || 0,
      firstPart: story.parts?.[0],
      firstPartType: typeof story.parts?.[0],
      hasParts: !!story.parts,
      partsIsArray: Array.isArray(story.parts)
    });

    // Add story root item
    const storyItem: TreeDataItem = {
      id: `story-${story.id}`,
      name: story.title,
      icon: BookOpen,
      onClick: () => onSelectionChange?.({
        level: "story",
        storyId: story.id
      }),
      children: []
    };

    // Add parts and chapters
    if (story.parts && story.parts.length > 0) {
      console.log('📚 Processing parts for tree:', story.parts);
      // Sort parts by orderIndex before processing
      const sortedParts = [...story.parts].sort((a, b) => a.orderIndex - b.orderIndex);
      sortedParts.forEach(part => {
        console.log('📑 Processing part:', part);
        const partItem: TreeDataItem = {
          id: `part-${part.id}`,
          name: `Part ${part.orderIndex}: ${part.title}`,
          icon: FileText,
          onClick: () => onSelectionChange?.({
            level: "part",
            storyId: story.id,
            partId: part.id
          }),
          children: []
        };

        // Add chapters under part - sort by orderIndex
        const sortedChapters = [...part.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
        sortedChapters.forEach(chapter => {
          const chapterItem: TreeDataItem = {
            id: `chapter-${chapter.id}`,
            name: `Ch ${chapter.orderIndex}: ${chapter.title}`,
            icon: Edit3,
            onClick: () => onSelectionChange?.({
              level: "chapter",
              storyId: story.id,
              partId: part.id,
              chapterId: chapter.id
            }),
            children: []
          };

          // Add scenes under chapter - sort by orderIndex if available
          if (chapter.scenes && chapter.scenes.length > 0) {
            const sortedScenes = [...chapter.scenes].sort((a, b) => {
              // Use orderIndex if available, otherwise maintain original order
              const aIndex = (a as any).orderIndex ?? 999;
              const bIndex = (b as any).orderIndex ?? 999;
              return aIndex - bIndex;
            });
            sortedScenes.forEach(scene => {
              chapterItem.children?.push({
                id: `scene-${scene.id}`,
                name: scene.title,
                icon: Camera,
                onClick: () => onSelectionChange?.({
                  level: "scene",
                  storyId: story.id,
                  partId: part.id,
                  chapterId: chapter.id,
                  sceneId: scene.id
                })
              });
            });
          }

          partItem.children?.push(chapterItem);
        });

        storyItem.children?.push(partItem);
        console.log('✅ Added part to story children:', partItem);
      });
      console.log('📊 Story item with parts:', storyItem);
    } else {
      // No parts, add chapters directly under story - sort by orderIndex
      const sortedChapters = [...story.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
      sortedChapters.forEach(chapter => {
        const chapterItem: TreeDataItem = {
          id: `chapter-${chapter.id}`,
          name: `Ch ${chapter.orderIndex}: ${chapter.title}`,
          icon: Edit3,
          onClick: () => onSelectionChange?.({
            level: "chapter",
            storyId: story.id,
            chapterId: chapter.id
          }),
          children: []
        };

        // Add scenes under chapter - sort by orderIndex if available
        if (chapter.scenes && chapter.scenes.length > 0) {
          const sortedScenes = [...chapter.scenes].sort((a, b) => {
            // Use orderIndex if available, otherwise maintain original order
            const aIndex = (a as any).orderIndex ?? 999;
            const bIndex = (b as any).orderIndex ?? 999;
            return aIndex - bIndex;
          });
          sortedScenes.forEach(scene => {
            chapterItem.children?.push({
              id: `scene-${scene.id}`,
              name: scene.title,
              icon: Camera,
              onClick: () => onSelectionChange?.({
                level: "scene",
                storyId: story.id,
                chapterId: chapter.id,
                sceneId: scene.id
              })
            });
          });
        }

        storyItem.children?.push(chapterItem);
      });
    }

    items.push(storyItem);
    console.log('🌳 Final tree items before Characters/Settings:', items);

    // Add Characters item
    items.push({
      id: "characters",
      name: "Characters",
      icon: Users,
      onClick: () => onSelectionChange?.({
        level: "characters",
        storyId: story.id
      })
    });

    // Add Settings item
    items.push({
      id: "settings",
      name: "Settings",
      icon: MapPin,
      onClick: () => onSelectionChange?.({
        level: "settings",
        storyId: story.id
      })
    });

    return items;
  }, [story, onSelectionChange]);

  // Get initial selected item ID
  const initialSelectedItemId = useMemo(() => {
    if (!currentSelection) return undefined;

    if (currentSelection.level === "story") return `story-${story.id}`;
    if (currentSelection.level === "part" && currentSelection.partId) return `part-${currentSelection.partId}`;
    if (currentSelection.level === "chapter" && currentSelection.chapterId) return `chapter-${currentSelection.chapterId}`;
    if (currentSelection.level === "scene" && currentSelection.sceneId) return `scene-${currentSelection.sceneId}`;
    if (currentSelection.level === "characters") return "characters";
    if (currentSelection.level === "settings") return "settings";

    return undefined;
  }, [currentSelection, story.id]);

  if (sidebarCollapsed) {
    return (
      <div className="fixed left-2 top-1/2 transform -translate-y-1/2 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSidebar}
          className="h-12 w-8 p-0 rounded-full shadow-lg"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="h-fit max-h-[calc(100vh-8rem)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Story Structure
            {validatingStoryId === story.id && (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin opacity-60"
                   title="Updating story data" />
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
              className="h-6 w-6 p-0"
              title={expandAll ? "Collapse All" : "Expand All"}
            >
              {expandAll ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-6 w-6 p-0"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-2 overflow-auto max-h-[calc(100vh-12rem)]">
        <TreeView
          data={treeData}
          initialSelectedItemId={initialSelectedItemId}
          expandAll={expandAll}
        />
      </CardContent>
    </Card>
  );
}