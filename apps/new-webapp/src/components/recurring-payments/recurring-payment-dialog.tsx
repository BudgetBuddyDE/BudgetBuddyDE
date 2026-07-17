'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {
  recurringPaymentToDraft,
  saveRecurringPayment,
  type RecurringPaymentDraft,
} from '@/lib/recurring-payment-mutations';

export function RecurringPaymentDialog({
  open,
  onOpenChange,
  payment,
  categories,
  paymentMethods,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: TExpandedRecurringPayment;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(() => recurringPaymentToDraft(payment));
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(recurringPaymentToDraft(payment));
      setError(undefined);
    }
  }, [open, payment]);
  const update = <Key extends keyof RecurringPaymentDraft>(key: Key, value: RecurringPaymentDraft[Key]) =>
    setDraft(current => ({...current, [key]: value}));
  const save = async () => {
    setPending(true);
    const result = await saveRecurringPayment(draft, payment?.id);
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
      title={payment ? 'Edit recurring payment' : 'New recurring payment'}
      description="The next date advances by the selected interval after execution. Calendar days are clamped for shorter months."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save recurring payment'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          Amount
          <Input
            aria-label="Recurring amount"
            inputMode="decimal"
            value={draft.amount}
            onChange={event => update('amount', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Type
          <select
            aria-label="Recurring type"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.type}
            onChange={event => update('type', event.target.value as RecurringPaymentDraft['type'])}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Next execution
          <Input
            aria-label="Next execution date"
            type="date"
            value={draft.nextExecutionAt}
            onChange={event => update('nextExecutionAt', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Interval
          <select
            aria-label="Recurring interval"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.interval}
            onChange={event => update('interval', event.target.value as RecurringPaymentDraft['interval'])}
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Category
          <select
            aria-label="Recurring category"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.categoryId}
            onChange={event => update('categoryId', event.target.value)}
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Payment method
          <select
            aria-label="Recurring payment method"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.paymentMethodId}
            onChange={event => update('paymentMethodId', event.target.value)}
          >
            <option value="">Select payment method</option>
            {paymentMethods
              .filter(method => method.status === 'active' || method.id === draft.paymentMethodId)
              .map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Receiver or source
          <Input
            aria-label="Recurring receiver"
            value={draft.receiver}
            onChange={event => update('receiver', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            aria-label="Recurring description"
            className="block min-h-20 w-full rounded-md border bg-background px-3 py-2"
            value={draft.information}
            onChange={event => update('information', event.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            aria-label="Pause this payment"
            type="checkbox"
            checked={draft.paused}
            onChange={event => update('paused', event.target.checked)}
          />
          Paused
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
