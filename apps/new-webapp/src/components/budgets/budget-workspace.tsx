'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {ChevronLeft, ChevronRight, Pencil, Plus, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {FeedbackPanel} from '@/components/feedback-panel';
import {IntentObjectPicker} from '@/components/intent-object-picker';
import {Button} from '@/components/ui/button';
import {deleteBudget} from '@/lib/budget-mutations';
import {formatPeriodLabel, shiftMonth} from '@/utils/date';
import {formatCurrency} from '@/utils/money';
import {BudgetDialog} from './budget-dialog';

export function BudgetWorkspace({
  initialBudgets,
  categories,
  period,
  initialIntent,
  intentObject,
  error,
}: {
  initialBudgets: TBudget[];
  categories: TCategoryVH[];
  period: string;
  initialIntent?: 'create' | 'edit';
  intentObject?: string;
  error?: string;
}) {
  const router = useRouter();
  const [budgets, setBudgets] = useState(initialBudgets);
  const [editing, setEditing] = useState<TBudget>();
  const [createOpen, setCreateOpen] = useState(false);
  const [intentMatches, setIntentMatches] = useState<TBudget[]>([]);
  const [deleting, setDeleting] = useState<TBudget>();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{kind: 'success' | 'error'; message: string}>();
  useEffect(() => setBudgets(initialBudgets), [initialBudgets]);
  useEffect(() => {
    if (initialIntent === 'create') setCreateOpen(true);
    if (initialIntent !== 'edit' || !intentObject) return;
    const normalized = intentObject.toLocaleLowerCase();
    const matches = initialBudgets.filter(budget => budget.name.toLocaleLowerCase().includes(normalized));
    if (matches.length === 1) setEditing(matches[0]);
    else if (matches.length > 1) setIntentMatches(matches);
    else setStatus({kind: 'error', message: 'No budget matches this intent in the selected month.'});
  }, [initialBudgets, initialIntent, intentObject]);
  const navigatePeriod = (nextPeriod: string) => router.push(`/budgets?period=${nextPeriod}`);
  const refresh = (message: string) => {
    setStatus({kind: 'success', message});
    router.refresh();
  };
  const remove = async () => {
    if (!deleting) return;
    setPending(true);
    const success = await deleteBudget(deleting.id);
    setPending(false);
    if (!success) {
      setStatus({kind: 'error', message: 'The budget could not be deleted.'});
      return;
    }
    setBudgets(current => current.filter(budget => budget.id !== deleting.id));
    setDeleting(undefined);
    refresh('Budget deleted.');
  };
  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Budgets unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            onClick={() => navigatePeriod(shiftMonth(period, -1))}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <h2 className="min-w-36 text-center font-semibold">{formatPeriodLabel(period)}</h2>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            onClick={() => navigatePeriod(shiftMonth(period, 1))}
          >
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Add budget
        </Button>
      </div>
      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={
            status.kind === 'error'
              ? 'rounded-md bg-destructive/10 p-3 text-sm text-destructive'
              : 'rounded-md bg-success/10 p-3 text-sm'
          }
        >
          {status.message}
        </p>
      ) : null}
      {budgets.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {budgets.map(budget => {
            const spent = Math.abs(budget.balance);
            const percentage = budget.budget === 0 ? 100 : Math.round((spent / budget.budget) * 100);
            const exceeded = spent > budget.budget;
            const warning = budget.budget !== 0 && !exceeded && percentage >= budget.warningThreshold;
            const state =
              budget.budget === 0
                ? 'Zero budget'
                : exceeded
                  ? `Exceeded by ${formatCurrency(spent - budget.budget)}`
                  : warning
                    ? 'Near limit'
                    : 'On track';
            return (
              <article key={budget.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{budget.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {budget.type === 'e' ? 'Expense' : 'Income'} ·{' '}
                      {budget.categories.map(link => link.category.name).join(', ')}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${budget.name}`}
                      onClick={() => setEditing(budget)}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${budget.name}`}
                      onClick={() => setDeleting(budget)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold">{formatCurrency(spent)}</p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(budget.budget)} · {Math.max(0, percentage)}%
                    </p>
                  </div>
                  <span
                    className={
                      exceeded
                        ? 'text-sm font-medium text-destructive'
                        : warning
                          ? 'text-sm font-medium text-warning'
                          : 'text-sm font-medium text-success'
                    }
                  >
                    {state}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${budget.name} consumption`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(100, Math.max(0, percentage))}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={exceeded ? 'h-full bg-destructive' : warning ? 'h-full bg-warning' : 'h-full bg-success'}
                    style={{width: `${Math.min(100, Math.max(0, percentage))}%`}}
                  />
                </div>
                <p className="mt-3 text-sm">
                  {exceeded ? 'No remaining amount' : `${formatCurrency(Math.max(0, budget.budget - spent))} remaining`}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <FeedbackPanel
          kind="empty"
          title={`No budgets for ${formatPeriodLabel(period)}`}
          description="Create a category budget for this month."
        />
      )}
      <IntentObjectPicker
        open={intentMatches.length > 1}
        title="Choose budget to edit"
        options={intentMatches.map(budget => ({
          id: budget.id,
          label: budget.name,
          description: formatCurrency(budget.budget),
        }))}
        onSelect={id => {
          setEditing(intentMatches.find(budget => budget.id === id));
          setIntentMatches([]);
        }}
        onClose={() => setIntentMatches([])}
      />
      <BudgetDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        onSaved={() => refresh('Budget created.')}
      />
      <BudgetDialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(undefined)}
        budget={editing}
        categories={categories}
        onSaved={() => refresh('Budget updated.')}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete budget?"
        description="Transactions and categories stay unchanged; only this period target is removed."
        confirmLabel="Delete budget"
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
