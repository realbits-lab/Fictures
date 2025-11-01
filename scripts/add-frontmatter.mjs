#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '..', 'docs');

async function addFrontmatterToFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Check if frontmatter already exists
    if (content.trim().startsWith('---')) {
      console.log(`Skipping ${path.basename(filePath)} - already has frontmatter`);
      return;
    }

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    let title = titleMatch ? titleMatch[1] : path.basename(filePath, '.mdx');

    // Clean up the title
    title = title.replace(/[_]/g, ' ');

    // Create frontmatter
    const frontmatter = `---\ntitle: "${title}"\n---\n\n`;
    const newContent = frontmatter + content;

    await fs.writeFile(filePath, newContent, 'utf-8');
    console.log(`✅ Added frontmatter to: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.mdx')) {
      await addFrontmatterToFile(fullPath);
    }
  }
}

console.log('Adding frontmatter to all MDX files...\n');
await processDirectory(docsDir);
console.log('\n✨ Done!');
