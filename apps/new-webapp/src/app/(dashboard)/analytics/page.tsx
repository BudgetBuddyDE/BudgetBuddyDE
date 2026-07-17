import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {AnalyticsWorkspace} from '@/components/reporting/analytics-workspace';
import {loadReportingYear} from '@/lib/data/reporting';
import {requireSession} from '@/serverAuth';
import {toDateInputValue} from '@/utils/date';

export const metadata: Metadata = {title: 'Analytics'};

export default async function AnalyticsPage({searchParams}: {searchParams: Promise<{period?: string}>}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const period = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.period ?? '')
    ? (params.period as string)
    : toDateInputValue(new Date()).slice(0, 7);
  const data = await loadReportingYear(Number(period.slice(0, 4)));
  return (
    <PageShell
      title="Analytics"
      description="Compare actual activity, categories, and recurring plans for a selected month."
    >
      <AnalyticsWorkspace data={data} period={period} />
    </PageShell>
  );
}
