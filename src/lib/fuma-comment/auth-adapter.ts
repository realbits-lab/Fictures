import type { AuthAdapter } from '@fuma-comment/server';
import { auth } from '@/lib/auth';

/**
 * Custom auth adapter for Fuma Comment with NextAuth v5
 *
 * This adapter bridges Fuma Comment's authentication expectations
 * with NextAuth.js v5's session management.
 */
export function createNextAuthV5Adapter(): AuthAdapter {
  return {
    async getSession(request: Request) {
      try {
        const session = await auth();

        if (!session?.user) {
          return null;
        }

        return {
          user: {
            id: session.user.id || session.user.email || '',
            name: session.user.name || null,
            email: session.user.email || null,
            image: session.user.image || null,
          },
        };
      } catch (error) {
        console.error('[FUMA-COMMENT-AUTH] Error getting session:', error);
        return null;
      }
    },
  };
}
