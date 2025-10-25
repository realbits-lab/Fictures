/**
 * Comic Panel Generator Button Component
 *
 * Provides a UI for generating comic panels from a scene.
 * Shows progress during generation and displays results.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/Progress';
import { Wand2, CheckCircle2, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ComicPanelGeneratorButtonProps {
  sceneId: string;
  sceneTitle?: string;
  disabled?: boolean;
  onComplete?: () => void;
}

interface GenerationProgress {
  current: number;
  total: number;
  status: string;
}

interface GenerationResult {
  panels: Array<{
    id: string;
    panel_number: number;
    shot_type: string;
    image_url: string;
  }>;
  metadata: {
    total_panels: number;
    total_images: number;
    total_generation_time: number;
    estimated_reading_time: string;
  };
}

export function ComicPanelGeneratorButton({
  sceneId,
  sceneTitle = 'Scene',
  disabled = false,
  onComplete,
}: ComicPanelGeneratorButtonProps) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setProgress(null);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/comic/generate-panels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sceneId,
          targetPanelCount: 6, // Default to 6 panels
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start generation: ${response.statusText}`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'progress') {
              setProgress({
                current: data.current,
                total: data.total,
                status: data.status,
              });
            } else if (data.type === 'complete') {
              setResult(data.result);
              onComplete?.();
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }

    } catch (err) {
      console.error('Comic generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate comic panels');
    } finally {
      setGenerating(false);
    }
  };

  const progressPercentage = progress ? (progress.current / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Comic Panel Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Convert this scene into a visual comic format with AI-generated panels,
          dialogue bubbles, and sound effects.
        </p>

        {/* Generation Button */}
        {!generating && !result && (
          <Button
            onClick={handleGenerate}
            disabled={disabled}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Wand2 className="mr-2 h-5 w-5" />
            Generate Comic Panels
          </Button>
        )}

        {/* Progress Display */}
        {generating && progress && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{progress.status}</span>
              <span className="text-muted-foreground">
                {progress.current}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              This may take 3-5 minutes depending on panel count...
            </p>
          </div>
        )}

        {/* Success Display */}
        {result && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Generation Complete!
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="mt-2 space-y-1 text-sm">
                <div>Generated {result.metadata.total_panels} panels</div>
                <div>
                  Generation time: {(result.metadata.total_generation_time / 1000).toFixed(1)}s
                </div>
                <div>Estimated reading time: {result.metadata.estimated_reading_time}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  // Navigate to comic view or reload
                  window.location.reload();
                }}
              >
                View Comic
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={handleGenerate}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
