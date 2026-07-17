import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {PaymentMethodWorkspace} from '@/components/payment-methods/payment-method-workspace';
import {loadPaymentMethodPage} from '@/lib/data/payment-methods';
import {requireSession} from '@/serverAuth';
import {parseListQuery} from '@/utils/pagination-query';

export const metadata: Metadata = {title: 'Payment methods'};

export default async function PaymentMethodsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const query = parseListQuery(params);
  const data = await loadPaymentMethodPage(query.search, query.page, query.pageSize);
  return (
    <PageShell title="Payment methods" description="Manage active accounts and preserve historical payment sources.">
      <PaymentMethodWorkspace
        initialPaymentMethods={data.paymentMethods}
        totalCount={data.totalCount}
        search={query.search}
        page={query.page}
        pageSize={query.pageSize}
        initialIntent={params.intent === 'create' || params.intent === 'edit' ? params.intent : undefined}
        intentObject={typeof params.object === 'string' ? params.object : undefined}
        error={data.error}
      />
    </PageShell>
  );
}
