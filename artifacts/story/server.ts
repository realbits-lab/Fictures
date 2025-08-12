import { smoothStream, streamText } from 'ai';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';
import { story } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';

// Create db instance like other query files
// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export const storyDocumentHandler = createDocumentHandler<'story'>({
  kind: 'story',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    let draftContent = '';
    
    // Extract story metadata from the title/conversation
    // For now, use defaults but this could be enhanced to parse from conversation
    const storyMetadata = {
      title: title,
      description: `A new story: ${title}`,
      genre: 'fantasy',
      status: 'draft' as const,
      tags: ['new-story'],
      isPublished: false,
    };

    // Create story record in database
    if (session?.user?.id) {
      try {
        await db.insert(story).values({
          id: id,
          title: storyMetadata.title,
          description: storyMetadata.description,
          genre: storyMetadata.genre,
          status: storyMetadata.status,
          authorId: session.user.id,
          isPublished: storyMetadata.isPublished,
          tags: storyMetadata.tags,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        dataStream.write({
          type: 'data-storyMetadata',
          data: storyMetadata,
          transient: true,
        });
      } catch (error) {
        console.error('Failed to create story record:', error);
      }
    }

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: `Create the beginning of a story with the title "${title}". 
        Write an engaging opening that sets up the world, introduces key characters, 
        and hooks the reader. Use rich descriptions and dialogue where appropriate.
        Format using markdown with proper headings and paragraphs.`,
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: `Write the opening of a story titled: ${title}`,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: 'data-textDelta',
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    const { fullStream } = streamText({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'story'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      providerOptions: {
        openai: {
          prediction: {
            type: 'content',
            content: document.content,
          },
        },
      },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text') {
        const { text } = delta;

        draftContent += text;

        dataStream.write({
          type: 'data-textDelta',
          data: text,
          transient: true,
        });
      }
    }

    return draftContent;
  },
});