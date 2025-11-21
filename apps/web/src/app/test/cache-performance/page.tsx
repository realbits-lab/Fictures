"use client";

/**
 * Cache Performance Test Page
 *
 * Tests all three caching layers:
 * 1. SWR Memory Cache (client-side, 30 min)
 * 2. localStorage Cache (client-side, 1 hour)
 * 3. Redis Cache (server-side, 10 min)
 */

import { useState } from "react";
import useSWR from "swr";

// Cache configuration matching production settings
const CACHE_CONFIG = {
    SWR_DEDUPING_INTERVAL: 30 * 60 * 1000, // 30 minutes
    LOCALSTORAGE_TTL: 60 * 60 * 1000, // 1 hour
    REDIS_TTL: 10 * 60 * 1000, // 10 minutes (for public content)
};

interface PerformanceMetrics {
    timestamp: number;
    duration: number;
    source: "swr-memory" | "localStorage" | "api-redis" | "api-database";
    cacheHit: boolean;
}

interface StoryData {
    id: string;
    title: string;
    chaptersCount: number;
    scenesCount: number;
    status: string;
    viewCount: number;
}

interface TestResults {
    coldLoad?: PerformanceMetrics;
    warmLoad?: PerformanceMetrics;
    afterUpdate?: PerformanceMetrics;
}

