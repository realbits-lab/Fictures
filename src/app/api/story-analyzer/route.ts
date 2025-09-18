import { streamText, tool, stepCountIs, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import { NextRequest, NextResponse } from 'next/server';
import { STORY_ANALYSIS_MODEL } from '@/lib/ai/config';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log('🔍 [STORY-ANALYZER] Starting request processing...', new Date().toISOString());

    const requestBody = await request.json();
    console.log('🔍 [STORY-ANALYZER] Request body parsed in:', Date.now() - startTime, 'ms');
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
    console.log('🔍 [STORY-ANALYZER] Request validation completed in:', Date.now() - startTime, 'ms');

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
            model: gateway(STORY_ANALYSIS_MODEL),
            system: `You are a creative story development specialist. Follow the story specification framework and help users develop complete, engaging stories.

# CORE PRINCIPLE
When users request data completion ("complete story data", "fill missing fields", "complete all data"), your job is to replace ALL empty fields with meaningful content. Never leave empty arrays [] or empty objects {} in the output.

# COMPLETION RULES
1. Scan the entire YAML for empty structures: [], {}, "", 0
2. Replace every empty structure with appropriate content
3. Ensure all story elements are interconnected and coherent
4. Generate creative, genre-appropriate content for missing fields

# FIELD REQUIREMENTS
Essential fields that must never be empty when completing data:
- title: Story title
- genre: Story genre
- words: Target word count
- goal, conflict, outcome, question: Core story elements
- chars: Character data with roles and arcs
- themes: Story themes
- parts: Story parts with goals and conflicts
- setting: Primary and secondary locations
- serial: Publication schedule and details
- hooks: Reader engagement elements

# COMPLETION APPROACH
- Be creative and interpretive with requests
- Generate content that fits the story's genre and tone
- Create interconnected elements that support the overall narrative
- Use appropriate complexity based on the story type
- Always provide complete, valid YAML output

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
            model: gateway(STORY_ANALYSIS_MODEL),
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
            model: gateway(STORY_ANALYSIS_MODEL),
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
    console.log('🔍 [STORY-ANALYZER] Starting streamText call at:', Date.now() - startTime, 'ms');
    const result = streamText({
      model: gateway(STORY_ANALYSIS_MODEL),
      system: `You are a creative story development assistant. You MUST ALWAYS call one of the available tools for every user request. Never respond without using tools.

# MANDATORY TOOL SELECTION
You MUST call tools for EVERY request. For ANY story modification request, you MUST use modifyStoryStructure as the default tool.

# TOOL SELECTION RULES (MANDATORY)
1. **ALWAYS call modifyStoryStructure** for any story changes including:
   - Title changes ("change title", "new title", "rename story")
   - Genre modifications
   - Plot, theme, goal, conflict, outcome changes
   - Word count adjustments
   - General story improvements
   - ANY request that doesn't clearly specify characters, places, or images

2. **modifyCharacterData**: ONLY for explicit character requests:
   - "add character", "modify character", "character development"
   - Character relationships, backstories, character arcs

3. **modifyPlaceData**: ONLY for explicit location requests:
   - "add location", "describe setting", "world-building"
   - Environment and place descriptions

4. **generateImageDescription**: ONLY for explicit image requests:
   - "show me", "generate image", "what does X look like"
   - Visual content creation

# CRITICAL INSTRUCTION
If a user asks to "change title" or similar story modification, you MUST call modifyStoryStructure.
If you're unsure which tool to use, DEFAULT to modifyStoryStructure.
Never respond without calling a tool - this will cause an error.

# RESPONSE STRATEGY
1. Analyze the request
2. Select the appropriate tool (default: modifyStoryStructure)
3. Execute the tool with the story data and user request
4. Always improve and enhance the story content creatively`,
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

    console.log('🔍 [STORY-ANALYZER] Starting stream processing at:', Date.now() - startTime, 'ms');
    // Process the streaming result to collect tool outputs
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        finalText += chunk.text;
      }
      if (chunk.type === 'tool-result') {
        console.log('🔍 [STORY-ANALYZER] Tool result received at:', Date.now() - startTime, 'ms');
        toolResults.push(chunk.output as Record<string, unknown>);
      }
    }

    console.log('🔍 [STORY-ANALYZER] Stream processing completed at:', Date.now() - startTime, 'ms');

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
        console.log('🔍 [STORY-ANALYZER] Starting YAML processing at:', Date.now() - startTime, 'ms');
        try {
          let cleanedYaml = toolResult.updatedYamlText as string;
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

    console.log('🔍 [STORY-ANALYZER] Total processing time:', Date.now() - startTime, 'ms');
    return NextResponse.json(finalResult);

  } catch (error) {
    console.error('Story analyzer API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}