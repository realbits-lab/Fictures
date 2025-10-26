"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import yaml from "js-yaml";

interface SceneData {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  wordCount: number;
  status: string;
  goal: string;
  conflict: string;
  outcome: string;
  characterIds: string[];
  placeIds: string[];
  characters?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  places?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

interface ScenePromptEditorProps {
  sceneData: SceneData;
  onSceneUpdate?: (updatedData: SceneData) => void;
  onPreviewUpdate?: (previewData: SceneData | null) => void;
}

export function ScenePromptEditor({ sceneData, onSceneUpdate, onPreviewUpdate }: ScenePromptEditorProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview functionality for cancel/save pattern
  const [originalSceneData, setOriginalSceneData] = useState<SceneData | null>(null);
  const [previewSceneData, setPreviewSceneData] = useState<SceneData | null>(null);
  const [hasPreviewChanges, setHasPreviewChanges] = useState(false);

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");

    // Store original data for cancel functionality
    setOriginalSceneData(sceneData);

    try {
      const response = await fetch('/studio/api/scene-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        body: yaml.dump({
          sceneData,
          userRequest: inputPrompt.trim()
        })
      });

      // Parse YAML response
      const yamlText = await response.text();
      const result = yaml.load(yamlText) as any;

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      const updatedSceneData = result.updatedSceneData;

      // Compare changes and generate summary
      const changes: string[] = [];

      if (updatedSceneData.title !== sceneData.title) {
        changes.push(`✓ Changed title from "${sceneData.title}" to "${updatedSceneData.title}"`);
      }
      if (updatedSceneData.goal !== sceneData.goal) {
        changes.push(`✓ Updated scene goal`);
      }
      if (updatedSceneData.conflict !== sceneData.conflict) {
        changes.push(`✓ Updated scene conflict`);
      }
      if (updatedSceneData.outcome !== sceneData.outcome) {
        changes.push(`✓ Updated scene outcome`);
      }
      if (updatedSceneData.content !== sceneData.content) {
        changes.push(`✓ Enhanced scene content and description`);
      }

      // Check for character changes
      const oldCharacterCount = sceneData.characters?.length || 0;
      const newCharacterCount = updatedSceneData.characters?.length || 0;

      if (newCharacterCount > oldCharacterCount) {
        changes.push(`✓ Added ${newCharacterCount - oldCharacterCount} character(s) to the scene`);
      }

      // Check for place changes
      const oldPlaceCount = sceneData.places?.length || 0;
      const newPlaceCount = updatedSceneData.places?.length || 0;

      if (newPlaceCount > oldPlaceCount) {
        changes.push(`✓ Added ${newPlaceCount - oldPlaceCount} location(s) to the scene`);
      }

      // Check for content length changes
      const oldContentLength = sceneData.content?.length || 0;
      const newContentLength = updatedSceneData.content?.length || 0;

      if (newContentLength > oldContentLength + 100) { // Significant content addition
        changes.push(`✓ Expanded scene content with additional details`);
      }

      if (changes.length === 0) {
        setOutputResult(`🔍 **Request Processed**

Your request: "${inputPrompt.trim()}"

**No changes were made** - The AI determined that no modifications were needed or the request was unclear.

**Try specific requests like:**
• "Add more dialogue to this scene"
• "Increase the tension and conflict"
• "Add sensory details and atmosphere"
• "Develop character interactions"
• "Add emotional depth"

**Current scene remains unchanged.**`);

        // Reset preview state when no changes
        setPreviewSceneData(null);
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
• Goal: ${updatedSceneData.goal}
• Conflict: ${updatedSceneData.conflict}
• Outcome: ${updatedSceneData.outcome}
• Characters: ${updatedSceneData.characters?.length || 0}
• Locations: ${updatedSceneData.places?.length || 0}

**Review the changes below and choose to Save or Cancel.**`);

        // Set up preview instead of immediately applying changes
        setPreviewSceneData(updatedSceneData);
        setHasPreviewChanges(true);
        if (onPreviewUpdate) {
          onPreviewUpdate(updatedSceneData);
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

  const handleSave = () => {
    if (previewSceneData && onSceneUpdate) {
      onSceneUpdate(previewSceneData);
    }

    // Clear preview state after saving
    setPreviewSceneData(null);
    setHasPreviewChanges(false);
    setOriginalSceneData(null);
    if (onPreviewUpdate) {
      onPreviewUpdate(null);
    }

    // Clear the analysis
    setInputPrompt("");
    setOutputResult("");
  };

  const handleCancel = () => {
    // Reset to original data
    if (originalSceneData && onPreviewUpdate) {
      onPreviewUpdate(null);
    }

    // Clear preview state
    setPreviewSceneData(null);
    setHasPreviewChanges(false);
    setOriginalSceneData(null);

    // Clear the analysis
    setInputPrompt("");
    setOutputResult("");
  };

  const clearAll = () => {
    setInputPrompt("");
    setOutputResult("");

    // Reset preview state
    setPreviewSceneData(null);
    setHasPreviewChanges(false);
    setOriginalSceneData(null);
    if (onPreviewUpdate) {
      onPreviewUpdate(null);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🤖 Scene Prompt Editor
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
            placeholder="Enter your request to modify this scene (e.g., 'add more dialogue', 'increase tension', 'add sensory details', 'develop character emotions')..."
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

        {/* Save/Cancel Buttons - Only show when there are preview changes */}
        {hasPreviewChanges && (
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              className="flex-1"
            >
              💾 Save Changes
            </Button>
          </div>
        )}

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

        {/* Current Scene Summary */}
        {sceneData && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">Current Scene:</div>
              <div>Characters: {sceneData.characters?.length || 0}</div>
              <div>Locations: {sceneData.places?.length || 0}</div>
              <div>Word Count: {sceneData.wordCount?.toLocaleString() || '0'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}