# Documentation Viewer Development Guide

## Overview

This guide provides comprehensive technical implementation details for building the documentation viewer. It covers architecture, code structure, dependencies, and step-by-step implementation instructions.

## Prerequisites

**Required Knowledge:**
- Next.js 15 App Router
- React Server Components (RSC) and Client Components
- TypeScript
- Tailwind CSS v4
- File system operations (Node.js `fs` module)

**Project Dependencies:**
- `react-resizable-panels` (already installed) - Panel layout
- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub-flavored markdown support
- `react-syntax-highlighter` - Code syntax highlighting
- shadcn UI components - UI primitives

## Architecture

### Route Structure

```
src/app/docs/
├── page.tsx                 # Default docs page (/docs)
├── [...slug]/
│   └── page.tsx            # Dynamic route for docs files (/docs/[...slug])
├── layout.tsx              # Shared layout (optional)
└── api/
    └── file-tree/
        └── route.ts        # API endpoint to generate file tree
```

### Component Structure

```
src/components/docs/
├── DocsLayout.tsx          # 3-panel resizable layout with scroll isolation
├── FileTree.tsx            # Left panel - file tree navigation
├── MarkdownViewer.tsx      # Middle panel - markdown renderer
├── TableOfContents.tsx     # Right panel - TOC with active section tracking
├── MarkdownComponents.tsx  # Custom markdown component mappings
└── types.ts                # TypeScript interfaces
```

### Utility Functions

```
src/lib/docs/
├── file-tree.ts            # Generate file tree from /docs directory
├── markdown-parser.ts      # Parse markdown and extract TOC
├── slug-utils.ts           # Convert paths to/from URL slugs
└── heading-utils.ts        # Generate heading IDs and TOC structure
```

## Dependencies

### Install Required Packages

```bash
pnpm add react-markdown remark-gfm react-syntax-highlighter
pnpm add -D @types/react-syntax-highlighter
```

### Install shadcn Components

```bash
# Tree view component for file navigation
npx shadcn add "https://mrlightful.com/registry/tree-view"

# Additional shadcn components (if needed)
npx shadcn@latest add scroll-area
```

## Implementation Steps

### Step 1: File Tree Generation

Create utility to scan `/docs` directory and generate tree structure.

**File:** `src/lib/docs/file-tree.ts`

```typescript
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
```

**Usage in API Route:**

**File:** `src/app/docs/api/file-tree/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getDocsFileTree } from '@/lib/docs/file-tree';

export async function GET() {
  try {
    const fileTree = getDocsFileTree();

    if (!fileTree) {
      return NextResponse.json(
        { error: 'Failed to generate file tree' },
        { status: 500 }
      );
    }

    return NextResponse.json(fileTree);
  } catch (error) {
    console.error('File tree API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Step 2: Slug Utilities

Convert file paths to URL-safe slugs and vice versa.

**File:** `src/lib/docs/slug-utils.ts`

```typescript
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
  const fs = require('fs');
  const path = require('path');

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
```

### Step 3: Markdown Parser with TOC

Parse markdown content and extract table of contents.

**File:** `src/lib/docs/markdown-parser.ts`

```typescript
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
```

### Step 4: Markdown Components with Styling

Create custom component mappings for react-markdown.

**File:** `src/components/docs/MarkdownComponents.tsx`

```typescript
'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { slugify } from '@/lib/docs/markdown-parser';

