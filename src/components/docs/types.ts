export interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
}

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
