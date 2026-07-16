'use client';

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleAlert,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Badge, Button, ProgressBar} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';
import {recurringStatus} from '@/utils/recurring-status';

export function Dashboard() {
  const {t, formatCurrency, formatDate} = useI18n();
  const {data, status, error, reload} = useFinance();
  const now = new Date();
  const monthly = data.transactions.filter(
    item => item.processedAt.getFullYear() === now.getFullYear() && item.processedAt.getMonth() === now.getMonth(),
  );
  const income = monthly.filter(item => item.transferAmount > 0).reduce((sum, item) => sum + item.transferAmount, 0);
  const expenses = Math.abs(
    monthly.filter(item => item.transferAmount < 0).reduce((sum, item) => sum + item.transferAmount, 0),
  );
  const balance = income - expenses;
  const recent = data.transactions.toSorted((a, b) => b.processedAt.getTime() - a.processedAt.getTime()).slice(0, 5);
  const upcoming = data.recurring
    .filter(item => recurringStatus(item) === 'active')
    .toSorted((a, b) => a.nextExecutionAt.getTime() - b.nextExecutionAt.getTime())
    .slice(0, 4);
  const uncategorized = monthly.filter(item => !item.categoryId).length;
  const overBudget = data.budgets.filter(item => Math.abs(item.balance) > item.budget);

  return (
    <div className="page-stack dashboard-page">
      <PageHeader
        eyebrow={`${formatDate(now, {weekday: 'long'})} · ${t('dashboard.overview')}`}
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        action={
          <Button onClick={() => window.location.assign('/transactions?intent=create')}>
            <Plus size={17} /> {t('dashboard.addTransaction')}
          </Button>
        }
      />
      {status === 'error' && (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void reload(true)} />
      )}
      <section className="metric-grid" aria-label={t('dashboard.monthlySummary')}>
        <article className="metric-card metric-featured">
          <div className="metric-top">
            <span>{t('dashboard.netBalance')}</span>
            <WalletCards size={18} />
          </div>
          <strong>{formatCurrency(balance)}</strong>
          <p>
            <TrendingUp size={15} /> {t('dashboard.cashFlow')}
          </p>
          <div className="metric-sparkline" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>{t('entity.income')}</span>
            <span className="icon-good">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <strong>{formatCurrency(income)}</strong>
          <p className="muted">
            {t('dashboard.entryCount', {count: monthly.filter(item => item.transferAmount > 0).length})}
          </p>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>{t('entity.expenses')}</span>
            <span className="icon-danger">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <strong>{formatCurrency(expenses)}</strong>
          <p className="muted">
            {t('dashboard.entryCount', {count: monthly.filter(item => item.transferAmount < 0).length})}
          </p>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>{t('dashboard.budgetHealth')}</span>
            <span className="icon-warn">
              <CircleAlert size={18} />
            </span>
          </div>
          <strong>
            {overBudget.length ? t('dashboard.overCount', {count: overBudget.length}) : t('kpi.budget.track')}
          </strong>
          <p className="muted">{t('dashboard.activeBudgets', {count: data.budgets.length})}</p>
        </article>
      </section>
      {(overBudget.length > 0 || uncategorized > 0) && (
        <section className="attention-strip" aria-label={t('dashboard.needsAttention')}>
          <span className="attention-icon">
            <CircleAlert size={19} />
          </span>
          <div>
            <strong>{t('dashboard.needsAttention')}</strong>
            <p>
              {overBudget.length > 0 ? t('dashboard.budgetsOver', {count: overBudget.length}) : ''}{' '}
              {uncategorized > 0 ? t('dashboard.uncategorized', {count: uncategorized}) : ''}
            </p>
          </div>
          <Link href={overBudget.length ? '/budgets' : '/transactions'}>
            {t('dashboard.review')} <ArrowRight size={15} />
          </Link>
        </section>
      )}
      <div className="dashboard-grid">
        <section className="content-panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.activity')}</p>
              <h2>{t('dashboard.recent')}</h2>
            </div>
            <Link href="/transactions">
              {t('dashboard.viewAll')} <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && recent.length === 0 ? (
            <SkeletonRows />
          ) : recent.length === 0 ? (
            <StatePanel
              state="empty"
              title={t('dashboard.noTransactions')}
              description={t('dashboard.noTransactionsDescription')}
            />
          ) : (
            <div className="transaction-list">
              {recent.map(item => (
                <Link key={item.id} href={`/transactions?intent=edit&id=${item.id}`} className="transaction-item">
                  <span className="transaction-icon">
                    <ReceiptText size={17} />
                  </span>
                  <span>
                    <strong>{item.receiver}</strong>
                    <small>
                      {item.categoryName} · {formatDate(item.processedAt)}
                    </small>
                  </span>
                  <strong className={item.transferAmount < 0 ? 'money expense' : 'money income'}>
                    {formatCurrency(item.transferAmount)}
                  </strong>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="content-panel upcoming-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.nextUp')}</p>
              <h2>{t('dashboard.upcoming')}</h2>
            </div>
            <Link href="/recurring-payments">
              {t('dashboard.manage')} <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && upcoming.length === 0 ? (
            <SkeletonRows count={4} />
          ) : upcoming.length === 0 ? (
            <StatePanel
              state="empty"
              title={t('dashboard.noUpcoming')}
              description={t('dashboard.noUpcomingDescription')}
            />
          ) : (
            <div className="upcoming-list">
              {upcoming.map(item => (
                <div key={item.id} className="upcoming-item">
                  <span className="date-tile">
                    <strong>{item.nextExecutionAt.getDate()}</strong>
                    <small>{formatDate(item.nextExecutionAt, {month: 'short'})}</small>
                  </span>
                  <span>
                    <strong>{item.receiver}</strong>
                    <small>
                      {item.categoryName} · {t(`entity.${item.interval}`)}
                    </small>
                  </span>
                  <strong className="money expense">{formatCurrency(item.transferAmount)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="content-panel budget-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.guardrails')}</p>
              <h2>{t('dashboard.budgetProgress')}</h2>
            </div>
            <Link href="/budgets">
              {t('dashboard.allBudgets')} <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && data.budgets.length === 0 ? (
            <SkeletonRows count={4} />
          ) : data.budgets.length === 0 ? (
            <StatePanel
              state="empty"
              title={t('dashboard.noBudgets')}
              description={t('dashboard.noBudgetsDescription')}
            />
          ) : (
            <div className="budget-list">
              {data.budgets.slice(0, 4).map(item => {
                const ratio = item.budget ? Math.abs(item.balance) / item.budget : 0;
                return (
                  <div key={item.id} className="budget-progress">
                    <ProgressBar value={ratio} label={item.name} />
                    <div>
                      <span>{t('entity.spent', {amount: formatCurrency(Math.abs(item.balance))})}</span>
                      <span>{t('dashboard.target', {amount: formatCurrency(item.budget)})}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="content-panel insight-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('dashboard.pattern')}</p>
              <h2>{t('dashboard.expenseMix')}</h2>
            </div>
            <Badge tone="neutral">{t('dashboard.thisMonth')}</Badge>
          </div>
          <ExpenseMix />
        </section>
      </div>
    </div>
  );
}

function ExpenseMix() {
  const {t, formatCurrency} = useI18n();
  const {data} = useFinance();
  const totals = new Map<string, number>();
  for (const item of data.transactions)
    if (item.transferAmount < 0)
      totals.set(item.categoryName, (totals.get(item.categoryName) ?? 0) + Math.abs(item.transferAmount));
  const rows = [...totals.entries()].toSorted((a, b) => b[1] - a[1]).slice(0, 5);
  const total = rows.reduce((sum, row) => sum + row[1], 0);
  if (!rows.length)
    return (
      <StatePanel
        state="empty"
        title={t('dashboard.noExpenseData')}
        description={t('dashboard.noExpenseDescription')}
      />
    );
  return (
    <div className="mix-chart" role="img" aria-label={t('dashboard.expenseDistribution')}>
      {rows.map(([name, value], index) => (
        <div key={name} className="mix-row">
          <span>{name}</span>
          <div>
            <i style={{width: `${total ? (value / total) * 100 : 0}%`, '--bar-index': index} as React.CSSProperties} />
          </div>
          <strong>{formatCurrency(value)}</strong>
        </div>
      ))}
    </div>
  );
}
