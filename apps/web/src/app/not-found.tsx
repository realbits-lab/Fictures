"use client";

import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-[rgb(var(--color-background))]">
            <div className="max-w-2xl w-full text-center">
                {/* 404 Illustration */}
                <div className="relative mb-8">
                    {/* Main 404 Text */}
                    <div className="relative inline-block">
                        <h1 className="text-9xl md:text-[12rem] font-bold text-[rgb(var(--color-primary))] opacity-20 select-none">
                            404
                        </h1>

                        {/* Static Decorative Elements */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full h-full max-w-md">
                                {/* Book Icon */}
                                <div className="absolute top-1/4 left-1/4">
                                    <svg
                                        className="w-12 h-12 md:w-16 md:h-16 text-[rgb(var(--color-primary))] opacity-60"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
                                    </svg>
                                </div>

                                {/* Pen Icon */}
                                <div className="absolute top-1/3 right-1/4">
                                    <svg
                                        className="w-10 h-10 md:w-14 md:h-14 text-[rgb(var(--color-primary))] opacity-60"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                                    </svg>
                                </div>

                                {/* Star Icon */}
                                <div className="absolute bottom-1/4 left-1/3">
                                    <svg
                                        className="w-8 h-8 md:w-12 md:h-12 text-[rgb(var(--color-primary))] opacity-60"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--color-foreground))]">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-[rgb(var(--color-muted-foreground))] max-w-md mx-auto">
                        The story you&apos;re looking for seems to have wandered
                        off into the unknown. Let&apos;s get you back to
                        familiar territory.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="group relative inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary-foreground))] bg-[rgb(var(--color-primary))] overflow-hidden transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                        style={{ borderRadius: "var(--radius-button)" }}
                    >
                        <span className="relative flex items-center gap-2">
                            <svg
                                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
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
                        {/* Shine effect on hover */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </Link>

                    <Link
                        href="/studio"
                        className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-[rgb(var(--color-primary))] bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-accent))] transition-all duration-300 ease-out hover:scale-105 active:scale-95"
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
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                            Go to Studio
                        </span>
                    </Link>
                </div>

                {/* Additional Help Links */}
                <div
                    className="mt-12 pt-8 border-t"
                    style={{ borderColor: "rgb(var(--color-border))" }}
                >
                    <p className="text-sm text-[rgb(var(--color-muted-foreground))] mb-4">
                        Need help? Try these popular pages:
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link
                            href="/novels"
                            className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                        >
                            Browse Novels
                        </Link>
                        <span className="text-[rgb(var(--color-muted-foreground))]">
                            •
                        </span>
                        <Link
                            href="/comics"
                            className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                        >
                            Browse Comics
                        </Link>
                        <span className="text-[rgb(var(--color-muted-foreground))]">
                            •
                        </span>
                        <Link
                            href="/community"
                            className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                        >
                            Community
                        </Link>
                        <span className="text-[rgb(var(--color-muted-foreground))]">
                            •
                        </span>
                        <Link
                            href="/settings"
                            className="text-sm text-[rgb(var(--color-primary))] hover:underline"
                        >
                            Settings
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
