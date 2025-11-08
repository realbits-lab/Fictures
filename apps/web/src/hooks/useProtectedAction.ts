"use client";

import { useSession } from "next-auth/react";
import { useAuthModal } from "@/contexts/AuthModalContext";

/**
 * Hook for handling protected actions that require authentication
 *
 * Usage examples:
 *
 * // Simple protected action
 * const handleLike = useProtectedAction(() => {
 *   // This will only execute if user is authenticated
 *   likeBlogPost(postId);
 * });
 *
 * // Protected action with redirect after login
 * const handleCreatePost = useProtectedAction(() => {
 *   createNewPost();
 * }, '/write/new-post');
 *
 * // Check if action would require authentication
 * const { executeAction, requiresAuth } = useProtectedAction(() => {
 *   addComment(commentText);
 * });
 *
 * return (
 *   <button
 *     onClick={executeAction}
 *     className={requiresAuth ? 'opacity-75' : ''}
 *   >
 *     {requiresAuth ? 'Sign in to comment' : 'Add comment'}
 *   </button>
 * );
 */
export function useProtectedAction(action: () => void, redirectTo?: string) {
	const { data: session } = useSession();
	const { requireAuth } = useAuthModal();

	const executeAction = () => {
		requireAuth(action, redirectTo);
	};

	return {
		executeAction,
		requiresAuth: !session,
		isAuthenticated: !!session,
	};
}

/**
 * Hook for role-based protected actions
 *
 * Usage:
 * const handlePublish = useRoleProtectedAction(() => {
 *   publishStory(storyId);
 * }, ['writer', 'manager'], '/stories');
 */
export function useRoleProtectedAction(
	action: () => void,
	requiredRoles: string[],
	redirectTo?: string,
) {
	const { data: session } = useSession();
	const { requireAuth } = useAuthModal();

	const hasRequiredRole =
		session?.user?.role && requiredRoles.includes(session.user.role);

	const executeAction = () => {
		if (!session) {
			// Not authenticated - show login modal
			requireAuth(action, redirectTo);
		} else if (!hasRequiredRole) {
			// Authenticated but doesn't have required role
			alert(
				`This action requires one of the following roles: ${requiredRoles.join(", ")}`,
			);
		} else {
			// Authenticated and has required role
			action();
		}
	};

	return {
		executeAction,
		requiresAuth: !session,
		requiresRole: session && !hasRequiredRole,
		isAuthorized: !!hasRequiredRole,
		userRole: session?.user?.role,
	};
}
