/**
 * Common Loading Indicators
 *
 * Shared loading indicators used across /studio, /novels, /comics, and /community pages
 * to eliminate code duplication and ensure consistent UX.
 */

interface BackgroundValidationIndicatorProps {
	/** Loading text to display - defaults to "Refreshing..." */
	text?: string;
}

/**
 * Background Validation Indicator
 *
 * Shows a fixed indicator in the top-right corner when data is revalidating
 * in the background. Used across studio, novels, comics, and community pages.
 *
 * @example
 * {isValidating && !isLoading && (
 *   <BackgroundValidationIndicator text="Refreshing stories..." />
 * )}
 */
export function BackgroundValidationIndicator({
	text = "Refreshing...",
}: BackgroundValidationIndicatorProps) {
	return (
		<div className="fixed top-20 right-4 z-50 bg-[rgb(var(--color-background))] rounded-lg shadow-lg border border-[rgb(var(--color-border))] px-3 py-2">
			<div className="flex items-center gap-2 text-sm text-[rgb(var(--color-muted-foreground))]">
				<div className="w-4 h-4 border-2 border-[rgb(var(--color-primary)/30%)] border-t-[rgb(var(--color-primary))] rounded-full animate-spin" />
				<span>{text}</span>
			</div>
		</div>
	);
}
