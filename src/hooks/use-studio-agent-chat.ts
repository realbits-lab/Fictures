'use client';

import { useChat } from 'ai/react';
import { useEffect, useState } from 'react';

interface UseStudioAgentChatProps {
  chatId?: string;
  storyContext?: Record<string, any>;
}

export function useStudioAgentChat({
  chatId,
  storyContext,
}: UseStudioAgentChatProps) {
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);

  const chat = useChat({
    id: currentChatId,
    api: '/api/studio/agent',
    body: {
      chatId: currentChatId,
      storyContext,
    },
    onResponse: (response) => {
      // Extract chat ID from response headers if this is a new chat
      const newChatId = response.headers.get('X-Chat-Id');
      if (newChatId && !currentChatId) {
        setCurrentChatId(newChatId);
      }
    },
    onFinish: () => {
      setActiveTools([]); // Clear active tools when response completes
    },
    onError: (error) => {
      console.error('[Agent Chat] Error:', error);
    },
  });

  // Load chat history on mount
  useEffect(() => {
    if (!currentChatId || historyLoaded) return;

    async function loadChatHistory() {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/studio/agent/${currentChatId}/messages`);
        if (response.ok) {
          const { messages } = await response.json();
          chat.setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load agent chat history:', error);
      } finally {
        setLoadingHistory(false);
        setHistoryLoaded(true);
      }
    }

    loadChatHistory();
  }, [currentChatId, historyLoaded]);

  // Track active tools from message parts
  useEffect(() => {
    const activeTool = chat.messages
      .flatMap((m) => (m as any).toolInvocations || [])
      .filter((t: any) => t.state === 'call')
      .map((t: any) => t.toolName);

    setActiveTools(activeTool);
  }, [chat.messages]);

  return {
    ...chat,
    loadingHistory,
    historyLoaded,
    activeTools,
    chatId: currentChatId,
  };
}
