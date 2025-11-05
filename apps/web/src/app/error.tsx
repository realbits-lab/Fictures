'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[rgb(var(--color-background))]">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="relative mb-8 inline-block">
          <div className="relative">
            <div
              className="w-32 h-32 md:w-40 md:h-40 bg-[rgb(var(--color-destructive))] opacity-20 flex items-center justify-center"
              style={{ borderRadius: 'var(--radius-card)' }}
            >
              {/* Error Icon */}
              <svg
                className="w-16 h-16 md:w-20 md:h-20 text-[rgb(var(--color-destructive))]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-[rgb(var(--color-primary))] opacity-50"
              style={{ borderRadius: 'var(--radius-badge)' }}
            />
            <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-[rgb(var(--color-primary))] opacity-30"
              style={{ borderRadius: 'var(--radius-badge)' }}
            />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))]">
            Oops! Something Went Wrong
          </h2>
          <p className="text-lg text-[rgb(var(--color-muted-foreground))] max-w-md mx-auto">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
            Try refreshing the page or return home.
          </p>

          {/* Error Details (Development Mode) */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <details
              className="mt-6 p-4 bg-[rgb(var(--color-muted))] text-left overflow-auto max-w-lg mx-auto"
              style={{
                borderRadius: 'var(--radius-card)',
                borderWidth: 'var(--color-border-width)',
                borderStyle: 'var(--color-border-style)',
                borderColor: 'rgb(var(--color-border))',
              }}
            >
              <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--color-foreground))] mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-[rgb(var(--color-muted-foreground))] whitespace-pre-wrap break-words">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-[rgb(var(--color-muted-foreground))] mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={reset}
            className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary-foreground))] bg-[rgb(var(--color-primary))] overflow-hidden transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            style={{ borderRadius: 'var(--radius-button)' }}
          >
            <span className="relative flex items-center gap-2">
              <svg
                className="w-5 h-5 transition-transform group-hover:rotate-180"
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

          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-accent))] transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            style={{
              borderRadius: 'var(--radius-button)',
              borderWidth: 'var(--color-border-width)',
              borderStyle: 'var(--color-border-style)',
              borderColor: 'rgb(var(--color-border))',
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Back to Home
            </span>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
          <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-4">
            If this problem persists, you might want to:
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            <button
              onClick={() => window.location.reload()}
              className="text-[rgb(var(--color-primary))] hover:underline"
            >
              Refresh the page
            </button>
            <span className="text-[rgb(var(--color-muted-foreground))]">•</span>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
              className="text-[rgb(var(--color-primary))] hover:underline"
            >
              Clear cache and restart
            </button>
            <span className="text-[rgb(var(--color-muted-foreground))]">•</span>
            <Link
              href="/settings"
              className="text-[rgb(var(--color-primary))] hover:underline"
            >
              Check your settings
            </Link>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-[rgb(var(--color-primary))] opacity-5 rounded-full blur-3xl"
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[rgb(var(--color-destructive))] opacity-5 rounded-full blur-3xl"
          />
        </div>
      </div>
    </div>
  );
}