export const markdownComponents = {
  h1: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h1
        id={id}
        className="scroll-m-20 text-4xl font-bold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h1>
    );
  },

  h2: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10 mb-4 first:mt-0"
        {...props}
      >
        {children}
      </h2>
    );
  },

  h3: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h3>
    );
  },

  h4: ({ children, ...props }: any) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props}>
      {children}
    </h4>
  ),

  h5: ({ children, ...props }: any) => (
    <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),

  h6: ({ children, ...props }: any) => (
    <h6 className="scroll-m-20 text-base font-semibold tracking-tight mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),

  p: ({ children, ...props }: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
      {children}
    </p>
  ),

  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      {...props}
    >
      {children}
    </a>
  ),

  ul: ({ children, ...props }: any) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }: any) => (
    <li className="mt-2" {...props}>
      {children}
    </li>
  ),

  blockquote: ({ children, ...props }: any) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
      {children}
    </blockquote>
  ),

  table: ({ children, ...props }: any) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: any) => (
    <thead className="border-b" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }: any) => (
    <tbody className="[&_tr:last-child]:border-0" {...props}>
      {children}
    </tbody>
  ),

  tr: ({ children, ...props }: any) => (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props}>
      {children}
    </tr>
  ),

  th: ({ children, ...props }: any) => (
    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: any) => (
    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props}>
      {children}
    </td>
  ),

  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline && language) {
      // Code block with syntax highlighting
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-md my-6"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    // Inline code
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }: any) => (
    <pre className="mb-4 mt-6 overflow-x-auto rounded-lg bg-black p-4" {...props}>
      {children}
    </pre>
  ),

  hr: () => <hr className="my-8 border-border" />,

  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="rounded-md my-6 max-w-full"
      loading="lazy"
      {...props}
    />
  ),
};
```

### Step 5: Three-Panel Layout with Independent Scrolling

Create the main layout component with scroll isolation.

**File:** `src/components/docs/DocsLayout.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FileTree } from './FileTree';
import { MarkdownViewer } from './MarkdownViewer';
import { TableOfContents } from './TableOfContents';
import type { FileTreeNode, TOCItem } from './types';

interface DocsLayoutProps {
  fileTree: FileTreeNode;
  currentPath: string;
  markdownContent: string;
  toc: TOCItem[];
  onFileSelect: (path: string) => void;
}

export function DocsLayout({
  fileTree,
  currentPath,
  markdownContent,
  toc,
  onFileSelect,
}: DocsLayoutProps) {
  // Panel refs for scroll isolation
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const middlePanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Setup independent scrolling
  useEffect(() => {
    const panels = [
      leftPanelRef.current,
      middlePanelRef.current,
      rightPanelRef.current,
    ];

    const handleWheel = (e: WheelEvent) => {
      // ALWAYS prevent default and stop propagation
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;
      const canScroll = scrollHeight > clientHeight;

      // If element can scroll, manually update scrollTop
      if (canScroll) {
        const newScrollTop = scrollTop + e.deltaY;
        const maxScroll = scrollHeight - clientHeight;

        // Clamp scroll position to valid range
        target.scrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
      }
      // If element cannot scroll, do nothing (event already prevented)
    };

    panels.forEach((panel) => {
      if (panel) {
        // Capture phase ensures we intercept events before child elements
        panel.addEventListener('wheel', handleWheel, {
          passive: false,
          capture: true,
        });
      }
    });

    return () => {
      panels.forEach((panel) => {
        if (panel) {
          panel.removeEventListener('wheel', handleWheel, { capture: true });
        }
      });
    };
  }, []);

  return (
    <>
      {/* Global scroll prevention */}
      <style jsx global>{`
        html,
        body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
        }
      `}</style>

      <PanelGroup direction="horizontal" className="h-screen">
        {/* Left Panel: File Tree */}
        <Panel
          defaultSize={25}
          minSize={15}
          maxSize={35}
          className="border-r border-border"
        >
          <div
            ref={leftPanelRef}
            className="flex-1 min-h-0 h-full overflow-y-auto [overscroll-behavior-y:contain] p-4"
          >
            <FileTree
              tree={fileTree}
              currentPath={currentPath}
              onSelect={onFileSelect}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

        {/* Middle Panel: Markdown Viewer */}
        <Panel defaultSize={50} minSize={30}>
          <div
            ref={middlePanelRef}
            className="flex-1 min-h-0 h-full overflow-y-auto [overscroll-behavior-y:contain] p-8"
          >
            <MarkdownViewer content={markdownContent} />
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

        {/* Right Panel: Table of Contents */}
        <Panel
          defaultSize={25}
          minSize={15}
          maxSize={35}
          className="border-l border-border"
        >
          <div
            ref={rightPanelRef}
            className="flex-1 min-h-0 h-full overflow-y-auto [overscroll-behavior-y:contain] p-4"
          >
            <TableOfContents
              toc={toc}
              scrollContainerRef={middlePanelRef}
            />
          </div>
        </Panel>
      </PanelGroup>
    </>
  );
}
```

### Step 6: File Tree Component

Render file tree with expand/collapse functionality.

**File:** `src/components/docs/FileTree.tsx`

```typescript
'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import type { FileTreeNode } from './types';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  tree: FileTreeNode;
  currentPath: string;
  onSelect: (path: string) => void;
}

