import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

// Define correct RBAC scopes for each role
const ROLE_SCOPES = {
  manager: [
    // Stories - all permissions
    'stories:read',
    'stories:write',
    'stories:delete',
    'stories:publish',
    // Chapters - all permissions
    'chapters:read',
    'chapters:write',
    'chapters:delete',
    // Analytics - read permission
    'analytics:read',
    // AI - use permission
    'ai:use',
    // Community - all permissions
    'community:read',
    'community:write',
    // Settings - all permissions
    'settings:read',
    'settings:write',
    // Admin - full access
    'admin:all'
  ],
  writer: [
    // Stories - read and write only (no delete, no publish)
    'stories:read',
    'stories:write',
    // Chapters - read and write only
    'chapters:read',
    'chapters:write',
    // Analytics - read permission
    'analytics:read',
    // AI - use permission
    'ai:use',
    // Community - read and write
    'community:read',
    'community:write',
    // Settings - read only
    'settings:read'
  ],
  reader: [
    // Stories - read only
    'stories:read',
    // Chapters - read only
    'chapters:read',
    // Analytics - read only
    'analytics:read',
    // Community - read only
    'community:read',
    // Settings - read only
    'settings:read'
  ]
};

async function fixRBACPermissions() {
  console.log('=== RBAC Permissions Fix ===\n');

  // Load authentication data
  const authPath = resolve(process.cwd(), '.auth/user.json');
  const authData = JSON.parse(readFileSync(authPath, 'utf-8'));

  const profiles = ['manager', 'reader', 'writer'];
  const updates = [];

  for (const profileName of profiles) {
    const profile = authData.profiles[profileName];

    if (!profile) {
      console.log(`⚠️  ${profileName} profile not found in .auth/user.json\n`);
      continue;
    }

    console.log(`\n--- ${profileName.toUpperCase()} Profile ---`);
    console.log(`Email: ${profile.email}`);
    console.log(`User ID: ${profile.userId}`);
    console.log(`API Key ID: ${profile.apiKeyId}`);

    // Check current scopes
    const currentScopes = profile.apiKeyScopes || [];
    const correctScopes = ROLE_SCOPES[profileName];

    console.log(`\nCurrent scopes (${currentScopes.length}):`);
    currentScopes.forEach(scope => console.log(`  - ${scope}`));

    console.log(`\nCorrect scopes (${correctScopes.length}):`);
    correctScopes.forEach(scope => console.log(`  + ${scope}`));

    // Find differences
    const missing = correctScopes.filter(s => !currentScopes.includes(s));
    const extra = currentScopes.filter(s => !correctScopes.includes(s));

    if (missing.length > 0) {
      console.log(`\n❌ Missing scopes (${missing.length}):`);
      missing.forEach(scope => console.log(`  ! ${scope}`));
    }

    if (extra.length > 0) {
      console.log(`\n❌ Extra/incorrect scopes (${extra.length}):`);
      extra.forEach(scope => console.log(`  ! ${scope}`));
    }

    if (missing.length === 0 && extra.length === 0) {
      console.log('\n✅ Scopes are correct - no update needed');
      continue;
    }

    // Update database
    try {
      const result = await sql`
        UPDATE api_keys
        SET
          scopes = ${JSON.stringify(correctScopes)},
          updated_at = NOW()
        WHERE id = ${profile.apiKeyId}
        RETURNING id, scopes, updated_at;
      `;

      if (result.length > 0) {
        console.log('\n✅ Database updated successfully');
        console.log(`   Updated at: ${result[0].updated_at}`);

        // Update .auth/user.json
        profile.apiKeyScopes = correctScopes;
        updates.push({
          profile: profileName,
          oldScopes: currentScopes,
          newScopes: correctScopes
        });
      } else {
        console.log('\n⚠️  API key not found in database');
      }
    } catch (error) {
      console.error(`\n❌ Error updating ${profileName}:`, error.message);
    }
  }

  // Save updated .auth/user.json
  if (updates.length > 0) {
    writeFileSync(authPath, JSON.stringify(authData, null, 2));
    console.log('\n\n=== Summary ===');
    console.log(`✅ Updated ${updates.length} profile(s) in .auth/user.json`);
    console.log('✅ Updated API key scopes in database');

    console.log('\n=== RBAC Configuration ===');
    console.log('\nManager (manager@fictures.xyz):');
    console.log('  ✓ Full administrative access to all resources');
    console.log(`  ✓ ${ROLE_SCOPES.manager.length} scopes including admin:all`);

    console.log('\nWriter (writer@fictures.xyz):');
    console.log('  ✓ Read and write stories, chapters');
    console.log('  ✓ Use AI features and community');
    console.log('  ✗ Cannot delete or publish stories');
    console.log(`  ✓ ${ROLE_SCOPES.writer.length} scopes`);

    console.log('\nReader (reader@fictures.xyz):');
    console.log('  ✓ Read-only access to stories, chapters');
    console.log('  ✓ View analytics and community');
    console.log('  ✗ Cannot write, delete, or publish');
    console.log(`  ✓ ${ROLE_SCOPES.reader.length} scopes`);
  } else {
    console.log('\n\n=== Summary ===');
    console.log('✅ All profiles already have correct RBAC permissions');
  }
}

fixRBACPermissions().catch(console.error);
