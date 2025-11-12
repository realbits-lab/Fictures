/**
 * Authentication Data Loader
 *
 * Utilities for loading and saving authentication credentials from .auth/user.json
 * with environment-aware profile selection.
 *
 * Environment Detection:
 * - NODE_ENV=development → uses "develop" profiles
 * - NODE_ENV=production → uses "main" profiles
 */

import fs from "fs";
import path from "path";

export interface ProfileData {
    email: string;
    password: string;
    apiKey: string;
}

export interface EnvironmentProfiles {
    profiles: {
        manager: ProfileData;
        writer: ProfileData;
        reader: ProfileData;
    };
}

export interface AuthData {
    main: EnvironmentProfiles;
    develop: EnvironmentProfiles;
}

const AUTH_FILE_PATH = path.join(process.cwd(), ".auth", "user.json");

/**
 * Get current environment name based on NODE_ENV
 */
export function getEnvironmentName(): "main" | "develop" {
    return process.env.NODE_ENV === "production" ? "main" : "develop";
}

/**
 * Load authentication data from .auth/user.json
 */
export function loadAuthData(): AuthData {
    try {
        const fileContent = fs.readFileSync(AUTH_FILE_PATH, "utf-8");
        return JSON.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to load auth data from ${AUTH_FILE_PATH}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
}

/**
 * Save authentication data to .auth/user.json
 */
export function saveAuthData(data: AuthData): void {
    try {
        // Ensure .auth directory exists
        const authDir = path.dirname(AUTH_FILE_PATH);
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        // Write with pretty formatting
        fs.writeFileSync(
            AUTH_FILE_PATH,
            JSON.stringify(data, null, 2),
            "utf-8",
        );
    } catch (error) {
        throw new Error(
            `Failed to save auth data to ${AUTH_FILE_PATH}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
    }
}

/**
 * Load a specific profile for the current environment
 */
export function loadProfile(
    role: "manager" | "writer" | "reader",
): ProfileData {
    const authData = loadAuthData();
    const env = getEnvironmentName();
    return authData[env].profiles[role];
}

/**
 * Load all profiles for the current environment
 */
export function loadAllProfiles(): {
    manager: ProfileData;
    writer: ProfileData;
    reader: ProfileData;
} {
    const authData = loadAuthData();
    const env = getEnvironmentName();
    return authData[env].profiles;
}
