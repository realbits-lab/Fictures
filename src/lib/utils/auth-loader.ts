/**
 * Auth Loader Utility
 *
 * Loads environment-aware authentication profiles from .auth/user.json
 */

import fs from 'fs';
import path from 'path';
import { getFicturesEnv, type FicturesEnvironment } from './environment';

export interface UserProfile {
  email: string;
  password: string;
  apiKey: string;
}

export interface AuthProfiles {
  manager: UserProfile;
  writer: UserProfile;
  reader: UserProfile;
}

export interface AuthData {
  main: {
    profiles: AuthProfiles;
  };
  develop: {
    profiles: AuthProfiles;
  };
}

/**
 * Get path to auth file
 */
export function getAuthFilePath(): string {
  // Try to find the auth file from current working directory
  const cwd = process.cwd();
  return path.join(cwd, '.auth', 'user.json');
}

/**
 * Load complete auth data from file
 *
 * @returns Complete auth data with main and develop environments
 * @throws Error if file doesn't exist or is invalid
 */
export function loadAuthData(): AuthData {
  const authPath = getAuthFilePath();

  if (!fs.existsSync(authPath)) {
    throw new Error(
      `Auth file not found at ${authPath}. Run 'pnpm exec tsx scripts/setup-auth-users.ts' to create it.`
    );
  }

  try {
    const content = fs.readFileSync(authPath, 'utf-8');
    const data = JSON.parse(content) as AuthData;

    // Validate structure
    if (!data.main || !data.develop) {
      throw new Error(
        'Invalid auth file structure. Expected main and develop environments.'
      );
    }

    if (!data.main.profiles || !data.develop.profiles) {
      throw new Error('Invalid auth file structure. Expected profiles in both environments.');
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in auth file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load profiles for specific environment
 *
 * @param env - Environment to load (defaults to current environment)
 * @returns Auth profiles for specified environment
 */
export function loadProfiles(env?: FicturesEnvironment): AuthProfiles {
  const authData = loadAuthData();
  const environment = env || getFicturesEnv();

  return authData[environment].profiles;
}

/**
 * Load specific profile for specific environment
 *
 * @param role - User role (manager, writer, reader)
 * @param env - Environment to load (defaults to current environment)
 * @returns User profile for specified role and environment
 */
export function loadProfile(
  role: keyof AuthProfiles,
  env?: FicturesEnvironment
): UserProfile {
  const profiles = loadProfiles(env);
  const profile = profiles[role];

  if (!profile) {
    throw new Error(`Profile '${role}' not found in ${env || getFicturesEnv()} environment`);
  }

  return profile;
}

/**
 * Save auth data to file
 *
 * @param data - Complete auth data to save
 */
export function saveAuthData(data: AuthData): void {
  const authPath = getAuthFilePath();
  const authDir = path.dirname(authPath);

  // Ensure directory exists
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  fs.writeFileSync(authPath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Update profiles for specific environment
 *
 * @param env - Environment to update
 * @param profiles - New profiles for environment
 */
export function updateProfiles(env: FicturesEnvironment, profiles: AuthProfiles): void {
  const authData = loadAuthData();
  authData[env].profiles = profiles;
  saveAuthData(authData);
}

/**
 * Update specific profile
 *
 * @param role - User role to update
 * @param profile - New profile data
 * @param env - Environment to update (defaults to current environment)
 */
export function updateProfile(
  role: keyof AuthProfiles,
  profile: UserProfile,
  env?: FicturesEnvironment
): void {
  const authData = loadAuthData();
  const environment = env || getFicturesEnv();
  authData[environment].profiles[role] = profile;
  saveAuthData(authData);
}
