'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useMemo } from 'react';

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
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
    setInput,
  } = useChat({
    id: currentChatId,
    api: '/studio/api/agent',
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
      // Active tools are automatically cleared via useMemo when messages update
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
        const response = await fetch(`/studio/api/agent/${currentChatId}/messages`);
        if (response.ok) {
          const { messages } = await response.json();
          setMessages(messages);
        }
      } catch (error) {
        console.error('Failed to load agent chat history:', error);
      } finally {
        setLoadingHistory(false);
        setHistoryLoaded(true);
      }
    }

    loadChatHistory();
  }, [currentChatId, historyLoaded, setMessages]);

  // Track active tools from message parts
  const activeTools = useMemo(() => {
    return messages
      .flatMap((m) => (m as any).toolInvocations || [])
      .filter((t: any) => t.state === 'call')
      .map((t: any) => t.toolName);
  }, [messages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    reload,
    stop,
    append,
    setMessages,
    setInput,
    loadingHistory,
    historyLoaded,
    activeTools,
    chatId: currentChatId,
  };
}
