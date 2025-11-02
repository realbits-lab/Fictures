import type { ReactNode } from 'react';
import { getFileTree } from '@/lib/docs/file-system';
import { FileTree } from '@/components/docs/FileTree';

export default function DocsLayout({ children }: { children: ReactNode }) {
  const fileTree = getFileTree();

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto px-4">
        <div className="flex gap-8">
          {/* Left Panel - File Tree Navigation */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
                Documentation
              </h2>
              <FileTree tree={fileTree} />
            </div>
          </aside>

          {/* Middle Panel - Content */}
          <main className="flex-1 min-w-0">
            <div className="max-w-4xl">
              {children}
            </div>
          </main>

          {/* Right Panel - Table of Contents (rendered by page) */}
        </div>
      </div>
    </div>
  );
}
