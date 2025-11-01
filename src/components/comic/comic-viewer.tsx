/**
 * ComicViewer Component
 *
 * Main container for viewing comic panels in vertical scroll format.
 * Handles data fetching, loading states, and gutter spacing.
 */

'use client';

import { useEffect, useState } from 'react';
import { PanelRenderer, PanelRendererSkeleton } from './panel-renderer';
import { ProgressiveComicPanel, getRecommendedInitialLoadCount } from './progressive-comic-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useSceneView } from '@/hooks/useSceneView';

interface PanelData {
  id: string;
  panel_number: number;
  shot_type: string;
  image_url: string;
  image_variants?: any;
  narrative?: string | null;
  dialogue?: Array<{
    character_id: string;
    text: string;
    tone?: string;
  }>;
  sfx?: Array<{
    text: string;
    emphasis: 'normal' | 'large' | 'dramatic';
  }>;
  description?: string | null;
  layout?: {
    y_position: number;
    height: number;
    total_height: number;
  };
}

interface ComicViewerData {
  sceneId: string;
  sceneTitle: string;
  panels: PanelData[];
  layout: {
    total_height: number;
  };
  metadata: {
    total_panels: number;
    total_height: number;
    estimated_reading_time: string;
    pacing: 'slow' | 'moderate' | 'fast';
  };
}

interface ComicViewerProps {
  sceneId: string;
  characterNames?: Record<string, string>; // Map of character_id to character name
  className?: string;
  onComplete?: () => void;
}

export function ComicViewer({
  sceneId,
  characterNames = {},
  className,
  onComplete,
}: ComicViewerProps) {
  const [data, setData] = useState<ComicViewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedPanels, setLoadedPanels] = useState<Set<number>>(new Set());
  const [initialLoadCount, setInitialLoadCount] = useState(3);

  // Set recommended initial load count based on screen size
  useEffect(() => {
    setInitialLoadCount(getRecommendedInitialLoadCount());
  }, []);

  // Track scene views for comics
  useSceneView(sceneId, {
    enabled: true,
    readingFormat: 'comic',
    debounceMs: 1000,
  });

  // Fetch panel data
  useEffect(() => {
    const fetchPanels = async () => {
      try {
        setLoading(true);
        setError(null);
        setData(null); // Reset data when fetching new scene

        const response = await fetch(`/api/comic/${sceneId}/panels`);

        if (!response.ok) {
          throw new Error(`Failed to fetch panels: ${response.statusText}`);
        }

        const result = await response.json();
        setData(result);

      } catch (err) {
        console.error('Error fetching comic panels:', err);
        setError(err instanceof Error ? err.message : 'Failed to load comic panels');
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, [sceneId]);

  // Track panel loading completion
  const handlePanelLoad = (panelNumber: number) => {
    setLoadedPanels(prev => {
      const next = new Set(prev);
      next.add(panelNumber);
      return next;
    });
  };

  // Check if all panels are loaded
  useEffect(() => {
    if (data && loadedPanels.size === data.panels.length && loadedPanels.size > 0) {
      onComplete?.();
    }
  }, [loadedPanels, data, onComplete]);

  // Retry handler
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setData(null);
    setLoadedPanels(new Set());
    window.location.reload();
  };

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <div className="mx-auto max-w-[1792px] min-h-[400px] flex items-center justify-center">
          <div className="max-w-sm text-center px-6">
            {/* Compact animated loader */}
            <div className="mb-6 relative">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/40 dark:to-pink-800/40 rounded-full animate-ping opacity-20"></div>

              {/* Middle rotating ring */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-b-purple-400 border-l-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>

                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center">
                    <span className="text-3xl animate-bounce" style={{ animationDuration: '1.5s' }}>📖</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading message */}
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Loading Comic Panels
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Preparing your visual journey...
            </p>

            {/* Loading progress dots */}
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div className="max-w-md mx-auto py-12 px-6 text-center">
          {/* Friendly illustration */}
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center">
              <span className="text-5xl">📚</span>
            </div>
          </div>

          {/* Friendly message */}
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Oops! Having Trouble Loading This Comic
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            We couldn't load the comic panels right now. This might be a temporary hiccup.
            Please try again in a moment.
          </p>

          {/* Technical details (collapsible) */}
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              Show technical details
            </summary>
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 font-mono break-words">
              {error}
            </div>
          </details>

          {/* Action button */}
          <Button
            onClick={handleRetry}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Empty state - only show if we're not loading and have no data
  if (!loading && (!data || data.panels.length === 0)) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Panels Available</AlertTitle>
          <AlertDescription>
            This scene has not been converted to comic format yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Main render
  return (
    <div className={className}>
      {/* Metadata header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">{data.sceneTitle}</h2>
        <div className="mt-2 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{data.metadata.total_panels} panels</span>
          <span>•</span>
          <span>{data.metadata.estimated_reading_time} read</span>
          <span>•</span>
          <span className="capitalize">{data.metadata.pacing} pacing</span>
        </div>
      </div>

      {/* Comic panels container - Progressive Loading */}
      <div className="mx-auto max-w-[1792px] space-y-6">
        {data.panels.map((panel, index) => (
          <div key={panel.id}>
            <ProgressiveComicPanel
              panel={panel}
              panelIndex={index}
              totalPanels={data.panels.length}
              characterNames={characterNames}
              onLoad={handlePanelLoad}
              initialLoadCount={initialLoadCount}
            />
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      {loadedPanels.size > 0 && loadedPanels.size < data.panels.length && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-black/75 px-4 py-2 text-sm text-white">
          Loading panels: {loadedPanels.size} / {data.panels.length}
        </div>
      )}
    </div>
  );
}
