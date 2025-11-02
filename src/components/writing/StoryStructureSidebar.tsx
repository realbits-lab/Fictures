"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { TreeView, TreeDataItem } from "@/components/ui/tree-view";
import {
  BookOpen,
  FileText,
  Edit3,
  Camera,
  Users,
  MapPin
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

interface Character {
  id: string;
  name: string;
}

interface Setting {
  id: string;
  name: string;
}

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts: Part[];
  chapters: Chapter[];
  characters?: Character[];
  settings?: Setting[];
}

interface Selection {
  level: "story" | "part" | "chapter" | "scene" | "characters" | "settings";
  storyId: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  characterId?: string;
  settingId?: string;
  format?: "novel" | "comic"; // Which format the selection is for
}

interface StoryStructureSidebarProps {
  story: Story;
  currentSelection?: Selection;
  onSelectionChange?: (selection: Selection) => void;
  validatingStoryId?: string | null;
}

export function StoryStructureSidebar({
  story,
  currentSelection,
  onSelectionChange,
  validatingStoryId
}: StoryStructureSidebarProps) {
  // Function to generate tree data for a specific format
  const generateTreeData = (format: "novel" | "comic"): TreeDataItem[] => {
    const items: TreeDataItem[] = [];

    // Add story root item
    const storyItem: TreeDataItem = {
      id: `${format}-story-${story.id}`,
      name: story.title,
      icon: BookOpen,
      onClick: () => onSelectionChange?.({
        level: "story",
        storyId: story.id,
        format
      }),
      children: []
    };

    // Add parts and chapters
    if (story.parts && story.parts.length > 0) {
      console.log('📚 Processing parts for tree:', story.parts);
      // Sort parts by orderIndex before processing
      const sortedParts = [...story.parts].sort((a, b) => a.orderIndex - b.orderIndex);
      sortedParts.forEach(part => {
        console.log('📑 Processing part:', {
          id: part.id,
          title: part.title,
          chaptersCount: part.chapters?.length || 0,
          chapters: part.chapters
        });

        const partItem: TreeDataItem = {
          id: `${format}-part-${part.id}`,
          name: part.title, // Show only title
          icon: FileText,
          onClick: () => onSelectionChange?.({
            level: "part",
            storyId: story.id,
            partId: part.id,
            format
          }),
          children: []
        };

        // Add chapters under part - sort by orderIndex
        if (part.chapters && Array.isArray(part.chapters)) {
          const sortedChapters = [...part.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
          console.log(`  📚 Part "${part.title}" has ${sortedChapters.length} chapters`);

          sortedChapters.forEach(chapter => {
            console.log(`    📄 Processing chapter:`, {
              id: chapter.id,
              title: chapter.title,
              scenesCount: chapter.scenes?.length || 0,
              scenes: chapter.scenes
            });

            const chapterItem: TreeDataItem = {
              id: `${format}-chapter-${chapter.id}`,
              name: chapter.title, // Show only title
              icon: Edit3,
              onClick: () => onSelectionChange?.({
                level: "chapter",
                storyId: story.id,
                partId: part.id,
                chapterId: chapter.id,
                format
              }),
              children: []
            };

            // Add scenes under chapter - sort by orderIndex if available
            if (chapter.scenes && Array.isArray(chapter.scenes) && chapter.scenes.length > 0) {
              const sortedScenes = [...chapter.scenes].sort((a, b) => {
                // Use orderIndex if available, otherwise maintain original order
                const aIndex = (a as any).orderIndex ?? 999;
                const bIndex = (b as any).orderIndex ?? 999;
                return aIndex - bIndex;
              });
              console.log(`      🎬 Chapter "${chapter.title}" has ${sortedScenes.length} scenes`);

              sortedScenes.forEach(scene => {
                console.log(`        🎭 Adding scene: ${scene.title}`);
                chapterItem.children?.push({
                  id: `${format}-scene-${scene.id}`,
                  name: scene.title,
                  icon: Camera,
                  onClick: () => onSelectionChange?.({
                    level: "scene",
                    storyId: story.id,
                    partId: part.id,
                    chapterId: chapter.id,
                    sceneId: scene.id,
                    format
                  })
                });
              });
            } else {
              console.log(`      ⚠️ Chapter "${chapter.title}" has no scenes or scenes is not an array`);
            }

            partItem.children?.push(chapterItem);
          });
        } else {
          console.log(`  ⚠️ Part "${part.title}" has no chapters or chapters is not an array`);
        }

        storyItem.children?.push(partItem);
        console.log('✅ Added part to story children. Part has', partItem.children?.length, 'chapters');
      });
      console.log('📊 Story item with parts:', storyItem);
    } else {
      // No parts, add chapters directly under story - sort by orderIndex
      console.log('📚 No parts, processing standalone chapters:', story.chapters);
      const sortedChapters = [...story.chapters].sort((a, b) => a.orderIndex - b.orderIndex);
      sortedChapters.forEach(chapter => {
        console.log('📄 Processing standalone chapter:', {
          id: chapter.id,
          title: chapter.title,
          scenesCount: chapter.scenes?.length || 0,
          scenes: chapter.scenes
        });

        const chapterItem: TreeDataItem = {
          id: `${format}-chapter-${chapter.id}`,
          name: chapter.title, // Show only title
          icon: Edit3,
          onClick: () => onSelectionChange?.({
            level: "chapter",
            storyId: story.id,
            chapterId: chapter.id,
            format
          }),
          children: []
        };

        // Add scenes under chapter - sort by orderIndex if available
        if (chapter.scenes && Array.isArray(chapter.scenes) && chapter.scenes.length > 0) {
          const sortedScenes = [...chapter.scenes].sort((a, b) => {
            // Use orderIndex if available, otherwise maintain original order
            const aIndex = (a as any).orderIndex ?? 999;
            const bIndex = (b as any).orderIndex ?? 999;
            return aIndex - bIndex;
          });
          console.log(`  🎬 Standalone chapter "${chapter.title}" has ${sortedScenes.length} scenes`);

          sortedScenes.forEach(scene => {
            console.log(`    🎭 Adding scene: ${scene.title}`);
            chapterItem.children?.push({
              id: `${format}-scene-${scene.id}`,
              name: scene.title,
              icon: Camera,
              onClick: () => onSelectionChange?.({
                level: "scene",
                storyId: story.id,
                chapterId: chapter.id,
                sceneId: scene.id,
                format
              })
            });
          });
        } else {
          console.log(`  ⚠️ Standalone chapter "${chapter.title}" has no scenes or scenes is not an array`);
        }

        storyItem.children?.push(chapterItem);
      });
    }

    items.push(storyItem);
    console.log('🌳 Final tree items before Characters/Settings:', items);

    // Add Characters item with character list
    const charactersItem: TreeDataItem = {
      id: `${format}-characters`,
      name: "Characters",
      icon: Users,
      onClick: () => onSelectionChange?.({
        level: "characters",
        storyId: story.id,
        format
      }),
      children: []
    };

    // Add individual characters as children
    if (story.characters && story.characters.length > 0) {
      story.characters.forEach(character => {
        charactersItem.children?.push({
          id: `${format}-character-${character.id}`,
          name: character.name,
          icon: Users,
          onClick: () => onSelectionChange?.({
            level: "characters",
            storyId: story.id,
            characterId: character.id,
            format
          })
        });
      });
    }

    items.push(charactersItem);

    // Add Settings item with settings list
    const settingsItem: TreeDataItem = {
      id: `${format}-settings`,
      name: "Settings",
      icon: MapPin,
      onClick: () => onSelectionChange?.({
        level: "settings",
        storyId: story.id,
        format
      }),
      children: []
    };

    // Add individual settings as children
    if (story.settings && story.settings.length > 0) {
      story.settings.forEach(setting => {
        settingsItem.children?.push({
          id: `${format}-setting-${setting.id}`,
          name: setting.name,
          icon: MapPin,
          onClick: () => onSelectionChange?.({
            level: "settings",
            storyId: story.id,
            settingId: setting.id,
            format
          })
        });
      });
    }

    items.push(settingsItem);

    return items;
  };

  // Generate tree data for both formats
  const novelTreeData = useMemo(() => generateTreeData("novel"), [story, onSelectionChange]);
  const comicTreeData = useMemo(() => generateTreeData("comic"), [story, onSelectionChange]);

  // Get initial selected item ID for each format
  const getSelectedItemId = (format: "novel" | "comic") => {
    if (!currentSelection || currentSelection.format !== format) return undefined;

    const prefix = format;
    if (currentSelection.level === "story") return `${prefix}-story-${story.id}`;
    if (currentSelection.level === "part" && currentSelection.partId) return `${prefix}-part-${currentSelection.partId}`;
    if (currentSelection.level === "chapter" && currentSelection.chapterId) return `${prefix}-chapter-${currentSelection.chapterId}`;
    if (currentSelection.level === "scene" && currentSelection.sceneId) return `${prefix}-scene-${currentSelection.sceneId}`;
    if (currentSelection.level === "characters" && currentSelection.characterId) return `${prefix}-character-${currentSelection.characterId}`;
    if (currentSelection.level === "characters") return `${prefix}-characters`;
    if (currentSelection.level === "settings" && currentSelection.settingId) return `${prefix}-setting-${currentSelection.settingId}`;
    if (currentSelection.level === "settings") return `${prefix}-settings`;

    return undefined;
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Novel Tree View */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            📖 Novel View
            {validatingStoryId === story.id && (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin opacity-60"
                   title="Updating story data" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 flex-1 overflow-y-auto min-h-0">
          <TreeView
            data={novelTreeData}
            initialSelectedItemId={getSelectedItemId("novel")}
            expandAll={true}
          />
        </CardContent>
      </Card>

      {/* Comic Tree View */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            🎨 Comic View
            {validatingStoryId === story.id && (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-blue-400 rounded-full animate-spin opacity-60"
                   title="Updating story data" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2 flex-1 overflow-y-auto min-h-0">
          <TreeView
            data={comicTreeData}
            initialSelectedItemId={getSelectedItemId("comic")}
            expandAll={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}