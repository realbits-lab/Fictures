"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Progress, Badge } from "@/components/ui";
import { StoryTreeArchitecture } from "./StoryTreeArchitecture";
import { YAMLDataDisplay } from "./YAMLDataDisplay";

interface Scene {
  id: string;
  title: string;
  status: "completed" | "in_progress" | "planned";
  wordCount: number;
  goal: string;
  conflict: string;
  outcome: string;
}

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
  scenes?: Scene[]; // Add scenes to the story level for current chapter
}

interface ChapterEditorProps {
  chapter: {
    id: string;
    title: string;
    partTitle: string;
    wordCount: number;
    targetWordCount: number;
    status: string;
    purpose: string;
    hook: string;
    characterFocus: string;
    scenes: Scene[];
  };
  story: Story;
  hideSidebar?: boolean; // Add prop to hide sidebar when used within UnifiedWritingEditor
}

export function ChapterEditor({ chapter, story, hideSidebar = false }: ChapterEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(`  The Shadow Realm pulsed around Maya like a living thing, its twisted architecture bending reality with each heartbeat. She could feel Elena's presence—faint but unmistakable—calling to her from the void-touched spire ahead.

  "You feel it, don't you?" The Void Collector's voice echoed from everywhere and nowhere. "The pull of true power. The freedom from restraint."

  Maya's shadows writhed, responding to her emotional turmoil. Part of her—the part she'd been fighting since this began—whispered that he was right. Why should she hold back? Elena was dying. The world was at stake.`);
  
  const [currentWordCount, setCurrentWordCount] = useState(chapter.wordCount);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [yamlLevel, setYamlLevel] = useState<"story" | "part" | "chapter" | "scene">("chapter");

  // Sample YAML data based on documentation
  const sampleStoryData = {
    title: "The Shadow Keeper",
    genre: "urban_fantasy",
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

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges]);

  // Word count calculation
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setCurrentWordCount(words.length);
    setHasUnsavedChanges(true);
    
    // Basic validation
    const errors = [];
    if (words.length < 100) {
      errors.push("Chapter should have at least 100 words");
    }
    if (words.length > chapter.targetWordCount * 1.5) {
      errors.push("Chapter exceeds recommended length");
    }
    setValidationErrors(errors);
  }, [content, chapter.targetWordCount]);

  const handleAutoSave = async () => {
    setIsAutoSaving(true);
    try {
      const response = await fetch(`/api/chapters/${chapter.id}/autosave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          wordCount: currentWordCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Auto-save failed: ${response.statusText}`);
      }

      const result = await response.json();
      setLastSaved(new Date(result.savedAt));
      setHasUnsavedChanges(false);
      console.log('Chapter auto-saved successfully');
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (validationErrors.length === 0) {
      await handleAutoSave();
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes === 1) return "1 minute ago";
    return `${diffMinutes} minutes ago`;
  };

  const progressPercentage = (currentWordCount / chapter.targetWordCount) * 100;

  const getSceneStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "in_progress": return "⏳";
      case "planned": return "📝";
      default: return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Fixed Header (only show if not used within UnifiedWritingEditor) */}
      {!hideSidebar && (
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
                  📝 {chapter.title}
                </h1>
              </div>
              <div className="flex items-center gap-1 md:gap-3">
                <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  {isAutoSaving ? "💾 Saving..." : `💾 ${hasUnsavedChanges ? 'Unsaved changes' : `Saved ${formatLastSaved(lastSaved)}`}`}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:inline-flex" 
                  onClick={handleManualSave}
                  disabled={validationErrors.length > 0 || isAutoSaving}
                >
                  {isAutoSaving ? "💾 Saving..." : "💾 Save"}
                </Button>
                <Button size="sm">📤</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className={`grid gap-6 ${hideSidebar ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
          {/* Left Sidebar - Story Architecture Tree (only show if not hidden) */}
          {!hideSidebar && (
            <div className="space-y-6">
              <StoryTreeArchitecture 
                story={story} 
                currentChapterId={chapter.id}
                currentSceneId={undefined}
              />
              
              {/* Mobile Menu Toggle */}
              <div className="lg:hidden">
                <Button variant="secondary" size="sm" className="w-full">📱 Writing Tools</Button>
              </div>
            </div>
          )}
          
          {/* Main Writing Area */}
          <div className={`space-y-6 ${hideSidebar ? 'col-span-1' : 'lg:col-span-2'}`}>
            {/* Writing Interface */}
            <Card>
              <CardHeader>
                <CardTitle>Writing Interface</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-64 md:h-96 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your chapter..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Writing Tools & YAML Data (only show if not used within UnifiedWritingEditor) */}
          {!hideSidebar && (
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
                    chapterData={yamlLevel === "chapter" ? sampleChapterData : undefined}
                    currentLevel={yamlLevel}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Word Count & Progress */}
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Word Count: <span className="font-medium text-gray-900 dark:text-gray-100">
                      {currentWordCount.toLocaleString()} / {chapter.targetWordCount.toLocaleString()}
                    </span>
                    {hasUnsavedChanges && <span className="text-orange-500 ml-2">• Unsaved</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress 
                      value={Math.min(progressPercentage, 100)} 
                      variant={progressPercentage >= 100 ? "success" : progressPercentage >= 80 ? "warning" : "default"}
                      className="flex-1"
                    />
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                  {validationErrors.length > 0 && (
                    <div className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 dark:text-red-400">
                          ⚠️ {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chapter Overview */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Chapter Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>🎯 Purpose:</strong> {chapter.purpose}
                  </div>
                  <div>
                    <strong>🎬 Hook:</strong> {chapter.hook}
                  </div>
                  <div>
                    <strong>🎭 Character Focus:</strong> {chapter.characterFocus}
                  </div>
                  <div>
                    <strong>📖 Scenes:</strong> {chapter.scenes.length} planned
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scene Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-sm">
                  🎬 Scene Breakdown
                  <Button size="sm" variant="secondary">+ Add</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {chapter.scenes.map((scene, index) => (
                  <div key={scene.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getSceneStatusIcon(scene.status)} Scene {index + 1}: &ldquo;{scene.title}&rdquo;
                      </h4>
                      <div className="text-xs text-gray-500">({scene.wordCount} words)</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <div><strong>Goal:</strong> {scene.goal}</div>
                      <div><strong>Conflict:</strong> {scene.conflict}</div>
                      <div><strong>Outcome:</strong> {scene.outcome}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Writing Assistant */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI Writing Assistant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    &quot;Great tension build! Consider Maya&apos;s internal monologue to show her moral struggle.&quot;
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1">Apply</Button>
                  <Button size="sm" variant="ghost" className="flex-1">More</Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Button size="sm" variant="ghost" className="justify-start">📖 Scene Notes</Button>
                  <Button size="sm" variant="ghost" className="justify-start">🎭 Character Sheet</Button>
                  <Button size="sm" variant="ghost" className="justify-start">📚 Research</Button>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}