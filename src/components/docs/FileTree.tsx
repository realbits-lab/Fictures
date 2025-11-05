'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from 'lucide-react';
import type { FileNode } from '@/lib/docs/file-system';

interface FileTreeProps {
  tree: FileNode[];
}

export function FileTree({ tree }: FileTreeProps) {
  return (
    <nav className="w-full">
      <div className="space-y-1">
        {tree.map((node) => (
          <FileTreeNode key={node.path} node={node} />
        ))}
      </div>
    </nav>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  level?: number;
}

function FileTreeNode({ node, level = 0 }: FileTreeNodeProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = pathname === `/docs/${node.path}` || pathname === `/docs/${node.path}/`;

  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0 text-blue-500" />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0 text-blue-500" />
          )}
          <span className="font-medium capitalize">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div className="mt-1">
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/docs/${node.path}`}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      style={{ paddingLeft: `${level * 12 + 28}px` }}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="capitalize">{node.name}</span>
    </Link>
  );
}
