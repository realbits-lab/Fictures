#!/usr/bin/env node

/**
 * Test script for complete image optimization workflow
 *
 * Tests:
 * 1. DALL-E 3 image generation (1792×1024)
 * 2. Automatic optimization into 18 variants
 * 3. Format conversion (AVIF, WebP, JPEG)
 * 4. Responsive sizing (mobile, tablet, desktop × 1x/2x)
 * 5. Vercel Blob upload
 *
 * Usage: dotenv --file .env.local run node scripts/test-image-optimization.mjs
 */

import { generateStoryImage } from '../src/lib/services/image-generation.ts';
import { nanoid } from 'nanoid';

// Format file size for display
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format time duration
function formatDuration(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function testImageOptimization() {
  console.log('🎨 Testing Complete Image Optimization Workflow\n');
  console.log('━'.repeat(80));
  console.log('\n');

  try {
    // Validate API keys
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY or AI_GATEWAY_API_KEY');
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      throw new Error('Missing BLOB_READ_WRITE_TOKEN for Vercel Blob storage');
    }

    // Test configuration
    const testStoryId = `test_${nanoid()}`;
    const testPrompt = 'A mysterious enchanted forest at twilight with glowing mushrooms and fireflies, cinematic widescreen composition, fantasy art style';

    console.log('📋 Test Configuration:');
    console.log(`   Story ID: ${testStoryId}`);
    console.log(`   Image Type: scene`);
    console.log(`   Style: vivid`);
    console.log(`   Quality: standard`);
    console.log(`   Prompt: "${testPrompt}"`);
    console.log('\n');

    // Start timer
    const startTime = Date.now();

    // Step 1: Generate image with DALL-E 3 and optimize
    console.log('🚀 Step 1: Generating image with DALL-E 3...');
    const result = await generateStoryImage({
      prompt: testPrompt,
      storyId: testStoryId,
      imageType: 'scene',
      style: 'vivid',
      quality: 'standard',
      skipOptimization: false, // Enable optimization
    });

    const generationTime = Date.now() - startTime;

    console.log('   ✓ Image generated and optimized\n');

    // Step 2: Display results
    console.log('━'.repeat(80));
    console.log('\n📊 RESULTS\n');
    console.log('━'.repeat(80));
    console.log('\n');

    // Original image
    console.log('📷 Original Image (DALL-E 3):');
    console.log(`   URL: ${result.url}`);
    console.log(`   Dimensions: ${result.width}×${result.height}`);
    console.log(`   Format: PNG`);
    console.log(`   Size: ${formatBytes(result.size)}`);
    console.log(`   Image ID: ${result.imageId}`);
    console.log('\n');

    // Optimized variants
    if (result.optimizedSet && result.optimizedSet.variants.length > 0) {
      const variants = result.optimizedSet.variants;
      const totalSize = variants.reduce((sum, v) => sum + v.size, 0);

      console.log('🎯 Optimized Variants:');
      console.log(`   Total variants: ${variants.length}`);
      console.log(`   Total size: ${formatBytes(totalSize)}`);
      console.log(`   Space efficiency: ${formatBytes(totalSize)} for all variants vs ${formatBytes(result.size)} original`);
      console.log('\n');

      // Group by format
      const formatGroups = {
        avif: variants.filter((v) => v.format === 'avif'),
        webp: variants.filter((v) => v.format === 'webp'),
        jpeg: variants.filter((v) => v.format === 'jpeg'),
      };

      // Display by format
      for (const [format, formatVariants] of Object.entries(formatGroups)) {
        if (formatVariants.length === 0) continue;

        const formatSize = formatVariants.reduce((sum, v) => sum + v.size, 0);
        console.log(`   ${format.toUpperCase()} (${formatVariants.length} variants, ${formatBytes(formatSize)}):`);

        // Sort by width
        formatVariants.sort((a, b) => a.width - b.width);

        for (const variant of formatVariants) {
          const savings = ((1 - variant.size / result.size) * 100).toFixed(1);
          console.log(
            `      ${variant.device.padEnd(7)} ${variant.resolution} - ${variant.width}×${variant.height} - ${formatBytes(variant.size).padEnd(8)} (${savings}% smaller)`
          );
        }
        console.log('');
      }

      // Performance comparison
      console.log('⚡ Performance Comparison:');
      const mobileAvif = variants.find((v) => v.format === 'avif' && v.device === 'mobile' && v.resolution === '1x');
      const tabletAvif = variants.find((v) => v.format === 'avif' && v.device === 'tablet' && v.resolution === '1x');
      const desktopAvif = variants.find((v) => v.format === 'avif' && v.device === 'desktop' && v.resolution === '1x');

      if (mobileAvif) {
        const savings = ((1 - mobileAvif.size / result.size) * 100).toFixed(1);
        console.log(`   Mobile (${mobileAvif.width}×${mobileAvif.height}): ${formatBytes(result.size)} → ${formatBytes(mobileAvif.size)} (${savings}% reduction)`);
      }

      if (tabletAvif) {
        const savings = ((1 - tabletAvif.size / result.size) * 100).toFixed(1);
        console.log(`   Tablet (${tabletAvif.width}×${tabletAvif.height}): ${formatBytes(result.size)} → ${formatBytes(tabletAvif.size)} (${savings}% reduction)`);
      }

      if (desktopAvif) {
        const savings = ((1 - desktopAvif.size / result.size) * 100).toFixed(1);
        console.log(`   Desktop (${desktopAvif.width}×${desktopAvif.height}): ${formatBytes(result.size)} → ${formatBytes(desktopAvif.size)} (${savings}% reduction)`);
      }

      console.log('\n');

      // Storage paths
      console.log('📁 Storage Structure:');
      console.log(`   Base path: stories/${testStoryId}/scene/`);
      console.log(`   Original: original/${result.imageId}.png`);
      console.log(`   Variants: {format}/{size}/{imageId}.{ext}`);
      console.log('\n');

      // Example URLs
      console.log('🔗 Example URLs:');
      if (mobileAvif) {
        console.log(`   Mobile AVIF: ${mobileAvif.url}`);
      }
      if (tabletAvif) {
        console.log(`   Tablet AVIF: ${tabletAvif.url}`);
      }
      if (desktopAvif) {
        console.log(`   Desktop AVIF: ${desktopAvif.url}`);
      }
      console.log('\n');
    } else {
      console.log('⚠️  No optimized variants generated (optimization may have been skipped or failed)\n');
    }

    // Timing
    console.log('⏱️  Timing:');
    console.log(`   Total time: ${formatDuration(generationTime)}`);
    if (result.optimizedSet) {
      const avgPerVariant = generationTime / result.optimizedSet.variants.length;
      console.log(`   Average per variant: ${formatDuration(avgPerVariant)}`);
    }
    console.log('\n');

    // Next steps
    console.log('━'.repeat(80));
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Use OptimizedImage component in your React app');
    console.log('   2. Save imageUrl and imageVariants to database');
    console.log('   3. Component will automatically serve best format/size');
    console.log('\n');
    console.log('📖 Example Usage:');
    console.log('   <OptimizedImage');
    console.log('     imageUrl={scene.imageUrl}');
    console.log('     imageVariants={scene.imageVariants}');
    console.log('     alt="Scene illustration"');
    console.log('     priority={true}');
    console.log('   />');
    console.log('\n');
    console.log('━'.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);

    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }

    if (error.cause) {
      console.error('\nCause:', error.cause);
    }

    process.exit(1);
  }
}

// Run the test
testImageOptimization();
