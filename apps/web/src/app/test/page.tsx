/**
 * Test Page - Development Only
 *
 * This page is for testing features without authentication during development.
 * Access is blocked in production via middleware.
 */

export default function TestPage() {
    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">
                        Development Test Page
                    </h1>
                    <p className="text-muted-foreground">
                        This page is available only in development environment
                        for testing purposes.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="p-6 border rounded-lg bg-card">
                        <h2 className="text-2xl font-semibold mb-4">
                            Environment Info
                        </h2>
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="font-medium">
                                    Node Environment:
                                </span>{" "}
                                <code className="px-2 py-1 bg-muted rounded">
                                    {process.env.NODE_ENV}
                                </code>
                            </p>
                            <p className="text-muted-foreground">
                                This page is blocked in production by
                                middleware.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-card">
                        <h2 className="text-2xl font-semibold mb-4">
                            Test Routes
                        </h2>
                        <div className="space-y-2">
                            <a
                                href="/test/cache-performance"
                                className="block p-3 hover:bg-muted rounded transition-colors"
                            >
                                <div className="font-medium">
                                    Cache Performance Test
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Test caching strategy and performance
                                </div>
                            </a>
                        </div>
                    </div>

                    <div className="p-6 border rounded-lg bg-card">
                        <h2 className="text-2xl font-semibold mb-4">
                            Quick Links
                        </h2>
                        <div className="space-y-2">
                            <a
                                href="/"
                                className="block p-3 hover:bg-muted rounded transition-colors"
                            >
                                <div className="font-medium">Home</div>
                            </a>
                            <a
                                href="/studio"
                                className="block p-3 hover:bg-muted rounded transition-colors"
                            >
                                <div className="font-medium">Studio</div>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
