"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";
import yaml from "js-yaml";

interface PartData {
  part: number;
  title: string;
  words: number;
  function: string;
  goal: string;
  conflict: string;
  outcome: string;
  questions: {
    primary: string;
    secondary: string;
  };
  chars: Record<string, {
    start: string;
    end: string;
    arc: string[] | string;
    conflict?: string;
    transforms?: string[];
  }>;
  plot: {
    events: string[];
    reveals: string[];
    escalation: string[];
  };
  emotion: {
    start: string;
    progression: string[];
    end: string;
  };
}

interface PartPromptAnalyzerProps {
  partData: PartData;
  onPartUpdate?: (updatedData: PartData) => void;
}

export function PartPromptAnalyzer({ partData, onPartUpdate }: PartPromptAnalyzerProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview functionality for cancel/save pattern
  const [originalPartData, setOriginalPartData] = useState<PartData | null>(null);
  const [previewPartData, setPreviewPartData] = useState<PartData | null>(null);
  const [hasPreviewChanges, setHasPreviewChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");

    // Store original data for cancel functionality
    setOriginalPartData(partData);

    try {
      const response = await fetch('/api/part-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partData,
          userRequest: inputPrompt.trim()
        })
      });

      // Parse YAML response
      const yamlText = await response.text();
      const result = yaml.load(yamlText) as any;

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      const updatedPartData = result.updatedPartData;

      // Compare changes and generate summary
      const changes: string[] = [];

      if (updatedPartData.title !== partData.title) {
        changes.push(`✓ Changed title from "${partData.title}" to "${updatedPartData.title}"`);
      }
      if (updatedPartData.words !== partData.words) {
        changes.push(`✓ Changed word count from ${partData.words.toLocaleString()} to ${updatedPartData.words.toLocaleString()}`);
      }
      if (updatedPartData.function !== partData.function) {
        changes.push(`✓ Changed function from "${partData.function}" to "${updatedPartData.function}"`);
      }
      if (updatedPartData.goal !== partData.goal) {
        changes.push(`✓ Updated part goal`);
      }
      if (updatedPartData.conflict !== partData.conflict) {
        changes.push(`✓ Updated part conflict`);
      }
      if (updatedPartData.outcome !== partData.outcome) {
        changes.push(`✓ Updated part outcome`);
      }

      // Check for character changes
      const oldCharNames = Object.keys(partData.chars);
      const newCharNames = Object.keys(updatedPartData.chars);

      if (newCharNames.length > oldCharNames.length) {
        changes.push(`✓ Added ${newCharNames.length - oldCharNames.length} character development(s)`);
      }

      // Check for plot changes
      if (updatedPartData.plot.events.length > partData.plot.events.length) {
        changes.push(`✓ Added ${updatedPartData.plot.events.length - partData.plot.events.length} new plot event(s)`);
      }
      if (updatedPartData.plot.reveals.length > partData.plot.reveals.length) {
        changes.push(`✓ Added ${updatedPartData.plot.reveals.length - partData.plot.reveals.length} new plot reveal(s)`);
      }

      // Check for emotional journey changes
      if (updatedPartData.emotion.progression.length > partData.emotion.progression.length) {
        changes.push(`✓ Enhanced emotional progression with ${updatedPartData.emotion.progression.length - partData.emotion.progression.length} new element(s)`);
      }

      if (changes.length === 0) {
        setOutputResult(`🔍 **Request Processed**

Your request: "${inputPrompt.trim()}"

**No changes were made** - The AI determined that no modifications were needed or the request was unclear.

**Try specific requests like:**
• "Add more tension to this part"
• "Develop the character arc for the protagonist"
• "Add a plot twist"
• "Make the conflict more intense"
• "Add emotional depth"

**Current part remains unchanged.**`);

        // Reset preview state when no changes
        setPreviewPartData(null);
        setHasPreviewChanges(false);
      } else {
        setOutputResult(`✅ **Preview Changes Ready**

Your request: "${inputPrompt.trim()}"

**AI-Suggested Changes:**
${changes.join("\n")}

**Preview Summary:**
• Function: ${updatedPartData.function}
• Word Count: ${updatedPartData.words.toLocaleString()}
• Characters: ${Object.keys(updatedPartData.chars).length}
• Plot Events: ${updatedPartData.plot.events.length}
• Plot Reveals: ${updatedPartData.plot.reveals.length}

**Review the changes below and choose to Save or Cancel.**`);

        // Set up preview instead of immediately applying changes
        setPreviewPartData(updatedPartData);
        setHasPreviewChanges(true);
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

  const handleSave = async () => {
    if (!previewPartData) return;

    setIsSaving(true);
    try {
      // Call the update callback to persist changes
      if (onPartUpdate) {
        await onPartUpdate(previewPartData);
      }

      // Clear preview state
      setPreviewPartData(null);
      setHasPreviewChanges(false);
      setOriginalPartData(null);

      // Update output to show success
      setOutputResult(`✅ **Changes Saved Successfully**

Your changes have been applied to the part data.

**Saved Changes:**
${outputResult.includes("**AI-Suggested Changes:**")
  ? outputResult.split("**AI-Suggested Changes:**")[1].split("**Preview Summary:**")[0].trim()
  : "Changes applied"}

**All modifications have been saved.**`);

    } catch (error) {
      console.error("Save error:", error);
      setOutputResult(`❌ **Error Saving Changes**

There was an error saving your changes. Please try again.

Error details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    setPreviewPartData(null);
    setHasPreviewChanges(false);
    setOriginalPartData(null);

    setOutputResult(`🔄 **Changes Cancelled**

Your preview changes have been discarded. The part data remains unchanged.

**Original part data has been restored.**`);
  };

  const clearAll = () => {
    setInputPrompt("");
    setOutputResult("");

    // Reset preview state
    setPreviewPartData(null);
    setHasPreviewChanges(false);
    setOriginalPartData(null);
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🤖 Part Prompt Analyzer
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
            placeholder="Enter your request to modify this part (e.g., 'add more tension', 'develop character relationships', 'add a plot twist', 'enhance emotional depth')..."
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

        {/* Cancel/Save Buttons - Only show when there are preview changes */}
        {hasPreviewChanges && (
          <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel Changes
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>💾 Save Changes</>
              )}
            </Button>
          </div>
        )}

        {/* Current Part Summary with Preview */}
        {partData && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {hasPreviewChanges && previewPartData ? (
                <div>
                  <div className="font-medium mb-1 text-blue-600 dark:text-blue-400">
                    📋 Preview Changes:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-300">Before:</div>
                      <div>Function: <Badge variant="outline" className="text-xs">{partData.function || 'Not set'}</Badge></div>
                      <div>Characters: {Object.keys(partData.chars || {}).length}</div>
                      <div>Plot Events: {partData.plot?.events?.length || 0}</div>
                      <div>Target Words: {partData.words?.toLocaleString() || '0'}</div>
                    </div>
                    <div>
                      <div className="font-medium text-blue-600 dark:text-blue-400">After:</div>
                      <div>Function: <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 dark:border-blue-600 dark:text-blue-300">{previewPartData.function || 'Not set'}</Badge></div>
                      <div>Characters: <span className={Object.keys(previewPartData.chars || {}).length > Object.keys(partData.chars || {}).length ? "text-green-600 dark:text-green-400 font-medium" : ""}>{Object.keys(previewPartData.chars || {}).length}</span></div>
                      <div>Plot Events: <span className={previewPartData.plot?.events?.length > (partData.plot?.events?.length || 0) ? "text-green-600 dark:text-green-400 font-medium" : ""}>{previewPartData.plot?.events?.length || 0}</span></div>
                      <div>Target Words: <span className={previewPartData.words > partData.words ? "text-green-600 dark:text-green-400 font-medium" : previewPartData.words < partData.words ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>{previewPartData.words?.toLocaleString() || '0'}</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium mb-1">Current Part:</div>
                  <div>Function: <Badge variant="outline" className="text-xs">{partData.function || 'Not set'}</Badge></div>
                  <div>Characters: {Object.keys(partData.chars || {}).length}</div>
                  <div>Plot Events: {partData.plot?.events?.length || 0}</div>
                  <div>Target Words: {partData.words?.toLocaleString() || '0'}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}