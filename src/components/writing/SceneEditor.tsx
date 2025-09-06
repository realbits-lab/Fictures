"use client";

import React from "react";
import { SceneWriting } from "./SceneWriting";

interface SceneData {
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
  initialData: SceneData;
  chapterContext?: ChapterContext;
  onSave: (data: any) => void;
  onWrite?: (data: any) => void;
}

export function SceneEditor({ 
  sceneId, 
  sceneNumber, 
  initialData, 
  chapterContext, 
  onSave, 
  onWrite 
}: SceneEditorProps) {
  const handleSave = async (data: { content: string; wordCount: number }) => {
    const saveData = {
      ...initialData,
      content: data.content,
      wordCount: data.wordCount
    };
    await onSave(saveData);
  };

  const handleWrite = async (data: any) => {
    if (!onWrite) return;
    
    const writeData = {
      ...initialData,
      content: data.content,
      wordCount: data.wordCount
    };
    await onWrite(writeData);
  };

  return (
    <SceneWriting
      initialContent={initialData.content || ''}
      sceneId={sceneId}
      sceneNumber={sceneNumber}
      onSave={handleSave}
      onWrite={onWrite ? handleWrite : undefined}
    />
  );
}