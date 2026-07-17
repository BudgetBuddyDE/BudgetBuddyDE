import type {Metadata} from 'next';
import {BudgetWorkspace} from '@/components/budgets/budget-workspace';
import {PageShell} from '@/components/page-shell';
import {loadBudgetPage} from '@/lib/data/budgets';
import {requireSession} from '@/serverAuth';
import {toDateInputValue} from '@/utils/date';

export const metadata: Metadata = {title: 'Budgets'};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{period?: string; search?: string; intent?: string; object?: string}>;
}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const period = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.period ?? '')
    ? (params.period as string)
    : toDateInputValue(new Date()).slice(0, 7);
  const data = await loadBudgetPage(period, params.search);
  return (
    <PageShell title="Budgets" description="Track category targets for one explicit month.">
      <BudgetWorkspace
        initialBudgets={data.budgets}
        categories={data.categories}
        period={period}
        initialIntent={params.intent === 'create' || params.intent === 'edit' ? params.intent : undefined}
        intentObject={params.object}
        error={data.error}
      />
    </PageShell>
  );
}
