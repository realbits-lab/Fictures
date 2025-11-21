#!/usr/bin/env tsx

/**
 * Scene Content Generation Script
 *
 * Generates scene content for a specific scene using AI and stores it in the database.
 * Uses the scene-content API endpoint with writer authentication.
 *
 * Usage:
 *   dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts <sceneId> [options]
 *
 * Options:
 *   --language <lang>   Language for content generation (default: English)
 *   --dry-run           Preview without generating
 *   --verbose           Show detailed output
 *
 * Examples:
 *   # Generate content for a scene
 *   dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123
 *
 *   # Generate in Korean
 *   dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123 --language Korean
 *
 *   # Preview mode
 *   dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123 --dry-run
 *
 * Prerequisites:
 *   - Dev server running on port 3000
 *   - Valid writer API key in .auth/user.json
 *   - Scene must exist in database with scene summary
 */

import fs from "node:fs";
import path from "node:path";

const BASE_URL = "http://192.168.45.157:3000";

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
};

function log(message: string, color?: keyof typeof colors): void {
    const colorCode = color ? colors[color] : "";
    console.log(`${colorCode}${message}${colors.reset}`);
}

function logSection(title: string): void {
    console.log("");
    log("━".repeat(60), "cyan");
    log(`  ${title}`, "bright");
    log("━".repeat(60), "cyan");
}

interface ParsedArgs {
    sceneId: string;
    language: string;
    dryRun: boolean;
    verbose: boolean;
}

function parseArgs(): ParsedArgs {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        printUsage();
        process.exit(0);
    }

    const options: ParsedArgs = {
        sceneId: "",
        language: "English",
        dryRun: false,
        verbose: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === "--language" && args[i + 1]) {
            options.language = args[i + 1];
            i++;
        } else if (arg === "--dry-run") {
            options.dryRun = true;
        } else if (arg === "--verbose" || arg === "-v") {
            options.verbose = true;
        } else if (!arg.startsWith("-") && !options.sceneId) {
            options.sceneId = arg;
        }
    }

    if (!options.sceneId) {
        log("❌ Error: Scene ID is required", "red");
        printUsage();
        process.exit(1);
    }

    return options;
}

function printUsage(): void {
    console.log(`
Usage: dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts <sceneId> [options]

Arguments:
  sceneId              The scene ID to generate content for (required)

Options:
  --language <lang>    Language for content generation (default: English)
  --dry-run            Preview what would be generated without executing
  --verbose, -v        Show detailed output
  --help, -h           Show this help message

Examples:
  # Generate content for a scene
  dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123

  # Generate in Korean
  dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123 --language Korean

  # Preview mode
  dotenv -f .env.local run -- pnpm exec tsx scripts/generate-scene-content.ts scene_abc123 --dry-run
`);
}

function loadApiKey(): string {
    const authPath = path.join(process.cwd(), ".auth", "user.json");

    if (!fs.existsSync(authPath)) {
        log("❌ Error: .auth/user.json not found", "red");
        log("   Run: dotenv -f .env.local run -- pnpm exec tsx scripts/setup-auth-users.ts", "yellow");
        process.exit(1);
    }

    try {
        const authData = JSON.parse(fs.readFileSync(authPath, "utf-8"));
        // Support both flat structure (profiles.writer) and environment structure (develop.profiles.writer)
        const apiKey =
            authData?.profiles?.writer?.apiKey ||
            authData?.develop?.profiles?.writer?.apiKey ||
            authData?.main?.profiles?.writer?.apiKey;

        if (!apiKey) {
            log("❌ Error: Writer API key not found in .auth/user.json", "red");
            log("   Run: dotenv -f .env.local run -- pnpm exec tsx scripts/setup-auth-users.ts", "yellow");
            process.exit(1);
        }

        return apiKey;
    } catch (error) {
        log("❌ Error: Failed to parse .auth/user.json", "red");
        process.exit(1);
    }
}

async function checkServerHealth(): Promise<boolean> {
    try {
        // Just check if server responds (any status is ok, including redirects)
        const response = await fetch(`${BASE_URL}/`, {
            method: "GET",
            signal: AbortSignal.timeout(5000),
            redirect: "manual",
        });
        return response.status > 0;
    } catch {
        return false;
    }
}

interface SceneInfo {
    id: string;
    title: string;
    summary: string | null;
    content: string | null;
    cyclePhase: string | null;
    chapterId: string;
}

