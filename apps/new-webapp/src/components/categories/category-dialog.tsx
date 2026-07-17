'use client';

import type {TCategory} from '@budgetbuddyde/api/category';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {categoryToDraft, saveCategory, type CategoryDraft} from '@/lib/category-mutations';

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: TCategory;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<CategoryDraft>(() => categoryToDraft(category));
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(categoryToDraft(category));
      setError(undefined);
    }
  }, [category, open]);
  const update = <Key extends keyof CategoryDraft>(key: Key, value: CategoryDraft[Key]) =>
    setDraft(current => ({...current, [key]: value}));
  const save = async () => {
    setPending(true);
    const result = await saveCategory(draft, category?.id);
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
      title={category ? 'Edit category' : 'New category'}
      description="Type, color, icon, and budget metadata are shared across transactions and reports."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save category'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Name
          <Input
            aria-label="Category name"
            value={draft.name}
            onChange={event => update('name', event.target.value)}
            maxLength={40}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Type
          <select
            aria-label="Category type"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.type}
            onChange={event => update('type', event.target.value as CategoryDraft['type'])}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="both">Income and expense</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Color
          <Input
            aria-label="Category color"
            type="color"
            value={draft.color}
            onChange={event => update('color', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Icon name
          <Input
            aria-label="Category icon"
            value={draft.icon}
            onChange={event => update('icon', event.target.value)}
            maxLength={32}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Optional monthly target
          <Input
            aria-label="Category budget target"
            inputMode="decimal"
            value={draft.budgetTarget}
            onChange={event => update('budgetTarget', event.target.value)}
            placeholder="0.00"
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            aria-label="Category description"
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
