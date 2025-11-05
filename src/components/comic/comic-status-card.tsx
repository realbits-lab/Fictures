/**
 * Comic Status Card Component
 *
 * Displays comic status and provides publish/unpublish controls
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

interface ComicStatusCardProps {
  sceneId: string;
  comicStatus: 'none' | 'draft' | 'published';
  comicPanelCount?: number;
  comicPublishedAt?: string | null;
  comicGeneratedAt?: string | null;
  onStatusChange?: () => void;
}

export function ComicStatusCard({
  sceneId,
  comicStatus,
  comicPanelCount = 0,
  comicPublishedAt,
  comicGeneratedAt,
  onStatusChange,
}: ComicStatusCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/studio/api/scenes/${sceneId}/comic/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish comic');
      }

      const data = await response.json();
      setSuccess('Comic panels published successfully!');
      onStatusChange?.();
    } catch (err) {
      console.error('Publish error:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish comic');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/studio/api/scenes/${sceneId}/comic/unpublish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to unpublish comic');
      }

      const data = await response.json();
      setSuccess('Comic panels unpublished successfully!');
      onStatusChange?.();
    } catch (err) {
      console.error('Unpublish error:', err);
      setError(err instanceof Error ? err.message : 'Failed to unpublish comic');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/studio/api/scenes/${sceneId}/comic/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          regenerate: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate comic');
      }

      const data = await response.json();
      setSuccess(`Comic regenerated with ${data.scene.comicPanelCount} panels!`);
      onStatusChange?.();
    } catch (err) {
      console.error('Regenerate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate comic');
    } finally {
      setLoading(false);
    }
  };

  // Determine status badge variant and icon
  const getStatusBadge = () => {
    switch (comicStatus) {
      case 'published':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <EyeOff className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'none':
      default:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            No Comics
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Comic Status
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Information */}
        <div className="space-y-2 text-sm">
          {comicPanelCount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Panels:</span>
              <span className="font-medium">{comicPanelCount}</span>
            </div>
          )}
          {comicGeneratedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Generated:</span>
              <span className="font-medium">
                {new Date(comicGeneratedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {comicPublishedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Published:</span>
              <span className="font-medium">
                {new Date(comicPublishedAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {comicStatus === 'draft' && (
            <>
              <Button
                onClick={handlePublish}
                disabled={loading}
                variant="default"
                size="default"
                className="w-full"
              >
                <Eye className="mr-2 h-4 w-4" />
                {loading ? 'Publishing...' : 'Publish Comic'}
              </Button>
              <Button
                onClick={handleRegenerate}
                disabled={loading}
                variant="outline"
                size="default"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {loading ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </>
          )}

          {comicStatus === 'published' && (
            <Button
              onClick={handleUnpublish}
              disabled={loading}
              variant="destructive"
              size="default"
              className="w-full"
            >
              <EyeOff className="mr-2 h-4 w-4" />
              {loading ? 'Unpublishing...' : 'Unpublish Comic'}
            </Button>
          )}

          {comicStatus === 'none' && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Generate comic panels first to enable publishing
            </p>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Help Text */}
        <p className="text-xs text-muted-foreground">
          {comicStatus === 'draft' && 'Preview your comic before publishing to readers.'}
          {comicStatus === 'published' && 'Comic is visible at /comics/[storyId]'}
          {comicStatus === 'none' && 'Use the Comic Panel Generation button above to create comics.'}
        </p>
      </CardContent>
    </Card>
  );
}
