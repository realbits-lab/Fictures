#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function checkPanels() {
  try {
    const sceneId = 's25ARzn_TttzuO9r5lvX3';
    
    console.log('\n🎨 Checking comic panels for "The Glitch in the Machine"');
    console.log(`   Scene ID: ${sceneId}\n`);
    
    const panels = await sql`
      SELECT
        id,
        panel_number,
        shot_type,
        image_url IS NOT NULL as has_image,
        image_variants IS NOT NULL as has_variants,
        dialogue,
        sfx,
        created_at
      FROM comic_panels
      WHERE scene_id = ${sceneId}
      ORDER BY panel_number
    `;
    
    if (panels.length === 0) {
      console.log('   ❌ No panels found');
    } else {
      console.log(`   ✅ Found ${panels.length} panel(s):\n`);
      panels.forEach(panel => {
        console.log(`   Panel ${panel.panel_number}:`);
        console.log(`      Type: ${panel.shot_type}`);
        console.log(`      Image: ${panel.has_image ? '✅ Yes' : '❌ No'}`);
        console.log(`      Variants: ${panel.has_variants ? '✅ Yes' : '❌ No'}`);
        console.log(`      Dialogue: ${panel.dialogue?.length || 0} lines`);
        console.log(`      SFX: ${panel.sfx?.length || 0} effects`);
        console.log(`      Created: ${panel.created_at}\n`);
      });
    }
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

checkPanels();
