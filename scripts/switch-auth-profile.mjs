import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function switchProfile(profileName) {
  const authFilePath = path.join(__dirname, '..', '.auth', 'user.json');

  try {
    const fileContent = await fs.readFile(authFilePath, 'utf-8');
    const authData = JSON.parse(fileContent);

    if (!authData.profiles || !authData.profiles[profileName]) {
      console.error(`Profile "${profileName}" not found!`);
      console.log('Available profiles:', Object.keys(authData.profiles).join(', '));
      process.exit(1);
    }

    authData.defaultProfile = profileName;

    await fs.writeFile(authFilePath, JSON.stringify(authData, null, 2));

    const profile = authData.profiles[profileName];
    console.log(`✓ Switched to profile: ${profileName}`);
    console.log('\nProfile Details:');
    console.log(`  Email: ${profile.email}`);
    console.log(`  Name: ${profile.name}`);
    console.log(`  Role: ${profile.role}`);
    console.log(`  User ID: ${profile.userId}`);
    if (profile.password) {
      console.log(`  Password: ${profile.password}`);
    }
    console.log(`  API Key: ${profile.apiKey.substring(0, 20)}...`);
    console.log(`  API Scopes: ${profile.apiKeyScopes.join(', ')}`);

  } catch (error) {
    console.error('Error switching profile:', error.message);
    process.exit(1);
  }
}

const profileName = process.argv[2];

if (!profileName) {
  console.error('Usage: node switch-auth-profile.mjs <profile-name>');
  console.error('Example: node switch-auth-profile.mjs manager');
  console.error('         node switch-auth-profile.mjs reader');
  process.exit(1);
}

switchProfile(profileName);
