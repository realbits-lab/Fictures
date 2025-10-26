#!/usr/bin/env node

import postgres from 'postgres';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

async function listImageUrls() {
  try {
    const sceneId = 's25ARzn_TttzuO9r5lvX3';

    console.log('\n🖼️  Comic Panel Image URLs for "The Glitch in the Machine"');
    console.log(`   Scene ID: ${sceneId}\n`);

    const panels = await sql`
      SELECT
        panel_number,
        shot_type,
        image_url,
        image_variants
      FROM comic_panels
      WHERE scene_id = ${sceneId}
      ORDER BY panel_number
    `;

    if (panels.length === 0) {
      console.log('   ❌ No panels found');
    } else {
      panels.forEach(panel => {
        console.log(`\n📸 Panel ${panel.panel_number} (${panel.shot_type}):`);
        console.log(`   Original URL: ${panel.image_url || 'NULL'}`);

        if (panel.image_variants) {
          console.log(`   Variants Count: ${panel.image_variants.variants?.length || 0}`);
          if (panel.image_variants.variants && panel.image_variants.variants.length > 0) {
            console.log(`   Sample Variant URLs:`);
            panel.image_variants.variants.slice(0, 3).forEach((variant, idx) => {
              console.log(`      ${idx + 1}. ${variant.format} (${variant.width}×${variant.height}): ${variant.url}`);
            });
          }
        } else {
          console.log(`   Variants: NULL`);
        }
      });
    }

    await sql.end();

  } catch (error) {
    console.error('❌ Error:', error.message);
    await sql.end();
    process.exit(1);
  }
}

listImageUrls();
