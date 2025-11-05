"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { useStoryData } from "@/lib/hooks/useStoryData";
import { useWritingProgress, useWritingSession } from "@/hooks/useStoryWriter";
import { useCacheInvalidation } from "@/lib/hooks/use-cache-invalidation";
import { StoryStructureSidebar } from "./StoryStructureSidebar";
import { StudioAgentChat } from "@/components/studio/studio-agent-chat";
import { ImageContentDisplay } from "./ImageContentDisplay";
import { ContentLoadError } from "@/components/error/ContentLoadError";
import type { stories, parts, chapters, scenes, characters, settings } from '@/../drizzle/schema';

// Type aliases for backward compatibility
type StoryPart = typeof parts.$inferSelect;
type StoryChapter = typeof chapters.$inferSelect;
type StoryScene = typeof scenes.$inferSelect;
type StoryCharacter = typeof characters.$inferSelect;
type StorySetting = typeof settings.$inferSelect;
type StoryDocument = any; // This was a legacy type, keeping as any for now

// Extended Story interface to include database fields
interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  isPublic?: boolean;
  hnsData?: StoryDocument | Record<string, unknown>;
  // Database structure fields for compatibility
  parts: Array<{
    id: string;
    title: string;
    orderIndex: number;
    hnsData?: any;
    chapters: Array<{
      id: string;
      title: string;
      orderIndex: number;
      status: string;
      hnsData?: any;
      scenes?: Array<{
        id: string;
        title: string;
        status: "completed" | "in_progress" | "planned";
        goal: string;
        conflict: string;
        outcome: string;
        hnsData?: any;
      }>;
    }>;
  }>;
  chapters: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    hnsData?: any;
    scenes?: Array<{
      id: string;
      title: string;
      status: "completed" | "in_progress" | "planned";
      goal: string;
      conflict: string;
      outcome: string;
      hnsData?: any;
    }>;
  }>;
  scenes?: Array<{
    id: string;
    title: string;
    status: "completed" | "in_progress" | "planned";
    goal: string;
    conflict: string;
    outcome: string;
  }>;
}

export type EditorLevel = "story" | "part" | "chapter" | "scene" | "characters" | "settings";

interface Selection {
  level: EditorLevel;
  itemId?: string;
  storyId: string;
  partId?: string;
  chapterId?: string;
  sceneId?: string;
  characterId?: string;
  settingId?: string;
  format?: "novel" | "comic"; // Which format the selection is for
}

interface AllStoryListItem {
  id: string;
  title: string;
  genre: string;
  status: string;
  parts?: any[];
  chapters?: any[];
  firstChapterId?: string;
  totalChapters: number;
  totalParts: number;
}

interface UnifiedWritingEditorProps {
  story: Story;
  allStories?: AllStoryListItem[];
  initialSelection?: Selection;
  disabled?: boolean;
}

