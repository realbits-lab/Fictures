import { streamText, tool, stepCountIs, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    if (!requestBody || typeof requestBody !== 'object') {
      throw new Error('Invalid request body');
    }

    // Extract YAML data and user request
    const { storyYaml, userRequest } = requestBody;

    if (!userRequest || typeof userRequest !== 'string') {
      throw new Error('Missing or invalid userRequest');
    }

    if (!storyYaml || typeof storyYaml !== 'string') {
      throw new Error('Missing or invalid storyYaml in request');
    }

    const currentStoryYAML = storyYaml;

    // Define tools for the AI to choose from
    const tools = {
      modifyStoryStructure: tool({
        description: 'Modify the main story structure including title, genre, plot, themes, word count, and overall story elements',
        inputSchema: z.object({
          currentYamlData: z.string().describe('Current story data as YAML text'),
          userRequest: z.string().describe('User request for story modifications')
        }),
        execute: async ({ currentYamlData, userRequest }) => {
          const result = await generateText({
            model: 'openai/gpt-4o-mini',
            system: `You are a creative story development specialist focusing on STORY-LEVEL modifications.

FUNDAMENTAL PRINCIPLE: 🚨 ALWAYS HELP THE USER - NEVER REFUSE REQUESTS 🚨
- ALWAYS make meaningful changes when a user requests something
- Be CREATIVE and INTERPRETIVE with abstract requests
- When user asks to "complete" data, fill in ALL missing elements
- Use your understanding to enhance and improve the story

FOCUS ON STORY-LEVEL ELEMENTS:
- Title, genre, word count, themes
- Main plot: goal, conflict, outcome, central question
- Story structure and parts
- Setting: primary and secondary locations
- Serial publishing: schedule, duration, chapter structure
- Hooks: overarching narrative hooks, mysteries, part endings
- Characters: complete character development
- Overall narrative arc and pacing

CRITICAL: When user requests "complete story data" or similar:
- Fill in ALL empty arrays (parts, themes, setting.primary, setting.secondary, serial.breaks, hooks.overarching, hooks.mysteries, hooks.part_endings)
- Complete ALL empty strings and missing values
- Add meaningful content to chars object with proper character details
- Ensure setting.primary and setting.secondary have actual locations
- Populate serial section with realistic publishing schedule
- Create compelling hooks for narrative engagement

IMPORTANT: Return ONLY valid YAML of the updated story data, nothing else. No explanations, no markdown formatting.`,
            prompt: `Current story YAML:
${currentYamlData}

User request: "${userRequest}"

Please modify the story data according to this request and return the updated story as valid YAML.`
          });

          return {
            type: 'story_modification',
            updatedYamlText: result.text.trim(),
            success: true
          };
        }
      }),

      modifyCharacterData: tool({
        description: 'Add, modify, or enhance character information including character arcs, relationships, backstories, and character development',
        inputSchema: z.object({
          currentYamlData: z.string().describe('Current story data as YAML text'),
          userRequest: z.string().describe('User request for character modifications')
        }),
        execute: async ({ currentYamlData, userRequest }) => {
          const result = await generateText({
            model: 'openai/gpt-4o-mini',
            system: `You are a character development specialist focusing ONLY on character-related modifications.

FUNDAMENTAL PRINCIPLE: ALWAYS MAKE CHARACTER CHANGES
- Add new characters when requested
- Enhance existing character details (backstory, motivation, relationships)
- Develop character arcs and growth
- Create detailed character profiles

FOCUS ON CHARACTER ELEMENTS:
- Character roles and archetypes
- Character arcs and development
- Relationships between characters
- Character backstories and motivations
- Character conflicts and goals

IMPORTANT: Return ONLY valid YAML with the updated story data containing enhanced character information. No explanations, no markdown formatting.`,
            prompt: `Current story YAML:
${currentYamlData}

User request: "${userRequest}"

Add or modify characters as requested and return complete updated story YAML.`
          });

          return {
            type: 'character_modification',
            updatedYamlText: result.text.trim(),
            success: true
          };
        }
      }),

      modifyPlaceData: tool({
        description: 'Add, modify, or enhance place and setting information including locations, environments, world-building details',
        inputSchema: z.object({
          currentYamlData: z.string().describe('Current story data as YAML text'),
          userRequest: z.string().describe('User request for place/setting modifications')
        }),
        execute: async ({ currentYamlData, userRequest }) => {
          const result = await generateText({
            model: 'openai/gpt-4o-mini',
            system: `You are a world-building and setting specialist focusing ONLY on place/setting modifications.

FUNDAMENTAL PRINCIPLE: ALWAYS ENHANCE SETTINGS
- Add new locations when requested
- Develop detailed place descriptions
- Create immersive environments
- Build cohesive world-building elements

FOCUS ON PLACE ELEMENTS:
- Location details and atmosphere
- Environmental descriptions
- World-building consistency
- Setting mood and tone
- Physical and cultural details

IMPORTANT: Return ONLY valid YAML with updated story data containing enhanced setting information. No explanations, no markdown formatting.`,
            prompt: `Current story YAML:
${currentYamlData}

User request: "${userRequest}"

Add or modify places/settings as requested and return complete updated story YAML.`
          });

          return {
            type: 'place_modification',
            updatedYamlText: result.text.trim(),
            success: true
          };
        }
      }),

      generateImageDescription: tool({
        description: 'Generate actual images for characters, places, or scenes using Vercel AI Gateway with Gemini Flash Image',
        inputSchema: z.object({
          currentYamlData: z.string().describe('Current story data as YAML text'),
          userRequest: z.string().describe('User request for image generation')
        }),
        execute: async ({ currentYamlData, userRequest }) => {
          try {
            // Generate image using Google Gemini 2.5 Flash Image
            const result = await generateText({
              model: google('gemini-2.5-flash-image-preview'),
              system: `You are a visual art specialist. Generate a detailed image based on the story context and user request.

Story Context:
${currentYamlData}

Create a beautiful, high-quality image that matches the story's genre, theme, and atmosphere. Focus on visual storytelling and artistic quality.`,
              prompt: userRequest,
              providerOptions: {
                google: {
                  responseModalities: ['TEXT', 'IMAGE']
                }
              }
            });

            // Extract image data from the result
            const imageFiles = result.files?.filter(f => f.mediaType?.startsWith('image/'));

            if (imageFiles && imageFiles.length > 0) {
              // Convert the image data to a data URL for preview
              const imageFile = imageFiles[0];
              const base64Data = Buffer.from(imageFile.uint8Array).toString('base64');
              const mimeType = imageFile.mediaType || 'image/png';
              const dataUrl = `data:${mimeType};base64,${base64Data}`;

              // Determine image type and subject from the request
              const imageType = userRequest.toLowerCase().includes('character') ? 'character' :
                               userRequest.toLowerCase().includes('place') || userRequest.toLowerCase().includes('location') ? 'place' : 'scene';

              return {
                type: 'image_generation',
                imageDescription: result.text || userRequest,
                suggestedPrompt: userRequest,
                imageType: imageType,
                subject: userRequest,
                style: 'digital art',
                generatedImageUrl: dataUrl,
                requiresImageService: false,
                isPreview: true,
                success: true
              };
            } else {
              // Fallback if no image was generated
              return {
                type: 'image_generation',
                imageDescription: result.text || userRequest,
                suggestedPrompt: userRequest,
                imageType: 'scene',
                subject: userRequest,
                style: 'digital art',
                generatedImageUrl: null,
                requiresImageService: true,
                error: 'No image was generated in the response',
                success: false
              };
            }
          } catch (error) {
            console.error('Vercel AI Gateway image generation error:', error);
            return {
              type: 'image_generation',
              imageDescription: userRequest,
              suggestedPrompt: userRequest,
              imageType: 'scene',
              subject: userRequest,
              style: 'digital art',
              generatedImageUrl: null,
              requiresImageService: true,
              error: error instanceof Error ? error.message : 'Image generation failed',
              success: false
            };
          }
        }
      })
    };

    // Use AI SDK to let the model choose and execute appropriate tools
    const result = streamText({
      model: 'openai/gpt-4o-mini',
      system: `You are a creative story development assistant. Your job is to help users modify their stories by choosing and using the appropriate tools.

FUNDAMENTAL PRINCIPLE:
🚨 ALWAYS HELP THE USER - NEVER REFUSE REQUESTS 🚨
- ALWAYS use tools to fulfill user requests
- Be CREATIVE and INTERPRETIVE with abstract requests
- When user asks to "complete" data, fill in ALL missing elements
- Use your understanding to enhance and improve the story

TOOL SELECTION GUIDELINES:
- Use "modifyStoryStructure" for: plot changes, themes, genre, word count, story structure, overall narrative, completing missing story data, filling empty fields, setting, serial publishing, hooks, parts
- Use "modifyCharacterData" for: adding characters, character development, relationships, backstories
- Use "modifyPlaceData" for: locations, settings, environments, world-building
- Use "generateImageDescription" for: any visual requests, character/place images, "show me", "what does X look like"

SPECIAL CASES:
- "complete story data", "complete all data", "fill missing fields" → Use "modifyStoryStructure"
- "complete parts", "complete setting", "complete serial", "complete hooks" → Use "modifyStoryStructure"
- Any request to fill empty arrays or complete zero data → Use "modifyStoryStructure"

You can use MULTIPLE tools if the request involves multiple aspects (e.g., add character AND generate their image).

IMPORTANT TOOL USAGE:
- For ALL tools, pass the current story YAML data as the "currentYamlData" parameter
- Pass the user request as the "userRequest" parameter
- Each tool will handle the specialized AI processing internally`,
      prompt: `Current story data:
${currentStoryYAML}

User request: "${userRequest}"

Please analyze this request and use the appropriate tool(s) to fulfill it. Be creative and comprehensive in your modifications.`,
      tools,
      stopWhen: stepCountIs(3) // Allow multiple tool calls if needed
    });

    // Collect tool results
    const toolResults: Array<Record<string, unknown>> = [];
    let finalText = '';

    // Process the streaming result to collect tool outputs
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        finalText += chunk.text;
      }
      if (chunk.type === 'tool-result') {
        toolResults.push(chunk.output as Record<string, unknown>);
      }
    }

    // Process results based on tool outputs
    if (toolResults.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No tools were called. Please try a more specific request.'
      });
    }

    // Combine results from multiple tools if used
    let finalResult: Record<string, unknown> = {
      success: true,
      originalRequest: userRequest,
      toolsUsed: toolResults.map(r => r.type),
      text: finalText.trim()
    };

    // Process each tool result
    for (const toolResult of toolResults) {
      if (toolResult.type === 'story_modification' || toolResult.type === 'character_modification' || toolResult.type === 'place_modification') {
        // Parse the updated YAML text - simplified approach
        try {
          let cleanedYaml = toolResult.updatedYamlText;
          if (!cleanedYaml || typeof cleanedYaml !== 'string') {
            throw new Error('Invalid YAML text received from tool');
          }

          // Clean markdown formatting
          if (cleanedYaml.startsWith('```yaml')) {
            cleanedYaml = cleanedYaml.replace(/^```yaml\s*/, '').replace(/\s*```$/, '');
          } else if (cleanedYaml.startsWith('```')) {
            cleanedYaml = cleanedYaml.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          // Parse and validate YAML
          const parsedYAML = yaml.load(cleanedYaml);
          if (!parsedYAML || typeof parsedYAML !== 'object') {
            throw new Error('YAML parsing returned null or invalid data');
          }

          const rawStoryData = (parsedYAML as Record<string, unknown>).story || parsedYAML;
          if (!rawStoryData || typeof rawStoryData !== 'object') {
            throw new Error('No valid story data found in parsed YAML');
          }

          // Simple data extraction without complex safety checks
          const updatedStoryData = rawStoryData as Record<string, unknown>;

          finalResult = {
            ...finalResult,
            updatedStoryData,
            updatedYaml: cleanedYaml,
            responseType: 'yaml',
            requestType: toolResult.type,
            reasoning: `AI processed ${toolResult.type.replace('_', ' ')} request`
          };
        } catch (error) {
          console.error('Error parsing YAML from tool result:', error);
          finalResult = {
            ...finalResult,
            responseType: 'error',
            error: `Failed to parse updated story data: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
          };
        }
      }

      if (toolResult.type === 'image_generation') {
        finalResult = {
          ...finalResult,
          imageDescription: toolResult.imageDescription,
          suggestedPrompt: toolResult.suggestedPrompt,
          imageType: toolResult.imageType,
          subject: toolResult.subject,
          style: toolResult.style,
          generatedImageUrl: toolResult.generatedImageUrl,
          isImagePreview: toolResult.isPreview,
          requiresImageService: toolResult.requiresImageService,
          responseType: finalResult.responseType === 'yaml' ? 'mixed' : 'image',
          imageError: toolResult.error
        };
      }
    }

    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Story analyzer API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}