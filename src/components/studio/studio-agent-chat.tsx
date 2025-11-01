'use client';

import { useStudioAgentChat } from '@/hooks/use-studio-agent-chat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Wrench, CheckCircle, XCircle, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from 'ai';

interface StudioAgentChatProps {
  chatId?: string;
  storyId?: string;
  storyContext?: Record<string, any>;
  className?: string;
}

interface ToolInvocation {
  state: 'call' | 'result';
  toolCallId: string;
  toolName: string;
  args?: Record<string, any>;
  result?: any;
}

function ToolExecutionCard({ tool }: { tool: ToolInvocation }) {
  const isComplete = tool.state === 'result';
  const isError = isComplete && tool.result?.success === false;

  return (
    <Card className={cn(
      'my-2 border-l-4 transition-all',
      isComplete
        ? isError
          ? 'border-l-destructive bg-destructive/5'
          : 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
        : 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    )}>
      <CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
        <div className="flex items-center gap-2 flex-1">
          {isComplete ? (
            isError ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            )
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
          )}
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium">{tool.toolName}</span>
        </div>
        <Badge variant={isComplete ? (isError ? 'destructive' : 'default') : 'secondary'} className="text-xs">
          {isComplete ? (isError ? 'Error' : 'Complete') : 'Running'}
        </Badge>
      </CardHeader>
      {tool.args && (
        <CardContent className="py-2 px-4">
          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Input:</div>
              <pre className="rounded bg-muted/50 p-2 text-xs overflow-x-auto border">
                {JSON.stringify(tool.args, null, 2)}
              </pre>
            </div>
            {tool.result && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1">Output:</div>
                <pre className="rounded bg-muted/50 p-2 text-xs overflow-x-auto border">
                  {JSON.stringify(tool.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function AgentMessage({ message }: { message: Message & { toolInvocations?: ToolInvocation[] } }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 mb-4', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('flex flex-col gap-2 max-w-[80%]', isUser && 'items-end')}>
        {/* Message content */}
        <div
          className={cn(
            'rounded-lg px-4 py-2.5',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content}
          </div>
        </div>

        {/* Tool executions */}
        {!isUser && message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="w-full space-y-2">
            <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2 px-1">
              <Sparkles className="h-3 w-3" />
              Tools Used:
            </div>
            {message.toolInvocations.map((tool) => (
              <ToolExecutionCard key={tool.toolCallId} tool={tool} />
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
}

export function StudioAgentChat({
  chatId,
  storyId,
  storyContext,
  className,
}: StudioAgentChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    loadingHistory,
    activeTools,
  } = useStudioAgentChat({
    chatId,
    storyContext: {
      ...storyContext,
      storyId,
    },
  });

  if (loadingHistory) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading conversation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Studio Editing Agent</h2>
              <p className="text-sm text-muted-foreground">
                AI assistant for managing your story
              </p>
            </div>
          </div>
          {activeTools.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-muted-foreground">
                Running: {activeTools.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="rounded-full bg-gradient-to-br from-purple-500 to-blue-500 p-6 mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a Conversation</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me to help you manage your story. I can read, create, update, or delete
                stories, parts, chapters, scenes, characters, and settings.
              </p>
              <div className="mt-6 grid gap-2 w-full max-w-md">
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    handleInputChange({
                      target: { value: 'Show me the details of this story' },
                    } as any);
                    setTimeout(() => handleSubmit(event as any), 100);
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">Show story details</span>
                    <span className="text-xs text-muted-foreground">
                      Get complete information about the current story
                    </span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3"
                  onClick={() => {
                    const event = new Event('submit', { bubbles: true, cancelable: true });
                    handleInputChange({
                      target: { value: 'List all characters in this story' },
                    } as any);
                    setTimeout(() => handleSubmit(event as any), 100);
                  }}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">List all characters</span>
                    <span className="text-xs text-muted-foreground">
                      View all characters with their details
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <AgentMessage key={message.id} message={message as any} />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask me to help manage your story... (e.g., 'Create a new chapter titled...', 'Update the scene with...', 'Show me all characters')"
            className="flex-1 resize-none min-h-[60px] max-h-[200px]"
            rows={2}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input?.trim()}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
