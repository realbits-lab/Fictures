"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { useStoryData } from "@/lib/hooks/useStoryData";
import { YAMLDataDisplay } from "./YAMLDataDisplay";
import { StoryEditor } from "./StoryEditor";
import { PartEditor } from "./PartEditor";
import { ChapterEditor } from "./ChapterEditor";
import { SceneEditor } from "./SceneEditor";
import { StoryListSidebar } from "./StoryListSidebar";

interface Story {
  id: string;
  title: string;
  genre: string;
  status: string;
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

export type EditorLevel = "story" | "part" | "chapter" | "scene";

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
  allStories: AllStoryListItem[];
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
  const [yamlLevel, setYamlLevel] = useState<EditorLevel>("story");
  const [isLoading, setIsLoading] = useState(false);
  const [showThemePlanner, setShowThemePlanner] = useState(false);

  // SWR hook for fetching story data when switching stories
  const [targetStoryId, setTargetStoryId] = useState<string | null>(null);
  const { story: swrStory, isLoading: isLoadingStory, isValidating: isValidatingStory, error: storyError } = useStoryData(targetStoryId);
  
  // SWR hook for current story to track background validation
  const { isValidating: isValidatingCurrentStory } = useStoryData(story.id);
  const [themePlanned, setThemePlanned] = useState(false);
  const [isSavingTheme, setIsSavingTheme] = useState(false);

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
      setYamlLevel("story");
      // Signal to sidebar to expand the newly loaded story
      window.dispatchEvent(new CustomEvent('storyLoaded', { 
        detail: { storyId: swrStory.id }
      }));
      // Reset target story ID
      setTargetStoryId(null);
    }
  }, [swrStory, isLoadingStory]);

  // Sample YAML data for demonstration
  const sampleStoryData = {
    title: story.title || "The Shadow Keeper",
    genre: story.genre || "urban_fantasy",
    words: 80000,
    question: "Can Maya master shadow magic before power corrupts her?",
    goal: "Save Elena from Shadow Realm",
    conflict: "Shadow magic corrupts those who use it",
    outcome: "Maya embraces darkness to save light",
    chars: {
      maya: { role: "protag", arc: "denial→acceptance", flaw: "overprotective" },
      elena: { role: "catalyst", arc: "missing→transformed", goal: "survive_realm" },
      marcus: { role: "mentor", arc: "guilt→redemption", secret: "previous_failure" },
      void: { role: "antag", arc: "power→corruption", goal: "merge_worlds" }
    },
    themes: ["responsibility_for_power", "love_vs_control", "inner_battles"],
    structure: {
      type: "3_part",
      parts: ["setup", "confrontation", "resolution"],
      dist: [25, 50, 25]
    },
    setting: {
      primary: ["san_francisco", "photography_studio"],
      secondary: ["shadow_realm", "chinatown_passages"]
    },
    parts: [
      {
        part: 1,
        goal: "Maya accepts supernatural reality",
        conflict: "Denial vs mounting evidence",
        outcome: "Reluctant training commitment",
        tension: "denial vs acceptance"
      }
    ],
    serial: {
      schedule: "weekly",
      duration: "18_months",
      chapter_words: 4000,
      breaks: ["part1_end", "part2_end"],
      buffer: "4_chapters_ahead"
    },
    hooks: {
      overarching: ["elena_fate", "maya_corruption_risk", "shadow_magic_truth"],
      mysteries: ["previous_student_identity", "marcus_secret", "realm_connection"],
      part_endings: ["mentor_secret_revealed", "elena_appears_changed"]
    }
  };

  const samplePartData = {
    part: 1,
    title: "Discovery",
    words: 20000,
    function: "story_setup",
    goal: "Maya accepts supernatural reality",
    conflict: "Denial vs mounting evidence",
    outcome: "Reluctant training commitment",
    questions: {
      primary: "How will Maya react when she discovers her magical abilities?",
      secondary: "Can Maya overcome denial to accept the supernatural world?"
    },
    chars: {
      maya: {
        start: "denial_normalcy",
        end: "reluctant_acceptance",
        arc: ["normal_routine", "strange_discoveries", "power_manifestation", "training_acceptance"],
        conflict: "safety_vs_responsibility",
        transforms: ["magical_manifestation", "mentor_acceptance"]
      }
    },
    plot: {
      events: ["elena_disappearance", "journal_discovery", "shadow_manifestation", "marcus_introduction"],
      reveals: ["elena_research", "maya_abilities", "shadow_keeper_legacy"],
      escalation: ["personal_loss", "reality_challenge", "power_responsibility"]
    },
    themes: {
      primary: "denial_and_acceptance",
      elements: ["denial_vs_truth", "family_responsibility"],
      moments: ["photograph_evidence", "power_manifestation", "training_decision"],
      symbols: ["shadows_as_fears", "photography_as_truth"]
    },
    emotion: {
      start: "casual_family_concern",
      progression: ["growing_fear", "supernatural_terror", "determined_resolution"],
      end: "grim_commitment"
    },
    ending: {
      resolution: ["training_commitment", "moral_conflict_established"],
      setup: ["power_development_phase", "mentor_relationship"],
      hooks: ["elena_time_pressure", "corruption_risk"],
      hook_out: "Maya accepts training but discovers mentor's dark secret"
    },
    serial: {
      arc: "Setup → Rising Tension → Part Climax → Transition Hook",
      climax_at: "85%",
      satisfaction: ["elena_fate_revealed", "maya_abilities_confirmed", "mentor_established"],
      anticipation: ["corruption_risk", "training_challenges", "time_pressure"]
    },
    engagement: {
      discussions: ["maya_moral_choices", "elena_true_situation", "marcus_hidden_past"],
      speculation: ["marcus_previous_student", "elena_still_herself"],
      debates: ["trust_marcus_completely", "elena_worth_corruption_risk"],
      feedback: ["character_dynamics", "magic_complexity", "pacing"]
    }
  };

  const sampleChapterData = {
    chap: 1,
    title: "Missing",
    pov: "maya",
    words: 3500,
    goal: "Normal coffee date with Elena",
    conflict: "Elena missing, signs of supernatural danger",
    outcome: "Finds journal, realizes she's also a target",
    acts: {
      setup: {
        hook_in: "Door unlocked, coffee warm, Elena gone",
        orient: "Weekly sister ritual, Maya's skeptical nature",
        incident: "Overturned chair, shattered mug - signs of struggle"
      },
      confrontation: {
        rising: "Police dismissive, Maya searches alone",
        midpoint: "Discovers Elena's hidden research journal",
        complicate: "Journal reveals supernatural conspiracy, 'The Shepherd'"
      },
      resolution: {
        climax: "Final journal entry: 'He looks for the mark'",
        resolve: "Maya realizes Elena was in supernatural danger",
        hook_out: "Knock at door, Maya has the 'mark' mentioned"
      }
    },
    chars: {
      maya: {
        start: "casual_anticipation",
        arc: "concern → panic → targeted_fear",
        end: "trapped_resolve",
        motivation: "protect_elena",
        growth: "skeptic → reluctant_believer"
      }
    },
    tension: {
      external: "signs_struggle, mysterious_knocker",
      internal: "maya_panic, guilt_unaware",
      interpersonal: "dismissive_police",
      atmospheric: "journal_warnings",
      peak: "door_knock_connects_abstract_threat_to_immediate"
    },
    mandate: {
      episodic: {
        arc: "search_for_elena → journal_discovery → question_answered",
        payoff: "casual_concern → urgent_fear",
        answered: "What happened to Elena? Supernatural research gone wrong"
      },
      serial: {
        complication: "The Shepherd threat established",
        stakes: "Maya also targeted due to mark",
        compulsion: "door_knock_immediate_danger"
      }
    },
    hook: {
      type: "compound",
      reveal: "Maya bears the mark from journal warning",
      threat: "Knock suggests Shepherd found Maya",
      emotion: "protective_instincts vs newfound_vulnerability"
    }
  };

  const sampleSceneData = {
    id: 1,
    summary: "Maya arrives for coffee date, finds Elena missing with signs of struggle",
    time: "sunday_10:05am",
    place: "elena_apartment_hallway",
    pov: "maya",
    characters: {
      maya: { enters: "casual_anticipation", exits: "panicked_determination" },
      elena: { status: "absent_but_referenced", evidence: "struggle_signs" }
    },
    goal: "Normal coffee date with Elena",
    obstacle: "Door unlocked, apartment silent, struggle evidence",
    outcome: "Realizes Elena in danger, decides to search",
    beats: [
      "Maya knocks, no answer, tries door",
      "Finds apartment unlocked, calls Elena's name",
      "Discovers overturned table, broken coffee mug",
      "Maya panics, decides to search rather than call police"
    ],
    shift: "routine_expectation → urgent_fear",
    leads_to: "maya_searches_apartment_for_clues",
    image_prompt: "Young woman in casual clothes standing in a dimly lit apartment hallway, her face showing concern as she looks at an ajar door. The scene suggests early morning light filtering through windows, with subtle signs of disturbance visible - an overturned coffee table and scattered items in the background. Mood: tense, mysterious, domestic thriller atmosphere."
  };

  const handleSelectionChange = async (selection: Selection) => {
    // If switching to a different story, trigger SWR fetch
    if (selection.level === "story" && selection.storyId !== story.id) {
      setTargetStoryId(selection.storyId);
      return;
    }
    
    // If clicking on the current story (level === "story"), show the story editor
    if (selection.level === "story" && selection.storyId === story.id) {
      setCurrentSelection(selection);
      setYamlLevel(selection.level);
      return;
    }
    
    // If switching to a different chapter, navigate to it
    if (selection.level === "chapter" && selection.chapterId && selection.chapterId !== currentSelection.chapterId) {
      router.push(`/write/${selection.chapterId}`);
      return;
    }
    
    // Otherwise, just update the current selection for the same story
    setCurrentSelection(selection);
    setYamlLevel(selection.level);
  };

  const handleSave = async (data: any) => {
    setIsLoading(true);
    try {
      // Check if this is scene data (has content and wordCount) and we have a sceneId
      if (data.content !== undefined && data.wordCount !== undefined && currentSelection.sceneId) {
        // Save scene content and metadata to the scene API
        const response = await fetch(`/api/scenes/${currentSelection.sceneId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.summary || `Scene ${data.id}`,
            content: data.content,
            wordCount: data.wordCount,
            goal: data.goal,
            conflict: data.obstacle,
            outcome: data.outcome,
            status: data.content && data.content.trim() ? 'in_progress' : 'draft'
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to save scene: ${errorData.error || response.statusText}`);
        }

        console.log('Scene saved successfully');
      } else {
        // For other data types (story, part, chapter), use the original mock behavior for now
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
    
    // Find current chapter status
    let currentChapterStatus = 'draft';
    for (const part of story.parts) {
      const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
      if (foundChapter) {
        currentChapterStatus = foundChapter.status || 'draft';
        break;
      }
    }
    if (currentChapterStatus === 'draft') {
      const foundChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
      if (foundChapter) {
        currentChapterStatus = foundChapter.status || 'draft';
      }
    }

    const isPublished = currentChapterStatus === 'published';
    
    // Check if trying to publish and validate scenes
    if (!isPublished) {
      // Find the current chapter to check its scenes
      let currentChapter = null;
      for (const part of story.parts) {
        const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
        if (foundChapter) {
          currentChapter = foundChapter;
          break;
        }
      }
      if (!currentChapter) {
        const foundChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
        if (foundChapter) {
          currentChapter = foundChapter;
        }
      }
      
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

  const handleCreateScene = async (chapterId: string) => {
    setIsLoading(true);
    try {
      // Fetch current scenes from the API to ensure we have the latest data
      const scenesResponse = await fetch(`/api/scenes?chapterId=${chapterId}`);
      const scenesData = await scenesResponse.json();
      
      // Calculate next available order index by finding the highest existing orderIndex
      let nextOrderIndex = 1;
      if (scenesData.scenes && scenesData.scenes.length > 0) {
        const maxOrderIndex = Math.max(...scenesData.scenes.map((scene: any) => scene.orderIndex || 0));
        nextOrderIndex = maxOrderIndex + 1;
      }
      
      // Create the new scene
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Scene ${nextOrderIndex}`,
          chapterId: chapterId,
          orderIndex: nextOrderIndex,
          goal: nextOrderIndex === 1 ? 'Establish opening scene' : `Scene ${nextOrderIndex} objective`,
          conflict: nextOrderIndex === 1 ? 'Initial obstacles' : `Scene ${nextOrderIndex} challenges`,
          outcome: nextOrderIndex === 1 ? 'Scene conclusion' : `Scene ${nextOrderIndex} resolution`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Scene creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create scene');
      }

      const { scene } = await response.json();
      
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
      
      // Update scene status via API
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
        const errorData = await response.json();
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

  const renderEditor = () => {
    switch (currentSelection.level) {
      case "story":
        return (
          <StoryEditor
            storyId={currentSelection.storyId}
            initialData={sampleStoryData}
            onSave={handleSave}
            onGenerate={handleGenerate}
          />
        );
      
      case "part":
        // Find the selected part from the story structure
        const selectedPart = story.parts.find(part => part.id === currentSelection.partId);
        const partNumber = selectedPart?.orderIndex || 1;
        
        // Create unique part data based on selected part
        const createPartData = (partNum: number, partTitle: string) => ({
          ...samplePartData,
          part: partNum,
          title: partTitle,
          words: partNum === 2 ? 40000 : 20000, // Middle part typically longer
          function: partNum === 1 ? "story_setup" : 
                   partNum === 2 ? "story_development" : 
                   "story_resolution",
          goal: partNum === 1 ? "Maya accepts supernatural reality" :
               partNum === 2 ? "Maya develops powers and enters Shadow Realm" :
               "Maya confronts final enemy and rescues Elena",
          conflict: partNum === 1 ? "Denial vs mounting evidence" :
                   partNum === 2 ? "Power corruption vs moral compass" :
                   "Ultimate sacrifice vs personal desires",
          outcome: partNum === 1 ? "Reluctant training commitment" :
                  partNum === 2 ? "Enters Shadow Realm transformed" :
                  "Victory at personal cost",
          questions: {
            primary: partNum === 1 ? "How will Maya react when she discovers her magical abilities?" :
                    partNum === 2 ? "Can Maya resist the corruption of shadow magic?" :
                    "Will Maya sacrifice herself to save Elena?",
            secondary: partNum === 1 ? "Can Maya overcome denial to accept the supernatural world?" :
                      partNum === 2 ? "How will Maya's relationships change as she grows stronger?" :
                      "What will be the true cost of Maya's choices?"
          }
        });
        
        const partData = selectedPart ? 
          createPartData(partNumber, selectedPart.title) : 
          samplePartData;
        
        return (
          <PartEditor
            key={currentSelection.partId} // Force re-mount when part changes
            partId={currentSelection.partId}
            partNumber={partNumber}
            initialData={partData}
            storyContext={{
              title: story.title,
              genre: story.genre,
              themes: ["responsibility_for_power", "love_vs_control"],
              chars: sampleStoryData.chars
            }}
            onSave={handleSave}
            onGenerate={handleGenerate}
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
              ...samplePartData,
              part: part.orderIndex,
              title: part.title
            };
            break;
          }
        }
        
        // Look in standalone chapters if not found in parts
        if (!selectedChapter) {
          selectedChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
        }
        
        // Create chapter data based on selection or fallback
        const createChapterData = (chapter: any, partTitle: string | null) => ({
          id: chapter?.id || currentSelection.chapterId || "1",
          title: chapter?.title || `Chapter ${chapter?.orderIndex || 1}`,
          partTitle: partTitle || "Standalone",
          wordCount: chapter?.wordCount || 0,
          targetWordCount: chapter?.targetWordCount || 4000,
          status: chapter?.status || 'draft',
          purpose: chapter?.orderIndex === 1 ? "Establish story foundation and initial conflict" :
                   chapter?.orderIndex === 2 ? "Develop characters and escalate tension" :
                   "Build toward climax and resolution",
          hook: chapter?.orderIndex === 1 ? "Opening scene that draws readers in" :
                "Continue momentum from previous chapter",
          characterFocus: "Character development and relationship dynamics",
          scenes: chapter?.scenes || []
        });
        
        const chapterData = selectedChapter ? 
          createChapterData(selectedChapter, selectedPartTitle) : 
          createChapterData(null, null);
        
        return (
          <div className="space-y-6">
            {/* Chapter Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>📝 Chapter Overview</CardTitle>
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
                  className="flex items-center gap-2"
                >
                  <span>🎨</span>
                  {showThemePlanner ? "Hide Theme Planner" : "Create Theme"}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>📖 Title:</strong> {chapterData.title}
                  </div>
                  <div>
                    <strong>📚 Part:</strong> {chapterData.partTitle}
                  </div>
                  <div>
                    <strong>📊 Status:</strong> 
                    <Badge 
                      variant={chapterData.status === 'published' ? 'default' : 'outline'} 
                      className={`ml-2 ${chapterData.status === 'published' ? 'bg-green-600 text-white' : ''}`}
                    >
                      {chapterData.status === 'published' ? '🚀' : ''} {chapterData.status}
                    </Badge>
                  </div>
                  <div>
                    <strong>📝 Progress:</strong> {chapterData.wordCount}/{chapterData.targetWordCount} words
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>🎯 Purpose:</strong> {chapterData.purpose}
                  </div>
                  <div>
                    <strong>🎬 Hook:</strong> {chapterData.hook}
                  </div>
                  <div>
                    <strong>🎭 Character Focus:</strong> {chapterData.characterFocus}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapter Theme Planner - Expandable */}
            {showThemePlanner && (
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎨</span>
                    Chapter Theme & Structure Planner
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Three-Act Structure */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span>🎬</span>
                      Three-Act Chapter Structure
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                        <h5 className="font-medium text-xs text-green-800 dark:text-green-200 mb-2">Act 1: Setup (20%)</h5>
                        <div className="space-y-2 text-xs">
                          <div><strong>Hook:</strong> {sampleChapterData.acts.setup.hook_in}</div>
                          <div><strong>Orient:</strong> {sampleChapterData.acts.setup.orient}</div>
                          <div><strong>Incident:</strong> {sampleChapterData.acts.setup.incident}</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 bg-yellow-50 dark:bg-yellow-900/20">
                        <h5 className="font-medium text-xs text-yellow-800 dark:text-yellow-200 mb-2">Act 2: Confrontation (60%)</h5>
                        <div className="space-y-2 text-xs">
                          <div><strong>Rising:</strong> {sampleChapterData.acts.confrontation.rising}</div>
                          <div><strong>Midpoint:</strong> {sampleChapterData.acts.confrontation.midpoint}</div>
                          <div><strong>Complicate:</strong> {sampleChapterData.acts.confrontation.complicate}</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                        <h5 className="font-medium text-xs text-red-800 dark:text-red-200 mb-2">Act 3: Resolution (20%)</h5>
                        <div className="space-y-2 text-xs">
                          <div><strong>Climax:</strong> {sampleChapterData.acts.resolution.climax}</div>
                          <div><strong>Resolve:</strong> {sampleChapterData.acts.resolution.resolve}</div>
                          <div><strong>Hook Out:</strong> {sampleChapterData.acts.resolution.hook_out}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tension Architecture */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span>⚡</span>
                      Tension Architecture
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-xs"><strong>🏃 External:</strong> {sampleChapterData.tension.external}</div>
                        <div className="text-xs"><strong>💭 Internal:</strong> {sampleChapterData.tension.internal}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs"><strong>👥 Interpersonal:</strong> {sampleChapterData.tension.interpersonal}</div>
                        <div className="text-xs"><strong>🌫️ Atmospheric:</strong> {sampleChapterData.tension.atmospheric}</div>
                      </div>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">
                      <strong>🎯 Peak:</strong> {sampleChapterData.tension.peak}
                    </div>
                  </div>

                  {/* Character Development */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span>👤</span>
                      Character Development
                    </h4>
                    <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                      <h5 className="font-medium text-xs text-blue-800 dark:text-blue-200 mb-2">Maya (POV)</h5>
                      <div className="space-y-1 text-xs">
                        <div><strong>Start:</strong> {sampleChapterData.chars.maya.start}</div>
                        <div><strong>Arc:</strong> {sampleChapterData.chars.maya.arc}</div>
                        <div><strong>End:</strong> {sampleChapterData.chars.maya.end}</div>
                        <div><strong>Motivation:</strong> {sampleChapterData.chars.maya.motivation}</div>
                        <div><strong>Growth:</strong> {sampleChapterData.chars.maya.growth}</div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Mandate */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span>⚖️</span>
                      Dual Mandate Fulfillment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-3 bg-purple-50 dark:bg-purple-900/20">
                        <h5 className="font-medium text-xs text-purple-800 dark:text-purple-200 mb-2">📖 Episodic Satisfaction</h5>
                        <div className="space-y-1 text-xs">
                          <div><strong>Arc:</strong> {sampleChapterData.mandate.episodic.arc}</div>
                          <div><strong>Payoff:</strong> {sampleChapterData.mandate.episodic.payoff}</div>
                          <div><strong>Answered:</strong> {sampleChapterData.mandate.episodic.answered}</div>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 bg-indigo-50 dark:bg-indigo-900/20">
                        <h5 className="font-medium text-xs text-indigo-800 dark:text-indigo-200 mb-2">🚀 Serial Momentum</h5>
                        <div className="space-y-1 text-xs">
                          <div><strong>Complication:</strong> {sampleChapterData.mandate.serial.complication}</div>
                          <div><strong>Stakes:</strong> {sampleChapterData.mandate.serial.stakes}</div>
                          <div><strong>Compulsion:</strong> {sampleChapterData.mandate.serial.compulsion}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forward Hook */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <span>🪝</span>
                      Forward Hook Strategy
                    </h4>
                    <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                      <div className="space-y-2 text-xs">
                        <div><strong>Type:</strong> {sampleChapterData.hook.type} ({sampleChapterData.hook.reveal ? "revelation + " : ""}{sampleChapterData.hook.threat ? "threat + " : ""}{sampleChapterData.hook.emotion ? "emotional" : ""})</div>
                        <div><strong>Reveal:</strong> {sampleChapterData.hook.reveal}</div>
                        <div><strong>Threat:</strong> {sampleChapterData.hook.threat}</div>
                        <div><strong>Emotion:</strong> {sampleChapterData.hook.emotion}</div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
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
                      Export YAML
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scene Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>🎬 Scene Overview</CardTitle>
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
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chapterData.scenes.length > 0 ? (
                    chapterData.scenes.map((scene, index) => (
                      <div 
                        key={scene.id} 
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
                        onClick={() => handleSelectionChange({
                          level: "scene",
                          storyId: story.id,
                          partId: selectedPartData ? `part-${selectedPartData.part}` : undefined,
                          chapterId: currentSelection.chapterId,
                          sceneId: scene.id
                        })}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span>{scene.status === "completed" ? "✅" : scene.status === "in_progress" ? "⏳" : "📝"}</span>
                            Scene {index + 1}: {scene.title}
                          </h4>
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {scene.wordCount}w
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
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
                              {scene.status === 'planned' ? '▶️ Start' :
                               scene.status === 'in_progress' ? '✅ Complete' :
                               '🔄 Resume'}
                            </Button>
                          </div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            Click to edit scene →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
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
        );
      
      case "scene":
        // Find the selected scene from story structure
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
        
        return (
          <SceneEditor
            key={currentSelection.sceneId} // Force re-mount when scene changes
            sceneId={currentSelection.sceneId}
            sceneNumber={sceneNumber}
            initialData={sceneData}
            chapterContext={{
              title: selectedSceneChapter?.title || "Chapter",
              pov: "maya",
              acts: sampleChapterData.acts
            }}
            onSave={handleSave}
            onWrite={handleGenerate}
          />
        );
      
      default:
        return <div>Unknown editor level</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200 dark:bg-gray-900/95 dark:border-gray-700">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stories')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back to Stories</span>
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
              <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                {currentSelection.level === "story" ? "📖" : 
                 currentSelection.level === "part" ? "📚" :
                 currentSelection.level === "chapter" ? "📝" : "🎬"} {story.title}
              </h1>
              <Badge variant="outline">{currentSelection.level}</Badge>
            </div>
            <div className="flex items-center gap-1 md:gap-3">
              {currentSelection.level === "chapter" && (
                (() => {
                  // Find the current chapter status for button styling
                  let currentChapterStatus = 'draft';
                  
                  // Look in parts first
                  for (const part of story.parts) {
                    const foundChapter = part.chapters.find(ch => ch.id === currentSelection.chapterId);
                    if (foundChapter) {
                      currentChapterStatus = foundChapter.status || 'draft';
                      break;
                    }
                  }
                  
                  // If not found in parts, check standalone chapters
                  if (currentChapterStatus === 'draft') {
                    const foundChapter = story.chapters.find(ch => ch.id === currentSelection.chapterId);
                    if (foundChapter) {
                      currentChapterStatus = foundChapter.status || 'draft';
                    }
                  }

                  
                  return (
                    <Button 
                      size="sm" 
                      onClick={handlePublishToggle} 
                      disabled={isLoading}
                      className={currentChapterStatus === 'published' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                      title={
                        currentChapterStatus === 'published' 
                          ? 'Unpublish chapter' 
                          : 'Publish chapter'
                      }
                    >
                      {isLoading ? 
                        (currentChapterStatus === 'published' ? "⚡ Unpublishing..." : "⚡ Publishing...") : 
                        (currentChapterStatus === 'published' ? "📤 Unpublish" : "🚀 Publish")}
                    </Button>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Unified Story Navigation */}
          <div className="space-y-6">
            <StoryListSidebar 
              stories={allStories}
              currentStory={story}
              currentSelection={currentSelection}
              onSelectionChange={handleSelectionChange}
              loadingStoryId={targetStoryId}
              validatingStoryId={
                (isValidatingStory && targetStoryId === story.id) || isValidatingCurrentStory 
                  ? story.id 
                  : null
              }
            />
          </div>
          
          {/* Main Writing Area */}
          <div className="lg:col-span-2">
            {renderEditor()}
          </div>

          {/* Right Sidebar - YAML Data Display */}
          <div className="space-y-6">
            {/* YAML Data Display */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">📊 YAML Data</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-y-auto">
                  <YAMLDataDisplay
                    storyData={(currentSelection.level === "part" || currentSelection.level === "chapter" || currentSelection.level === "scene" || yamlLevel === "story") ? sampleStoryData : undefined}
                    partData={(currentSelection.level === "chapter" || currentSelection.level === "scene") ? samplePartData : (currentSelection.level !== "part" && yamlLevel === "part") ? samplePartData : undefined}
                    chapterData={(currentSelection.level === "scene") ? sampleChapterData : yamlLevel === "chapter" ? sampleChapterData : undefined}
                    sceneData={currentSelection.level === "scene" ? sampleSceneData : undefined}
                    currentLevel={currentSelection.level === "part" ? "story" : currentSelection.level === "chapter" ? "chapter" : currentSelection.level === "scene" ? "scene" : yamlLevel}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}