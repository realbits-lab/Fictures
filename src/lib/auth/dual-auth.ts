import { NextRequest } from 'next/server';
import { auth } from './index';
import { hashApiKey, isValidApiKeyFormat, isApiKeyExpired, hasScope } from './api-keys';
import { getApiKeyWithUser, updateApiKeyLastUsed } from '../db/queries';
import type { ApiScope } from './api-keys';

export type AuthResult = {
  type: 'session' | 'api_key';
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
  apiKey?: {
    id: string;
    scopes: string[];
    name: string;
  };
} | null;

/**
 * Authenticate request using either API key or session
 * Priority: API Key > Session
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Priority 1: Check for API key authentication
  const apiKeyResult = await authenticateWithApiKey(request);
  if (apiKeyResult) {
    return apiKeyResult;
  }

  // Priority 2: Check for session authentication
  const sessionResult = await authenticateWithSession();
  if (sessionResult) {
    return sessionResult;
  }

  return null;
}

/**
 * Authenticate using API key
 */
async function authenticateWithApiKey(request: NextRequest): Promise<AuthResult | null> {
  // Check for API key in headers (multiple possible headers)
  const apiKey =
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null;

  console.log('[Dual Auth] API Key extracted:', apiKey ? `${apiKey.substring(0, 15)}...` : 'none');

  if (!apiKey) {
    console.log('[Dual Auth] No API key found in headers');
    return null;
  }

  // Validate API key format
  if (!isValidApiKeyFormat(apiKey)) {
    console.log('[Dual Auth] API key format invalid');
    return null;
  }

  console.log('[Dual Auth] API key format valid, looking up in database...');

  try {
    // Hash the provided key and look it up in database
    const keyHash = hashApiKey(apiKey);
    console.log('[Dual Auth] API key hash:', keyHash);

    const result = await getApiKeyWithUser(keyHash);

    if (!result) {
      console.log('[Dual Auth] No matching API key found in database');
      return null;
    }

    console.log('[Dual Auth] API key found in database, user:', result.user.email);

    const { apiKey: dbApiKey, user } = result;

    // Check if API key is expired
    if (isApiKeyExpired(dbApiKey.expiresAt)) {
      return null;
    }

    // Update last used timestamp (don't await to avoid blocking)
    updateApiKeyLastUsed(dbApiKey.id).catch(err =>
      console.error('Failed to update API key last used:', err)
    );

    return {
      type: 'api_key',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      apiKey: {
        id: dbApiKey.id,
        scopes: dbApiKey.scopes,
        name: dbApiKey.name,
      }
    };
  } catch (error) {
    console.error('API key authentication error:', error);
    return null;
  }
}

/**
 * Authenticate using NextAuth session
 */
async function authenticateWithSession(): Promise<AuthResult | null> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    return {
      type: 'session',
      user: {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.name || null,
        role: session.user.role || 'reader',
      }
    };
  } catch (error) {
    console.error('Session authentication error:', error);
    return null;
  }
}

/**
 * Check if authenticated user has required scope
 * Sessions have all scopes by default, API keys are checked against their scopes
 */
export function hasRequiredScope(authResult: AuthResult, requiredScope: ApiScope): boolean {
  if (!authResult) {
    return false;
  }

  // Session-based authentication has all scopes
  if (authResult.type === 'session') {
    return true;
  }

  // API key authentication - check scopes
  if (authResult.type === 'api_key' && authResult.apiKey) {
    return hasScope(authResult.apiKey.scopes, requiredScope);
  }

  return false;
}

/**
 * Check if authenticated user has any of the required scopes
 */
export function hasAnyRequiredScope(authResult: AuthResult, requiredScopes: ApiScope[]): boolean {
  if (!authResult) {
    return false;
  }

  // Session-based authentication has all scopes
  if (authResult.type === 'session') {
    return true;
  }

  // API key authentication - check scopes
  if (authResult.type === 'api_key' && authResult.apiKey) {
    return requiredScopes.some(scope => hasScope(authResult.apiKey!.scopes, scope));
  }

  return false;
}

/**
 * Middleware helper for protecting API routes
 */
export function requireAuth(requiredScopes: ApiScope[] = []) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);

    if (!authResult) {
      return { error: 'Authentication required', status: 401 };
    }

    // Check scopes if required
    if (requiredScopes.length > 0) {
      const hasPermission = hasAnyRequiredScope(authResult, requiredScopes);
      if (!hasPermission) {
        return {
          error: 'Insufficient permissions',
          status: 403,
          requiredScopes
        };
      }
    }

    return { authResult };
  };
}

/**
 * Utility to extract API key from request headers
 */
export function extractApiKey(request: NextRequest): string | null {
  return (
    request.headers.get('x-api-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null
  );
}

/**
 * Check if request is using API key authentication
 */
export function isApiKeyRequest(request: NextRequest): boolean {
  const apiKey = extractApiKey(request);
  return apiKey !== null && isValidApiKeyFormat(apiKey);
}

/**
 * Format auth result for API responses
 */
export function formatAuthForResponse(authResult: AuthResult) {
  if (!authResult) {
    return null;
  }

  return {
    type: authResult.type,
    user: authResult.user,
    ...(authResult.apiKey && {
      apiKey: {
        id: authResult.apiKey.id,
        name: authResult.apiKey.name,
        // Don't expose scopes in response for security
      }
    })
  };
}