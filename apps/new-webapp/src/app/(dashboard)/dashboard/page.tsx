import type {Metadata} from 'next';
import {DashboardWorkspace} from '@/components/dashboard/dashboard-workspace';
import {PageShell} from '@/components/page-shell';
import {loadDashboard} from '@/lib/data/dashboard';
import {requireSession} from '@/serverAuth';
import {toDateInputValue} from '@/utils/date';

export const metadata: Metadata = {title: 'Dashboard'};

export default async function DashboardPage({searchParams}: {searchParams: Promise<{period?: string}>}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const period = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.period ?? '')
    ? (params.period as string)
    : toDateInputValue(new Date()).slice(0, 7);
  const data = await loadDashboard(period);
  return (
    <PageShell title="Dashboard" description="Your monthly financial position at a glance.">
      <DashboardWorkspace data={data} period={period} />
    </PageShell>
  );
}
