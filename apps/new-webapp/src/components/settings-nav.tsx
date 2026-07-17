'use client';

import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {cn} from '@/utils/cn';

const items = [
  {href: '/settings/profile', label: 'Profile'},
  {href: '/settings/sessions', label: 'Sessions'},
  {href: '/settings/api-keys', label: 'API keys'},
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="mb-5 flex gap-1 overflow-x-auto border-b">
      {items.map(item => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
          className={cn(
            'whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground',
            pathname === item.href && 'border-primary text-foreground',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
