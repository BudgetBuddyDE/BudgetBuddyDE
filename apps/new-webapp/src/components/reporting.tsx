'use client';

import {ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Download, Equal, Wallet} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Badge, Button, IconButton, ProgressBar, SelectField, TextField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';

function periodBounds(period: 'month' | 'year', date: Date) {
  const start =
    period === 'year' ? new Date(date.getFullYear(), 0, 1) : new Date(date.getFullYear(), date.getMonth(), 1);
  const end =
    period === 'year' ? new Date(date.getFullYear() + 1, 0, 1) : new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return {start, end};
}

export function Reporting() {
  const {t, formatCurrency, formatDate, formatPercent} = useI18n();
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
    period === 'year' ? String(selectedDate.getFullYear()) : formatDate(selectedDate, {month: 'long', year: 'numeric'});
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
  const exportCsv = () => {
    const csv = [
      [t('common.category'), t('entity.income'), t('entity.expenses')].join(','),
      ...rows.map(([name, values]) => `"${name.replaceAll('"', '""')}",${values.income},${values.expenses}`),
    ].join('\n');
    const href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'}));
    const link = document.createElement('a');
    link.href = href;
    link.download = `budgetbuddy-report-${selectedDate.toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={t('reporting.analysis')}
        title={t('reporting.title')}
        description={t('reporting.description')}
        action={
          <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={16} /> {t('common.exportCsv')}
          </Button>
        }
      />
      <section className="report-toolbar">
        <div className="period-stepper">
          <IconButton
            aria-label={t('reporting.previousPeriod', {period: t(`reporting.${period}`)})}
            onClick={() => move(-1)}
          >
            <ArrowLeft size={17} />
          </IconButton>
          <span>
            <CalendarDays size={17} />
            <strong>{label}</strong>
          </span>
          <IconButton
            aria-label={t('reporting.nextPeriod', {period: t(`reporting.${period}`)})}
            onClick={() => move(1)}
          >
            <ArrowRight size={17} />
          </IconButton>
        </div>
        <div className="report-controls">
          <SelectField
            label={t('reporting.period')}
            className="compact-field"
            value={period}
            onChange={event => updatePeriod(event.target.value)}
          >
            <option value="month">{t('reporting.month')}</option>
            <option value="year">{t('reporting.year')}</option>
          </SelectField>
          <TextField
            label={t('reporting.referenceDate')}
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
      <section className="report-metrics" aria-label={t('reporting.totals', {period: label})}>
        <article>
          <span className="report-icon income">
            <ArrowUpRight size={18} />
          </span>
          <p>{t('entity.income')}</p>
          <strong>{formatCurrency(income)}</strong>
        </article>
        <article>
          <span className="report-icon expense">
            <ArrowDownRight size={18} />
          </span>
          <p>{t('entity.expenses')}</p>
          <strong>{formatCurrency(expenses)}</strong>
        </article>
        <article>
          <span className="report-icon net">
            <Equal size={18} />
          </span>
          <p>{t('reporting.net')}</p>
          <strong>{formatCurrency(net)}</strong>
        </article>
        <article>
          <span className="report-icon savings">
            <Wallet size={18} />
          </span>
          <p>{t('reporting.savingsRate')}</p>
          <strong>{formatPercent(savingRate)}</strong>
        </article>
      </section>
      <div className="report-grid">
        <section className="content-panel report-chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">{t('reporting.composition')}</p>
              <h2>{t('reporting.categoryBreakdown')}</h2>
            </div>
            <Badge>{t('transaction.count', {count: transactions.length})}</Badge>
          </div>
          {status === 'loading' && transactions.length === 0 ? (
            <SkeletonRows />
          ) : rows.length === 0 ? (
            <StatePanel
              state="empty"
              title={t('reporting.noActivity', {period: label})}
              description={t('reporting.noActivityDescription')}
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
              <p className="eyebrow">{t('reporting.limits')}</p>
              <h2>{t('reporting.budgetConsumption')}</h2>
            </div>
            <LinkToBudgets />
          </div>
          {data.budgets.length === 0 ? (
            <StatePanel
              state="empty"
              title={t('reporting.noBudgets')}
              description={t('reporting.noBudgetsDescription')}
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
            <p className="eyebrow">{t('reporting.accessibleData')}</p>
            <h2>{t('reporting.categoryTotals')}</h2>
          </div>
        </div>
        <div className="report-table" role="table" aria-label={t('reporting.categoryTotalsFor', {period: label})}>
          <div className="report-table-row header" role="row">
            <span>{t('common.category')}</span>
            <span>{t('entity.income')}</span>
            <span>{t('entity.expenses')}</span>
            <span>{t('reporting.net')}</span>
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
  const {t} = useI18n();
  return (
    <a className="text-link" href="/budgets">
      {t('reporting.manageBudgets')} <ArrowRight size={14} />
    </a>
  );
}
