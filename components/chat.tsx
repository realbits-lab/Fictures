'use client';

import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useRouter, usePathname } from 'next/navigation';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
// Removed artifact imports - artifact system archived in Phase 3
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import type { Attachment, ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();
  const router = useRouter();
  const pathname = usePathname();

  const [input, setInput] = useState<string>('');

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest({ messages, id, body }) {
        const lastMessage = messages.at(-1);
        if (!lastMessage) {
          console.error('No message to send');
          throw new Error('No message to send');
        }
        
        return {
          body: {
            id,
            message: {
              id: lastMessage.id || generateUUID(),
              role: lastMessage.role,
              parts: lastMessage.parts || [{ type: 'text', text: lastMessage.content || '' }],
            },
            selectedChatModel: initialChatModel,
            selectedVisibilityType: initialVisibilityType,
            ...body,
          },
        };
      },
    }),
    onData: (dataPart) => {
      setDataStream((ds) => (ds ? [...ds, dataPart] : []));
    },
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  // Initialize messages with initialMessages if the hook didn't load them properly
  useEffect(() => {
    if (initialMessages.length > 0 && messages.length === 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, messages.length, setMessages]);

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  // Manual sendMessage implementation as fallback
  const manualSendMessage = async (message: ChatMessage) => {
    console.log('🔥 Manual sendMessage called with:', message);
    
    try {
      // Add the message to local state for existing chats
      setMessages((prevMessages) => [...prevMessages, message]);
      
      // For existing chats, handle normally
      const requestBody = {
        id,
        message: {
          id: message.id || generateUUID(),
          role: message.role,
          parts: message.parts,
        },
        selectedChatModel: initialChatModel,
        selectedVisibilityType: initialVisibilityType,
      };

      console.log('📤 Sending request to /api/chat with body:', requestBody);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Manual sendMessage response received');
      
      // Handle the streaming response
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            console.log('📥 Received chunk:', chunk);
            
            // Parse Server-Sent Events
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  console.log('📦 Parsed data:', data);
                  
                  // Handle different types of streaming data
                  if (data.type === 'text-delta' && data.delta) {
                    accumulatedContent += data.delta;
                    
                    // Update the UI with accumulated content
                    setMessages((prevMessages) => {
                      const newMessages = [...prevMessages];
                      const lastMessage = newMessages[newMessages.length - 1];
                      
                      // If the last message is from assistant, update it
                      if (lastMessage && lastMessage.role === 'assistant') {
                        lastMessage.parts = [{
                          type: 'text',
                          text: accumulatedContent
                        }];
                      } else {
                        // Add a new assistant message
                        newMessages.push({
                          id: generateUUID(),
                          role: 'assistant',
                          parts: [{
                            type: 'text',
                            text: accumulatedContent
                          }]
                        });
                      }
                      
                      return newMessages;
                    });
                  }
                } catch (e) {
                  // Skip non-JSON lines
                }
              }
            }
          }
        } catch (readerError) {
          console.error('Error reading stream:', readerError);
        }
      }
      
    } catch (error) {
      console.error('❌ Manual sendMessage error:', error);
      toast({
        type: 'error',
        description: 'Failed to send message',
      });
    }
  };

  // Use manual implementation if sendMessage is not available
  const effectiveSendMessage = sendMessage || manualSendMessage;

  // Disabled query parameter processing to prevent duplicate API calls
  // const [hasAppendedQuery, setHasAppendedQuery] = useState(false);
  
  // useEffect(() => {
  //   if (query && !hasAppendedQuery) {
  //     effectiveSendMessage({
  //       id: generateUUID(),
  //       role: 'user' as const,
  //       parts: [{ type: 'text', text: query }],
  //     });

  //     setHasAppendedQuery(true);
  //     window.history.replaceState({}, '', `/stories/create/${id}`);
  //   }
  // }, [query, effectiveSendMessage, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  // Removed artifact visibility state - no artifact in simplified interface


  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-[calc(100dvh-3.5rem)] bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          regenerate={regenerate}
          isReadonly={isReadonly}
        />

        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              sendMessage={effectiveSendMessage}
              selectedVisibilityType={initialVisibilityType}
            />
          )}
        </form>
      </div>
      
      {/* Artifact component removed - legacy system archived in Phase 3 */}
    </>
  );
}
