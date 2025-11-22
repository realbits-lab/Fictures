import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICONS_DIR = join(__dirname, "../public/icons");

// SVG icon template - simple "F" letter for Fictures
const createIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000" rx="${size * 0.15}"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.6}">F</text>
</svg>
`;

// Maskable icon template - with safe zone padding
const createMaskableIconSVG = (size) => {
    const padding = size * 0.1; // 10% padding for safe zone
    const innerSize = size - padding * 2;
    return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" fill="#1a1a1a" rx="${innerSize * 0.15}"/>
  <text
    x="50%"
    y="50%"
    dominant-baseline="middle"
    text-anchor="middle"
    fill="#ffffff"
    font-family="Arial, sans-serif"
    font-weight="bold"
    font-size="${size * 0.5}">F</text>
</svg>
`;
};

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

async function generateIcons() {
    try {
        // Ensure icons directory exists
        await mkdir(ICONS_DIR, { recursive: true });
        console.log("Icons directory created/verified");

        // Generate regular icons
        for (const size of sizes) {
            const svg = createIconSVG(size);
            const outputPath = join(ICONS_DIR, `icon-${size}x${size}.png`);

            await sharp(Buffer.from(svg)).png().toFile(outputPath);

            console.log(`✓ Generated icon-${size}x${size}.png`);
        }

        // Generate maskable icons
        for (const size of maskableSizes) {
            const svg = createMaskableIconSVG(size);
            const outputPath = join(
                ICONS_DIR,
                `icon-${size}x${size}-maskable.png`,
            );

            await sharp(Buffer.from(svg)).png().toFile(outputPath);

            console.log(`✓ Generated icon-${size}x${size}-maskable.png`);
        }

        // Generate apple-touch-icon
        const appleTouchIconSVG = createIconSVG(180);
        await sharp(Buffer.from(appleTouchIconSVG))
            .png()
            .toFile(join(ICONS_DIR, "apple-touch-icon.png"));

        console.log("✓ Generated apple-touch-icon.png");

        // Generate favicon
        const faviconSVG = createIconSVG(32);
        await sharp(Buffer.from(faviconSVG))
            .png()
            .toFile(join(__dirname, "../public/favicon.ico"));

        console.log("✓ Generated favicon.ico");

        console.log("\n✅ All PWA icons generated successfully!");
    } catch (error) {
        console.error("Error generating icons:", error);
        process.exit(1);
    }
}

generateIcons();
