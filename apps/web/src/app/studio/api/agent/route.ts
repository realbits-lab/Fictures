import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText } from "ai";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
	createStudioAgentChat,
	getStudioAgentChat,
	getStudioAgentMessages,
	saveStudioAgentMessage,
	saveToolExecution,
	updateToolExecution,
} from "@/lib/db/studio-agent-operations";
import { studioAgentTools } from "@/lib/studio/agents/agent-tools";

export const maxDuration = 60; // Allow longer execution for multi-step reasoning
export const runtime = "nodejs"; // Use Node.js runtime for database operations

const GENERATION_AGENT_SYSTEM_PROMPT = `You are a Generation Agent for Fictures, an AI-powered story writing platform.

Your role is to guide writers through the 9-phase Adversity-Triumph Engine story generation process.

THE 9-PHASE GENERATION PIPELINE:
1. Story Summary - Generate initial concept with genre, themes, moral framework
2. Characters - Create character profiles with internal flaws and virtues
3. Settings - Design story locations with atmospheric details
4. Parts - Structure the story into acts with emotional progression
5. Chapters - Break down parts into chapters with micro-cycles
6. Scene Summaries - Outline individual scenes with emotional beats
7. Scene Content - Generate full narrative prose (max 3 sentences/paragraph)
8. Evaluation - Quality check using Architectonics of Engagement (≥3.0/4.0)
9. Images - Generate images for story, characters, settings, scenes

REASONING PROCESS:
1. Check prerequisites using checkPrerequisites tool
2. Validate story structure using validateStoryStructure
3. Suggest next phase using suggestNextPhase
4. Execute generation tools in sequential order
5. Update phase progress using updatePhaseProgress
6. Provide clear feedback and next steps

AVAILABLE TOOLS:
- Advisory: checkPrerequisites, validateStoryStructure, suggestNextPhase
- Generation: generateStorySummary, generateCharacters, generateSettings, generateParts, generateChapters, generateSceneSummaries, generateSceneContent, evaluateScene, generateImages
- Utility: validateApiKey, updatePhaseProgress, getGenerationProgress, createEmptyStory
- CRUD: Full CRUD operations for all story entities

GUIDELINES:
- Always check prerequisites before starting a phase
- Explain the purpose of each phase before generating
- Update phase progress after completing each phase
- Show generation progress percentage
- Provide encouraging feedback and estimated time remaining
- Guide users through the complete 9-phase journey`;

