'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Heading } from '@/lib/docs/file-system';

interface MarkdownViewerProps {
  content: string;
  headings?: Heading[];
}

export function MarkdownViewer({ content, headings = [] }: MarkdownViewerProps) {
  // Create a map of heading text to ID for quick lookup
  const headingMap = useMemo(() => {
    const map = new Map<string, string>();
    headings.forEach(({ text, id }) => {
      map.set(text.trim(), id);
    });
    return map;
  }, [headings]);

  // Get ID for a heading, using the pre-generated ID if available
  const getHeadingId = (text: string): string => {
    const cleanText = text.trim();
    return headingMap.get(cleanText) || generateId(cleanText);
  };

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ node, ...props }) => (
            <h1 id={getHeadingId(String(props.children))} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 id={getHeadingId(String(props.children))} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 id={getHeadingId(String(props.children))} {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 id={getHeadingId(String(props.children))} {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 id={getHeadingId(String(props.children))} {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 id={getHeadingId(String(props.children))} {...props} />
          ),
          a: ({ node, href, ...props }) => (
            <a
              href={href}
              {...props}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
