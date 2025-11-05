import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getStudioAgentChat,
  getStudioAgentMessages,
} from '@/lib/db/studio-agent-operations';

/**
 * GET /studio/api/agent/[chatId]/messages
 * Get all messages for a chat session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;

    // Authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Get chat and verify ownership
    const chat = await getStudioAgentChat(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all messages
    const messages = await getStudioAgentMessages(chatId);

    return NextResponse.json({
      chatId,
      messages: messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        parts: msg.parts,
        reasoning: msg.reasoning,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
