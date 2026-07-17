'use client';

import {ChevronLeft, ChevronRight} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {FeedbackPanel} from '@/components/feedback-panel';
import {Button} from '@/components/ui/button';
import {summarizeBalance, summarizeBudgetHealth, summarizeCategories} from '@/lib/dashboard-summary';
import type {DashboardData} from '@/lib/data/dashboard';
import {formatDate, formatPeriodLabel, shiftMonth} from '@/utils/date';
import {formatCurrency} from '@/utils/money';

export function DashboardWorkspace({data, period}: {data: DashboardData; period: string}) {
  const router = useRouter();
  const totals = summarizeBalance(data.history);
  const categories = summarizeCategories(data.categoryHistory).slice(0, 5);
  const maxCategory = categories[0]?.amount ?? 1;
  const budgetHealth = summarizeBudgetHealth(data.budgets);
  if (data.error && !data.history.length && !data.recentTransactions.length)
    return (
      <FeedbackPanel
        kind="error"
        title="Dashboard unavailable"
        description={data.error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => router.push(`/dashboard?period=${shiftMonth(period, -1)}`)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-semibold">{formatPeriodLabel(period)}</h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => router.push(`/dashboard?period=${shiftMonth(period, 1)}`)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <Link href="/transactions">
          <Button>Record transaction</Button>
        </Link>
      </div>
      {data.error ? (
        <p role="status" className="rounded-md bg-warning/10 p-3 text-sm">
          {data.error}
        </p>
      ) : null}
      <section aria-label="Financial summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Income', formatCurrency(totals.income)],
          ['Expenses', formatCurrency(totals.expenses)],
          ['Balance', formatCurrency(totals.balance)],
          ['Savings rate', totals.savingsRate === null ? 'No income' : `${totals.savingsRate.toFixed(1)}%`],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Largest expense categories</h2>
            <Link className="text-sm text-primary hover:underline" href={`/analytics?period=${period}`}>
              Analyze
            </Link>
          </div>
          {categories.length ? (
            <div className="mt-4 space-y-3">
              {categories.map(category => (
                <div key={category.id}>
                  <div className="flex justify-between text-sm">
                    <span>{category.name}</span>
                    <span>{formatCurrency(category.amount)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{width: `${(category.amount / maxCategory) * 100}%`}}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No expenses in this month.</p>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Budget status</h2>
            <Link className="text-sm text-primary hover:underline" href={`/budgets?period=${period}`}>
              Manage
            </Link>
          </div>
          {budgetHealth.length ? (
            <ul className="mt-4 space-y-3">
              {budgetHealth.slice(0, 5).map(budget => (
                <li key={budget.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>{budget.name}</span>
                  <span className={budget.exceeded ? 'font-medium text-destructive' : ''}>
                    {Math.round(budget.percentage)}%{budget.exceeded ? ' · exceeded' : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No budgets for this month.</p>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent transactions</h2>
            <Link className="text-sm text-primary hover:underline" href="/transactions">
              View all
            </Link>
          </div>
          {data.recentTransactions.length ? (
            <ul className="mt-4 divide-y">
              {data.recentTransactions.map(transaction => (
                <li key={transaction.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {transaction.receiver || transaction.information || 'Transaction'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.processedAt)}</p>
                  </div>
                  <span
                    className={
                      transaction.transferAmount < 0 ? 'font-medium text-destructive' : 'font-medium text-success'
                    }
                  >
                    {formatCurrency(transaction.transferAmount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No transactions in this month.</p>
          )}
        </section>
        <section className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Upcoming recurring payments</h2>
            <Link className="text-sm text-primary hover:underline" href="/recurring-payments">
              Plan
            </Link>
          </div>
          {data.upcoming.length ? (
            <ul className="mt-4 divide-y">
              {data.upcoming.map(payment => (
                <li key={payment.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {payment.receiver || payment.information || 'Recurring payment'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(payment.nextExecutionAt)}</p>
                  </div>
                  <span className="font-medium">{formatCurrency(payment.transferAmount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nothing due in the next 31 days.</p>
          )}
        </section>
      </div>
    </div>
  );
}
