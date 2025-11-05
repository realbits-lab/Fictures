/**
 * Common Error State Components
 *
 * Shared error states used across /studio, /novels, /comics, and /community pages
 * to eliminate code duplication and ensure consistent error handling UX.
 */

interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Retry button text */
  retryText?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Whether retry action is in progress */
  isRetrying?: boolean;
}

/**
 * Story Loading Error State
 *
 * Shows a centered error message with retry button.
 * Used across studio, novels, comics, and community pages.
 *
 * @example
 * {error && (
 *   <StoryLoadingError
 *     title="Failed to load stories"
 *     message={error.message}
 *     onRetry={() => mutate()}
 *     isRetrying={isValidating}
 *   />
 * )}
 */
export function StoryLoadingError({
  title = "Failed to load stories",
  message = "Something went wrong while loading stories.",
  retryText = "Try Again",
  onRetry,
  isRetrying = false
}: ErrorStateProps) {
  return (
    <div className="text-center py-12">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-[rgb(var(--color-foreground))] mb-2">
        {title}
      </h3>
      <p className="text-[rgb(var(--color-muted-foreground))] mb-4">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="px-4 py-2 bg-[rgb(var(--color-primary))] text-[rgb(var(--color-primary-foreground))] rounded-lg hover:bg-[rgb(var(--color-primary)/80%)] transition-colors disabled:opacity-50"
        >
          {isRetrying ? 'Retrying...' : retryText}
        </button>
      )}
    </div>
  );
}