async function fetchSceneInfo(sceneId: string, apiKey: string): Promise<SceneInfo | null> {
    try {
        const response = await fetch(`${BASE_URL}/api/studio/scenes/${sceneId}`, {
            method: "GET",
            headers: {
                "x-api-key": apiKey,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`Failed to fetch scene: ${response.status}`);
        }

        const data = (await response.json()) as { scene?: SceneInfo } | SceneInfo;
        if (data && typeof data === "object" && "scene" in data) {
            return data.scene || null;
        }
        return (data as SceneInfo) || null;
    } catch (error) {
        throw error;
    }
}

interface GenerationResult {
    success: boolean;
    scene?: {
        id: string;
        title: string;
        content: string;
    };
    metadata?: {
        wordCount: number;
        generationTime: number;
    };
    error?: string;
}

async function generateSceneContent(
    sceneId: string,
    language: string,
    apiKey: string,
    verbose: boolean
): Promise<GenerationResult> {
    const startTime = Date.now();

    log(`\n🤖 Generating scene content...`, "cyan");
    if (verbose) {
        log(`   Scene ID: ${sceneId}`, "blue");
        log(`   Language: ${language}`, "blue");
    }

    const response = await fetch(`${BASE_URL}/api/studio/scene-content`, {
        method: "POST",
        headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            sceneId,
            language,
        }),
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
            error?: string;
            details?: string;
        };
        return {
            success: false,
            error: errorData.error || errorData.details || `HTTP ${response.status}`,
        };
    }

    const data = (await response.json()) as {
        scene?: {
            id: string;
            title: string;
            content: string;
        };
        metadata?: {
            wordCount: number;
            generationTime: number;
        };
    };

    if (verbose) {
        log(`   ⏱️  Generation time: ${elapsed}ms`, "blue");
    }

    return {
        success: true,
        scene: data.scene,
        metadata: data.metadata,
    };
}

async function main(): Promise<void> {
    const args = parseArgs();

    logSection("Scene Content Generator");

    log(`\n📋 Configuration:`, "bright");
    log(`   Scene ID: ${args.sceneId}`, "blue");
    log(`   Language: ${args.language}`, "blue");
    log(`   Dry Run: ${args.dryRun}`, "blue");
    log(`   Verbose: ${args.verbose}`, "blue");

    // 1. Load API key
    log(`\n🔑 Loading API key...`, "cyan");
    const apiKey = loadApiKey();
    log(`   ✅ API key loaded (${apiKey.substring(0, 10)}...)`, "green");

    // 2. Check server health
    log(`\n🔌 Checking server connection...`, "cyan");
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        log(`   ❌ Dev server not responding at ${BASE_URL}`, "red");
        log(`   Start with: dotenv -f .env.local run -- pnpm dev`, "yellow");
        process.exit(1);
    }
    log(`   ✅ Server is running`, "green");

    // 3. Dry run check
    if (args.dryRun) {
        logSection("Dry Run Complete");
        log(`\n✅ Would generate content for scene: ${args.sceneId}`, "green");
        log(`   Run without --dry-run to execute generation`, "yellow");
        process.exit(0);
    }

    // 4. Generate content
    logSection("Generating Content");

    const result = await generateSceneContent(
        args.sceneId,
        args.language,
        apiKey,
        args.verbose
    );

    if (!result.success) {
        log(`\n❌ Generation failed: ${result.error}`, "red");
        process.exit(1);
    }

    // 6. Display results
    logSection("Generation Complete");

    log(`\n✅ Scene content generated successfully!`, "green");
    log(`\n📊 Results:`, "bright");
    log(`   Scene: "${result.scene?.title}"`, "blue");
    log(`   Word Count: ${result.metadata?.wordCount || "unknown"}`, "blue");
    log(`   Generation Time: ${result.metadata?.generationTime || "unknown"}ms`, "blue");

    if (args.verbose && result.scene?.content) {
        log(`\n📖 Content Preview (first 500 chars):`, "cyan");
        const preview = result.scene.content.substring(0, 500);
        log(`\n${preview}${result.scene.content.length > 500 ? "..." : ""}`, "reset");
    }

    log(`\n🔗 View scene:`, "cyan");
    log(`   API: ${BASE_URL}/api/studio/scenes/${args.sceneId}`, "blue");

    console.log("");
}

// Run
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
