import { NextRequest } from 'next/server';
import { auth } from '@/app/auth';
import { db } from '@/lib/db/drizzle';
import { book } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { myProvider } from '@/lib/ai/providers';
import { streamText } from 'ai';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Rate limiting
    if (!checkRateLimit(session.user.id)) {
      return new Response('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      });
    }

    // Parse request body
    const body = await request.json();
    const { bookId, chapterNumber, prompt, maxTokens = 2000, temperature = 0.7, includeContext } = body;

    // Validate input
    if (!bookId || typeof bookId !== 'string') {
      return new Response('Invalid bookId', { status: 400 });
    }

    if (!chapterNumber || typeof chapterNumber !== 'number' || chapterNumber <= 0) {
      return new Response('Invalid chapterNumber', { status: 400 });
    }

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response('Invalid prompt', { status: 400 });
    }

    // Check if book exists and user owns it
    const bookResult = await db
      .select()
      .from(book)
      .where(eq(book.id, bookId))
      .limit(1);

    if (bookResult.length === 0) {
      return new Response('Book not found', { status: 404 });
    }

    if (bookResult[0].authorId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    // Build context if requested
    let contextPrompt = '';
    if (includeContext) {
      const contextResponse = await fetch(`${request.nextUrl.origin}/api/chapters/context?bookId=${bookId}&chapterNumber=${chapterNumber}`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
        },
      });

      if (contextResponse.ok) {
        const context = await contextResponse.json();
        contextPrompt = buildContextPrompt(context);
      }
    }

    // Build the final prompt
    const finalPrompt = `${contextPrompt}

User Request: ${prompt}

Please write Chapter ${chapterNumber} based on the request above. Write engaging, high-quality prose that flows naturally and advances the story. Focus on:
- Character development
- Plot advancement
- Engaging dialogue
- Vivid descriptions
- Emotional resonance

Write the chapter content directly without any meta-commentary or explanations.`;

    // Generate streaming response
    const result = await streamText({
      model: myProvider.languageModel('artifact-model'),
      prompt: finalPrompt,
      maxTokens,
      temperature,
    });

    // Return streaming response
    return result.toTextStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Chapter generation error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

function buildContextPrompt(context: any): string {
  let prompt = '';

  if (context.bookTitle) {
    prompt += `Book Title: ${context.bookTitle}\n`;
  }

  if (context.bookDescription) {
    prompt += `Book Description: ${context.bookDescription}\n`;
  }

  if (context.genre) {
    prompt += `Genre: ${context.genre}\n`;
  }

  if (context.previousChapters && context.previousChapters.length > 0) {
    prompt += '\nPrevious Chapters:\n';
    context.previousChapters.forEach((chapter: any) => {
      prompt += `Chapter ${chapter.chapterNumber}: ${chapter.title}\n`;
      if (chapter.summary) {
        prompt += `Summary: ${chapter.summary}\n`;
      }
    });
  }

  if (context.characters && context.characters.length > 0) {
    prompt += '\nMain Characters:\n';
    context.characters.forEach((character: any) => {
      prompt += `- ${character.name}: ${character.description} (Role: ${character.role})\n`;
    });
  }

  if (context.outline) {
    prompt += `\nStory Outline: ${context.outline}\n`;
  }

  return prompt;
}