export function UnifiedWritingEditor({ story: initialStory, allStories, initialSelection, disabled = false }: UnifiedWritingEditorProps) {
  const componentMountTime = Date.now();
  console.log('\n🎨 [CLIENT] UnifiedWritingEditor component mounting');
  console.log(`📦 [CLIENT] Received story prop: ${initialStory.title} (ID: ${initialStory.id})`);
  console.log(`📊 [CLIENT] Story has ${initialStory.parts?.length || 0} parts`);

  const router = useRouter();
  const [story, setStory] = useState<Story>(initialStory);
  const [currentSelection, setCurrentSelection] = useState<Selection>(
    initialSelection || {
      level: "story",
      storyId: story.id
    }
  );

  console.log(`🎯 [CLIENT] Initial selection: ${initialSelection?.level || 'story'}`);

  const [jsonLevel, setJsonLevel] = useState<EditorLevel>("story");
  const [isLoading, setIsLoading] = useState(false);

  // Collapse states for YAML data displays
  const [storyDataCollapsed, setStoryDataCollapsed] = useState(false);

  // Panel refs for wheel event isolation
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Completely isolate wheel events for each panel
  useEffect(() => {
    const panels = [leftPanelRef.current, middlePanelRef.current, rightPanelRef.current];

    const handleWheel = (e: WheelEvent) => {
      // ALWAYS prevent default and stop propagation to completely isolate wheel events
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const canScroll = scrollHeight > clientHeight;

      // If element can scroll, manually update scrollTop
      if (canScroll) {
        const newScrollTop = scrollTop + e.deltaY;
        const maxScroll = scrollHeight - clientHeight;

        // Clamp scroll position to valid range
        target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
      }
      // If element cannot scroll, do nothing (event is already prevented)
    };

    panels.forEach((panel) => {
      if (panel) {
        panel.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      }
    });

    return () => {
      panels.forEach((panel) => {
        if (panel) {
          panel.removeEventListener('wheel', handleWheel, { capture: true });
        }
      });
    };
  }, []);

  // SWR hook for fetching story data when switching stories
  const [targetStoryId, setTargetStoryId] = useState<string | null>(null);
  const { story: swrStory, isLoading: isLoadingStory, isValidating: isValidatingStory, error: storyError } = useStoryData(targetStoryId);
  
  // SWR hook for current story to track background validation and get characters and places
  const { isValidating: isValidatingCurrentStory, characters: currentStoryCharacters, places: currentStoryPlaces } = useStoryData(story.id);
  
  // Writing progress and session tracking
  const writingProgress = useWritingProgress(
    story.id,
    currentSelection.chapterId || null,
    currentSelection.sceneId || null
  );
  const writingSession = useWritingSession(story.id);

  // Cache invalidation hook
  const { handleCacheInvalidation } = useCacheInvalidation();

  // Track writing session
  useEffect(() => {
    // Start a writing session when component mounts
    const session = writingSession.startSession();
    console.log('✍️ Started writing session for:', story.title);
    
    // Cleanup: End session when component unmounts
    return () => {
      const result = writingSession.endSession() as { duration: number; wordsWritten: number } | null;
      if (result) {
        console.log(`✅ Writing session ended: ${result.duration}ms, ${result.wordsWritten} words written`);
      }
    };
  }, [story.id, story.title, writingSession]);

  // Sync story state when prop changes
  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  // Handle SWR story data loading
  useEffect(() => {
    if (swrStory && !isLoadingStory) {
      setStory(swrStory as any);
      setCurrentSelection({
        level: "story",
        storyId: swrStory.id
      });
      setJsonLevel("story");
      // Signal to sidebar to expand the newly loaded story
      window.dispatchEvent(new CustomEvent('storyLoaded', { 
        detail: { storyId: swrStory.id }
      }));
      // Reset target story ID
      setTargetStoryId(null);
    }
  }, [swrStory, isLoadingStory]);
  
  // Save writing position when selection changes
  useEffect(() => {
    writingProgress.saveWritingState({
      chapterId: currentSelection.chapterId,
      sceneId: currentSelection.sceneId,
      lastEdited: new Date().toISOString(),
    });
  }, [currentSelection, writingProgress]);

  // Parse actual story data from database, fallback to default structure if not available
  const parseStoryData = (): StoryDocument => {
    let parsedData: any = null;

    // Use hnsData from the story
    const dataSource = story.hnsData;

    // Handle both JSON string and object cases
    if (dataSource) {
      if (typeof dataSource === 'object') {
        parsedData = dataSource;
      } else if (typeof dataSource === 'string') {
        try {
          parsedData = JSON.parse(dataSource);
        } catch (error) {
          console.error('Failed to parse story HNS data JSON:', error);
        }
      }
    }

    // Check if parsed data is already StoryDocument format
    if (parsedData && parsedData.story && parsedData.parts && parsedData.chapters) {
      return parsedData as StoryDocument;
    }

    // Convert legacy format to StoryDocument
    const hnsStory: any = {
      id: story.id,
      title: story.title || parsedData?.title || "Generated Story",
      genre: (Array.isArray(story.genre) ? story.genre : [story.genre || parsedData?.genre || "General"]) as any,
      premise: parsedData?.premise || "Story premise",
      dramatic_question: parsedData?.question || parsedData?.dramatic_question || "What is the central question of this story?",
      theme: parsedData?.theme || parsedData?.themes?.[0] || "Main theme",
      characters: parsedData?.characters || [],
      settings: parsedData?.settings || [],
      parts: parsedData?.parts?.map((p: any) => `part_${p.part || p.id}`) || []
    };

    // Convert parts to StoryPart format
    const hnsParts: any[] = story.parts.map((part, index) => ({
      part_id: part.id,
      part_title: part.title,
      structural_role: index === 0 ? 'Act 1: Setup' : index === 1 ? 'Act 2: Confrontation' : 'Act 3: Resolution',
      summary: parsedData?.parts?.[index]?.summary || `Summary for ${part.title}`,
      key_beats: parsedData?.parts?.[index]?.key_beats || [],
      chapters: part.chapters.map(ch => ch.id),
      chapter_count: part.chapters.length,
      scene_counts: part.chapters.map(ch => ch.scenes?.length || 0)
    }));

    // Convert chapters to StoryChapter format
    const hnsChapters: any[] = [];
    story.parts.forEach((part, partIndex) => {
      part.chapters.forEach((chapter, chapterIndex) => {
        hnsChapters.push({
          chapter_id: chapter.id,
          chapter_number: chapter.orderIndex,
          chapter_title: chapter.title,
          part_ref: part.id,
          summary: parsedData?.parts?.[partIndex]?.chapters?.[chapterIndex]?.summary || "",
          pacing_goal: 'medium',
          action_dialogue_ratio: "50:50",
          chapter_hook: {
            type: 'question',
            summary: parsedData?.parts?.[partIndex]?.chapters?.[chapterIndex]?.hook || "",
            urgency_level: 'medium'
          },
          scenes: chapter.scenes?.map(s => s.id) || []
        });
      });
    });

    // Convert scenes to StoryScene format
    const hnsScenes: any[] = [];
    story.parts.forEach((part) => {
      part.chapters.forEach((chapter) => {
        chapter.scenes?.forEach((scene, sceneIndex) => {
          hnsScenes.push({
            scene_id: scene.id,
            scene_number: sceneIndex + 1,
            scene_title: scene.title,
            chapter_ref: chapter.id,
            character_ids: [],
            setting_id: "",
            pov_character_id: "",
            narrative_voice: 'third_person_limited',
            summary: scene.title,
            entry_hook: "",
            goal: (scene as any).goal || "",
            conflict: (scene as any).conflict || "",
            outcome: (scene as any).outcome || "",
            emotional_shift: {
              from: "",
              to: ""
            }
          });
        });
      });
    });

    // Create empty arrays for characters and settings if not available
    const hnsCharacters: StoryCharacter[] = parsedData?.characters || [];
    const hnsSettings: StorySetting[] = parsedData?.settings || [];

    return {
      story: hnsStory,
      parts: hnsParts,
      chapters: hnsChapters,
      scenes: hnsScenes,
      characters: hnsCharacters,
      settings: hnsSettings
    };
  };

  // Real story data from database in HNS format
  const [sampleStoryData, setSampleStoryData] = useState<StoryDocument>(parseStoryData());

  // Update story data when story prop changes (for real-time updates)
  useEffect(() => {
    console.log('🔄 Story prop changed, updating story data...');
    console.log('📦 Story hnsData:', story.hnsData);

    const newStoryData = parseStoryData();
    console.log('📝 Parsed story data:', newStoryData);

    setSampleStoryData(newStoryData);

    console.log('✅ Story data state updated');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  const handleSelectionChange = async (selection: Selection) => {
    // If switching to a different story, trigger SWR fetch
    if (selection.level === "story" && selection.storyId !== story.id) {
      setTargetStoryId(selection.storyId);
      return;
    }
    
    // If clicking on the current story (level === "story"), show the story editor
    if (selection.level === "story" && selection.storyId === story.id) {
      setCurrentSelection(selection);
      setJsonLevel(selection.level);
      return;
    }
    
    // If switching to chapter level within the same story, update selection
    if (selection.level === "chapter" && selection.chapterId && selection.storyId === story.id) {
      // Only update if it's actually a different chapter or we're coming from a different level
      if (selection.chapterId !== currentSelection.chapterId || currentSelection.level !== "chapter") {
        console.log('Switching to chapter:', selection.chapterId, 'from current:', currentSelection.chapterId);
        setCurrentSelection(selection);
        setJsonLevel(selection.level);
        return;
      }
    }
    
    // If switching to a chapter in a different story, navigate to it
    if (selection.level === "chapter" && selection.chapterId && selection.storyId !== story.id) {
      router.push(`/studio/edit/${selection.chapterId}`);
      return;
    }

    // Handle Characters selection
    if (selection.level === "characters" && selection.storyId === story.id) {
      setCurrentSelection(selection);
      setJsonLevel(selection.level);
      return;
    }

    // Handle Settings selection
    if (selection.level === "settings" && selection.storyId === story.id) {
      setCurrentSelection(selection);
      setJsonLevel(selection.level);
      return;
    }

    // Otherwise, just update the current selection for the same story
    setCurrentSelection(selection);
    setJsonLevel(selection.level);
  };

  const handleSave = async (data: any) => {
    setIsLoading(true);
    try {
      // Check if this is scene data and we have a sceneId
      if (currentSelection.level === "scene" && currentSelection.sceneId && data) {
        // Save scene content and metadata to the scene API using JSON
        const sceneJsonData = {
          title: data.summary || `Scene ${data.id}`,
          content: data.content,
          goal: data.goal,
          conflict: data.obstacle,
          outcome: data.outcome,
          status: data.content && data.content.trim() ? 'in_progress' : 'draft'
        };

        const response = await fetch(`/studio/api/scenes/${currentSelection.sceneId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sceneJsonData)
        });

        if (!response.ok) {
          const responseText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          throw new Error(`Failed to save scene: ${errorData.error || response.statusText}`);
        }

        // ✅ CACHE INVALIDATION: Handle client-side cache invalidation
        handleCacheInvalidation(response.headers);

        console.log('Scene saved successfully');
      } else if (currentSelection.level === "chapter" && data) {
        // Save chapter HNS data
        console.log('💾 Saving chapter HNS data...');
        const response = await fetch(`/studio/api/chapters/${currentSelection.chapterId}/write`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hnsData: data
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save chapter: ${errorData.error || response.statusText}`);
        }

        // ✅ CACHE INVALIDATION: Handle client-side cache invalidation
        handleCacheInvalidation(response.headers);

        const saveResult = await response.json();
        console.log('✅ Chapter HNS data saved successfully:', saveResult);
      } else if (currentSelection.level === "story" && data) {
        // Save story data to the stories API
        console.log('💾 Saving story data to API...');
        console.log('📝 Data being saved:', data);
        console.log('🎯 Story ID:', story.id);

        const response = await fetch(`/studio/api/stories/${story.id}/write`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hnsData: data
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Save failed:', errorData);
          throw new Error(`Failed to save story: ${errorData.error || response.statusText}`);
        }

        // ✅ CACHE INVALIDATION: Handle client-side cache invalidation
        handleCacheInvalidation(response.headers);

        const saveResult = await response.json();
        console.log('✅ Story data saved successfully:', saveResult);

        // Important: Update local story state to reflect saved data
        console.log('🔄 Updating local story state with saved data...');
        setStory(prevStory => ({
          ...prevStory,
          hnsData: data,
          updatedAt: saveResult.updatedAt || new Date().toISOString()
        }));
      } else if (currentSelection.level === "part" && data) {
        // Save part HNS data
        console.log('💾 Saving part HNS data...');
        const response = await fetch(`/studio/api/parts/${currentSelection.partId}/write`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hnsData: data
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save part: ${errorData.error || response.statusText}`);
        }

        // ✅ CACHE INVALIDATION: Handle client-side cache invalidation
        handleCacheInvalidation(response.headers);

        const saveResult = await response.json();
        console.log('✅ Part HNS data saved successfully:', saveResult);
      } else {
        // For other data types, use the original mock behavior for now
        console.log('Saving data:', data);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Show user-friendly error message
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (data: any) => {
    setIsLoading(true);
    try {
      // Here you would generate parts/chapters/scenes based on the data
      console.log('Generating content:', data);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI generation
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!currentSelection.chapterId) return;
    
    // Find current chapter and its status
    let currentChapterStatus = 'draft';
    let currentChapter = null;
    
    for (const part of story.parts) {
      const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
      if (foundChapter) {
        currentChapter = foundChapter;
        currentChapterStatus = foundChapter.status || 'draft';
        break;
      }
    }
    if (!currentChapter) {
      const foundChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
      if (foundChapter) {
        currentChapter = foundChapter;
        currentChapterStatus = foundChapter.status || 'draft';
      }
    }
    
    // If chapter is marked as published but has no content, force it to draft status
    if (currentChapter && currentChapterStatus === 'published') {
      const hasScenes = currentChapter.scenes && currentChapter.scenes.length > 0;
      const scenesWithContent = currentChapter.scenes?.filter(s => (s as any).content && (s as any).content.trim() !== '') || [];
      const hasContent = scenesWithContent.length > 0;

      if (!hasContent && scenesWithContent.length === 0) {
        currentChapterStatus = 'draft';
      }
    }

    const isPublished = currentChapterStatus === 'published';
    
    // Check if trying to publish and validate scenes
    if (!isPublished) {
      const chapterScenes = currentChapter?.scenes || [];
      if (chapterScenes.length === 0) {
        alert('Cannot publish chapter without scenes. Please add at least one scene before publishing.');
        return;
      }
      const scenesWithContent = chapterScenes.filter(s => (s as any).content && (s as any).content.trim() !== '');
      if (scenesWithContent.length === 0) {
        alert('Cannot publish chapter with empty scenes. Please add content to at least one scene before publishing.');
        return;
      }
    }
    
    const endpoint = isPublished ? 'unpublish' : 'publish';
    const newStatus = isPublished ? 'completed' : 'published';
    
    setIsLoading(true);
    try {
      const response = await fetch(`/studio/api/chapters/${currentSelection.chapterId}/${endpoint}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${endpoint} chapter`);
      }
      
      const result = await response.json();
      console.log(`Chapter ${endpoint}ed successfully:`, result);
      
      // Update the story data to reflect the new status
      setStory(prevStory => {
        const updateChapterStatus = (chapters: any[]) => {
          return chapters.map(chapter => 
            chapter.id === currentSelection.chapterId 
              ? { 
                  ...chapter, 
                  status: newStatus, 
                  publishedAt: isPublished ? null : new Date() 
                }
              : chapter
          );
        };

        return {
          ...prevStory,
          parts: prevStory.parts.map(part => ({
            ...part,
            chapters: updateChapterStatus(part.chapters)
          })),
          chapters: updateChapterStatus(prevStory.chapters)
        };
      });
      
    } catch (error) {
      console.error(`${endpoint} error:`, error);
      alert(`Failed to ${endpoint} chapter. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisibilityToggle = async () => {
    const currentVisibility = story.status === 'published';
    const newVisibility = !currentVisibility;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/studio/api/stories/${story.id}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: newVisibility }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update story visibility');
      }
      
      const result = await response.json();
      console.log(`Story visibility updated:`, result);
      
      // Update the story data to reflect the new visibility
      setStory(prevStory => ({
        ...prevStory,
        status: newVisibility ? 'published' : 'completed',
      }));
      
      // Show confirmation toast
      const action = newVisibility ? 'public' : 'private';
      const message = newVisibility
        ? 'Story is now public! It will appear in the community hub for discussions.'
        : 'Story is now private! It has been removed from the community hub.';

      toast.success(message, {
        duration: 5000,
        icon: newVisibility ? '🌍' : '🔒',
        position: 'top-right',
        closeButton: true,
      });
      
    } catch (error) {
      console.error('Visibility toggle error:', error);
      toast.error('Failed to update story visibility. Please try again.', {
        duration: 5000,
        position: 'top-right',
        closeButton: true,
      });
    } finally {
      setIsLoading(false);
    }
  };



  const handleToggleSceneStatus = async (sceneId: string, currentStatus: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent scene edit navigation
    
    setIsLoading(true);
    try {
      // Determine next status based on current status
      let nextStatus: string;
      if (currentStatus === 'planned') {
        nextStatus = 'in_progress';
      } else if (currentStatus === 'in_progress') {
        nextStatus = 'completed';
      } else { // completed
        nextStatus = 'in_progress';
      }
      
      // Update scene status via API using JSON
      const response = await fetch(`/studio/api/scenes/${sceneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: nextStatus
        })
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText };
        }
        console.error('Scene status update failed:', errorData);
        throw new Error(`Failed to update scene status: ${errorData.error || 'Unknown error'}`);
      }

      // Refresh the page to show updated status
      router.refresh();
      
    } catch (error) {
      console.error('Failed to update scene status:', error);
      alert('Failed to update scene status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create part data based on actual story data
  const createPartData = (partNum: number, partTitle: string) => {
    // Get part data from actual story data if available
    const currentPart = sampleStoryData.parts.find((p: any) => p.part_title === partTitle || p.part_id === `part_${partNum}`);

    return {
      part: partNum,
      title: partTitle,
      words: partNum === 2 ? 40000 : 20000, // Middle part typically longer
      function: partNum === 1 ? "story_setup" :
               partNum === 2 ? "story_development" :
               "story_resolution",
      goal: currentPart?.summary || `Part ${partNum} goal from ${sampleStoryData.story.story_title}`,
      conflict: `Part ${partNum} conflict from ${sampleStoryData.story.story_title}`,
      outcome: `Part ${partNum} outcome from ${sampleStoryData.story.story_title}`,
      questions: {
        primary: `What is the main question for Part ${partNum} of ${sampleStoryData.story.story_title}?`,
        secondary: `What is the secondary question for Part ${partNum} of ${sampleStoryData.story.story_title}?`
      },
      chars: (sampleStoryData as any).chars || {},
      plot: {
        events: [],
        reveals: [],
        escalation: []
      },
      emotion: {
        start: `Part ${partNum} emotional start`,
        progression: [],
        end: `Part ${partNum} emotional end`
      }
    };
  };

  // Helper function to find scene data
  const findSceneData = () => {
    let selectedScene = null;
    let selectedSceneChapter = null;
    let sceneNumber = 1;

    // First try to find the scene in the currently selected chapter (if we're coming from chapter view)
    if (currentSelection.chapterId) {
      // Look through all chapters in parts
      for (const part of story.parts) {
        const chapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
        if (chapter && chapter.scenes) {
          const foundSceneIndex = chapter.scenes.findIndex(scene => scene.id === currentSelection.sceneId);
          if (foundSceneIndex !== -1) {
            selectedScene = chapter.scenes[foundSceneIndex];
            selectedSceneChapter = chapter;
            sceneNumber = foundSceneIndex + 1;
            break;
          }
        }
      }

      // Look in standalone chapters if not found in parts
      if (!selectedScene) {
        const chapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
        if (chapter && chapter.scenes) {
          const foundSceneIndex = chapter.scenes.findIndex(scene => scene.id === currentSelection.sceneId);
          if (foundSceneIndex !== -1) {
            selectedScene = chapter.scenes[foundSceneIndex];
            selectedSceneChapter = chapter;
            sceneNumber = foundSceneIndex + 1;
          }
        }
      }
    }

    // Fallback: search all chapters if we couldn't find it in the current chapter
    if (!selectedScene) {
      // Look through all chapters in parts
      for (const part of story.parts) {
        for (const chapter of part.chapters) {
          if (chapter.scenes) {
            const foundSceneIndex = chapter.scenes.findIndex(scene => scene.id === currentSelection.sceneId);
            if (foundSceneIndex !== -1) {
              selectedScene = chapter.scenes[foundSceneIndex];
              selectedSceneChapter = chapter;
              sceneNumber = foundSceneIndex + 1;
              break;
            }
          }
        }
        if (selectedScene) break;
      }

      // Look in standalone chapters if not found in parts
      if (!selectedScene) {
        for (const chapter of story.chapters) {
          if (chapter.scenes) {
            const foundSceneIndex = chapter.scenes.findIndex(scene => scene.id === currentSelection.sceneId);
            if (foundSceneIndex !== -1) {
              selectedScene = chapter.scenes[foundSceneIndex];
              selectedSceneChapter = chapter;
              sceneNumber = foundSceneIndex + 1;
              break;
            }
          }
        }
      }
    }

    // Create scene data based on selection
    const createSceneData = (scene: any, sceneNum: number) => ({
      id: scene?.id || currentSelection.sceneId || `scene-${sceneNum}`,
      summary: scene?.title || `Scene ${sceneNum}`,
      time: sceneNum === 1 ? "morning" : sceneNum === 2 ? "afternoon" : "evening",
      place: scene?.title?.toLowerCase().includes('apartment') ? "elena_apartment" :
             scene?.title?.toLowerCase().includes('office') ? "maya_office" : "location",
      pov: "maya",
      characters: {
        maya: { enters: "determined", exits: "conflicted" },
        elena: { status: scene?.id?.includes('elena') ? "present" : "referenced" }
      },
      goal: scene?.goal || `Accomplish scene ${sceneNum} objective`,
      obstacle: scene?.conflict || "Internal and external challenges",
      outcome: scene?.outcome || "Scene resolution",
      beats: [
        "Opening beat - establish scene",
        "Development - character actions",
        "Conflict - obstacles arise",
        "Resolution - scene conclusion"
      ],
      shift: "emotional_progression",
      leads_to: `scene_${sceneNum + 1}`,
      image_prompt: `Scene ${sceneNum} visual description for ${selectedSceneChapter?.title || 'chapter'}`,
      content: scene?.content || "",
    });

    const sceneData = selectedScene ?
      createSceneData(selectedScene, sceneNumber) :
      createSceneData(null, sceneNumber);

    return { sceneData, selectedSceneChapter, sceneNumber };
  };

  const renderEditor = () => {
    switch (currentSelection.level) {
      case "story":
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📖 Story Details - All Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{story.id}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{story.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Genre</td>
                        <td className="py-2 px-4">{story.genre || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Status</td>
                        <td className="py-2 px-4">
                          <Badge variant={story.status === 'published' ? 'default' : 'secondary'}>
                            {story.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Author ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(story as any).authorId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">View Count</td>
                        <td className="py-2 px-4">{(story as any).viewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Rating</td>
                        <td className="py-2 px-4">{(story as any).rating ? ((story as any).rating / 10).toFixed(1) : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Rating Count</td>
                        <td className="py-2 px-4">{(story as any).ratingCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image URL</td>
                        <td className="py-2 px-4">
                          {(story as any).imageUrl ? (
                            <a href={(story as any).imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                              {(story as any).imageUrl}
                            </a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image Variants</td>
                        <td className="py-2 px-4">
                          {(story as any).imageVariants ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify((story as any).imageVariants, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Summary</td>
                        <td className="py-2 px-4">{(story as any).summary || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Tone</td>
                        <td className="py-2 px-4">{(story as any).tone || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Moral Framework</td>
                        <td className="py-2 px-4">
                          {(story as any).moralFramework ? (
                            <div className="max-h-40 overflow-auto text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                              {(story as any).moralFramework}
                            </div>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                        <td className="py-2 px-4">{(story as any).createdAt ? new Date((story as any).createdAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                        <td className="py-2 px-4">{(story as any).updatedAt ? new Date((story as any).updatedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Parts Count</td>
                        <td className="py-2 px-4">{story.parts?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapters Count</td>
                        <td className="py-2 px-4">{story.chapters?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Total Scenes</td>
                        <td className="py-2 px-4">
                          {(() => {
                            let totalScenes = 0;
                            story.parts?.forEach(part => {
                              part.chapters?.forEach(chapter => {
                                totalScenes += chapter.scenes?.length || 0;
                              });
                            });
                            story.chapters?.forEach(chapter => {
                              totalScenes += chapter.scenes?.length || 0;
                            });
                            return totalScenes;
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "part":
        const selectedPart = story.parts.find(p => p.id === currentSelection.partId);
        if (!selectedPart) {
          return (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Part not found
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📚 Part Details - All Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{selectedPart.id}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{selectedPart.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Story ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedPart as any).storyId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Author ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedPart as any).authorId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Order Index</td>
                        <td className="py-2 px-4">{selectedPart.orderIndex}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Summary</td>
                        <td className="py-2 px-4">{(selectedPart as any).summary || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Character Arcs</td>
                        <td className="py-2 px-4">
                          {(selectedPart as any).characterArcs ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                              {JSON.stringify((selectedPart as any).characterArcs, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapters Count</td>
                        <td className="py-2 px-4">{selectedPart.chapters?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Total Scenes</td>
                        <td className="py-2 px-4">
                          {selectedPart.chapters?.reduce((total, ch) => total + (ch.scenes?.length || 0), 0)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                        <td className="py-2 px-4">{(selectedPart as any).createdAt ? new Date((selectedPart as any).createdAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                        <td className="py-2 px-4">{(selectedPart as any).updatedAt ? new Date((selectedPart as any).updatedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case "chapter":
        // Find the selected chapter from story structure
        let selectedChapter = null;
        let selectedPartTitle = null;
        let selectedPartData = null;
        
        // Look in parts first
        for (const part of story.parts) {
          const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
          if (foundChapter) {
            selectedChapter = foundChapter;
            selectedPartTitle = part.title;
            // Create part data based on the part information
            selectedPartData = {
              ...part,
              part: part.orderIndex,
              words: (part as any).targetWordCount || 20000,
              function: (part as any).function || "story_setup",
              goal: (part as any).goal || "",
              conflict: (part as any).conflict || "",
              outcome: (part as any).outcome || ""
            };
            break;
          }
        }
        
        // Look in standalone chapters if not found in parts
        if (!selectedChapter) {
          selectedChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
        }
        
        // Create chapter data only if chapter exists, otherwise show empty state
        const createChapterData = (chapter: any, partTitle: string | null) => {
          // Check if chapter has any actual content
          const hasScenes = chapter.scenes && chapter.scenes.length > 0;
          const scenesWithContent = chapter.scenes?.filter((s: any) => s.content && s.content.trim() !== '') || [];
          const hasContent = scenesWithContent.length > 0;

          // If chapter is marked as published but has no content, force it to draft status
          let actualStatus = chapter.status || 'draft';
          if (actualStatus === 'published' && !hasContent && scenesWithContent.length === 0) {
            console.warn(`Chapter ${chapter.id} (${chapter.title}) is marked as published but has no content. Showing as draft.`);
            actualStatus = 'draft';
          }
          
          return {
            id: chapter.id,
            title: chapter.title,
            partTitle: partTitle || "Standalone",
            status: actualStatus,
            purpose: chapter.purpose || "",
            hook: chapter.hook || "",
            scenes: chapter.scenes || []
          };
        };
        
        // Only create chapter data if we found the actual chapter
        const chapterData = selectedChapter ? 
          createChapterData(selectedChapter, selectedPartTitle) : 
          null;
        
        // If no chapter data found, show empty state
        if (!chapterData) {
          return (
            <ContentLoadError
              title="Chapter Not Found"
              message={`We couldn't find chapter ${currentSelection.chapterId}. It may have been deleted or the link is incorrect.`}
              icon="chapter"
              onRetry={() => handleSelectionChange({ level: "story", storyId: story.id })}
              compact={false}
            />
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📝 Chapter Details - All Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{selectedChapter?.id}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{selectedChapter?.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Summary</td>
                        <td className="py-2 px-4">{(selectedChapter as any).summary || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Story ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedChapter as any).storyId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Part ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedChapter as any).partId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Part</td>
                        <td className="py-2 px-4">{selectedPartTitle || 'Standalone'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Author ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedChapter as any).authorId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Order Index</td>
                        <td className="py-2 px-4">{selectedChapter?.orderIndex}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Status</td>
                        <td className="py-2 px-4">
                          <Badge variant={selectedChapter?.status === 'published' ? 'default' : 'secondary'}>
                            {selectedChapter?.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Purpose</td>
                        <td className="py-2 px-4">{(selectedChapter as any).purpose || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Hook</td>
                        <td className="py-2 px-4">{(selectedChapter as any).hook || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Character Focus</td>
                        <td className="py-2 px-4">{(selectedChapter as any).characterFocus || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Published At</td>
                        <td className="py-2 px-4">{(selectedChapter as any).publishedAt ? new Date((selectedChapter as any).publishedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Scheduled For</td>
                        <td className="py-2 px-4">{(selectedChapter as any).scheduledFor ? new Date((selectedChapter as any).scheduledFor).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Character ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedChapter as any).characterId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Arc Position</td>
                        <td className="py-2 px-4">{(selectedChapter as any).arcPosition || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Contributes to Macro Arc</td>
                        <td className="py-2 px-4">{(selectedChapter as any).contributesToMacroArc || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Focus Characters</td>
                        <td className="py-2 px-4">
                          {(selectedChapter as any).focusCharacters && (selectedChapter as any).focusCharacters.length > 0 ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                              {JSON.stringify((selectedChapter as any).focusCharacters, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Adversity Type</td>
                        <td className="py-2 px-4">{(selectedChapter as any).adversityType || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Virtue Type</td>
                        <td className="py-2 px-4">{(selectedChapter as any).virtueType || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Seeds Planted</td>
                        <td className="py-2 px-4">
                          {(selectedChapter as any).seedsPlanted && (selectedChapter as any).seedsPlanted.length > 0 ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                              {JSON.stringify((selectedChapter as any).seedsPlanted, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Seeds Resolved</td>
                        <td className="py-2 px-4">
                          {(selectedChapter as any).seedsResolved && (selectedChapter as any).seedsResolved.length > 0 ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                              {JSON.stringify((selectedChapter as any).seedsResolved, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Connects to Previous Chapter</td>
                        <td className="py-2 px-4">{(selectedChapter as any).connectsToPreviousChapter || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Creates Next Adversity</td>
                        <td className="py-2 px-4">{(selectedChapter as any).createsNextAdversity || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Scenes Count</td>
                        <td className="py-2 px-4">{selectedChapter?.scenes?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                        <td className="py-2 px-4">{(selectedChapter as any).createdAt ? new Date((selectedChapter as any).createdAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                        <td className="py-2 px-4">{(selectedChapter as any).updatedAt ? new Date((selectedChapter as any).updatedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "scene":
        // Check if this is a comic view selection - show images only
        if (currentSelection.format === "comic") {
          return (
            <ImageContentDisplay
              type="scene"
              format="comic"
              itemId={currentSelection.sceneId || ""}
              storyId={story.id}
            />
          );
        }

        // Novel view - show table data
        // Find the selected scene
        let selectedScene = null;
        let selectedSceneChapter = null;
        let selectedScenePart = null;

        // Look in parts first
        for (const part of story.parts) {
          for (const chapter of part.chapters) {
            const foundScene = chapter.scenes?.find(s => s.id === currentSelection.sceneId);
            if (foundScene) {
              selectedScene = foundScene;
              selectedSceneChapter = chapter;
              selectedScenePart = part;
              break;
            }
          }
          if (selectedScene) break;
        }

        // Look in standalone chapters if not found in parts
        if (!selectedScene) {
          for (const chapter of story.chapters) {
            const foundScene = chapter.scenes?.find(s => s.id === currentSelection.sceneId);
            if (foundScene) {
              selectedScene = foundScene;
              selectedSceneChapter = chapter;
              break;
            }
          }
        }

        if (!selectedScene) {
          return (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                Scene not found
              </CardContent>
            </Card>
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🎬 Scene Details - All Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{selectedScene.id}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{selectedScene.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Content</td>
                        <td className="py-2 px-4">
                          {(selectedScene as any).content ? (
                            <div className="max-h-40 overflow-auto text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                              {(selectedScene as any).content}
                            </div>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapter ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedScene as any).chapterId || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapter</td>
                        <td className="py-2 px-4">{selectedSceneChapter?.title || 'Unknown'}</td>
                      </tr>
                      {selectedScenePart && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Part</td>
                          <td className="py-2 px-4">{selectedScenePart.title}</td>
                        </tr>
                      )}
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Order Index</td>
                        <td className="py-2 px-4">{(selectedScene as any).orderIndex}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image URL</td>
                        <td className="py-2 px-4">
                          {(selectedScene as any).imageUrl ? (
                            <a href={(selectedScene as any).imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                              {(selectedScene as any).imageUrl}
                            </a>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image Variants</td>
                        <td className="py-2 px-4">
                          {(selectedScene as any).imageVariants ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                              {JSON.stringify((selectedScene as any).imageVariants, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Summary</td>
                        <td className="py-2 px-4">{(selectedScene as any).summary || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Cycle Phase</td>
                        <td className="py-2 px-4">{(selectedScene as any).cyclePhase || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Emotional Beat</td>
                        <td className="py-2 px-4">{(selectedScene as any).emotionalBeat || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Character Focus</td>
                        <td className="py-2 px-4">
                          {(selectedScene as any).characterFocus ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                              {JSON.stringify((selectedScene as any).characterFocus, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Sensory Anchors</td>
                        <td className="py-2 px-4">
                          {(selectedScene as any).sensoryAnchors ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                              {JSON.stringify((selectedScene as any).sensoryAnchors, null, 2)}
                            </pre>
                          ) : 'N/A'}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Dialogue vs Description</td>
                        <td className="py-2 px-4">{(selectedScene as any).dialogueVsDescription || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Suggested Length</td>
                        <td className="py-2 px-4">{(selectedScene as any).suggestedLength || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Published At</td>
                        <td className="py-2 px-4">{(selectedScene as any).publishedAt ? new Date((selectedScene as any).publishedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Scheduled For</td>
                        <td className="py-2 px-4">{(selectedScene as any).scheduledFor ? new Date((selectedScene as any).scheduledFor).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Visibility</td>
                        <td className="py-2 px-4">{(selectedScene as any).visibility || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Auto Publish</td>
                        <td className="py-2 px-4">{(selectedScene as any).autoPublish ? 'Yes' : 'No'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Published By</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedScene as any).publishedBy || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Unpublished At</td>
                        <td className="py-2 px-4">{(selectedScene as any).unpublishedAt ? new Date((selectedScene as any).unpublishedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Unpublished By</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedScene as any).unpublishedBy || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Status</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicStatus || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Published At</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicPublishedAt ? new Date((selectedScene as any).comicPublishedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Published By</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedScene as any).comicPublishedBy || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Unpublished At</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicUnpublishedAt ? new Date((selectedScene as any).comicUnpublishedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Unpublished By</td>
                        <td className="py-2 px-4 font-mono text-xs">{(selectedScene as any).comicUnpublishedBy || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Generated At</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicGeneratedAt ? new Date((selectedScene as any).comicGeneratedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Panel Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicPanelCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Version</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicVersion || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).viewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Unique View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).uniqueViewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Novel View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).novelViewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Novel Unique View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).novelUniqueViewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicViewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Comic Unique View Count</td>
                        <td className="py-2 px-4">{(selectedScene as any).comicUniqueViewCount || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Last Viewed At</td>
                        <td className="py-2 px-4">{(selectedScene as any).lastViewedAt ? new Date((selectedScene as any).lastViewedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                        <td className="py-2 px-4">{(selectedScene as any).createdAt ? new Date((selectedScene as any).createdAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                        <td className="py-2 px-4">{(selectedScene as any).updatedAt ? new Date((selectedScene as any).updatedAt).toLocaleString() : 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "characters":
        // If no characterId, show nothing (clicked on parent node)
        if (!currentSelection.characterId) {
          return null;
        }

        // Check if this is a comic view selection - show images only
        if (currentSelection.format === "comic") {
          return (
            <ImageContentDisplay
              type="character"
              format="comic"
              itemId={currentSelection.characterId || ""}
              storyId={story.id}
            />
          );
        }

        // Novel view - show table data
        // Find the specific character by ID
        const selectedCharacter = (story as any).characters?.find((c: any) => c.id === currentSelection.characterId);

        if (!selectedCharacter) {
          return (
            <ContentLoadError
              title="Character Not Found"
              message={`We couldn't find a character with ID ${currentSelection.characterId}. It may have been deleted or the link is incorrect.`}
              icon="character"
              onRetry={() => window.location.reload()}
              compact={false}
            />
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>👥 Character Details - {selectedCharacter.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                        <td className="py-2 px-4 font-mono text-xs">{selectedCharacter.id}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Name</td>
                                <td className="py-2 px-4">{selectedCharacter.name}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Story ID</td>
                                <td className="py-2 px-4 font-mono text-xs">{selectedCharacter.storyId || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Is Main</td>
                                <td className="py-2 px-4">{selectedCharacter.isMain ? 'Yes' : 'No'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Content</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.content ? (
                                    <div className="max-h-40 overflow-auto text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded">
                                      {selectedCharacter.content}
                                    </div>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image URL</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.imageUrl ? (
                                    <a href={selectedCharacter.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                      {selectedCharacter.imageUrl}
                                    </a>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image Variants</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.imageVariants ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.imageVariants, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Role</td>
                                <td className="py-2 px-4">{selectedCharacter.role || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Archetype</td>
                                <td className="py-2 px-4">{selectedCharacter.archetype || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Summary</td>
                                <td className="py-2 px-4">{selectedCharacter.summary || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Storyline</td>
                                <td className="py-2 px-4">{selectedCharacter.storyline || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Personality</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.personality ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.personality, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Backstory</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.backstory ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.backstory, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Motivations</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.motivations ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.motivations, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Voice</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.voice ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.voice, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Physical Description</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.physicalDescription ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.physicalDescription, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Visual Reference ID</td>
                                <td className="py-2 px-4 font-mono text-xs">{selectedCharacter.visualReferenceId || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Core Trait</td>
                                <td className="py-2 px-4">{selectedCharacter.coreTrait || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Internal Flaw</td>
                                <td className="py-2 px-4">{selectedCharacter.internalFlaw || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">External Goal</td>
                                <td className="py-2 px-4">{selectedCharacter.externalGoal || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Relationships</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.relationships ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                                      {JSON.stringify(selectedCharacter.relationships, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Voice Style</td>
                                <td className="py-2 px-4">
                                  {selectedCharacter.voiceStyle ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedCharacter.voiceStyle, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Visual Style</td>
                                <td className="py-2 px-4">{selectedCharacter.visualStyle || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                                <td className="py-2 px-4">{selectedCharacter.createdAt ? new Date(selectedCharacter.createdAt).toLocaleString() : 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                                <td className="py-2 px-4">{selectedCharacter.updatedAt ? new Date(selectedCharacter.updatedAt).toLocaleString() : 'N/A'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
              </CardContent>
            </Card>
          </div>
        );

      case "settings":
        // If no settingId, show nothing (clicked on parent node)
        if (!currentSelection.settingId) {
          return null;
        }

        // Check if this is a comic view selection - show images only
        if (currentSelection.format === "comic") {
          return (
            <ImageContentDisplay
              type="setting"
              format="comic"
              itemId={currentSelection.settingId || ""}
              storyId={story.id}
            />
          );
        }

        // Novel view - show table data
        // Find the specific setting by ID
        const selectedSetting = (story as any).settings?.find((s: any) => s.id === currentSelection.settingId);

        if (!selectedSetting) {
          return (
            <ContentLoadError
              title="Setting Not Found"
              message={`We couldn't find a setting with ID ${currentSelection.settingId}. It may have been deleted or the link is incorrect.`}
              icon="setting"
              onRetry={() => window.location.reload()}
              compact={false}
            />
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🗺️ Setting Details - {selectedSetting.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">ID</td>
                                <td className="py-2 px-4 font-mono text-xs">{selectedSetting.id}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Name</td>
                                <td className="py-2 px-4">{selectedSetting.name}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Story ID</td>
                                <td className="py-2 px-4 font-mono text-xs">{selectedSetting.storyId || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Description</td>
                                <td className="py-2 px-4">{selectedSetting.description || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Mood</td>
                                <td className="py-2 px-4">{selectedSetting.mood || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Sensory</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.sensory ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedSetting.sensory, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Visual Style</td>
                                <td className="py-2 px-4">{selectedSetting.visualStyle || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Visual References</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.visualReferences ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                                      {JSON.stringify(selectedSetting.visualReferences, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Color Palette</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.colorPalette ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
                                      {JSON.stringify(selectedSetting.colorPalette, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Architectural Style</td>
                                <td className="py-2 px-4">{selectedSetting.architecturalStyle || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image URL</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.imageUrl ? (
                                    <a href={selectedSetting.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                      {selectedSetting.imageUrl}
                                    </a>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Image Variants</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.imageVariants ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-40">
                                      {JSON.stringify(selectedSetting.imageVariants, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Adversity Elements</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.adversityElements ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                                      {JSON.stringify(selectedSetting.adversityElements, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Symbolic Meaning</td>
                                <td className="py-2 px-4">{selectedSetting.symbolicMeaning || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Cycle Amplification</td>
                                <td className="py-2 px-4">
                                  {selectedSetting.cycleAmplification ? (
                                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-60">
                                      {JSON.stringify(selectedSetting.cycleAmplification, null, 2)}
                                    </pre>
                                  ) : 'N/A'}
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Emotional Resonance</td>
                                <td className="py-2 px-4">{selectedSetting.emotionalResonance || 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Created At</td>
                                <td className="py-2 px-4">{selectedSetting.createdAt ? new Date(selectedSetting.createdAt).toLocaleString() : 'N/A'}</td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Updated At</td>
                                <td className="py-2 px-4">{selectedSetting.updatedAt ? new Date(selectedSetting.updatedAt).toLocaleString() : 'N/A'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Unknown editor level</div>;
    }
  };

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>
      <div className="h-screen bg-[rgb(var(--color-background))] flex flex-col">
        {/* Fixed Header */}
      <div className="flex-shrink-0 z-50 bg-[rgb(var(--color-background)/95%)] backdrop-blur-[var(--blur)] border-b border-[rgb(var(--color-border))]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/studio')}
                className="flex items-center gap-2 text-[rgb(var(--color-muted-foreground))] hover:text-[rgb(var(--color-foreground))]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Stories</span>
              </Button>
              <div className="w-px h-6 bg-[rgb(var(--color-border))] hidden sm:block"></div>
              <h1 className="text-lg md:text-xl font-semibold text-[rgb(var(--color-foreground))] truncate font-[var(--font-heading)]">
                {currentSelection.level === "story" ? "📖" :
                 currentSelection.level === "part" ? "📚" :
                 currentSelection.level === "chapter" ? "📝" :
                 currentSelection.level === "characters" ? "👥" :
                 currentSelection.level === "settings" ? "🗺️" : "🎬"} {story.title}
              </h1>
              <Badge variant="default">{currentSelection.level}</Badge>
              
              {/* Cache Status Indicators */}
              {(isValidatingCurrentStory || isValidatingStory) && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--color-primary))] opacity-60">
                  <div className="w-3 h-3 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden md:inline">Syncing...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 md:gap-3">
              {currentSelection.level === "story" && (
                <Button 
                  size="sm" 
                  onClick={handleVisibilityToggle} 
                  disabled={isLoading}
                  className={story.status === 'published' ? 'bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/90%)] text-[rgb(var(--color-primary-foreground))]' : 'bg-[rgb(var(--color-muted))] hover:bg-[rgb(var(--color-muted)/80%)] text-[rgb(var(--color-muted-foreground))]'}
                  title={
                    story.status === 'published'
                      ? 'Story is public - visible in community hub. Click to make private.'
                      : 'Story is private - not visible in community hub. Click to make public.'
                  }
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[rgb(var(--color-primary-foreground))] border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span className="hidden sm:inline">Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>{story.status === 'published' ? '🌍' : '🔒'}</span>
                      <span className="hidden sm:inline ml-1">
                        {story.status === 'published' ? 'Public' : 'Private'}
                      </span>
                      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" opacity="0.6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </>
                  )}
                </Button>
              )}
              {currentSelection.level === "chapter" && (
                (() => {
                  // Find the current chapter status for button styling
                  let currentChapterStatus = 'draft';
                  let currentChapter = null;
                  
                  // Look in parts first
                  for (const part of story.parts) {
                    const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
                    if (foundChapter) {
                      currentChapter = foundChapter;
                      currentChapterStatus = foundChapter.status || 'draft';
                      break;
                    }
                  }
                  
                  // If not found in parts, check standalone chapters
                  if (!currentChapter) {
                    const foundChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
                    if (foundChapter) {
                      currentChapter = foundChapter;
                      currentChapterStatus = foundChapter.status || 'draft';
                    }
                  }
                  
                  // If chapter is marked as published but has no content, force it to draft status
                  if (currentChapter && currentChapterStatus === 'published') {
                    const hasScenes = currentChapter.scenes && currentChapter.scenes.length > 0;
                    const scenesWithContent = currentChapter.scenes?.filter(s => (s as any).content && (s as any).content.trim() !== '') || [];
                    const hasContent = scenesWithContent.length > 0;

                    if (!hasContent && scenesWithContent.length === 0) {
                      currentChapterStatus = 'draft';
                    }
                  }

                  
                  return (
                    <Button 
                      size="sm" 
                      onClick={handlePublishToggle} 
                      disabled={isLoading}
                      className={`${currentChapterStatus === 'published' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/90%)] text-[rgb(var(--color-primary-foreground))]'} rounded-[var(--radius)]`}
                      title={
                        currentChapterStatus === 'published' 
                          ? 'Chapter is published - click to unpublish' 
                          : 'Publish chapter'
                      }
                    >
                      {isLoading ? 
                        (currentChapterStatus === 'published' ? "⚡ Unpublishing..." : "⚡ Publishing...") : 
                        (
                          <div className="flex items-center gap-1">
                            <span>{currentChapterStatus === 'published' ? "🚀 Published" : "🚀 Publish"}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" opacity="0.6">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          </div>
                        )}
                    </Button>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 py-6 overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Sidebar - Story Structure Navigation (Tree View) */}
          <Panel defaultSize={25} minSize={15} maxSize={40} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              ref={leftPanelRef}
              className="flex-1 min-h-0 pr-2 overflow-y-auto [overscroll-behavior-y:contain]"
            >
              <StoryStructureSidebar
                story={story}
                currentSelection={currentSelection}
                onSelectionChange={handleSelectionChange}
                validatingStoryId={
                  isValidatingCurrentStory ? story.id : null
                }
              />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Middle Panel - Table Data Display */}
          <Panel defaultSize={50} minSize={30} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              ref={middlePanelRef}
              className="flex-1 min-h-0 px-2 overflow-y-auto [overscroll-behavior-y:contain]"
            >
              {renderEditor()}
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors cursor-col-resize" />

          {/* Right Sidebar - Studio Agent Chat Only */}
          <Panel defaultSize={25} minSize={15} maxSize={40} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              ref={rightPanelRef}
              className="h-full pl-2 flex flex-col overflow-y-auto [overscroll-behavior-y:contain]"
            >
              <StudioAgentChat
                storyId={story.id}
                storyContext={{
                  storyTitle: story.title,
                  currentSelection: currentSelection,
                  genre: story.genre,
                  status: story.status,
                }}
                className="flex-1"
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
    </>
  );
}