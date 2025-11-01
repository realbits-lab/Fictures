import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';
import { DocsPolyfillProvider } from '@/components/docs/DocsPolyfillProvider';

export default function Layout({ children }: { children: ReactNode }) {
  const options = baseOptions();
  const pageTree = source.pageTree;

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
          toc={{
            enabled: true,
          }}
        >
          {children}
        </DocsLayout>
      </div>
    </DocsPolyfillProvider>
  );
}
