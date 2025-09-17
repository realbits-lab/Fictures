"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";
import { SceneWriting } from "./SceneWriting";
import yaml from "js-yaml";

export interface SceneData {
  id: string | number;
  summary: string;
  time: string;
  place: string;
  pov: string;
  characters: Record<string, {
    enters?: string;
    exits?: string;
    status?: string;
    evidence?: string;
  }>;
  goal: string;
  obstacle: string;
  outcome: string;
  beats: string[];
  shift: string;
  leads_to: string;
  image_prompt: string;
  content?: string;
  wordCount?: number;
}

interface ChapterContext {
  title: string;
  pov: string;
  acts: {
    setup: { hook_in: string; orient: string; incident: string; };
    confrontation: { rising: string; midpoint: string; complicate: string; };
    resolution: { climax: string; resolve: string; hook_out: string; };
  };
}

interface SceneEditorProps {
  sceneId?: string;
  sceneNumber?: number;
  initialData?: SceneData;
  previewData?: SceneData;
  chapterContext?: ChapterContext;
  hasChanges?: boolean;
  onSceneUpdate?: (data: SceneData) => void;
  onSave?: (data: SceneData) => Promise<void>;
  onCancel?: () => void;
  onWrite?: (data: any) => void;
}

export function SceneEditor({
  sceneId,
  sceneNumber,
  initialData,
  previewData,
  chapterContext,
  hasChanges: externalHasChanges,
  onSceneUpdate,
  onSave,
  onCancel,
  onWrite
}: SceneEditorProps) {
  // Use the appropriate data source: previewData > initialData
  const sceneData = previewData || initialData;

  if (!sceneData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🎬 Scene Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-medium mb-2">No Scene Data</h3>
              <p>Scene data is not available.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave || !externalHasChanges) return;
    setIsSaving(true);
    try {
      await onSave(sceneData);
      // Reset after saving - data is managed by parent component
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

  const handleSceneWritingSave = async (data: { content: string; wordCount: number }) => {
    const saveData = {
      ...sceneData,
      content: data.content,
      wordCount: data.wordCount
    };
    if (onSave) {
      await onSave(saveData);
    }
  };

  const handleWrite = async (data: any) => {
    if (!onWrite) return;

    const writeData = {
      ...sceneData,
      content: data.content,
      wordCount: data.wordCount
    };
    await onWrite(writeData);
  };

  return (
    <div className="space-y-6">
      {/* Scene Editor Header with Save/Cancel */}
      {externalHasChanges && (
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">🎬 Scene Changes</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">You have unsaved changes to this scene</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="whitespace-nowrap"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="whitespace-nowrap"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* Scene Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎬 Scene {sceneNumber}: {sceneData.summary}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>🎯 Goal:</strong> {sceneData.goal}
            </div>
            <div>
              <strong>⚔️ Conflict:</strong> {sceneData.obstacle}
            </div>
            <div>
              <strong>✅ Outcome:</strong> {sceneData.outcome}
            </div>
            <div>
              <strong>📝 Word Count:</strong> {sceneData.wordCount || 0}
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <strong>🕐 Time:</strong> {sceneData.time}
            </div>
            <div>
              <strong>📍 Place:</strong> {sceneData.place}
            </div>
            <div>
              <strong>👁️ POV:</strong> {sceneData.pov}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scene YAML Data */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Scene YAML Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">
            <code>
              {yaml.dump({ scene: sceneData }, { indent: 2 })}
            </code>
          </pre>
        </CardContent>
      </Card>

      {/* Scene Writing Interface */}
      <SceneWriting
        initialContent={sceneData.content || ''}
        sceneId={sceneId}
        sceneNumber={sceneNumber}
        onSave={handleSceneWritingSave}
        onWrite={onWrite ? handleWrite : undefined}
      />
    </div>
  );
}