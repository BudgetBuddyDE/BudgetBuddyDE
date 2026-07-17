import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {ReportsWorkspace} from '@/components/reporting/reports-workspace';
import {loadReportingYear} from '@/lib/data/reporting';
import {requireSession} from '@/serverAuth';

export const metadata: Metadata = {title: 'Reports'};

export default async function ReportsPage({searchParams}: {searchParams: Promise<{year?: string}>}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const parsedYear = Number(params.year);
  const year =
    Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100 ? parsedYear : new Date().getFullYear();
  const data = await loadReportingYear(year);
  return (
    <PageShell title="Reports" description="Review complete calendar years and export their transaction data.">
      <ReportsWorkspace data={data} year={year} />
    </PageShell>
  );
}
