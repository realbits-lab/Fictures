import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  name: string;
  username?: string;
}

export interface TestCredentials {
  testUser: TestUser;
  allTestUsers: {
    [key: string]: TestUser;
  };
}

/**
 * Securely loads test credentials from @playwright/.auth/user.json
 * This prevents hardcoding passwords in source code
 */
export function loadTestCredentials(): TestCredentials {
  const authFilePath = join(process.cwd(), '@playwright/.auth/user.json');
  
  if (!existsSync(authFilePath)) {
    throw new Error(`Test credentials file not found at ${authFilePath}`);
  }

  try {
    const authData = JSON.parse(readFileSync(authFilePath, 'utf-8'));
    
    if (!authData.testUser || !authData.allTestUsers) {
      throw new Error('Invalid test credentials file format');
    }

    return {
      testUser: authData.testUser,
      allTestUsers: authData.allTestUsers
    };
  } catch (error) {
    throw new Error(`Failed to load test credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get credentials for a specific user role
 */
export function getUserCredentials(role: 'reader' | 'writer' | 'admin'): TestUser {
  const credentials = loadTestCredentials();
  const user = credentials.allTestUsers[role];
  
  if (!user) {
    throw new Error(`No credentials found for role: ${role}`);
  }
  
  return user;
}

/**
 * Get the default test user credentials
 */
export function getDefaultTestUser(): TestUser {
  const credentials = loadTestCredentials();
  return credentials.testUser;
}

/**
 * Get all available test users
 */
export function getAllTestUsers(): { [key: string]: TestUser } {
  const credentials = loadTestCredentials();
  return credentials.allTestUsers;
}