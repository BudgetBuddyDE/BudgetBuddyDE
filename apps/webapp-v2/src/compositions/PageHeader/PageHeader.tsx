'use client';

import {Anchor, Box, Stack, Title} from '@mantine/core';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import classes from './PageHeader.module.css';

export interface PageHeaderTab {
  label: string;
  href: string;
}

export interface PageHeaderProps {
  title: string;
  tabs?: readonly PageHeaderTab[];
}

export function PageHeader({title, tabs}: PageHeaderProps) {
  const pathname = usePathname();
  const activeTab = tabs
    ?.filter(tab => pathname === tab.href || pathname.startsWith(`${tab.href}/`))
    .sort((first, second) => second.href.length - first.href.length)[0];

  return (
    <Stack gap="md" mb="lg" miw={0}>
      <Title order={1}>{title}</Title>
      {tabs && tabs.length > 0 && (
        <Box component="nav" aria-label={`${title} pages`} className={classes.tabs}>
          {tabs.map(tab => (
            <Anchor
              key={tab.href}
              component={Link}
              href={tab.href}
              aria-current={activeTab?.href === tab.href ? 'page' : undefined}
              className={classes.tab}
              underline="never"
            >
              {tab.label}
            </Anchor>
          ))}
        </Box>
      )}
    </Stack>
  );
}
