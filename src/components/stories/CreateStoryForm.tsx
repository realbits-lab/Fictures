"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui';
import { useStoryCreation } from './StoryCreationContext';
import { toast } from 'sonner';
import { trackStoryEvent } from '@/lib/analysis/google-analytics';

interface ProgressStep {
  phase: string;
  summary: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface StoryData {
  story?: any;
  characters?: any[];
  places?: any[];
  parts?: any[];
  chapters?: any[];
  scenes?: any[];
}

export function CreateStoryForm() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [characterCount, setCharacterCount] = useState(3);
  const [settingCount, setSettingCount] = useState(3);
  const [partsCount, setPartsCount] = useState(1);
  const [chaptersPerPart, setChaptersPerPart] = useState(1);
  const [scenesPerChapter, setScenesPerChapter] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<StoryData>({});
  const { setJsonData, clearJsonData } = useStoryCreation();
  const router = useRouter();

  // Define the default progress steps for Novel Generation (Adversity-Triumph Engine)
  const getDefaultProgressSteps = (): ProgressStep[] => [
    { phase: 'Story Summary', summary: 'Generating story foundation and moral framework', status: 'pending' },
    { phase: 'Characters', summary: 'Expanding character profiles with detailed arcs', status: 'pending' },
    { phase: 'Settings', summary: 'Creating immersive locations with adversity elements', status: 'pending' },
    { phase: 'Parts', summary: 'Structuring three-act framework with macro arcs', status: 'pending' },
    { phase: 'Chapters', summary: 'Generating detailed chapter structure', status: 'pending' },
    { phase: 'Scene Summaries', summary: 'Breaking down chapters into scene outlines', status: 'pending' },
    { phase: 'Scene Content', summary: 'Generating narrative content for each scene', status: 'pending' },
    { phase: 'Scene Evaluation', summary: 'Evaluating and improving scene quality', status: 'pending' },
    { phase: 'Images', summary: 'Creating AI images for characters and settings', status: 'pending' },
  ];

  // Initialize progress steps on component mount to show them by default
  const [progress, setProgress] = useState<ProgressStep[]>(getDefaultProgressSteps);

  const initializeProgress = () => {
    const steps = getDefaultProgressSteps();
    setProgress(steps);
    return steps;
  };

