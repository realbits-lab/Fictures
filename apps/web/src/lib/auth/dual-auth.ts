/**
 * Dual Authentication System
 *
 * Supports both API key and session-based authentication.
 * Used by API endpoints to authenticate requests from:
 * - External services (API keys with scopes)
 * - Web application (NextAuth sessions)
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { apiKeys, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export type AuthResult = {
  type: 'session' | 'api_key';
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  scopes?: string[];
};

/**
 * Authenticate a request using either API key or session
 *
 * Priority:
 * 1. Authorization header (Bearer token / API key)
 * 2. x-api-key header
 * 3. NextAuth session
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult | null> {
  // Try API key authentication first
  const authHeader = request.headers.get('authorization');
  const apiKeyHeader = request.headers.get('x-api-key');

  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    const result = await authenticateApiKey(apiKey);
    if (result) return result;
  }

  if (apiKeyHeader) {
    const result = await authenticateApiKey(apiKeyHeader);
    if (result) return result;
  }

  // Fall back to session authentication
  const session = await auth();
  if (session?.user) {
    // Get full user data including role
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email!))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const dbUser = userResult[0];

    return {
      type: 'session',
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
      scopes: getRoleScopes(dbUser.role),
    };
  }

  return null;
}

/**
 * Authenticate using API key
 */
async function authenticateApiKey(apiKey: string): Promise<AuthResult | null> {
  if (!apiKey || apiKey.length < 16) {
    return null;
  }

  // Extract prefix from API key (first 16 characters before the hash part)
  const keyPrefix = apiKey.substring(0, 16);

  // Find API key by prefix
  const apiKeyResults = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyPrefix, keyPrefix),
        eq(apiKeys.isActive, true)
      )
    )
    .limit(10); // Get all keys with this prefix (should be very few)

  if (apiKeyResults.length === 0) {
    return null;
  }

  // Verify the full API key hash
  let matchedKey = null;
  for (const key of apiKeyResults) {
    const isMatch = await bcrypt.compare(apiKey, key.keyHash);
    if (isMatch) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    return null;
  }

  // Check if key is expired
  if (matchedKey.expiresAt && new Date(matchedKey.expiresAt) < new Date()) {
    return null;
  }

  // Get user data
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, matchedKey.userId))
    .limit(1);

  if (userResult.length === 0) {
    return null;
  }

  const user = userResult[0];

  // Update last used timestamp (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(apiKeys.id, matchedKey.id))
    .execute()
    .catch((err) => console.error('Failed to update API key last used:', err));

  return {
    type: 'api_key',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    scopes: matchedKey.scopes as string[],
  };
}

/**
 * Get scopes based on user role
 */
function getRoleScopes(role: string): string[] {
  switch (role) {
    case 'reader':
      return ['stories:read'];
    case 'writer':
      return ['stories:read', 'stories:write'];
    case 'manager':
      return ['stories:read', 'stories:write', 'admin:all'];
    default:
      return ['stories:read'];
  }
}

/**
 * Check if auth result has required scope
 */
export function hasRequiredScope(authResult: AuthResult, requiredScope: string): boolean {
  if (!authResult.scopes) {
    return false;
  }

  // Check for exact scope match
  if (authResult.scopes.includes(requiredScope)) {
    return true;
  }

  // Check for wildcard scope (admin:all grants everything)
  if (authResult.scopes.includes('admin:all')) {
    return true;
  }

  // Check for parent scope (e.g., 'stories:write' implies 'stories:read')
  if (requiredScope === 'stories:read' && authResult.scopes.includes('stories:write')) {
    return true;
  }

  return false;
}

/**
 * Require authentication middleware
 * Throws error if not authenticated
 */
export async function requireAuth(request: NextRequest, requiredScope?: string): Promise<AuthResult> {
  const authResult = await authenticateRequest(request);

  if (!authResult) {
    throw new Error('Authentication required');
  }

  if (requiredScope && !hasRequiredScope(authResult, requiredScope)) {
    throw new Error(`Insufficient permissions. Required scope: ${requiredScope}`);
  }

  return authResult;
}
