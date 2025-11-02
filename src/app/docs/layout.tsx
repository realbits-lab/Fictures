import type { ReactNode } from 'react';
import { getFileTree } from '@/lib/docs/file-system';
import { FileTree } from '@/components/docs/FileTree';

export default function DocsLayout({ children }: { children: ReactNode }) {
  const fileTree = getFileTree();

  return (
    <div className="fixed inset-0 top-20 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - File Tree Navigation */}
        <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
              Documentation
            </h2>
            <FileTree tree={fileTree} />
          </div>
        </aside>

        {/* Middle Panel - Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-4xl px-4 py-6">
            {children}
          </div>
        </main>

        {/* Right Panel - Table of Contents (rendered by page) */}
      </div>
    </div>
  );
}
