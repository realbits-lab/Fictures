"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button } from "@/components/ui";

interface StoryPromptWriterProps {
  storyJson: string;
  storyId?: string;
  onStoryUpdate?: (updatedJson: string) => void;
  onPreviewUpdate?: (previewJson: string | null) => void;
  disabled?: boolean;
}

export function StoryPromptWriter({ storyJson, storyId, onStoryUpdate, onPreviewUpdate, disabled = false }: StoryPromptWriterProps) {
  const [inputPrompt, setInputPrompt] = useState("");
  const [outputResult, setOutputResult] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Image preview functionality
  const [previewImageData, setPreviewImageData] = useState<{
    url: string;
    description: string;
    subject: string;
    imageType: string;
    style: string;
  } | null>(null);
  const [hasImagePreview, setHasImagePreview] = useState(false);


  // Function to detect if request is for image generation
  const isImageRequest = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    const imageKeywords = [
      'show', 'image', 'picture', 'draw', 'generate', 'create', 'look like', 'looks like',
      'visualize', 'illustration', 'portrait', 'appearance', 'visual', 'depict'
    ];
    return imageKeywords.some(keyword => {
      // Use word boundaries to match whole words only
      const regex = new RegExp(`\\b${keyword}\\b`);
      return regex.test(lowerPrompt);
    });
  };

  const handleImageRequest = async (prompt: string) => {
    try {
      // Use passed storyId or parse JSON as fallback
      const effectiveStoryId = storyId || (() => {
        const parsedStory = JSON.parse(storyJson);
        return parsedStory?.story?.id || parsedStory?.id || 'temp-story';
      })();
      console.log('Using story ID for image generation:', effectiveStoryId);

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          type: 'general',
          storyId: effectiveStoryId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.details || 'Image generation failed');
      }

      // Set up image preview state
      setPreviewImageData({
        url: result.imageUrl,
        description: result.modelResponse || prompt,
        subject: 'Generated image',
        imageType: 'general',
        style: result.method === 'placeholder_quota' ? 'placeholder' : 'AI generated'
      });
      setHasImagePreview(true);

      const outputMessage = `🎨 **Image Generated Successfully**

Your request: "${prompt}"

**Method:** ${result.method}
**Description:** ${result.modelResponse}

**Generated image is shown below. Choose to Save or Cancel.**`;

      setOutputResult(outputMessage);
      return true;

    } catch (error) {
      console.error("Image generation error:", error);
      setOutputResult(`❌ **Image Generation Failed**

Your request: "${prompt}"

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Please try:
• Rephrasing your image request
• Being more specific about what you want to see
• Checking if the image service is available`);
      return false;
    }
  };

  const analyzePrompt = async () => {
    if (!inputPrompt.trim()) return;

    setIsProcessing(true);
    setOutputResult("Processing your request with AI...");


    // Check if this is an image generation request
    if (isImageRequest(inputPrompt.trim())) {
      await handleImageRequest(inputPrompt.trim());
      setIsProcessing(false);
      return;
    }

    try {
      // Ensure we're sending proper JSON format to the API
      let jsonToSend = storyJson;

      // If storyJson looks like it needs parsing
      if (storyJson && typeof storyJson === 'string') {
        try {
          const parsed = JSON.parse(storyJson);
          jsonToSend = JSON.stringify({ story: parsed }, null, 2);
          console.log('🔄 Formatted story data for API');
        } catch (e) {
          console.warn('Failed to parse storyJson, sending as-is:', e);
        }
      }

      console.log('📤 Sending to story-analyzer API:', {
        jsonLength: jsonToSend?.length || 0,
        userRequest: inputPrompt.trim(),
        jsonPreview: jsonToSend?.substring(0, 200) + '...'
      });

      const response = await fetch('/api/story-analyzer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyJson: jsonToSend,
          userRequest: inputPrompt.trim()
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      // Handle different response types from the new intelligent system
      const {
        requestType,
        responseType,
        updatedStoryData,
        imageDescription,
        suggestedPrompt,
        generatedImageUrl,
        isImagePreview,
        imageType,
        subject,
        style,
        imageError,
        requiresImageService
      } = result;

      // Compare changes and generate summary
      const changes: string[] = [];

      try {
        const originalStory = JSON.parse(storyJson);
        const originalData = originalStory?.story || originalStory;

        if (updatedStoryData.title !== originalData.title) {
          changes.push(`✓ Changed title from "${originalData.title}" to "${updatedStoryData.title}"`);
        }
        if (updatedStoryData.genre !== originalData.genre) {
          changes.push(`✓ Changed genre from "${originalData.genre}" to "${updatedStoryData.genre}"`);
        }
        if (updatedStoryData.words !== originalData.words) {
          changes.push(`✓ Changed word count from ${originalData.words?.toLocaleString() || 0} to ${updatedStoryData.words?.toLocaleString() || 0}`);
        }
        if (updatedStoryData.question !== originalData.question) {
          changes.push(`✓ Updated central question`);
        }
        if (updatedStoryData.goal !== originalData.goal) {
          changes.push(`✓ Updated story goal`);
        }
        if (updatedStoryData.conflict !== originalData.conflict) {
          changes.push(`✓ Updated main conflict`);
        }
        if (updatedStoryData.outcome !== originalData.outcome) {
          changes.push(`✓ Updated story outcome`);
        }

        // Check for character changes
        const oldCharNames = Object.keys(originalData.chars || {});
        const newCharNames = Object.keys(updatedStoryData.chars || {});

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
        const oldThemes = originalData.themes || [];
        const newThemes = updatedStoryData.themes || [];
        if (newThemes.length > oldThemes.length) {
          changes.push(`✓ Added ${newThemes.length - oldThemes.length} new theme(s)`);
        }

        // Check for parts changes
        const oldParts = originalData.parts || [];
        const newParts = updatedStoryData.parts || [];
        if (newParts.length > oldParts.length) {
          changes.push(`✓ Added ${newParts.length - oldParts.length} new story part(s)`);
        }
      } catch (error) {
        console.warn('Error parsing original JSON for comparison:', error);
        changes.push(`✓ Updated story data as requested`);
      }

      // Generate appropriate response based on request type
      let outputMessage = '';

      if (responseType === 'image') {
        if (imageError) {
          outputMessage = `❌ **Image Generation Failed**

Your request: "${inputPrompt.trim()}"

**Error:** ${imageError}

**Description:** ${imageDescription}`;
        } else if (generatedImageUrl && isImagePreview) {
          // Set up image preview state
          setPreviewImageData({
            url: generatedImageUrl,
            description: imageDescription || '',
            subject: subject || '',
            imageType: imageType || 'scene',
            style: style || 'digital art'
          });
          setHasImagePreview(true);

          outputMessage = `🎨 **Image Generated Successfully**

Your request: "${inputPrompt.trim()}"

**Subject:** ${subject}
**Style:** ${style}

**Description:** ${imageDescription}

**Generated image is shown below. Choose to Save or Cancel.**`;
        } else {
          outputMessage = `🎨 **Image Generation Request**

Your request: "${inputPrompt.trim()}"

**Image Description:** ${imageDescription}

**Suggested Prompt:** ${suggestedPrompt}

${requiresImageService ? '**Note:** Image generation service integration needed.' : ''}`;
        }

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
        // Handle JSON changes (story, character, or place modifications)
        const requestTypeMap: Record<string, string> = {
          'story_modification': 'Story Structure',
          'character_modification': 'Character Data',
          'place_modification': 'Place/Setting Data'
        };
        const requestTypeDisplay = requestTypeMap[requestType] || 'Story Data';

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
        // Convert updated story data back to JSON string format
        const updatedJson = JSON.stringify({ story: updatedStoryData }, null, 2);

        if (onStoryUpdate) {
          onStoryUpdate(updatedJson);
        }

        if (onPreviewUpdate) {
          onPreviewUpdate(updatedJson);
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

    if (onPreviewUpdate) {
      onPreviewUpdate(null);
    }

    // Reset image preview state
    setPreviewImageData(null);
    setHasImagePreview(false);
  };

  const saveImagePreview = async () => {
    if (!previewImageData) return;

    try {
      // Use passed storyId or parse JSON as fallback
      const effectiveStoryId = storyId || (() => {
        const parsedStory = JSON.parse(storyJson);
        return parsedStory?.story?.id || parsedStory?.id;
      })();

      if (!effectiveStoryId) {
        // Fallback: try to get from URL (chapter ID path) and find associated story
        const url = new URL(window.location.href);
        const chapterId = url.pathname.split('/')[2];
        console.error('No story ID found in JSON. Chapter ID from URL:', chapterId);
        throw new Error('Story ID not available. Cannot save image.');
      }

      console.log('Saving image to story ID:', effectiveStoryId);

      // Parse current story data to preserve existing data
      const parsedData = JSON.parse(storyJson);
      const currentStoryData = parsedData?.story || parsedData;

      // Update story data with cover image
      const updatedStoryData = {
        ...currentStoryData,
        coverImage: previewImageData.url
      };

      console.log('📸 Saving coverImage to storyData field:', previewImageData.url);

      // Update story cover image via write endpoint to save in storyData field
      const response = await fetch(`/api/stories/${effectiveStoryId}/write`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyData: updatedStoryData
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save image: ${response.status} ${errorText}`);
      }

      console.log('✅ Image saved as story cover image:', previewImageData.url);

      // Update the story data locally if we have the onStoryUpdate callback
      if (onStoryUpdate) {
        try {
          const parsedData = JSON.parse(storyJson);
          const storyData = parsedData?.story || parsedData;
          const updatedData = {
            ...storyData,
            coverImage: previewImageData.url
          };
          const updatedJson = JSON.stringify({ story: updatedData }, null, 2);
          onStoryUpdate(updatedJson);
        } catch (error) {
          console.warn('Error updating JSON with cover image:', error);
        }
      }

      // Clear the preview
      setPreviewImageData(null);
      setHasImagePreview(false);

      // Update output to confirm save
      setOutputResult(prev => `${prev}\n\n✅ **Image Saved Successfully** as story cover image!`);

    } catch (error) {
      console.error('Error saving image:', error);
      setOutputResult(prev => `${prev}\n\n❌ **Error Saving Image**: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelImagePreview = () => {
    setPreviewImageData(null);
    setHasImagePreview(false);
  };

  return (
    <Card className={`h-fit ${disabled ? 'opacity-50 pointer-events-none' : ''}`} data-testid="story-prompt-writer">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          🤖 Story Prompt Writer {disabled && '(Disabled)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Section */}
        <div className="space-y-2">
          <label htmlFor="prompt-input" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Test Prompt Input
          </label>
          <textarea
            id="prompt-input"
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
              "⚡ Apply Changes"
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
          <label htmlFor="analysis-result" className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Analysis Result
          </label>
          <div id="analysis-result" className="w-full p-3 border rounded-md text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[120px] max-h-[300px] overflow-y-auto">
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

        {/* Image Preview Section */}
        {hasImagePreview && previewImageData && (
          <div className="space-y-4 mt-4 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                🎨 Generated Image Preview
              </span>
            </div>

            {/* Generated Image Display */}
            <div className="space-y-3">
              <img
                src={previewImageData.url}
                alt={previewImageData.description}
                className="w-full max-w-md mx-auto rounded-lg shadow-md border"
                onError={(e) => {
                  console.error('Image failed to load:', previewImageData.url);
                  e.currentTarget.style.display = 'none';
                }}
              />

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div><strong>Subject:</strong> {previewImageData.subject}</div>
                <div><strong>Type:</strong> {previewImageData.imageType}</div>
                <div><strong>Style:</strong> {previewImageData.style}</div>
                <div><strong>Description:</strong> {previewImageData.description}</div>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-blue-200 dark:border-blue-700">
              <Button
                onClick={cancelImagePreview}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
              >
                Cancel
              </Button>
              <Button
                onClick={saveImagePreview}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Save Image
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}