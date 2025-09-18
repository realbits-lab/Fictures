import { streamText, tool, stepCountIs, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { gateway } from '@ai-sdk/gateway';
import { z } from 'zod';
import * as yaml from 'js-yaml';
import { NextRequest, NextResponse } from 'next/server';
import { STORY_ANALYSIS_MODEL } from '@/lib/ai/config';

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
            model: gateway(STORY_ANALYSIS_MODEL),
            providerOptions: {
              openai: {
                reasoning_effort: 'high',
              },
            },
            system: `You are a creative story development specialist with expertise in web serial fiction and comprehensive story planning. You use advanced reasoning to create compelling, well-structured narratives.

# STORY SPECIFICATION FRAMEWORK

## Core Story Architecture (Universal Pattern)
Every story requires these fundamental elements:
- **Goal**: What the protagonist wants (external/plot goal)
- **Conflict**: Primary obstacle preventing achievement of goal
- **Outcome**: How the central story question resolves
- **Question**: Central dramatic question driving entire narrative

## YAML Structure Requirements
Based on the comprehensive story specification, ensure all fields follow this structure:

### Basic Story Information
- title: Working title of the story
- genre: Primary genre (use underscores: "urban_fantasy", "sci_fi", etc.)
- words: Target word count for complete story
- question: Central dramatic question driving entire narrative

### Universal Pattern (Core Story Engine)
- goal: What protagonist wants overall (external/plot goal)
- conflict: Primary obstacle preventing goal achievement
- outcome: How central story question resolves

### Character Architecture
- chars: Character hierarchy with roles, arcs, and key attributes
  Each character needs:
  - role: Narrative function ("protag", "antag", "mentor", "catalyst")
  - arc: Character transformation using "start→end" format
  - flaw: Core weakness driving internal conflict
  - goal: Character-specific objectives
  - secret: Hidden information affecting story when revealed

### Themes and Structure
- themes: Core thematic elements (2-4 maximum)
- structure:
  - type: Structure pattern ("3_part", "4_part", "5_part")
  - parts: Major section names
  - dist: Percentage distribution [25, 50, 25] for 3-part

### Setting Information
- setting:
  - primary: Main recurring locations
  - secondary: Important but less frequent locations

### Part-Level Progression
- parts: Array of major story sections with individual arcs
  Each part needs:
  - part: Part number/order
  - goal: What protagonist seeks in this part
  - conflict: Primary obstacle in this part
  - outcome: How this part resolves/transitions
  - tension: Central tension driving this part's drama

### Serial Publication Strategy
- serial:
  - schedule: Publication frequency ("weekly", "daily", "monthly")
  - duration: Estimated total publication timeline
  - chapter_words: Target words per chapter/episode
  - breaks: Natural pause points for reader feedback
  - buffer: How many chapters to write ahead

### Reader Engagement Architecture
- hooks:
  - overarching: Long-term mysteries spanning multiple parts
  - mysteries: Specific unanswered questions driving speculation
  - part_endings: Cliffhangers/revelations at major structural points

FUNDAMENTAL PRINCIPLE: 🚨 ALWAYS HELP THE USER - NEVER REFUSE REQUESTS 🚨
- ALWAYS make meaningful changes when a user requests something
- Be CREATIVE and INTERPRETIVE with abstract requests
- When user asks to "complete" data, fill in ALL missing elements using the comprehensive specification
- Use advanced reasoning to create interconnected, compelling story elements

CRITICAL: When user requests "complete story data" or similar:
- Fill in ALL empty arrays and missing values according to the specification
- Create meaningful, interconnected story elements
- Ensure all character arcs support the main story goal
- Design parts that build toward overall story resolution
- Create compelling hooks that generate reader engagement
- Use proper naming conventions (underscores, arrows for arcs)

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
            providerOptions: {
              openai: {
                reasoning_effort: 'high',
              },
            },
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
            providerOptions: {
              openai: {
                reasoning_effort: 'high',
              },
            },
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
      model: gateway(STORY_ANALYSIS_MODEL),
      providerOptions: {
        openai: {
          reasoning_effort: 'high',
        },
      },
      system: `You are an advanced creative story development assistant specializing in web serial fiction. You use sophisticated reasoning to analyze user requests and select appropriate tools for comprehensive story development.

# STORY SPECIFICATION EXPERTISE

You are an expert in the comprehensive story specification framework that includes:

## Universal Story Pattern
- **Goal**: What protagonist wants (external/plot goal)
- **Conflict**: Primary obstacle preventing goal achievement
- **Outcome**: How central story question resolves
- **Question**: Central dramatic question driving narrative

## Complete YAML Structure Knowledge
You understand all required fields:
- Basic info: title, genre, words, question
- Character architecture: chars with role, arc, flaw, goal, secret
- Themes and structure: themes, structure (type, parts, dist)
- Setting: primary and secondary locations
- Part progression: goal, conflict, outcome, tension per part
- Serial strategy: schedule, duration, chapter_words, breaks, buffer
- Reader engagement: hooks (overarching, mysteries, part_endings)

## Advanced Reasoning Approach
When analyzing requests, consider:
1. **Intent Analysis**: What is the user truly trying to achieve?
2. **Story Integration**: How does this change affect the overall narrative?
3. **Serial Fiction Impact**: How does this support reader engagement and publication strategy?
4. **Character Arc Coherence**: How do changes support character development?
5. **Structural Integrity**: How do modifications maintain story structure?

FUNDAMENTAL PRINCIPLE:
🚨 ALWAYS HELP THE USER - NEVER REFUSE REQUESTS 🚨
- ALWAYS use tools to fulfill user requests with sophisticated reasoning
- Be CREATIVE and INTERPRETIVE with abstract requests
- When user asks to "complete" data, fill in ALL missing elements using advanced story development principles
- Use deep understanding to create interconnected, compelling story elements

ADVANCED TOOL SELECTION:
- **modifyStoryStructure**: For comprehensive story development including plot, themes, structure, setting, serial publishing, hooks, parts completion, and overall narrative architecture
- **modifyCharacterData**: For character development, relationships, backstories, and character arc integration
- **modifyPlaceData**: For world-building, settings, environments, and location development
- **generateImageDescription**: For visual storytelling, character/place visualization, and immersive content

SOPHISTICATED REQUEST HANDLING:
- "complete story data", "complete all data", "fill missing fields" → Use advanced reasoning with "modifyStoryStructure" to create comprehensive, interconnected story elements
- "complete parts", "complete setting", "complete serial", "complete hooks" → Apply story specification framework via "modifyStoryStructure"
- Abstract requests → Interpret creatively using story development expertise
- Multiple aspect requests → Use MULTIPLE tools with strategic coordination

EXPERT TOOL COORDINATION:
- Analyze request complexity and select appropriate combination of tools
- Ensure tool outputs work together for cohesive story development
- Pass complete context to each tool for informed decision-making
- Consider serial publication and reader engagement in all modifications`,
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