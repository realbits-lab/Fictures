import fs from 'fs';
import path from 'path';

export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

/**
 * Generate file tree from docs directory
 * @param dirPath - Absolute path to directory
 * @param basePath - Base path for relative paths (default: dirPath)
 * @returns FileTreeNode representing directory structure
 */
export function generateFileTree(
  dirPath: string,
  basePath: string = dirPath
): FileTreeNode | null {
  try {
    const stats = fs.statSync(dirPath);
    const name = path.basename(dirPath);
    const relativePath = path.relative(basePath, dirPath);

    // Generate unique ID from path
    const id = relativePath.replace(/\\/g, '/') || 'root';

    if (stats.isDirectory()) {
      // Read directory contents
      const entries = fs.readdirSync(dirPath);

      // Filter and sort entries
      const children = entries
        .filter((entry) => {
          // Exclude hidden files and node_modules
          return !entry.startsWith('.') && entry !== 'node_modules';
        })
        .map((entry) => {
          const fullPath = path.join(dirPath, entry);
          return generateFileTree(fullPath, basePath);
        })
        .filter((node): node is FileTreeNode => node !== null)
        .sort((a, b) => {
          // Folders first, then files; alphabetical within each group
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      return {
        id,
        name,
        path: relativePath.replace(/\\/g, '/'),
        type: 'folder',
        children: children.length > 0 ? children : undefined,
      };
    } else if (stats.isFile() && (name.endsWith('.md') || name.endsWith('.mdx'))) {
      // Only include markdown files
      return {
        id,
        name,
        path: relativePath.replace(/\\/g, '/'),
        type: 'file',
      };
    }

    return null;
  } catch (error) {
    console.error(`Error reading path ${dirPath}:`, error);
    return null;
  }
}

/**
 * Get file tree for docs directory
 * Uses absolute path to project's /docs directory
 */
export function getDocsFileTree(): FileTreeNode | null {
  const docsPath = path.join(process.cwd(), 'docs');
  return generateFileTree(docsPath);
}
