'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedTransaction} from '@budgetbuddyde/api/transaction';
import {Plus, Trash2} from 'lucide-react';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {useDesktopFeature} from '@/hooks/use-desktop-feature';
import {createTransactionDraft} from '@/lib/transaction-form';
import {saveTransactions} from '@/lib/transaction-mutations';
import type {TransactionDraft, TransactionDraftErrors} from '@/types/transaction';
import {TransactionFields} from './transaction-fields';

const EMPTY_TRANSACTIONS: TExpandedTransaction[] = [];

interface BulkTransactionDialogProps {
  mode: 'create' | 'edit';
  transactions?: TExpandedTransaction[];
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  onSaved: () => void;
}

export function BulkTransactionDialog({
  mode,
  transactions,
  categories,
  paymentMethods,
  onSaved,
}: BulkTransactionDialogProps) {
  const supported = useDesktopFeature();
  const transactionList = transactions ?? EMPTY_TRANSACTIONS;
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<TransactionDraft[]>([]);
  const [errors, setErrors] = useState<Record<number, TransactionDraftErrors>>({});
  const [status, setStatus] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDrafts(
      mode === 'edit'
        ? transactionList.map(createTransactionDraft)
        : [createTransactionDraft(), createTransactionDraft()],
    );
    setErrors({});
    setStatus(undefined);
  }, [mode, open, transactionList]);

  if (!supported || (mode === 'edit' && !transactionList.length)) return null;

  const save = async () => {
    setPending(true);
    setStatus(undefined);
    const result = await saveTransactions(drafts, categories);
    setPending(false);
    setErrors(result.validationErrors);
    if (Object.keys(result.validationErrors).length) return;
    if (result.failed) {
      setStatus(`${result.saved} saved; ${result.failed} failed. Review the unchanged rows and try again.`);
      if (result.saved) onSaved();
      return;
    }
    setOpen(false);
    onSaved();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {mode === 'create' ? 'Add multiple' : `Edit selected (${transactionList.length})`}
      </Button>
      <DialogShell
        open={open}
        onOpenChange={setOpen}
        title={mode === 'create' ? 'Add multiple transactions' : 'Edit selected transactions'}
        description="Review all rows, then save the group once. Rows with validation errors are not submitted."
        className="w-[min(80rem,calc(100vw-2rem))]"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? 'Saving…' : `Save ${drafts.length} transactions`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <section key={draft.id ?? `new-${index}`} className="rounded-lg border p-4">
              <header className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">Transaction {index + 1}</h3>
                {mode === 'create' && drafts.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove transaction ${index + 1}`}
                    onClick={() => setDrafts(current => current.filter((_, rowIndex) => rowIndex !== index))}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                ) : null}
              </header>
              <TransactionFields
                idPrefix={`bulk-${index}`}
                value={draft}
                onChange={next =>
                  setDrafts(current => current.map((item, rowIndex) => (rowIndex === index ? next : item)))
                }
                categories={categories}
                paymentMethods={paymentMethods}
                errors={errors[index]}
              />
            </section>
          ))}
          {mode === 'create' ? (
            <Button variant="outline" onClick={() => setDrafts(current => [...current, createTransactionDraft()])}>
              <Plus aria-hidden="true" className="size-4" />
              Add another row
            </Button>
          ) : null}
          {status ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {status}
            </p>
          ) : null}
        </div>
      </DialogShell>
    </>
  );
}
