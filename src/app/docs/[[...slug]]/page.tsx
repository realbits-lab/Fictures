import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocPage, generateDocPaths, getFileTree } from '@/lib/docs/file-system';
import { MarkdownViewer } from '@/components/docs/MarkdownViewer';
import { TableOfContents } from '@/components/docs/TableOfContents';
import { FileTree } from '@/components/docs/FileTree';
import { DocsPageWrapper } from '@/components/docs/DocsPageWrapper';

export default async function DocsPage(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = getDocPage(params.slug);

  if (!page) {
    notFound();
  }

  const fileTree = getFileTree();

  return (
    <DocsPageWrapper
      fileTree={
        <>
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
            Documentation
          </h2>
          <FileTree tree={fileTree} />
        </>
      }
      content={
        <article>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {page.metadata.title}
            </h1>
            {page.metadata.description && (
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {page.metadata.description}
              </p>
            )}
          </div>
          <MarkdownViewer content={page.content} />
        </article>
      }
      tableOfContents={<TableOfContents headings={page.headings} />}
    />
  );
}

export async function generateStaticParams() {
  return generateDocPaths();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = getDocPage(params.slug);

  if (!page) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: page.metadata.title,
    summary: page.metadata.description as string | undefined,
  };
}
