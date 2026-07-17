'use client';

import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {paymentMethodToDraft, savePaymentMethod, type PaymentMethodDraft} from '@/lib/payment-method-mutations';

export function PaymentMethodDialog({
  open,
  onOpenChange,
  method,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method?: TPaymentMethod;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState(() => paymentMethodToDraft(method));
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(paymentMethodToDraft(method));
      setError(undefined);
    }
  }, [method, open]);
  const update = <Key extends keyof PaymentMethodDraft>(key: Key, value: PaymentMethodDraft[Key]) =>
    setDraft(current => ({...current, [key]: value}));
  const save = async () => {
    setPending(true);
    const result = await savePaymentMethod(draft, method?.id);
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
      title={method ? 'Edit payment method' : 'New payment method'}
      description="Inactive methods remain visible in history but are de-emphasized for new transactions."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save payment method'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Name
          <Input
            aria-label="Payment method name"
            value={draft.name}
            onChange={event => update('name', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Type
          <select
            aria-label="Payment method type"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.type}
            onChange={event => update('type', event.target.value as PaymentMethodDraft['type'])}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank account</option>
            <option value="card">Card</option>
            <option value="wallet">Digital wallet</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Status
          <select
            aria-label="Payment method status"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={draft.status}
            onChange={event => update('status', event.target.value as PaymentMethodDraft['status'])}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Provider
          <Input
            aria-label="Payment method provider"
            value={draft.provider}
            onChange={event => update('provider', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          Account reference
          <Input
            aria-label="Payment method address"
            value={draft.address}
            onChange={event => update('address', event.target.value)}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
          Description
          <textarea
            aria-label="Payment method description"
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
