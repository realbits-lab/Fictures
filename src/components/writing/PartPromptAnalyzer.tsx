"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@/components/ui";

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

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");

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

      const result = await response.json();

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
      } else {
        setOutputResult(`✅ **Request Completed**

Your request: "${inputPrompt.trim()}"

**AI-Applied Changes:**
${changes.join("\n")}

**Updated Part Summary:**
• Function: ${updatedPartData.function}
• Word Count: ${updatedPartData.words.toLocaleString()}
• Characters: ${Object.keys(updatedPartData.chars).length}
• Plot Events: ${updatedPartData.plot.events.length}
• Plot Reveals: ${updatedPartData.plot.reveals.length}

**All modifications have been applied using Vercel AI Gateway.**`);

        // Call the update callback if provided
        if (onPartUpdate) {
          onPartUpdate(updatedPartData);
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

        {/* Current Part Summary */}
        {partData && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <div className="font-medium mb-1">Current Part:</div>
              <div>Function: <Badge variant="outline" className="text-xs">{partData.function || 'Not set'}</Badge></div>
              <div>Characters: {Object.keys(partData.chars || {}).length}</div>
              <div>Plot Events: {partData.plot?.events?.length || 0}</div>
              <div>Target Words: {partData.words?.toLocaleString() || '0'}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}