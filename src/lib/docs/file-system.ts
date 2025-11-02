import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  order?: number;
}

export interface DocMetadata {
  title: string;
  description?: string;
  [key: string]: unknown;
}

export interface DocPage {
  slug: string;
  content: string;
  metadata: DocMetadata;
  headings: Heading[];
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

const DOCS_DIR = path.join(process.cwd(), 'docs');

/**
 * Read the docs directory structure and build a file tree
 */
export function getFileTree(dirPath: string = DOCS_DIR): FileNode[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(DOCS_DIR, fullPath);

    if (entry.isDirectory()) {
      const children = getFileTree(fullPath);
      if (children.length > 0) {
        nodes.push({
          name: entry.name,
          path: relativePath,
          type: 'directory',
          children,
        });
      }
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      nodes.push({
        name: entry.name.replace(/\.mdx?$/, ''),
        path: relativePath.replace(/\.mdx?$/, ''),
        type: 'file',
      });
    }
  }

  // Sort: directories first, then files, both alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Special case: index files should come first
    if (a.name === 'index') return -1;
    if (b.name === 'index') return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get a doc page by slug
 */
export function getDocPage(slug: string[] | undefined): DocPage | null {
  try {
    const filePath = slug && slug.length > 0
      ? path.join(DOCS_DIR, ...slug)
      : path.join(DOCS_DIR, 'index');

    // Try both .md and .mdx extensions
    let fullPath = '';
    if (fs.existsSync(`${filePath}.md`)) {
      fullPath = `${filePath}.md`;
    } else if (fs.existsSync(`${filePath}.mdx`)) {
      fullPath = `${filePath}.mdx`;
    } else {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Extract headings for TOC
    const headings = extractHeadings(content);

    return {
      slug: slug?.join('/') || 'index',
      content,
      metadata: {
        title: data.title || 'Untitled',
        description: data.description,
        ...data,
      },
      headings,
    };
  } catch (error) {
    console.error('Error reading doc page:', error);
    return null;
  }
}

/**
 * Extract headings from markdown content
 */
function extractHeadings(content: string): Heading[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Heading[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Generate all possible doc paths for static generation
 */
export function generateDocPaths(): { slug: string[] }[] {
  const paths: { slug: string[] }[] = [];

  function traverse(dirPath: string, currentPath: string[] = []) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        traverse(fullPath, [...currentPath, entry.name]);
      } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
        const fileName = entry.name.replace(/\.mdx?$/, '');
        if (fileName === 'index') {
          // Add directory path
          if (currentPath.length > 0) {
            paths.push({ slug: currentPath });
          }
        } else {
          paths.push({ slug: [...currentPath, fileName] });
        }
      }
    }
  }

  traverse(DOCS_DIR);

  // Add root index
  paths.push({ slug: [] });

  return paths;
}
