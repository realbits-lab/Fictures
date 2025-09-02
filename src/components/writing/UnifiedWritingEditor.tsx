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
      // Here you would save the data to your backend
      console.log('Saving data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
      console.error('Save failed:', error);
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
        return (
          <PartEditor
            partId={currentSelection.partId}
            partNumber={1}
            initialData={samplePartData}
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
        // Use existing ChapterEditor but modified to fit into this flow
        const chapterMockData = {
          id: currentSelection.chapterId || "1",
          title: "Missing",
          partTitle: "Discovery",
          wordCount: 3500,
          targetWordCount: 4000,
          status: 'draft',
          purpose: "Establish Elena's disappearance and supernatural threat",
          hook: "Door unlocked, coffee warm, Elena gone",
          characterFocus: "Maya's protective instincts vs skeptical nature",
          scenes: [
            {
              id: "1",
              title: "Elena's Apartment",
              status: "planned" as const,
              wordCount: 0,
              goal: "Find Elena for coffee date",
              conflict: "Elena missing with signs of struggle",
              outcome: "Realizes Elena in supernatural danger"
            }
          ]
        };
        
        return <ChapterEditor chapter={chapterMockData} story={story} />;
      
      case "scene":
        return (
          <SceneEditor
            sceneId={currentSelection.sceneId}
            sceneNumber={1}
            initialData={sampleSceneData}
            chapterContext={{
              title: "Missing",
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
              <Button size="sm" disabled={isLoading}>
                {isLoading ? "⚡ Processing..." : "🚀 Publish"}
              </Button>
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
            />
          </div>
          
          {/* Main Writing Area */}
          <div className="lg:col-span-2">
            {renderEditor()}
          </div>

          {/* Right Sidebar - YAML Data Display */}
          <div className="space-y-6">
            {/* YAML Data Display with Level Switcher */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">📊 YAML Data</CardTitle>
                  <div className="flex gap-1">
                    <Button 
                      variant={yamlLevel === "story" ? "default" : "ghost"} 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={() => setYamlLevel("story")}
                    >
                      📖
                    </Button>
                    <Button 
                      variant={yamlLevel === "part" ? "default" : "ghost"} 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={() => setYamlLevel("part")}
                    >
                      📚
                    </Button>
                    <Button 
                      variant={yamlLevel === "chapter" ? "default" : "ghost"} 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={() => setYamlLevel("chapter")}
                    >
                      📝
                    </Button>
                    <Button 
                      variant={yamlLevel === "scene" ? "default" : "ghost"} 
                      size="sm" 
                      className="text-xs px-2 py-1"
                      onClick={() => setYamlLevel("scene")}
                    >
                      🎬
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-96 overflow-y-auto">
                  <YAMLDataDisplay
                    storyData={yamlLevel === "story" ? sampleStoryData : undefined}
                    partData={yamlLevel === "part" ? samplePartData : undefined}
                    chapterData={yamlLevel === "chapter" ? sampleChapterData : undefined}
                    sceneData={yamlLevel === "scene" ? sampleSceneData : undefined}
                    currentLevel={yamlLevel}
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