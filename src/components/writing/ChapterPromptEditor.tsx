"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import yaml from "js-yaml";

interface ChapterData {
  id: string;
  title: string;
  summary: string;
  orderIndex: number;
  wordCount: number;
  targetWordCount: number;
  status: string;
  purpose: string;
  hook: string;
  characterFocus: string;
  sceneIds: string[];
  scenes?: Array<{
    id: string;
    title: string;
    status: string;
    wordCount: number;
    goal: string;
    conflict: string;
    outcome: string;
  }>;
}

interface ChapterPromptEditorProps {
  chapterData: ChapterData;
  onChapterUpdate?: (updatedData: ChapterData) => void;
  onPreviewUpdate?: (previewData: ChapterData | null) => void;
}

export function ChapterPromptEditor({ chapterData, onChapterUpdate, onPreviewUpdate }: ChapterPromptEditorProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview functionality for cancel/save pattern
  const [originalChapterData, setOriginalChapterData] = useState<ChapterData | null>(null);
  const [previewChapterData, setPreviewChapterData] = useState<ChapterData | null>(null);
  const [hasPreviewChanges, setHasPreviewChanges] = useState(false);

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");

    // Store original data for cancel functionality
    setOriginalChapterData(chapterData);

    try {
      const response = await fetch('/api/chapter-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        body: yaml.dump({
          chapterData,
          userRequest: inputPrompt.trim()
        })
      });

      // Parse YAML response
      const yamlText = await response.text();
      const result = yaml.load(yamlText) as any;

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      const updatedChapterData = result.updatedChapterData;

      // Compare changes and generate summary
      const changes: string[] = [];

      if (updatedChapterData.title !== chapterData.title) {
        changes.push(`✓ Changed title from "${chapterData.title}" to "${updatedChapterData.title}"`);
      }
      if (updatedChapterData.summary !== chapterData.summary) {
        changes.push(`✓ Updated chapter summary`);
      }
      if (updatedChapterData.purpose !== chapterData.purpose) {
        changes.push(`✓ Updated chapter purpose`);
      }
      if (updatedChapterData.hook !== chapterData.hook) {
        changes.push(`✓ Updated chapter hook`);
      }
      if (updatedChapterData.characterFocus !== chapterData.characterFocus) {
        changes.push(`✓ Updated character focus`);
      }
      if (updatedChapterData.targetWordCount !== chapterData.targetWordCount) {
        changes.push(`✓ Changed target word count from ${chapterData.targetWordCount.toLocaleString()} to ${updatedChapterData.targetWordCount.toLocaleString()}`);
      }

      // Check for scene changes
      const oldSceneCount = chapterData.scenes?.length || 0;
      const newSceneCount = updatedChapterData.scenes?.length || 0;

      if (newSceneCount > oldSceneCount) {
        changes.push(`✓ Added ${newSceneCount - oldSceneCount} new scene(s)`);
      }

      // Check for scene content changes
      if (updatedChapterData.scenes && chapterData.scenes) {
        const scenesWithUpdatedGoals = updatedChapterData.scenes.filter((newScene: any, index: number) => {
          const oldScene = chapterData.scenes![index];
          return oldScene && (newScene.goal !== oldScene.goal || newScene.conflict !== oldScene.conflict || newScene.outcome !== oldScene.outcome);
        });

        if (scenesWithUpdatedGoals.length > 0) {
          changes.push(`✓ Enhanced ${scenesWithUpdatedGoals.length} scene(s) with improved goals, conflicts, or outcomes`);
        }
      }

      if (changes.length === 0) {
        setOutputResult(`🔍 **Request Processed**

Your request: "${inputPrompt.trim()}"

**No changes were made** - The AI determined that no modifications were needed or the request was unclear.

**Try specific requests like:**
• "Add more tension to this chapter"
• "Develop the character arc for the protagonist"
• "Add a scene with emotional conflict"
• "Improve the chapter hook"
• "Add pacing elements"

**Current chapter remains unchanged.**`);

        // Reset preview state when no changes
        setPreviewChapterData(null);
        setHasPreviewChanges(false);
        if (onPreviewUpdate) {
          onPreviewUpdate(null);
        }
      } else {
        setOutputResult(`✅ **Preview Changes Ready**

Your request: "${inputPrompt.trim()}"

**AI-Suggested Changes:**
${changes.join("\n")}

**Preview Summary:**
• Purpose: ${updatedChapterData.purpose}
• Target Words: ${updatedChapterData.targetWordCount.toLocaleString()}
• Character Focus: ${updatedChapterData.characterFocus}
• Scenes: ${updatedChapterData.scenes?.length || 0}

**Review the changes below and choose to Save or Cancel.**`);

        // Set up preview instead of immediately applying changes
        setPreviewChapterData(updatedChapterData);
        setHasPreviewChanges(true);
        if (onPreviewUpdate) {
          onPreviewUpdate(updatedChapterData);
        }
      }

    } catch (error) {
      console.error("AI processing error:", error);
      setOutputResult(`❌ **Error Processing Request**

There was an error processing your request with the AI model. Please try:
• Rephrasing your request more clearly
• Making simpler requests
• Checking your request for typos

Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setInputPrompt("");
    setOutputResult("");

    // Reset preview state
    setPreviewChapterData(null);
    setHasPreviewChanges(false);
    setOriginalChapterData(null);
    if (onPreviewUpdate) {
      onPreviewUpdate(null);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🤖 Chapter Prompt Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Test Prompt Input
          </label>
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Enter your request to modify this chapter (e.g., 'add more tension', 'develop character relationships', 'add a dramatic scene', 'improve the hook')..."
            className="w-full p-3 border rounded-md text-sm resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            rows={4}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={analyzePrompt}
            disabled={isProcessing || !inputPrompt.trim()}
            size="sm"
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>⚡ Apply Changes</>
            )}
          </Button>
          <Button
            onClick={clearAll}
            variant="outline"
            size="sm"
          >
            Clear
          </Button>
        </div>

        {/* Output Section */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Analysis Result
          </label>
          <div className="w-full p-3 border rounded-md text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[120px] max-h-[300px] overflow-y-auto">
            {outputResult ? (
              <pre className="whitespace-pre-wrap font-mono text-gray-700 dark:text-gray-300">
                {outputResult}
              </pre>
            ) : (
              <div className="text-gray-400 dark:text-gray-500 italic">
                Analysis results will appear here after processing your prompt...
              </div>
            )}
          </div>
        </div>

        {/* Current Chapter Summary */}
        {chapterData && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">Current Chapter:</div>
              <div>Status: <Badge variant="outline" className="text-xs">{chapterData.status || 'Not set'}</Badge></div>
              <div>Scenes: {chapterData.scenes?.length || 0}</div>
              <div>Character Focus: {chapterData.characterFocus || 'Not set'}</div>
              <div>Target Words: {chapterData.targetWordCount?.toLocaleString() || '0'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}