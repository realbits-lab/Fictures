import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsPolyfillProvider } from '@/components/docs/DocsPolyfillProvider';

export default function Layout({ children }: { children: ReactNode }) {
  console.log('[DOCS LAYOUT] Starting render');
  console.log('[DOCS LAYOUT] Has children:', !!children);

  const options = baseOptions();
  console.log('[DOCS LAYOUT] Base options:', options);

  const pageTree = source.pageTree;
  console.log('[DOCS LAYOUT] Page tree:', {
    hasTree: !!pageTree,
    treeKeys: pageTree ? Object.keys(pageTree) : [],
  });

  console.log('[DOCS LAYOUT] Rendering DocsLayout');

  return (
    <DocsPolyfillProvider>
      <div className="pt-24">
        <DocsLayout
          tree={pageTree}
          {...options}
          sidebar={{
            enabled: true,
            defaultOpenLevel: 1,
          }}
        >
          {children}
        </DocsLayout>
      </div>
    </DocsPolyfillProvider>
  );
}
