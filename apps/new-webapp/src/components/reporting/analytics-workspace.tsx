'use client';

import {ChevronLeft, ChevronRight, Download} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {FeedbackPanel} from '@/components/feedback-panel';
import {Button, buttonVariants} from '@/components/ui/button';
import type {ReportingData} from '@/lib/data/reporting';
import {plannedRecurringExpenses, summarizePeriodCategories, summarizeYear} from '@/lib/reporting-summary';
import {formatPeriodLabel, shiftMonth} from '@/utils/date';
import {formatCurrency} from '@/utils/money';

export function AnalyticsWorkspace({data, period}: {data: ReportingData; period: string}) {
  const router = useRouter();
  const year = Number(period.slice(0, 4));
  const month = Number(period.slice(5, 7)) - 1;
  const summary = summarizeYear(data.history, year)[month]!;
  const categories = summarizePeriodCategories(data.categoryHistory, period);
  const max = categories[0]?.expenses ?? 1;
  const planned = plannedRecurringExpenses(data.recurring, period);
  if (data.error && !data.history.length)
    return (
      <FeedbackPanel
        kind="error"
        title="Analytics unavailable"
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
            onClick={() => router.push(`/analytics?period=${shiftMonth(period, -1)}`)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-semibold">{formatPeriodLabel(period)}</h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => router.push(`/analytics?period=${shiftMonth(period, 1)}`)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <a
          className={buttonVariants({variant: 'outline'})}
          href={`/api/export/transactions?format=csv&period=${period}`}
        >
          <Download aria-hidden="true" className="size-4" />
          Export month
        </a>
      </div>
      <section aria-label="Monthly totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Income', summary.income],
          ['Expenses', summary.expenses],
          ['Net balance', summary.balance],
          ['Planned recurring expenses', planned],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{formatCurrency(Number(value))}</p>
          </article>
        ))}
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Planned recurring vs actual expenses</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">Planned recurring</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(planned)}</p>
          </div>
          <div className="rounded-md bg-muted p-4">
            <p className="text-sm text-muted-foreground">All actual expenses</p>
            <p className="mt-1 text-xl font-semibold">{formatCurrency(summary.expenses)}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Category breakdown</h2>
        {categories.length ? (
          <div className="mt-4 space-y-4">
            {categories.map(category => (
              <div key={category.id}>
                <div className="flex justify-between gap-3 text-sm">
                  <span>{category.name}</span>
                  <span>
                    {formatCurrency(category.expenses)} expenses · {formatCurrency(category.income)} income
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{width: `${(category.expenses / max) * 100}%`}}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No category activity in this month.</p>
        )}
      </section>
    </div>
  );
}
