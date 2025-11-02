import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocPage, generateDocPaths } from '@/lib/docs/file-system';
import { MarkdownViewer } from '@/components/docs/MarkdownViewer';
import { TableOfContents } from '@/components/docs/TableOfContents';

export default async function DocsPage(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = getDocPage(params.slug);

  if (!page) {
    notFound();
  }

  return (
    <>
      {/* Main Content */}
      <article className="pr-0 xl:pr-72">
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

      {/* Right Panel - Table of Contents */}
      <aside className="hidden xl:block fixed right-0 top-20 bottom-0 w-64 border-l border-gray-200 dark:border-gray-800">
        <div className="h-full overflow-y-auto px-4 py-6">
          <TableOfContents headings={page.headings} />
        </div>
      </aside>
    </>
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
    description: page.metadata.description as string | undefined,
  };
}
