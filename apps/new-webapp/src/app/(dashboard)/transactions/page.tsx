import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {TransactionWorkspace} from '@/components/transactions/transaction-workspace';
import {loadTransactionPage} from '@/lib/data/transactions';
import {requireSession} from '@/serverAuth';
import {parseTransactionQuery} from '@/utils/transaction-query';

export const metadata: Metadata = {title: 'Transactions'};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, session] = await Promise.all([searchParams, requireSession()]);
  const query = parseTransactionQuery(params);
  const data = await loadTransactionPage(session.user.id, query);
  return (
    <PageShell title="Transactions" description="Record, filter, and review income and expenses.">
      <TransactionWorkspace
        initialTransactions={data.transactions}
        totalCount={data.totalCount}
        categories={data.categories}
        paymentMethods={data.paymentMethods}
        query={query}
        initialIntent={
          params.intent === 'create' || params.intent === 'edit' || params.intent === 'attach'
            ? params.intent
            : undefined
        }
        intentObject={typeof params.object === 'string' ? params.object : undefined}
        error={data.error}
      />
    </PageShell>
  );
}
