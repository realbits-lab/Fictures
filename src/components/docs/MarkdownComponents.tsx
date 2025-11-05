'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { slugify } from '@/lib/docs/markdown-parser';

export const markdownComponents = {
  h1: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h1
        id={id}
        className="scroll-m-20 text-4xl font-bold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h1>
    );
  },

  h2: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10 mb-4 first:mt-0"
        {...props}
      >
        {children}
      </h2>
    );
  },

  h3: ({ children, ...props }: any) => {
    const text = String(children);
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4"
        {...props}
      >
        {children}
      </h3>
    );
  },

  h4: ({ children, ...props }: any) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props}>
      {children}
    </h4>
  ),

  h5: ({ children, ...props }: any) => (
    <h5 className="scroll-m-20 text-lg font-semibold tracking-tight mt-4 mb-2" {...props}>
      {children}
    </h5>
  ),

  h6: ({ children, ...props }: any) => (
    <h6 className="scroll-m-20 text-base font-semibold tracking-tight mt-4 mb-2" {...props}>
      {children}
    </h6>
  ),

  p: ({ children, ...props }: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props}>
      {children}
    </p>
  ),

  a: ({ children, href, ...props }: any) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      {...props}
    >
      {children}
    </a>
  ),

  ul: ({ children, ...props }: any) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }: any) => (
    <li className="mt-2" {...props}>
      {children}
    </li>
  ),

  blockquote: ({ children, ...props }: any) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props}>
      {children}
    </blockquote>
  ),

  table: ({ children, ...props }: any) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: any) => (
    <thead className="border-b" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }: any) => (
    <tbody className="[&_tr:last-child]:border-0" {...props}>
      {children}
    </tbody>
  ),

  tr: ({ children, ...props }: any) => (
    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" {...props}>
      {children}
    </tr>
  ),

  th: ({ children, ...props }: any) => (
    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: any) => (
    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props}>
      {children}
    </td>
  ),

  code: ({ inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';

    if (!inline && language) {
      // Code block with syntax highlighting
      return (
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="rounded-md my-6"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }

    // Inline code
    return (
      <code
        className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }: any) => (
    <pre className="mb-4 mt-6 overflow-x-auto rounded-lg bg-black p-4" {...props}>
      {children}
    </pre>
  ),

  hr: () => <hr className="my-8 border-border" />,

  img: ({ src, alt, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      className="rounded-md my-6 max-w-full"
      loading="lazy"
      {...props}
    />
  ),
};
