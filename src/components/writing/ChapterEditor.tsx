"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Button, Progress, Badge } from "@/components/ui";
import { StoryNavigationSidebar } from "./StoryNavigationSidebar";

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
    }>;
  }>;
  chapters: Array<{
    id: string;
    title: string;
    orderIndex: number;
    status: string;
    wordCount: number;
    targetWordCount: number;
  }>;
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
}

export function ChapterEditor({ chapter, story }: ChapterEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(`  The Shadow Realm pulsed around Maya like a living thing, its twisted architecture bending reality with each heartbeat. She could feel Elena's presence—faint but unmistakable—calling to her from the void-touched spire ahead.

  "You feel it, don't you?" The Void Collector's voice echoed from everywhere and nowhere. "The pull of true power. The freedom from restraint."

  Maya's shadows writhed, responding to her emotional turmoil. Part of her—the part she'd been fighting since this began—whispered that he was right. Why should she hold back? Elena was dying. The world was at stake.`);
  
  const [currentWordCount, setCurrentWordCount] = useState(chapter.wordCount);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
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

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Story Navigation */}
          <div className="space-y-6">
            <StoryNavigationSidebar story={story} currentChapterId={chapter.id} />
            
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <Button variant="secondary" size="sm" className="w-full">📱 Writing Tools</Button>
            </div>
          </div>
          
          {/* Main Writing Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chapter Status */}
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Word Count: <span className="font-medium text-gray-900 dark:text-gray-100">
                        {currentWordCount.toLocaleString()} / {chapter.targetWordCount.toLocaleString()}
                      </span>
                      {hasUnsavedChanges && <span className="text-orange-500 ml-2">• Unsaved</span>}
                    </div>
                    <Progress 
                      value={Math.min(progressPercentage, 100)} 
                      variant={progressPercentage >= 100 ? "success" : progressPercentage >= 80 ? "warning" : "default"}
                    />
                    {validationErrors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-xs text-red-600 dark:text-red-400">
                            ⚠️ {error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chapter Overview */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Chapter Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    <strong>📖 Scenes:</strong> {chapter.scenes.length} planned | Currently writing: Scene 2
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Scene Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  🎬 Scene Breakdown
                  <Button size="sm" variant="secondary">+ Add Scene</Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chapter.scenes.map((scene, index) => (
                  <div key={scene.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {getSceneStatusIcon(scene.status)} Scene {index + 1}: &ldquo;{scene.title}&rdquo; ({scene.wordCount} words)
                      </h4>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div><strong>Goal:</strong> {scene.goal}</div>
                      <div><strong>Conflict:</strong> {scene.conflict}</div>
                      <div><strong>Outcome:</strong> {scene.outcome}</div>
                    </div>
                  </div>
                ))}
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

          {/* Right Sidebar - Writing Tools */}
          <div className="space-y-6">
            {/* AI Writing Assistant */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI Writing Assistant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    &ldquo;Great tension build! Consider Maya&rsquo;s internal monologue to show her moral struggle. Suggest: &lsquo;Elena&rsquo;s voice in her memory, warning about power&rsquo;s cost.&rsquo;&rdquo;
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1">Apply</Button>
                  <Button size="sm" variant="ghost" className="flex-1">More Ideas</Button>
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
        </div>
      </div>
    </div>
  );
}