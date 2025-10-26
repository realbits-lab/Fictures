/**
 * ComicViewer Component
 *
 * Main container for viewing comic panels in vertical scroll format.
 * Handles data fetching, loading states, and gutter spacing.
 */

'use client';

import { useEffect, useState } from 'react';
import { PanelRenderer, PanelRendererSkeleton } from './panel-renderer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useSceneView } from '@/hooks/useSceneView';

interface PanelData {
  id: string;
  panel_number: number;
  shot_type: string;
  image_url: string;
  image_variants?: any;
  dialogue?: Array<{
    character_id: string;
    text: string;
    tone?: string;
  }>;
  sfx?: Array<{
    text: string;
    emphasis: 'normal' | 'large' | 'dramatic';
  }>;
  gutter_after: number;
  layout?: {
    y_position: number;
    height: number;
    gutter_after: number;
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
        <div className="mx-auto max-w-[1792px] space-y-8">
          {[1, 2, 3].map(i => (
            <PanelRendererSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Comic</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
          </AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!data || data.panels.length === 0) {
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

      {/* Comic panels container */}
      <div className="mx-auto max-w-[1792px]">
        {data.panels.map((panel, index) => (
          <div key={panel.id}>
            <PanelRenderer
              panelNumber={panel.panel_number}
              imageUrl={panel.image_url}
              imageVariants={panel.image_variants}
              dialogue={panel.dialogue}
              sfx={panel.sfx}
              characterNames={characterNames}
              shotType={panel.shot_type}
              priority={index === 0} // Prioritize first panel
              onLoad={() => handlePanelLoad(panel.panel_number)}
            />

            {/* Gutter spacing */}
            {index < data.panels.length - 1 && (
              <div
                style={{
                  height: `${panel.gutter_after}px`,
                }}
                className="w-full"
                aria-hidden="true"
              />
            )}
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
