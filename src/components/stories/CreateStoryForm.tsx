"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui';
import { useStoryCreation } from './StoryCreationContext';
import { toast } from 'sonner';

interface ProgressStep {
  phase: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface StoryData {
  story?: any;
  characters?: any[];
  places?: any[];
  parts?: any[];
  chapters?: any[];
  scenes?: any[];
  analysis?: {
    validation?: {
      overallValid?: boolean;
      totalErrors?: number;
      totalWarnings?: number;
    };
    evaluation?: {
      overallScore?: number;
    };
  };
  improvement?: {
    errorsFixed?: number;
    warningsReduced?: number;
    scoreImproved?: number;
  };
}

export function CreateStoryForm() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
  const [storyData, setStoryData] = useState<StoryData>({});
  const { setJsonData, clearJsonData } = useStoryCreation();
  const router = useRouter();

  const initializeProgress = () => {
    const steps: ProgressStep[] = [
      { phase: 'Story Foundation', description: 'Establishing premise, theme, and dramatic question', status: 'pending' },
      { phase: 'Three-Act Structure', description: 'Developing parts with key narrative beats', status: 'pending' },
      { phase: 'Characters', description: 'Creating detailed character profiles with psychology', status: 'pending' },
      { phase: 'Settings', description: 'Building immersive locations with sensory details', status: 'pending' },
      { phase: 'Chapters & Scenes', description: 'Structuring chapters with hooks and scene breakdowns', status: 'pending' },
      { phase: 'Scene Content', description: 'Generating narrative content for each scene', status: 'pending' },
      { phase: 'Quality Analysis', description: 'Analyzing story quality and structure', status: 'pending' },
      { phase: 'Visual Generation', description: 'Creating AI images for characters and settings', status: 'pending' },
    ];
    setProgress(steps);
    return steps;
  };

