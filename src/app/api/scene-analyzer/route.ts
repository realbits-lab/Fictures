import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { DEFAULT_MODEL } from '@/lib/ai/config';
import yaml from 'js-yaml';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let sceneData, userRequest;

    if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
      // Parse YAML input
      const yamlText = await request.text();
      const data = yaml.load(yamlText) as any;
      sceneData = data.sceneData;
      userRequest = data.userRequest;
    } else {
      // Fallback to JSON for backward compatibility
      const data = await request.json();
      sceneData = data.sceneData;
      userRequest = data.userRequest;
    }

    if (!sceneData || !userRequest) {
      const errorResponse = yaml.dump({
        success: false,
        error: 'Missing required fields: sceneData and userRequest'
      });
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/yaml' }
      });
    }

    const currentSceneYaml = yaml.dump(sceneData);

    const { text } = await generateText({
      model: gateway(DEFAULT_MODEL),
      system: `You are a creative scene writing expert. Your task is to modify a SINGLE scene data structure based on user requests.

CRITICAL RULES:
1. ALWAYS make meaningful changes when a user requests something - never return unchanged data
2. Be CREATIVE and INTERPRETIVE with abstract requests
3. Return exactly ONE scene object, not multiple scenes or arrays
4. Maintain the exact same structure as the input scene data
5. Only modify or add fields within the single scene object
6. When adding characters or places, add them as arrays within the same scene
7. Return ONLY valid YAML without code blocks, explanations, or multiple documents

CREATIVE INTERPRETATION FOR SCENES:
- "Add emotional depth" = Enhance character emotions, add internal thoughts, deepen character reactions and motivations
- "More dialogue" = Create realistic conversations, add verbal conflicts, character exchanges with subtext
- "Add action" = Create physical movement, conflicts, dynamic interactions between characters
- "More atmosphere" = Add vivid sensory details, setting descriptions, mood elements
- "Increase tension" = Add conflict elements, time pressure, dramatic stakes
- "Character development" = Add moments of character growth, revelations, relationship changes
- "Add suspense" = Create unknown elements, mysteries, cliffhanger moments
- "More description" = Enhance visual details, setting elements, character descriptions
- "Add romance" = Create intimate moments, romantic tension, relationship development
- "Make it darker" = Intensify conflicts, add threatening elements, increase emotional weight
- "Better pacing" = Adjust scene flow, vary tension levels, improve dramatic timing
- "Add humor" = Include comedic elements, lighthearted moments, amusing character interactions

ALWAYS MAKE SUBSTANTIAL CHANGES that reflect the user's intent, even if the request is vague or abstract.
For content field, provide actual prose writing when requested.

YAML OUTPUT FORMAT: Return a single YAML object with the same structure as input.`,
      prompt: `User Request: "${userRequest}"

Current Scene Data (YAML):
${currentSceneYaml}

TASK: Modify the above scene data according to the user's request. The user expects meaningful changes to be made. Be creative and helpful:

- For "dialogue" requests: Add realistic conversations between characters with proper formatting
- For "action" requests: Create dynamic movement, conflicts, and dramatic moments
- For "emotion" requests: Add emotional depth, character feelings, and internal struggles
- For "atmosphere" requests: Enhance setting descriptions with sensory details
- For "content" requests: Write actual prose content for the scene
- For general writing requests: Enhance relevant fields with substantial content

Return the updated scene data as a single YAML object with meaningful improvements. Do not create multiple scenes or arrays at the root level.

IMPORTANT: Return ONLY the YAML data, no explanations, no code blocks, no markdown formatting.`,
    });

    // Extract YAML from markdown code blocks if present
    let yamlContent = text.trim();

    // Remove markdown code blocks
    const yamlBlockMatch = yamlContent.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
    if (yamlBlockMatch) {
      yamlContent = yamlBlockMatch[1].trim();
    }

    // Remove any leading/trailing whitespace and ensure it's a single document
    yamlContent = yamlContent.trim();

    // If content starts with "---" (document separator), handle it
    if (yamlContent.startsWith('---')) {
      // Split by document separators and take the first valid document
      const documents = yamlContent.split(/^---\s*$/m);
      yamlContent = documents[1] || documents[0];
      yamlContent = yamlContent.trim();
    }

    // If content starts with "-" (array), we need to extract the first item
    if (yamlContent.startsWith('-')) {
      console.log('Warning: AI returned array format, extracting first item');
      const lines = yamlContent.split('\n');
      let extractedContent = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === 0) {
          // First line, remove the "-" and get the content
          extractedContent += line.substring(1).trim() + '\n';
          continue;
        }

        // Stop at the next array item
        if (line.trim().startsWith('- ')) {
          break;
        }

        extractedContent += line + '\n';
      }
      yamlContent = extractedContent.trim();
    }

    let updatedSceneData;
    try {
      // Parse the YAML response back to JSON
      updatedSceneData = yaml.load(yamlContent);

      // Validate that we got an object
      if (!updatedSceneData || typeof updatedSceneData !== 'object') {
        throw new Error('Invalid scene data structure returned');
      }

    } catch (yamlError) {
      console.error('YAML parsing error:', yamlError);
      console.error('Raw AI response:', text);
      console.error('Processed YAML content:', yamlContent);

      // Return original data if parsing fails
      const errorResponse = yaml.dump({
        success: false,
        error: 'Failed to parse AI response. Please try again with a simpler request.',
        details: yamlError instanceof Error ? yamlError.message : 'Unknown YAML error'
      });
      return new Response(errorResponse, {
        status: 500,
        headers: { 'Content-Type': 'application/yaml' }
      });
    }

    const successResponse = yaml.dump({
      success: true,
      updatedSceneData: updatedSceneData
    });

    return new Response(successResponse, {
      headers: { 'Content-Type': 'application/yaml' }
    });

  } catch (error) {
    console.error('Scene analyzer error:', error);
    const errorResponse = yaml.dump({
      success: false,
      error: 'Failed to process scene analysis request'
    });
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/yaml' }
    });
  }
}