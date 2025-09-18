import { generateText } from 'ai';
import yaml from 'js-yaml';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let chapterData, userRequest;

    if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
      // Parse YAML input
      const yamlText = await request.text();
      const data = yaml.load(yamlText) as any;
      chapterData = data.chapterData;
      userRequest = data.userRequest;
    } else {
      // Fallback to JSON for backward compatibility
      const data = await request.json();
      chapterData = data.chapterData;
      userRequest = data.userRequest;
    }

    if (!chapterData || !userRequest) {
      const errorResponse = yaml.dump({
        success: false,
        error: 'Missing required fields: chapterData and userRequest'
      });
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/yaml' }
      });
    }

    const currentChapterYaml = yaml.dump(chapterData);

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are a creative chapter development expert. Your task is to modify a SINGLE chapter data structure based on user requests.

CRITICAL RULES:
1. ALWAYS make meaningful changes when a user requests something - never return unchanged data
2. Be CREATIVE and INTERPRETIVE with abstract requests
3. Return exactly ONE chapter object, not multiple chapters or arrays
4. Maintain the exact same structure as the input chapter data
5. Only modify or add fields within the single chapter object
6. When adding scenes, add them as a "scenes" array field within the same chapter
7. Return ONLY valid YAML without code blocks, explanations, or multiple documents

CREATIVE INTERPRETATION FOR CHAPTERS:
- "Add emotional depth" = Enhance character interactions, add internal conflicts, deepen relationships between characters in scenes
- "More tension" = Create conflicts between characters, add time pressure, increase stakes within the chapter
- "Add dialogue" = Create realistic conversations between characters, add verbal conflicts and emotional exchanges
- "Character development" = Add character growth moments, internal revelations, relationship changes
- "More action" = Add physical confrontations, chase sequences, dynamic movement between scenes
- "Add suspense" = Create cliffhangers, unknown elements, mysterious developments
- "Make it darker" = Intensify conflicts, add tragic elements, increase emotional weight
- "Add romance" = Create romantic tension, intimate moments, relationship development
- "More scenes" = Break chapter into multiple detailed scenes with specific goals and conflicts
- "Better pacing" = Adjust scene transitions, vary tension levels, improve story flow

ALWAYS MAKE SUBSTANTIAL CHANGES that reflect the user's intent, even if the request is vague or abstract.

YAML OUTPUT FORMAT: Return a single YAML object with the same structure as input.`,
      prompt: `User Request: "${userRequest}"

Current Chapter Data (YAML):
${currentChapterYaml}

TASK: Modify the above chapter data according to the user's request. The user expects meaningful changes to be made. Be creative and helpful:

- For "character development" requests: Add detailed character interactions, emotional moments, and character growth
- For "scene development" requests: Create specific, engaging scenes with clear goals, conflicts, and outcomes
- For "tension" requests: Add dramatic elements, conflicts, and pacing improvements
- For "dialogue" requests: Enhance character interactions and conversation elements
- For general writing requests: Enhance relevant fields with substantial content

Return the updated chapter data as a single YAML object with meaningful improvements. Do not create multiple chapters or arrays at the root level.

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

    let updatedChapterData;
    try {
      // Parse the YAML response back to JSON
      updatedChapterData = yaml.load(yamlContent);

      // Validate that we got an object
      if (!updatedChapterData || typeof updatedChapterData !== 'object') {
        throw new Error('Invalid chapter data structure returned');
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
      updatedChapterData: updatedChapterData
    });

    return new Response(successResponse, {
      headers: { 'Content-Type': 'application/yaml' }
    });

  } catch (error) {
    console.error('Chapter analyzer error:', error);
    const errorResponse = yaml.dump({
      success: false,
      error: 'Failed to process chapter analysis request'
    });
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/yaml' }
    });
  }
}