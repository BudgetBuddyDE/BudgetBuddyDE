'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Input} from '@/components/ui/input';
import type {TransactionDraft, TransactionDraftErrors} from '@/types/transaction';

interface TransactionFieldsProps {
  idPrefix: string;
  value: TransactionDraft;
  onChange: (value: TransactionDraft) => void;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  errors?: TransactionDraftErrors;
}

export function TransactionFields({
  idPrefix,
  value,
  onChange,
  categories,
  paymentMethods,
  errors = {},
}: TransactionFieldsProps) {
  const update = <Key extends keyof TransactionDraft>(key: Key, next: TransactionDraft[Key]) =>
    onChange({...value, [key]: next});
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={`${idPrefix}-amount`} label="Amount" error={errors.amount}>
        <Input
          id={`${idPrefix}-amount`}
          inputMode="decimal"
          value={value.amount}
          onChange={event => update('amount', event.target.value)}
          placeholder="0.00"
        />
      </Field>
      <Field id={`${idPrefix}-type`} label="Type">
        <select
          id={`${idPrefix}-type`}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={value.type}
          onChange={event => update('type', event.target.value as TransactionDraft['type'])}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
      </Field>
      <Field id={`${idPrefix}-date`} label="Date" error={errors.date}>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={value.date}
          onChange={event => update('date', event.target.value)}
        />
      </Field>
      <Field id={`${idPrefix}-receiver`} label="Receiver or source" error={errors.receiver}>
        <Input
          id={`${idPrefix}-receiver`}
          value={value.receiver}
          onChange={event => update('receiver', event.target.value)}
          maxLength={100}
        />
      </Field>
      <Field id={`${idPrefix}-category`} label="Category">
        <select
          id={`${idPrefix}-category`}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={value.categoryId}
          onChange={event => update('categoryId', event.target.value)}
        >
          <option value="">Uncategorized</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field id={`${idPrefix}-payment`} label="Payment method" error={errors.paymentMethodId}>
        <select
          id={`${idPrefix}-payment`}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          value={value.paymentMethodId}
          onChange={event => update('paymentMethodId', event.target.value)}
        >
          <option value="">Select a payment method</option>
          {paymentMethods
            .filter(method => method.status === 'active' || method.id === value.paymentMethodId)
            .map(method => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
        </select>
      </Field>
      <Field id={`${idPrefix}-information`} label="Description" className="sm:col-span-2">
        <textarea
          id={`${idPrefix}-information`}
          className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
          value={value.information}
          onChange={event => update('information', event.target.value)}
          maxLength={1000}
        />
      </Field>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
