/**
 * Authentication Middleware for Next.js API Routes
 *
 * This module provides middleware functions to automatically resolve authentication
 * and inject it into the context, eliminating the need to pass API keys as parameters.
 *
 * @module auth/middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateRequest } from './dual-auth';
import { withAuth, getAuth, getAuthSafe } from './server-context';
import {
    type AuthContext,
    createApiKeyContext,
    createSessionContext,
    createAnonymousContext,
    generateRequestId,
    hasScopes,
    InsufficientScopesError,
    InvalidApiKeyError
} from './context';

/**
 * Middleware configuration options
 */
interface AuthMiddlewareOptions {
    /** Required scopes for this endpoint */
    requiredScopes?: string[];

    /** Allow anonymous access (default: false) */
    allowAnonymous?: boolean;

    /** Enable debug logging (default: false in production) */
    debug?: boolean;

    /** Custom error handler */
    onError?: (error: Error) => NextResponse;
}

/**
 * Extract client metadata from request
 */
function extractMetadata(request: NextRequest): Partial<AuthContext['metadata']> {
    const requestHeaders = headers();

    return {
        ip: requestHeaders.get('x-forwarded-for') ?? requestHeaders.get('x-real-ip') ?? undefined,
        userAgent: requestHeaders.get('user-agent') ?? undefined,
    };
}

/**
 * Resolve authentication from the request using dual-auth strategy
 * Tries API key first, then falls back to session authentication
 *
 * @param request - The Next.js request
 * @returns The resolved authentication context
 */
async function resolveAuthentication(request: NextRequest): Promise<AuthContext | null> {
    const debug = process.env.NODE_ENV === 'development';

    // Try to authenticate the request using dual-auth
    const authResult = await authenticateRequest(request);

    if (debug && authResult) {
        console.log(`[AUTH_MIDDLEWARE] Authenticated via ${authResult.type}:`, {
            userId: authResult.user.id,
            email: authResult.user.email,
            type: authResult.type
        });
    }

    if (!authResult) {
        return null;
    }

    const metadata = extractMetadata(request);

    // Create appropriate context based on auth type
    if (authResult.type === 'apiKey' && authResult.apiKey) {
        return createApiKeyContext(
            authResult.apiKey,
            authResult.user.id,
            authResult.user.email ?? '',
            authResult.user.scopes || [],
            metadata
        );
    }

    // Session-based authentication
    return createSessionContext(
        authResult.user.id,
        authResult.user.email ?? '',
        authResult.user.scopes || [],
        metadata
    );
}

/**
 * Higher-order function to wrap API route handlers with authentication
 * This is the main middleware that eliminates API key parameter passing
 *
 * @param handler - The API route handler
 * @param options - Middleware configuration options
 * @returns Wrapped handler with authentication context
 *
 * @example
 * ```typescript
 * // Basic usage - requires authentication
 * export const POST = withAuthentication(async (req) => {
 *   // Auth context is automatically available
 *   const auth = getAuth();
 *   console.log('User:', auth.userId);
 *   return Response.json({ success: true });
 * });
 *
 * // With required scopes
 * export const POST = withAuthentication(
 *   async (req) => {
 *     // Only users with 'stories:write' can access
 *     return Response.json({ success: true });
 *   },
 *   { requiredScopes: ['stories:write'] }
 * );
 * ```
 */
export function withAuthentication(
    handler: (request: NextRequest) => Promise<NextResponse | Response>,
    options: AuthMiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse | Response> {
    return async (request: NextRequest) => {
        const { requiredScopes = [], allowAnonymous = false, debug = false, onError } = options;

        try {
            // Resolve authentication from request
            let authContext = await resolveAuthentication(request);

            // If no auth and anonymous not allowed, return 401
            if (!authContext && !allowAnonymous) {
                return NextResponse.json(
                    { error: 'Authentication required' },
                    { status: 401 }
                );
            }

            // Create anonymous context if needed
            if (!authContext && allowAnonymous) {
                authContext = createAnonymousContext(extractMetadata(request));
            }

            // Check required scopes
            if (authContext && requiredScopes.length > 0) {
                if (!hasScopes(authContext, requiredScopes)) {
                    throw new InsufficientScopesError(requiredScopes, authContext.scopes);
                }
            }

            // Run the handler with authentication context
            return await withAuth(authContext!, () => handler(request));

        } catch (error) {
            if (debug) {
                console.error('[AUTH_MIDDLEWARE] Error:', error);
            }

            // Use custom error handler if provided
            if (onError) {
                return onError(error as Error);
            }

            // Default error handling
            if (error instanceof InsufficientScopesError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 403 }
                );
            }

            if (error instanceof InvalidApiKeyError) {
                return NextResponse.json(
                    { error: 'Invalid API key' },
                    { status: 401 }
                );
            }

            // Generic error
            return NextResponse.json(
                { error: 'Authentication error' },
                { status: 500 }
            );
        }
    };
}

