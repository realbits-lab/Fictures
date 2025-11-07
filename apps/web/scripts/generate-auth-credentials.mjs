#!/usr/bin/env node

/**
 * Generate Authentication Credentials
 *
 * This script generates secure passwords and API keys for authentication profiles.
 * It can update the .auth/user.json file with new credentials.
 *
 * Usage:
 *   node scripts/generate-auth-credentials.mjs [options]
 *
 * Options:
 *   --profile <name>    Generate for specific profile (manager|writer|reader)
 *   --all               Generate for all profiles
 *   --env <name>        Target environment (main|develop|all) [default: all]
 *   --dry-run           Preview changes without writing to file
 *   --output            Output credentials to console only
 *
 * Examples:
 *   node scripts/generate-auth-credentials.mjs --all
 *   node scripts/generate-auth-credentials.mjs --profile writer --env develop
 *   node scripts/generate-auth-credentials.mjs --all --dry-run
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AUTH_FILE_PATH = path.join(__dirname, '../.auth/user.json');
const PASSWORD_LENGTH = 24;
const API_KEY_LENGTH = 16; // Length without 'fic_' prefix
const API_KEY_PREFIX = 'fic_';

/**
 * Character sets for password generation
 */
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  special: '!@#$%^&*',
};

/**
 * Generate a cryptographically secure random string
 * @param {string} charset - Characters to use
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
function generateRandomString(charset, length) {
  const randomBytes = crypto.randomBytes(length * 2);
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes.readUInt16BE(i * 2) % charset.length;
    result += charset[randomIndex];
  }

  return result;
}

/**
 * Generate a secure password
 * Ensures at least one character from each set
 * @param {number} length - Password length
 * @returns {string} Secure password
 */