export function FileTree({ tree, currentPath, onSelect }: FileTreeProps) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold mb-4">Documentation</h2>
      <FileTreeNode
        node={tree}
        currentPath={currentPath}
        onSelect={onSelect}
        level={0}
      />
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileTreeNode;
  currentPath: string;
  onSelect: (path: string) => void;
  level: number;
}

function FileTreeNode({ node, currentPath, onSelect, level }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isActive = node.path === currentPath;
  const paddingLeft = `${level * 16}px`;

  if (node.type === 'file') {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors text-left',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-foreground'
        )}
        style={{ paddingLeft }}
      >
        <File className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  // Folder
  return (
    <div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors text-left"
        style={{ paddingLeft }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        )}
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium truncate">{node.name}</span>
      </button>

      {isExpanded && node.children && (
        <div className="mt-1">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              currentPath={currentPath}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 7: Markdown Viewer Component

Render markdown content with custom styling.

**File:** `src/components/docs/MarkdownViewer.tsx`

```typescript
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './MarkdownComponents';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <article className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
```

### Step 8: Table of Contents Component

Render hierarchical TOC with active section tracking.

**File:** `src/components/docs/TableOfContents.tsx`

```typescript
'use client';

import { useEffect, useState, RefObject } from 'react';
import type { TOCItem } from './types';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  toc: TOCItem[];
  scrollContainerRef: RefObject<HTMLDivElement>;
}

export function TableOfContents({ toc, scrollContainerRef }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');

  // Track active section using Intersection Observer
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const headings = scrollContainer.querySelectorAll('h1[id], h2[id], h3[id]');
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: scrollContainer,
        rootMargin: '-80px 0px -80% 0px',
        threshold: 1.0,
      }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [scrollContainerRef, toc]);

  const handleClick = (id: string) => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const element = scrollContainer.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (toc.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No headings found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4">On This Page</h2>
      <nav className="space-y-1">
        {toc.map((item) => (
          <TOCNode
            key={item.id}
            item={item}
            activeId={activeId}
            onClick={handleClick}
          />
        ))}
      </nav>
    </div>
  );
}

interface TOCNodeProps {
  item: TOCItem;
  activeId: string;
  onClick: (id: string) => void;
  level?: number;
}

function TOCNode({ item, activeId, onClick, level = 0 }: TOCNodeProps) {
  const isActive = item.id === activeId;
  const paddingLeft = `${level * 12}px`;

  return (
    <div>
      <button
        onClick={() => onClick(item.id)}
        className={cn(
          'block w-full text-left text-sm py-1.5 px-2 rounded-md transition-colors',
          isActive
            ? 'text-primary font-medium bg-primary/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
        style={{ paddingLeft }}
      >
        {item.text}
      </button>

      {item.children && item.children.length > 0 && (
        <div className="mt-1">
          {item.children.map((child) => (
            <TOCNode
              key={child.id}
              item={child}
              activeId={activeId}
              onClick={onClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 9: Types Definition

Centralize TypeScript interfaces.

**File:** `src/components/docs/types.ts`

```typescript
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
```

### Step 10: Dynamic Route Page

Create the main docs page with dynamic routing.

**File:** `src/app/docs/[...slug]/page.tsx`

```typescript
import { notFound } from 'next/navigation';
import { getDocsFileTree } from '@/lib/docs/file-tree';
import { slugToPath } from '@/lib/docs/slug-utils';
import { parseMarkdownFile } from '@/lib/docs/markdown-parser';
import { DocsLayout } from '@/components/docs/DocsLayout';

interface DocsPageProps {
  params: {
    slug: string[];
  };
}

export default async function DocsPage({ params }: DocsPageProps) {
  // Get file tree
  const fileTree = getDocsFileTree();
  if (!fileTree) {
    notFound();
  }

  // Get file path from slug
  const filePath = slugToPath(params.slug);
  if (!filePath) {
    notFound();
  }

  // Parse markdown content
  const { content, frontmatter, toc } = parseMarkdownFile(filePath);

  // Get current path relative to docs directory
  const currentPath = params.slug.join('/');

  return (
    <DocsLayout
      fileTree={fileTree}
      currentPath={currentPath}
      markdownContent={content}
      toc={toc}
      onFileSelect={(path) => {
        // Client-side navigation handled in layout
      }}
    />
  );
}

// Generate static params for all documentation files
export async function generateStaticParams() {
  const fileTree = getDocsFileTree();
  if (!fileTree) return [];

  const paths: string[][] = [];

  function traverse(node: any, currentPath: string[] = []) {
    if (node.type === 'file') {
      paths.push([...currentPath, node.name.replace(/\.(md|mdx)$/, '')]);
    } else if (node.children) {
      node.children.forEach((child: any) => {
        traverse(child, [...currentPath, node.name]);
      });
    }
  }

  if (fileTree.children) {
    fileTree.children.forEach((child) => traverse(child));
  }

  return paths.map((path) => ({ slug: path }));
}
```

### Step 11: Default Docs Page

Handle `/docs` route (show README or landing page).

**File:** `src/app/docs/page.tsx`

```typescript
import { redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

export default function DefaultDocsPage() {
  // Check if README.md exists
  const readmePath = path.join(process.cwd(), 'docs', 'README.md');

  if (fs.existsSync(readmePath)) {
    // Redirect to README
    redirect('/docs/README');
  }

  // Otherwise redirect to first available doc
  redirect('/docs/CLAUDE');
}
```

## Testing

### Manual Testing Checklist

**File Tree Navigation:**
- [ ] Click file → Loads markdown in middle panel
- [ ] Click folder → Expands/collapses children
- [ ] Active file is highlighted
- [ ] Nested folders display correctly

**Markdown Rendering:**
- [ ] Headings (h1-h6) render with proper styling
- [ ] Code blocks have syntax highlighting
- [ ] Tables render responsively
- [ ] Links are clickable
- [ ] Images load and display correctly
- [ ] Lists (ordered/unordered) render properly

**Table of Contents:**
- [ ] TOC generates from markdown headings
- [ ] Clicking TOC item scrolls to section
- [ ] Active section is highlighted while scrolling
- [ ] Nested TOC items display correctly

**Independent Scrolling:**
- [ ] Each panel scrolls independently
- [ ] No page body scrolling occurs
- [ ] Scrolling one panel doesn't affect others
- [ ] Overscroll doesn't propagate

**Responsive Design:**
- [ ] Desktop (≥1024px): 3 panels visible
- [ ] Tablet (768-1023px): 2 panels, TOC hidden
- [ ] Mobile (<768px): 1 panel, toggle navigation

### Automated Testing

**Example Playwright Test:**

**File:** `tests/docs-viewer.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Documentation Viewer', () => {
  test('should load and render documentation', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/README');

    // Check all panels are visible
    await expect(page.locator('[data-panel-id="file-tree"]')).toBeVisible();
    await expect(page.locator('[data-panel-id="content"]')).toBeVisible();
    await expect(page.locator('[data-panel-id="toc"]')).toBeVisible();
  });

  test('should navigate between files', async ({ page }) => {
    await page.goto('http://localhost:3000/docs');

    // Click a file in tree
    await page.click('text=theme-system.md');

    // Verify URL changed
    await expect(page).toHaveURL('/docs/ui/theme-system');

    // Verify content loaded
    await expect(page.locator('h1')).toContainText('Theme System');
  });

  test('should scroll independently', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/README');

    // Get scroll container refs
    const middlePanel = page.locator('[data-panel-id="content"]');
    const rightPanel = page.locator('[data-panel-id="toc"]');

    // Scroll middle panel
    await middlePanel.evaluate((el) => {
      el.scrollTop = 500;
    });

    // Verify other panels didn't scroll
    const rightScroll = await rightPanel.evaluate((el) => el.scrollTop);
    expect(rightScroll).toBe(0);

    // Verify page body didn't scroll
    const bodyScroll = await page.evaluate(() => window.scrollY);
    expect(bodyScroll).toBe(0);
  });

  test('should generate and use table of contents', async ({ page }) => {
    await page.goto('http://localhost:3000/docs/README');

    // Click TOC item
    await page.click('text=Installation');

    // Wait for smooth scroll
    await page.waitForTimeout(1000);

    // Verify scrolled to section
    const heading = page.locator('h2#installation');
    await expect(heading).toBeInViewport();
  });
});
```

## Performance Optimization

### Build-Time Optimizations

1. **Static Generation:**
```typescript
// Pre-render all doc pages at build time
export const dynamic = 'force-static';
```

2. **Tree Shaking:**
```typescript
// Import only needed syntax highlighter languages
import { Prism } from 'react-syntax-highlighter';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';

