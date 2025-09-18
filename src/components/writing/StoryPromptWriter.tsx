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

      // Handle different response types from the new intelligent system
      const { requestType, responseType, updatedStoryData, imageDescription, suggestedPrompt, requiresImageService } = result;

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

      // Generate appropriate response based on request type
      let outputMessage = '';

      if (responseType === 'image') {
        outputMessage = `🎨 **Image Generation Request**

Your request: "${inputPrompt.trim()}"

**Image Description:** ${imageDescription}

**Suggested Prompt:** ${suggestedPrompt}

${requiresImageService ? '**Note:** Image generation service integration needed.' : ''}`;

        setOutputResult(outputMessage);
        // Don't update story data for pure image requests
        return;
      }

      if (responseType === 'mixed') {
        outputMessage = `🎭 **Mixed Request Processed**

Your request: "${inputPrompt.trim()}"

**Story Changes Applied** + **Image Generation**

${imageDescription ? `**Image:** ${imageDescription}` : ''}
${suggestedPrompt ? `**Image Prompt:** ${suggestedPrompt}` : ''}

**Updated Story Structure:**
• Genre: ${updatedStoryData?.genre || 'Not specified'}
• Word Count: ${updatedStoryData?.words?.toLocaleString() || 'Not specified'}
• Characters: ${updatedStoryData?.chars ? Object.keys(updatedStoryData.chars).length : 0}
• Story Parts: ${updatedStoryData?.parts?.length || 0}`;
      } else {
        // Handle YAML changes (story, character, or place modifications)
        const requestTypeDisplay = {
          'story_yaml': 'Story Structure',
          'character_yaml': 'Character Data',
          'place_yaml': 'Place/Setting Data'
        }[requestType] || 'Story Data';

        if (changes.length === 0) {
          outputMessage = `✅ **${requestTypeDisplay} Updated**

Your request: "${inputPrompt.trim()}"

**Changes Applied** - The AI has processed your ${requestType.replace('_', ' ')} request.

**Updated Story Structure:**
• Genre: ${updatedStoryData?.genre || 'Not specified'}
• Word Count: ${updatedStoryData?.words?.toLocaleString() || 'Not specified'}
• Characters: ${updatedStoryData?.chars ? Object.keys(updatedStoryData.chars).length : 0}
• Story Parts: ${updatedStoryData?.parts?.length || 0}

**The ${requestTypeDisplay.toLowerCase()} has been updated according to your request.**`;
        } else {
          outputMessage = `✅ **${requestTypeDisplay} Changes Ready**

Your request: "${inputPrompt.trim()}"

**AI-Suggested Changes:**
${changes.join("\n")}

**Preview Summary:**
• Genre: ${updatedStoryData?.genre || 'Not specified'}
• Word Count: ${updatedStoryData?.words?.toLocaleString() || 'Not specified'}
• Characters: ${updatedStoryData?.chars ? Object.keys(updatedStoryData.chars).length : 0}
• Story Parts: ${updatedStoryData?.parts?.length || 0}

**Review the changes below and choose to Save or Cancel.**`;
        }
      }

      setOutputResult(outputMessage);

      if (updatedStoryData) {
        // Apply the updated data
        setPreviewStoryData(updatedStoryData);
        setHasPreviewChanges(true);

        if (onStoryUpdate) {
          onStoryUpdate(updatedStoryData);
        }

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
    <Card className="h-fit" data-testid="story-prompt-writer">
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
            data-testid="prompt-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={analyzePrompt}
            disabled={isProcessing || !inputPrompt.trim()}
            size="sm"
            className="flex-1"
            data-testid="apply-changes-button"
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

      </CardContent>
    </Card>
  );
}