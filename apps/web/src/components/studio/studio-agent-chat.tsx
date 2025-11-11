"use client";

import type { UIMessage } from "ai";
import {
	Bot,
	CheckCircle,
	Loader2,
	Send,
	Sparkles,
	User,
	Wrench,
	XCircle,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useStudioAgentChat } from "@/hooks/use-studio-agent-chat";
import { cn } from "@/lib/utils";

interface StudioAgentChatProps {
	chatId?: string;
	storyId?: string;
	storyContext?: Record<string, any>;
	agentType?: "generation" | "editing";
	onChatCreated?: (chatId: string) => void;
	className?: string;
}

interface ToolInvocation {
	state: "call" | "result";
	toolCallId: string;
	toolName: string;
	args?: Record<string, any>;
	result?: any;
}

function ToolExecutionCard({ tool }: { tool: ToolInvocation }) {
	const isComplete = tool.state === "result";
	const isError = isComplete && tool.result?.success === false;

	return (
		<Card
			className={cn(
				"my-2 border-l-4 transition-all theme-card",
				isComplete
					? isError
						? "border-l-destructive bg-destructive/5"
						: "border-l-primary/70 bg-accent/50"
					: "border-l-primary bg-accent/30",
			)}
		>
			<CardHeader className="flex flex-row items-center gap-2 py-3 px-4">
				<div className="flex items-center gap-2 flex-1">
					{isComplete ? (
						isError ? (
							<XCircle className="h-4 w-4 text-destructive" />
						) : (
							<CheckCircle className="h-4 w-4 text-primary" />
						)
					) : (
						<Loader2 className="h-4 w-4 animate-spin text-primary" />
					)}
					<Wrench
						className="h-4 w-4"
						style={{ color: "rgb(var(--color-muted-foreground))" }}
					/>
					<span className="font-mono text-sm font-medium text-card-foreground">
						{tool.toolName}
					</span>
				</div>
				<Badge
					variant={
						isComplete ? (isError ? "destructive" : "default") : "secondary"
					}
					className="text-xs theme-badge"
				>
					{isComplete ? (isError ? "Error" : "Complete") : "Running"}
				</Badge>
			</CardHeader>
			{tool.args && (
				<CardContent className="py-2 px-4">
					<div className="space-y-2">
						<div>
							<div
								className="text-xs font-semibold mb-1"
								style={{ color: "rgb(var(--color-muted-foreground))" }}
							>
								Input:
							</div>
							<pre
								className="rounded-theme-input bg-muted/50 p-2 text-xs overflow-x-auto border-theme"
								style={{ color: "rgb(var(--color-foreground))" }}
							>
								{JSON.stringify(tool.args, null, 2)}
							</pre>
						</div>
						{tool.result && (
							<div>
								<div
									className="text-xs font-semibold mb-1"
									style={{ color: "rgb(var(--color-muted-foreground))" }}
								>
									Output:
								</div>
								<pre
									className="rounded-theme-input bg-muted/50 p-2 text-xs overflow-x-auto border-theme"
									style={{ color: "rgb(var(--color-foreground))" }}
								>
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

function AgentMessage({
	message,
}: {
	message: UIMessage & { toolInvocations?: ToolInvocation[] };
}) {
	const isUser = message.role === "user";

	// Extract text content from message (AI SDK v5.x can have content as string or parts array)
	const textContent =
		message.parts && Array.isArray(message.parts)
			? message.parts
					.filter((part) => part.type === "text")
					.map((part) => (part as any).text)
					.join("")
			: typeof (message as any).content === "string"
				? (message as any).content
				: "";

	return (
		<div
			className={cn(
				"flex gap-3 mb-4",
				isUser ? "justify-end" : "justify-start",
			)}
		>
			{!isUser && (
				<div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-primary">
					<Bot className="h-4 w-4 text-primary-foreground" />
				</div>
			)}

			<div
				className={cn("flex flex-col gap-2 max-w-[80%]", isUser && "items-end")}
			>
				{/* Message content */}
				<div
					className={cn(
						"rounded-theme-card px-4 py-2.5 transition-all",
						isUser
							? "bg-primary text-primary-foreground"
							: "bg-muted border-theme",
					)}
				>
					<div
						className={cn(
							"prose prose-sm dark:prose-invert max-w-none",
							isUser ? "prose-invert" : "",
						)}
						style={
							!isUser ? { color: "rgb(var(--color-foreground))" } : undefined
						}
					>
						{textContent}
					</div>
				</div>

				{/* Tool executions */}
				{!isUser &&
					message.toolInvocations &&
					message.toolInvocations.length > 0 && (
						<div className="w-full space-y-2">
							<div
								className="text-xs font-semibold flex items-center gap-2 px-1"
								style={{ color: "rgb(var(--color-muted-foreground))" }}
							>
								<Sparkles
									className="h-3 w-3"
									style={{ color: "rgb(var(--color-muted-foreground))" }}
								/>
								Tools Used:
							</div>
							{message.toolInvocations.map((tool) => (
								<ToolExecutionCard key={tool.toolCallId} tool={tool} />
							))}
						</div>
					)}
			</div>

			{isUser && (
				<div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-secondary">
					<User className="h-4 w-4 text-secondary-foreground" />
				</div>
			)}
		</div>
	);
}

export function StudioAgentChat({
	chatId,
	storyId,
	storyContext,
	agentType = "editing",
	onChatCreated,
	className,
}: StudioAgentChatProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		isLoading,
		loadingHistory,
		activeTools,
		setInput,
	} = useStudioAgentChat({
		chatId,
		storyContext: {
			...storyContext,
			storyId,
		},
		agentType,
		onChatCreated,
	});

	// Prevent wheel events from propagating to parent when scrolling within this component
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const handleWheel = (e: WheelEvent) => {
			const target = e.target as HTMLElement;
			const scrollableParent = target.closest(".overflow-y-auto");

			if (scrollableParent && container.contains(scrollableParent)) {
				// Only stop propagation if we're scrolling within our scrollable area
				e.stopPropagation();
			}
		};

		container.addEventListener("wheel", handleWheel, { passive: false });
		return () => container.removeEventListener("wheel", handleWheel);
	}, []);

	if (loadingHistory) {
		return (
			<div className={cn("flex items-center justify-center h-full", className)}>
				<div className="flex flex-col items-center gap-2">
					<Loader2
						className="h-8 w-8 animate-spin"
						style={{ color: "rgb(var(--color-muted-foreground))" }}
					/>
					<span
						className="text-sm"
						style={{ color: "rgb(var(--color-muted-foreground))" }}
					>
						Loading conversation...
					</span>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={cn("flex flex-col h-full bg-background", className)}
		>
			{/* Messages */}
			<div className="flex-1 p-4 overflow-y-auto text-foreground min-h-0 [overscroll-behavior-y:contain]">
				<div className="space-y-4 max-w-4xl mx-auto">
					{messages.length === 0 ? (
						<div className="flex flex-col items-center justify-center h-full py-12 text-center">
							<div className="rounded-full bg-primary p-6 mb-4">
								<Sparkles className="h-8 w-8 text-primary-foreground" />
							</div>
							<h3
								className="text-lg font-medium mb-2"
								style={{ color: "rgb(var(--color-foreground))" }}
							>
								Start a Conversation
							</h3>
							<p
								className="text-sm max-w-sm"
								style={{ color: "rgb(var(--color-muted-foreground))" }}
							>
								I can help manage stories, chapters, scenes, characters, and
								settings.
							</p>
							<div className="mt-6 grid gap-2 w-full max-w-md">
								<Button
									variant="outline"
									className="justify-start text-left h-auto py-3 theme-button"
									onClick={() => {
										setInput("Show me the details of this story");
									}}
								>
									<div className="flex flex-col items-start gap-1">
										<span className="font-medium">Show story details</span>
										<span
											className="text-xs"
											style={{ color: "rgb(var(--color-muted-foreground))" }}
										>
											Get complete information about the current story
										</span>
									</div>
								</Button>
								<Button
									variant="outline"
									className="justify-start text-left h-auto py-3 theme-button"
									onClick={() => {
										setInput("List all characters in this story");
									}}
								>
									<div className="flex flex-col items-start gap-1">
										<span className="font-medium">List all characters</span>
										<span
											className="text-xs"
											style={{ color: "rgb(var(--color-muted-foreground))" }}
										>
											View all characters with their details
										</span>
									</div>
								</Button>
							</div>
						</div>
					) : (
						messages.map((message: any) => (
							<AgentMessage key={message.id} message={message} />
						))
					)}
				</div>
			</div>

			{/* Input */}
			<div className="border-t bg-card p-4 mb-[10px] border-theme flex-shrink-0">
				<form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
					<Textarea
						value={input}
						onChange={handleInputChange}
						placeholder="Ask me to help with your story..."
						className="flex-1 resize-none min-h-[60px] max-h-[200px] theme-input"
						rows={2}
						disabled={isLoading}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSubmit(e as any);
							}
						}}
					/>
					<Button
						type="submit"
						disabled={isLoading || !input?.trim()}
						size="lg"
						className="h-[60px] w-[60px] shrink-0 theme-button"
					>
						{isLoading ? (
							<Loader2 className="h-5 w-5 animate-spin" />
						) : (
							<Send className="h-5 w-5" />
						)}
					</Button>
				</form>
				<p
					className="text-xs text-center mt-2"
					style={{ color: "rgb(var(--color-muted-foreground))" }}
				>
					Press Enter to send, Shift+Enter for new line
				</p>
			</div>
		</div>
	);
}
