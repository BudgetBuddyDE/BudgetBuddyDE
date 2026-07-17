'use client';

import {ChevronLeft, ChevronRight, Download} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {FeedbackPanel} from '@/components/feedback-panel';
import {Button, buttonVariants} from '@/components/ui/button';
import type {ReportingData} from '@/lib/data/reporting';
import {summarizeYear} from '@/lib/reporting-summary';
import {formatCurrency} from '@/utils/money';

export function ReportsWorkspace({data, year}: {data: ReportingData; year: number}) {
  const router = useRouter();
  const months = summarizeYear(data.history, year);
  const max = Math.max(1, ...months.flatMap(month => [month.income, month.expenses]));
  const totals = months.reduce(
    (value, month) => ({
      income: value.income + month.income,
      expenses: value.expenses + month.expenses,
      balance: value.balance + month.balance,
    }),
    {income: 0, expenses: 0, balance: 0},
  );
  if (data.error && !data.history.length)
    return (
      <FeedbackPanel
        kind="error"
        title="Reports unavailable"
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
            aria-label="Previous year"
            onClick={() => router.push(`/reports?year=${year - 1}`)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="min-w-20 text-center text-lg font-semibold">{year}</h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next year"
            onClick={() => router.push(`/reports?year=${year + 1}`)}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <a className={buttonVariants({variant: 'outline'})} href={`/api/export/transactions?format=csv&year=${year}`}>
          <Download aria-hidden="true" className="size-4" />
          Export year
        </a>
      </div>
      <section aria-label="Annual totals" className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Annual income</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.income)}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Annual expenses</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.expenses)}</p>
        </article>
        <article className="rounded-xl border bg-card p-4">
          <p className="text-sm text-muted-foreground">Annual balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.balance)}</p>
        </article>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Income and expense trend</h2>
        <div
          className="mt-5 flex h-56 items-end gap-2"
          role="img"
          aria-label={`Monthly income and expense trend for ${year}`}
        >
          {months.map(month => (
            <div key={month.month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-44 w-full items-end justify-center gap-0.5">
                <div
                  className="w-2/5 rounded-t bg-success"
                  title={`${formatCurrency(month.income)} income`}
                  style={{height: `${(month.income / max) * 100}%`}}
                />
                <div
                  className="w-2/5 rounded-t bg-destructive"
                  title={`${formatCurrency(month.expenses)} expenses`}
                  style={{height: `${(month.expenses / max) * 100}%`}}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Intl.DateTimeFormat('en-US', {month: 'short'}).format(new Date(year, month.month, 1))}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <span>
            <i className="mr-1 inline-block size-2 rounded bg-success" />
            Income
          </span>
          <span>
            <i className="mr-1 inline-block size-2 rounded bg-destructive" />
            Expenses
          </span>
        </div>
      </section>
      <section className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <caption className="p-4 text-left font-semibold">Monthly breakdown</caption>
          <thead className="bg-muted/60">
            <tr>
              <th className="px-4 py-3 text-left">Month</th>
              <th className="px-4 py-3 text-right">Income</th>
              <th className="px-4 py-3 text-right">Expenses</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {months.map(month => (
              <tr key={month.month} className="border-t">
                <td className="px-4 py-3">
                  {new Intl.DateTimeFormat('en-US', {month: 'long'}).format(new Date(year, month.month, 1))}
                </td>
                <td className="px-4 py-3 text-right">{formatCurrency(month.income)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(month.expenses)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(month.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
