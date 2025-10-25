"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Progress, Badge } from "@/components/ui";
import { StoryTreeArchitecture } from "./StoryTreeArchitecture";
import { JSONDataDisplay } from "./JSONDataDisplay";
import * as yaml from "js-yaml";

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

interface ChapterData {
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
}

interface ChapterEditorProps {
  chapter?: ChapterData;
  initialData?: ChapterData;
  previewData?: ChapterData;
  story: Story;
  hideSidebar?: boolean;
  hasChanges?: boolean;
  onChapterUpdate?: (data: ChapterData) => void;
  onSave?: (data: ChapterData) => Promise<void>;
  onCancel?: () => void;
}

export function ChapterEditor({
  chapter,
  initialData,
  previewData,
  story,
  hideSidebar = false,
  hasChanges: externalHasChanges,
  onChapterUpdate,
  onSave,
  onCancel
}: ChapterEditorProps) {
  const router = useRouter();

  // Use the appropriate data source: previewData > initialData > chapter
  const chapterData = previewData || initialData || chapter;

  // Initialize all hooks BEFORE any conditional returns
  const [content, setContent] = useState(`  The Shadow Realm pulsed around Maya like a living thing, its twisted architecture bending reality with each heartbeat. She could feel Elena's presence—faint but unmistakable—calling to her from the void-touched spire ahead.

  "You feel it, don't you?" The Void Collector's voice echoed from everywhere and nowhere. "The pull of true power. The freedom from restraint."

  Maya's shadows writhed, responding to her emotional turmoil. Part of her—the part she'd been fighting since this began—whispered that he was right. Why should she hold back? Elena was dying. The world was at stake.`);

  const [currentWordCount, setCurrentWordCount] = useState(chapterData?.wordCount || 0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [yamlLevel, setYamlLevel] = useState<"story" | "part" | "chapter" | "scene">("chapter");
  const [isSaving, setIsSaving] = useState(false);

  // Initialize lastSaved date on client side to prevent hydration mismatch
  useEffect(() => {
    setLastSaved(new Date());
  }, []);

  // Auto-save handler (defined before useEffects that use it)
  const handleAutoSave = useCallback(async () => {
    if (!chapterData) return;

    setIsAutoSaving(true);
    try {
      const response = await fetch(`/studio/api/chapters/${chapterData.id}/autosave`, {
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
  }, [chapterData, content, currentWordCount]);

  // Auto-save functionality
  useEffect(() => {
    if (!chapterData) return;

    const autoSaveInterval = setInterval(() => {
      if (hasUnsavedChanges) {
        handleAutoSave();
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [hasUnsavedChanges, chapterData, handleAutoSave]);

  // Word count calculation
  useEffect(() => {
    if (!chapterData) return;

    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setCurrentWordCount(words.length);
    setHasUnsavedChanges(true);

    // Basic validation
    const errors = [];
    if (words.length < 100) {
      errors.push("Chapter should have at least 100 words");
    }
    if (words.length > chapterData.targetWordCount * 1.5) {
      errors.push("Chapter exceeds recommended length");
    }
    setValidationErrors(errors);
  }, [content, chapterData]);

  // Check for chapterData AFTER all hooks
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
              <h3 className="text-lg font-medium mb-2">No Chapter Data</h3>
              <p>Chapter data is not available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleManualSave = async () => {
    if (validationErrors.length === 0) {
      await handleAutoSave();
    }
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return "not yet saved";
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffMinutes < 1) return "just now";
    if (diffMinutes === 1) return "1 minute ago";
    return `${diffMinutes} minutes ago`;
  };

  const progressPercentage = (currentWordCount / chapterData.targetWordCount) * 100;

  const handleSave = async () => {
    if (!onSave || !externalHasChanges) return;
    setIsSaving(true);
    try {
      await onSave(chapterData);
      // Reset after saving - no original data state in ChapterEditor, so just maintain current state
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
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
                  onClick={() => router.push('/studio')}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back to Stories</span>
                </Button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                  📝 {chapterData.title}
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
                story={story as any}
                currentChapterId={chapterData.id}
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
            {/* Cancel/Save Buttons Above YAML */}
            {externalHasChanges && (
              <div className="flex justify-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleCancel}
                  className="whitespace-nowrap min-w-fit px-6"
                >
                  Cancel
                </Button>
                <Button
                  size="lg"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="whitespace-nowrap min-w-fit px-6"
                >
                  {isSaving ? '💾 Saving...' : '💾 Save Changes'}
                </Button>
              </div>
            )}

            {/* Chapter YAML Data */}
            <Card>
              <CardHeader>
                <CardTitle>📄 Chapter YAML Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">
                  <code>
                    {yaml.dump({ chapter: chapterData }, { indent: 2 })}
                  </code>
                </pre>
              </CardContent>
            </Card>

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

          {/* Right Sidebar - Empty (YAML moved to main area) */}
          {!hideSidebar && (
            <div className="space-y-6">
              {/* Sidebar content can be added here if needed */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}