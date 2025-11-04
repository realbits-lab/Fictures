#!/usr/bin/env tsx

/**
 * Migrate Auth File Structure
 *
 * Migrates .auth/user.json from flat profiles structure to
 * environment-aware structure with main/develop nodes.
 *
 * Usage:
 *   pnpm exec tsx scripts/migrate-auth-structure.ts
 *   pnpm exec tsx scripts/migrate-auth-structure.ts --dry-run
 */

import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join(process.cwd(), '.auth', 'user.json');
const BACKUP_FILE = path.join(process.cwd(), '.auth', 'user.json.backup');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

interface OldUserProfile {
  email: string;
  password: string;
  apiKey: string;
}

interface OldAuthStructure {
  profiles: {
    manager: OldUserProfile;
    writer: OldUserProfile;
    reader: OldUserProfile;
  };
}

interface NewAuthStructure {
  main: {
    profiles: {
      manager: OldUserProfile;
      writer: OldUserProfile;
      reader: OldUserProfile;
    };
  };
  develop: {
    profiles: {
      manager: OldUserProfile;
      writer: OldUserProfile;
      reader: OldUserProfile;
    };
  };
}

console.log('🔄 Auth File Structure Migration');
console.log('='.repeat(60));
console.log();

if (isDryRun) {
  console.log('⚠️  DRY RUN MODE - No changes will be made');
  console.log();
}

// Check if auth file exists
if (!fs.existsSync(AUTH_FILE)) {
  console.error('❌ Error: Auth file not found at', AUTH_FILE);
  console.error();
  console.error('💡 Run this command to create auth users first:');
  console.error('   dotenv --file .env.local run pnpm exec tsx scripts/setup-auth-users.ts');
  process.exit(1);
}

// Read current auth file
console.log('📖 Reading current auth file...');
const currentContent = fs.readFileSync(AUTH_FILE, 'utf-8');
const currentData = JSON.parse(currentContent) as OldAuthStructure | NewAuthStructure;

// Check if already migrated
if ('main' in currentData && 'develop' in currentData) {
  console.log('✅ Auth file already has new structure (main/develop)');
  console.log();
  console.log('Current structure:');
  console.log('  - main environment with 3 profiles');
  console.log('  - develop environment with 3 profiles');
  console.log();
  console.log('No migration needed.');
  process.exit(0);
}

// Validate old structure
if (!('profiles' in currentData)) {
  console.error('❌ Error: Invalid auth file structure');
  console.error('   Expected "profiles" object');
  process.exit(1);
}

const oldData = currentData as OldAuthStructure;

console.log('✅ Old structure detected');
console.log();
console.log('Current profiles:');
console.log(`  - manager: ${oldData.profiles.manager.email}`);
console.log(`  - writer: ${oldData.profiles.writer.email}`);
console.log(`  - reader: ${oldData.profiles.reader.email}`);
console.log();

// Create new structure
const newData: NewAuthStructure = {
  main: {
    profiles: {
      manager: { ...oldData.profiles.manager },
      writer: { ...oldData.profiles.writer },
      reader: { ...oldData.profiles.reader },
    },
  },
  develop: {
    profiles: {
      manager: { ...oldData.profiles.manager },
      writer: { ...oldData.profiles.writer },
      reader: { ...oldData.profiles.reader },
    },
  },
};

console.log('🎯 New structure:');
console.log();
console.log('main/');
console.log('  profiles/');
console.log(`    manager: ${newData.main.profiles.manager.email}`);
console.log(`    writer:  ${newData.main.profiles.writer.email}`);
console.log(`    reader:  ${newData.main.profiles.reader.email}`);
console.log();
console.log('develop/');
console.log('  profiles/');
console.log(`    manager: ${newData.develop.profiles.manager.email}`);
console.log(`    writer:  ${newData.develop.profiles.writer.email}`);
console.log(`    reader:  ${newData.develop.profiles.reader.email}`);
console.log();

if (isDryRun) {
  console.log('💡 Remove --dry-run flag to apply migration');
  process.exit(0);
}

// Create backup
console.log('💾 Creating backup...');
fs.copyFileSync(AUTH_FILE, BACKUP_FILE);
console.log(`   Backup saved: ${BACKUP_FILE}`);
console.log();

// Write new structure
console.log('✍️  Writing new structure...');
fs.writeFileSync(AUTH_FILE, JSON.stringify(newData, null, 2), 'utf-8');
console.log(`   Updated: ${AUTH_FILE}`);
console.log();

console.log('✅ Migration complete!');
console.log();
console.log('📊 Summary:');
console.log('  - Old structure backed up');
console.log('  - New structure with main/develop environments');
console.log('  - All profiles duplicated to both environments');
console.log();
console.log('🔒 Security Note:');
console.log('  - Same credentials used in both environments initially');
console.log('  - Consider generating separate API keys for production');
console.log();
console.log('💡 Next Steps:');
console.log('  - NODE_ENV=development uses "develop" environment (default)');
console.log('  - NODE_ENV=production uses "main" environment');
console.log('  - Scripts automatically detect environment from NODE_ENV');
console.log();
