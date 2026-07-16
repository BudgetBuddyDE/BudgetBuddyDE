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
import {formatCurrency, formatDate} from '@/utils/format';

export function Dashboard() {
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
    .filter(item => !item.paused)
    .toSorted((a, b) => a.nextExecutionAt.getTime() - b.nextExecutionAt.getTime())
    .slice(0, 4);
  const uncategorized = monthly.filter(item => !item.categoryId).length;
  const overBudget = data.budgets.filter(item => Math.abs(item.balance) > item.budget);

  return (
    <div className="page-stack dashboard-page">
      <PageHeader
        eyebrow={`${now.toLocaleDateString('en', {weekday: 'long'})} · Financial overview`}
        title="Good to see you."
        description="Your month at a glance, with the next decisions already surfaced."
        action={
          <Button onClick={() => window.location.assign('/transactions?intent=create')}>
            <Plus size={17} /> Add transaction
          </Button>
        }
      />
      {status === 'error' && (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void reload(true)} />
      )}
      <section className="metric-grid" aria-label="Monthly summary">
        <article className="metric-card metric-featured">
          <div className="metric-top">
            <span>Net balance</span>
            <WalletCards size={18} />
          </div>
          <strong>{formatCurrency(balance)}</strong>
          <p>
            <TrendingUp size={15} /> Current month cash flow
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
            <span>Income</span>
            <span className="icon-good">
              <ArrowUpRight size={18} />
            </span>
          </div>
          <strong>{formatCurrency(income)}</strong>
          <p className="muted">Across {monthly.filter(item => item.transferAmount > 0).length} entries</p>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>Expenses</span>
            <span className="icon-danger">
              <ArrowDownRight size={18} />
            </span>
          </div>
          <strong>{formatCurrency(expenses)}</strong>
          <p className="muted">Across {monthly.filter(item => item.transferAmount < 0).length} entries</p>
        </article>
        <article className="metric-card">
          <div className="metric-top">
            <span>Budget health</span>
            <span className="icon-warn">
              <CircleAlert size={18} />
            </span>
          </div>
          <strong>{overBudget.length ? `${overBudget.length} over` : 'On track'}</strong>
          <p className="muted">
            {data.budgets.length} active budget{data.budgets.length === 1 ? '' : 's'}
          </p>
        </article>
      </section>
      {(overBudget.length > 0 || uncategorized > 0) && (
        <section className="attention-strip" aria-label="Needs attention">
          <span className="attention-icon">
            <CircleAlert size={19} />
          </span>
          <div>
            <strong>Needs your attention</strong>
            <p>
              {overBudget.length > 0
                ? `${overBudget.length} budget ${overBudget.length === 1 ? 'is' : 'are'} above the target.`
                : ''}{' '}
              {uncategorized > 0
                ? `${uncategorized} transaction${uncategorized === 1 ? ' is' : 's are'} uncategorized.`
                : ''}
            </p>
          </div>
          <Link href={overBudget.length ? '/budgets' : '/transactions'}>
            Review <ArrowRight size={15} />
          </Link>
        </section>
      )}
      <div className="dashboard-grid">
        <section className="content-panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Recent transactions</h2>
            </div>
            <Link href="/transactions">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && recent.length === 0 ? (
            <SkeletonRows />
          ) : recent.length === 0 ? (
            <StatePanel
              state="empty"
              title="No transactions this month"
              description="Add an income or expense to start your overview."
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
              <p className="eyebrow">Next up</p>
              <h2>Upcoming payments</h2>
            </div>
            <Link href="/recurring-payments">
              Manage <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && upcoming.length === 0 ? (
            <SkeletonRows count={4} />
          ) : upcoming.length === 0 ? (
            <StatePanel
              state="empty"
              title="No upcoming payments"
              description="Your scheduled commitments will appear here."
            />
          ) : (
            <div className="upcoming-list">
              {upcoming.map(item => (
                <div key={item.id} className="upcoming-item">
                  <span className="date-tile">
                    <strong>{item.nextExecutionAt.getDate()}</strong>
                    <small>{item.nextExecutionAt.toLocaleString('en', {month: 'short'})}</small>
                  </span>
                  <span>
                    <strong>{item.receiver}</strong>
                    <small>
                      {item.categoryName} · {item.interval}
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
              <p className="eyebrow">Guardrails</p>
              <h2>Budget progress</h2>
            </div>
            <Link href="/budgets">
              All budgets <ArrowRight size={15} />
            </Link>
          </div>
          {status === 'loading' && data.budgets.length === 0 ? (
            <SkeletonRows count={4} />
          ) : data.budgets.length === 0 ? (
            <StatePanel
              state="empty"
              title="No budgets set"
              description="Create a budget to track category spending."
            />
          ) : (
            <div className="budget-list">
              {data.budgets.slice(0, 4).map(item => {
                const ratio = item.budget ? Math.abs(item.balance) / item.budget : 0;
                return (
                  <div key={item.id} className="budget-progress">
                    <ProgressBar value={ratio} label={item.name} />
                    <div>
                      <span>{formatCurrency(Math.abs(item.balance))} spent</span>
                      <span>{formatCurrency(item.budget)} target</span>
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
              <p className="eyebrow">Pattern</p>
              <h2>Expense mix</h2>
            </div>
            <Badge tone="neutral">This month</Badge>
          </div>
          <ExpenseMix />
        </section>
      </div>
    </div>
  );
}

function ExpenseMix() {
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
        title="No expense data"
        description="Category insights appear after your first expense."
      />
    );
  return (
    <div className="mix-chart" role="img" aria-label="Expense distribution by category">
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
