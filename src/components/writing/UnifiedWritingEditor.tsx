"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { useStoryData } from "@/lib/hooks/useStoryData";
import { useWritingProgress, useWritingSession } from "@/hooks/useStoryWriter";
import { JSONDataDisplay } from "./JSONDataDisplay";
import { StoryEditor } from "./StoryEditor";
import { PartEditor } from "./PartEditor";
import { ChapterEditor } from "./ChapterEditor";
import { SceneEditor, SceneData } from "./SceneEditor";
import { StoryStructureSidebar } from "./StoryStructureSidebar";
import { SceneSidebar } from "./SceneSidebar";
import { WritingGuidelines } from "./WritingGuidelines";
import { StoryPromptWriter } from "./StoryPromptWriter";
import { PartPromptEditor } from "./PartPromptEditor";
import { ChapterPromptEditor } from "./ChapterPromptEditor";
import { ScenePromptEditor } from "./ScenePromptEditor";
import { BeautifulJSONDisplay } from "./BeautifulJSONDisplay";
import { CharactersDisplay } from "./CharactersDisplay";
import { SettingsDisplay } from "./SettingsDisplay";

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
  isPublic?: boolean;
  storyData?: Record<string, unknown>;
  parts: Array<{
    id: string;
    title: string;
    orderIndex: number;
    chapters: Array<{
      id: string;
      title: string;
      orderIndex: number;
      status: string;
      wordCount: number;
      targetWordCount: number;
      scenes?: Scene[];
    }>;
  }>;
  chapters: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    wordCount: number;
    targetWordCount: number;
    scenes?: Scene[];
  }>;
  scenes?: Scene[];
}

interface Scene {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "planned";
  wordCount: number;
  goal: string;
  conflict: string;
  outcome: string;
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
}

