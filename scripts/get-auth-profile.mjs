import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getAuthProfile() {
  const authFilePath = path.join(__dirname, '..', '.auth', 'user.json');

  try {
    const fileContent = await fs.readFile(authFilePath, 'utf-8');
    const authData = JSON.parse(fileContent);

    const defaultProfile = authData.defaultProfile || 'manager';
    const profile = authData.profiles[defaultProfile];

    console.log('=== Current Authentication Profile ===\n');
    console.log(`Active Profile: ${defaultProfile}`);
    console.log(`Email: ${profile.email}`);
    console.log(`Name: ${profile.name}`);
    console.log(`Role: ${profile.role}`);
    console.log(`User ID: ${profile.userId}`);
    if (profile.password) {
      console.log(`Password: ${profile.password}`);
    }
    console.log(`API Key: ${profile.apiKey.substring(0, 20)}...${profile.apiKey.substring(profile.apiKey.length - 4)}`);
    console.log(`API Key ID: ${profile.apiKeyId}`);
    console.log(`API Scopes: ${profile.apiKeyScopes.join(', ')}`);
    console.log(`\nAvailable Profiles: ${Object.keys(authData.profiles).join(', ')}`);

    console.log('\n=== Full Profile Data ===');
    console.log(JSON.stringify(profile, null, 2));

  } catch (error) {
    console.error('Error reading auth profile:', error.message);
    process.exit(1);
  }
}

getAuthProfile();
