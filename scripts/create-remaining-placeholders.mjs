import { put } from '@vercel/blob';
import sharp from 'sharp';

// We already have character placeholder from first run
const EXISTING_CHARACTER_URL = 'https://s5qoi7bpa6gvaz9j.public.blob.vercel-storage.com/stories/system/placeholders/character-default.png';

const REMAINING_PLACEHOLDERS = [
  {
    type: 'setting',
    filename: 'setting-visual.png',
    backgroundColor: { r: 48, g: 64, b: 72 },
    textColor: { r: 190, g: 210, b: 220 },
    title: 'Setting Visual',
    subtitle: 'Pending Generation',
  },
  {
    type: 'scene',
    filename: 'scene-illustration.png',
    backgroundColor: { r: 56, g: 48, b: 72 },
    textColor: { r: 210, g: 200, b: 220 },
    title: 'Scene Illustration',
    subtitle: 'Pending Generation',
  },
  {
    type: 'story',
    filename: 'story-cover.png',
    backgroundColor: { r: 72, g: 56, b: 48 },
    textColor: { r: 220, g: 210, b: 200 },
    title: 'Story Cover',
    subtitle: 'Pending Generation',
  },
];

async function createPlaceholder(config) {
  const { backgroundColor, textColor, title, subtitle } = config;
  const width = 1792;
  const height = 1024;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="rgb(${backgroundColor.r},${backgroundColor.g},${backgroundColor.b})"/>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,255,255,0.05);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.1);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="${width / 2}" y="${height / 2}" font-size="72" font-weight="bold" text-anchor="middle" fill="rgb(${textColor.r},${textColor.g},${textColor.b})" font-family="Arial, sans-serif">${title}</text>
      <text x="${width / 2}" y="${height / 2 + 80}" font-size="48" text-anchor="middle" fill="rgba(${textColor.r},${textColor.g},${textColor.b},0.7)" font-family="Arial, sans-serif">${subtitle}</text>
    </svg>
  `;

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function main() {
  console.log('Creating remaining placeholders...\n');
  const results = [{ type: 'character', url: EXISTING_CHARACTER_URL }];

  for (const placeholder of REMAINING_PLACEHOLDERS) {
    const buffer = await createPlaceholder(placeholder);
    const blob = await put(`stories/system/placeholders/${placeholder.filename}`, buffer, {
      access: 'public',
      contentType: 'image/png',
    });
    console.log(`✅ ${placeholder.type}: ${blob.url}`);
    results.push({ type: placeholder.type, url: blob.url });
  }

  console.log('\n📋 All Placeholder URLs:');
  console.log('const PLACEHOLDER_IMAGES = {');
  results.forEach(r => console.log(`  ${r.type}: '${r.url}',`));
  console.log('};');
}

main().catch(console.error);
