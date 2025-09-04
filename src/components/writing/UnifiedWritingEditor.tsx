"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import { StoryTreeArchitecture } from "./StoryTreeArchitecture";
import { YAMLDataDisplay } from "./YAMLDataDisplay";
import { StoryEditor } from "./StoryEditor";
import { PartEditor } from "./PartEditor";
import { ChapterEditor } from "./ChapterEditor";
import { SceneEditor } from "./SceneEditor";

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

interface UnifiedWritingEditorProps {
  story: Story;
  initialSelection?: Selection;
}

export function UnifiedWritingEditor({ story, initialSelection }: UnifiedWritingEditorProps) {
  const router = useRouter();
  const [currentSelection, setCurrentSelection] = useState<Selection>(
    initialSelection || {
      level: "story",
      storyId: story.id
    }
  );
  
  const [yamlLevel, setYamlLevel] = useState<EditorLevel>("story");
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSelectionChange = (selection: Selection) => {
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
            status: data.content && data.content.trim() ? 'in_progress' : 'planned'
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

  const handleCreateFirstScene = async (chapterId: string) => {
    setIsLoading(true);
    try {
      // Create the first scene for this chapter
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Scene 1',
          chapterId: chapterId,
          orderIndex: 1,
          goal: 'Establish opening scene',
          conflict: 'Initial obstacles',
          outcome: 'Scene conclusion'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create scene');
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
      console.error('Failed to create first scene:', error);
      alert('Failed to create scene. Please try again.');
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
              <CardHeader>
                <CardTitle>📝 Chapter Overview</CardTitle>
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
                    <Badge variant="outline" className="ml-2">{chapterData.status}</Badge>
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

            {/* Scene Overview */}
            <Card>
              <CardHeader>
                <CardTitle>🎬 Scene Overview</CardTitle>
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
                          <Badge 
                            variant={scene.status === "completed" ? "success" : scene.status === "in_progress" ? "warning" : "secondary"}
                            size="sm"
                          >
                            {scene.status.replace('_', ' ')}
                          </Badge>
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
                        onClick={() => handleCreateFirstScene(currentSelection.chapterId!)}
                        disabled={isLoading}
                      >
                        {isLoading ? "Creating..." : "+ Create First Scene"}
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
          image_prompt: `Scene ${sceneNum} visual description for ${selectedSceneChapter?.title || 'chapter'}`
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
              {(currentSelection.level === "chapter" || currentSelection.level === "scene") && (
                <Button size="sm" disabled={isLoading}>
                  {isLoading ? "⚡ Processing..." : "🚀 Publish"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Story Architecture Tree */}
          <div className="space-y-6">
            <StoryTreeArchitecture 
              story={story} 
              currentChapterId={currentSelection.chapterId}
              currentSceneId={currentSelection.sceneId}
              onSelectionChange={handleSelectionChange}
              currentSelection={currentSelection}
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
                    sceneData={yamlLevel === "scene" ? sampleSceneData : undefined}
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