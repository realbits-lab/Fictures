"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

interface SceneWritingProps {
  initialContent?: string;
  sceneId?: string | number;
  sceneNumber?: number;
  onSave: (data: { content: string; wordCount: number }) => void;
  onWrite?: (data: any) => void;
  disabled?: boolean;
}

export function SceneWriting({ 
  initialContent = '', 
  sceneId, 
  sceneNumber,
  onSave, 
  onWrite, 
  disabled = false 
}: SceneWritingProps) {
  const [sceneContent, setSceneContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Calculate word count
  const wordCount = sceneContent.trim() ? sceneContent.trim().split(/\s+/).length : 0;

  // Auto-save functionality
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (sceneContent !== initialContent && sceneContent.trim() !== '') {
        handleAutoSave();
      }
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [sceneContent, initialContent]);

  // Update content when initialContent changes
  useEffect(() => {
    setSceneContent(initialContent);
  }, [initialContent]);

  const handleAutoSave = async () => {
    if (disabled) return;
    
    setIsSaving(true);
    try {
      await onSave({
        content: sceneContent,
        wordCount: wordCount
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    if (disabled) return;
    
    setIsSaving(true);
    try {
      await onSave({
        content: sceneContent,
        wordCount: wordCount
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIWrite = async () => {
    if (disabled || !onWrite) return;
    
    setIsWriting(true);
    try {
      await onWrite({
        content: sceneContent,
        wordCount: wordCount,
        sceneId: sceneId,
        sceneNumber: sceneNumber
      });
    } catch (error) {
      console.error('AI writing failed:', error);
    } finally {
      setIsWriting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Writing Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">✍️ Scene Writing</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <span>{wordCount}</span> words
          </Badge>
          {lastSaved && (
            <span className="text-xs text-[rgb(var(--muted-foreground))]">
              Last saved: {formatTime(lastSaved)}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleManualSave} 
            disabled={isSaving || disabled}
            size="sm"
          >
            {isSaving ? '💾 Saving...' : '💾 Save'}
          </Button>
          {onWrite && (
            <Button 
              onClick={handleAIWrite} 
              disabled={isWriting || disabled}
              size="sm"
            >
              {isWriting ? '✍️ Writing...' : '✍️ AI Write'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Writing Area */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <textarea
              value={sceneContent}
              onChange={(e) => setSceneContent(e.target.value)}
              disabled={disabled}
              className="w-full h-96 p-4 border border-[rgb(var(--border))] rounded-[var(--radius)] font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] focus:border-transparent"
              placeholder="Write your scene here using the MRU (Motivation-Reaction Unit) structure:

Motivation (External): The door slammed shut.

Reaction:
  1. Feeling: Fear shot through him.
  2. Reflex: He flinched.
  3. Action: He reached for the doorknob. &apos;Who&apos;s there?&apos;

Remember: Each paragraph should follow Motivation → Reaction flow for natural pacing and reader engagement."
            />
            
            {/* Writing Guidelines */}
            <Card className="border-[rgb(var(--border))] bg-[rgb(var(--muted)/20%)]">
              <CardContent className="p-4">
                <div className="text-xs text-[rgb(var(--muted-foreground))] space-y-2">
                  <div><strong>📝 MRU Structure:</strong> Write each paragraph as Motivation (what happens) followed by Reaction (feeling → reflex → action/speech)</div>
                  <div><strong>🎯 Scene Focus:</strong> Keep the POV character's goal clear throughout the scene</div>
                  <div><strong>⚡ Pacing:</strong> Vary sentence length and structure to control rhythm and tension</div>
                  <div><strong>🎭 Show Don't Tell:</strong> Use actions, dialogue, and sensory details instead of exposition</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Status Indicators */}
      {(isSaving || isWriting) && (
        <Card className="border-[rgb(var(--primary))] bg-[rgb(var(--primary)/10%)]">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm text-[rgb(var(--primary))]">
              <div className="w-4 h-4 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin"></div>
              {isSaving && <span>Auto-saving scene content...</span>}
              {isWriting && <span>AI is generating scene content...</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}