function generatePassword(length = PASSWORD_LENGTH) {
  const allChars = Object.values(CHAR_SETS).join('');

  // Ensure at least one character from each set
  let password = '';
  password += generateRandomString(CHAR_SETS.uppercase, 1);
  password += generateRandomString(CHAR_SETS.lowercase, 1);
  password += generateRandomString(CHAR_SETS.numbers, 1);
  password += generateRandomString(CHAR_SETS.special, 1);

  // Fill the rest with random characters
  const remainingLength = length - password.length;
  password += generateRandomString(allChars, remainingLength);

  // Shuffle the password
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const randomBytes = crypto.randomBytes(2);
    const j = randomBytes.readUInt16BE(0) % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Generate an API key
 * Format: fic_XXXXXXXXXXXXXXXX (16 chars after prefix)
 * @returns {string} API key
 */
function generateApiKey() {
  // Use alphanumeric + some URL-safe special chars for API keys
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  const randomPart = generateRandomString(charset, API_KEY_LENGTH);
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Generate credentials for a profile
 * @returns {Object} Credentials object with password and apiKey
 */
function generateCredentials() {
  return {
    password: generatePassword(),
    apiKey: generateApiKey(),
  };
}

/**
 * Load the authentication file
 * @returns {Object} Authentication data
 */
function loadAuthFile() {
  if (!fs.existsSync(AUTH_FILE_PATH)) {
    throw new Error(`Authentication file not found: ${AUTH_FILE_PATH}`);
  }

  const content = fs.readFileSync(AUTH_FILE_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save the authentication file
 * @param {Object} data - Authentication data
 */
function saveAuthFile(data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(AUTH_FILE_PATH, content, 'utf-8');
}

/**
 * Update credentials for specified profiles and environments
 * @param {Object} options - Update options
 * @returns {Object} Updated authentication data
 */
function updateCredentials(options) {
  const {
    profiles = ['manager', 'writer', 'reader'],
    environments = ['main', 'develop'],
  } = options;

  const authData = loadAuthFile();
  const updates = {};

  for (const env of environments) {
    if (!authData[env]) {
      console.warn(`⚠️  Environment "${env}" not found in auth file`);
      continue;
    }

    if (!updates[env]) {
      updates[env] = { profiles: {} };
    }

    for (const profile of profiles) {
      if (!authData[env].profiles[profile]) {
        console.warn(`⚠️  Profile "${profile}" not found in environment "${env}"`);
        continue;
      }

      const credentials = generateCredentials();

      // Keep email, update password and apiKey
      authData[env].profiles[profile].password = credentials.password;
      authData[env].profiles[profile].apiKey = credentials.apiKey;

      updates[env].profiles[profile] = {
        email: authData[env].profiles[profile].email,
        ...credentials,
      };
    }
  }

  return { authData, updates };
}

/**
 * Display credentials in a formatted table
 * @param {Object} updates - Update data
 */
function displayCredentials(updates) {
  console.log('\n🔐 Generated Credentials:\n');

  for (const [env, data] of Object.entries(updates)) {
    console.log(`📍 Environment: ${env}`);
    console.log('─'.repeat(80));

    for (const [profile, creds] of Object.entries(data.profiles)) {
      console.log(`\n  Profile: ${profile}`);
      console.log(`  Email:    ${creds.email}`);
      console.log(`  Password: ${creds.password}`);
      console.log(`  API Key:  ${creds.apiKey}`);

      // Validate API key format
      const keyWithoutPrefix = creds.apiKey.replace(API_KEY_PREFIX, '');
      const isValid = creds.apiKey.startsWith(API_KEY_PREFIX) && keyWithoutPrefix.length === API_KEY_LENGTH;
      console.log(`  ✓ API Key Format: ${isValid ? '✅ Valid' : '❌ Invalid'} (${keyWithoutPrefix.length} chars after prefix)`);
    }

    console.log('');
  }
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    profiles: [],
    environments: [],
    dryRun: false,
    outputOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--profile':
        options.profiles.push(args[++i]);
        break;
      case '--all':
        options.profiles = ['manager', 'writer', 'reader'];
        break;
      case '--env':
        const envArg = args[++i];
        if (envArg === 'all') {
          options.environments = ['main', 'develop'];
        } else {
          options.environments.push(envArg);
        }
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--output':
        options.outputOnly = true;
        break;
      case '--help':
      case '-h':
        displayHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        displayHelp();
        process.exit(1);
    }
  }

  // Defaults
  if (options.profiles.length === 0) {
    options.profiles = ['manager', 'writer', 'reader'];
  }
  if (options.environments.length === 0) {
    options.environments = ['main', 'develop'];
  }

  return options;
}

/**
 * Display help message
 */
function displayHelp() {
  console.log(`
Generate Authentication Credentials

Usage:
  node scripts/generate-auth-credentials.mjs [options]

Options:
  --profile <name>    Generate for specific profile (manager|writer|reader)
  --all               Generate for all profiles (default)
  --env <name>        Target environment (main|develop|all) [default: all]
  --dry-run           Preview changes without writing to file
  --output            Output credentials to console only (no file changes)
  --help, -h          Show this help message

Examples:
  node scripts/generate-auth-credentials.mjs --all
  node scripts/generate-auth-credentials.mjs --profile writer --env develop
  node scripts/generate-auth-credentials.mjs --all --dry-run
  node scripts/generate-auth-credentials.mjs --output
  `);
}

/**
 * Main function
 */
async function main() {
  console.log('🔑 Authentication Credentials Generator\n');

  const options = parseArgs();

  console.log('Configuration:');
  console.log(`  Profiles:     ${options.profiles.join(', ')}`);
  console.log(`  Environments: ${options.environments.join(', ')}`);
  console.log(`  Mode:         ${options.outputOnly ? 'Output Only' : options.dryRun ? 'Dry Run' : 'Live Update'}`);
  console.log('');

  try {
    if (options.outputOnly) {
      // Just generate and display credentials
      const credentials = {};
      for (const env of options.environments) {
        credentials[env] = { profiles: {} };
        for (const profile of options.profiles) {
          credentials[env].profiles[profile] = {
            email: `${profile}@fictures.xyz`,
            ...generateCredentials(),
          };
        }
      }
      displayCredentials(credentials);
      return;
    }

    // Update credentials
    const { authData, updates } = updateCredentials({
      profiles: options.profiles,
      environments: options.environments,
    });

    displayCredentials(updates);

    if (options.dryRun) {
      console.log('ℹ️  Dry run mode - no changes written to file\n');
    } else {
      saveAuthFile(authData);
      console.log(`✅ Successfully updated credentials in ${AUTH_FILE_PATH}\n`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
