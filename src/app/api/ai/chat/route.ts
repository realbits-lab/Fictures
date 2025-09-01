import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { streamText } from 'ai';
import { AI_MODELS, AI_PROMPTS } from '@/lib/ai/config';
import { z } from 'zod';
import { db } from '@/lib/db';
import { aiInteractions } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  sessionId: z.string().optional(),
  context: z.object({
    storyTitle: z.string().optional(),
    chapterTitle: z.string().optional(),
    currentText: z.string().optional(),
    characters: z.array(z.string()).optional(),
    genre: z.string().optional(),
  }).optional(),
});

// POST /api/ai/chat - Streaming AI chat for writing assistance
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { messages, sessionId, context } = chatSchema.parse(body);

    // Build context-aware system prompt
    let systemPrompt = AI_PROMPTS.writing_assistance;
    
    if (context) {
      systemPrompt += `\n\nCurrent writing context:`;
      if (context.storyTitle) systemPrompt += `\n- Story: "${context.storyTitle}"`;
      if (context.chapterTitle) systemPrompt += `\n- Chapter: "${context.chapterTitle}"`;
      if (context.genre) systemPrompt += `\n- Genre: ${context.genre}`;
      if (context.characters?.length) {
        systemPrompt += `\n- Characters: ${context.characters.join(', ')}`;
      }
      if (context.currentText) {
        systemPrompt += `\n- Current text excerpt:\n${context.currentText.slice(-500)}`;
      }
    }

    systemPrompt += `\n\nProvide helpful, specific writing advice. Be encouraging but honest. Give concrete examples when possible.`;

    // Get the last user message for storing interaction
    const lastUserMessage = messages[messages.length - 1];

    // Create streaming response
    const result = streamText({
      model: AI_MODELS.writing,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      onFinish: async (completion) => {
        // Store the interaction after completion
        try {
          const interactionId = nanoid();
          if (!session.user?.id) return;
          
          const interactionData = {
            id: interactionId,
            userId: session.user.id,
            sessionId: sessionId || undefined,
            type: 'chat_assistance' as const,
            prompt: lastUserMessage.content,
            response: completion.text,
            applied: false,
          };
          await db.insert(aiInteractions).values(interactionData);
        } catch (error) {
          console.error('Error storing AI interaction:', error);
        }
      },
    });

    return result.toTextStreamResponse();

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('Error in AI chat:', error);
    return new Response('Internal server error', { status: 500 });
  }
}