#!/usr/bin/env tsx
/**
 * Production Migration Script for Book Hierarchy
 * 
 * This script migrates existing books and chapters to the new 4-level hierarchy:
 * Book -> Story -> Part -> Chapter -> Scene
 * 
 * Usage:
 *   npx tsx lib/migration/run-hierarchy-migration.ts [options]
 * 
 * Options:
 *   --dry-run           Simulate migration without making changes
 *   --batch-size=N      Process N items per batch (default: 10)
 *   --validate          Run validation before and after migration
 *   --no-rollback       Disable automatic rollback on errors
 *   --force             Skip confirmation prompts
 */

import { HierarchyMigration } from './hierarchy-migration';
import { db } from '../db';
import { book, chapter } from '../db/schema';

interface CliOptions {
  dryRun: boolean;
  batchSize: number;
  validate: boolean;
  rollback: boolean;
  force: boolean;
  help: boolean;
}

function parseArguments(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    dryRun: false,
    batchSize: 10,
    validate: true,
    rollback: true,
    force: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--batch-size=')) {
      options.batchSize = parseInt(arg.split('=')[1], 10) || 10;
    } else if (arg === '--validate') {
      options.validate = true;
    } else if (arg === '--no-rollback') {
      options.rollback = false;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    }
  }

  return options;
}

function printUsage() {
  console.log(`
Book Hierarchy Migration Tool

This tool migrates existing books and chapters to the new 4-level hierarchy structure:
Book -> Story -> Part -> Chapter -> Scene

Usage:
  npx tsx lib/migration/run-hierarchy-migration.ts [options]

Options:
  --dry-run           Simulate migration without making changes
  --batch-size=N      Process N items per batch (default: 10)
  --validate          Run validation before and after migration (default: true)
  --no-rollback       Disable automatic rollback on errors
  --force             Skip confirmation prompts
  --help, -h          Show this help message

Examples:
  # Dry run to see what would be migrated
  npx tsx lib/migration/run-hierarchy-migration.ts --dry-run

  # Migrate with larger batch size
  npx tsx lib/migration/run-hierarchy-migration.ts --batch-size=25

  # Migrate without validation (faster but riskier)
  npx tsx lib/migration/run-hierarchy-migration.ts --no-validate --force

Safety Notes:
  - Always backup your database before running migration
  - Use --dry-run first to preview changes
  - The migration creates new hierarchy tables without affecting existing data
  - Rollback is available if migration fails
`);
}

async function confirmMigration(options: CliOptions): Promise<boolean> {
  if (options.force) {
    return true;
  }

  // Get current data counts
  const books = await db.select().from(book);
  const chapters = await db.select().from(chapter);

  console.log('\n📊 Current Database State:');
  console.log(`  Books: ${books.length}`);
  console.log(`  Chapters: ${chapters.length}`);
  
  if (options.dryRun) {
    console.log('\n🧪 DRY RUN MODE - No changes will be made');
    return true;
  }

  console.log('\n⚠️  This migration will:');
  console.log('  • Create new hierarchy tables (Story, Part, ChapterEnhanced, Scene)');
  console.log('  • Migrate existing chapters to the new structure');
  console.log('  • Create default stories and parts for each book');
  console.log('  • Split chapter content into individual scenes');
  console.log('  • Update word counts throughout the hierarchy');

  console.log('\n🔒 Safety measures:');
  console.log('  • Original data will be preserved');
  console.log(options.rollback ? '  • Automatic rollback on errors' : '  • Manual rollback required on errors');
  console.log(options.validate ? '  • Data validation enabled' : '  • Data validation disabled');

  console.log('\n❓ Do you want to proceed with the migration?');
  console.log('   Type "yes" to continue, anything else to cancel:');

  // Simple confirmation (in a real CLI tool, you'd use a proper readline interface)
  return new Promise((resolve) => {
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === 'yes');
    });
  });
}

async function runMigration() {
  const options = parseArguments();

  if (options.help) {
    printUsage();
    process.exit(0);
  }

  console.log('🚀 Book Hierarchy Migration Tool');
  console.log('==================================\n');

  try {
    // Confirm migration with user
    const confirmed = await confirmMigration(options);
    if (!confirmed) {
      console.log('❌ Migration cancelled by user');
      process.exit(0);
    }

    // Initialize migration
    const migration = new HierarchyMigration(db);
    let progressInterval: NodeJS.Timeout;

    // Setup progress tracking
    migration.onProgressUpdate((progress) => {
      const percentage = progress.percentage.toFixed(1);
      const stage = progress.currentStage;
      const completed = progress.completedItems;
      const total = progress.totalItems;
      
      process.stdout.write(`\r📈 ${stage}: ${percentage}% (${completed}/${total})`);
    });

    // Show periodic progress updates
    progressInterval = setInterval(async () => {
      const progress = await migration.getMigrationProgress();
      if (progress.isRunning) {
        const timeRemaining = Math.round(progress.estimatedTimeRemaining / 1000);
        if (timeRemaining > 0) {
          process.stdout.write(` | ETA: ${timeRemaining}s`);
        }
      }
    }, 2000);

    console.log('⏳ Starting migration...\n');

    // Run migration
    const result = await migration.migrateToHierarchy({
      batchSize: options.batchSize,
      dryRun: options.dryRun,
      validateBeforeMigration: options.validate,
      validateAfterMigration: options.validate,
      rollbackOnError: options.rollback
    });

    clearInterval(progressInterval);
    console.log('\n'); // New line after progress

    // Report results
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log('\n📊 Migration Results:');
      console.log(`  Books migrated: ${result.migratedBooks}`);
      console.log(`  Chapters migrated: ${result.migratedChapters}`);
      console.log(`  Stories created: ${result.createdStories}`);
      console.log(`  Parts created: ${result.createdParts}`);
      console.log(`  Scenes created: ${result.createdScenes}`);
      console.log(`  Processing time: ${(result.totalProcessingTime / 1000).toFixed(2)}s`);
      console.log(`  Batches processed: ${result.processedInBatches}`);

      if (result.validationTime) {
        console.log(`  Validation time: ${(result.validationTime / 1000).toFixed(2)}s`);
      }

      if (!options.dryRun) {
        console.log('\n🎉 Your books now have the new hierarchy structure!');
        console.log('   You can now use the enhanced navigation and AI features.');
      }

    } else {
      console.log('❌ Migration failed!');
      console.log('\n🐛 Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });

      if (options.rollback) {
        console.log('\n🔄 Attempting automatic rollback...');
        const rollbackResult = await migration.rollbackMigration();
        
        if (rollbackResult.success) {
          console.log('✅ Rollback completed successfully');
          console.log('   Your data has been restored to its original state');
        } else {
          console.log('❌ Rollback failed!');
          console.log('🚨 CRITICAL: Manual data recovery may be required');
          rollbackResult.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`);
          });
        }
      }

      process.exit(1);
    }

  } catch (error) {
    console.log(`\n💥 Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    console.log('🚨 Migration terminated unexpectedly');
    
    if (options.rollback) {
      console.log('⚠️  Consider running rollback manually if needed');
    }
    
    process.exit(1);
  }
}

// Self-executing script check
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('\n👋 Migration tool completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

export { runMigration };