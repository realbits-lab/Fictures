/**
 * Test Authentication Helper
 *
 * Loads authentication profiles from .auth/user.json for test files.
 * Supports environment-based profile selection (main/develop).
 *
 * Usage:
 *   import { loadWriterAuth } from '@/__tests__/helpers/auth-loader';
 *   const apiKey = loadWriterAuth();
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Authentication data structure from .auth/user.json
 */
interface AuthData {
    [environment: string]: {
        profiles: {
            writer: { apiKey?: string };
            reader?: { apiKey?: string };
            manager?: { apiKey?: string };
        };
    };
}

/**
 * Load writer authentication profile from .auth/user.json
 *
 * @returns Writer API key
 * @throws Error if .auth/user.json is not found or writer API key is missing
 *
 * @example
 * const apiKey = loadWriterAuth();
 * const response = await fetch('http://localhost:3000/studio/api/stories', {
 *   headers: { 'x-api-key': apiKey }
 * });
 */
export function loadWriterAuth(): string {
    // 1. Load authentication file
    const authFilePath: string = path.join(process.cwd(), ".auth/user.json");
    const authData: AuthData = JSON.parse(
        fs.readFileSync(authFilePath, "utf-8"),
    );

    // 2. Determine environment (main/develop)
    const environment: "main" | "develop" =
        process.env.NODE_ENV === "production" ? "main" : "develop";

    // 3. Extract writer profile
    const writer: { apiKey?: string } = authData[environment].profiles.writer;

    // 4. Validate API key exists
    if (!writer?.apiKey) {
        throw new Error("❌ Writer API key not found in .auth/user.json");
    }

    // 5. Return API key
    return writer.apiKey;
}

/**
 * Load manager authentication profile from .auth/user.json
 *
 * @returns Manager API key
 * @throws Error if .auth/user.json is not found or manager API key is missing
 *
 * @example
 * const apiKey = loadManagerAuth();
 * const response = await fetch('http://localhost:3000/studio/api/reset-all', {
 *   headers: { 'x-api-key': apiKey }
 * });
 */
export function loadManagerAuth(): string {
    // 1. Load authentication file
    const authFilePath: string = path.join(process.cwd(), ".auth/user.json");
    const authData: AuthData = JSON.parse(
        fs.readFileSync(authFilePath, "utf-8"),
    );

    // 2. Determine environment (main/develop)
    const environment: "main" | "develop" =
        process.env.NODE_ENV === "production" ? "main" : "develop";

    // 3. Extract manager profile
    const manager: { apiKey?: string } | undefined =
        authData[environment].profiles.manager;

    // 4. Validate API key exists
    if (!manager?.apiKey) {
        throw new Error("❌ Manager API key not found in .auth/user.json");
    }

    // 5. Return API key
    return manager.apiKey;
}

/**
 * Load reader authentication profile from .auth/user.json
 *
 * @returns Reader API key
 * @throws Error if .auth/user.json is not found or reader API key is missing
 *
 * @example
 * const apiKey = loadReaderAuth();
 * const response = await fetch('http://localhost:3000/api/stories', {
 *   headers: { 'x-api-key': apiKey }
 * });
 */
export function loadReaderAuth(): string {
    // 1. Load authentication file
    const authFilePath: string = path.join(process.cwd(), ".auth/user.json");
    const authData: AuthData = JSON.parse(
        fs.readFileSync(authFilePath, "utf-8"),
    );

    // 2. Determine environment (main/develop)
    const environment: "main" | "develop" =
        process.env.NODE_ENV === "production" ? "main" : "develop";

    // 3. Extract reader profile
    const reader: { apiKey?: string } | undefined =
        authData[environment].profiles.reader;

    // 4. Validate API key exists
    if (!reader?.apiKey) {
        throw new Error("❌ Reader API key not found in .auth/user.json");
    }

    // 5. Return API key
    return reader.apiKey;
}
