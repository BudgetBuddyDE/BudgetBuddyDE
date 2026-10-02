import type {ReactNode} from 'react';
import {AppLayout} from '@/features/AppLayout/AppLayout';

export default function Layout({children}: {children: ReactNode}) {
  return <AppLayout>{children}</AppLayout>;
}
