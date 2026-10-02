'use client';

import {SegmentedControl} from '@mantine/core';
import {usePathname, useRouter} from 'next/navigation';

const dashboardViews = [
  {label: 'Dashboard', href: '/dashboard', description: 'Overview of your dashboard'},
  {label: 'Budgets', href: '/dashboard/budgets', description: 'Overview of your budgets'},
  {label: 'Insights', href: '/dashboard/insights', description: 'Insights into your finances'},
] as const;

export function DashboardNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const activeView =
    dashboardViews.find(view => view.href !== '/dashboard' && pathname.startsWith(`${view.href}/`)) ??
    dashboardViews.find(view => pathname === view.href) ??
    dashboardViews[0];

  const handleChange = (newPath: string) => {
    router.push(newPath);
  };

  return (
    <SegmentedControl
      value={activeView.href}
      data={dashboardViews.map(({label, href}) => ({label, value: href}))}
      onChange={handleChange}
      withItemsBorders={false}
      fullWidth={false}
    />
  );
}
