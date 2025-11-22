/**
 * Better Auth API Route Handler
 *
 * Handles all Better Auth requests including:
 * - Google OAuth
 * - Email/Password (Credentials)
 * - Anonymous authentication
 * - Session management
 */

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth-better";

export const { POST, GET } = toNextJsHandler(auth);
