// AI client for Adversity-Triumph Engine generation
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.AI_GATEWAY_API_KEY,
});

export async function generateWithGemini(options: {
  prompt: string;
  systemPrompt: string;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const {
    prompt,
    systemPrompt,
    model = 'gemini-2.5-flash-lite',
    temperature = 0.7,
    maxTokens = 8192,
  } = options;

  try {
    const modelName = model === 'gemini-2.5-flash' ? 'gemini-2.0-flash-exp' : 'gemini-2.0-flash-exp';

    const { text } = await generateText({
      model: google(modelName),
      system: systemPrompt,
      prompt: prompt,
      temperature,
      // Note: maxTokens parameter removed - not supported in current AI SDK version
      // Model defaults will be used (typically 8192 tokens for Gemini)
    } as any); // Type assertion for extended parameters

    return text;
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw new Error(`Failed to generate with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateJSON<T = unknown>(options: {
  prompt: string;
  systemPrompt: string;
  model?: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite';
  temperature?: number;
}): Promise<T> {
  const text = await generateWithGemini(options);

  // Try multiple extraction strategies

  // 1. Extract from markdown code blocks
  let jsonMatch = text.match(/```(?:json)?\s*([\[\{][\s\S]*?[\}\]])\s*```/);

  // 2. Extract from first { or [ to last } or ]
  if (!jsonMatch) {
    const startMatch = text.match(/[\[\{]/);
    const endMatch = text.match(/[\}\]]/g);
    if (startMatch && endMatch) {
      const start = text.indexOf(startMatch[0]);
      const end = text.lastIndexOf(endMatch[endMatch.length - 1]) + 1;
      jsonMatch = [null, text.substring(start, end)] as any;
    }
  }

  if (!jsonMatch) {
    console.error('Failed to extract JSON from response');
    console.error('Response text:', text.substring(0, 500));
    throw new Error('No JSON found in response');
  }

  try {
    return JSON.parse(jsonMatch[1]) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Attempted to parse:', jsonMatch[1].substring(0, 500));
    console.error('Full response:', text.substring(0, 500));
    throw new Error('Failed to parse JSON response');
  }
}
