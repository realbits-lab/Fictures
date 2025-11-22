#!/usr/bin/env tsx

/**
 * Delete All Blobs Under /develop Prefix
 *
 * DESTRUCTIVE OPERATION: Permanently deletes all blob files under the develop/ prefix.
 * Note: Files under develop/system/ are excluded and will NOT be deleted.
 *
 * Usage:
 *   # Preview what will be deleted
 *   dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts
 *
 *   # Execute deletion
 *   dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts --confirm
 *
 * Prerequisites:
 *   - BLOB_READ_WRITE_TOKEN environment variable
 */

import { del, list } from "@vercel/blob";

// Parse arguments
const args = process.argv.slice(2);
const confirmFlag = args.includes("--confirm");
const helpFlag = args.includes("--help") || args.includes("-h");

if (helpFlag) {
    console.log(`
Delete All Blobs Under /develop Prefix

DESTRUCTIVE OPERATION: Permanently deletes all blob files under develop/
Note: Files under develop/system/ are excluded and will NOT be deleted.

Usage:
  dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts [OPTIONS]

Options:
  --confirm    Execute the deletion (required for actual deletion)
  --help, -h   Show this help message

Examples:
  # Preview deletion
  dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts

  # Execute deletion
  dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts --confirm
`);
    process.exit(0);
}

console.log("🗑️  Delete Develop Blobs Script");
console.log("=".repeat(60));
console.log();

const PREFIX = "develop/";
const EXCLUDED_PREFIX = "develop/system/";
const BATCH_SIZE = 100;

async function main(): Promise<void> {
    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        console.error(
            "❌ Error: BLOB_READ_WRITE_TOKEN environment variable is required",
        );
        process.exit(1);
    }

    console.log(`📁 Prefix: ${PREFIX}`);
    console.log(`📁 Excluded: ${EXCLUDED_PREFIX}`);
    console.log(`📊 Mode: ${confirmFlag ? "DELETE" : "PREVIEW"}`);
    console.log();

    // List all blobs under develop/
    console.log("🔍 Scanning blobs under develop/ (excluding system/)...\n");

    let cursor: string | undefined;
    let totalFiles = 0;
    let skippedFiles = 0;
    const allUrls: string[] = [];

    do {
        const response = await list({
            prefix: PREFIX,
            cursor,
            limit: 1000,
        });

        for (const blob of response.blobs) {
            // Skip files under develop/system/
            if (blob.pathname.startsWith(EXCLUDED_PREFIX)) {
                skippedFiles++;
                continue;
            }

            allUrls.push(blob.url);
            totalFiles++;

            if (totalFiles <= 20) {
                console.log(`   ${blob.pathname}`);
            } else if (totalFiles === 21) {
                console.log("   ...");
            }
        }

        cursor = response.cursor;
    } while (cursor);

    if (skippedFiles > 0) {
        console.log(
            `\n📁 Skipped ${skippedFiles} files under ${EXCLUDED_PREFIX}`,
        );
    }

    console.log();
    console.log(`📊 Total files found: ${totalFiles}`);
    console.log();

    if (totalFiles === 0) {
        console.log(
            "ℹ️  No files found under develop/ prefix. Nothing to delete.",
        );
        process.exit(0);
    }

    // Preview mode
    if (!confirmFlag) {
        console.log("⚠️  PREVIEW MODE - No files will be deleted");
        console.log();
        console.log("To delete these files, run with --confirm flag:");
        console.log(
            "  dotenv --file .env.local run pnpm exec tsx scripts/delete-develop-blobs.ts --confirm",
        );
        console.log();
        process.exit(0);
    }

    // Confirm mode - delete files
    console.log("⚠️  DESTRUCTIVE MODE - Proceeding with deletion");
    console.log();
    console.log("🚨 Starting deletion in 5 seconds...");
    console.log("   Press Ctrl+C to cancel");
    console.log();

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("🔥 Deleting files...\n");

    let deleted = 0;
    let batches = 0;

    // Delete in batches
    for (let i = 0; i < allUrls.length; i += BATCH_SIZE) {
        const batch = allUrls.slice(i, i + BATCH_SIZE);

        await del(batch);

        deleted += batch.length;
        batches++;

        console.log(
            `   Batch ${batches}: Deleted ${batch.length} files (${deleted}/${totalFiles})`,
        );
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ DELETION COMPLETE");
    console.log("=".repeat(60));
    console.log();
    console.log("📊 Deletion Report:");
    console.log(`   Total files deleted: ${deleted}`);
    console.log(`   Batches processed: ${batches}`);
    console.log(`   Prefix: ${PREFIX}`);
    console.log();
}

main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
});
