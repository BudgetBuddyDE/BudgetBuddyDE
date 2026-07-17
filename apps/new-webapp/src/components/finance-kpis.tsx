'use client';

import {AlertTriangle, CircleDollarSign} from 'lucide-react';
import {StatePanel} from '@/components/shared';
import {Badge} from '@/components/ui/primitives';
import {useI18n} from '@/lib/i18n';
import type {BudgetView, RecurringPaymentView, TransactionView} from '@/types/finance';
import {recurringStatus} from '@/utils/recurring-status';

interface KpiStateProps {
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
}

function KpiCard({
  label,
  value,
  detail,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  detail: string;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
}) {
  return (
    <article className="kpi-card">
      <div>
        <span>{label}</span>
        <Badge tone={tone}>{detail}</Badge>
      </div>
      <strong>{value}</strong>
    </article>
  );
}

export function TransactionKpis({
  transactions,
  periodLabel,
  loading,
  error,
  onRetry,
}: KpiStateProps & {transactions: readonly TransactionView[]; periodLabel: string}) {
  const {t, formatCurrency} = useI18n();
  if (loading && transactions.length === 0) return <StatePanel state="loading" />;
  if (error) return <StatePanel state="error" description={error} onRetry={onRetry} />;
  const total = transactions.reduce((sum, transaction) => sum + transaction.transferAmount, 0);
  const average = transactions.length > 0 ? total / transactions.length : null;
  const categoryGroups = new Map<string, {count: number; amount: number}>();
  const methodGroups = new Map<string, {count: number; amount: number}>();
  for (const transaction of transactions) {
    const category = transaction.categoryName || t('kpi.uncategorized');
    const categoryValue = categoryGroups.get(category) ?? {count: 0, amount: 0};
    categoryGroups.set(category, {
      count: categoryValue.count + 1,
      amount: categoryValue.amount + transaction.transferAmount,
    });
    const method = transaction.paymentMethodName || t('kpi.noPaymentMethod');
    const methodValue = methodGroups.get(method) ?? {count: 0, amount: 0};
    methodGroups.set(method, {count: methodValue.count + 1, amount: methodValue.amount + transaction.transferAmount});
  }
  return (
    <section className="kpi-section" aria-label={t('kpi.transactions.region', {period: periodLabel})}>
      <div className="kpi-grid">
        <KpiCard label={t('kpi.transactions.count')} value={String(transactions.length)} detail={periodLabel} />
        <KpiCard
          label={t('kpi.transactions.total')}
          value={formatCurrency(total)}
          detail={t('kpi.transactions.totalDetail')}
          tone={total < 0 ? 'danger' : 'good'}
        />
        <KpiCard
          label={t('kpi.transactions.average')}
          value={average === null ? '—' : formatCurrency(average)}
          detail={t('kpi.transactions.averageDetail')}
        />
      </div>
      {transactions.length === 0 ? (
        <StatePanel
          state="empty"
          title={t('kpi.transactions.empty')}
          description={t('kpi.transactions.emptyDescription')}
        />
      ) : (
        <div className="kpi-breakdowns">
          <KpiBreakdown title={t('kpi.byCategory')} groups={categoryGroups} />
          <KpiBreakdown title={t('kpi.byPaymentMethod')} groups={methodGroups} />
        </div>
      )}
    </section>
  );
}

function KpiBreakdown({title, groups}: {title: string; groups: ReadonlyMap<string, {count: number; amount: number}>}) {
  const {t, formatCurrency} = useI18n();
  return (
    <div className="kpi-breakdown" role="table" aria-label={title}>
      <div className="kpi-breakdown-row header" role="row">
        <span>{title}</span>
        <span>{t('kpi.count')}</span>
        <span>{t('kpi.signedAmount')}</span>
      </div>
      {[...groups.entries()]
        .toSorted((a, b) => Math.abs(b[1].amount) - Math.abs(a[1].amount))
        .map(([name, value]) => (
          <div key={name} className="kpi-breakdown-row" role="row">
            <strong>{name}</strong>
            <span>{value.count}</span>
            <span>{formatCurrency(value.amount)}</span>
          </div>
        ))}
    </div>
  );
}