const EDITING_AGENT_SYSTEM_PROMPT = `You are an Editing Agent for Fictures, an AI-powered story writing platform.

Your role is to help writers understand and manage their story content.

STORY CONTEXT:
The story context is provided in each request, including:
- Story ID, title, genre, status, summary, tone, and moral framework
- Parts, chapters, scenes, characters, and settings information

When users ask about story details, you can reference the story context provided in the conversation.

CAPABILITIES:
- Answer questions about the story (summary, characters, settings, structure)
- Explain story elements and their relationships
- Provide feedback on story organization
- Offer suggestions for story development
- Clarify the Adversity-Triumph Engine methodology

GUIDELINES:
- Always explain your reasoning clearly
- Show your thought process transparently
- When discussing story data, reference specific fields and values
- Respect the writer's creative vision while offering helpful suggestions
- Be precise and accurate with story information
- Use the story context provided in each request

NOTE: Currently you don't have direct database access tools, but you can view and discuss the story context provided in the conversation.`;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// Support both AI SDK v3.x and v5.x formats
		const chatId = body.chatId || body.id;
		const storyContext = body.storyContext;
		const agentType = body.agentType || "editing";

		// Extract message from either v3.x format (body.message) or v5.x format (body.messages)
		let messageContent: string;
		if (
			body.messages &&
			Array.isArray(body.messages) &&
			body.messages.length > 0
		) {
			// AI SDK v5.x format: { messages: [...] }
			// Get the last user message from the messages array
			const lastMessage = body.messages[body.messages.length - 1];
			if (
				lastMessage &&
				typeof lastMessage === "object" &&
				lastMessage.content
			) {
				if (typeof lastMessage.content === "string") {
					messageContent = lastMessage.content;
				} else if (Array.isArray(lastMessage.content)) {
					// Content can be an array of parts, extract text parts
					messageContent = lastMessage.content
						.filter((part: any) => part.type === "text")
						.map((part: any) => part.text)
						.join("");
				} else {
					messageContent = String(lastMessage.content);
				}
			} else {
				return new Response(
					JSON.stringify({
						error: "Invalid request format: message has no content",
					}),
					{ status: 400, headers: { "Content-Type": "application/json" } },
				);
			}
		} else if (
			body.message &&
			typeof body.message === "object" &&
			body.message.content
		) {
			// AI SDK v3.x format: { message: { content: string } }
			messageContent = body.message.content;
		} else if (body.content) {
			// AI SDK v5.x alternative format: { role: 'user', content: string }
			messageContent = body.content;
		} else if (typeof body.message === "string") {
			// Fallback: message is a string
			messageContent = body.message;
		} else {
			return new Response(
				JSON.stringify({
					error: "Invalid request format: missing message content",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } },
			);
		}

		// Authentication
		const session = await auth();
		if (!session?.user) {
			return new Response("Unauthorized", { status: 401 });
		}

		const userId = session.user.id as string;

		// Validate chatId is a valid UUID format before querying database
		const isValidUUID = (id: string) => {
			const uuidRegex =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
			return uuidRegex.test(id);
		};

		// Get or create agent chat
		// Only try to fetch existing chat if chatId is a valid UUID
		let chat =
			chatId && isValidUUID(chatId) ? await getStudioAgentChat(chatId) : null;
		if (!chat) {
			chat = await createStudioAgentChat({
				userId,
				storyId: storyContext?.storyId || null,
				agentType: agentType as "generation" | "editing",
				title: messageContent.slice(0, 50) + "...",
				context: storyContext,
			});
		}

		// Load existing messages
		const existingMessages = await getStudioAgentMessages(chat.id);

		// Convert to AI SDK format
		const uiMessages = existingMessages.map((msg) => ({
			id: msg.id,
			role: msg.role as "user" | "assistant" | "system",
			content: msg.content,
			parts: msg.parts as any,
			createdAt: msg.createdAt,
		}));

		// Add new user message
		const userMessage = {
			id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			role: "user" as const,
			content: messageContent,
			parts: [{ type: "text", text: messageContent }] as any,
			createdAt: new Date().toISOString(),
		};

		const allMessages = [...uiMessages, userMessage];

		// Save user message
		const savedUserMessage = await saveStudioAgentMessage({
			chatId: chat.id,
			role: "user",
			content: messageContent,
			parts: [{ type: "text", text: messageContent }] as any,
		});

		// Select system prompt and tools based on agent type
		const systemPrompt =
			chat.agentType === "generation"
				? GENERATION_AGENT_SYSTEM_PROMPT
				: EDITING_AGENT_SYSTEM_PROMPT;

		// Prepare stream options (temporarily disable tools for editing agent due to Gemini API compatibility issue)
		const streamOptions: any = {
			model: google("gemini-2.0-flash-exp"),
			system: systemPrompt,
			messages: convertToCoreMessages(allMessages) as any,
			// Save assistant message after streaming completes
			onFinish: async ({ text, toolCalls }: any) => {
				try {
					await saveStudioAgentMessage({
						chatId: chat.id,
						role: "assistant",
						content: text,
						parts: [
							{ type: "text", text },
							...(toolCalls || []).map((tool: any) => ({
								type: "tool-call",
								toolCallId: tool.toolCallId,
								toolName: tool.toolName,
								args: tool.args,
							})),
						] as any,
					});
				} catch (saveError) {
					console.error("[Agent] Failed to save assistant message:", saveError);
				}
			},
		};

		// Only add tools for generation agent (editing agent can work without tools)
		if (chat.agentType === "generation") {
			streamOptions.tools = studioAgentTools;
		}

		// Stream response
		const result = streamText(streamOptions);

		return result.toTextStreamResponse({
			headers: {
				"X-Chat-Id": chat.id,
			},
		});
	} catch (error) {
		console.error("Studio Agent API error:", error);
		return new Response(
			JSON.stringify({
				error: "Internal Server Error",
				message: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
