'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import type {TExpandedRecurringPayment} from '@budgetbuddyde/api/recurringPayment';
import {Pause, Pencil, Play, Plus, ReceiptText, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {type FormEvent, useEffect, useState} from 'react';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {DataTable, type DataColumn} from '@/components/data-table';
import {FeedbackPanel} from '@/components/feedback-panel';
import {IntentObjectPicker} from '@/components/intent-object-picker';
import {Pagination} from '@/components/pagination';
import {Button} from '@/components/ui/button';
import {
  deleteRecurringPayment,
  executeRecurringPayment,
  setRecurringPaymentPaused,
} from '@/lib/recurring-payment-mutations';
import {formatDate} from '@/utils/date';
import {formatCurrency} from '@/utils/money';
import {RecurringPaymentDialog} from './recurring-payment-dialog';

export function RecurringPaymentWorkspace({
  initialPayments,
  totalCount,
  categories,
  paymentMethods,
  search,
  statusFilter,
  page,
  pageSize,
  initialIntent,
  intentObject,
  error,
}: {
  initialPayments: TExpandedRecurringPayment[];
  totalCount: number;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  search: string;
  statusFilter: 'all' | 'active' | 'paused';
  page: number;
  pageSize: number;
  initialIntent?: 'create' | 'edit';
  intentObject?: string;
  error?: string;
}) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [editing, setEditing] = useState<TExpandedRecurringPayment>();
  const [createOpen, setCreateOpen] = useState(false);
  const [intentMatches, setIntentMatches] = useState<TExpandedRecurringPayment[]>([]);
  const [deleting, setDeleting] = useState<TExpandedRecurringPayment>();
  const [pendingId, setPendingId] = useState<string>();
  const [status, setStatus] = useState<{kind: 'success' | 'error'; message: string}>();
  useEffect(() => setPayments(initialPayments), [initialPayments]);
  useEffect(() => {
    if (initialIntent === 'create') setCreateOpen(true);
    if (initialIntent !== 'edit' || !intentObject) return;
    const normalized = intentObject.toLocaleLowerCase();
    const matches = initialPayments.filter(payment =>
      `${payment.receiver} ${payment.information ?? ''}`.toLocaleLowerCase().includes(normalized),
    );
    if (matches.length === 1) setEditing(matches[0]);
    else if (matches.length > 1) setIntentMatches(matches);
    else setStatus({kind: 'error', message: 'No recurring payment matches this intent.'});
  }, [initialIntent, initialPayments, intentObject]);
  const navigate = (next: {
    search?: string;
    status?: 'all' | 'active' | 'paused';
    page?: number;
    pageSize?: number;
  }) => {
    const params = new URLSearchParams();
    const values = {
      search: next.search ?? search,
      status: next.status ?? statusFilter,
      page: next.page ?? page,
      pageSize: next.pageSize ?? pageSize,
    };
    if (values.search) params.set('search', values.search);
    if (values.status !== 'all') params.set('status', values.status);
    if (values.page !== 1) params.set('page', String(values.page));
    if (values.pageSize !== 25) params.set('pageSize', String(values.pageSize));
    router.push(params.size ? `/recurring-payments?${params}` : '/recurring-payments');
  };
  const refresh = (message: string) => {
    setStatus({kind: 'success', message});
    router.refresh();
  };
  const togglePaused = async (payment: TExpandedRecurringPayment) => {
    setPendingId(payment.id);
    const success = await setRecurringPaymentPaused(payment, !payment.paused);
    setPendingId(undefined);
    if (!success) {
      setStatus({kind: 'error', message: 'The recurring payment status could not be changed.'});
      return;
    }
    setPayments(current => current.map(item => (item.id === payment.id ? {...item, paused: !item.paused} : item)));
    refresh(payment.paused ? 'Recurring payment resumed.' : 'Recurring payment paused.');
  };
  const execute = async (payment: TExpandedRecurringPayment) => {
    setPendingId(payment.id);
    const success = await executeRecurringPayment(payment.id);
    setPendingId(undefined);
    setStatus(
      success
        ? {kind: 'success', message: 'Transaction created and next execution advanced.'}
        : {kind: 'error', message: 'The recurring payment could not be executed.'},
    );
    if (success) router.refresh();
  };
  const remove = async () => {
    if (!deleting) return;
    setPendingId(deleting.id);
    const success = await deleteRecurringPayment(deleting.id);
    setPendingId(undefined);
    if (!success) {
      setStatus({kind: 'error', message: 'The recurring payment could not be deleted.'});
      setDeleting(undefined);
      return;
    }
    setPayments(current => current.filter(payment => payment.id !== deleting.id));
    setDeleting(undefined);
    refresh('Recurring payment deleted.');
  };
  if (error)
    return (
      <FeedbackPanel
        kind="error"
        title="Recurring payments unavailable"
        description={error}
        action={<Button onClick={() => router.refresh()}>Try again</Button>}
      />
    );
  const columns: DataColumn<TExpandedRecurringPayment>[] = [
    {key: 'receiver', header: 'Receiver', cell: payment => <span className="font-medium">{payment.receiver}</span>},
    {key: 'next', header: 'Next execution', cell: payment => formatDate(payment.nextExecutionAt)},
    {
      key: 'interval',
      header: 'Interval',
      cell: payment => payment.interval[0]?.toUpperCase() + payment.interval.slice(1),
    },
    {key: 'category', header: 'Category', cell: payment => payment.category.name},
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right',
      cell: payment => (
        <span className={payment.transferAmount < 0 ? 'text-destructive' : 'text-success'}>
          {formatCurrency(payment.transferAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: payment =>
        payment.paused ? (
          <span className="rounded-full bg-muted px-2 py-1 text-xs">Paused</span>
        ) : (
          <span className="rounded-full bg-success/10 px-2 py-1 text-xs">Active</span>
        ),
    },
  ];
  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    navigate({
      search: String(data.get('search') ?? ''),
      status: String(data.get('status')) as 'all' | 'active' | 'paused',
      page: 1,
    });
  };
  const actions = (payment: TExpandedRecurringPayment) => (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label={`Edit ${payment.receiver}`} onClick={() => setEditing(payment)}>
        <Pencil aria-hidden="true" className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`${payment.paused ? 'Resume' : 'Pause'} ${payment.receiver}`}
        disabled={pendingId === payment.id}
        onClick={() => togglePaused(payment)}
      >
        {payment.paused ? (
          <Play aria-hidden="true" className="size-4" />
        ) : (
          <Pause aria-hidden="true" className="size-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Execute ${payment.receiver}`}
        disabled={pendingId === payment.id || payment.paused}
        onClick={() => execute(payment)}
      >
        <ReceiptText aria-hidden="true" className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${payment.receiver}`}
        onClick={() => setDeleting(payment)}
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
  return (
    <div className="space-y-4">
      <Button onClick={() => setCreateOpen(true)}>
        <Plus aria-hidden="true" className="size-4" />
        Add recurring payment
      </Button>
      <form onSubmit={submitFilters} className="flex max-w-2xl flex-wrap gap-2">
        <input
          aria-label="Search recurring payments"
          name="search"
          defaultValue={search}
          className="h-9 min-w-48 flex-1 rounded-md border bg-background px-3 text-sm"
          placeholder="Search"
        />
        <select
          aria-label="Recurring status filter"
          name="status"
          defaultValue={statusFilter}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
        <Button type="submit" variant="outline">
          Apply filters
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
          rows={payments}
          columns={columns}
          rowKey={row => row.id}
          emptyTitle="No recurring payments match this view"
          rowActions={actions}
        />
      </div>
      <div className="space-y-2 md:hidden">
        {payments.length ? (
          payments.map(payment => (
            <article key={payment.id} className="rounded-lg border bg-card p-4">
              <div className="flex justify-between gap-3">
                <h2 className="font-medium">{payment.receiver}</h2>
                <strong>{formatCurrency(payment.transferAmount)}</strong>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(payment.nextExecutionAt)} · {payment.interval} · {payment.paused ? 'Paused' : 'Active'}
              </p>
              <div className="mt-3">{actions(payment)}</div>
            </article>
          ))
        ) : (
          <FeedbackPanel kind="empty" title="No recurring payments match this view" compact />
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
        title="Choose recurring payment to edit"
        options={intentMatches.map(payment => ({
          id: payment.id,
          label: payment.receiver,
          description: `${formatCurrency(payment.transferAmount)} · ${payment.interval}`,
        }))}
        onSelect={id => {
          setEditing(intentMatches.find(payment => payment.id === id));
          setIntentMatches([]);
        }}
        onClose={() => setIntentMatches([])}
      />
      <RecurringPaymentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        paymentMethods={paymentMethods}
        onSaved={() => refresh('Recurring payment created.')}
      />
      <RecurringPaymentDialog
        open={Boolean(editing)}
        onOpenChange={open => !open && setEditing(undefined)}
        payment={editing}
        categories={categories}
        paymentMethods={paymentMethods}
        onSaved={() => refresh('Recurring payment updated.')}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Delete recurring payment?"
        description="Future executions stop immediately. Existing transactions remain unchanged."
        confirmLabel="Delete recurring payment"
        pending={Boolean(pendingId)}
        onConfirm={remove}
      />
    </div>
  );
}
