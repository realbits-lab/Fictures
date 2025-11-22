#!/usr/bin/env tsx

/**
 * Copy Blobs Between Prefixes
 *
 * Copies all blob files from one prefix to another.
 *
 * Usage:
 *   # Preview what will be copied
 *   dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from main/system --to develop/system
 *
 *   # Execute copy
 *   dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from main/system --to develop/system --confirm
 *
 * Prerequisites:
 *   - BLOB_READ_WRITE_TOKEN environment variable
 */

import { list, put } from "@vercel/blob";

// Parse arguments
const args = process.argv.slice(2);

function getArgValue(flag: string): string | undefined {
    const index = args.indexOf(flag);
    if (index !== -1 && index + 1 < args.length) {
        return args[index + 1];
    }
    return undefined;
}

const fromPrefix = getArgValue("--from");
const toPrefix = getArgValue("--to");
const confirmFlag = args.includes("--confirm");
const helpFlag = args.includes("--help") || args.includes("-h");

if (helpFlag) {
    console.log(`
Copy Blobs Between Prefixes

Copies all blob files from one prefix to another.

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from <source> --to <dest> [OPTIONS]

Options:
  --from <prefix>  Source prefix (e.g., main/system)
  --to <prefix>    Destination prefix (e.g., develop/system)
  --confirm        Execute the copy (required for actual copy)
  --help, -h       Show this help message

Examples:
  # Preview copy
  dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from main/system --to develop/system

  # Execute copy
  dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from main/system --to develop/system --confirm
`);
    process.exit(0);
}

if (!fromPrefix || !toPrefix) {
    console.error("❌ Error: Both --from and --to prefixes are required");
    console.log("\nUsage:");
    console.log(
        "  dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from main/system --to develop/system --confirm",
    );
    process.exit(1);
}

console.log("📋 Copy Blobs Script");
console.log("=".repeat(60));
console.log();

async function main(): Promise<void> {
    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error(
            "❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required",
        );
        process.exit(1);
    }

    // Ensure prefixes end with /
    const sourcePrefix = fromPrefix.endsWith("/")
        ? fromPrefix
        : `${fromPrefix}/`;
    const destPrefix = toPrefix.endsWith("/") ? toPrefix : `${toPrefix}/`;

    console.log(`📁 Source: ${sourcePrefix}`);
    console.log(`📁 Destination: ${destPrefix}`);
    console.log(`📊 Mode: ${confirmFlag ? "COPY" : "PREVIEW"}`);
    console.log();

    // List all blobs under source prefix
    console.log("🔍 Scanning source blobs...\n");

    let cursor: string | undefined;
    let totalFiles = 0;
    const blobs: { url: string; pathname: string }[] = [];

    do {
        const response = await list({
            prefix: sourcePrefix,
            cursor,
            limit: 1000,
        });

        for (const blob of response.blobs) {
            blobs.push({ url: blob.url, pathname: blob.pathname });
            totalFiles++;

            if (totalFiles <= 20) {
                // Show mapping
                const newPath = blob.pathname.replace(sourcePrefix, destPrefix);
                console.log(`   ${blob.pathname}`);
                console.log(`   → ${newPath}`);
                console.log();
            } else if (totalFiles === 21) {
                console.log("   ...\n");
            }
        }

        cursor = response.cursor;
    } while (cursor);

    console.log(`📊 Total files to copy: ${totalFiles}`);
    console.log();

    if (totalFiles === 0) {
        console.log("ℹ️  No files found under source prefix. Nothing to copy.");
        process.exit(0);
    }

    // Preview mode
    if (!confirmFlag) {
        console.log("⚠️  PREVIEW MODE - No files will be copied");
        console.log();
        console.log("To copy these files, run with --confirm flag:");
        console.log(
            `  dotenv --file .env.local run pnpm exec tsx scripts/copy-blobs.ts --from ${fromPrefix} --to ${toPrefix} --confirm`,
        );
        console.log();
        process.exit(0);
    }

    // Confirm mode - copy files
    console.log("📥 Copying files...\n");

    let copied = 0;
    const errors: string[] = [];

    for (const blob of blobs) {
        try {
            // Calculate new path
            const newPath = blob.pathname.replace(sourcePrefix, destPrefix);

            // Fetch the blob content
            const response = await fetch(blob.url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const content = await response.blob();

            // Upload to new location
            await put(newPath, content, {
                access: "public",
                addRandomSuffix: false,
            });

            copied++;

            if (copied % 10 === 0 || copied === totalFiles) {
                console.log(`   Copied ${copied}/${totalFiles} files`);
            }
        } catch (error) {
            errors.push(`${blob.pathname}: ${(error as Error).message}`);
        }
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ COPY COMPLETE");
    console.log("=".repeat(60));
    console.log();
    console.log("📊 Copy Report:");
    console.log(`   Files copied: ${copied}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Source: ${sourcePrefix}`);
    console.log(`   Destination: ${destPrefix}`);

    if (errors.length > 0) {
        console.log();
        console.log("❌ Errors:");
        for (const err of errors) {
            console.log(`   ${err}`);
        }
    }

    console.log();
}

main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
});
