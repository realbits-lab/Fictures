import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpenIcon, GithubIcon } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <BookOpenIcon className="w-5 h-5" />
          <span className="font-semibold">Fictures Docs</span>
        </>
      ),
      transparentMode: 'top',
    },
    links: [
      {
        text: 'Home',
        url: '/',
        active: false,
      },
      {
        text: 'GitHub',
        url: 'https://github.com/realbits-lab/Fictures',
        icon: <GithubIcon className="w-4 h-4" />,
      },
    ],
  };
}
