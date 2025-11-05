import fs from 'fs';
import matter from 'gray-matter';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

export interface MarkdownContent {
  content: string;
  frontmatter: Record<string, any>;
  toc: TOCItem[];
}

/**
 * Generate slug from heading text
 * Example: "Getting Started" → "getting-started"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extract headings from markdown content
 */
export function extractHeadings(content: string): TOCItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: TOCItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugify(text);

    headings.push({ id, text, level });
  }

  return headings;
}

/**
 * Build hierarchical TOC from flat heading list
 */
export function buildTOC(headings: TOCItem[]): TOCItem[] {
  const toc: TOCItem[] = [];
  const stack: TOCItem[] = [];

  headings.forEach((heading) => {
    const item = { ...heading, children: [] };

    // Find correct parent level
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level heading
      toc.push(item);
    } else {
      // Nested heading
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }

    stack.push(item);
  });

  return toc;
}

/**
 * Parse markdown file
 */
export function parseMarkdownFile(filePath: string): MarkdownContent {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(fileContent);

  // Extract and build TOC
  const headings = extractHeadings(content);
  const toc = buildTOC(headings);

  return {
    content,
    frontmatter: data,
    toc,
  };
}