/**
 * Decorator for requiring specific scopes on a route handler
 * This provides a cleaner API for scope checking
 *
 * @param scopes - Required permission scopes
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * export const POST = requireScopes('stories:write', 'images:write')(
 *   withAuthentication(async (req) => {
 *     // Only accessible with both scopes
 *     return Response.json({ success: true });
 *   })
 * );
 * ```
 */
export function requireScopes(...scopes: string[]) {
    return function (
        handler: (request: NextRequest) => Promise<NextResponse | Response>
    ): (request: NextRequest) => Promise<NextResponse | Response> {
        return withAuthentication(handler, { requiredScopes: scopes });
    };
}

/**
 * Middleware for optional authentication
 * Allows both authenticated and anonymous access
 *
 * @param handler - The API route handler
 * @returns Wrapped handler
 *
 * @example
 * ```typescript
 * export const GET = optionalAuth(async (req) => {
 *   const auth = getAuthSafe(); // May be null
 *   if (auth) {
 *     // User is authenticated
 *   } else {
 *     // Anonymous user
 *   }
 *   return Response.json({ success: true });
 * });
 * ```
 */
export function optionalAuth(
    handler: (request: NextRequest) => Promise<NextResponse | Response>
): (request: NextRequest) => Promise<NextResponse | Response> {
    return withAuthentication(handler, { allowAnonymous: true });
}

/**
 * Middleware for admin-only endpoints
 *
 * @param handler - The API route handler
 * @returns Wrapped handler
 *
 * @example
 * ```typescript
 * export const DELETE = adminOnly(async (req) => {
 *   // Only accessible by admins
 *   return Response.json({ success: true });
 * });
 * ```
 */
export function adminOnly(
    handler: (request: NextRequest) => Promise<NextResponse | Response>
): (request: NextRequest) => Promise<NextResponse | Response> {
    return withAuthentication(handler, { requiredScopes: ['admin:all'] });
}

/**
 * Get current authentication from Next.js server component
 * For use in React Server Components
 *
 * @returns The authentication context or null
 *
 * @example
 * ```typescript
 * // In a server component
 * export default async function Page() {
 *   const auth = await getServerAuth();
 *   if (!auth) {
 *     return <div>Please log in</div>;
 *   }
 *   return <div>Welcome {auth.email}</div>;
 * }
 * ```
 */
export async function getServerAuth(): Promise<AuthContext | null> {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return null;
    }

    return createSessionContext(
        session.user.id,
        session.user.email ?? '',
        [], // TODO: Load scopes from user role
        {
            requestId: generateRequestId(),
            timestamp: Date.now()
        }
    );
}

/**
 * Express-style middleware chain for complex authentication logic
 *
 * @param middlewares - Array of middleware functions
 * @returns Combined middleware
 *
 * @example
 * ```typescript
 * export const POST = chain(
 *   withAuthentication,
 *   requireScopes('stories:write'),
 *   rateLimiter,
 *   async (req) => {
 *     // All middleware applied
 *     return Response.json({ success: true });
 *   }
 * );
 * ```
 */
export function chain(
    ...middlewares: Array<(req: NextRequest) => Promise<NextResponse | Response>>
): (req: NextRequest) => Promise<NextResponse | Response> {
    return async (req: NextRequest) => {
        for (const middleware of middlewares) {
            const response = await middleware(req);
            // If middleware returns a response, stop the chain
            if (response.status !== 200) {
                return response;
            }
        }
        return middlewares[middlewares.length - 1](req);
    };
}