'use client';

import type {TBudget} from '@budgetbuddyde/api/budget';
import type {TCategoryVH} from '@budgetbuddyde/api/category';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {budgetToDraft, saveBudget, type BudgetDraft} from '@/lib/budget-mutations';

export function BudgetDialog({
  open,
  onOpenChange,
  budget,
  categories,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: TBudget;
  categories: TCategoryVH[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(() => budgetToDraft(budget));
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(budgetToDraft(budget));
      setError(undefined);
    }
  }, [budget, open]);
  const update = <Key extends keyof BudgetDraft>(key: Key, value: BudgetDraft[Key]) =>
    setDraft(current => ({...current, [key]: value}));
  const save = async () => {
    setPending(true);
    const result = await saveBudget(draft, budget?.id);
    setPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onOpenChange(false);
    onSaved();
  };
  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={budget ? 'Edit budget' : 'New budget'}
      description="Budgets are evaluated against transactions in one explicit calendar month."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save budget'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Name
          <Input aria-label="Budget name" value={draft.name} onChange={event => update('name', event.target.value)} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Amount
          <Input
            aria-label="Budget amount"
            inputMode="decimal"
            value={draft.amount}
            onChange={event => update('amount', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Month
          <Input
            aria-label="Budget month"
            type="month"
            value={draft.period}
            onChange={event => update('period', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Direction
          <select
            aria-label="Budget direction"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.type}
            onChange={event => update('type', event.target.value as BudgetDraft['type'])}
          >
            <option value="e">Expense</option>
            <option value="i">Income</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Warning at (%)
          <Input
            aria-label="Budget warning threshold"
            type="number"
            min="1"
            max="100"
            value={draft.warningThreshold}
            onChange={event => update('warningThreshold', event.target.value)}
          />
        </label>
        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-sm font-medium">Categories</legend>
          <div className="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Budget category ${category.name}`}
                  checked={draft.categoryIds.includes(category.id)}
                  onChange={event =>
                    update(
                      'categoryIds',
                      event.target.checked
                        ? [...draft.categoryIds, category.id]
                        : draft.categoryIds.filter(id => id !== category.id),
                    )
                  }
                />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            aria-label="Budget description"
            className="block min-h-20 w-full rounded-md border bg-background px-3 py-2"
            value={draft.description}
            onChange={event => update('description', event.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </DialogShell>
  );
}