  const updateProgress = (stepIndex: number, status: ProgressStep['status']) => {
    setProgress(prev => prev.map((step, index) =>
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const resetForm = () => {
    // Reset all form state
    setPrompt('');
    setLanguage('English');
    setIsLoading(false);
    setError('');
    setIsCompleted(false);
    setGeneratedStoryId(null);
    setStoryData({});

    // Reset progress to initial state
    setProgress(getDefaultProgressSteps());

    // Clear JSON data in sidebar
    clearJsonData();

    console.log('✨ Form reset - ready for new story generation');
  };

  const simulateProgress = async (totalDuration: number) => {
    const steps = initializeProgress();
    const stepDuration = totalDuration / steps.length;

    for (let i = 0; i < steps.length; i++) {
      updateProgress(i, 'in_progress');
      
      // Wait for each step duration
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      
      updateProgress(i, 'completed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setProgress([]);
    setStoryData({});
    clearJsonData();

    // Initialize progress steps
    initializeProgress();

    try {
      // Use fetch with streaming for Novel generation (Adversity-Triumph Engine)
      const response = await fetch('/studio/api/novels/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: prompt.trim(),
          language,
          characterCount,
          settingCount,
          partsCount,
          chaptersPerPart,
          scenesPerChapter,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start story generation');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              console.log(`⏱️ [${new Date().toISOString()}] Frontend received SSE event: ${data.phase}`);

              switch (data.phase) {
                // Phase 1: Story Summary
                case 'story_summary_start':
                  updateProgress(0, 'in_progress');
                  break;
                case 'story_summary_complete':
                  updateProgress(0, 'completed');
                  if (data.data?.storySummary) {
                    setStoryData(prev => ({ ...prev, story: data.data.storySummary }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      storyJson: JSON.stringify(data.data.storySummary, null, 2)
                    }));
                  }
                  break;

                // Phase 2: Characters
                case 'characters_start':
                  updateProgress(1, 'in_progress');
                  if (data.data?.totalCharacters) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 1 ? {
                        ...step,
                        summary: `Expanding ${data.data.totalCharacters} character profiles with detailed arcs`
                      } : step
                    ));
                  }
                  break;
                case 'characters_progress':
                  console.log('[Frontend] Received characters_progress:', data.data);
                  if (data.data?.currentCharacter !== undefined && data.data?.totalCharacters) {
                    const characterNum = data.data.currentCharacter;
                    const totalCharacters = data.data.totalCharacters;
                    const percentage = data.data.percentage || Math.round((characterNum / totalCharacters) * 100);

                    console.log(`[Frontend] Updating characters progress: ${characterNum} of ${totalCharacters} (${percentage}%)`);
                    setProgress(prev => prev.map((step, index) =>
                      index === 1 ? {
                        ...step,
                        summary: `Character ${characterNum} of ${totalCharacters} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'characters_complete':
                  updateProgress(1, 'completed');
                  if (data.data?.totalCharacters) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 1 ? {
                        ...step,
                        summary: `${data.data.totalCharacters} characters created`
                      } : step
                    ));
                  }
                  if (data.data?.characters) {
                    setStoryData(prev => ({ ...prev, characters: data.data.characters }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      charactersJson: JSON.stringify(data.data.characters, null, 2)
                    }));
                  }
                  break;

                // Phase 3: Settings
                case 'settings_start':
                  updateProgress(2, 'in_progress');
                  if (data.data?.totalSettings) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 2 ? {
                        ...step,
                        summary: `Creating ${data.data.totalSettings} immersive locations with adversity elements`
                      } : step
                    ));
                  }
                  break;
                case 'settings_progress':
                  console.log('[Frontend] Received settings_progress:', data.data);
                  if (data.data?.currentSetting !== undefined && data.data?.totalSettings) {
                    const settingNum = data.data.currentSetting;
                    const totalSettings = data.data.totalSettings;
                    const percentage = data.data.percentage || Math.round((settingNum / totalSettings) * 100);

                    console.log(`[Frontend] Updating settings progress: ${settingNum} of ${totalSettings} (${percentage}%)`);
                    setProgress(prev => prev.map((step, index) =>
                      index === 2 ? {
                        ...step,
                        summary: `Setting ${settingNum} of ${totalSettings} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'settings_complete':
                  updateProgress(2, 'completed');
                  if (data.data?.totalSettings) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 2 ? {
                        ...step,
                        summary: `${data.data.totalSettings} settings created`
                      } : step
                    ));
                  }
                  if (data.data?.settings) {
                    setStoryData(prev => ({ ...prev, places: data.data.settings }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      placesJson: JSON.stringify(data.data.settings, null, 2)
                    }));
                  }
                  break;

                // Phase 4: Parts
                case 'parts_start':
                  updateProgress(3, 'in_progress');
                  if (data.data?.totalParts) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 3 ? {
                        ...step,
                        summary: `Structuring ${data.data.totalParts}-act framework with macro arcs`
                      } : step
                    ));
                  }
                  break;
                case 'parts_progress':
                  console.log('[Frontend] Received parts_progress:', data.data);
                  if (data.data?.currentPart !== undefined && data.data?.totalParts) {
                    const partNum = data.data.currentPart;
                    const totalParts = data.data.totalParts;
                    const percentage = data.data.percentage || Math.round((partNum / totalParts) * 100);

                    console.log(`[Frontend] Updating parts progress: ${partNum} of ${totalParts} (${percentage}%)`);
                    setProgress(prev => prev.map((step, index) =>
                      index === 3 ? {
                        ...step,
                        summary: `Part ${partNum} of ${totalParts} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'parts_complete':
                  updateProgress(3, 'completed');
                  if (data.data?.totalParts) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 3 ? {
                        ...step,
                        summary: `${data.data.totalParts} acts created`
                      } : step
                    ));
                  }
                  if (data.data?.parts) {
                    setStoryData(prev => ({ ...prev, parts: data.data.parts }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      partsJson: JSON.stringify(data.data.parts, null, 2)
                    }));
                  }
                  break;

                // Phase 5: Chapters
                case 'chapters_start':
                  updateProgress(4, 'in_progress');
                  break;
                case 'chapters_progress':
                  if (data.data?.currentPart && data.data?.totalParts) {
                    const partNum = data.data.currentPart;
                    const totalParts = data.data.totalParts;
                    const percentage = data.data.percentage || Math.round((partNum / totalParts) * 100);

                    setProgress(prev => prev.map((step, index) =>
                      index === 4 ? {
                        ...step,
                        summary: `Part ${partNum} of ${totalParts} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'chapters_complete':
                  updateProgress(4, 'completed');
                  if (data.data?.chapters) {
                    setStoryData(prev => ({ ...prev, chapters: data.data.chapters }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      chaptersJson: JSON.stringify(data.data.chapters, null, 2)
                    }));
                  }
                  break;

                // Phase 6: Scene Summaries
                case 'scene_summaries_start':
                  updateProgress(5, 'in_progress');
                  break;
                case 'scene_summaries_progress':
                  if (data.data?.currentChapter && data.data?.totalChapters) {
                    const chapterNum = data.data.currentChapter;
                    const totalChapters = data.data.totalChapters;
                    const percentage = data.data.percentage || Math.round((chapterNum / totalChapters) * 100);

                    setProgress(prev => prev.map((step, index) =>
                      index === 5 ? {
                        ...step,
                        summary: `Chapter ${chapterNum} of ${totalChapters} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'scene_summaries_complete':
                  updateProgress(5, 'completed');
                  if (data.data?.sceneSummaries) {
                    setStoryData(prev => ({ ...prev, scenes: data.data.sceneSummaries }));
                    // @ts-ignore
                    setJsonData(prev => ({
                      ...prev,
                      scenesJson: JSON.stringify(data.data.sceneSummaries, null, 2)
                    }));
                  }
                  break;

                // Phase 7: Scene Content
                case 'scene_content_start':
                  updateProgress(6, 'in_progress');
                  if (data.data?.totalScenes) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 6 ? {
                        ...step,
                        summary: `Generating narrative content for ${data.data.totalScenes} scenes...`
                      } : step
                    ));
                  }
                  break;
                case 'scene_content_progress':
                  if (data.data?.currentScene && data.data?.totalScenes) {
                    const sceneNum = data.data.currentScene;
                    const totalScenes = data.data.totalScenes;
                    const percentage = data.data.percentage || Math.round((sceneNum / totalScenes) * 100);

                    setProgress(prev => prev.map((step, index) =>
                      index === 6 ? {
                        ...step,
                        summary: `Scene ${sceneNum} of ${totalScenes} (${percentage}%)`
                      } : step
                    ));
                  }
                  break;
                case 'scene_content_complete':
                  updateProgress(6, 'completed');
                  if (data.data?.completedScenes) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 6 ? {
                        ...step,
                        summary: `Generated content for ${data.data.completedScenes} scenes`
                      } : step
                    ));
                  }
                  break;

                // Phase 8: Scene Evaluation
                case 'scene_evaluation_start':
                  updateProgress(7, 'in_progress');
                  break;
                case 'scene_evaluation_progress':
                  if (data.data?.message) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 7 ? {
                        ...step,
                        summary: data.data.message
                      } : step
                    ));
                  }
                  break;
                case 'scene_evaluation_complete':
                  updateProgress(7, 'completed');
                  break;

                // Phase 9: Images
                case 'images_start':
                  updateProgress(8, 'in_progress');
                  if (data.data?.totalImages) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 8 ? {
                        ...step,
                        summary: `Generating ${data.data.totalImages} images...`
                      } : step
                    ));
                  }
                  break;
                case 'images_progress':
                  if (data.data?.message) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 8 ? {
                        ...step,
                        summary: data.data.message
                      } : step
                    ));
                  }
                  break;
                case 'images_complete':
                  updateProgress(8, 'completed');
                  break;

                case 'complete':
                  // All phases completed successfully
                  const completedStoryId = data.data?.storyId || data.storyId;
                  console.log('✅ Story generation completed:', completedStoryId);

                  // Track story creation
                  if (completedStoryId) {
                    trackStoryEvent.create(completedStoryId);
                  }

                  // Mark all remaining steps as completed
                  setProgress(prev => prev.map(step =>
                    step.status === 'pending' || step.status === 'in_progress'
                      ? { ...step, status: 'completed' }
                      : step
                  ));

                  // Set completion state and store story ID
                  setIsCompleted(true);
                  setGeneratedStoryId(completedStoryId);
                  setIsLoading(false);

                  // Show success message but don't redirect
                  // User can manually navigate to stories when ready
                  break;

                case 'error':
                  // Handle error
                  console.error('Story generation error:', data.error);
                  const errorMessage = data.error || 'Failed to generate story';
                  setError(errorMessage);

                  // Show detailed error in toast
                  toast.error('Story Generation Error', {
                    summary: errorMessage,
                    duration: 10000,
                  });

                  // Mark current in-progress step as error
                  setProgress(prev => prev.map(step =>
                    step.status === 'in_progress' ? { ...step, status: 'error' } : step
                  ));
                  break;
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error with streaming story generation:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate story. Please try again.';
      setError(errorMsg);

      // Show error in toast with details
      toast.error('Story Generation Failed', {
        summary: errorMsg,
        duration: 10000,
      });

      // Mark current step as error
      setProgress(prev => prev.map(step =>
        step.status === 'in_progress' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <span>Novel Generator</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Powered by the Adversity-Triumph Engine - Create emotionally resonant stories with deep character development and moral frameworks
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Story Idea *</Label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your story idea... For example: 'A mysterious librarian discovers that books in her ancient library are portals to different worlds, and she must save them from being destroyed by a digital transformation project.'"
              rows={6}
              disabled={isLoading}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-blue-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Main Language *</Label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:focus-visible:ring-blue-400"
              required
            >
              <option value="English">English</option>
              <option value="Korean">Korean</option>
            </select>
          </div>

          {/* Story Structure Controls */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Story Structure</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="characterCount">Characters: {characterCount}</Label>
                <input
                  type="range"
                  id="characterCount"
                  min="1"
                  max="5"
                  value={characterCount}
                  onChange={(e) => setCharacterCount(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settingCount">Settings: {settingCount}</Label>
                <input
                  type="range"
                  id="settingCount"
                  min="1"
                  max="5"
                  value={settingCount}
                  onChange={(e) => setSettingCount(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partsCount">Parts (Acts): {partsCount}</Label>
                <input
                  type="range"
                  id="partsCount"
                  min="1"
                  max="3"
                  value={partsCount}
                  onChange={(e) => setPartsCount(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chaptersPerPart">Chapters per Part: {chaptersPerPart}</Label>
                <input
                  type="range"
                  id="chaptersPerPart"
                  min="1"
                  max="5"
                  value={chaptersPerPart}
                  onChange={(e) => setChaptersPerPart(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="scenesPerChapter">Scenes per Chapter: {scenesPerChapter}</Label>
                <input
                  type="range"
                  id="scenesPerChapter"
                  min="3"
                  max="8"
                  value={scenesPerChapter}
                  onChange={(e) => setScenesPerChapter(parseInt(e.target.value))}
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t">
              Total: {partsCount} part{partsCount > 1 ? 's' : ''}, {partsCount * chaptersPerPart} chapter{partsCount * chaptersPerPart > 1 ? 's' : ''}, ~{partsCount * chaptersPerPart * scenesPerChapter} scenes
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Progress Display */}
          {progress.length > 0 && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center space-x-2 mb-4">
                {isLoading && !isCompleted && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Story Generation Progress</h3>
              </div>
              
              {progress.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'completed' && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'in_progress' && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {step.status === 'error' && (
                      <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.status === 'completed' ? 'text-green-700 dark:text-green-400' :
                      step.status === 'in_progress' ? 'text-blue-700 dark:text-blue-400' :
                      step.status === 'error' ? 'text-red-700 dark:text-red-400' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.phase}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isCompleted && generatedStoryId && (
            <div className="p-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Story generated successfully!
                </p>
              </div>
              <div className="flex space-x-2 mt-3">
                <Button
                  type="button"
                  onClick={() => router.push(`/studio/edit/story/${generatedStoryId}`)}
                  className="flex-1"
                >
                  Open Story
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetForm}
                >
                  Generate Another Story
                </Button>
              </div>
            </div>
          )}

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !prompt.trim() || isCompleted}
              className="flex-1"
            >
              {isLoading ? 'Generating Story...' : 'Generate Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}