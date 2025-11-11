import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { StudioAgentChat } from "@/components/studio/studio-agent-chat";
import { auth } from "@/lib/auth";
import { getStoryById } from "@/lib/db/cached-queries";

interface PageProps {
	params: Promise<{
		chatId: string;
	}>;
	searchParams: Promise<{
		storyId?: string;
	}>;
}

export const metadata: Metadata = {
	title: "Studio Agent - Fictures",
	description: "AI-powered story creation and editing assistant",
};

export default async function StudioAgentPage({
	params,
	searchParams,
}: PageProps) {
	const session = await auth();
	if (!session?.user) {
		redirect("/login?callbackUrl=/studio/agent/new");
	}

	const { chatId } = await params;
	const { storyId } = await searchParams;

	// Determine if this is a new chat or existing chat
	const isNewChat = chatId === "new";

	// Get story context if storyId provided
	let storyContext: Record<string, any> | undefined;
	if (storyId) {
		try {
			const story = await getStoryById(storyId, session.user.id);
			if (story && (story as any).authorId === session.user.id) {
				storyContext = {
					storyId: (story as any).id,
					title: (story as any).title,
					genre: (story as any).genre,
					status: (story as any).status,
				};
			}
		} catch (error) {
			console.error("Failed to load story context:", error);
		}
	}

	// Determine agent type based on context
	// If storyId is provided and it's a new chat, use generation mode
	// Otherwise default to editing mode
	const agentType = isNewChat && storyId ? "generation" : "editing";

	return (
		<MainLayout>
			<div className="container mx-auto h-[calc(100vh-4rem)]">
				<div className="h-full flex flex-col">
					{/* Header */}
					<div className="flex items-center justify-between py-4 border-b">
						<div>
							<h1 className="text-2xl font-bold">Studio Agent</h1>
							<p className="text-sm text-muted-foreground mt-1">
								{agentType === "generation"
									? "Create a new story with AI assistance"
									: "Edit and manage your story"}
							</p>
						</div>
						{storyContext && (
							<div className="text-right">
								<p className="text-sm font-medium">{storyContext.title}</p>
								<p className="text-xs text-muted-foreground">
									{storyContext.genre} • {storyContext.status}
								</p>
							</div>
						)}
					</div>

					{/* Chat Interface */}
					<div className="flex-1 min-h-0">
						<StudioAgentChat
							chatId={isNewChat ? undefined : chatId}
							storyId={storyId}
							storyContext={storyContext}
							agentType={agentType}
							className="h-full"
						/>
					</div>
				</div>
			</div>
		</MainLayout>
	);
}
