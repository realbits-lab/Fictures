#!/usr/bin/env node

/**
 * Migrate existing comic panels from old path to new path
 *
 * Old: stories/{storyId}/scenes/{sceneId}/panels/panel-{n}-original.png
 * New: stories/{storyId}/comics/{sceneId}/panel-{n}.png
 *
 * This script:
 * 1. Lists all comic panels in the database
 * 2. For each panel, copies the blob from old path to new path
 * 3. Updates the database with new URLs
 * 4. Optionally deletes old blobs
 */

import postgres from 'postgres';
import { list, copy, del } from '@vercel/blob';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '../.env.local') });

const sql = postgres(process.env.POSTGRES_URL, { max: 1 });

async function migrateComicPanels() {
  console.log('\n🔄 Comic Panel Path Migration');
  console.log('================================\n');

  try {
    // Get all comic panels from database
    console.log('📊 Fetching comic panels from database...\n');
    const panels = await sql`
      SELECT
        id,
        scene_id,
        panel_number,
        image_url,
        image_variants
      FROM comic_panels
      ORDER BY scene_id, panel_number
    `;

    console.log(`Found ${panels.length} panels to migrate\n`);

    if (panels.length === 0) {
      console.log('No panels to migrate.');
      await sql.end();
      return;
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const panel of panels) {
      console.log(`\n📸 Panel ${panel.panel_number} (Scene: ${panel.scene_id})`);
      console.log(`   Current URL: ${panel.image_url}`);

      // Check if already using new path
      if (panel.image_url && panel.image_url.includes('/comics/')) {
        console.log('   ✓ Already using new path, skipping');
        skippedCount++;
        continue;
      }

      // Check if using old path
      if (!panel.image_url || !panel.image_url.includes('/scenes/')) {
        console.log('   ⚠️  Not using old path format, skipping');
        skippedCount++;
        continue;
      }

      try {
        // Extract story ID from URL
        const urlMatch = panel.image_url.match(/stories\/([^/]+)\/scenes\/([^/]+)\/panels\/panel-(\d+)-original\.png/);
        if (!urlMatch) {
          console.log('   ✗ Could not parse URL format');
          errorCount++;
          continue;
        }

        const [, storyId, sceneId, panelNum] = urlMatch;

        // New path format
        const newPath = `stories/${storyId}/comics/${sceneId}/panel-${panelNum}.png`;
        console.log(`   → New path: ${newPath}`);

        // Copy blob to new location
        console.log('   Copying blob...');
        const { url: newUrl } = await copy(panel.image_url, newPath, {
          access: 'public',
        });

        console.log(`   ✓ Copied to: ${newUrl}`);

        // Update database
        console.log('   Updating database...');
        await sql`
          UPDATE comic_panels
          SET
            image_url = ${newUrl},
            updated_at = NOW()
          WHERE id = ${panel.id}
        `;

        console.log('   ✓ Database updated');

        // Handle image variants if they exist
        if (panel.image_variants?.variants) {
          console.log(`   Migrating ${panel.image_variants.variants.length} variants...`);

          const newVariants = await Promise.all(
            panel.image_variants.variants.map(async (variant) => {
              try {
                // Extract variant path parts
                const variantMatch = variant.url.match(/stories\/[^/]+\/(panel)\/([^/]+)\/([^/]+)\/([^/]+)$/);
                if (!variantMatch) {
                  console.log(`   ⚠️  Could not parse variant URL: ${variant.url}`);
                  return variant; // Keep original if can't parse
                }

                const [, , format, size, filename] = variantMatch;

                // New variant path
                const newVariantPath = `stories/${storyId}/panel/${format}/${size}/${filename}`;

                // Copy variant
                const { url: newVariantUrl } = await copy(variant.url, newVariantPath, {
                  access: 'public',
                });

                return {
                  ...variant,
                  url: newVariantUrl
                };
              } catch (error) {
                console.log(`   ⚠️  Error copying variant: ${error.message}`);
                return variant; // Keep original on error
              }
            })
          );

          // Update variants in database
          const newImageVariants = {
            ...panel.image_variants,
            variants: newVariants,
            originalUrl: newUrl
          };

          await sql`
            UPDATE comic_panels
            SET
              image_variants = ${JSON.stringify(newImageVariants)},
              updated_at = NOW()
            WHERE id = ${panel.id}
          `;

          console.log('   ✓ Variants migrated');
        }

        migratedCount++;
        console.log('   ✅ Migration complete');

      } catch (error) {
        console.error(`   ✗ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n================================');
    console.log('Migration Summary:');
    console.log(`  ✅ Migrated: ${migratedCount}`);
    console.log(`  ⏭️  Skipped:  ${skippedCount}`);
    console.log(`  ✗ Errors:   ${errorCount}`);
    console.log('================================\n');

    // Ask about cleanup
    if (migratedCount > 0) {
      console.log('⚠️  Old blobs are still in Vercel Blob storage.');
      console.log('   You can manually delete them from the Vercel dashboard if needed.\n');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration
migrateComicPanels().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
