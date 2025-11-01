"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { mutate } from "swr";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { useStoryData } from "@/lib/hooks/useStoryData";
import { useWritingProgress, useWritingSession } from "@/hooks/useStoryWriter";
import { JSONDataDisplay } from "./JSONDataDisplay";
import { ChapterEditor } from "./ChapterEditor";
import { SceneEditor, SceneData } from "./SceneEditor";
import { StoryStructureSidebar } from "./StoryStructureSidebar";
import { SceneSidebar } from "./SceneSidebar";
import { CharactersDisplay } from "./CharactersDisplay";
import { SettingsDisplay } from "./SettingsDisplay";
import { StudioAgentChat } from "@/components/studio/studio-agent-chat";
import type {
  HNSStory,
  HNSPart,
  HNSChapter,
  HNSScene,
  HNSCharacter,
  HNSSetting,
  HNSDocument
} from "@/types/hns";

// Extended Story interface to include database fields with HNS data
interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  isPublic?: boolean;
  hnsData?: HNSDocument | Record<string, unknown>;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Collapse states for YAML data displays
  const [storyDataCollapsed, setStoryDataCollapsed] = useState(false);

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
  
  // Track writing session
  useEffect(() => {
    // Start a writing session when component mounts
    const session = writingSession.startSession();
    console.log('✍️ Started writing session for:', story.title);
    
    // Cleanup: End session when component unmounts
    return () => {
      const result = writingSession.endSession();
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
  const parseStoryData = (): HNSDocument => {
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

    // Check if parsed data is already HNSDocument format
    if (parsedData && parsedData.story && parsedData.parts && parsedData.chapters) {
      return parsedData as HNSDocument;
    }

    // Convert legacy format to HNSDocument
    const hnsStory: HNSStory = {
      story_id: story.id,
      story_title: story.title || parsedData?.title || "Generated Story",
      genre: (Array.isArray(story.genre) ? story.genre : [story.genre || parsedData?.genre || "General"]) as any,
      premise: parsedData?.premise || "Story premise",
      dramatic_question: parsedData?.question || parsedData?.dramatic_question || "What is the central question of this story?",
      theme: parsedData?.theme || parsedData?.themes?.[0] || "Main theme",
      characters: parsedData?.characters || [],
      settings: parsedData?.settings || [],
      parts: parsedData?.parts?.map((p: any) => `part_${p.part || p.id}`) || []
    };

    // Convert parts to HNSPart format
    const hnsParts: HNSPart[] = story.parts.map((part, index) => ({
      part_id: part.id,
      part_title: part.title,
      structural_role: index === 0 ? 'Act 1: Setup' : index === 1 ? 'Act 2: Confrontation' : 'Act 3: Resolution',
      summary: parsedData?.parts?.[index]?.summary || `Summary for ${part.title}`,
      key_beats: parsedData?.parts?.[index]?.key_beats || [],
      chapters: part.chapters.map(ch => ch.id),
      chapter_count: part.chapters.length,
      scene_counts: part.chapters.map(ch => ch.scenes?.length || 0)
    }));

    // Convert chapters to HNSChapter format
    const hnsChapters: HNSChapter[] = [];
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
            description: parsedData?.parts?.[partIndex]?.chapters?.[chapterIndex]?.hook || "",
            urgency_level: 'medium'
          },
          scenes: chapter.scenes?.map(s => s.id) || []
        });
      });
    });

    // Convert scenes to HNSScene format
    const hnsScenes: HNSScene[] = [];
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
            goal: scene.goal,
            conflict: scene.conflict,
            outcome: scene.outcome as HNSScene['outcome'],
            emotional_shift: {
              from: "",
              to: ""
            }
          });
        });
      });
    });

    // Create empty arrays for characters and settings if not available
    const hnsCharacters: HNSCharacter[] = parsedData?.characters || [];
    const hnsSettings: HNSSetting[] = parsedData?.settings || [];

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
  const [sampleStoryData, setSampleStoryData] = useState<HNSDocument>(parseStoryData());

  // Track changes and original data for save/cancel functionality
  const [originalStoryData, setOriginalStoryData] = useState<HNSDocument>(sampleStoryData);
  const [storyPreviewData, setStoryPreviewData] = useState<any>(null);
  const [storyHasChanges, setStoryHasChanges] = useState(false);
  const [changedStoryKeys, setChangedStoryKeys] = useState<string[]>([]);

  // Part data state management for change tracking
  const [originalPartData, setOriginalPartData] = useState<any>(null);
  const [currentPartData, setCurrentPartData] = useState<any>(null);
  const [partPreviewData, setPartPreviewData] = useState<any>(null);
  const [partHasChanges, setPartHasChanges] = useState(false);

  // Chapter data state management for change tracking
  const [originalChapterData, setOriginalChapterData] = useState<any>(null);
  const [currentChapterData, setCurrentChapterData] = useState<any>(null);
  const [chapterPreviewData, setChapterPreviewData] = useState<any>(null);
  const [chapterHasChanges, setChapterHasChanges] = useState(false);

  // Scene data state management for change tracking
  const [originalSceneData, setOriginalSceneData] = useState<any>(null);
  const [currentSceneData, setCurrentSceneData] = useState<any>(null);
  const [scenePreviewData, setScenePreviewData] = useState<any>(null);
  const [sceneHasChanges, setSceneHasChanges] = useState(false);

  // Update story data when story prop changes (for real-time updates)
  useEffect(() => {
    console.log('🔄 Story prop changed, updating story data...');
    console.log('📦 Story hnsData:', story.hnsData);

    const newStoryData = parseStoryData();
    console.log('📝 Parsed story data:', newStoryData);

    setSampleStoryData(newStoryData);
    setOriginalStoryData(newStoryData);
    setStoryHasChanges(false);
    setChangedStoryKeys([]);

    console.log('✅ Story data state updated');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  // Helper function to find changed keys between two objects
  const findChangedKeys = (original: any, updated: any): string[] => {
    const changedKeys: string[] = [];

    if (!original || !updated) return changedKeys;

    // Get all keys from both objects
    const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)]);

    for (const key of allKeys) {
      const originalValue = original[key];
      const updatedValue = updated[key];

      // Compare values (deep comparison for objects)
      if (JSON.stringify(originalValue) !== JSON.stringify(updatedValue)) {
        changedKeys.push(key);
      }
    }

    return changedKeys;
  };

  // Update story data and track changes
  const handleStoryDataUpdate = (updatedData: HNSDocument) => {
    setSampleStoryData(updatedData);
    setStoryHasChanges(JSON.stringify(updatedData) !== JSON.stringify(originalStoryData));

    // Calculate and track changed keys
    const changed = findChangedKeys(originalStoryData, updatedData);
    setChangedStoryKeys(changed);
  };

  // Update part data and track changes
  const handlePartDataUpdate = (updatedData: any) => {
    setCurrentPartData(updatedData);
    if (originalPartData) {
      setPartHasChanges(JSON.stringify(updatedData) !== JSON.stringify(originalPartData));
    }
  };

  // Update chapter data and track changes
  const handleChapterDataUpdate = (updatedData: any) => {
    setCurrentChapterData(updatedData);
    if (originalChapterData) {
      setChapterHasChanges(JSON.stringify(updatedData) !== JSON.stringify(originalChapterData));
    }
  };

  // Update scene data and track changes
  const handleSceneDataUpdate = (updatedData: any) => {
    setCurrentSceneData(updatedData);
    if (originalSceneData) {
      setSceneHasChanges(JSON.stringify(updatedData) !== JSON.stringify(originalSceneData));
    }
  };

  // Initialize part data when switching to part level or changing part
  useEffect(() => {
    if (currentSelection.level === "part" && currentSelection.partId) {
      const selectedPart = story.parts.find(part => part.id === currentSelection.partId);

      console.log('🔍 Selected part:', selectedPart);
      console.log('📦 Part hnsData:', selectedPart?.hnsData);
      console.log('📦 Part hnsData type:', typeof selectedPart?.hnsData);

      if (selectedPart) {
        // If we have hnsData, use it directly
        if (selectedPart.hnsData) {
          setOriginalPartData(selectedPart.hnsData);
          setCurrentPartData(selectedPart.hnsData);
        } else {
          // If no hnsData, show the part metadata itself as JSON
          const partMetadata = {
            part_id: selectedPart.id,
            part_title: selectedPart.title || `Part ${selectedPart.orderIndex}`,
            order_index: selectedPart.orderIndex,
            chapters: selectedPart.chapters?.map(ch => ({
              chapter_id: ch.id,
              chapter_title: ch.title,
              order_index: ch.orderIndex,
              status: ch.status,
            })) || []
          };
          setOriginalPartData(partMetadata);
          setCurrentPartData(partMetadata);
        }
      } else {
        // Fallback if part not found
        const defaultData = { part_id: currentSelection.partId, message: "Part not found" };
        setOriginalPartData(defaultData);
        setCurrentPartData(defaultData);
      }

      setPartHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.partId, story.parts]);

  // Initialize chapter data when switching to chapter level or changing chapter
  useEffect(() => {
    if (currentSelection.level === "chapter" && currentSelection.chapterId) {
      // Find the chapter either in parts or standalone chapters
      let selectedChapter = null;
      for (const part of story.parts) {
        selectedChapter = part.chapters?.find(ch => ch.id === currentSelection.chapterId);
        if (selectedChapter) break;
      }
      if (!selectedChapter) {
        selectedChapter = story.chapters?.find(chapter => chapter.id === currentSelection.chapterId);
      }

      console.log('🔍 Selected chapter:', selectedChapter);
      console.log('📦 Chapter hnsData:', selectedChapter?.hnsData);

      if (selectedChapter) {
        // If we have hnsData, use it directly
        if (selectedChapter.hnsData) {
          setOriginalChapterData(selectedChapter.hnsData);
          setCurrentChapterData(selectedChapter.hnsData);
        } else {
          // If no hnsData, show the chapter metadata itself as JSON
          const chapterMetadata = {
            chapter_id: selectedChapter.id,
            chapter_title: selectedChapter.title,
            order_index: selectedChapter.orderIndex,
            status: selectedChapter.status,
            target_word_count: selectedChapter.targetWordCount,
            scenes: (selectedChapter.scenes || []).map(scene => ({
              scene_id: scene.id,
              scene_title: scene.title,
              status: scene.status,
            }))
          };
          setOriginalChapterData(chapterMetadata);
          setCurrentChapterData(chapterMetadata);
        }
      } else {
        // Fallback if chapter not found
        const defaultData = { chapter_id: currentSelection.chapterId, message: "Chapter not found" };
        setOriginalChapterData(defaultData);
        setCurrentChapterData(defaultData);
      }

      setChapterHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.chapterId, story.parts, story.chapters]);

  // Initialize scene data when switching to scene level or changing scene
  useEffect(() => {
    if (currentSelection.level === "scene" && currentSelection.sceneId) {
      const sceneLoadStart = Date.now();
      console.log(`\n🎬 [CLIENT] Scene selection changed to: ${currentSelection.sceneId}`);
      console.log('🔍 [CLIENT] Searching for scene in story structure...');

      // Find the scene in chapters
      let selectedScene = null;
      for (const part of story.parts) {
        for (const chapter of part.chapters || []) {
          selectedScene = chapter.scenes?.find(scene => scene.id === currentSelection.sceneId);
          if (selectedScene) break;
        }
        if (selectedScene) break;
      }
      if (!selectedScene) {
        for (const chapter of story.chapters || []) {
          selectedScene = chapter.scenes?.find(scene => scene.id === currentSelection.sceneId);
          if (selectedScene) break;
        }
      }

      const sceneLoadDuration = Date.now() - sceneLoadStart;

      if (selectedScene) {
        console.log(`✅ [CLIENT] Scene found in ${sceneLoadDuration}ms`);
        console.log(`📝 [CLIENT] Scene title: "${selectedScene.title}"`);
        console.log(`📦 [CLIENT] Scene hnsData available: ${!!selectedScene.hnsData}`);

        // If we have hnsData, use it directly
        if (selectedScene.hnsData) {
          setOriginalSceneData(selectedScene.hnsData);
          setCurrentSceneData(selectedScene.hnsData);
        } else {
          // If no hnsData, show the scene metadata itself as JSON
          const sceneMetadata = {
            scene_id: selectedScene.id,
            scene_title: selectedScene.title,
            status: selectedScene.status,
            goal: selectedScene.goal,
            conflict: selectedScene.conflict,
            outcome: selectedScene.outcome
          };
          setOriginalSceneData(sceneMetadata);
          setCurrentSceneData(sceneMetadata);
        }
        console.log('💾 [CLIENT] Scene data loaded into component state');
      } else {
        console.log(`❌ [CLIENT] Scene NOT found in story structure after ${sceneLoadDuration}ms`);
        // Fallback if scene not found
        const defaultData = { scene_id: currentSelection.sceneId, message: "Scene not found" };
        setOriginalSceneData(defaultData);
        setCurrentSceneData(defaultData);
      }

      setSceneHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.sceneId, story.parts, story.chapters]);

  // Extract data from the actual story structure
  const extractedPartData = useMemo(() => {
    if (!currentSelection.partId || !sampleStoryData?.parts) return null;
    return sampleStoryData.parts.find(part => part.part_id === currentSelection.partId) || null;
  }, [currentSelection.partId, sampleStoryData]);

  const extractedChapterData = useMemo(() => {
    if (!currentSelection.chapterId || !sampleStoryData?.chapters) return null;
    return sampleStoryData.chapters.find(chapter => chapter.chapter_id === currentSelection.chapterId) || null;
  }, [currentSelection.chapterId, sampleStoryData]);

  const extractedSceneData = useMemo(() => {
    if (!currentSelection.sceneId || !sampleStoryData?.scenes) return null;
    return sampleStoryData.scenes.find(scene => scene.scene_id === currentSelection.sceneId) || null;
  }, [currentSelection.sceneId, sampleStoryData]);

  // Helper functions for backwards compatibility
  const getPartData = () => extractedPartData;
  const getChapterData = () => extractedChapterData;
  const getSceneData = () => extractedSceneData;

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
    const currentPart = sampleStoryData.parts.find(p => p.part_title === partTitle || p.part_id === `part_${partNum}`);

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
                <CardTitle>📖 Story Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{story.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Genre</td>
                        <td className="py-2 px-4">{story.genre}</td>
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
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Parts</td>
                        <td className="py-2 px-4">{story.parts?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapters</td>
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
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Public</td>
                        <td className="py-2 px-4">{story.isPublic ? 'Yes' : 'No'}</td>
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
                <CardTitle>📚 Part Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">Part Number</td>
                        <td className="py-2 px-4">{selectedPart.orderIndex}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{selectedPart.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Chapters</td>
                        <td className="py-2 px-4">{selectedPart.chapters?.length || 0}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Total Scenes</td>
                        <td className="py-2 px-4">
                          {selectedPart.chapters?.reduce((total, ch) => total + (ch.scenes?.length || 0), 0)}
                        </td>
                      </tr>
                      {(selectedPart as any).targetWordCount && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Target Words</td>
                          <td className="py-2 px-4">{(selectedPart as any).targetWordCount?.toLocaleString()}</td>
                        </tr>
                      )}
                      {(selectedPart as any).function && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Function</td>
                          <td className="py-2 px-4">{(selectedPart as any).function}</td>
                        </tr>
                      )}
                      {(selectedPart as any).goal && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Goal</td>
                          <td className="py-2 px-4">{(selectedPart as any).goal}</td>
                        </tr>
                      )}
                      {(selectedPart as any).conflict && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Conflict</td>
                          <td className="py-2 px-4">{(selectedPart as any).conflict}</td>
                        </tr>
                      )}
                      {(selectedPart as any).outcome && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Outcome</td>
                          <td className="py-2 px-4">{(selectedPart as any).outcome}</td>
                        </tr>
                      )}
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
            characterFocus: chapter.characterFocus || "",
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>📝 Chapter Not Found</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                    <div className="text-4xl mb-4">📄</div>
                    <h3 className="text-lg font-medium mb-2 text-[rgb(var(--color-card-foreground))]">No Chapter Data</h3>
                    <p>This chapter doesn&apos;t exist or hasn&apos;t been created yet.</p>
                    <p className="text-sm mt-2">Chapter ID: {currentSelection.chapterId}</p>
                  </div>
                  <Button 
                    onClick={() => handleSelectionChange({ level: "story", storyId: story.id })}
                    variant="secondary"
                  >
                    ← Back to Story Overview
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📝 Chapter Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">Chapter Number</td>
                        <td className="py-2 px-4">{selectedChapter.orderIndex}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Title</td>
                        <td className="py-2 px-4">{selectedChapter.title}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Part</td>
                        <td className="py-2 px-4">{selectedPartTitle || 'Standalone'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Status</td>
                        <td className="py-2 px-4">
                          <Badge variant={selectedChapter.status === 'published' ? 'default' : 'secondary'}>
                            {selectedChapter.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Scenes</td>
                        <td className="py-2 px-4">{selectedChapter.scenes?.length || 0}</td>
                      </tr>
                      {(selectedChapter as any).purpose && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Purpose</td>
                          <td className="py-2 px-4">{(selectedChapter as any).purpose}</td>
                        </tr>
                      )}
                      {(selectedChapter as any).hook && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Hook</td>
                          <td className="py-2 px-4">{(selectedChapter as any).hook}</td>
                        </tr>
                      )}
                      {(selectedChapter as any).characterFocus && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Character Focus</td>
                          <td className="py-2 px-4">{(selectedChapter as any).characterFocus}</td>
                        </tr>
                      )}
                      {(selectedChapter as any).targetWordCount && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Target Words</td>
                          <td className="py-2 px-4">{(selectedChapter as any).targetWordCount?.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "scene":
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
                <CardTitle>🎬 Scene Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800 w-1/3">Title</td>
                        <td className="py-2 px-4">{selectedScene.title}</td>
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
                        <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Status</td>
                        <td className="py-2 px-4">
                          <Badge variant={selectedScene.status === 'completed' ? 'default' : 'secondary'}>
                            {selectedScene.status}
                          </Badge>
                        </td>
                      </tr>
                      {selectedScene.goal && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Goal</td>
                          <td className="py-2 px-4">{selectedScene.goal}</td>
                        </tr>
                      )}
                      {selectedScene.conflict && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Conflict</td>
                          <td className="py-2 px-4">{selectedScene.conflict}</td>
                        </tr>
                      )}
                      {selectedScene.outcome && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Outcome</td>
                          <td className="py-2 px-4">{selectedScene.outcome}</td>
                        </tr>
                      )}
                      {(selectedScene as any).orderIndex !== undefined && (
                        <tr className="border-b">
                          <td className="py-2 px-4 font-medium bg-gray-50 dark:bg-gray-800">Scene Number</td>
                          <td className="py-2 px-4">{(selectedScene as any).orderIndex}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "characters":
        return (
          <div className="space-y-6">
            <CharactersDisplay storyData={sampleStoryData} />
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <SettingsDisplay storyData={sampleStoryData} />
          </div>
        );

      default:
        return <div>Unknown editor level</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--color-background))]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-[rgb(var(--color-background)/95%)] backdrop-blur-[var(--blur)] border-b border-[rgb(var(--color-border))]">
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

      <div className="w-full px-4 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Story Structure Navigation (Tree View) */}
          <div className="col-span-3 h-full">
            <StoryStructureSidebar
              story={story}
              currentSelection={currentSelection}
              onSidebarCollapse={setSidebarCollapsed}
              onSelectionChange={handleSelectionChange}
              validatingStoryId={
                isValidatingCurrentStory ? story.id : null
              }
            />
          </div>

          {/* Middle Panel - Table Data Display */}
          <div className="col-span-6 h-full">
            <div className="h-full overflow-y-auto">
              {renderEditor()}
            </div>
          </div>

          {/* Right Sidebar - Studio Agent Chat Only */}
          <div className="col-span-3 h-full">
            <StudioAgentChat
              storyId={story.id}
              storyContext={{
                storyTitle: story.title,
                currentSelection: currentSelection,
                genre: story.genre,
                status: story.status,
              }}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}