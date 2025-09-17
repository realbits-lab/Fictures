import { generateText } from 'ai';
import yaml from 'js-yaml';


export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let partData, userRequest;

    if (contentType.includes('application/yaml') || contentType.includes('text/yaml')) {
      // Parse YAML input
      const yamlText = await request.text();
      const data = yaml.load(yamlText) as any;
      partData = data.partData;
      userRequest = data.userRequest;
    } else {
      // Fallback to JSON for backward compatibility
      const data = await request.json();
      partData = data.partData;
      userRequest = data.userRequest;
    }

    if (!partData || !userRequest) {
      const errorResponse = yaml.dump({
        success: false,
        error: 'Missing required fields: partData and userRequest'
      });
      return new Response(errorResponse, {
        status: 400,
        headers: { 'Content-Type': 'application/yaml' }
      });
    }

    const currentPartYaml = yaml.dump(partData);

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are a creative story part development expert. Your task is to modify a SINGLE story part data structure based on user requests.

CRITICAL RULES:
1. ALWAYS make meaningful changes when a user requests something - never return unchanged data
2. Be CREATIVE and INTERPRETIVE with abstract requests
3. Return exactly ONE part object, not multiple parts or arrays
4. Maintain the exact same structure as the input part data
5. Only modify or add fields within the single part object
6. When adding chapters, add them as a "chapters" array field within the same part
7. Return ONLY valid YAML without code blocks, explanations, or multiple documents

CREATIVE INTERPRETATION FOR STORY PARTS:
- "Add emotional depth" = Enhance character emotional journeys, add internal conflicts, deepen character relationships and growth arcs
- "More character development" = Add character transformation moments, internal revelations, relationship dynamics
- "Add plot events" = Create specific plot developments, revelations, escalating conflicts, turning points
- "Increase tension" = Add escalating conflicts, time pressure, higher stakes throughout the part
- "Add romance" = Create romantic subplots, relationship development, intimate character moments
- "More action" = Add physical conflicts, chase sequences, dynamic confrontations
- "Add mystery" = Create unknown elements, secrets, investigative elements
- "Make it darker" = Intensify conflicts, add tragic elements, increase emotional weight and consequences
- "Add humor" = Include comedic moments, lighthearted character interactions, amusing situations
- "Better pacing" = Adjust story flow, vary tension levels, improve dramatic progression
- "Add themes" = Introduce thematic elements, moral dilemmas, deeper meaning
- "More chapters" = Break part into multiple detailed chapters with specific focus areas

IMPORTANT: For plot events, reveals, escalation, and emotional progression arrays, ALWAYS use simple descriptive text strings, NOT objects.
Example: events: ["Detective A discovers a hidden clue", "Detective B confronts their past trauma"]
NOT: events: [{description: "Detective A discovers clue", type: "discovery"}]

ALWAYS MAKE SUBSTANTIAL CHANGES that reflect the user's intent, even if the request is vague or abstract.

YAML OUTPUT FORMAT: Return a single YAML object with the same structure as input.`,
      prompt: `User Request: "${userRequest}"

Current Part Data (YAML):
${currentPartYaml}

TASK: Modify the above part data according to the user's request. The user expects meaningful changes to be made. Be creative and helpful:

- For "character development" requests: Add detailed character journeys, conflicts, transformations, and arcs
- For "plot events" requests: Create specific, engaging plot events, reveals, and escalations
- For "emotional journey" requests: Add emotional progression, moments, and character feelings
- For general writing requests: Enhance relevant fields with substantial content

Return the updated part data as a single YAML object with meaningful improvements. Do not create multiple parts or arrays at the root level.

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
      let indent = 0;

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

    let updatedPartData;
    try {
      // Parse the YAML response back to JSON
      updatedPartData = yaml.load(yamlContent);

      // Validate that we got an object
      if (!updatedPartData || typeof updatedPartData !== 'object') {
        throw new Error('Invalid part data structure returned');
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
      updatedPartData: updatedPartData
    });

    return new Response(successResponse, {
      headers: { 'Content-Type': 'application/yaml' }
    });

  } catch (error) {
    console.error('Part analyzer error:', error);
    const errorResponse = yaml.dump({
      success: false,
      error: 'Failed to process part analysis request'
    });
    return new Response(errorResponse, {
      status: 500,
      headers: { 'Content-Type': 'application/yaml' }
    });
  }
}