  const updateProgress = (stepIndex: number, status: ProgressStep['status']) => {
    setProgress(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
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
      // Use fetch with streaming for HNS generation
      const response = await fetch('/api/stories/generate-hns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim(), language }),
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

              switch (data.phase) {
                case 'progress':
                  // Update progress based on step
                  const stepMap: Record<string, number> = {
                    'analyzing_quality': 6,
                    'improving_content': 6,
                    'generating_character_images': 7,
                    'generating_setting_images': 7,
                  };
                  if (data.data.step && stepMap[data.data.step] !== undefined) {
                    updateProgress(stepMap[data.data.step], 'in_progress');

                    // Update the description to show current activity
                    if (data.data.step === 'analyzing_quality') {
                      setProgress(prev => prev.map((step, index) =>
                        index === 6 ? {
                          ...step,
                          description: data.data.message || 'Analyzing story quality and structure...'
                        } : step
                      ));
                    } else if (data.data.step === 'improving_content') {
                      setProgress(prev => prev.map((step, index) =>
                        index === 6 ? {
                          ...step,
                          description: data.data.message || 'Applying AI-powered improvements...'
                        } : step
                      ));
                    } else if (data.data.step === 'generating_character_images') {
                      setProgress(prev => prev.map((step, index) =>
                        index === 7 ? {
                          ...step,
                          description: data.data.message || 'Generating character images...'
                        } : step
                      ));
                    } else if (data.data.step === 'generating_setting_images') {
                      setProgress(prev => prev.map((step, index) =>
                        index === 7 ? {
                          ...step,
                          description: data.data.message || 'Generating setting images...'
                        } : step
                      ));
                    }
                  }
                  break;

                case 'phase1_start':
                  updateProgress(0, 'in_progress');
                  break;
                case 'phase1_complete':
                  updateProgress(0, 'completed');
                  // Update sidebar with story data
                  if (data.data.story) {
                    setStoryData(prev => ({
                      ...prev,
                      story: data.data.story
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      storyJson: JSON.stringify(data.data.story, null, 2)
                    }));
                  }
                  break;

                case 'phase2_start':
                  updateProgress(1, 'in_progress');
                  break;
                case 'phase2_complete':
                  updateProgress(1, 'completed');
                  // Update sidebar with parts data
                  if (data.data.parts) {
                    setStoryData(prev => ({
                      ...prev,
                      parts: data.data.parts
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      partsJson: JSON.stringify(data.data.parts, null, 2)
                    }));
                  }
                  break;

                case 'phase3_start':
                  updateProgress(2, 'in_progress');
                  break;
                case 'phase3_complete':
                  updateProgress(2, 'completed');
                  // Update sidebar with characters data
                  if (data.data.characters) {
                    setStoryData(prev => ({
                      ...prev,
                      characters: data.data.characters
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      charactersJson: JSON.stringify(data.data.characters, null, 2)
                    }));
                  }
                  break;

                case 'phase4_start':
                  updateProgress(3, 'in_progress');
                  break;
                case 'phase4_complete':
                  updateProgress(3, 'completed');
                  // Update sidebar with settings data
                  if (data.data.settings) {
                    setStoryData(prev => ({
                      ...prev,
                      places: data.data.settings
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      placesJson: JSON.stringify(data.data.settings, null, 2)
                    }));
                  }
                  break;

                case 'phase5_6_start':
                  updateProgress(4, 'in_progress');
                  break;
                case 'phase5_6_complete':
                  updateProgress(4, 'completed');
                  // Update sidebar with chapters and scenes data
                  if (data.data.chapters) {
                    setStoryData(prev => ({
                      ...prev,
                      chapters: data.data.chapters
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      chaptersJson: JSON.stringify(data.data.chapters, null, 2)
                    }));
                  }
                  if (data.data.scenes) {
                    setStoryData(prev => ({
                      ...prev,
                      scenes: data.data.scenes
                    }));
                    setJsonData(prev => ({
                      ...prev,
                      scenesJson: JSON.stringify(data.data.scenes, null, 2)
                    }));
                  }
                  break;

                // Phase 7: Scene Content Generation
                case 'phase7_start':
                  updateProgress(5, 'in_progress');
                  // Update phase description with progress
                  if (data.data?.totalScenes) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 5 ? {
                        ...step,
                        description: `Generating narrative content for ${data.data.totalScenes} scenes...`
                      } : step
                    ));
                  }
                  break;

                case 'phase7_progress':
                  // Update progress description with current scene
                  if (data.data?.percentage) {
                    setProgress(prev => prev.map((step, index) =>
                      index === 5 ? {
                        ...step,
                        description: `Generating scene ${data.data.completedScenes}/${data.data.totalScenes}: ${data.data.currentScene} (${data.data.percentage}%)`
                      } : step
                    ));
                  }
                  break;

                case 'phase7_warning':
                  // Log warning but continue
                  console.warn('Scene content generation warning:', data.data?.message);
                  break;

                case 'phase7_complete':
                  updateProgress(5, 'completed');
                  // Reset description
                  setProgress(prev => prev.map((step, index) =>
                    index === 5 ? {
                      ...step,
                      description: `Generated content for ${data.data?.completedScenes || 'all'} scenes`
                    } : step
                  ));
                  break;

                case 'hns_complete':
                  // HNS structure generated - update with complete structure
                  const hnsDoc = data.data.hnsDocument;
                  if (hnsDoc) {
                    // Extract chapters and scenes from the nested structure
                    let allChapters = [];
                    let allScenes = [];

                    // Use chapters directly if available
                    if (hnsDoc.chapters && Array.isArray(hnsDoc.chapters)) {
                      allChapters = hnsDoc.chapters;
                    }

                    // Use scenes directly if available
                    if (hnsDoc.scenes && Array.isArray(hnsDoc.scenes)) {
                      allScenes = hnsDoc.scenes;
                    }

                    // Also extract from nested parts structure for display
                    if (!allChapters.length && hnsDoc.parts && Array.isArray(hnsDoc.parts)) {
                      hnsDoc.parts.forEach(part => {
                        if (part.chapters && Array.isArray(part.chapters)) {
                          part.chapters.forEach(chapter => {
                            allChapters.push(chapter);

                            // Extract scenes from chapters
                            if (chapter.scenes && Array.isArray(chapter.scenes)) {
                              // If scenes are IDs, they're already in allScenes
                              // If scenes are objects, add them
                              chapter.scenes.forEach(scene => {
                                if (typeof scene === 'object' && scene !== null) {
                                  allScenes.push(scene);
                                }
                              });
                            }
                          });
                        }
                      });
                    }

                    setJsonData({
                      storyJson: JSON.stringify(hnsDoc.story, null, 2),
                      partsJson: JSON.stringify(hnsDoc.parts, null, 2),
                      charactersJson: JSON.stringify(hnsDoc.characters, null, 2),
                      placesJson: JSON.stringify(hnsDoc.settings, null, 2),
                      chaptersJson: JSON.stringify(allChapters, null, 2),
                      scenesJson: JSON.stringify(allScenes, null, 2),
                    });
                    // Update all generation steps as complete
                    for (let i = 0; i <= 4; i++) {
                      updateProgress(i, 'completed');
                    }
                  }
                  break;

                case 'analysis_complete':
                  // Store analysis results
                  if (data.data.validation && data.data.evaluation) {
                    const analysisData = {
                      validation: data.data.validation,
                      evaluation: data.data.evaluation,
                      timestamp: new Date().toISOString()
                    };
                    setStoryData(prev => ({
                      ...prev,
                      analysis: {
                        validation: data.data.validation,
                        evaluation: data.data.evaluation
                      }
                    }));
                    // Update JSON sidebar
                    setJsonData(prev => ({
                      ...prev,
                      analysisJson: JSON.stringify(analysisData, null, 2)
                    }));
                  }
                  // Mark quality analysis step as completed
                  updateProgress(6, 'completed');
                  setProgress(prev => prev.map((step, index) =>
                    index === 6 ? {
                      ...step,
                      description: `Analysis complete - Score: ${data.data.evaluation?.overallScore || 0}/100`
                    } : step
                  ));
                  break;

                case 'improvement_skipped':
                  // Store analysis results
                  if (data.data.analysis) {
                    const analysisData = {
                      validation: data.data.analysis.validation,
                      evaluation: data.data.analysis.evaluation,
                      status: 'quality_verified',
                      timestamp: new Date().toISOString()
                    };
                    setStoryData(prev => ({
                      ...prev,
                      analysis: {
                        validation: data.data.analysis.validation,
                        evaluation: data.data.analysis.evaluation
                      }
                    }));
                    // Update JSON sidebar
                    setJsonData(prev => ({
                      ...prev,
                      analysisJson: JSON.stringify(analysisData, null, 2)
                    }));
                  }
                  // Mark quality analysis step as completed
                  updateProgress(6, 'completed');
                  setProgress(prev => prev.map((step, index) =>
                    index === 6 ? {
                      ...step,
                      description: `Quality verified - Score: ${data.data.analysis?.evaluation?.overallScore || 0}/100`
                    } : step
                  ));
                  break;

                case 're_analysis_complete':
                  // Store improvement results
                  if (data.data.improvement) {
                    const analysisData = {
                      before: {
                        validation: data.data.before?.validation,
                        evaluation: data.data.before?.evaluation
                      },
                      after: {
                        validation: data.data.after?.validation,
                        evaluation: data.data.after?.evaluation
                      },
                      improvement: data.data.improvement,
                      status: 'improved',
                      timestamp: new Date().toISOString()
                    };
                    setStoryData(prev => ({
                      ...prev,
                      improvement: data.data.improvement,
                      analysis: {
                        validation: data.data.after?.validation,
                        evaluation: data.data.after?.evaluation
                      }
                    }));
                    // Update JSON sidebar
                    setJsonData(prev => ({
                      ...prev,
                      analysisJson: JSON.stringify(analysisData, null, 2)
                    }));
                  }
                  // Mark quality analysis step as completed
                  updateProgress(6, 'completed');
                  setProgress(prev => prev.map((step, index) =>
                    index === 6 ? {
                      ...step,
                      description: `Improvements applied - Score: ${data.data.after?.evaluation?.overallScore || 0}/100`
                    } : step
                  ));
                  break;

                case 'complete':
                  // All phases completed successfully
                  const completedStoryId = data.data?.storyId || data.storyId;
                  console.log('✅ Story generation completed:', completedStoryId);

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
                    description: errorMessage,
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
        description: errorMsg,
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
          <span className="text-2xl">🤖</span>
          <span>AI Story Generator</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Describe your story idea and let AI create a complete story structure for you
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

          {error && (
            <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Progress Display */}
          {progress.length > 0 && (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
              <div className="flex items-center space-x-2 mb-4">
                {!isCompleted && (
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
              disabled={isLoading || !prompt.trim()}
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