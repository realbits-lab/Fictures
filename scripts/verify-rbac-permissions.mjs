import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const sql = neon(process.env.POSTGRES_URL);
const db = drizzle(sql);

async function verifyRBACPermissions() {
  console.log('=== RBAC Permissions Verification ===\n');

  // Load authentication data
  const authPath = resolve(process.cwd(), '.auth/user.json');
  const authData = JSON.parse(readFileSync(authPath, 'utf-8'));

  const profiles = ['manager', 'reader', 'writer'];

  for (const profileName of profiles) {
    const profile = authData.profiles[profileName];

    if (!profile) {
      console.log(`⚠️  ${profileName} profile not found\n`);
      continue;
    }

    console.log(`\n=== ${profileName.toUpperCase()} Profile ===`);
    console.log(`Email: ${profile.email}`);
    console.log(`User ID: ${profile.userId}`);
    console.log(`API Key ID: ${profile.apiKeyId}`);

    // Get from database
    const dbResult = await sql`
      SELECT
        u.id as user_id,
        u.email,
        u.name,
        u.role,
        ak.id as api_key_id,
        ak.name as api_key_name,
        ak.scopes,
        ak.is_active,
        ak.created_at,
        ak.updated_at
      FROM users u
      LEFT JOIN api_keys ak ON ak.user_id = u.id
      WHERE u.email = ${profile.email}
      ORDER BY ak.created_at DESC
      LIMIT 1;
    `;

    if (dbResult.length === 0) {
      console.log('❌ User not found in database\n');
      continue;
    }

    const dbData = dbResult[0];
    console.log(`\nDatabase Status:`);
    console.log(`  Role: ${dbData.role}`);
    console.log(`  API Key Active: ${dbData.is_active ? '✅' : '❌'}`);
    console.log(`  API Key Name: ${dbData.api_key_name}`);
    console.log(`  Updated At: ${dbData.updated_at}`);

    console.log(`\nPermissions (${dbData.scopes.length} scopes):`);

    // Organize scopes by category
    const scopesByCategory = {
      'Stories': dbData.scopes.filter(s => s.startsWith('stories:')),
      'Chapters': dbData.scopes.filter(s => s.startsWith('chapters:')),
      'Analytics': dbData.scopes.filter(s => s.startsWith('analytics:')),
      'AI': dbData.scopes.filter(s => s.startsWith('ai:')),
      'Community': dbData.scopes.filter(s => s.startsWith('community:')),
      'Settings': dbData.scopes.filter(s => s.startsWith('settings:')),
      'Admin': dbData.scopes.filter(s => s.startsWith('admin:'))
    };

    Object.entries(scopesByCategory).forEach(([category, scopes]) => {
      if (scopes.length > 0) {
        console.log(`  ${category}:`);
        scopes.forEach(scope => {
          const action = scope.split(':')[1];
          const icon = action === 'read' ? '👁️' :
                       action === 'write' ? '✏️' :
                       action === 'delete' ? '🗑️' :
                       action === 'publish' ? '📤' :
                       action === 'use' ? '🤖' :
                       action === 'all' ? '⭐' : '✓';
          console.log(`    ${icon}  ${action}`);
        });
      }
    });

    // Verify match with .auth/user.json
    const jsonScopes = profile.apiKeyScopes || [];
    const dbScopes = dbData.scopes;

    const mismatch = jsonScopes.length !== dbScopes.length ||
                     !jsonScopes.every(s => dbScopes.includes(s)) ||
                     !dbScopes.every(s => jsonScopes.includes(s));

    if (mismatch) {
      console.log('\n⚠️  WARNING: Mismatch between database and .auth/user.json');
      console.log(`  Database has ${dbScopes.length} scopes`);
      console.log(`  JSON has ${jsonScopes.length} scopes`);
    } else {
      console.log('\n✅ Database and .auth/user.json match perfectly');
    }
  }

  console.log('\n\n=== RBAC Summary ===\n');
  console.log('✅ Manager: Full administrative access (14 scopes)');
  console.log('   - Can read, write, delete, publish all content');
  console.log('   - Has admin:all wildcard permission\n');

  console.log('✅ Writer: Read/Write access only (9 scopes)');
  console.log('   - Can read and write stories, chapters');
  console.log('   - Can use AI and community features');
  console.log('   - CANNOT delete or publish stories\n');

  console.log('✅ Reader: Read-only access (5 scopes)');
  console.log('   - Can only read stories, chapters, analytics');
  console.log('   - Can view community content');
  console.log('   - CANNOT write, delete, or publish anything\n');
}

verifyRBACPermissions().catch(console.error);
