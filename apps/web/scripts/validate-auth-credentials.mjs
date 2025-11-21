#!/usr/bin/env node

/**
 * Validate Authentication Credentials
 *
 * This script validates passwords and API keys in .auth/user.json
 * to ensure they meet security requirements and format standards.
 *
 * Usage:
 *   node scripts/validate-auth-credentials.mjs [options]
 *
 * Options:
 *   --env <name>        Check specific environment (main|develop|all) [default: all]
 *   --profile <name>    Check specific profile (manager|writer|reader)
 *   --fix               Auto-fix invalid credentials (regenerate)
 *   --verbose           Show detailed validation results
 *   --json              Output results in JSON format
 *
 * Examples:
 *   node scripts/validate-auth-credentials.mjs
 *   node scripts/validate-auth-credentials.mjs --env develop --verbose
 *   node scripts/validate-auth-credentials.mjs --fix
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AUTH_FILE_PATH = path.join(__dirname, "../.auth/user.json");
const PASSWORD_LENGTH = 24;
const API_KEY_MIN_LENGTH = 40; // Minimum length without 'fic_' prefix (base64url encoded)
const API_KEY_MAX_LENGTH = 50; // Maximum length without 'fic_' prefix (base64url encoded)
const API_KEY_PREFIX = "fic_";

// Validation rules
const VALIDATION_RULES = {
    password: {
        minLength: PASSWORD_LENGTH,
        maxLength: PASSWORD_LENGTH,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        allowedSpecialChars: "!@#$%^&*",
    },
    apiKey: {
        prefix: API_KEY_PREFIX,
        minLengthAfterPrefix: API_KEY_MIN_LENGTH,
        maxLengthAfterPrefix: API_KEY_MAX_LENGTH,
        allowedChars:
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_",
    },
};

/**
 * Load the authentication file
 * @returns {Object} Authentication data
 */
