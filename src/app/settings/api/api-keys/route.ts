import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, hasRequiredScope } from '@/lib/auth/dual-auth';
import {
  getUserApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey
} from '@/lib/db/queries';
import {
  generateApiKey,
  validateScopes,
  DEFAULT_SCOPES,
  ALL_SCOPES,
  getScopeDescriptions
} from '@/lib/auth/api-keys';
import { z } from 'zod';

export const runtime = 'nodejs';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(255),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/settings/api-keys - Get user's API keys
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only session-based auth can manage API keys (security measure)
    if (authResult.type !== 'session') {
      return NextResponse.json(
        { error: 'Session authentication required for API key management' },
        { status: 403 }
      );
    }

    const apiKeys = await getUserApiKeys(authResult.user.id);

    // Transform for frontend consumption
    const formattedKeys = apiKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      scopeDescriptions: getScopeDescriptions(key.scopes),
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      isExpired: key.expiresAt ? new Date() > key.expiresAt : false,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return NextResponse.json({
      apiKeys: formattedKeys,
      availableScopes: getScopeDescriptions(ALL_SCOPES),
      metadata: {
        total: formattedKeys.length,
        active: formattedKeys.filter(key => key.isActive && !key.isExpired).length,
        expired: formattedKeys.filter(key => key.isExpired).length,
      }
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/settings/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only session-based auth can manage API keys
    if (authResult.type !== 'session') {
      return NextResponse.json(
        { error: 'Session authentication required for API key management' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    // Validate and sanitize scopes
    const requestedScopes = validatedData.scopes || DEFAULT_SCOPES;
    const validScopes = validateScopes(requestedScopes);

    if (validScopes.length === 0) {
      return NextResponse.json(
        { error: 'At least one valid scope is required' },
        { status: 400 }
      );
    }

    // Generate new API key
    const { fullKey, hash, prefix } = generateApiKey();

    // Parse expiration date if provided
    const expiresAt = validatedData.expiresAt
      ? new Date(validatedData.expiresAt)
      : null;

    // Create API key in database
    const dbApiKey = await createApiKey({
      userId: authResult.user.id,
      name: validatedData.name,
      keyHash: hash,
      keyPrefix: prefix,
      scopes: validScopes,
      expiresAt,
    });

    return NextResponse.json({
      apiKey: {
        id: dbApiKey.id,
        name: dbApiKey.name,
        key: fullKey, // Only returned on creation!
        keyPrefix: dbApiKey.keyPrefix,
        scopes: dbApiKey.scopes,
        scopeDescriptions: getScopeDescriptions(dbApiKey.scopes),
        expiresAt: dbApiKey.expiresAt,
        isActive: dbApiKey.isActive,
        createdAt: dbApiKey.createdAt,
      },
      warning: 'Save this API key now. You will not be able to see it again.',
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/settings/api-keys - Update API key (bulk update not supported)
export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { error: 'Use PATCH /api/settings/api-keys/{id} to update specific API keys' },
    { status: 405 }
  );
}

// DELETE /api/settings/api-keys - Delete all API keys (not supported for safety)
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Bulk deletion not supported. Use DELETE /api/settings/api-keys/{id}' },
    { status: 405 }
  );
}