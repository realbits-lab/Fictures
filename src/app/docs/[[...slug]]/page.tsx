import { source } from '@/lib/source';
import type { Metadata } from 'next';
import { DocsPage, DocsBody } from 'fumadocs-ui/page';
import { notFound } from 'next/navigation';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  console.log('[DOCS PAGE] Starting render');
  console.log('[DOCS PAGE] Props:', JSON.stringify(props, null, 2));

  const params = await props.params;
  console.log('[DOCS PAGE] Params:', params);
  console.log('[DOCS PAGE] Slug:', params.slug);

  const page = source.getPage(params.slug);
  console.log('[DOCS PAGE] Page found:', !!page);

  if (!page) {
    console.error('[DOCS PAGE] Page not found for slug:', params.slug);
    notFound();
  }

  console.log('[DOCS PAGE] Page data:', {
    title: page.data.title,
    description: page.data.description,
    hasToc: !!page.data.toc,
    tocLength: page.data.toc?.length,
    full: page.data.full,
    hasBody: !!page.data.body,
  });

  const MDX = page.data.body;
  console.log('[DOCS PAGE] MDX component:', typeof MDX);

  console.log('[DOCS PAGE] Rendering DocsPage with toc:', page.data.toc);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
