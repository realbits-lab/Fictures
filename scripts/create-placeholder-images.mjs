/**
 * Create Placeholder Images for Story Generation Fallback
 *
 * Generates 4 placeholder images (16:9, 1792x1024) and uploads to Vercel Blob:
 * - Character portrait placeholder
 * - Setting visual placeholder
 * - Scene illustration placeholder
 * - Story cover placeholder
 */

import { put } from '@vercel/blob';
import sharp from 'sharp';

const PLACEHOLDER_CONFIG = {
  width: 1792,
  height: 1024,
  placeholders: [
    {
      type: 'character',
      filename: 'character-default.png',
      backgroundColor: { r: 64, g: 64, b: 80 },
      textColor: { r: 200, g: 200, b: 210 },
      title: 'Character Portrait',
      subtitle: 'Pending Generation',
      icon: '◉',
    },
    {
      type: 'setting',
      filename: 'setting-default.png',
      backgroundColor: { r: 48, g: 64, b: 72 },
      textColor: { r: 190, g: 210, b: 220 },
      title: 'Setting Visual',
      subtitle: 'Pending Generation',
      icon: '▣',
    },
    {
      type: 'scene',
      filename: 'scene-default.png',
      backgroundColor: { r: 56, g: 48, b: 72 },
      textColor: { r: 210, g: 200, b: 220 },
      title: 'Scene Illustration',
      subtitle: 'Pending Generation',
      icon: '◈',
    },
    {
      type: 'story',
      filename: 'story-default.png',
      backgroundColor: { r: 72, g: 56, b: 48 },
      textColor: { r: 220, g: 210, b: 200 },
      title: 'Story Cover',
      subtitle: 'Pending Generation',
      icon: '◐',
    },
  ],
};

/**
 * Create a placeholder image with text overlay
 */
async function createPlaceholderImage(config) {
  const { width, height, backgroundColor, textColor, title, subtitle, icon } = config;

  // Create SVG with text
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="rgb(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b})"/>

      <!-- Gradient overlay -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>

      <!-- Icon (centered, large) -->
      <text x="${width / 2}" y="${height / 2 - 80}"
            font-size="200"
            text-anchor="middle"
            fill="rgba(${textColor.r},${textColor.g},${textColor.b},0.3)"
            font-family="Arial, sans-serif">
        ${icon}
      </text>

      <!-- Title text -->
      <text x="${width / 2}" y="${height / 2 + 80}"
            font-size="72"
            font-weight="bold"
            text-anchor="middle"
            fill="rgb(${textColor.r},${textColor.g},${textColor.b})"
            font-family="Arial, sans-serif">
        ${title}
      </text>

      <!-- Subtitle text -->
      <text x="${width / 2}" y="${height / 2 + 150}"
            font-size="48"
            text-anchor="middle"
            fill="rgba(${textColor.r},${textColor.g},${textColor.b},0.7)"
            font-family="Arial, sans-serif">
        ${subtitle}
      </text>

      <!-- Bottom notice -->
      <text x="${width / 2}" y="${height - 100}"
            font-size="36"
            text-anchor="middle"
            fill="rgba(${textColor.r},${textColor.g},${textColor.b},0.5)"
            font-family="Arial, sans-serif">
        This is a temporary placeholder image
      </text>
    </svg>
  `;

  // Convert SVG to PNG buffer using sharp
  const buffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  return buffer;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Starting placeholder image generation...\n');

  const results = [];

  for (const placeholder of PLACEHOLDER_CONFIG.placeholders) {
    try {
      console.log(`📝 Creating ${placeholder.type} placeholder...`);

      // Generate image
      const imageBuffer = await createPlaceholderImage({
        width: PLACEHOLDER_CONFIG.width,
        height: PLACEHOLDER_CONFIG.height,
        ...placeholder,
      });

      console.log(`   ✓ Generated ${imageBuffer.length} bytes`);

      // Upload to Vercel Blob
      const blobPath = `system/placeholders/${placeholder.filename}`;
      console.log(`   📤 Uploading to: ${blobPath}`);

      const blob = await put(blobPath, imageBuffer, {
        access: 'public',
        contentType: 'image/png',
        addRandomSuffix: false,
      });

      console.log(`   ✅ Uploaded successfully!`);
      console.log(`   🔗 URL: ${blob.url}\n`);

      results.push({
        type: placeholder.type,
        filename: placeholder.filename,
        url: blob.url,
        size: imageBuffer.length,
      });
    } catch (error) {
      console.error(`   ❌ Error creating ${placeholder.type} placeholder:`, error);
      throw error;
    }
  }

  console.log('\n✅ All placeholder images created successfully!\n');
  console.log('📋 Summary:');
  console.log('─'.repeat(80));

  for (const result of results) {
    console.log(`${result.type.padEnd(12)} | ${result.url}`);
  }

  console.log('─'.repeat(80));

  // Save URLs to a config file for easy reference
  const config = {
    PLACEHOLDER_IMAGES: results.reduce((acc, r) => {
      acc[r.type] = r.url;
      return acc;
    }, {}),
    generated_at: new Date().toISOString(),
  };

  console.log('\n📝 Placeholder URLs (copy to image-generation.ts):');
  console.log(JSON.stringify(config.PLACEHOLDER_IMAGES, null, 2));

  return results;
}

// Run script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
