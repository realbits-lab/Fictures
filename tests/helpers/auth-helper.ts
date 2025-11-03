import fs from 'fs';
import path from 'path';

export interface AuthData {
  userId: string;
  email: string;
  password: string;
  name: string;
  username?: string;
  role: 'writer' | 'reader' | 'manager';
  apiKey: string;
  apiKeyId: string;
  apiKeyCreatedAt: string;
  apiKeyScopes: string[];
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: string;
  }>;
  origins: Array<{
    origin: string;
    localStorage: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

/**
 * Read authentication data for a specific role
 * @param role - The role to read auth data for (writer, reader, manager)
 * @returns The authentication data including API key and credentials
 */
export function getAuthData(role: 'writer' | 'reader' | 'manager'): AuthData {
  const authFilePath = path.join(process.cwd(), '.auth', `${role}.json`);

  if (!fs.existsSync(authFilePath)) {
    throw new Error(`Auth file not found for role: ${role} at ${authFilePath}`);
  }

  const authData = JSON.parse(fs.readFileSync(authFilePath, 'utf-8'));
  return authData;
}

/**
 * Get API key for a specific role
 * @param role - The role to get API key for
 * @returns The API key string
 */
export function getApiKey(role: 'writer' | 'reader' | 'manager'): string {
  const authData = getAuthData(role);
  return authData.apiKey;
}

/**
 * Get user credentials for a specific role
 * @param role - The role to get credentials for
 * @returns Object with email and password
 */
export function getCredentials(role: 'writer' | 'reader' | 'manager'): {
  email: string;
  password: string;
} {
  const authData = getAuthData(role);
  return {
    email: authData.email,
    password: authData.password,
  };
}

/**
 * Get user ID for a specific role
 * @param role - The role to get user ID for
 * @returns The user ID string
 */
export function getUserId(role: 'writer' | 'reader' | 'manager'): string {
  const authData = getAuthData(role);
  return authData.userId;
}

/**
 * Get API scopes for a specific role
 * @param role - The role to get API scopes for
 * @returns Array of scope strings
 */
export function getApiScopes(role: 'writer' | 'reader' | 'manager'): string[] {
  const authData = getAuthData(role);
  return authData.apiKeyScopes;
}

/**
 * Check if a role has a specific API scope
 * @param role - The role to check
 * @param scope - The scope to check for
 * @returns True if the role has the scope
 */
export function hasScope(
  role: 'writer' | 'reader' | 'manager',
  scope: string
): boolean {
  const scopes = getApiScopes(role);
  return scopes.includes(scope);
}

/**
 * Get authorization header for API requests
 * @param role - The role to get authorization for
 * @returns Object with Authorization header
 */
export function getAuthHeader(role: 'writer' | 'reader' | 'manager'): {
  Authorization: string;
} {
  const apiKey = getApiKey(role);
  return {
    Authorization: `Bearer ${apiKey}`,
  };
}
