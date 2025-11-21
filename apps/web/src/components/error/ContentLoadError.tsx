"use client";

interface ContentLoadErrorProps {
    title?: string;
    message?: string;
    icon?: "character" | "scene" | "chapter" | "story" | "setting";
    onRetry?: () => void;
    onGoBack?: () => void;
    compact?: boolean;
}

const iconMap = {
    character: (
        <svg
            className="w-16 h-16 md:w-20 md:h-20"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    ),
    scene: (
        <svg
            className="w-16 h-16 md:w-20 md:h-20"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 10h5v7H5zm6-5h8v3h-8zm0 4h8v3h-8zm0 4h4v3h-4z" />
        </svg>
    ),
    chapter: (
        <svg
            className="w-16 h-16 md:w-20 md:h-20"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
        </svg>
    ),
    story: (
        <svg
            className="w-16 h-16 md:w-20 md:h-20"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
        </svg>
    ),
    setting: (
        <svg
            className="w-16 h-16 md:w-20 md:h-20"
            fill="currentColor"
            viewBox="0 0 24 24"
        >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
    ),
};

export function ContentLoadError({
    title = "Error Loading Content",
    message = "We encountered a problem loading this content. Please try again.",
    icon = "character",
    onRetry,
    onGoBack,
    compact = false,
}: ContentLoadErrorProps) {
    if (compact) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-[rgb(var(--color-background))]">
                <div className="text-[rgb(var(--color-primary))] opacity-40 mb-4">
                    {iconMap[icon]}
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--color-foreground))] mb-2">
                    {title}
                </h3>
                <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-6 max-w-md">
                    {message}
                </p>
                <div className="flex gap-3">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-[rgb(var(--color-primary-foreground))] bg-[rgb(var(--color-primary))] hover:opacity-90 transition-all duration-200"
                            style={{ borderRadius: "var(--radius-button)" }}
                        >
                            Try Again
                        </button>
                    )}
                    {onGoBack && (
                        <button
                            onClick={onGoBack}
                            className="inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-accent))] transition-all duration-200"
                            style={{
                                borderRadius: "var(--radius-button)",
                                borderWidth: "var(--color-border-width)",
                                borderStyle: "var(--color-border-style)",
                                borderColor: "rgb(var(--color-border))",
                            }}
                        >
                            Go Back
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[50vh] flex items-center justify-center px-4 py-8 bg-[rgb(var(--color-background))]">
            <div className="max-w-lg w-full text-center">
                {/* Error Illustration */}
                <div className="relative mb-6">
                    {/* Icon Container with Glow Effect */}
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-[rgb(var(--color-primary))] opacity-10 blur-xl rounded-full" />
                        <div className="relative text-[rgb(var(--color-primary))] opacity-60">
                            {iconMap[icon]}
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {/* Alert Icon */}
                        <div className="absolute -top-2 -right-2">
                            <svg
                                className="w-8 h-8 text-[rgb(var(--color-destructive))] opacity-80"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-3 mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-[rgb(var(--color-foreground))]">
                        {title}
                    </h2>
                    <p className="text-base text-[rgb(var(--color-muted-foreground))] max-w-md mx-auto">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary-foreground))] bg-[rgb(var(--color-primary))] overflow-hidden transition-all duration-300 ease-out hover:scale-105 active:scale-95 w-full sm:w-auto"
                            style={{ borderRadius: "var(--radius-button)" }}
                        >
                            <span className="relative flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                                Try Again
                            </span>
                            {/* Shine effect on hover */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </button>
                    )}

                    {onGoBack && (
                        <button
                            onClick={onGoBack}
                            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-accent))] transition-all duration-300 ease-out hover:scale-105 active:scale-95 w-full sm:w-auto"
                            style={{
                                borderRadius: "var(--radius-button)",
                                borderWidth: "var(--color-border-width)",
                                borderStyle: "var(--color-border-style)",
                                borderColor: "rgb(var(--color-border))",
                            }}
                        >
                            <span className="flex items-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Go Back
                            </span>
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <div
                    className="mt-8 pt-6 border-t"
                    style={{ borderColor: "rgb(var(--color-border))" }}
                >
                    <p className="text-sm text-[rgb(var(--color-muted-foreground))]">
                        If this problem persists, try refreshing the page or
                        contact support.
                    </p>
                </div>
            </div>
        </div>
    );
}
