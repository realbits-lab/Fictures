import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getScopeDescriptions, validateScopes } from "@/lib/auth/api-keys";
import { authenticateRequest } from "@/lib/auth/dual-auth";
import { deleteApiKey, getUserApiKeys, updateApiKey } from "@/lib/db/queries";

export const runtime = "nodejs";

const updateApiKeySchema = z.object({
	name: z.string().min(1).max(255).optional(),
	scopes: z.array(z.string()).optional(),
	expiresAt: z.string().datetime().optional().nullable(),
	isActive: z.boolean().optional(),
});

// GET /api/settings/api-keys/[id] - Get specific API key
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Only session-based auth can manage API keys
		if (authResult.type !== "session") {
			return NextResponse.json(
				{ error: "Session authentication required for API key management" },
				{ status: 403 },
			);
		}

		// Await params in Next.js 15
		const { id } = await params;

		// Get user's API keys and find the specific one
		const apiKeys = await getUserApiKeys(authResult.user.id);
		const apiKey = apiKeys.find((key) => key.id === id);

		if (!apiKey) {
			return NextResponse.json({ error: "API key not found" }, { status: 404 });
		}

		const formattedKey = {
			id: apiKey.id,
			name: apiKey.name,
			keyPrefix: apiKey.keyPrefix,
			scopes: apiKey.scopes,
			scopeDescriptions: getScopeDescriptions(apiKey.scopes),
			lastUsedAt: apiKey.lastUsedAt,
			expiresAt: apiKey.expiresAt,
			isActive: apiKey.isActive,
			isExpired: apiKey.expiresAt ? new Date() > apiKey.expiresAt : false,
			createdAt: apiKey.createdAt,
			updatedAt: apiKey.updatedAt,
		};

		return NextResponse.json({ apiKey: formattedKey });
	} catch (error) {
		console.error("Error fetching API key:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// PATCH /api/settings/api-keys/[id] - Update specific API key
export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Only session-based auth can manage API keys
		if (authResult.type !== "session") {
			return NextResponse.json(
				{ error: "Session authentication required for API key management" },
				{ status: 403 },
			);
		}

		// Await params in Next.js 15
		const { id } = await params;

		// Verify the API key belongs to the user
		const userApiKeys = await getUserApiKeys(authResult.user.id);
		const existingKey = userApiKeys.find((key) => key.id === id);

		if (!existingKey) {
			return NextResponse.json({ error: "API key not found" }, { status: 404 });
		}

		const body = await request.json();
		const validatedData = updateApiKeySchema.parse(body);

		// Prepare update data
		const updateData: any = {};

		if (validatedData.name) {
			updateData.name = validatedData.name;
		}

		if (validatedData.scopes) {
			const validScopes = validateScopes(validatedData.scopes);
			if (validScopes.length === 0) {
				return NextResponse.json(
					{ error: "At least one valid scope is required" },
					{ status: 400 },
				);
			}
			updateData.scopes = validScopes;
		}

		if (validatedData.expiresAt !== undefined) {
			updateData.expiresAt = validatedData.expiresAt
				? new Date(validatedData.expiresAt)
				: null;
		}

		if (validatedData.isActive !== undefined) {
			updateData.isActive = validatedData.isActive;
		}

		// Update the API key
		const updatedApiKey = await updateApiKey(id, updateData);

		if (!updatedApiKey) {
			return NextResponse.json(
				{ error: "Failed to update API key" },
				{ status: 500 },
			);
		}

		const formattedKey = {
			id: updatedApiKey.id,
			name: updatedApiKey.name,
			keyPrefix: updatedApiKey.keyPrefix,
			scopes: updatedApiKey.scopes,
			scopeDescriptions: getScopeDescriptions(updatedApiKey.scopes),
			lastUsedAt: updatedApiKey.lastUsedAt,
			expiresAt: updatedApiKey.expiresAt,
			isActive: updatedApiKey.isActive,
			isExpired: updatedApiKey.expiresAt
				? new Date() > updatedApiKey.expiresAt
				: false,
			createdAt: updatedApiKey.createdAt,
			updatedAt: updatedApiKey.updatedAt,
		};

		return NextResponse.json({
			apiKey: formattedKey,
			message: "API key updated successfully",
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Invalid input",
					details: error.issues,
				},
				{ status: 400 },
			);
		}

		console.error("Error updating API key:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// DELETE /api/settings/api-keys/[id] - Delete specific API key
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const authResult = await authenticateRequest(request);

		if (!authResult) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// Only session-based auth can manage API keys
		if (authResult.type !== "session") {
			return NextResponse.json(
				{ error: "Session authentication required for API key management" },
				{ status: 403 },
			);
		}

		// Await params in Next.js 15
		const { id } = await params;

		// Verify the API key belongs to the user
		const userApiKeys = await getUserApiKeys(authResult.user.id);
		const existingKey = userApiKeys.find((key) => key.id === id);

		if (!existingKey) {
			return NextResponse.json({ error: "API key not found" }, { status: 404 });
		}

		// Delete the API key
		await deleteApiKey(id);

		return NextResponse.json({
			message: "API key deleted successfully",
			deletedKeyId: id,
		});
	} catch (error) {
		console.error("Error deleting API key:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
