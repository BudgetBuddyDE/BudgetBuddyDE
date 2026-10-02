import type {ReactNode} from 'react';
import {SiteLayout} from '@/features/SiteLayout/SiteLayout';

export default function Layout({children}: {children: ReactNode}) {
  return <SiteLayout>{children}</SiteLayout>;
}
