import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '..', 'docs');

function getAllMdFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMdFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function removeFrontmatter() {
  console.log('Removing frontmatter from all docs files...\n');
  
  const files = getAllMdFiles(docsDir);
  
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if file starts with frontmatter (---)
    if (content.startsWith('---')) {
      // Find the end of frontmatter
      const endIndex = content.indexOf('\n---', 3);
      
      if (endIndex !== -1) {
        // Remove frontmatter and trim leading whitespace
        const newContent = content.substring(endIndex + 4).trimStart();
        fs.writeFileSync(file, newContent, 'utf8');
        const relativePath = path.relative(process.cwd(), file);
        console.log(`✅ Removed frontmatter from: ${relativePath}`);
        processedCount++;
      } else {
        const relativePath = path.relative(process.cwd(), file);
        console.log(`⚠️  Malformed frontmatter in: ${relativePath}`);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Processed: ${processedCount} files`);
  console.log(`   Skipped (no frontmatter): ${skippedCount} files`);
  console.log(`   Total: ${files.length} files`);
}

removeFrontmatter();
