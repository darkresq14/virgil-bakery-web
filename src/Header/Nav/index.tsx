'use client';

import type React from 'react';
import { CMSLink } from '@/components/Link';
import type { Header as HeaderType } from '@/payload-types';

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || [];

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map((item) => {
        return <CMSLink key={item.id ?? item.link.label} {...item.link} appearance="link" />;
      })}
    </nav>
  );
};
