'use client';

import type {TPaymentMethod} from '@budgetbuddyde/api/paymentMethod';
import {Merge, Pencil, Plus, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {DataTable, type DataColumn} from '@/components/data-table';
import {FeedbackPanel} from '@/components/feedback-panel';
import {IntentObjectPicker} from '@/components/intent-object-picker';
import {Pagination} from '@/components/pagination';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {deletePaymentMethod, inspectPaymentMethodImpact, mergePaymentMethods} from '@/lib/payment-method-mutations';
import {PaymentMethodDialog} from './payment-method-dialog';

export function PaymentMethodWorkspace({
  initialPaymentMethods,
  totalCount,
  search,
  page,
  pageSize,
  initialIntent,
  intentObject,
  error,
}: {
  initialPaymentMethods: TPaymentMethod[];
  totalCount: number;
  search: string;
  page: number;
  pageSize: number;
  initialIntent?: 'create' | 'edit';
  intentObject?: string;
  error?: string;
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialPaymentMethods);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<TPaymentMethod>();
  const [createOpen, setCreateOpen] = useState(false);
  const [intentMatches, setIntentMatches] = useState<TPaymentMethod[]>([]);
  const [deleting, setDeleting] = useState<TPaymentMethod>();
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{kind: 'success' | 'error'; message: string}>();
  useEffect(() => setMethods(initialPaymentMethods), [initialPaymentMethods]);
  useEffect(() => {
    if (initialIntent === 'create') setCreateOpen(true);
    if (initialIntent !== 'edit' || !intentObject) return;
    const normalized = intentObject.toLocaleLowerCase();
    const matches = initialPaymentMethods.filter(method => method.name.toLocaleLowerCase().includes(normalized));
    if (matches.length === 1) setEditing(matches[0]);
    else if (matches.length > 1) setIntentMatches(matches);
    else setStatus({kind: 'error', message: 'No payment method matches this intent.'});
  }, [initialIntent, initialPaymentMethods, intentObject]);
  const navigate = (next: {search?: string; page?: number; pageSize?: number}) => {
    const params = new URLSearchParams();
    const nextSearch = next.search ?? search;
    const nextPage = next.page ?? page;
    const nextPageSize = next.pageSize ?? pageSize;
    if (nextSearch) params.set('search', nextSearch);
    if (nextPage !== 1) params.set('page', String(nextPage));
    if (nextPageSize !== 25) params.set('pageSize', String(nextPageSize));
    router.push(params.size ? `/payment-methods?${params}` : '/payment-methods');
  };
  const refresh = (message: string) => {
    setStatus({kind: 'success', message});
    setSelectedIds([]);
    router.refresh();
  };
  const requestDelete = async (method: TPaymentMethod) => {
    setPending(true);
    const impact = await inspectPaymentMethodImpact(method.id);
    setPending(false);
    if (!impact) {
      setStatus({kind: 'error', message: 'Related data could not be inspected. Nothing was deleted.'});
      return;
    }
    if (impact.transactions || impact.recurringPayments) {
      setStatus({
        kind: 'error',
        message: `${method.name} is used by ${impact.transactions} transaction(s) and ${impact.recurringPayments} recurring payment(s). Merge it instead.`,
      });
      return;
    }
    setDeleting(method);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    setPending(true);
    const success = await deletePaymentMethod(deleting.id);
    setPending(false);
    if (!success) {
      setStatus({kind: 'error', message: 'The payment method is now in use or could not be deleted.'});
      setDeleting(undefined);
      return;
    }
    setMethods(current => current.filter(method => method.id !== deleting.id));
    setDeleting(undefined);
    refresh('Payment method deleted.');
  };
  const merge = async () => {
    if (!mergeTarget || !selectedIds.length) return;
    setPending(true);
    const success = await mergePaymentMethods(
      selectedIds as TPaymentMethod['id'][],
      mergeTarget as TPaymentMethod['id'],
    );
    setPending(false);
    if (!success) {
      setStatus({kind: 'error', message: 'Payment methods could not be merged.'});
      return;
    }
    setMergeOpen(false);
    refresh('Payment methods merged and assignments updated.');
  };
  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Payment methods unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  const columns: DataColumn<TPaymentMethod>[] = [
    {key: 'name', header: 'Name', cell: method => <span className="font-medium">{method.name}</span>},
    {key: 'type', header: 'Type', cell: method => method.type},
    {key: 'provider', header: 'Provider', cell: method => method.provider},
    {key: 'address', header: 'Account reference', cell: method => method.address},
    {
      key: 'status',
      header: 'Status',
      cell: method => (
        <span
          className={
            method.status === 'inactive'
              ? 'rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground'
              : 'rounded-full bg-success/10 px-2 py-1 text-xs'
          }
        >
          {method.status === 'inactive' ? 'Inactive' : 'Active'}
        </span>
      ),
    },
  ];
  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({search: String(new FormData(event.currentTarget).get('search') ?? ''), page: 1});
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Add payment method
        </Button>
        {selectedIds.length ? (
          <Button variant="outline" onClick={() => setMergeOpen(true)}>
            <Merge aria-hidden="true" className="size-4" />
            Merge selected ({selectedIds.length})
          </Button>
        ) : null}
      </div>
      <form onSubmit={submitSearch} className="flex max-w-xl gap-2">
        <input
          aria-label="Search payment methods"
          name="search"
          defaultValue={search}
          className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm"
          placeholder="Search payment methods"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
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
      <div className="hidden md:block">
        <DataTable
          rows={methods}
          columns={columns}
          rowKey={row => row.id}
          emptyTitle="No payment methods match this view"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          rowActions={row => (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" aria-label={`Edit ${row.name}`} onClick={() => setEditing(row)}>
                <Pencil aria-hidden="true" className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${row.name}`}
                disabled={pending}
                onClick={() => requestDelete(row)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-2 md:hidden">
        {methods.length ? (
          methods.map(method => (
            <article key={method.id} className="rounded-lg border bg-card p-4">
              <div className="flex justify-between gap-3">
                <h2 className="font-medium">{method.name}</h2>
                <span>{method.status === 'inactive' ? 'Inactive' : 'Active'}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {method.type} · {method.provider} · {method.address}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(method)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => requestDelete(method)}>
                  Delete
                </Button>
              </div>
            </article>
          ))
        ) : (
          <FeedbackPanel kind="empty" title="No payment methods match this view" compact />
        )}
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={nextPage => navigate({page: nextPage})}
        onPageSizeChange={nextPageSize => navigate({page: 1, pageSize: nextPageSize})}
      />
      <IntentObjectPicker
        open={intentMatches.length > 1}
        title="Choose payment method to edit"
        options={intentMatches.map(method => ({
          id: method.id,
          label: method.name,
          description: method.address ?? undefined,
        }))}
        onSelect={id => {
          setEditing(intentMatches.find(method => method.id === id));
          setIntentMatches([]);
        }}
        onClose={() => setIntentMatches([])}
      />
      <PaymentMethodDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => refresh('Payment method created.')}
      />
      <PaymentMethodDialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(undefined)}
        method={editing}
        onSaved={() => refresh('Payment method updated.')}
      />
      <DialogShell
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        title="Merge payment methods"
        description="Historical and recurring assignments move to the target method."
        footer={
          <>
            <Button variant="outline" onClick={() => setMergeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={merge} disabled={!mergeTarget || pending}>
              Merge payment methods
            </Button>
          </>
        }
      >
        <label className="space-y-2 text-sm font-medium">
          Target payment method
          <select
            aria-label="Target payment method"
            className="block h-9 w-full rounded-md border bg-background px-3"
            value={mergeTarget}
            onChange={event => setMergeTarget(event.target.value)}
          >
            <option value="">Select target</option>
            {methods
              .filter(method => !selectedIds.includes(method.id))
              .map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
          </select>
        </label>
      </DialogShell>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete payment method?"
        description="Only unused methods can be deleted. Historical data remains protected."
        confirmLabel="Delete payment method"
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
