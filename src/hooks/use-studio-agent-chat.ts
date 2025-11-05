'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useState, useMemo } from 'react';

interface UseStudioAgentChatProps {
  chatId?: string;
  storyContext?: Record<string, any>;
  agentType?: 'generation' | 'editing';
  onChatCreated?: (chatId: string) => void;
}

export function useStudioAgentChat({
  chatId,
  storyContext,
  agentType = 'generation',
  onChatCreated,
}: UseStudioAgentChatProps) {
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(chatId);

  // Manage input state manually (AI SDK v5+ doesn't provide this)
  const [input, setInput] = useState('');

  const chat = useChat({
    id: currentChatId,
    api: '/studio/api/agent',
    body: {
      chatId: currentChatId,
      storyContext,
      agentType,
    },
    onResponse: (response: any) => {
      // Extract chat ID from response headers if this is a new chat
      const newChatId = response.headers.get('X-Chat-Id');
      if (newChatId && !currentChatId) {
        setCurrentChatId(newChatId);
        onChatCreated?.(newChatId);
      }
    },
    onFinish: () => {
      // Active tools are automatically cleared via useMemo when messages update
    },
    onError: (error: any) => {
      console.error('[Agent Chat] Error:', error);
    },
  } as any);

  // Extract properties from chat (AI SDK v5+ API)
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
  } = chat as any;

  // Create handleInputChange for compatibility
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Create handleSubmit that uses sendMessage (AI SDK v5+ API)
  const handleSubmit = async (e?: any) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }

    const trimmedInput = input?.trim();
    if (!trimmedInput || !sendMessage) {
      console.warn('[Agent Chat] Cannot send message: no input or sendMessage not available');
      return;
    }

    try {
      // Send message using AI SDK v5+ API
      await sendMessage({
        role: 'user',
        content: trimmedInput,
      });

      // Clear input after sending
      setInput('');
    } catch (error) {
      console.error('[Agent Chat] Failed to send message:', error);
    }
  };

  // Derive isLoading from status
  const isLoading = status === 'in_progress' || status === 'submitted';

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
      .flatMap((m: any) => (m as any).toolInvocations || [])
      .filter((t: any) => t.state === 'call')
      .map((t: any) => t.toolName);
  }, [messages]);

  // Create new story workflow
  const createNewStory = async (title: string = 'Untitled Story') => {
    const response = await fetch('/studio/api/stories/create-empty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error('Failed to create story');
    }

    const data = await response.json();
    return data.storyId;
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setMessages,
    setInput,
    loadingHistory,
    historyLoaded,
    activeTools,
    chatId: currentChatId,
    createNewStory,
  };
}
