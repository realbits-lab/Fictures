/**
 * Session Management for Anonymous Users
 *
 * Generates and manages session IDs for non-logged-in users to track views
 * Session IDs are stored in HTTP-only cookies for security
 */

import { nanoid } from "nanoid";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "fictures_session_id";
const SESSION_EXPIRY_DAYS = 30;

/**
 * Get or create a session ID for the current user
 *
 * For logged-in users: Returns null (use user ID instead)
 * For anonymous users: Returns existing or new session ID from cookie
 *
 * @param userId - Optional user ID (if user is logged in)
 * @returns Session ID for anonymous users, null for logged-in users
 */
export async function getOrCreateSessionId(
    userId?: string | null,
): Promise<string | null> {
    // If user is logged in, don't use session ID
    if (userId) {
        return null;
    }

    // Check for existing session cookie
    const cookieStore = await cookies();
    const existingSession = cookieStore.get(SESSION_COOKIE_NAME);

    if (existingSession?.value) {
        return existingSession.value;
    }

    // Create new session ID
    const sessionId = `sess_${nanoid(32)}`;

    // Set cookie with expiry
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
        path: "/",
    });

    return sessionId;
}

/**
 * Get the current session ID without creating a new one
 *
 * @param userId - Optional user ID (if user is logged in)
 * @returns Existing session ID, or null if none exists or user is logged in
 */
export async function getSessionId(
    userId?: string | null,
): Promise<string | null> {
    // If user is logged in, don't use session ID
    if (userId) {
        return null;
    }

    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);

    return session?.value || null;
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get session information for analytics
 *
 * @param userId - Optional user ID (if user is logged in)
 * @returns Object with user ID or session ID
 */
export async function getSessionInfo(userId?: string | null): Promise<{
    userId: string | null;
    sessionId: string | null;
    isAuthenticated: boolean;
}> {
    const sessionId = await getOrCreateSessionId(userId);

    return {
        userId: userId || null,
        sessionId,
        isAuthenticated: !!userId,
    };
}
