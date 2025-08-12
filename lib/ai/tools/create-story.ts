import { generateUUID } from '@/lib/utils';
import { tool, type UIMessageStreamWriter } from 'ai';
import { z } from 'zod';
import type { Session } from 'next-auth';
import type { ChatMessage } from '@/lib/types';
import { storyDocumentHandler } from '@/artifacts/story/server';

interface CreateStoryProps {
  session: Session;
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const createStory = ({ session, dataStream }: CreateStoryProps) =>
  tool({
    description:
      'Create a new story with specific metadata like title, genre, description, and tags. Use this when users want to create, write, or start a story.',
    inputSchema: z.object({
      title: z.string().describe('The title of the story'),
      genre: z.string().optional().describe('Genre like fantasy, sci-fi, romance, mystery, horror, adventure, drama, historical'),
      description: z.string().optional().describe('Brief description of what the story is about'),
      tags: z.array(z.string()).optional().describe('Array of tags relevant to the story'),
      status: z.enum(['draft', 'ongoing', 'completed', 'hiatus']).optional().default('draft').describe('Current status of the story'),
      matureContent: z.boolean().optional().default(false).describe('Whether the story contains mature content (18+)'),
    }),
    execute: async ({ title, genre, description, tags, status, matureContent }) => {
      const id = generateUUID();

      // Send story metadata to the client
      const storyMetadata = {
        title,
        genre: genre || 'fantasy',
        description: description || `A new story: ${title}`,
        tags: tags || ['new-story'],
        status: status || 'draft',
        matureContent: matureContent || false,
      };

      dataStream.write({
        type: 'data-kind',
        data: 'story',
        transient: true,
      });

      dataStream.write({
        type: 'data-id',
        data: id,
        transient: true,
      });

      dataStream.write({
        type: 'data-title',
        data: title,
        transient: true,
      });

      dataStream.write({
        type: 'data-storyMetadata',
        data: storyMetadata,
        transient: true,
      });

      dataStream.write({
        type: 'data-clear',
        data: null,
        transient: true,
      });

      // Use the story document handler to create the story
      await storyDocumentHandler.onCreateDocument({
        id,
        title,
        dataStream,
        session,
      });

      dataStream.write({ type: 'data-finish', data: null, transient: true });

      return {
        id,
        title,
        genre,
        description,
        tags,
        status,
        matureContent,
        kind: 'story' as const,
        content: 'A new story has been created and is now visible to you. You can continue writing or editing it.',
      };
    },
  });