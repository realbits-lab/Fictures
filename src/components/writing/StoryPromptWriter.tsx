"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

interface StoryData {
  title: string;
  genre: string;
  words: number;
  question: string;
  goal: string;
  conflict: string;
  outcome: string;
  chars: Record<string, any>;
  themes: string[];
  structure: any;
  parts: any[];
}

interface StoryPromptWriterProps {
  storyData: StoryData;
  onStoryUpdate?: (updatedData: StoryData) => void;
  onPreviewUpdate?: (previewData: StoryData | null) => void;
}

export function StoryPromptWriter({ storyData, onStoryUpdate, onPreviewUpdate }: StoryPromptWriterProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview functionality for cancel/save pattern
  const [originalStoryData, setOriginalStoryData] = useState<StoryData | null>(null);
  const [previewStoryData, setPreviewStoryData] = useState<StoryData | null>(null);
  const [hasPreviewChanges, setHasPreviewChanges] = useState(false);

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");

    // Store original data for cancel functionality
    setOriginalStoryData(storyData);

    try {
      const response = await fetch('/api/story-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyData,
          userRequest: inputPrompt.trim()
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      const updatedStoryData = result.updatedStoryData;

      // Compare changes and generate summary
      const changes: string[] = [];

      if (updatedStoryData.title !== storyData.title) {
        changes.push(`✓ Changed title from "${storyData.title}" to "${updatedStoryData.title}"`);
      }
      if (updatedStoryData.genre !== storyData.genre) {
        changes.push(`✓ Changed genre from "${storyData.genre}" to "${updatedStoryData.genre}"`);
      }
      if (updatedStoryData.words !== storyData.words) {
        changes.push(`✓ Changed word count from ${storyData.words.toLocaleString()} to ${updatedStoryData.words.toLocaleString()}`);
      }
      if (updatedStoryData.question !== storyData.question) {
        changes.push(`✓ Updated central question`);
      }
      if (updatedStoryData.goal !== storyData.goal) {
        changes.push(`✓ Updated story goal`);
      }
      if (updatedStoryData.conflict !== storyData.conflict) {
        changes.push(`✓ Updated main conflict`);
      }
      if (updatedStoryData.outcome !== storyData.outcome) {
        changes.push(`✓ Updated story outcome`);
      }

      // Check for character changes
      const oldCharNames = Object.keys(storyData.chars);
      const newCharNames = Object.keys(updatedStoryData.chars);

      if (newCharNames.length > oldCharNames.length) {
        changes.push(`✓ Added ${newCharNames.length - oldCharNames.length} new character(s)`);
      }

      // Check for character name changes
      const changedChars = oldCharNames.filter(oldName =>
        !newCharNames.includes(oldName) && oldCharNames.length === newCharNames.length
      );
      if (changedChars.length > 0) {
        changes.push(`✓ Changed character names as requested`);
      }

      // Check for theme changes
      if (updatedStoryData.themes.length > storyData.themes.length) {
        changes.push(`✓ Added ${updatedStoryData.themes.length - storyData.themes.length} new theme(s)`);
      }

      // Check for parts changes
      if (updatedStoryData.parts.length > storyData.parts.length) {
        changes.push(`✓ Added ${updatedStoryData.parts.length - storyData.parts.length} new story part(s)`);
      }

      if (changes.length === 0) {
        setOutputResult(`🔍 **Request Processed**

Your request: "${inputPrompt.trim()}"

**No changes were made** - The AI determined that no modifications were needed or the request was unclear.

**Try specific requests like:**
• "Make it a romance story"
• "Add a mentor character named Marcus"
• "Change the goal to rescue Elena"
• "Make it longer"
• "Add friendship theme"

**Current story remains unchanged.**`);

        // Reset preview state when no changes
        setPreviewStoryData(null);
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
• Genre: ${updatedStoryData.genre}
• Word Count: ${updatedStoryData.words.toLocaleString()}
• Characters: ${Object.keys(updatedStoryData.chars).length}
• Story Parts: ${updatedStoryData.parts.length}

**Review the changes below and choose to Save or Cancel.**`);

        // Set up preview instead of immediately applying changes
        setPreviewStoryData(updatedStoryData);
        setHasPreviewChanges(true);
        if (onPreviewUpdate) {
          onPreviewUpdate(updatedStoryData);
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
    setPreviewStoryData(null);
    setHasPreviewChanges(false);
    setOriginalStoryData(null);
    if (onPreviewUpdate) {
      onPreviewUpdate(null);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🤖 Story Prompt Writer
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
            placeholder="Enter your request to modify the story (e.g., 'make it a romance story', 'add a mentor character named Alex', 'change the goal to rescue Elena')..."
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

        {/* Current Story Summary */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="font-medium mb-1">Current Story:</div>
            <div>Genre: <Badge variant="outline" className="text-xs">{storyData.genre}</Badge></div>
            <div>Characters: {Object.keys(storyData.chars).length}</div>
            <div>Parts: {storyData.parts.length}</div>
            <div>Target Words: {storyData.words.toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}