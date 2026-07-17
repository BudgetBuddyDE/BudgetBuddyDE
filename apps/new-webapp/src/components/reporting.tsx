'use client';

import {ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Download, Equal, Wallet} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Badge, Button, IconButton, ProgressBar, SelectField, TextField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {downloadTextFile, serializeJson, serializeRecordsCsv} from '@/utils/export';
import {formatCurrency, formatPercent} from '@/utils/format';

function periodBounds(period: 'month' | 'year', date: Date) {
  const start =
    period === 'year' ? new Date(date.getFullYear(), 0, 1) : new Date(date.getFullYear(), date.getMonth(), 1);
  const end =
    period === 'year' ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return {start, end};
}

export function Reporting() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {data, status, error, reload} = useFinance();
  const period = searchParams.get('period') === 'year' ? 'year' : 'month';
  const rawDate = searchParams.get('date');
  const selectedDate =
    rawDate && !Number.isNaN(new Date(rawDate).getTime()) ? new Date(`${rawDate}T12:00:00`) : new Date();
  const {start, end} = periodBounds(period, selectedDate);
  const transactions = data.transactions.filter(item => item.processedAt >= start && item.processedAt < end);
  const income = transactions
    .filter(item => item.transferAmount > 0)
    .reduce((sum, item) => sum + item.transferAmount, 0);
  const expenses = Math.abs(
    transactions.filter(item => item.transferAmount < 0).reduce((sum, item) => sum + item.transferAmount, 0),
  );
  const net = income - expenses;
  const savingRate = income ? net / income : 0;
  const label =
    period === 'year'
      ? String(selectedDate.getFullYear())
      : selectedDate.toLocaleDateString('en-DE', {month: 'long', year: 'numeric'});
  const categoryTotals = new Map<string, {income: number; expenses: number}>();
  for (const item of transactions) {
    const current = categoryTotals.get(item.categoryName) ?? {income: 0, expenses: 0};
    if (item.transferAmount > 0) current.income += item.transferAmount;
    else current.expenses += Math.abs(item.transferAmount);
    categoryTotals.set(item.categoryName, current);
  }
  const rows = [...categoryTotals.entries()].toSorted(
    (a, b) => b[1].expenses + b[1].income - (a[1].expenses + a[1].income),
  );
  const exportRows = rows.map(([category, values]) => ({category, ...values}));
  const updatePeriod = (nextPeriod: string, nextDate = selectedDate) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('period', nextPeriod);
    next.set('date', nextDate.toISOString().slice(0, 10));
    router.replace(`?${next.toString()}`, {scroll: false});
  };
  const move = (direction: -1 | 1) => {
    const nextDate = new Date(selectedDate);
    if (period === 'year') nextDate.setFullYear(nextDate.getFullYear() + direction);
    else nextDate.setMonth(nextDate.getMonth() + direction);
    updatePeriod(period, nextDate);
  };
  const exportReport = (format: 'csv' | 'json') => {
    const filename = `budgetbuddy-report-${selectedDate.toISOString().slice(0, 10)}.${format}`;
    if (format === 'csv') {
      downloadTextFile(serializeRecordsCsv(exportRows), 'text/csv;charset=utf-8', filename);
    } else {
      downloadTextFile(serializeJson(exportRows), 'application/json;charset=utf-8', filename);
    }
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Analysis"
        title="Reporting"
        description="One consistent view of your cash flow, categories, budgets, and recurring commitments."
        action={
          <div className="page-actions">
            <Button variant="secondary" onClick={() => exportReport('csv')} disabled={rows.length === 0}>
              <Download size={16} /> Export CSV
            </Button>
            <Button variant="secondary" onClick={() => exportReport('json')} disabled={rows.length === 0}>
              <Download size={16} /> Export JSON
            </Button>
          </div>
        }
      />
      <section className="report-toolbar">
        <div className="period-stepper">
          <IconButton aria-label={`Previous ${period}`} onClick={() => move(-1)}>
            <ArrowLeft size={17} />
          </IconButton>
          <span>
            <CalendarDays size={17} />
            <strong>{label}</strong>
          </span>
          <IconButton aria-label={`Next ${period}`} onClick={() => move(1)}>
            <ArrowRight size={17} />
          </IconButton>
        </div>
        <div className="report-controls">
          <SelectField
            label="Period"
            className="compact-field"
            value={period}
            onChange={event => updatePeriod(event.target.value)}
          >
            <option value="month">Month</option>
            <option value="year">Full year</option>
          </SelectField>
          <TextField
            label="Reference date"
            className="compact-field"
            type="date"
            value={selectedDate.toISOString().slice(0, 10)}
            onChange={event => updatePeriod(period, new Date(`${event.target.value}T12:00:00`))}
          />
        </div>
      </section>
      {status === 'error' && (
        <StatePanel state="error" description={error ?? undefined} onRetry={() => void reload(true)} />
      )}
      <section className="report-metrics" aria-label={`${label} totals`}>
        <article>
          <span className="report-icon income">
            <ArrowUpRight size={18} />
          </span>
          <p>Income</p>
          <strong>{formatCurrency(income)}</strong>
        </article>
        <article>
          <span className="report-icon expense">
            <ArrowDownRight size={18} />
          </span>
          <p>Expenses</p>
          <strong>{formatCurrency(expenses)}</strong>
        </article>
        <article>
          <span className="report-icon net">
            <Equal size={18} />
          </span>
          <p>Net result</p>
          <strong>{formatCurrency(net)}</strong>
        </article>
        <article>
          <span className="report-icon savings">
            <Wallet size={18} />
          </span>
          <p>Savings rate</p>
          <strong>{formatPercent(savingRate)}</strong>
        </article>
      </section>
      <div className="report-grid">
        <section className="content-panel report-chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Composition</p>
              <h2>Category breakdown</h2>
            </div>
            <Badge>{transactions.length} transactions</Badge>
          </div>
          {status === 'loading' && transactions.length === 0 ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <StatePanel
              state="empty"
              title={`No activity in ${label}`}
              description="Choose another period or add a transaction."
            />
          ) : (
            <div className="category-bars">
              {rows.slice(0, 8).map(([name, values]) => {
                const value = values.income + values.expenses;
                const max = Math.max(...rows.map(([, total]) => total.income + total.expenses));
                return (
                  <div key={name} className="category-bar">
                    <span>{name}</span>
                    <div>
                      <i style={{width: `${max ? (value / max) * 100 : 0}%`}} />
                    </div>
                    <strong>{formatCurrency(value)}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="content-panel report-budget-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Limits</p>
              <h2>Budget consumption</h2>
            </div>
            <LinkToBudgets />
          </div>
          {data.budgets.length === 0 ? (
            <StatePanel
              state="empty"
              title="No budget data"
              description="Set category budgets to compare targets with actual spending."
            />
          ) : (
            <div className="budget-list">
              {data.budgets.map(budget => (
                <div key={budget.id} className="budget-progress">
                  <ProgressBar
                    label={budget.name}
                    value={budget.budget ? Math.abs(budget.balance) / budget.budget : 0}
                  />
                  <div>
                    <span>{formatCurrency(Math.abs(budget.balance))}</span>
                    <span>{formatCurrency(budget.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <section className="content-panel report-table-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Accessible data</p>
            <h2>Category totals</h2>
          </div>
        </div>
        <div className="report-table" role="table" aria-label={`Category totals for ${label}`}>
          <div className="report-table-row header" role="row">
            <span>Category</span>
            <span>Income</span>
            <span>Expenses</span>
            <span>Net</span>
          </div>
          {rows.map(([name, values]) => (
            <div key={name} className="report-table-row" role="row">
              <strong>{name}</strong>
              <span className="money income">{formatCurrency(values.income)}</span>
              <span className="money expense">{formatCurrency(values.expenses)}</span>
              <strong>{formatCurrency(values.income - values.expenses)}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LinkToBudgets() {
  return (
    <a className="text-link" href="/budgets">
      Manage budgets <ArrowRight size={14} />
    </a>
  );
}