export function RecurringKpis({
  payments,
  loading,
  error,
  onRetry,
}: KpiStateProps & {payments: readonly RecurringPaymentView[]}) {
  const {t} = useI18n();
  if (loading && payments.length === 0) return <StatePanel state="loading" />;
  if (error) return <StatePanel state="error" description={error} onRetry={onRetry} />;
  const counts = {active: 0, inactive: 0, expired: 0};
  for (const payment of payments) counts[recurringStatus(payment)] += 1;
  return (
    <section className="kpi-section" aria-label={t('kpi.recurring.region')}>
      <div className="kpi-grid">
        <KpiCard
          label={t('common.active')}
          value={String(counts.active)}
          detail={t('kpi.recurring.scheduled')}
          tone="good"
        />
        <KpiCard
          label={t('common.inactive')}
          value={String(counts.inactive)}
          detail={t('kpi.recurring.paused')}
          tone="warn"
        />
        <KpiCard
          label={t('common.expired')}
          value={String(counts.expired)}
          detail={t('kpi.recurring.endPassed')}
          tone="danger"
        />
      </div>
      {payments.length === 0 && <StatePanel state="empty" title={t('kpi.recurring.empty')} />}
    </section>
  );
}

export function BudgetKpis({
  budgets,
  categoryIds,
  periodLabel,
  loading,
  error,
  onRetry,
}: KpiStateProps & {budgets: readonly BudgetView[]; categoryIds: readonly string[]; periodLabel: string}) {
  const {t, formatCurrency, formatPercent} = useI18n();
  if (loading && budgets.length === 0) return <StatePanel state="loading" />;
  if (error) return <StatePanel state="error" description={error} onRetry={onRetry} />;
  const allocated = budgets.reduce((sum, budget) => sum + budget.budget, 0);
  const spent = budgets.reduce((sum, budget) => sum + Math.abs(budget.balance), 0);
  const utilization = allocated > 0 ? spent / allocated : null;
  const remaining = Math.max(0, allocated - spent);
  const overrun = Math.max(0, spent - allocated);
  const status =
    utilization === null
      ? t('kpi.budget.noAllocation')
      : utilization >= 1
        ? t('kpi.budget.over')
        : utilization >= 0.8
          ? t('kpi.budget.risk')
          : t('kpi.budget.track');
  const tone = utilization === null ? 'neutral' : utilization >= 1 ? 'danger' : utilization >= 0.8 ? 'warn' : 'good';
  const zeroBudgets = budgets.filter(budget => budget.budget === 0).length;
  const coveredCategories = new Set<string>();
  for (const budget of budgets) {
    if (budget.type === 'i') {
      for (const categoryId of budget.categoryIds) coveredCategories.add(categoryId);
    } else {
      for (const categoryId of categoryIds) {
        if (!budget.categoryIds.includes(categoryId)) coveredCategories.add(categoryId);
      }
    }
  }
  const missingBudgets = Math.max(0, categoryIds.length - coveredCategories.size);
  return (
    <section className="kpi-section" aria-label={t('kpi.budget.region', {period: periodLabel})}>
      <div className="kpi-grid budget-kpi-grid">
        <KpiCard label={t('kpi.budget.status')} value={status} detail={periodLabel} tone={tone} />
        <KpiCard
          label={t('kpi.budget.allocated')}
          value={formatCurrency(allocated)}
          detail={t('kpi.budget.budgetCount', {count: budgets.length})}
        />
        <KpiCard
          label={t('kpi.budget.spent')}
          value={formatCurrency(spent)}
          detail={t('kpi.budget.matching')}
          tone={spent > allocated && allocated > 0 ? 'danger' : 'neutral'}
        />
        <KpiCard
          label={t('kpi.budget.utilization')}
          value={utilization === null ? t('kpi.budget.notAvailable') : formatPercent(utilization)}
          detail={allocated === 0 ? t('kpi.budget.noPositive') : t('kpi.budget.formula')}
          tone={tone}
        />
        <KpiCard
          label={t('kpi.budget.remaining')}
          value={formatCurrency(remaining)}
          detail={t('kpi.budget.within')}
          tone="good"
        />
        <KpiCard
          label={t('kpi.budget.overrun')}
          value={formatCurrency(overrun)}
          detail={t('kpi.budget.above')}
          tone={overrun > 0 ? 'danger' : 'neutral'}
        />
      </div>
      <div className="kpi-footnote">
        <span>
          <CircleDollarSign size={15} aria-hidden="true" /> {t('kpi.budget.zero', {count: zeroBudgets})}
        </span>
        <span>
          <AlertTriangle size={15} aria-hidden="true" /> {t('kpi.budget.missing', {count: missingBudgets})}
        </span>
      </div>
      {budgets.length === 0 && (
        <StatePanel state="empty" title={t('kpi.budget.empty')} description={t('kpi.budget.emptyDescription')} />
      )}
    </section>
  );
}
