import { generateText } from 'ai';
import yaml from 'js-yaml';


export async function POST(request: Request) {
  try {
    const { partData, userRequest } = await request.json();

    if (!partData || !userRequest) {
      return Response.json({
        success: false,
        error: 'Missing required fields: partData and userRequest'
      }, { status: 400 });
    }

    const currentPartYaml = yaml.dump(partData);

    const { text } = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are an expert story part analyzer and editor. Your task is to modify story part data based on user requests.

Your role:
1. Analyze the user's request carefully
2. Apply relevant changes to improve the part structure
3. Maintain story consistency and narrative flow
4. Keep character development logical and meaningful
5. Ensure plot elements support the part's function
6. Preserve the Korean story context if present

Guidelines:
- Only modify fields that are relevant to the user's request
- Keep changes realistic and story-appropriate
- Maintain proper character arc progression
- Ensure plot events support the part's goal and conflict
- Preserve existing good elements unless specifically asked to change them
- For Korean content, maintain language and cultural authenticity

IMPORTANT: Return the updated part data as valid YAML format only. Do not include any other text or explanations.`,
      prompt: `User Request: "${userRequest}"

Current Part Data (YAML):
${currentPartYaml}

Please analyze and modify the part data according to the user's request. Return the updated part data as valid YAML format.`,
    });

    // Extract YAML from markdown code blocks if present
    let yamlContent = text;
    const yamlBlockMatch = text.match(/```(?:yaml|yml)?\s*\n([\s\S]*?)\n```/);
    if (yamlBlockMatch) {
      yamlContent = yamlBlockMatch[1];
    }

    // Parse the YAML response back to JSON
    const updatedPartData = yaml.load(yamlContent);

    return Response.json({
      success: true,
      updatedPartData: updatedPartData
    });

  } catch (error) {
    console.error('Part analyzer error:', error);
    return Response.json({
      success: false,
      error: 'Failed to process part analysis request'
    }, { status: 500 });
  }
}