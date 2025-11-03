'use client';

import type { ReactNode } from 'react';
import { ResizablePanels } from './ResizablePanels';

interface DocsPageWrapperProps {
  fileTree: ReactNode;
  content: ReactNode;
  tableOfContents: ReactNode;
}

export function DocsPageWrapper({
  fileTree,
  content,
  tableOfContents,
}: DocsPageWrapperProps) {
  return (
    <div className="fixed inset-0 top-20 flex flex-col">
      <ResizablePanels
        leftPanel={fileTree}
        middlePanel={content}
        rightPanel={tableOfContents}
      />
    </div>
  );
}
