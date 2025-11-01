import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookOpenIcon, GithubIcon } from 'lucide-react';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      enabled: false, // Disable Fumadocs nav since we use GlobalNavigation
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
