'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {createTransactionDraft} from '@/lib/transaction-form';
import {saveTransactions} from '@/lib/transaction-mutations';
import type {TransactionDraft, TransactionDraftErrors} from '@/types/transaction';
import {TransactionFields} from './transaction-fields';

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: TExpandedTransaction;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  onSaved: () => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  categories,
  paymentMethods,
  onSaved,
}: TransactionDialogProps) {
  const [draft, setDraft] = useState<TransactionDraft>(() => createTransactionDraft(transaction));
  const [errors, setErrors] = useState<TransactionDraftErrors>({});
  const [status, setStatus] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(createTransactionDraft(transaction));
      setErrors({});
      setStatus(undefined);
    }
  }, [open, transaction]);

  const save = async () => {
    setPending(true);
    setStatus(undefined);
    const result = await saveTransactions([draft], categories);
    setPending(false);
    if (result.validationErrors[0]) {
      setErrors(result.validationErrors[0]);
      return;
    }
    if (result.failed) {
      setStatus(`The transaction could not be ${transaction ? 'updated' : 'created'}. Try again.`);
      return;
    }
    onOpenChange(false);
    onSaved();
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={transaction ? 'Edit transaction' : 'New transaction'}
      description="Amounts are stored in euros to two decimal places. Dates use your local calendar day."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? 'Saving…' : 'Save transaction'}
          </Button>
        </>
      }
    >
      <TransactionFields
        idPrefix="transaction"
        value={draft}
        onChange={setDraft}
        categories={categories}
        paymentMethods={paymentMethods}
        errors={errors}
      />
      {status ? (
        <p role="alert" className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {status}
        </p>
      ) : null}
    </DialogShell>
  );
}