Prism.registerLanguage('typescript', typescript);
Prism.registerLanguage('javascript', javascript);
```

### Runtime Optimizations

1. **Lazy Load Syntax Highlighter:**
```typescript
const SyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  { ssr: false }
);
```

2. **Memoize File Tree:**
```typescript
import { cache } from 'react';

export const getDocsFileTree = cache(() => {
  const docsPath = path.join(process.cwd(), 'docs');
  return generateFileTree(docsPath);
});
```

3. **Debounce Scroll Events:**
```typescript
import { useDebounce } from '@/hooks/use-debounce';

const debouncedScrollTop = useDebounce(scrollTop, 100);
```

## Deployment

### Environment Variables

None required (uses file system at build time).

### Build Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Start production server
pnpm start
```

### Vercel Deployment

No special configuration needed. The documentation viewer works with standard Next.js deployment.

## Troubleshooting

### Common Issues

**Issue: File tree not loading**
- Check `/docs` directory exists
- Verify file permissions for reading
- Check console for errors in file-tree API

**Issue: Markdown not rendering**
- Verify `react-markdown` and `remark-gfm` are installed
- Check markdown syntax is valid
- Inspect console for parsing errors

**Issue: Scroll not working**
- Verify panel refs are attached correctly
- Check wheel event listeners are registered
- Ensure `overflow: hidden` is applied to body

**Issue: TOC not generating**
- Verify headings have proper markdown syntax (`# Heading`)
- Check heading extraction regex in `markdown-parser.ts`
- Inspect TOC data structure in browser devtools

## Next Steps

1. Implement mobile-responsive layout
2. Add search functionality
3. Enhance SEO with metadata
4. Add breadcrumb navigation
5. Implement edit mode for authenticated users
6. Add documentation analytics
7. Create keyboard shortcuts reference

## Related Documentation

- **[Documentation Viewer Specification](./documentation-viewer-specification.md)** - Feature requirements and design
- **[Independent Scrolling](./ui/independent-scrolling.md)** - Scroll isolation pattern
- **[shadcn MCP Reference](./ui/shadcn-mcp-reference.md)** - Available UI components

---

**Version:** 1.0.0
**Last Updated:** 2025-11-05
**Status:** ✅ Ready for Implementation