export function UnifiedWritingEditor({ story: initialStory, allStories, initialSelection }: UnifiedWritingEditorProps) {
  const router = useRouter();
  const [story, setStory] = useState<Story>(initialStory);
  const [currentSelection, setCurrentSelection] = useState<Selection>(
    initialSelection || {
      level: "story",
      storyId: story.id
    }
  );
  
  const [jsonLevel, setJsonLevel] = useState<EditorLevel>("story");
  const [isLoading, setIsLoading] = useState(false);
  const [showThemePlanner, setShowThemePlanner] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Collapse states for YAML data displays
  const [storyDataCollapsed, setStoryDataCollapsed] = useState(false);

  // SWR hook for fetching story data when switching stories
  const [targetStoryId, setTargetStoryId] = useState<string | null>(null);
  const { story: swrStory, isLoading: isLoadingStory, isValidating: isValidatingStory, error: storyError } = useStoryData(targetStoryId);
  
  // SWR hook for current story to track background validation and get characters and places
  const { isValidating: isValidatingCurrentStory, characters: currentStoryCharacters, places: currentStoryPlaces } = useStoryData(story.id);
  const [themePlanned, setThemePlanned] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  
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
  }, [story.id]);

  // Sync story state when prop changes
  useEffect(() => {
    setStory(initialStory);
  }, [initialStory]);

  // Handle SWR story data loading
  useEffect(() => {
    if (swrStory && !isLoadingStory) {
      setStory(swrStory);
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
  const parseStoryData = () => {
    let parsedData = null;

    // Handle both JSON string and object cases
    if (story.storyData) {
      if (typeof story.storyData === 'object') {
        parsedData = story.storyData;
      } else if (typeof story.storyData === 'string') {
        try {
          parsedData = JSON.parse(story.storyData);
        } catch (error) {
          console.error('Failed to parse story storyData JSON:', error);
        }
      }
    }

    // If we successfully parsed data, use it
    if (parsedData && typeof parsedData === 'object') {
      return {
        title: story.title || parsedData.title || "Generated Story",
        genre: story.genre || parsedData.genre || "General",
        words: parsedData.words || parsedData.targetWordCount || 60000,
        question: parsedData.question || "What is the central question of this story?",
        goal: parsedData.goal || "Story goal not defined",
        conflict: parsedData.conflict || "Story conflict not defined",
        outcome: parsedData.outcome || "Story outcome not defined",
        chars: parsedData.chars || parsedData.characters || {},
        themes: parsedData.themes || [],
        structure: parsedData.structure || {
          type: "3_part",
          parts: ["setup", "confrontation", "resolution"],
          dist: [25, 50, 25]
        },
        setting: parsedData.setting || {},
        parts: parsedData.parts || [],
        serial: parsedData.serial || {},
        hooks: parsedData.hooks || {}
      };
    }

    // Fallback to basic story info if no parsed data available
    return {
      title: story.title || "Generated Story",
      genre: story.genre || "General",
      words: 60000,
      question: "What is the central question of this story?",
      goal: "Story goal not defined",
      conflict: "Story conflict not defined",
      outcome: "Story outcome not defined",
      chars: {},
      themes: [],
      structure: {
        type: "3_part",
        parts: ["setup", "confrontation", "resolution"],
        dist: [25, 50, 25]
      },
      setting: {},
      parts: [],
      serial: {},
      hooks: {}
    };
  };

  // Real story data from database
  const [sampleStoryData, setSampleStoryData] = useState(parseStoryData());

  // Track changes and original data for save/cancel functionality
  const [originalStoryData, setOriginalStoryData] = useState(sampleStoryData);
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
    console.log('📦 Story storyData:', story.storyData);

    const newStoryData = parseStoryData();
    console.log('📝 Parsed story data:', newStoryData);

    setSampleStoryData(newStoryData);
    setOriginalStoryData(newStoryData);
    setStoryHasChanges(false);
    setChangedStoryKeys([]);

    console.log('✅ Story data state updated');
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
  const handleStoryDataUpdate = (updatedData: any) => {
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

  // Helper functions for JSON conversion for StoryPromptWriter
  const convertStoryDataToJSON = (storyData: any): string => {
    try {
      return JSON.stringify({ story: storyData }, null, 2);
    } catch (error) {
      console.error('Error converting story data to JSON:', error);
      return '';
    }
  };

  const convertJSONToStoryData = (jsonText: string): any => {
    try {
      const parsed = JSON.parse(jsonText);
      return parsed?.story || parsed;
    } catch (error) {
      console.error('Error parsing JSON to story data:', error);
      return null;
    }
  };

  // Wrapper handlers for StoryPromptWriter that work with JSON
  const handleStoryJSONUpdate = (updatedJson: string) => {
    const storyData = convertJSONToStoryData(updatedJson);
    if (storyData) {
      handleStoryDataUpdate(storyData);
    }
  };

  const handleStoryJSONPreviewUpdate = (previewJson: string | null) => {
    if (previewJson === null) {
      setStoryPreviewData(null);
    } else {
      const storyData = convertJSONToStoryData(previewJson);
      if (storyData) {
        setStoryPreviewData(storyData);
      }
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
    if (currentSelection.level === "part") {
      const selectedPart = story.parts.find(part => part.id === currentSelection.partId);
      const partNumber = selectedPart?.orderIndex || 1;
      const partData = selectedPart ?
        createPartData(partNumber, `Part ${partNumber}`) :
        createPartData(1, "Part 1");

      setOriginalPartData(partData);
      setCurrentPartData(partData);
      setPartHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.partId, story.parts]);

  // Initialize chapter data when switching to chapter level or changing chapter
  useEffect(() => {
    if (currentSelection.level === "chapter") {
      const selectedChapter = story.chapters?.find(chapter => chapter.id === currentSelection.chapterId);
      const chapterData = selectedChapter || {
        id: currentSelection.chapterId || 'sample-chapter',
        title: 'Chapter 1',
        summary: '',
        orderIndex: 1,
        wordCount: 0,
        targetWordCount: 4000,
        status: 'draft',
        purpose: '',
        hook: '',
        characterFocus: '',
        sceneIds: [],
        scenes: []
      };

      setOriginalChapterData(chapterData);
      setCurrentChapterData(chapterData);
      setChapterHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.chapterId, story.chapters]);

  // Initialize scene data when switching to scene level or changing scene
  useEffect(() => {
    if (currentSelection.level === "scene") {
      const selectedScene = story.scenes?.find(scene => scene.id === currentSelection.sceneId);
      const sceneData = selectedScene || {
        id: currentSelection.sceneId || 'sample-scene',
        title: 'Scene 1',
        content: '',
        orderIndex: 1,
        wordCount: 0,
        status: 'planned',
        goal: '',
        conflict: '',
        outcome: '',
        characterIds: [],
        placeIds: [],
        characters: [],
        places: []
      };

      setOriginalSceneData(sceneData);
      setCurrentSceneData(sceneData);
      setSceneHasChanges(false);
    }
  }, [currentSelection.level, currentSelection.sceneId, story.scenes]);

  // Extract data from the actual story structure
  const extractedPartData = useMemo(() => {
    if (!currentSelection.partId || !sampleStoryData?.parts) return null;
    const partIndex = parseInt(currentSelection.partId.replace('part', '')) - 1;
    return sampleStoryData.parts?.[partIndex] || null;
  }, [currentSelection.partId, sampleStoryData]);

  const extractedChapterData = useMemo(() => {
    if (!currentSelection.chapterId || !sampleStoryData?.parts) return null;
    const partIndex = parseInt(currentSelection.partId?.replace('part', '') || '1') - 1;
    const chapterIndex = parseInt(currentSelection.chapterId.replace('chapter', '')) - 1;
    return sampleStoryData.parts?.[partIndex]?.chapters?.[chapterIndex] || null;
  }, [currentSelection.chapterId, currentSelection.partId, sampleStoryData]);

  const extractedSceneData = useMemo(() => {
    if (!currentSelection.sceneId || !sampleStoryData?.parts) return null;
    const partIndex = parseInt(currentSelection.partId?.replace('part', '') || '1') - 1;
    const chapterIndex = parseInt(currentSelection.chapterId?.replace('chapter', '') || '1') - 1;
    const sceneIndex = parseInt(currentSelection.sceneId.replace('scene', '')) - 1;
    return sampleStoryData.parts?.[partIndex]?.chapters?.[chapterIndex]?.scenes?.[sceneIndex] || null;
  }, [currentSelection.sceneId, currentSelection.chapterId, currentSelection.partId, sampleStoryData]);

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
      router.push(`/write/${selection.chapterId}`);
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
      // Check if this is scene data (has content and wordCount) and we have a sceneId
      if (data.content !== undefined && data.wordCount !== undefined && currentSelection.sceneId) {
        // Save scene content and metadata to the scene API using JSON
        const sceneJsonData = {
          title: data.summary || `Scene ${data.id}`,
          content: data.content,
          wordCount: data.wordCount,
          goal: data.goal,
          conflict: data.obstacle,
          outcome: data.outcome,
          status: data.content && data.content.trim() ? 'in_progress' : 'draft'
        };

        const response = await fetch(`/api/scenes/${currentSelection.sceneId}`, {
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
        // Save chapter data using JSON
        const chapterJsonData = {
          id: data.id,
          title: data.title,
          purpose: data.purpose,
          hook: data.hook,
          characterFocus: data.characterFocus,
          wordCount: data.wordCount,
          targetWordCount: data.targetWordCount,
          status: data.status
        };

        const response = await fetch(`/api/chapters/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chapterJsonData)
        });

        if (!response.ok) {
          const responseText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { error: responseText };
          }
          throw new Error(`Failed to save chapter: ${errorData.error || response.statusText}`);
        }

        console.log('Chapter data saved successfully');
      } else if (currentSelection.level === "story" && data) {
        // Save story data to the stories API
        console.log('💾 Saving story data to API...');
        console.log('📝 Data being saved:', data);
        console.log('🎯 Story ID:', story.id);

        const response = await fetch(`/api/stories/${story.id}/write`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storyData: data
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
          storyData: data,
          updatedAt: saveResult.updatedAt || new Date().toISOString()
        }));
      } else {
        // For other data types (part), use the original mock behavior for now
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
      const hasContent = currentChapter.purpose || currentChapter.hook || currentChapter.characterFocus || (currentChapter.wordCount && currentChapter.wordCount > 0);
      const scenesWithContent = hasScenes ? currentChapter.scenes.filter((scene: any) => scene.wordCount > 0) : [];
      
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
      const scenesWithContent = chapterScenes.filter(scene => scene.wordCount > 0);
      if (scenesWithContent.length === 0) {
        alert('Cannot publish chapter with empty scenes. Please add content to at least one scene before publishing.');
        return;
      }
    }
    
    const endpoint = isPublished ? 'unpublish' : 'publish';
    const newStatus = isPublished ? 'completed' : 'published';
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chapters/${currentSelection.chapterId}/${endpoint}`, {
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
    const currentVisibility = story.isPublic || false;
    const newVisibility = !currentVisibility;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stories/${story.id}/visibility`, {
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
        isPublic: newVisibility,
      }));
      
      // Show confirmation message
      const action = newVisibility ? 'public' : 'private';
      alert(`Story is now ${action}! ${newVisibility ? 'It will appear in the community hub for discussions.' : 'It has been removed from the community hub.'}`);
      
    } catch (error) {
      console.error('Visibility toggle error:', error);
      alert(`Failed to update story visibility. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateScene = async (chapterId: string) => {
    setIsLoading(true);
    try {
      // Fetch current scenes from the API to ensure we have the latest data
      const scenesResponse = await fetch(`/api/scenes?chapterId=${chapterId}`);
      const scenesText = await scenesResponse.text();
      let scenesData;
      try {
        scenesData = JSON.parse(scenesText);
      } catch {
        // Fallback to JSON for backward compatibility
        scenesData = JSON.parse(scenesText);
      }
      
      // Calculate next available order index by finding the highest existing orderIndex
      let nextOrderIndex = 1;
      if (scenesData.scenes && scenesData.scenes.length > 0) {
        const maxOrderIndex = Math.max(...scenesData.scenes.map((scene: any) => scene.orderIndex || 0));
        nextOrderIndex = maxOrderIndex + 1;
      }
      
      // Create the new scene using JSON
      const newSceneData = {
        title: `Scene ${nextOrderIndex}`,
        chapterId: chapterId,
        orderIndex: nextOrderIndex,
        goal: nextOrderIndex === 1 ? 'Establish opening scene' : `Scene ${nextOrderIndex} objective`,
        conflict: nextOrderIndex === 1 ? 'Initial obstacles' : `Scene ${nextOrderIndex} challenges`,
        outcome: nextOrderIndex === 1 ? 'Scene conclusion' : `Scene ${nextOrderIndex} resolution`
      };

      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSceneData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        console.error('Scene creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create scene');
      }

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Fallback to JSON for backward compatibility
        responseData = JSON.parse(responseText);
      }
      const { scene } = responseData;
      
      // Navigate to the new scene editor
      handleSelectionChange({
        level: "scene",
        storyId: story.id,
        partId: currentSelection.partId,
        chapterId: chapterId,
        sceneId: scene.id
      });

      // Refresh the page to show the new scene
      router.refresh();
      
    } catch (error) {
      console.error('Failed to create scene:', error);
      alert('Failed to create scene. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveThemePlan = async () => {
    setIsSavingTheme(true);
    try {
      // Simulate saving the theme plan data to the chapter or story
      // This would typically save the three-act structure, tension architecture, 
      // character development, dual mandate fulfillment, and hook strategy data
      
      // For now, we'll just simulate an API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would save the theme plan data to the database
      // const response = await fetch(`/api/chapters/${currentSelection.chapterId}/theme`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(themePlanData)
      // });
      
      // Show success feedback
      console.log('Theme plan saved successfully');
      
    } catch (error) {
      console.error('Failed to save theme plan:', error);
      alert('Failed to save theme plan. Please try again.');
    } finally {
      setIsSavingTheme(false);
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
      const response = await fetch(`/api/scenes/${sceneId}`, {
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
    const storyParts = sampleStoryData.parts || [];
    const currentPart = storyParts.find((p: any) => p.part === partNum) || storyParts[partNum - 1];

    return {
      part: partNum,
      title: partTitle,
      words: partNum === 2 ? 40000 : 20000, // Middle part typically longer
      function: partNum === 1 ? "story_setup" :
               partNum === 2 ? "story_development" :
               "story_resolution",
      goal: currentPart?.goal || `Part ${partNum} goal from ${sampleStoryData.title}`,
      conflict: currentPart?.conflict || `Part ${partNum} conflict from ${sampleStoryData.title}`,
      outcome: currentPart?.outcome || `Part ${partNum} outcome from ${sampleStoryData.title}`,
      questions: {
        primary: `What is the main question for Part ${partNum} of ${sampleStoryData.title}?`,
        secondary: `What is the secondary question for Part ${partNum} of ${sampleStoryData.title}?`
      },
      chars: sampleStoryData.chars || {},
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
      wordCount: scene?.wordCount || 0
    });

    const sceneData = selectedScene ?
      createSceneData(selectedScene, sceneNumber) :
      createSceneData(null, sceneNumber);

    return { sceneData, selectedSceneChapter, sceneNumber };
  };

  const renderSceneEditor = () => {
    const { sceneData, selectedSceneChapter, sceneNumber } = findSceneData();

    return (
      <SceneEditor
        key={currentSelection.sceneId}
        sceneId={currentSelection.sceneId}
        sceneNumber={sceneNumber}
        initialData={currentSceneData}
        previewData={scenePreviewData}
        chapterContext={{
          title: selectedSceneChapter?.title || "Chapter",
          pov: "maya",
          acts: getChapterData()?.acts || {}
        }}
        hasChanges={sceneHasChanges || !!scenePreviewData}
        onSceneUpdate={handleSceneDataUpdate}
        onSave={async (data) => {
          await handleSave(scenePreviewData || data);
          setOriginalSceneData(scenePreviewData || data);
          setScenePreviewData(null);
          setSceneHasChanges(false);
        }}
        onCancel={() => {
          setCurrentSceneData(originalSceneData);
          setScenePreviewData(null);
          setSceneHasChanges(false);
        }}
        onWrite={handleGenerate}
      />
    );
  };

  const renderEditor = () => {
    switch (currentSelection.level) {
      case "story":
        return (
          <div className="space-y-6">
            <StoryEditor
              storyId={story.id}
              storyData={sampleStoryData}
              characters={currentStoryCharacters}
              places={currentStoryPlaces}
              hasChanges={storyHasChanges}
              onStoryUpdate={handleStoryDataUpdate}
              onSave={async (data) => {
                await handleSave(data);
                setOriginalStoryData(data);
                setStoryHasChanges(false);
                setChangedStoryKeys([]);
              }}
              onCancel={() => {
                setSampleStoryData(originalStoryData);
                setStoryHasChanges(false);
                setChangedStoryKeys([]);
              }}
              onGenerate={handleGenerate}
            />

            {/* Story JSON Data Display */}
            <BeautifulJSONDisplay
              title="Story JSON Data"
              icon="📖"
              data={sampleStoryData}
              isCollapsed={storyDataCollapsed}
              onToggleCollapse={() => setStoryDataCollapsed(!storyDataCollapsed)}
              changedKeys={changedStoryKeys}
              onDataChange={handleStoryDataUpdate}
            />
          </div>
        );
      
      case "part":
        // Find the selected part from the story structure
        const selectedPart = story.parts.find(part => part.id === currentSelection.partId);
        const partNumber = selectedPart?.orderIndex || 1;

        return (
          <PartEditor
            key={currentSelection.partId} // Force re-mount when part changes
            partId={currentSelection.partId}
            partNumber={partNumber}
            initialData={currentPartData}
            previewData={partPreviewData}
            storyContext={{
              title: story.title,
              genre: story.genre,
              themes: ["responsibility_for_power", "love_vs_control"],
              chars: sampleStoryData.chars
            }}
            hasChanges={partHasChanges || !!partPreviewData}
            onPartUpdate={handlePartDataUpdate}
            onSave={async (data) => {
              await handleSave(partPreviewData || data);
              setOriginalPartData(partPreviewData || data);
              setPartPreviewData(null);
              setPartHasChanges(false);
            }}
            onCancel={() => {
              setCurrentPartData(originalPartData);
              setPartPreviewData(null);
              setPartHasChanges(false);
            }}
          />
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
              part: part.orderIndex,
              title: part.title,
              words: part.targetWordCount || 20000,
              function: part.function || "story_setup",
              goal: part.goal || "",
              conflict: part.conflict || "",
              outcome: part.outcome || "",
              ...part
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
          const hasContent = chapter.purpose || chapter.hook || chapter.characterFocus || (chapter.wordCount && chapter.wordCount > 0);
          const scenesWithContent = hasScenes ? chapter.scenes.filter((scene: any) => scene.wordCount > 0) : [];
          
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
            wordCount: chapter.wordCount || 0,
            targetWordCount: chapter.targetWordCount || 4000,
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
                    <h3 className="text-lg font-medium mb-2 text-[rgb(var(--card-foreground))]">No Chapter Data</h3>
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
            {/* Chapter Editor Header with Save/Cancel */}
            {(chapterHasChanges || !!chapterPreviewData) && (
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div>
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">📝 Chapter Changes</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">You have unsaved changes to this chapter</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentChapterData(originalChapterData);
                      setChapterPreviewData(null);
                      setChapterHasChanges(false);
                    }}
                    className="whitespace-nowrap"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={async () => {
                      await handleSave(chapterPreviewData || currentChapterData);
                      setOriginalChapterData(chapterPreviewData || currentChapterData);
                      setChapterPreviewData(null);
                      setChapterHasChanges(false);
                    }}
                    className="whitespace-nowrap"
                  >
                    💾 Save Changes
                  </Button>
                </div>
              </div>
            )}

            {/* Chapter Overview */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <BeautifulJSONDisplay
                  title="📝 Chapter Overview"
                  icon="📝"
                  data={{
                    title: chapterData.title,
                    part: chapterData.partTitle,
                    status: chapterData.status,
                    progress: {
                      current: chapterData.wordCount,
                      target: chapterData.targetWordCount,
                      percentage: Math.round((chapterData.wordCount / chapterData.targetWordCount) * 100)
                    },
                    purpose: chapterData.purpose,
                    hook: chapterData.hook,
                    characterFocus: chapterData.characterFocus
                  }}
                  isCollapsed={false}
                />
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const newShowState = !showThemePlanner;
                  setShowThemePlanner(newShowState);
                  // Mark theme as planned when user first opens the planner
                  if (newShowState && !themePlanned) {
                    setThemePlanned(true);
                  }
                }}
                className="flex items-center gap-2 ml-4"
              >
                <span>🎨</span>
                {showThemePlanner ? "Hide Theme Planner" : "Create Theme"}
              </Button>
            </div>

            {/* Chapter Theme Planner - Expandable */}
            {showThemePlanner && (
              <div className="space-y-4">
                <BeautifulJSONDisplay
                  title="🎨 Chapter Theme & Structure Planner"
                  icon="🎨"
                  data={{
                    three_act_structure: {
                      act1_setup: {
                        weight: "20%",
                        hook_in: getChapterData()?.acts?.setup?.hook_in || "",
                        orient: getChapterData()?.acts?.setup?.orient || "",
                        incident: getChapterData()?.acts?.setup?.incident || ""
                      },
                      act2_confrontation: {
                        weight: "60%",
                        rising: getChapterData()?.acts?.confrontation?.rising || "",
                        midpoint: getChapterData()?.acts?.confrontation?.midpoint || "",
                        complicate: getChapterData()?.acts?.confrontation?.complicate || ""
                      },
                      act3_resolution: {
                        weight: "20%",
                        climax: getChapterData()?.acts?.resolution?.climax || "",
                        resolve: getChapterData()?.acts?.resolution?.resolve || "",
                        hook_out: getChapterData()?.acts?.resolution?.hook_out || ""
                      }
                    },
                    tension_architecture: {
                      external: getChapterData()?.tension?.external || "",
                      internal: getChapterData()?.tension?.internal || "",
                      interpersonal: getChapterData()?.tension?.interpersonal || "",
                      atmospheric: getChapterData()?.tension?.atmospheric || "",
                      peak_moment: getChapterData()?.tension?.peak || ""
                    },
                    character_development: {
                      maya_pov: {
                        start: getChapterData()?.chars?.maya?.start || "",
                        arc: getChapterData()?.chars?.maya?.arc || "",
                        end: getChapterData()?.chars?.maya?.end || "",
                        motivation: getChapterData()?.chars?.maya?.motivation || "",
                        growth: getChapterData()?.chars?.maya?.growth || ""
                      }
                    },
                    dual_mandate: {
                      episodic_satisfaction: {
                        arc: getChapterData()?.mandate?.episodic?.arc || "",
                        payoff: getChapterData()?.mandate?.episodic?.payoff || "",
                        answered: getChapterData()?.mandate?.episodic?.answered || ""
                      },
                      serial_momentum: {
                        complication: getChapterData()?.mandate?.serial?.complication || "",
                        stakes: getChapterData()?.mandate?.serial?.stakes || "",
                        compulsion: getChapterData()?.mandate?.serial?.compulsion || ""
                      }
                    },
                    forward_hook: {
                      type: getChapterData()?.hook?.type || "",
                      reveal: getChapterData()?.hook?.reveal || "",
                      threat: getChapterData()?.hook?.threat || "",
                      emotion: getChapterData()?.hook?.emotion || ""
                    }
                  }}
                  isCollapsed={false}
                />

                {/* Action Buttons */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex items-center gap-2"
                        onClick={handleSaveThemePlan}
                        disabled={isSavingTheme}
                      >
                        {isSavingTheme ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            Saving Theme Plan...
                          </>
                        ) : (
                          <>
                            <span>💾</span>
                            Save Theme Plan
                          </>
                        )}
                      </Button>
                      <Button size="sm" variant="secondary" className="flex items-center gap-2">
                        <span>🎲</span>
                        Generate Variations
                      </Button>
                      <Button size="sm" variant="outline" className="flex items-center gap-2">
                        <span>📋</span>
                        Export JSON
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scene Overview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>🎬</span>
                  Scene Overview
                </h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCreateScene(currentSelection.chapterId!)}
                  disabled={isLoading || !themePlanned}
                  className="flex items-center gap-2"
                  title={!themePlanned ? "Create a theme first before adding scenes" : ""}
                >
                  <span>🎬</span>
                  {isLoading ? "Creating..." : "Create Scene"}
                </Button>
              </div>

              {/* Display scenes as JSON if available */}
              {chapterData.scenes.length > 0 && (
                <BeautifulJSONDisplay
                  title="📝 Chapter Scenes"
                  icon="📝"
                  data={chapterData.scenes.map((scene, index) => ({
                    scene_number: index + 1,
                    id: scene.id,
                    title: scene.title,
                    status: scene.status,
                    wordCount: scene.wordCount,
                    goal: scene.goal,
                    conflict: scene.conflict,
                    outcome: scene.outcome
                  }))}
                  isCollapsed={false}
                />
              )}

              {/* Keep interactive scene cards for navigation */}
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {chapterData.scenes.length > 0 ? (
                      chapterData.scenes.map((scene, index) => (
                      <div 
                        key={scene.id} 
                        className="border border-[rgb(var(--border))] rounded-[var(--radius)] p-4 bg-[rgb(var(--card)/50%)] hover:bg-[rgb(var(--primary)/8%)] cursor-pointer transition-all duration-[var(--animate-duration)] hover:border-[rgb(var(--primary)/60%)] hover:shadow-[var(--shadow)]"
                        onClick={() => handleSelectionChange({
                          level: "scene",
                          storyId: story.id,
                          partId: selectedPartData ? `part-${selectedPartData.part}` : undefined,
                          chapterId: currentSelection.chapterId,
                          sceneId: scene.id
                        })}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-[rgb(var(--card-foreground))] flex items-center gap-2">
                            <span>{scene.status === "completed" ? "✅" : scene.status === "in_progress" ? "⏳" : "📝"}</span>
                            Scene {index + 1}: {scene.title}
                          </h4>
                          <span className="text-xs text-[rgb(var(--muted-foreground))] bg-[rgb(var(--muted))] px-2 py-1 rounded-[var(--radius-sm)]">                          
                            {scene.wordCount}w
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-[rgb(var(--muted-foreground))]">
                          <div><strong>Goal:</strong> {scene.goal}</div>
                          <div><strong>Conflict:</strong> {scene.conflict}</div>
                          <div><strong>Outcome:</strong> {scene.outcome}</div>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={scene.status === "completed" ? "success" : scene.status === "in_progress" ? "warning" : "secondary"}
                              size="sm"
                            >
                              {scene.status.replace('_', ' ')}
                            </Badge>
                            <Button
                              size="sm"
                              variant={scene.status === "completed" ? "secondary" : "default"}
                              onClick={(e) => handleToggleSceneStatus(scene.id, scene.status, e)}
                              disabled={isLoading}
                              className="text-xs px-2 py-1 h-auto"
                              title={
                                scene.status === 'planned' ? 'Start working on scene' :
                                scene.status === 'in_progress' ? 'Mark scene as complete' :
                                'Mark scene as in progress'
                              }
                            >
                              <div className="flex items-center gap-1">
                                <span>
                                  {scene.status === 'planned' ? '▶️ Start' :
                                   scene.status === 'in_progress' ? '✅ Complete' :
                                   '🔄 Resume'}
                                </span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" opacity="0.6">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                            </Button>
                          </div>
                          <span className="text-xs text-[rgb(var(--primary))] hover:underline">
                            Click to edit scene →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[rgb(var(--muted-foreground))]">
                      <p className="text-sm mb-3">No scenes planned for this chapter</p>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleCreateScene(currentSelection.chapterId!)}
                        disabled={isLoading || !themePlanned}
                        title={!themePlanned ? "Create a theme first before adding scenes" : ""}
                      >
                        {isLoading ? "Creating..." : !themePlanned ? "Create Theme First" : "+ Create First Scene"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Story JSON Data Display */}
            <BeautifulJSONDisplay
              title="Story JSON Data"
              icon="📖"
              data={sampleStoryData}
              isCollapsed={storyDataCollapsed}
              onToggleCollapse={() => setStoryDataCollapsed(!storyDataCollapsed)}
            />

          </div>
        );

      case "scene":
        return renderSceneEditor();

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
    <div className="min-h-screen bg-[rgb(var(--background))]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-[rgb(var(--background)/95%)] backdrop-blur-[var(--blur)] border-b border-[rgb(var(--border))]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stories')}
                className="flex items-center gap-2 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Stories</span>
              </Button>
              <div className="w-px h-6 bg-[rgb(var(--border))] hidden sm:block"></div>
              <h1 className="text-lg md:text-xl font-semibold text-[rgb(var(--foreground))] truncate font-[var(--font-heading)]">
                {currentSelection.level === "story" ? "📖" :
                 currentSelection.level === "part" ? "📚" :
                 currentSelection.level === "chapter" ? "📝" :
                 currentSelection.level === "characters" ? "👥" :
                 currentSelection.level === "settings" ? "🗺️" : "🎬"} {story.title}
              </h1>
              <Badge variant="outline">{currentSelection.level}</Badge>
              
              {/* Cache Status Indicators */}
              {(isValidatingCurrentStory || isValidatingStory) && (
                <div className="flex items-center gap-2 text-xs text-[rgb(var(--primary))] opacity-60">
                  <div className="w-3 h-3 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
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
                  className={story.isPublic ? 'bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/90%)] text-[rgb(var(--primary-foreground))]' : 'bg-[rgb(var(--muted))] hover:bg-[rgb(var(--muted)/80%)] text-[rgb(var(--muted-foreground))]'}
                  title={
                    story.isPublic 
                      ? 'Story is public - visible in community hub. Click to make private.'
                      : 'Story is private - not visible in community hub. Click to make public.'
                  }
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[rgb(var(--primary-foreground))] border-t-transparent rounded-full animate-spin mr-1"></div>
                      <span className="hidden sm:inline">Updating...</span>
                    </>
                  ) : (
                    <>
                      <span>{story.isPublic ? '🌍' : '🔒'}</span>
                      <span className="hidden sm:inline ml-1">
                        {story.isPublic ? 'Public' : 'Private'}
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
                    const hasContent = currentChapter.purpose || currentChapter.hook || currentChapter.characterFocus || (currentChapter.wordCount && currentChapter.wordCount > 0);
                    const scenesWithContent = hasScenes ? currentChapter.scenes.filter((scene: any) => scene.wordCount > 0) : [];
                    
                    if (!hasContent && scenesWithContent.length === 0) {
                      currentChapterStatus = 'draft';
                    }
                  }

                  
                  return (
                    <Button 
                      size="sm" 
                      onClick={handlePublishToggle} 
                      disabled={isLoading}
                      className={`${currentChapterStatus === 'published' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-[rgb(var(--primary))] hover:bg-[rgb(var(--primary)/90%)] text-[rgb(var(--primary-foreground))]'} rounded-[var(--radius)]`}
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
              {currentSelection.level === "scene" && (
                (() => {
                  // Find the current scene for status buttons
                  let currentScene = null;
                  let currentSceneStatus = 'planned';
                  
                  // Look through all parts and chapters to find the current scene
                  for (const part of story.parts) {
                    for (const chapter of part.chapters) {
                      if (chapter.scenes) {
                        const foundScene = chapter.scenes.find(scene => scene.id === currentSelection.sceneId);
                        if (foundScene) {
                          currentScene = foundScene;
                          currentSceneStatus = foundScene.status || 'planned';
                          break;
                        }
                      }
                    }
                    if (currentScene) break;
                  }
                  
                  // Also check standalone chapters
                  if (!currentScene) {
                    for (const chapter of story.chapters) {
                      if (chapter.scenes) {
                        const foundScene = chapter.scenes.find(scene => scene.id === currentSelection.sceneId);
                        if (foundScene) {
                          currentScene = foundScene;
                          currentSceneStatus = foundScene.status || 'planned';
                          break;
                        }
                      }
                    }
                  }

                  // If scene is planned, treat as in_progress for display
                  const displayStatus = currentSceneStatus === 'planned' ? 'in_progress' : currentSceneStatus;

                  const handleSceneStatusToggle = async () => {
                    if (!currentScene) return;
                    
                    // Toggle between in_progress and completed only (treat planned as in_progress)
                    const newStatus = currentSceneStatus === 'completed' ? 'in_progress' : 'completed';
                    
                    setIsLoading(true);
                    try {
                      const response = await fetch(`/api/scenes/${currentScene.id}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          status: newStatus
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
                        throw new Error(`Failed to update scene status: ${errorData.error || 'Unknown error'}`);
                      }

                      // Refresh to show updated status
                      router.refresh();
                      
                    } catch (error) {
                      console.error('Failed to update scene status:', error);
                      alert('Failed to update scene status. Please try again.');
                    } finally {
                      setIsLoading(false);
                    }
                  };

                  return (
                    <Button 
                      size="sm" 
                      onClick={handleSceneStatusToggle} 
                      disabled={isLoading}
                      className={`${displayStatus === 'completed' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-yellow-600 hover:bg-yellow-700 text-white'} rounded-[var(--radius)]`}
                      title={
                        displayStatus === 'completed' 
                          ? 'Scene is completed - click to mark as in progress' 
                          : 'Scene is in progress - click to mark as completed'
                      }
                    >
                      {isLoading ? 
                        "⚡ Updating..." : 
                        (
                          <div className="flex items-center gap-1">
                            <span>{displayStatus === 'completed' ? "✅ Completed" : "⏳ In Progress"}</span>
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
        <div className={`grid ${sidebarCollapsed ? 'grid-cols-12' : 'grid-cols-12'} gap-6 min-h-[calc(100vh-200px)]`}>
          {/* Left Sidebar - Story Structure Navigation */}
          {!sidebarCollapsed && (
            <div className="col-span-12 lg:col-span-3 space-y-6">
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
          )}
          
          {/* Collapsed sidebar trigger */}
          {sidebarCollapsed && (
            <StoryStructureSidebar 
              story={story}
              currentSelection={currentSelection}
              onSidebarCollapse={setSidebarCollapsed}
              onSelectionChange={handleSelectionChange}
              validatingStoryId={
                isValidatingCurrentStory ? story.id : null
              }
            />
          )}
          
          {/* Main Writing Area - 50% width */}
          <div className={`col-span-12 ${sidebarCollapsed ? 'lg:col-span-9' : 'lg:col-span-6'}`}>
            {renderEditor()}
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            {currentSelection.level === "scene" ? (
              // Scene view: Show SceneSidebar with scene controls and JSON data
              <SceneSidebar
                sceneData={{
                  id: getSceneData()?.id || 1,
                  summary: getSceneData()?.summary || "",
                  time: getSceneData()?.time || "",
                  place: getSceneData()?.place || "",
                  pov: getSceneData()?.pov || "",
                  characters: getSceneData()?.characters || {},
                  goal: getSceneData()?.goal || "",
                  obstacle: getSceneData()?.obstacle || "",
                  outcome: getSceneData()?.outcome || "",
                  beats: getSceneData()?.beats || [],
                  shift: getSceneData()?.shift || "",
                  leads_to: getSceneData()?.leads_to || "",
                  image_prompt: getSceneData()?.image_prompt || ""
                }}
                chapterContext={{
                  title: "Chapter Context",
                  pov: getChapterData()?.pov || "",
                  acts: getChapterData()?.acts || {}
                }}
                storyData={sampleStoryData}
                partData={getPartData()}
                chapterData={getChapterData()}
                onSave={handleSave}
                onSceneDataChange={(field, value) => {
                  // Handle scene data changes
                  console.log(`Updating scene field ${field}:`, value);
                }}
              />
            ) : null}
            
            {/* Story Prompt Writer - Show for story level */}
            {currentSelection.level === "story" && (
              <StoryPromptWriter
                storyJson={convertStoryDataToJSON(storyPreviewData || sampleStoryData)}
                storyId={story.id}
                onStoryUpdate={handleStoryJSONUpdate}
                onPreviewUpdate={handleStoryJSONPreviewUpdate}
              />
            )}

            {/* Part Prompt Editor - Show for part level */}
            {currentSelection.level === "part" && (
              <PartPromptEditor
                partData={partPreviewData || currentPartData}
                onPartUpdate={handlePartDataUpdate}
                onPreviewUpdate={setPartPreviewData}
              />
            )}

            {/* Chapter Prompt Editor - Show for chapter level */}
            {currentSelection.level === "chapter" && (
              <ChapterPromptEditor
                chapterData={chapterPreviewData || currentChapterData}
                onChapterUpdate={handleChapterDataUpdate}
                onPreviewUpdate={setChapterPreviewData}
              />
            )}

            {/* Scene Prompt Editor - Show for scene level */}
            {currentSelection.level === "scene" && (
              <ScenePromptEditor
                sceneData={scenePreviewData || currentSceneData}
                onSceneUpdate={handleSceneDataUpdate}
                onPreviewUpdate={setScenePreviewData}
              />
            )}


            {/* Writing Guidelines - Show for scene editing */}
            <WritingGuidelines currentLevel={currentSelection.level} />
          </div>
        </div>
      </div>
    </div>
  );
}