function loadAuthFile() {
    if (!fs.existsSync(AUTH_FILE_PATH)) {
        throw new Error(`Authentication file not found: ${AUTH_FILE_PATH}`);
    }

    const content = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
    return JSON.parse(content);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with errors
 */
function validatePassword(password) {
    const errors = [];
    const rules = VALIDATION_RULES.password;

    // Check length
    if (password.length < rules.minLength) {
        errors.push(
            `Password too short (${password.length} chars, expected ${rules.minLength})`,
        );
    } else if (password.length > rules.maxLength) {
        errors.push(
            `Password too long (${password.length} chars, expected ${rules.maxLength})`,
        );
    }

    // Check character requirements
    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("Missing uppercase letters");
    }

    if (rules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("Missing lowercase letters");
    }

    if (rules.requireNumbers && !/[0-9]/.test(password)) {
        errors.push("Missing numbers");
    }

    if (rules.requireSpecial) {
        const specialChars = rules.allowedSpecialChars.split("");
        const hasSpecial = specialChars.some((char) => password.includes(char));
        if (!hasSpecial) {
            errors.push(
                `Missing special characters (allowed: ${rules.allowedSpecialChars})`,
            );
        }
    }

    // Check for invalid characters
    const allowedPattern = new RegExp(
        `^[a-zA-Z0-9${rules.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]+$`,
    );
    if (!allowedPattern.test(password)) {
        errors.push("Contains invalid characters");
    }

    // Calculate strength score
    const score = {
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumbers: /[0-9]/.test(password),
        hasSpecial: new RegExp(
            `[${rules.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
        ).test(password),
        properLength: password.length === rules.minLength,
    };

    const strengthScore = Object.values(score).filter(Boolean).length;
    const strength =
        strengthScore === 5 ? "Strong" : strengthScore >= 3 ? "Medium" : "Weak";

    return {
        valid: errors.length === 0,
        errors,
        strength,
        score,
        length: password.length,
    };
}

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result with errors
 */
function validateApiKey(apiKey) {
    const errors = [];
    const rules = VALIDATION_RULES.apiKey;

    // Check prefix
    if (!apiKey.startsWith(rules.prefix)) {
        errors.push(`Missing prefix "${rules.prefix}"`);
    }

    // Extract key part (after prefix)
    const keyPart = apiKey.startsWith(rules.prefix)
        ? apiKey.slice(rules.prefix.length)
        : apiKey;

    // Check length
    if (keyPart.length < rules.minLengthAfterPrefix) {
        errors.push(
            `Too short (${keyPart.length} chars after prefix, min ${rules.minLengthAfterPrefix})`,
        );
    } else if (keyPart.length > rules.maxLengthAfterPrefix) {
        errors.push(
            `Too long (${keyPart.length} chars after prefix, max ${rules.maxLengthAfterPrefix})`,
        );
    }

    // Check allowed characters
    const invalidChars = keyPart
        .split("")
        .filter((char) => !rules.allowedChars.includes(char));
    if (invalidChars.length > 0) {
        errors.push(
            `Invalid characters: ${[...new Set(invalidChars)].join(", ")}`,
        );
    }

    // Check for common weak patterns
    const weakPatterns = [
        { pattern: /^(.)\1+$/, message: "All same character" },
        { pattern: /^(01|10|abc|xyz)+$/i, message: "Sequential pattern" },
        { pattern: /^[0-9]+$/, message: "Only numbers" },
        { pattern: /^[a-zA-Z]+$/, message: "Only letters" },
    ];

    const weakPattern = weakPatterns.find((wp) => wp.pattern.test(keyPart));
    if (weakPattern) {
        errors.push(`Weak pattern detected: ${weakPattern.message}`);
    }

    // Calculate entropy (estimate)
    const uniqueChars = new Set(keyPart.split("")).size;
    const entropy = Math.log2(rules.allowedChars.length ** keyPart.length);
    const quality =
        uniqueChars >= keyPart * 0.7
            ? "Good"
            : uniqueChars >= keyPart * 0.5
              ? "Fair"
              : "Poor";

    return {
        valid: errors.length === 0,
        errors,
        quality,
        entropy: Math.round(entropy),
        uniqueChars,
        length: keyPart.length,
        fullLength: apiKey.length,
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {Object} Validation result
 */
function validateEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailPattern.test(email);
    const expectedDomain = "fictures.xyz";
    const hasCorrectDomain = email.endsWith(`@${expectedDomain}`);

    return {
        valid,
        hasCorrectDomain,
        errors: [
            ...(!valid ? ["Invalid email format"] : []),
            ...(!hasCorrectDomain
                ? [`Expected domain @${expectedDomain}`]
                : []),
        ],
    };
}

/**
 * Validate all credentials in the auth file
 * @param {Object} options - Validation options
 * @returns {Object} Validation results
 */
function validateCredentials(options = {}) {
    const {
        environments = ["main", "develop"],
        profiles = null, // null means all profiles
    } = options;

    const authData = loadAuthFile();
    const results = {
        timestamp: new Date().toISOString(),
        file: AUTH_FILE_PATH,
        summary: {
            total: 0,
            valid: 0,
            invalid: 0,
            warnings: 0,
        },
        environments: {},
    };

    for (const env of environments) {
        if (!authData[env]) {
            results.environments[env] = {
                error: `Environment not found in auth file`,
            };
            continue;
        }

        results.environments[env] = {
            profiles: {},
        };

        const profileNames = profiles || Object.keys(authData[env].profiles);

        for (const profile of profileNames) {
            if (!authData[env].profiles[profile]) {
                results.environments[env].profiles[profile] = {
                    error: `Profile not found in environment`,
                };
                continue;
            }

            results.summary.total++;

            const creds = authData[env].profiles[profile];
            const emailValidation = validateEmail(creds.email);
            const passwordValidation = validatePassword(creds.password);
            const apiKeyValidation = validateApiKey(creds.apiKey);

            const isValid =
                emailValidation.valid &&
                passwordValidation.valid &&
                apiKeyValidation.valid;

            const hasWarnings =
                !emailValidation.hasCorrectDomain ||
                passwordValidation.strength !== "Strong" ||
                apiKeyValidation.quality !== "Good";

            if (isValid) {
                results.summary.valid++;
            } else {
                results.summary.invalid++;
            }

            if (hasWarnings) {
                results.summary.warnings++;
            }

            results.environments[env].profiles[profile] = {
                email: {
                    value: creds.email,
                    ...emailValidation,
                },
                password: {
                    value: `${creds.password.slice(0, 4)}...${creds.password.slice(-4)}`, // Partially masked
                    ...passwordValidation,
                },
                apiKey: {
                    value: `${creds.apiKey.slice(0, 8)}...${creds.apiKey.slice(-4)}`, // Partially masked
                    ...apiKeyValidation,
                },
                overall: {
                    valid: isValid,
                    hasWarnings,
                    status: isValid
                        ? hasWarnings
                            ? "Valid (with warnings)"
                            : "Valid"
                        : "Invalid",
                },
            };
        }
    }

    return results;
}

/**
 * Display validation results in a formatted table
 * @param {Object} results - Validation results
 * @param {boolean} verbose - Show detailed output
 */
function displayResults(results, verbose = false) {
    console.log("\n🔐 Authentication Credentials Validation Report");
    console.log("═".repeat(80));
    console.log(`File: ${results.file}`);
    console.log(`Timestamp: ${results.timestamp}`);
    console.log("");

    // Summary
    console.log("📊 Summary:");
    console.log(`  Total profiles checked: ${results.summary.total}`);
    console.log(`  ✅ Valid: ${results.summary.valid}`);
    console.log(`  ❌ Invalid: ${results.summary.invalid}`);
    console.log(`  ⚠️  Warnings: ${results.summary.warnings}`);
    console.log("");

    // Environment results
    for (const [env, envData] of Object.entries(results.environments)) {
        if (envData.error) {
            console.log(`❌ Environment: ${env} - ${envData.error}`);
            continue;
        }

        console.log(`📍 Environment: ${env}`);
        console.log("─".repeat(80));

        for (const [profile, data] of Object.entries(envData.profiles)) {
            if (data.error) {
                console.log(`  ❌ Profile: ${profile} - ${data.error}`);
                continue;
            }

            const statusIcon = data.overall.valid ? "✅" : "❌";
            console.log(
                `\n  ${statusIcon} Profile: ${profile} - ${data.overall.status}`,
            );

            if (verbose || !data.overall.valid || data.overall.hasWarnings) {
                // Email
                console.log(`     Email: ${data.email.value}`);
                if (data.email.errors.length > 0) {
                    for (const err of data.email.errors) {
                        console.log(`       ❌ ${err}`);
                    }
                }

                // Password
                console.log(`     Password: ${data.password.value}`);
                console.log(`       Length: ${data.password.length} chars`);
                console.log(`       Strength: ${data.password.strength}`);
                if (verbose) {
                    console.log(
                        `       Components: ` +
                            `${data.password.score.hasUppercase ? "✓" : "✗"} Uppercase, ` +
                            `${data.password.score.hasLowercase ? "✓" : "✗"} Lowercase, ` +
                            `${data.password.score.hasNumbers ? "✓" : "✗"} Numbers, ` +
                            `${data.password.score.hasSpecial ? "✓" : "✗"} Special`,
                    );
                }
                if (data.password.errors.length > 0) {
                    for (const err of data.password.errors) {
                        console.log(`       ❌ ${err}`);
                    }
                }

                // API Key
                console.log(`     API Key: ${data.apiKey.value}`);
                console.log(
                    `       Length: ${data.apiKey.length} chars (after prefix)`,
                );
                console.log(`       Quality: ${data.apiKey.quality}`);
                if (verbose) {
                    console.log(`       Entropy: ${data.apiKey.entropy} bits`);
                    console.log(
                        `       Unique chars: ${data.apiKey.uniqueChars}/${data.apiKey.length}`,
                    );
                }
                if (data.apiKey.errors.length > 0) {
                    for (const err of data.apiKey.errors) {
                        console.log(`       ❌ ${err}`);
                    }
                }
            }
        }

        console.log("");
    }

    // Overall status
    console.log("═".repeat(80));
    if (results.summary.invalid === 0) {
        console.log("✅ All credentials are valid!");
        if (results.summary.warnings > 0) {
            console.log(
                `⚠️  However, ${results.summary.warnings} profile(s) have warnings. Run with --verbose for details.`,
            );
        }
    } else {
        console.log(
            `❌ Found ${results.summary.invalid} invalid credential(s). Please fix them.`,
        );
    }
    console.log("");
}

/**
 * Generate credentials (for auto-fix)
 */
function generateCredentials() {
    const { execSync } = require("node:child_process");
    const output = execSync(
        "node scripts/generate-auth-credentials.mjs --all",
        {
            cwd: path.join(__dirname, ".."),
            encoding: "utf-8",
        },
    );
    return output;
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        environments: [],
        profiles: null,
        fix: false,
        verbose: false,
        json: false,
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case "--env": {
                const envArg = args[++i];
                if (envArg === "all") {
                    options.environments = ["main", "develop"];
                } else {
                    options.environments.push(envArg);
                }
                break;
            }
            case "--profile":
                if (!options.profiles) options.profiles = [];
                options.profiles.push(args[++i]);
                break;
            case "--fix":
                options.fix = true;
                break;
            case "--verbose":
                options.verbose = true;
                break;
            case "--json":
                options.json = true;
                break;
            case "--help":
            case "-h":
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
    if (options.environments.length === 0) {
        options.environments = ["main", "develop"];
    }

    return options;
}

/**
 * Display help message
 */
function displayHelp() {
    console.log(`
Validate Authentication Credentials

Usage:
  node scripts/validate-auth-credentials.mjs [options]

Options:
  --env <name>        Check specific environment (main|develop|all) [default: all]
  --profile <name>    Check specific profile (manager|writer|reader)
  --fix               Auto-fix invalid credentials (regenerate)
  --verbose           Show detailed validation results
  --json              Output results in JSON format
  --help, -h          Show this help message

Examples:
  node scripts/validate-auth-credentials.mjs
  node scripts/validate-auth-credentials.mjs --env develop --verbose
  node scripts/validate-auth-credentials.mjs --profile writer
  node scripts/validate-auth-credentials.mjs --fix
  node scripts/validate-auth-credentials.mjs --json > results.json
  `);
}

/**
 * Main function
 */
async function main() {
    const options = parseArgs();

    try {
        const results = validateCredentials({
            environments: options.environments,
            profiles: options.profiles,
        });

        if (options.json) {
            console.log(JSON.stringify(results, null, 2));
            process.exit(results.summary.invalid > 0 ? 1 : 0);
        }

        displayResults(results, options.verbose);

        if (results.summary.invalid > 0 && options.fix) {
            console.log(
                "🔧 Auto-fix requested. Regenerating invalid credentials...\n",
            );
            generateCredentials();
            console.log(
                "✅ Credentials regenerated. Please run validation again to verify.\n",
            );
        }

        process.exit(results.summary.invalid > 0 ? 1 : 0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (options.verbose) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the script
main();
