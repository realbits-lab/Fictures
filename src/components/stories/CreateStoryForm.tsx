"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Button } from '@/components/ui';
import { Label } from '@/components/ui';
import { useStoryCreation } from './StoryCreationContext';

interface ProgressStep {
  phase: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface YamlData {
  storyYaml?: string;
  charactersYaml?: string;
  placesYaml?: string;
  partsYaml?: string;
}

export function CreateStoryForm() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<ProgressStep[]>([]);
  const { setYamlData, clearYamlData } = useStoryCreation();
  const router = useRouter();

  const initializeProgress = () => {
    const steps: ProgressStep[] = [
      { phase: 'HNS Generation', description: 'Creating complete story structure using Hierarchical Narrative Schema', status: 'pending' },
      { phase: 'Story Foundation', description: 'Establishing premise, theme, and dramatic question', status: 'pending' },
      { phase: 'Three-Act Structure', description: 'Developing parts with key narrative beats', status: 'pending' },
      { phase: 'Characters', description: 'Creating detailed character profiles with psychology', status: 'pending' },
      { phase: 'Settings', description: 'Building immersive locations with sensory details', status: 'pending' },
      { phase: 'Chapters & Scenes', description: 'Structuring chapters with hooks and scene breakdowns', status: 'pending' },
      { phase: 'Visual Generation', description: 'Creating AI images for characters and settings', status: 'pending' },
      { phase: 'Database', description: 'Storing complete HNS data in database', status: 'pending' },
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
    clearYamlData();

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
                    'generating_hns': 0,
                    'storing_database': 6,
                    'generating_character_images': 6,
                    'generating_setting_images': 6,
                  };
                  if (data.data.step && stepMap[data.data.step] !== undefined) {
                    updateProgress(stepMap[data.data.step], 'in_progress');
                  }
                  break;

                case 'hns_complete':
                  // HNS structure generated - update with complete structure
                  const hnsDoc = data.data.hnsDocument;
                  if (hnsDoc) {
                    setYamlData({
                      storyYaml: JSON.stringify(hnsDoc.story, null, 2),
                      partsYaml: JSON.stringify(hnsDoc.parts, null, 2),
                      charactersYaml: JSON.stringify(hnsDoc.characters, null, 2),
                      placesYaml: JSON.stringify(hnsDoc.settings, null, 2),
                    });
                    // Update all generation steps as complete
                    for (let i = 0; i <= 5; i++) {
                      updateProgress(i, 'completed');
                    }
                  }
                  break;

                case 'complete':
                  // All phases completed successfully
                  console.log('✅ Story generation completed:', data.storyId);

                  // Wait a moment to show completion
                  setTimeout(() => {
                    router.push(`/stories`);
                  }, 2000);
                  break;

                case 'error':
                  // Handle error
                  console.error('Story generation error:', data.error);
                  setError(data.error || 'Failed to generate story');

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
      setError('Failed to generate story. Please try again.');

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
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
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