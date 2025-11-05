import fs from 'fs';
import path from 'path';

/**
 * Convert file path to URL slug
 * Example: "ui/theme-system.md" → "ui/theme-system"
 */
export function pathToSlug(filePath: string): string {
  return filePath
    .replace(/\\/g, '/') // Normalize Windows paths
    .replace(/\.(md|mdx)$/, '') // Remove file extension
    .replace(/\/README$/i, '') // Remove /README for index pages
    .replace(/^\//, ''); // Remove leading slash
}

/**
 * Convert URL slug to file path
 * Example: "ui/theme-system" → "docs/ui/theme-system.md"
 * Tries both .md and .mdx extensions
 */
export function slugToPath(slug: string[]): string | null {
  // Join slug parts
  const slugPath = slug.join('/');

  // Try with .md extension
  const mdPath = path.join(process.cwd(), 'docs', `${slugPath}.md`);
  if (fs.existsSync(mdPath)) {
    return mdPath;
  }

  // Try with .mdx extension
  const mdxPath = path.join(process.cwd(), 'docs', `${slugPath}.mdx`);
  if (fs.existsSync(mdxPath)) {
    return mdxPath;
  }

  // Try README.md in directory
  const readmePath = path.join(process.cwd(), 'docs', slugPath, 'README.md');
  if (fs.existsSync(readmePath)) {
    return readmePath;
  }

  return null;
}

/**
 * Generate slug from file tree node path
 */
export function nodeToSlug(nodePath: string): string {
  return pathToSlug(nodePath);
}