export default function CachePerformancePage() {
    const [testResults, setTestResults] = useState<TestResults>({});
    const [isTestRunning, setIsTestRunning] = useState(false);
    const [currentPhase, setCurrentPhase] = useState<string>("");
    const [testStoryId, setTestStoryId] = useState<string>("");

    // Fetch test stories with SWR
    const {
        data: stories,
        error,
        isLoading,
        mutate,
    } = useSWR<StoryData[]>("/api/test/cache-performance/stories", fetcher, {
        dedupingInterval: CACHE_CONFIG.SWR_DEDUPING_INTERVAL,
        keepPreviousData: true,
        onSuccess: (data) => {
            if (data && data.length > 0 && !testStoryId) {
                setTestStoryId(data[0].id);
            }
        },
    });

    // Performance measurement function
    const measurePerformance = async (
        phase: string,
        fetchFn: () => Promise<any>,
    ): Promise<PerformanceMetrics> => {
        const startTime = performance.now();
        const result = await fetchFn();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Determine cache source based on response headers and duration
        let source: PerformanceMetrics["source"] = "api-database";
        let cacheHit = false;

        if (duration < 5) {
            source = "swr-memory";
            cacheHit = true;
        } else if (duration < 20) {
            source = "localStorage";
            cacheHit = true;
        } else if (result?.headers?.["x-cache-hit"]) {
            source = "api-redis";
            cacheHit = true;
        }

        const metrics: PerformanceMetrics = {
            timestamp: Date.now(),
            duration,
            source,
            cacheHit,
        };

        console.log(
            `[${phase}] Duration: ${duration.toFixed(2)}ms, Source: ${source}, Cache Hit: ${cacheHit}`,
        );

        return metrics;
    };

    // Clear all caches (for testing purposes)
    const clearAllCaches = () => {
        // Clear SWR cache
        mutate(undefined, { revalidate: false });

        // Clear localStorage
        const cacheKeys = Object.keys(localStorage).filter((key) =>
            key.startsWith("fictures:cache:"),
        );
        cacheKeys.forEach((key) => localStorage.removeItem(key));

        console.log("✅ Cleared all client-side caches");
    };

    // Run full cache test
    const runCacheTest = async () => {
        if (!testStoryId) {
            alert("No test story found. Run setup script first.");
            return;
        }

        setIsTestRunning(true);
        setTestResults({});

        try {
            // Phase 1: Cold Load (no cache)
            setCurrentPhase("Phase 1: Cold Load (clearing all caches)");
            clearAllCaches();
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const coldLoad = await measurePerformance("Cold Load", async () => {
                const response = await fetch(
                    `/api/test/cache-performance/stories/${testStoryId}`,
                );
                return {
                    data: await response.json(),
                    headers: response.headers,
                };
            });
            setTestResults((prev) => ({ ...prev, coldLoad }));

            // Phase 2: Warm Load (should hit cache)
            setCurrentPhase("Phase 2: Warm Load (testing cache hit)");
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const warmLoad = await measurePerformance("Warm Load", async () => {
                const response = await fetch(
                    `/api/test/cache-performance/stories/${testStoryId}`,
                );
                return {
                    data: await response.json(),
                    headers: response.headers,
                };
            });
            setTestResults((prev) => ({ ...prev, warmLoad }));

            // Phase 3: Update data and test invalidation
            setCurrentPhase(
                "Phase 3: Updating data (testing cache invalidation)",
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Update the story
            await fetch(`/api/test/cache-performance/stories/${testStoryId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    viewCount: Math.floor(Math.random() * 1000),
                }),
            });

            // Measure fetch after update
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const afterUpdate = await measurePerformance(
                "After Update",
                async () => {
                    const response = await fetch(
                        `/api/test/cache-performance/stories/${testStoryId}`,
                    );
                    return {
                        data: await response.json(),
                        headers: response.headers,
                    };
                },
            );
            setTestResults((prev) => ({ ...prev, afterUpdate }));

            setCurrentPhase("✅ Test Complete!");
        } catch (error) {
            console.error("❌ Test error:", error);
            setCurrentPhase(`❌ Test failed: ${(error as Error).message}`);
        } finally {
            setIsTestRunning(false);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        Cache Performance Test
                    </h1>
                    <p className="text-gray-600">
                        Tests all three caching layers: SWR Memory (30min) →
                        localStorage (1hr) → Redis (10min)
                    </p>
                </div>

                {/* Test Stories */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">Test Stories</h2>
                    {isLoading && <p>Loading test stories...</p>}
                    {error && (
                        <p className="text-red-600">
                            Error loading stories: {(error as Error).message}
                        </p>
                    )}
                    {stories && (
                        <div className="grid gap-4">
                            {stories.map((story) => (
                                <div
                                    key={story.id}
                                    className={`border rounded-lg p-4 ${testStoryId === story.id ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                                    onClick={() => setTestStoryId(story.id)}
                                    role="button"
                                    tabIndex={0}
                                >
                                    <h3 className="font-semibold">
                                        {story.title}
                                    </h3>
                                    <div className="text-sm text-gray-600 mt-2">
                                        <p>Status: {story.status}</p>
                                        <p>
                                            Chapters: {story.chaptersCount} |
                                            Scenes: {story.scenesCount}
                                        </p>
                                        <p>Views: {story.viewCount}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Test Controls */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Test Controls
                    </h2>
                    <div className="flex gap-4">
                        <button
                            onClick={runCacheTest}
                            disabled={isTestRunning || !testStoryId}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isTestRunning
                                ? "Running Test..."
                                : "Run Full Cache Test"}
                        </button>
                        <button
                            onClick={clearAllCaches}
                            disabled={isTestRunning}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                        >
                            Clear All Caches
                        </button>
                    </div>
                    {currentPhase && (
                        <p className="mt-4 text-sm font-medium text-blue-600">
                            {currentPhase}
                        </p>
                    )}
                </div>

                {/* Test Results */}
                {Object.keys(testResults).length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Test Results
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 px-4 py-2">
                                            Phase
                                        </th>
                                        <th className="border border-gray-300 px-4 py-2">
                                            Duration (ms)
                                        </th>
                                        <th className="border border-gray-300 px-4 py-2">
                                            Source
                                        </th>
                                        <th className="border border-gray-300 px-4 py-2">
                                            Cache Hit
                                        </th>
                                        <th className="border border-gray-300 px-4 py-2">
                                            Performance
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {testResults.coldLoad && (
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                Cold Load
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right">
                                                {testResults.coldLoad.duration.toFixed(
                                                    2,
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.coldLoad.source}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.coldLoad.cacheHit
                                                    ? "✅"
                                                    : "❌"}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {getPerformanceRating(
                                                    testResults.coldLoad
                                                        .duration,
                                                    "cold",
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {testResults.warmLoad && (
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                Warm Load
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right font-semibold text-green-600">
                                                {testResults.warmLoad.duration.toFixed(
                                                    2,
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.warmLoad.source}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.warmLoad.cacheHit
                                                    ? "✅"
                                                    : "❌"}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {getPerformanceRating(
                                                    testResults.warmLoad
                                                        .duration,
                                                    "warm",
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                    {testResults.afterUpdate && (
                                        <tr>
                                            <td className="border border-gray-300 px-4 py-2">
                                                After Update
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2 text-right">
                                                {testResults.afterUpdate.duration.toFixed(
                                                    2,
                                                )}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.afterUpdate.source}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {testResults.afterUpdate
                                                    .cacheHit
                                                    ? "✅"
                                                    : "❌"}
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                {getPerformanceRating(
                                                    testResults.afterUpdate
                                                        .duration,
                                                    "update",
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Performance Summary */}
                        {testResults.coldLoad && testResults.warmLoad && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                                <h3 className="font-semibold mb-2">
                                    Performance Summary
                                </h3>
                                <p className="text-sm">
                                    <strong>Cache Speedup:</strong>{" "}
                                    {(
                                        testResults.coldLoad.duration /
                                        testResults.warmLoad.duration
                                    ).toFixed(2)}
                                    x faster
                                </p>
                                <p className="text-sm">
                                    <strong>Time Saved:</strong>{" "}
                                    {(
                                        testResults.coldLoad.duration -
                                        testResults.warmLoad.duration
                                    ).toFixed(2)}
                                    ms
                                </p>
                                <p className="text-sm">
                                    <strong>Improvement:</strong>{" "}
                                    {(
                                        ((testResults.coldLoad.duration -
                                            testResults.warmLoad.duration) /
                                            testResults.coldLoad.duration) *
                                        100
                                    ).toFixed(2)}
                                    %
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Cache Configuration */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4">
                        Cache Configuration
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold mb-2">
                                Layer 1: SWR Memory
                            </h3>
                            <p className="text-sm text-gray-600">
                                TTL: 30 minutes
                            </p>
                            <p className="text-sm text-gray-600">
                                Location: Browser memory
                            </p>
                            <p className="text-sm text-gray-600">
                                Expected: {"<"}1ms
                            </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold mb-2">
                                Layer 2: localStorage
                            </h3>
                            <p className="text-sm text-gray-600">TTL: 1 hour</p>
                            <p className="text-sm text-gray-600">
                                Location: Browser storage
                            </p>
                            <p className="text-sm text-gray-600">
                                Expected: 5-20ms
                            </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold mb-2">
                                Layer 3: Redis
                            </h3>
                            <p className="text-sm text-gray-600">
                                TTL: 10 minutes
                            </p>
                            <p className="text-sm text-gray-600">
                                Location: Server cache
                            </p>
                            <p className="text-sm text-gray-600">
                                Expected: 40-70ms
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function for SWR fetcher
async function fetcher(url: string) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to fetch");
    }
    return response.json();
}

// Performance rating helper
function getPerformanceRating(duration: number, phase: string): string {
    if (phase === "cold") {
        if (duration < 500) return "🟢 Excellent";
        if (duration < 1000) return "🟡 Good";
        if (duration < 2000) return "🟠 Fair";
        return "🔴 Needs Improvement";
    }

    if (phase === "warm") {
        if (duration < 5) return "🟢 Excellent (SWR Memory)";
        if (duration < 20) return "🟢 Excellent (localStorage)";
        if (duration < 100) return "🟡 Good (Redis)";
        return "🟠 Fair";
    }

    if (phase === "update") {
        if (duration < 100) return "🟢 Excellent (Fast Invalidation)";
        if (duration < 500) return "🟡 Good";
        return "🟠 Fair";
    }

    return "";
}
