import type {ReactNode} from 'react';
import {AppShell} from '@/components/app-shell';
import {requireSession} from '@/serverAuth';

export default async function DashboardLayout({children}: {children: ReactNode}) {
  const session = await requireSession();
  return <AppShell userName={session.user.name}>{children}</AppShell>;
}
