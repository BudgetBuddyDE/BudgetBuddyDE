import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {RecurringPaymentWorkspace} from '@/components/recurring-payments/recurring-payment-workspace';
import {loadRecurringPaymentPage} from '@/lib/data/recurring-payments';
import {requireSession} from '@/serverAuth';
import {parseListQuery} from '@/utils/pagination-query';

export const metadata: Metadata = {title: 'Recurring payments'};

export default async function RecurringPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const query = parseListQuery(params);
  const rawStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = rawStatus === 'active' || rawStatus === 'paused' ? rawStatus : 'all';
  const data = await loadRecurringPaymentPage({...query, status});
  return (
    <PageShell title="Recurring payments" description="Plan monthly, quarterly, and yearly finance events.">
      <RecurringPaymentWorkspace
        initialPayments={data.payments}
        totalCount={data.totalCount}
        categories={data.categories}
        paymentMethods={data.paymentMethods}
        search={query.search}
        statusFilter={status}
        page={query.page}
        pageSize={query.pageSize}
        initialIntent={params.intent === 'create' || params.intent === 'edit' ? params.intent : undefined}
        intentObject={typeof params.object === 'string' ? params.object : undefined}
        error={data.error}
      />
    </PageShell>
  );
}
